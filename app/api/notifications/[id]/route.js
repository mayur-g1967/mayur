import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { markNotificationAsRead } from "@/lib/notifications";
import connectDB from "@/lib/db";

// Mark single notification as read
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

    const { id } = await params;
    const notification = await markNotificationAsRead(id, user._id.toString());

    if (!notification) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: notification },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Delete single notification
export async function DELETE(req, { params }) {
  try {
    await connectDB();

    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { deleteNotification } = await import("@/lib/notifications");
    const notification = await deleteNotification(id, user._id.toString());

    if (!notification) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Notification deleted' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}