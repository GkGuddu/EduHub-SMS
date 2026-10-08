import { Request, Response } from 'express';
import { Notification } from '../models';

export async function getMyNotifications(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false,
    });

    res.json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch notifications' });
  }
}

export async function markAsRead(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    if (id === 'all') {
      await Notification.updateMany(
        { userId, isRead: false },
        { isRead: true }
      );
    } else {
      await Notification.findOneAndUpdate(
        { _id: id, userId },
        { isRead: true }
      );
    }

    res.json({ success: true, message: 'Notifications marked as read' });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to update notification' });
  }
}
