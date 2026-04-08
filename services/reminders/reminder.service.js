// This is app/services/reminders/reminder.service.js

import Reminder from "@/models/reminder.model";

/**
 * Create a new reminder for a user
 * @param {Object} reminderData - The reminder data including userId
 * @returns {Promise<Object>} The created reminder
 */
export async function createReminder(reminderData) {
  try {
    const reminder = new Reminder(reminderData);
    await reminder.save();
    return reminder;
  } catch (error) {
    console.error("Error creating reminder:", error);
    throw error;
  }
}

/**
 * Get all reminders for a specific user
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} Array of user's reminders
 */
export async function getUserReminders(userId) {
  try {
    return await Reminder.getUserReminders(userId);
  } catch (error) {
    console.error("Error fetching user reminders:", error);
    throw error;
  }
}

/**
 * Get pending reminders for a specific user
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} Array of user's pending reminders
 */
export async function getUserPendingReminders(userId) {
  try {
    return await Reminder.getUserPendingReminders(userId);
  } catch (error) {
    console.error("Error fetching user pending reminders:", error);
    throw error;
  }
}

/**
 * Get upcoming reminders for a specific user (next 7 days)
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} Array of user's upcoming reminders
 */
export async function getUserUpcomingReminders(userId) {
  try {
    return await Reminder.getUserUpcomingReminders(userId);
  } catch (error) {
    console.error("Error fetching user upcoming reminders:", error);
    throw error;
  }
}

/**
 * Get a single reminder by ID (with user verification)
 * @param {string} reminderId - The reminder ID
 * @param {string} userId - The user ID
 * @returns {Promise<Object|null>} The reminder or null
 */
export async function getReminderById(reminderId, userId) {
  try {
    return await Reminder.findOne({
      _id: reminderId,
      userId,
      isDeleted: false,
    });
  } catch (error) {
    console.error("Error fetching reminder by ID:", error);
    throw error;
  }
}

/**
 * Update a reminder (with user verification)
 * @param {string} reminderId - The reminder ID
 * @param {string} userId - The user ID
 * @param {Object} updateData - The data to update
 * @returns {Promise<Object|null>} The updated reminder or null
 */
export async function updateReminder(reminderId, userId, updateData) {
  try {
    const reminder = await Reminder.findOne({
      _id: reminderId,
      userId,
      isDeleted: false,
    });

    if (!reminder) {
      throw new Error("Reminder not found");
    }

    if (updateData.date) {
      const newDate = new Date(updateData.date);
      const now = new Date();

      if (newDate > now && reminder.status === "completed") {
        updateData.status = "pending";
        updateData.completedAt = null;
        console.log(
          `🔄 Resetting completed reminder to pending (new date: ${newDate})`,
        );
      }
    }

    Object.assign(reminder, updateData);
    await reminder.save();
    return reminder;
  } catch (error) {
    console.error("Error updating reminder:", error);
    throw error;
  }
}

/**
 * Mark a reminder as completed (with user verification)
 * @param {string} reminderId - The reminder ID
 * @param {string} userId - The user ID
 * @returns {Promise<Object|null>} The updated reminder or null
 */
export async function completeReminder(reminderId, userId) {
  try {
    const reminder = await Reminder.findOne({
      _id: reminderId,
      userId,
      isDeleted: false,
    });

    if (!reminder) {
      throw new Error("Reminder not found");
    }

    return await reminder.markAsCompleted();
  } catch (error) {
    console.error("Error completing reminder:", error);
    throw error;
  }
}

/**
 * Soft delete a reminder (with user verification)
 * @param {string} reminderId - The reminder ID
 * @param {string} userId - The user ID
 * @returns {Promise<Object|null>} The deleted reminder or null
 */
export async function deleteReminder(reminderId, userId) {
  try {
    const reminder = await Reminder.findOne({
      _id: reminderId,
      userId,
    });

    if (!reminder) {
      throw new Error("Reminder not found");
    }

    return await reminder.softDelete();
  } catch (error) {
    console.error("Error deleting reminder:", error);
    throw error;
  }
}

/**
 * Permanently delete a reminder (with user verification)
 * @param {string} reminderId - The reminder ID
 * @param {string} userId - The user ID
 * @returns {Promise<Object|null>} The deletion result
 */
export async function permanentlyDeleteReminder(reminderId, userId) {
  try {
    return await Reminder.findOneAndDelete({
      _id: reminderId,
      userId,
    });
  } catch (error) {
    console.error("Error permanently deleting reminder:", error);
    throw error;
  }
}

/**
 * Get reminder statistics for a user
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} Reminder statistics
 */
export async function getReminderStats(userId) {
  try {
    const total = await Reminder.countDocuments({ userId, isDeleted: false });
    const pending = await Reminder.countDocuments({
      userId,
      status: "pending",
      isDeleted: false,
    });
    const completed = await Reminder.countDocuments({
      userId,
      status: "completed",
      isDeleted: false,
    });
    const overdue = await Reminder.countDocuments({
      userId,
      status: "pending",
      date: { $lt: new Date() },
      isDeleted: false,
    });

    return {
      total,
      pending,
      completed,
      overdue,
    };
  } catch (error) {
    console.error("Error fetching reminder stats:", error);
    throw error;
  }
}
    