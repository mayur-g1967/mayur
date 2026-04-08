// This is app/api/dashboard/reminders/[id]/route.js

import {
  getReminderById,
  updateReminder,
  completeReminder,
  deleteReminder,
} from "@/services/reminders/reminder.service";
import connectDB from "@/lib/db.js";
import { authenticate } from "@/lib/auth";
import { NextResponse } from "next/server";

// Get a specific reminder
export async function GET(req, { params }) {
  try {
    await connectDB();

    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = params;
    const reminder = await getReminderById(id, user._id.toString());

    if (!reminder) {
      return NextResponse.json(
        { success: false, error: "Reminder not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: true, data: reminder },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in GET /api/reminders/[id]:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// Update a specific reminder
export async function PATCH(req, { params }) {
  try {
    await connectDB();

    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = await req.json();

    console.log("Updating reminder:", id, "for user:", user._id);
    console.log("🔍 Update attempt:");
    console.log("Reminder ID:", id);
    console.log("User ID from token:", user._id.toString());
    console.log("User ID type:", typeof user._id);

    const reminder = await updateReminder(id, user._id.toString(), body);

    return NextResponse.json(
      { success: true, data: reminder },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in PATCH /api/reminders/[id]:", error);

    if (error.message === "Reminder not found") {
      return NextResponse.json(
        { success: false, error: "Reminder not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// Delete a specific reminder (soft delete)
export async function DELETE(req, { params }) {
  try {
    await connectDB();

    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;

    console.log("Deleting reminder:", id, "for user:", user._id);

    const reminder = await deleteReminder(id, user._id.toString());

    return NextResponse.json(
      {
        success: true,
        data: reminder,
        message: "Reminder deleted successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in DELETE /api/reminders/[id]:", error);

    if (error.message === "Reminder not found") {
      return NextResponse.json(
        { success: false, error: "Reminder not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
