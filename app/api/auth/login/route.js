import { NextResponse } from "next/server";
import User from "@/models/User";
import Joi from "joi";
import bcrypt from "bcrypt";
import connectDB from "../../../../lib/db";

export async function POST(req) {
  try {
    console.log("🔹 Starting auth request...");
    await connectDB();
    console.log("✅ DB connected");
    
    const body = await req.json();
    console.log("📧 Email:", body.email);
    
    const { error } = validate(body);
    if (error) {
      console.log("❌ Validation error:", error.details[0].message);
      return NextResponse.json({ message: error.details[0].message }, { status: 400 });
    }

    const user = await User.findOne({ email: body.email });
    console.log("👤 User found:", !!user);
    
    if (!user) {
      return NextResponse.json({ message: "Invalid Email or Password" }, { status: 401 });
    }

    if (user.fromGoogle && !user.password) {
      return NextResponse.json({ message: "This account uses Google Sign-In" }, { status: 400 });
    }

    const validPassword = await bcrypt.compare(body.password, user.password);
    console.log("🔐 Password valid:", validPassword);
    
    if (!validPassword) {
      return NextResponse.json({ message: "Invalid Email or Password" }, { status: 401 });
    }

    const token = user.generateAuthToken();
    console.log("🎫 Token generated");
    
    return NextResponse.json({
      data: token,
      message: "Login successful",
      user: { email: user.email, name: user.name, picture: user.picture }
    });
  } catch (error) {
    console.error("❌ Login error:", error); // This will show the real error
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

const validate = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });
  return schema.validate(data);
};