import { NextResponse } from "next/server";
import { User } from "@/models/User";
import nodemailer from "nodemailer";
import connectDB from "@/lib/db";

export async function POST(req) {
  try {
    await connectDB();
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (user.fromGoogle && !user.password) {
      return NextResponse.json({ message: "This account uses Google Sign-In" }, { status: 400 });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.resetOTP = otp;
    user.resetOTPExpiry = Date.now() + 10 * 60 * 1000;
    await user.save();

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    await transporter.sendMail({
      from: `"PersonaAI Support" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `Reset your PersonaAI password: ${otp}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; padding: 40px 0;">
          <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #9067c6 0%, #df58cd 100%); padding: 35px; text-align: center;">
               <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">PersonaAI</h1>
            </div>
            <div style="padding: 40px 30px; text-align: center;">
              <h2 style="color: #111827; margin-top: 0; font-size: 22px; font-weight: 700;">Account Recovery</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                Hello,<br>We received a request to reset your password. Use the verification code below to complete the process.
              </p>
              
              <div style="background: linear-gradient(135deg, rgba(144, 103, 198, 0.05) 0%, rgba(223, 88, 205, 0.05) 100%); border: 2px dashed #9067c6; border-radius: 12px; padding: 30px; margin-bottom: 30px;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #9067c6; display: block;">${otp}</span>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">
                This code is valid for <strong>10 minutes</strong>. 
                <br>For security, please do not share this code with anyone.
              </p>
            </div>
            <div style="background-color: #f9fafb; padding: 25px; text-align: center; border-top: 1px solid #f3f4f6;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                If you didn't request this reset, you can safely ignore this email.
              </p>
              <div style="margin-top: 15px; border-top: 1px solid #f3f4f6; padding-top: 15px;">
                <p style="color: #9ca3af; font-size: 11px; margin: 0;">
                  © ${new Date().getFullYear()} PersonaAI Platform. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}