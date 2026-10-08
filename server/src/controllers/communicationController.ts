import { Request, Response } from 'express';
import { Conversation, ChatMessage, User } from '../models';
import {
  ConversationCreateSchema,
  ChatMessageCreateSchema,
} from '@eduhub/shared';
import { emitToConversation, emitToUser } from '../sockets';

export async function getConversations(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const userId = req.user!.userId;

    const conversations = await Conversation.find({
      schoolId,
      participantIds: userId,
    })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .lean();

    const formatted = await Promise.all(
      conversations.map(async (conv: any) => {
        const unreadCount = await ChatMessage.countDocuments({
          schoolId,
          conversationId: conv._id,
          senderId: { $ne: userId },
          readBy: { $ne: userId },
        });

        const otherParticipants = conv.participants?.filter(
          (p: any) => p.userId?.toString() !== userId.toString()
        );

        const title =
          conv.title ||
          otherParticipants?.map((p: any) => p.name).join(', ') ||
          'Conversation';

        return {
          _id: conv._id,
          schoolId: conv.schoolId,
          type: conv.type,
          title,
          participantIds: conv.participantIds,
          participants: conv.participants,
          otherParticipant: otherParticipants?.[0] || null,
          lastMessage: conv.lastMessage,
          lastMessageAt: conv.lastMessageAt
            ? conv.lastMessageAt.toISOString()
            : conv.updatedAt,
          unreadCount,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
        };
      })
    );

    res.json({ success: true, conversations: formatted });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch conversations' });
  }
}

export async function createConversation(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const senderId = req.user!.userId;
    const senderRole = req.user!.role;
    const senderName = req.user!.name;

    const parsed = ConversationCreateSchema.parse(req.body);

    const recipient = await User.findOne({
      _id: parsed.recipientUserId,
      schoolId,
      isActive: true,
    }).lean();

    if (!recipient) {
      res
        .status(404)
        .json({
          success: false,
          message: 'Recipient user not found or inactive',
        });
      return;
    }

    const existing = await Conversation.findOne({
      schoolId,
      participantIds: { $all: [senderId, recipient._id], $size: 2 },
    });

    if (existing) {
      if (parsed.initialMessage) {
        const msg = await ChatMessage.create({
          schoolId,
          conversationId: existing._id,
          senderId,
          senderName,
          senderRole,
          message: parsed.initialMessage,
          readBy: [senderId],
        });

        existing.lastMessage = {
          text: parsed.initialMessage,
          senderId: senderId as any,
          senderName,
          createdAt: new Date(),
        };
        existing.lastMessageAt = new Date();
        await existing.save();

        emitToConversation(existing._id.toString(), 'chat:message', msg);
      }

      res.json({ success: true, conversation: existing });
      return;
    }

    const now = new Date();
    const conversation = await Conversation.create({
      schoolId,
      type: parsed.type,
      title: parsed.title,
      participantIds: [senderId, recipient._id],
      participants: [
        {
          userId: senderId,
          role: senderRole,
          name: senderName,
          lastReadAt: now,
        },
        {
          userId: recipient._id,
          role: recipient.role,
          name: recipient.name,
        },
      ],
      lastMessageAt: now,
    });

    if (parsed.initialMessage) {
      await ChatMessage.create({
        schoolId,
        conversationId: conversation._id,
        senderId,
        senderName,
        senderRole,
        message: parsed.initialMessage,
        readBy: [senderId],
      });

      conversation.lastMessage = {
        text: parsed.initialMessage,
        senderId: senderId as any,
        senderName,
        createdAt: now,
      };
      await conversation.save();
    }

    emitToUser(recipient._id.toString(), 'chat:new_conversation', conversation);

    res.status(201).json({ success: true, conversation });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res
        .status(400)
        .json({
          success: false,
          message: error.errors[0]?.message || 'Validation failed',
        });
      return;
    }
    res
      .status(500)
      .json({ success: false, message: 'Failed to create conversation' });
  }
}

export async function getMessages(req: Request, res: Response): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const userId = req.user!.userId;
    const { id } = req.params;

    const conversation = await Conversation.findOne({ _id: id, schoolId });
    if (!conversation) {
      res
        .status(404)
        .json({ success: false, message: 'Conversation not found' });
      return;
    }

    const isMember = conversation.participantIds.some(
      (pid) => pid.toString() === userId.toString()
    );

    if (!isMember) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You are not a participant in this conversation',
      });
      return;
    }

    const messages = await ChatMessage.find({
      schoolId,
      conversationId: id,
    })
      .sort({ createdAt: 1 })
      .lean();

    await ChatMessage.updateMany(
      {
        schoolId,
        conversationId: id,
        senderId: { $ne: userId },
        readBy: { $ne: userId },
      },
      { $addToSet: { readBy: userId } }
    );

    await Conversation.updateOne(
      { _id: id, 'participants.userId': userId },
      { $set: { 'participants.$.lastReadAt': new Date() } }
    );

    res.json({ success: true, messages });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch messages' });
  }
}

export async function sendMessage(req: Request, res: Response): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const userName = req.user!.name;
    const { id } = req.params;

    const parsed = ChatMessageCreateSchema.parse(req.body);

    const conversation = await Conversation.findOne({ _id: id, schoolId });
    if (!conversation) {
      res
        .status(404)
        .json({ success: false, message: 'Conversation not found' });
      return;
    }

    const isMember = conversation.participantIds.some(
      (pid) => pid.toString() === userId.toString()
    );

    if (!isMember) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You are not a participant in this conversation',
      });
      return;
    }

    const now = new Date();

    const message = await ChatMessage.create({
      schoolId,
      conversationId: id,
      senderId: userId,
      senderName: userName,
      senderRole: userRole,
      message: parsed.message,
      attachments: parsed.attachments || [],
      readBy: [userId],
    });

    conversation.lastMessage = {
      text: parsed.message,
      senderId: userId as any,
      senderName: userName,
      createdAt: now,
    };
    conversation.lastMessageAt = now;

    const participantIdx = conversation.participants.findIndex(
      (p) => p.userId.toString() === userId.toString()
    );
    if (participantIdx !== -1) {
      conversation.participants[participantIdx].lastReadAt = now;
    }

    await conversation.save();

    emitToConversation(id, 'chat:message', message);

    for (const pid of conversation.participantIds) {
      if (pid.toString() !== userId.toString()) {
        emitToUser(pid.toString(), 'chat:unread_update', {
          conversationId: id,
          lastMessage: conversation.lastMessage,
        });
      }
    }

    res.status(201).json({ success: true, message });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res
        .status(400)
        .json({
          success: false,
          message: error.errors[0]?.message || 'Validation failed',
        });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
}

export async function markAsRead(req: Request, res: Response): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const userId = req.user!.userId;
    const { id } = req.params;

    const conversation = await Conversation.findOne({ _id: id, schoolId });
    if (!conversation) {
      res
        .status(404)
        .json({ success: false, message: 'Conversation not found' });
      return;
    }

    const isMember = conversation.participantIds.some(
      (pid) => pid.toString() === userId.toString()
    );

    if (!isMember) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You are not a participant in this conversation',
      });
      return;
    }

    await ChatMessage.updateMany(
      {
        schoolId,
        conversationId: id,
        senderId: { $ne: userId },
        readBy: { $ne: userId },
      },
      { $addToSet: { readBy: userId } }
    );

    await Conversation.updateOne(
      { _id: id, 'participants.userId': userId },
      { $set: { 'participants.$.lastReadAt': new Date() } }
    );

    res.json({ success: true, message: 'Conversation marked as read' });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to mark conversation as read' });
  }
}

export async function getAvailableRecipients(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const schoolId = req.user!.schoolId;
    const role = req.user!.role;
    const userId = req.user!.userId;

    let targetRoles: string[] = [];

    if (role === 'admin') {
      targetRoles = ['teacher', 'parent', 'admin'];
    } else if (role === 'teacher') {
      targetRoles = ['admin', 'parent', 'teacher'];
    } else if (role === 'parent') {
      targetRoles = ['teacher', 'admin'];
    } else if (role === 'student') {
      targetRoles = ['teacher', 'admin'];
    }

    const users = await User.find({
      schoolId,
      role: { $in: targetRoles },
      _id: { $ne: userId },
      isActive: true,
    })
      .select('_id name email role avatar')
      .sort({ name: 1 })
      .lean();

    res.json({ success: true, recipients: users });
  } catch (_error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch recipients' });
  }
}
