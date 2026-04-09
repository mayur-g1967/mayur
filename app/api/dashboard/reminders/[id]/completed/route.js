// This is app/api/dashboard/reminders/[id]/completed/route.js

import { completeReminder } from "@/services/reminders/reminder.service";
import connectDB from "@/lib/db.js";
import { authenticate } from "@/lib/auth";
import { NextResponse } from "next/server";

// Mark a reminder as completed
export async function PATCH(req, { params }) {
  try {
    await connectDB();
    
    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    
    console.log('Completing reminder:', id, 'for user:', user._id);
    
    const reminder = await completeReminder(id, user._id.toString());
    
    return NextResponse.json(
      { success: true, data: reminder, message: 'Reminder marked as completed' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in PATCH /api/reminders/[id]/complete:', error);
    
    if (error.message === 'Reminder not found') {
      return NextResponse.json(
        { success: false, error: 'Reminder not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}