// This is in app/scripts/reminder-cron.js

import "dotenv/config";
import cron from "node-cron";
import { runReminderJob } from "../services/reminders/ReminderRunner.js";

console.log("⏰ Reminder cron service started");

cron.schedule("* * * * *", async () => {
  console.log(
    `[ReminderCron] Tick at ${new Date().toLocaleTimeString()}`
  );

  try {
    await runReminderJob();
  } catch (err) {
    console.error("[ReminderCron] Error:", err);
  }
});
