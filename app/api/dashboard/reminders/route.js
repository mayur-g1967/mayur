// This is app/api/dashboard/reminders/route.js

import {
  createReminder,
  getUserReminders,
} from "@/services/reminders/reminder.service";
import connectDB from "@/lib/db.js";
import { authenticate } from "@/lib/auth";
import { NextResponse } from "next/server";
import { startReminderCron } from "@/lib/cron";
import ActiveQuizSession from "@/models/ActiveQuizSession";
import UserAttempt from "@/models/UserAttempt";
import mongoose from "mongoose";

startReminderCron();

// Create a new reminder for the authenticated user
export async function POST(req) {
  try {
    // Connect to database
    await connectDB();

    // Authenticate user
    const user = await authenticate(req);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Parse request body
    const body = await req.json();

    console.log("Creating reminder for user:", user._id);
    console.log("Reminder data:", body);

    // Validate required fields
    if (!body.title || !body.date) {
      return NextResponse.json(
        { success: false, error: "Title and date are required" },
        { status: 400 },
      );
    }

    // Add userId to the reminder data
    const reminderData = {
      ...body,
      userId: user._id.toString(),
    };

    // Create reminder
    const reminder = await createReminder(reminderData);

    console.log("Reminder created successfully:", reminder);

    return NextResponse.json(
      { success: true, data: reminder },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error in POST /api/reminders:", error);

    // Handle authentication errors
    if (
      error.message === "No token provided" ||
      error.message === "Authentication failed"
    ) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create reminder",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}

// Get all reminders for the authenticated user
export async function GET(req) {
  try {
    await connectDB();

    // Authenticate user
    const user = await authenticate(req);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    console.log("Fetching reminders for user:", user._id);

    // Get reminders for this user only
    const reminders = await getUserReminders(user._id.toString());

    return NextResponse.json(
      { success: true, data: reminders },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in GET /api/reminders:", error);

    // Handle authentication errors
    if (
      error.message === "No token provided" ||
      error.message === "Authentication failed"
    ) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
