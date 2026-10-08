import crypto from 'crypto';
import { Request } from 'express';
import { Notification, ParentProfile, AuditLog } from '../models';
import { emitToUser, emitToSchool, emitToRole } from '../sockets';
import {
  ICredentialEmailPayload,
  IGuardianNotificationLog,
  AuditAction,
  UserRole,
  IStudentDocument,
} from '@eduhub/shared';

export interface SendNotificationParams {
  schoolId: string;
  userId: string;
  title: string;
  message: string;
  type: 'notice' | 'attendance' | 'grade' | 'fee' | 'system';
  link?: string;
}

export async function sendNotification(
  params: SendNotificationParams
): Promise<void> {
  try {
    const notification = await Notification.create({
      schoolId: params.schoolId,
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type,
      link: params.link,
    });

    emitToUser(params.userId, 'new_notification', notification);
  } catch (error) {
    console.error('[NotificationService] Failed to send notification:', error);
  }
}

export async function broadcastNotice(
  schoolId: string,
  targetRole: string,
  notice: any
): Promise<void> {
  if (targetRole === 'all') {
    emitToSchool(schoolId, 'new_notice', notice);
  } else {
    emitToRole(schoolId, targetRole, 'new_notice', notice);
  }
}

interface SentEmailRecord extends ICredentialEmailPayload {
  sentAt: string;
}

const sentMockEmails: SentEmailRecord[] = [];

export async function sendCredentialEmail(
  payload: ICredentialEmailPayload
): Promise<{ success: boolean; messageId: string }> {
  const record: SentEmailRecord = {
    ...payload,
    sentAt: new Date().toISOString(),
  };

  sentMockEmails.push(record);

  if (
    process.env.NODE_ENV !== 'production' ||
    process.env.VITE_DEMO_MODE === 'true'
  ) {
    console.log('\n======================================================');
    console.log('   [EduHub Mail Adapter] Credential Delivery Notice   ');
    console.log('======================================================');
    console.log(` To:        ${payload.to} (${payload.name})`);
    console.log(` Role:      ${payload.role.toUpperCase()}`);
    console.log(` School:    ${payload.schoolName}`);
    console.log(
      ` Password:  ${payload.tempPassword || '(User chosen / pre-set)'}`
    );
    console.log(` Login URL: ${payload.loginUrl}`);
    console.log('======================================================\n');
  }

  return {
    success: true,
    messageId: `mock-mail-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
  };
}

export function getSentMockEmails(): SentEmailRecord[] {
  return [...sentMockEmails];
}

export function clearSentMockEmails(): void {
  sentMockEmails.length = 0;
}

export interface IGuardianNotificationPayload {
  schoolId: string;
  attendanceRecordId: string;
  studentId: string;
  studentName: string;
  classSectionName: string;
  date: string;
  guardianName: string;
  guardianContact: string;
  channel: 'sms' | 'email' | 'in_app';
}

export interface IGuardianNotificationProvider {
  name: string;
  sendAbsentAlert(payload: IGuardianNotificationPayload): Promise<{
    success: boolean;
    messageId?: string;
    deliveryStatus: 'delivered_dev_mock' | 'queued' | 'failed';
    error?: string;
  }>;
}

const notificationLogs: IGuardianNotificationLog[] = [];

class LocalDevMockNotificationProvider implements IGuardianNotificationProvider {
  name = 'local-dev-mock';

  async sendAbsentAlert(payload: IGuardianNotificationPayload): Promise<{
    success: boolean;
    messageId: string;
    deliveryStatus: 'delivered_dev_mock';
  }> {
    const template = `Adiya / EduHub: ${payload.studentName} was marked absent on ${payload.date}. Please contact the school if needed.`;
    const messageId = `mock-msg-${crypto.randomUUID()}`;

    console.log(
      '\n=============================================================='
    );
    console.log(
      '   [EduHub Guardian Alert] Student Absence Notification (Mock)'
    );
    console.log(
      '=============================================================='
    );
    console.log(
      ` To Guardian: ${payload.guardianName} (${payload.guardianContact})`
    );
    console.log(
      ` Student:     ${payload.studentName} [Class: ${payload.classSectionName}]`
    );
    console.log(` Date:        ${payload.date}`);
    console.log(` Channel:     ${payload.channel.toUpperCase()}`);
    console.log(` Message:     "${template}"`);
    console.log(` Status:      DELIVERED (Local Development Mock)`);
    console.log(
      '==============================================================\n'
    );

    notificationLogs.push({
      id: messageId,
      attendanceRecordId: payload.attendanceRecordId,
      studentId: payload.studentId,
      studentName: payload.studentName,
      classSectionName: payload.classSectionName,
      date: payload.date,
      guardianName: payload.guardianName,
      guardianContact: payload.guardianContact,
      channel: payload.channel,
      message: template,
      deliveryStatus: 'delivered_dev_mock',
      sentAt: new Date().toISOString(),
    });

    return {
      success: true,
      messageId,
      deliveryStatus: 'delivered_dev_mock',
    };
  }
}

let activeProvider: IGuardianNotificationProvider =
  new LocalDevMockNotificationProvider();

export function setGuardianNotificationProvider(
  provider: IGuardianNotificationProvider
) {
  activeProvider = provider;
}

export async function dispatchAbsentAlerts(options: {
  schoolId: string;
  attendanceRecordId: string;
  date: string;
  classSectionName: string;
  absentStudents: Array<{
    studentId: string;
    studentName: string;
    parentEmail?: string;
    parentPhone?: string;
    parentName?: string;
    parentIds?: string[];
  }>;
  alreadyNotifiedStudentIds?: string[];
}): Promise<string[]> {
  const {
    schoolId,
    attendanceRecordId,
    date,
    classSectionName,
    absentStudents,
    alreadyNotifiedStudentIds = [],
  } = options;

  const alreadyNotifiedSet = new Set(
    alreadyNotifiedStudentIds.map((id) => id.toString())
  );
  const newlyNotified: string[] = [];

  for (const student of absentStudents) {
    const sId = student.studentId.toString();

    if (alreadyNotifiedSet.has(sId)) {
      continue;
    }

    let guardianName = student.parentName || 'Parent / Guardian';
    let guardianContact =
      student.parentPhone ||
      student.parentEmail ||
      'Registered Guardian Contact';

    if (
      !student.parentPhone &&
      !student.parentEmail &&
      student.parentIds?.length
    ) {
      try {
        const parent = await ParentProfile.findOne({
          userId: { $in: student.parentIds },
          schoolId,
        });
        if (parent) {
          guardianName = parent.name || guardianName;
          guardianContact = parent.phone || parent.email || guardianContact;
        }
      } catch (_err) {
        console.warn('Failed to fetch parent profile for student:', sId);
      }
    }

    await activeProvider.sendAbsentAlert({
      schoolId,
      attendanceRecordId,
      studentId: sId,
      studentName: student.studentName,
      classSectionName,
      date,
      guardianName,
      guardianContact,
      channel: guardianContact.includes('@') ? 'email' : 'sms',
    });

    if (student.parentIds && Array.isArray(student.parentIds)) {
      for (const pId of student.parentIds) {
        sendNotification({
          schoolId,
          userId: pId.toString(),
          title: 'Attendance Alert: Student Absent',
          message: `Adiya / EduHub: ${student.studentName} was marked absent in ${classSectionName} on ${date}. Please contact the school if needed.`,
          type: 'attendance',
        });
      }
    }

    newlyNotified.push(sId);
    alreadyNotifiedSet.add(sId);
  }

  return newlyNotified;
}

export function getGuardianNotificationLogs(
  _schoolId?: string
): IGuardianNotificationLog[] {
  return [...notificationLogs].reverse();
}

export function clearGuardianNotificationLogs(): void {
  notificationLogs.length = 0;
}

export interface CreateAuditLogParams {
  schoolId: string;
  userId: string;
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
    | 'exam';
  entityId?: string;
  details: string;
  metadata?: Record<string, unknown>;
  req?: Request;
}

export async function createAuditLog(
  params: CreateAuditLogParams
): Promise<void> {
  try {
    const ipAddress =
      params.req?.headers?.['x-forwarded-for']?.toString() ||
      params.req?.socket?.remoteAddress ||
      'internal';

    const log = await AuditLog.create({
      schoolId: params.schoolId,
      userId: params.userId,
      userName: params.userName,
      userRole: params.userRole,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      details: params.details,
      ipAddress,
      metadata: params.metadata,
    });

    emitToRole(params.schoolId, 'admin', 'audit_logged', log);
  } catch (error) {
    console.error('[AuditService] Failed to record audit log:', error);
  }
}

export interface FileUploadPayload {
  title: string;
  docType:
    | 'birth_certificate'
    | 'transfer_certificate'
    | 'id_proof'
    | 'medical_record'
    | 'previous_marksheet'
    | 'other';
  fileName: string;
  fileData?: string;
  fileSize?: number;
}

export function processDocumentUpload(
  payload: FileUploadPayload
): IStudentDocument {
  let fileUrl = payload.fileData || '';
  if (
    !fileUrl.startsWith('http') &&
    !fileUrl.startsWith('data:') &&
    !fileUrl.startsWith('/')
  ) {
    fileUrl = `/uploads/documents/${Date.now()}-${payload.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  }

  return {
    title: payload.title.trim(),
    docType: payload.docType,
    fileUrl,
    fileName: payload.fileName,
    fileSize: payload.fileSize || 1024 * 50,
    uploadedAt: new Date().toISOString(),
  };
}
