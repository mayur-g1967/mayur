import { NextResponse } from "next/server";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";

export async function POST(req) {
  try {
    console.log("Verify OTP: Start");
    await connectDB();
    console.log("Verify OTP: DB Connected");

    const { email, otp, newPassword } = await req.json();
    console.log("Verify OTP: Input for", email, "OTP:", otp);

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ message: "All fields required" }, { status: 400 });
    }

    const user = await User.findOne({ email });
    console.log("Verify OTP: DB OTP:", user?.resetOTP, "Expiry:", user?.resetOTPExpiry);

    if (!user || String(user.resetOTP) !== String(otp) || Date.now() > user.resetOTPExpiry) {
      console.log("Verify OTP: Check failed");
      return NextResponse.json({ message: "Invalid or expired OTP" }, { status: 400 });
    }

    // Check if new password is the same as current password
    console.log("Verify OTP: Comparing new password with current...");
    const isSamePassword = await user.comparePassword(newPassword);
    console.log("Verify OTP: Is same password?", isSamePassword);

    if (isSamePassword) {
      console.log("Verify OTP: User tried to use current password");
      return NextResponse.json(
        { message: "New password cannot be the same as your current password" },
        { status: 400 }
      );
    }

    console.log("Verify OTP: Match successful. Updating password...");
    // We set the password directly and let the User model's pre-save middleware handle the hashing
    // This prevents double-hashing if we hashed it here and then called save()
    user.password = newPassword;
    user.resetOTP = undefined;
    user.resetOTPExpiry = undefined;
    await user.save();
    console.log("Verify OTP: Success");

    return NextResponse.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}