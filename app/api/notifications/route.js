import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { getUserNotifications, markAllAsRead } from "@/lib/notifications";
import connectDB from "@/lib/db";

// Get user notifications
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

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const notifications = await getUserNotifications(user._id.toString(), unreadOnly);

    return NextResponse.json(
      { success: true, data: notifications },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Mark all as read
export async function PATCH(req) {
  try {
    await connectDB();

    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await markAllAsRead(user._id.toString());

    return NextResponse.json(
      { success: true, message: 'All notifications marked as read' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Delete all notifications
export async function DELETE(req) {
  try {
    await connectDB();

    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { deleteAllNotifications } = await import("@/lib/notifications");
    await deleteAllNotifications(user._id.toString());

    return NextResponse.json(
      { success: true, message: 'All notifications deleted' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting notifications:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}