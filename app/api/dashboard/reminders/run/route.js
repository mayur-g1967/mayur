// This is in app/api/dashboard/reminders/run/route.js

import connectDB from "@/lib/db";
import { sendInAppNotification } from "@/lib/notifications";

export async function GET() {
  const db = await connectDB();
  const now = new Date();

  const reminders = await db
    .collection("reminders")
    .find({
      date: { $lte: now },
      status: "pending",
    })
    .toArray();

  for (const reminder of reminders) {
    await sendInAppNotification({
      userId: reminder.userId,
      message: `⏰ ${reminder.title}`,
      module: reminder.module,
    });

    await db
      .collection("reminders")
      .updateOne(
        { _id: reminder._id },
        { $set: { status: "sent", sentAt: new Date() } },
      );
  }

  return Response.json({ triggered: reminders.length });
}
