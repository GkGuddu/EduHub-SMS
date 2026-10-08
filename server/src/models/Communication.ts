import mongoose, { Schema, Document } from 'mongoose';
import {
  NoticeTarget,
  NoticeStatus,
  ConversationType,
  UserRole,
} from '@eduhub/shared';

export interface INoticeDoc extends Document {
  schoolId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  targetRole: NoticeTarget;
  targetClassId?: mongoose.Types.ObjectId;
  targetSectionId?: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  authorName: string;
  authorRole: string;
  category: 'academic' | 'holiday' | 'event' | 'administrative' | 'urgent';
  isPinned: boolean;
  status: NoticeStatus;
  scheduledFor?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NoticeSchema = new Schema<INoticeDoc>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    targetRole: {
      type: String,
      enum: ['all', 'teachers', 'students', 'parents', 'class', 'section'],
      required: true,
      default: 'all',
      index: true,
    },
    targetClassId: { type: Schema.Types.ObjectId, ref: 'ClassSection' },
    targetSectionId: { type: Schema.Types.ObjectId, ref: 'ClassSection' },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true },
    authorRole: { type: String, required: true },
    category: {
      type: String,
      enum: ['academic', 'holiday', 'event', 'administrative', 'urgent'],
      default: 'academic',
    },
    isPinned: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'published', 'archived'],
      default: 'published',
      index: true,
    },
    scheduledFor: { type: Date },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

NoticeSchema.index({ schoolId: 1, status: 1, targetRole: 1, createdAt: -1 });

export const Notice = mongoose.model<INoticeDoc>('Notice', NoticeSchema);

export interface INotificationDoc extends Document {
  schoolId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: 'notice' | 'attendance' | 'grade' | 'fee' | 'system';
  isRead: boolean;
  link?: string;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotificationDoc>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['notice', 'attendance', 'grade', 'fee', 'system'],
      default: 'system',
    },
    isRead: { type: Boolean, default: false },
    link: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model<INotificationDoc>(
  'Notification',
  NotificationSchema
);

export interface IConversationDoc extends Document {
  schoolId: mongoose.Types.ObjectId;
  type: ConversationType;
  title?: string;
  participantIds: mongoose.Types.ObjectId[];
  participants: Array<{
    userId: mongoose.Types.ObjectId;
    role: UserRole;
    name: string;
    avatar?: string;
    lastReadAt?: Date;
  }>;
  lastMessage?: {
    text: string;
    senderId: mongoose.Types.ObjectId;
    senderName: string;
    createdAt: Date;
  };
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversationDoc>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['admin_teacher', 'teacher_parent', 'general'],
      required: true,
      default: 'general',
    },
    title: { type: String },
    participantIds: [
      { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ],
    participants: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, required: true },
        name: { type: String, required: true },
        avatar: { type: String },
        lastReadAt: { type: Date },
      },
    ],
    lastMessage: {
      text: { type: String },
      senderId: { type: Schema.Types.ObjectId, ref: 'User' },
      senderName: { type: String },
      createdAt: { type: Date },
    },
    lastMessageAt: { type: Date },
  },
  { timestamps: true }
);

ConversationSchema.index({ schoolId: 1, participantIds: 1 });
ConversationSchema.index({ schoolId: 1, lastMessageAt: -1 });

export const Conversation = mongoose.model<IConversationDoc>(
  'Conversation',
  ConversationSchema
);

export interface IChatMessageDoc extends Document {
  schoolId: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderName: string;
  senderRole: UserRole;
  message: string;
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileSize?: number;
    fileType?: string;
  }>;
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessageDoc>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    senderName: { type: String, required: true },
    senderRole: { type: String, required: true },
    message: { type: String, required: true },
    attachments: [
      {
        fileName: { type: String, required: true },
        fileUrl: { type: String, required: true },
        fileSize: { type: Number },
        fileType: { type: String },
      },
    ],
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

ChatMessageSchema.index({ conversationId: 1, createdAt: 1 });

export const ChatMessage = mongoose.model<IChatMessageDoc>(
  'ChatMessage',
  ChatMessageSchema
);
