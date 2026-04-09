// This is in app/services/reminders/ReminderRunner.js

import connectDB from "../../lib/db.js";
import Reminder from "../../models/reminder.model.js";
import { sendInAppNotification } from "../../lib/notifications.js";

export async function runReminderJob() {
  await connectDB();

  const now = new Date();

  const reminders = await Reminder.find({
    date: { $lte: now },
    status: "pending",
    isDeleted: false,
  });

  console.log(`🔔 Found ${reminders.length} due reminder(s)`);

  for (const reminder of reminders) {
    try {
      // Send notification
      await sendInAppNotification({
        userId: reminder.userId,
        title: "Reminder",
        message: `⏰ ${reminder.title}`,
        module: reminder.module,
        type: "reminder",
        reminderId: reminder._id,
      });

      // Mark as completed
      reminder.status = "completed";
      reminder.completedAt = new Date();
      await reminder.save();
      
      console.log(`✅ Triggered: "${reminder.title}" for user ${reminder.userId}`);
    } catch (error) {
      console.error(`❌ Failed to process reminder ${reminder._id}:`, error);
    }
  }

  console.log(`[ReminderJob] Completed ${reminders.length} reminder(s)`);
  
  return { triggered: reminders.length };
}