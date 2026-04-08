import mongoose from "mongoose";

const ReminderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // Now required for user-specific reminders
      index: true, // Add index for faster queries
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    module: {
      type: String,
      default: "General",
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "upcoming"],
      default: "pending",
    },
    date: {
      type: Date,
      required: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      enum: ["user", "system_streak", "system_incomplete"],
      default: "user",
    },
    actionUrl: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "Reminders",
  },
);

// Index for efficient querying
ReminderSchema.index({ userId: 1, date: 1 });
ReminderSchema.index({ userId: 1, status: 1 });

// Virtual for checking if reminder is overdue
ReminderSchema.virtual('isOverdue').get(function () {
  return this.status !== 'completed' && new Date() > this.date;
});

// Method to mark reminder as completed
ReminderSchema.methods.markAsCompleted = function () {
  this.status = 'completed';
  this.completedAt = new Date();
  return this.save();
};

// Method to soft delete reminder
ReminderSchema.methods.softDelete = function () {
  this.isDeleted = true;
  return this.save();
};

// Static method to get user's reminders
ReminderSchema.statics.getUserReminders = function (userId) {
  return this.find({
    userId,
    isDeleted: false
  }).sort({ date: 1 });
};

// Static method to get user's pending reminders
ReminderSchema.statics.getUserPendingReminders = function (userId) {
  return this.find({
    userId,
    status: 'pending',
    isDeleted: false
  }).sort({ date: 1 });
};

// Static method to get user's upcoming reminders (next 7 days)
ReminderSchema.statics.getUserUpcomingReminders = function (userId) {
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);

  return this.find({
    userId,
    status: { $ne: 'completed' },
    date: { $gte: today, $lte: nextWeek },
    isDeleted: false
  }).sort({ date: 1 });
};

// Ensure virtual fields are included in JSON
ReminderSchema.set('toJSON', { virtuals: true });
ReminderSchema.set('toObject', { virtuals: true });

const UserDB = mongoose.connection.useDb("User");

export default UserDB.models.Reminder || UserDB.model("Reminder", ReminderSchema);