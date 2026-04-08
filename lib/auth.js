// This is app/lib/auth.js

import jwt from "jsonwebtoken";
import { User } from "@/models/User";
import connectDB from "@/lib/db";

export async function authenticate(req) {
  await connectDB();

  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    throw new Error("No token provided");
  }

  if (!process.env.JWT_SECRET) {
    console.error("❌ JWT_SECRET is not defined in environment variables!");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("🔍 Decoded token:", decoded); // ✅ Add this

    // Try both 'id' and 'userId' for backwards compatibility
    const userId = decoded.userId || decoded.id;

    if (!userId) {
      throw new Error("Invalid token format");
    }

    const user = await User.findById(userId).select("-password");

    if (!user || !user.isActive) {
      throw new Error("Invalid user");
    }

    return user;
  } catch (error) {
    console.error("Auth error:", error.message);
    throw new Error(`Authentication failed: ${error.message}`);
  }
}
