import { NextResponse } from "next/server";
import User from "@/models/User";
import Joi from "joi";
import connectDB from "@/lib/db";

export async function POST(req) {
  try {
    console.log("📝 Starting registration request...");
    await connectDB();
    console.log("✅ DB connected");

    const body = await req.json();
    console.log("📧 Email:", body.email);
    console.log("👤 Username:", body.username);

    // Validate input
    const { error } = validate(body);
    if (error) {
      console.log("❌ Validation error:", error.details[0].message);
      return NextResponse.json(
        { message: error.details[0].message },
        { status: 400 },
      );
    }

    // Check if user already exists (including Google users)
    const existingUser = await User.findOne({ email: body.email });
    if (existingUser) {
      if (existingUser.fromGoogle) {
        return NextResponse.json(
          {
            message:
              "This email is registered with Google. Please use Google Sign In.",
          },
          { status: 409 },
        );
      }
      return NextResponse.json(
        {
          message: "User with this email already exists",
        },
        { status: 409 },
      );
    }

    // Check if username already exists (case-insensitive)
    const username = body.username.toLowerCase();
    const existingUsername = await User.findOne({ 
      username: { $regex: new RegExp(`^${username}$`, 'i') } 
    });
    if (existingUsername) {
      return NextResponse.json(
        {
          message: "This username is already taken. Please choose another one.",
        },
        { status: 409 },
      );
    }

    // Create new user
    const newUser = new User({
      username,
      email: body.email,
      password: body.password, // Will be hashed automatically by pre-save middleware
      firstName: body.firstName,
      lastName: body.lastName,
      fromGoogle: false,
      isVerified: false,
      isActive: true,
    });

    await newUser.save();
    console.log("✅ User created successfully");
    console.log("✅ Saved user ID:", newUser._id);
    console.log("✅ Username:", newUser.username);

    // Generate token
    const token = newUser.generateAuthToken();

    return NextResponse.json(
      {
        data: token,
        token: token, // Include both for compatibility
        message: "Account created successfully",
        user: {
          email: newUser.email,
          name: `${newUser.firstName} ${newUser.lastName}`,
          username: newUser.username,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("❌ Registration error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

const validate = (data) => {
  const schema = Joi.object({
    username: Joi.string()
      .min(3)
      .max(20)
      .pattern(/^[a-zA-Z0-9_]+$/)
      .required()
      .label("Username")
      .messages({
        'string.pattern.base': 'Username can only contain letters, numbers, and underscores',
      }),
    firstName: Joi.string().min(2).max(50).required().label("First name"),
    lastName: Joi.string().min(2).max(50).required().label("Last name"),
    email: Joi.string().email().required().label("Email"),
    password: Joi.string().min(6).max(100).required().label("Password"),
  });
  return schema.validate(data);
};