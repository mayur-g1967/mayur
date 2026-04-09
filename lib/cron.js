// lib/cron.js
import cron from "node-cron";
import { runReminderJob } from "../services/reminders/ReminderRunner.js";

let isRunning = false;

export function startReminderCron() {
  if (isRunning) {
    console.log("⏭️ Cron already running, skipping...");
    return;
  }
  
  isRunning = true;

  cron.schedule("* * * * *", async () => {
    try {
      await runReminderJob();
    } catch (err) {
      console.error("[ReminderCron] Error:", err);
    }
  });

  console.log("⏰ Reminder cron started (runs every minute)");
}

// Auto-start when module loads on server
if (typeof window === 'undefined') {
  startReminderCron();
}