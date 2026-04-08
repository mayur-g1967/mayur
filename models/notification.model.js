import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["reminder", "info", "warning", "success"],
      default: "info",
    },
    module: {
      type: String,
      default: "General",
    },
    read: {
      type: Boolean,
      default: false,
    },
    reminderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reminder",
    },
  },
  {
    timestamps: true,
    collection: "Notifications",
  }
);

const UserDB = mongoose.connection.useDb("User");
export default UserDB.models.Notification || UserDB.model("Notification", NotificationSchema);