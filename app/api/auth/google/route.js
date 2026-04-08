import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import connectDB from '@/lib/db';

export async function POST(req) {
  try {
    await connectDB();
    
    const body = await req.json();
    console.log("📧 Google login attempt:", body.email);

    // Find user by email OR googleId
    let user = await User.findOne({ 
      $or: [
        { email: body.email },
        { googleId: body.googleId }
      ]
    });

    if (user) {
      // Update existing user with Google info if missing
      if (!user.googleId) {
        user.googleId = body.googleId;
        user.picture = body.picture;
        user.fromGoogle = true;
        user.isVerified = true;
        await user.save();
        console.log("✅ Updated existing user with Google data");
      }
    } else {
      // Create new Google user
      const username = body.email.split('@')[0].toLowerCase();
      let finalUsername = username;
      let counter = 1;
      
      while (await User.findOne({ username: finalUsername })) {
        finalUsername = `${username}${counter}`;
        counter++;
      }

      const nameParts = (body.name || '').split(' ');
      
      user = new User({
        username: finalUsername,
        email: body.email,
        firstName: nameParts[0] || 'User',
        lastName: nameParts.slice(1).join(' ') || '',
        picture: body.picture,
        googleId: body.googleId,
        fromGoogle: true,
        isVerified: true,
        isActive: true,
        password: Math.random().toString(36).slice(-8)
      });

      await user.save();
      console.log("✅ New Google user created:", user._id);
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      success: true,
      data: token,
      user: { 
        id: user._id,
        email: user.email, 
        name: `${user.firstName} ${user.lastName}`,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        picture: user.picture
      }
    }, { status: 200 });

  } catch (err) {
    console.error("❌ Google auth error:", err);
    return NextResponse.json({ 
      message: err.message
    }, { status: 500 });
  }
}