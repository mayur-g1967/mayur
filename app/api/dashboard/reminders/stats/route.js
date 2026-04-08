// This is app/api/dashboard/reminders/stats/route.js

import { getReminderStats } from "@/services/reminders/reminder.service";
import connectDB from "@/lib/db";
import { authenticate } from "@/lib/auth";
import { NextResponse } from "next/server";

// Get reminder statistics for the authenticated user
export async function GET(req) {
  try {
    await connectDB();
    
    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Fetching reminder stats for user:', user._id);
    
    const stats = await getReminderStats(user._id.toString());
    
    return NextResponse.json(
      { success: true, data: stats },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/reminders/stats:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}