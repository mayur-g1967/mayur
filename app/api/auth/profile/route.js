import { NextResponse } from "next/server";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/db";

function getUserIdFromRequest(req) {
    try {
        const authHeader = req.headers.get("authorization") || "";
        const token = authHeader.replace("Bearer ", "").trim();
        if (!token) return null;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded.userId;
    } catch {
        return null;
    }
}

// GET /api/auth/profile — fetch current user's profile
export async function GET(req) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const user = await User.findById(userId).select(
            "firstName lastName username email picture profile"
        );

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            user: {
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                email: user.email,
                picture: user.picture || "",
                bio: user.profile?.bio || "",
            },
        });
    } catch (error) {
        console.error("Profile GET error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

// PUT /api/auth/profile — update current user's profile
export async function PUT(req) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { firstName, lastName, username, bio, picture } = body;

        await connectDB();

        // Check username uniqueness (if changed)
        if (username) {
            const existing = await User.findOne({ username, _id: { $ne: userId } });
            if (existing) {
                return NextResponse.json(
                    { message: "Username already taken" },
                    { status: 409 }
                );
            }
        }

        const updated = await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    ...(firstName && { firstName }),
                    ...(lastName && { lastName }),
                    ...(username && { username }),
                    ...(picture !== undefined && { picture }),
                    "profile.bio": bio || "",
                    "profile.firstName": firstName,
                    "profile.lastName": lastName,
                    "profile.avatar": picture || "",
                    updatedAt: new Date(),
                },
            },
            { new: true }
        ).select("firstName lastName username email picture profile");

        return NextResponse.json({
            success: true,
            message: "Profile updated successfully",
            user: {
                firstName: updated.firstName,
                lastName: updated.lastName,
                name: `${updated.firstName} ${updated.lastName}`.trim(),
                username: updated.username,
                email: updated.email,
                picture: updated.picture || "",
                bio: updated.profile?.bio || "",
            },
        });
    } catch (error) {
        console.error("Profile PUT error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
