import Notification from "@/models/notification.model";

export async function sendInAppNotification({ userId, title, message, module, type = "reminder", reminderId }) {
  try {
    const notification = new Notification({
      userId,
      title,
      message,
      module,
      type,
      reminderId,
    });

    await notification.save();
    console.log(`📬 Notification sent to user ${userId}: ${message}`);

    return notification;
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
}

export async function getUserNotifications(userId, unreadOnly = false) {
  try {
    const query = { userId };
    if (unreadOnly) {
      query.read = false;
    }

    return await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
}

export async function markNotificationAsRead(notificationId, userId) {
  try {
    return await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { read: true },
      { new: true }
    );
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
}

export async function markAllAsRead(userId) {
  try {
    return await Notification.updateMany(
      { userId, read: false },
      { read: true }
    );
  } catch (error) {
    console.error("Error marking all as read:", error);
    throw error;
  }
}

export async function deleteNotification(notificationId, userId) {
  try {
    return await Notification.findOneAndDelete({ _id: notificationId, userId });
  } catch (error) {
    console.error("Error deleting notification:", error);
    throw error;
  }
}

export async function deleteAllNotifications(userId) {
  try {
    return await Notification.deleteMany({ userId });
  } catch (error) {
    console.error("Error deleting all notifications:", error);
    throw error;
  }
}