import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole, AuditAction } from '@eduhub/shared';

export interface ISchoolDocument extends Document {
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  logoPublicId?: string;
  academicYear: string;
  status: 'pending' | 'active' | 'suspended';
  workingDays: string[];
  branding?: {
    primaryColor?: string;
    secondaryColor?: string;
    tagline?: string;
    logoUrl?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SchoolSchema = new Schema<ISchoolDocument>(
  {
    name: { type: String, required: true, trim: true },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    website: { type: String },
    logo: { type: String },
    logoPublicId: { type: String },
    academicYear: { type: String, required: true, default: '2025-2026' },
    status: {
      type: String,
      enum: ['pending', 'active', 'suspended'],
      default: 'active',
      index: true,
    },
    workingDays: {
      type: [String],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    },
    branding: {
      primaryColor: { type: String, default: '#f97316' },
      secondaryColor: { type: String, default: '#0284c7' },
      tagline: {
        type: String,
        default: 'Excellence in Education & Holistic Learning',
      },
      logoUrl: { type: String },
    },
  },
  { timestamps: true }
);

export const School = mongoose.model<ISchoolDocument>('School', SchoolSchema);

export interface IUserDocument extends Document {
  schoolId: mongoose.Types.ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  avatar?: string;
  avatarPublicId?: string;
  phone?: string;
  isActive: boolean;
  permissions: string[];
  permissionsUpdatedAt?: Date;
  permissionsUpdatedByName?: string;
  mustChangePassword?: boolean;
  temporaryPasswordExpiresAt?: Date;
  lastLogin?: Date;
  comparePassword(candidate: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      required: true,
      enum: ['admin', 'teacher', 'student', 'parent'],
      index: true,
    },
    avatar: { type: String },
    avatarPublicId: { type: String },
    phone: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    permissions: [{ type: String }],
    permissionsUpdatedAt: { type: Date },
    permissionsUpdatedByName: { type: String },
    mustChangePassword: { type: Boolean, default: false },
    temporaryPasswordExpiresAt: { type: Date },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

UserSchema.index({ schoolId: 1, email: 1 }, { unique: true });

UserSchema.methods.comparePassword = async function (
  candidate: string
): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash);
};

export const User = mongoose.model<IUserDocument>('User', UserSchema);

export interface IOtpRequestDocument extends Document {
  email: string;
  phone?: string;
  otpHash: string;
  purpose: 'school_registration' | 'password_reset' | 'login_2fa';
  metadata?: Record<string, any>;
  attempts: number;
  maxAttempts: number;
  expiresAt: Date;
  resendCooldownUntil: Date;
  isUsed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OtpRequestSchema = new Schema<IOtpRequestDocument>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: { type: String, trim: true },
    otpHash: { type: String, required: true },
    purpose: {
      type: String,
      required: true,
      enum: ['school_registration', 'password_reset', 'login_2fa'],
      index: true,
    },
    metadata: { type: Schema.Types.Mixed },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    expiresAt: { type: Date, required: true, index: { expires: '1d' } },
    resendCooldownUntil: { type: Date, required: true },
    isUsed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const OtpRequest = mongoose.model<IOtpRequestDocument>(
  'OtpRequest',
  OtpRequestSchema
);

export interface IPasswordResetTokenDocument extends Document {
  userId: mongoose.Types.ObjectId;
  email: string;
  tokenHash: string;
  attempts: number;
  maxAttempts: number;
  expiresAt: Date;
  resendCooldownUntil?: Date;
  isUsed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PasswordResetTokenSchema = new Schema<IPasswordResetTokenDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    tokenHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    expiresAt: { type: Date, required: true, index: { expires: '1d' } },
    resendCooldownUntil: { type: Date },
    isUsed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const PasswordResetToken = mongoose.model<IPasswordResetTokenDocument>(
  'PasswordResetToken',
  PasswordResetTokenSchema
);

export interface IAuditLogDoc extends Document {
  schoolId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userName: string;
  userRole: UserRole;
  action: AuditAction;
  entityType:
    | 'permission'
    | 'grade'
    | 'fee'
    | 'attendance'
    | 'student'
    | 'teacher'
    | 'notice'
    | 'auth'
    | 'exam'
    | 'finance'
    | 'settings'
    | 'backup'
    | 'system';
  entityId?: string;
  details: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLogDoc>(
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
    userName: { type: String, required: true },
    userRole: { type: String, required: true },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: String },
    details: { type: String, required: true },
    ipAddress: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ schoolId: 1, createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLogDoc>(
  'AuditLog',
  AuditLogSchema
);
