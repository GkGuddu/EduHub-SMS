import { z } from 'zod';
export type PermissionKey =
  | 'students.view'
  | 'students.create'
  | 'students.update'
  | 'students.delete'
  | 'teachers.view'
  | 'attendance.view'
  | 'attendance.mark'
  | 'attendance.edit'
  | 'fees.view'
  | 'fees.collect'
  | 'fees.edit'
  | 'fees.receipt'
  | 'homework.view'
  | 'homework.create'
  | 'homework.update'
  | 'homework.delete'
  | 'homework.grade'
  | 'timetable.view'
  | 'timetable.manage'
  | 'notices.view'
  | 'notices.create'
  | 'notices.publish'
  | 'communication.view'
  | 'communication.chat'
  | 'communication.announcements'
  | 'exams.view'
  | 'exams.create'
  | 'exams.edit'
  | 'exams.update'
  | 'exams.delete'
  | 'marks.view'
  | 'marks.enter'
  | 'marks.edit'
  | 'results.view'
  | 'results.publish'
  | 'materials.view'
  | 'materials.upload'
  | 'materials.delete'
  | 'reports.view'
  | 'reports.generate'
  | 'reports.export'
  | 'finance.view'
  | 'finance.manage'
  | 'ai.use'
  | 'homework.aiHint'
  | 'quizzes.view'
  | 'quizzes.create'
  | 'quizzes.update'
  | 'quizzes.delete'
  | 'quizzes.publish'
  | 'quizzes.grade'
  | 'settings.view'
  | 'settings.edit'
  | 'roles.manage';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
}

export interface ApiPaginatedResponse<T> {
  success: boolean;
  message?: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type UserRole = 'admin' | 'teacher' | 'student' | 'parent';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave';

export interface IGuardianNotificationLog {
  id: string;
  attendanceRecordId: string;
  studentId: string;
  studentName: string;
  classSectionName: string;
  date: string;
  guardianName: string;
  guardianContact: string;
  channel: 'sms' | 'email' | 'in_app';
  message: string;
  deliveryStatus: 'delivered_dev_mock' | 'queued' | 'failed';
  sentAt: string;
}

export interface IAttendanceDailyClassSummary {
  classSectionId: string;
  className: string;
  section: string;
  totalStudents: number;
  markedStudents: number;
  present: number;
  absent: number;
  late: number;
  leave: number;
  rate: number;
  isMarked: boolean;
  takenByName?: string;
  takenByRole?: string;
  isEdited?: boolean;
}

export interface IAttendanceWeeklyDay {
  date: string;
  dayName: string;
  present: number;
  absent: number;
  late: number;
  leave: number;
  totalMarked: number;
  rate: number;
}

export interface IStudentAttendanceHistoryRecord {
  date: string;
  dayName: string;
  status: AttendanceStatus;
  remarks?: string;
  takenByName?: string;
}

export interface IStudentAttendanceReport {
  studentId: string;
  studentName: string;
  rollNumber: string;
  className: string;
  section: string;
  admissionNumber?: string;
  totalWorkingDays: number;
  presentDays: number;
  lateDays: number;
  leaveDays: number;
  absentDays: number;
  attendanceRate: number;
  history: IStudentAttendanceHistoryRecord[];
}

export type FeeStatus =
  | 'pending'
  | 'partially paid'
  | 'paid'
  | 'overdue'
  | 'partial'
  | 'unpaid'
  | 'cancelled'
  | 'archived';

export type PaymentMethod =
  'cash' | 'cheque' | 'dd' | 'online' | 'other' | 'card' | 'bank_transfer';

export type NoticeTarget =
  'all' | 'teachers' | 'students' | 'parents' | 'class' | 'section';
export type NoticeStatus = 'draft' | 'scheduled' | 'published' | 'archived';

export type ExamType =
  'unit_test' | 'term_exam' | 'final_exam' | 'quiz' | 'practical' | 'other';

export type ExamStatus =
  'draft' | 'scheduled' | 'marks-entry' | 'published' | 'submitted';

export type AuditAction =
  | 'PERMISSION_UPDATE'
  | 'EXAM_CREATE'
  | 'EXAM_UPDATE'
  | 'EXAM_DELETE'
  | 'RESULT_PUBLISH'
  | 'RESULT_UPDATE'
  | 'FEE_PAYMENT'
  | 'FEE_CORRECTION'
  | 'FEE_INVOICE_CREATE'
  | 'FEE_CONCESSION_APPLY'
  | 'FEE_CONCESSION_APPROVE'
  | 'FEE_CONCESSION_REJECT'
  | 'ATTENDANCE_EDIT'
  | 'STUDENT_CREATE'
  | 'STUDENT_UPDATE'
  | 'STUDENT_DELETE'
  | 'TEACHER_CREATE'
  | 'TEACHER_UPDATE'
  | 'USER_LOGIN'
  | 'PASSWORD_RESET'
  | 'SCHOOL_REGISTER'
  | 'SCHOOL_ACTIVATE'
  | 'EXPENSE_CREATE'
  | 'EXPENSE_DELETE'
  | 'SETTINGS_UPDATE'
  | 'BACKUP_EXPORT'
  | 'BACKUP_RESTORE';

export interface IOtpRequest {
  _id: string;
  email: string;
  phone?: string;
  purpose: 'school_registration' | 'password_reset' | 'login_2fa';
  metadata?: Record<string, any>;
  attempts: number;
  maxAttempts: number;
  expiresAt: string;
  resendCooldownUntil: string;
  isUsed: boolean;
}

export interface IPasswordResetToken {
  _id: string;
  userId: string;
  email: string;
  attempts: number;
  maxAttempts: number;
  expiresAt: string;
  resendCooldownUntil?: string;
  isUsed: boolean;
}

export interface IVerifyResetOtpResponse {
  success: boolean;
  message: string;
  resetToken?: string;
}

export interface ISchool {
  _id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  academicYear: string;
}

export interface IUser {
  _id: string;
  schoolId: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  isActive: boolean;
  permissions?: string[];
  mustChangePassword?: boolean;
  temporaryPasswordExpiresAt?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IAcademicYear {
  _id: string;
  schoolId: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description?: string;
  createdAt?: string;
}

export interface IClassSection {
  _id: string;
  schoolId: string;
  name: string;
  section: string;
  roomNumber?: string;
  classTeacherId?: string;
  classTeacherName?: string;
  academicYearId?: string;
  academicYear: string;
  capacity?: number;
  studentCount?: number;
}

export interface ISubject {
  _id: string;
  schoolId: string;
  name: string;
  code: string;
  description?: string;
  type?: 'core' | 'elective' | 'extracurricular';
  credits?: number;
}

export interface IClassSubjectAssignment {
  _id: string;
  schoolId: string;
  classSectionId: string;
  subjectId: string;
  teacherId: string;
  className?: string;
  section?: string;
  subjectName?: string;
  teacherName?: string;
}

export interface IStudentDocument {
  _id?: string;
  title: string;
  docType:
    | 'birth_certificate'
    | 'transfer_certificate'
    | 'id_proof'
    | 'medical_record'
    | 'previous_marksheet'
    | 'other';
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  publicId?: string;
  resourceType?: string;
  uploadedBy?: string;
  uploadedAt: string;
}

export interface IEnrollmentRecord {
  academicYear: string;
  classSectionId: string;
  className: string;
  section: string;
  rollNumber: string;
  enrolledAt: string;
  status: 'active' | 'promoted' | 'graduated' | 'transferred' | 'archived';
}

export interface ICredentialEmailPayload {
  to: string;
  name: string;
  role: UserRole;
  schoolName: string;
  tempPassword?: string;
  loginUrl: string;
  generatedAt: string;
}

export interface IStudentProfile {
  _id: string;
  schoolId: string;
  userId: string;
  admissionNumber: string;
  rollNumber: string;
  name: string;
  email: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: string;
  bloodGroup?: string;
  classSectionId: string;
  className?: string;
  section?: string;
  parentIds: string[];
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  parentRelationship?: 'father' | 'mother' | 'guardian';
  address?: string;
  emergencyContact?: string;
  status: 'active' | 'inactive' | 'transferred' | 'archived';
  photo?: string;
  photoPublicId?: string;
  feeStatus?: FeeStatus;
  feeBalance?: number;
  attendanceRate?: number;
  documents?: IStudentDocument[];
  enrollmentHistory?: IEnrollmentRecord[];
}

export interface ITeacherProfile {
  _id: string;
  schoolId: string;
  userId: string;
  employeeId: string;
  name: string;
  email: string;
  phone?: string;
  gender: 'male' | 'female' | 'other';
  qualification: string;
  specialization: string;
  experienceYears?: number;
  joiningDate: string;
  photo?: string;
  photoPublicId?: string;
  assignedClasses?: Array<{
    classSectionId: string;
    className: string;
    section: string;
    subjectId: string;
    subjectName: string;
  }>;
  permissions?: string[];
  status: 'active' | 'on_leave' | 'terminated' | 'archived';
}

export interface IParentProfile {
  _id: string;
  schoolId: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  relationship: 'father' | 'mother' | 'guardian';
  occupation?: string;
  address?: string;
  photo?: string;
  photoPublicId?: string;
  linkedStudentUserIds?: string[];
  linkedStudents: Array<{
    studentId: string;
    name: string;
    admissionNumber: string;
    className: string;
    section: string;
  }>;
}

export interface IAttendanceItem {
  studentId: string;
  studentName: string;
  rollNumber: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface IAttendanceRecord {
  _id: string;
  schoolId: string;
  classSectionId: string;
  className: string;
  section: string;
  date: string;
  records: IAttendanceItem[];
  takenById: string;
  takenByName: string;
  takenByRole: UserRole;
  isEdited?: boolean;
  editHistory?: Array<{
    editedBy: string;
    editedAt: string;
    previousRecordsCount: number;
    reason?: string;
  }>;
}

export interface IExamSubjectConfig {
  subjectId: string;
  subjectName: string;
  maxMarks: number;
  passingMarks: number;
  examDate?: string;
  startTime?: string;
  endTime?: string;
}

export interface IGradingRule {
  minPercentage: number;
  maxPercentage: number;
  grade: string;
  remarks?: string;
}

export interface IExam {
  _id: string;
  schoolId: string;
  name: string;
  type?: ExamType;
  classSectionId?: string;
  className?: string;
  section?: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  status: ExamStatus;
  description?: string;
  subjects?: IExamSubjectConfig[];
  maxMarks?: number;
  passingMarks?: number;
  gradingRules?: IGradingRule[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ICorrectionRecord {
  studentId: string;
  studentName?: string;
  previousMarks: number;
  newMarks: number;
  reason: string;
  correctedBy: string;
  correctedByName: string;
  correctedAt: string;
}

export interface IGradeItem {
  studentId: string;
  studentName: string;
  rollNumber: string;
  marksObtained: number;
  maxMarks: number;
  percentage: number;
  grade: string;
  isAbsent?: boolean;
  isPassed?: boolean;
  remarks?: string;
}

export interface IGradeRecord {
  _id: string;
  schoolId: string;
  examId: string;
  examName: string;
  classSectionId: string;
  className: string;
  section: string;
  subjectId: string;
  subjectName: string;
  maxMarks: number;
  passingMarks: number;
  grades: IGradeItem[];
  enteredById: string;
  enteredByName: string;
  status: ExamStatus;
  publishedAt?: string;
  publishedById?: string;
  publishedByName?: string;
  correctionHistory?: ICorrectionRecord[];
  createdAt?: string;
  updatedAt?: string;
}

export interface IFeeStructure {
  _id: string;
  schoolId: string;
  title: string;
  amount: number;
  frequency: 'one_time' | 'termly' | 'annual' | 'monthly';
  description?: string;
}

export interface IFeePayment {
  _id: string;
  receiptNumber: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  transactionRef?: string;
  recordedById: string;
  recordedByName: string;
  notes?: string;
}

export interface IFeeInvoice {
  _id: string;
  schoolId: string;
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  classSectionId: string;
  className: string;
  section: string;
  title: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: FeeStatus;
  items: Array<{
    title: string;
    amount: number;
  }>;
  payments: IFeePayment[];
}

export interface INotice {
  _id: string;
  schoolId: string;
  title: string;
  content: string;
  targetRole: NoticeTarget;
  targetClassId?: string;
  targetSectionId?: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  category: 'academic' | 'holiday' | 'event' | 'administrative' | 'urgent';
  isPinned: boolean;
  status: NoticeStatus;
  scheduledFor?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface IAuditLog {
  _id: string;
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
    | 'auth';
  entityId?: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface INotification {
  _id: string;
  schoolId: string;
  userId: string;
  title: string;
  message: string;
  type: 'notice' | 'attendance' | 'grade' | 'fee' | 'system';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface ISchoolCalendarEvent {
  _id: string;
  schoolId: string;
  academicYearId?: string;
  title: string;
  eventType: 'holiday' | 'event' | 'meeting' | 'exam' | 'other';
  startDate: string;
  endDate: string;
  isHoliday: boolean;
  description?: string;
  targetAudience?: NoticeTarget;
  createdAt?: string;
}

export interface IClassPerformance {
  classSectionId: string;
  className: string;
  section: string;
  averageScore: number;
  studentCount: number;
  highestScore: number;
  lowestScore: number;
  subjectCount: number;
}

export interface IPendingFeeItem {
  invoiceId: string;
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  className: string;
  section: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: FeeStatus;
}

export interface IUpcomingExam {
  examId: string;
  name: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  status: ExamStatus;
  subjectCount?: number;
}

export interface IWeeklyAttendanceDay {
  day: string;
  date: string;
  present: number;
  absent: number;
  late: number;
  rate: number;
}

export interface ISchoolProfile {
  _id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  academicYear: string;
  workingDays?: string[];
  branding?: {
    primaryColor?: string;
    secondaryColor?: string;
    tagline?: string;
    logoUrl?: string;
  };
}

export interface IAdminDashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  todayAttendanceRate: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  feesTotalBilled: number;
  feesCollected: number;
  feesPending: number;
  collectionRate: number;
  weeklyAttendance: IWeeklyAttendanceDay[];
  monthlyAttendance: Array<{ month: string; rate: number }>;
  feeCollectionByMonth: Array<{
    month: string;
    billed: number;
    collected: number;
  }>;
  classPerformance: IClassPerformance[];
  recentActivities: IAuditLog[];
  upcomingExams: IUpcomingExam[];
  pendingFees: IPendingFeeItem[];
  calendarEvents: ISchoolCalendarEvent[];
  recentAuditLogs: IAuditLog[];
  recentNotices: INotice[];
}

export interface ITeacherDashboardStats {
  assignedClassesCount: number;
  assignedSubjectsCount: number;
  totalStudentsTaught: number;
  todayClasses: Array<{
    classSectionId?: string;
    time?: string;
    className: string;
    section: string;
    subjectName: string;
    room?: string;
    attendanceTaken: boolean;
  }>;
  pendingAttendanceClasses: Array<{
    classSectionId: string;
    className: string;
    section: string;
  }>;
  attendanceOverview?: {
    rate: number;
    present: number;
    late: number;
    absent: number;
    total: number;
  };
  classPerformance?: Array<{
    classSectionId: string;
    className: string;
    section: string;
    averageScore: number;
    studentCount: number;
    highestScore: number;
    lowestScore: number;
    subjectCount?: number;
  }>;
  upcomingExams?: Array<{
    examId: string;
    name: string;
    type?: string;
    academicYear?: string;
    startDate: string;
    endDate: string;
    status: string;
    subjectCount?: number;
  }>;
  pendingHomeworkCount?: number;
  pendingHomeworkList?: Array<{
    homeworkId: string;
    title: string;
    className: string;
    section: string;
    subjectName?: string;
    dueDate: string;
    pendingSubmissionCount?: number;
    submittedCount?: number;
    maxMarks?: number;
  }>;
  communicationSummary?: {
    unreadConversationsCount?: number;
    unreadConversations?: number;
    recentConversations: Array<{
      id?: string;
      conversationId?: string;
      title: string;
      lastMessageText?: string;
      lastMessage?: string;
      unread?: boolean;
      updatedAt: string;
    }>;
  };
  recentNotices: any[];
}

export interface IStudentDashboardStats {
  studentName: string;
  admissionNumber: string;
  className: string;
  section: string;
  attendanceRate: number;
  attendanceBreakdown: {
    present: number;
    late: number;
    absent: number;
    total: number;
  };
  recentAttendanceHistory?: Array<{
    date: string;
    status: 'present' | 'late' | 'absent' | AttendanceStatus;
    remarks?: string;
  }>;
  averageScore?: number;
  upcomingExams: Array<{
    examId?: string;
    examName: string;
    type?: string;
    subjectName?: string;
    date: string;
    time?: string;
  }>;
  recentGrades: Array<{
    examName?: string;
    subjectName: string;
    marksObtained: number;
    maxMarks: number;
    grade: string;
    percentage?: number;
    isPassed?: boolean;
  }>;
  feeStatus: {
    totalDue: number;
    totalPaid: number;
    balance: number;
    status: FeeStatus | 'paid' | 'partial' | 'pending' | 'overdue' | string;
    dueDate?: string;
  };
  homeworkList?: Array<{
    homeworkId: string;
    title: string;
    subjectName: string;
    dueDate: string;
    isSubmitted?: boolean;
    marksObtained?: number;
    maxMarks?: number;
    status: 'submitted' | 'pending' | 'graded' | string;
  }>;
  todayTimetable?: Array<{
    periodNumber: number;
    startTime: string;
    endTime: string;
    subjectName: string;
    teacherName?: string;
    roomNumber?: string;
  }>;
  studyMaterials?: Array<{
    id?: string;
    materialId?: string;
    title: string;
    subjectName: string;
    fileType: string;
    fileName?: string;
    fileUrl?: string;
    createdAt?: string;
    uploadedAt?: string;
  }>;
  notices: any[];
}

export interface IParentDashboardStats {
  parentName: string;
  children: Array<{
    studentId: string;
    profileId?: string;
    name: string;
    admissionNumber: string;
    className: string;
    section: string;
    attendanceRate: number;
    feeBalance: number;
    feeStatus: FeeStatus | string;
    photo?: string;
  }>;
  selectedChildSummary?: {
    studentId: string;
    name: string;
    admissionNumber?: string;
    className?: string;
    section?: string;
    photo?: string;
    attendanceRate?: number;
    attendance: {
      rate: number;
      present: number;
      late: number;
      absent: number;
      total?: number;
    };
    attendanceCalendar?: Array<{
      date: string;
      status: 'present' | 'late' | 'absent' | AttendanceStatus;
    }>;
    averageScore?: number;
    recentGrades: Array<{
      examName?: string;
      subjectName: string;
      grade: string;
      marksObtained: number;
      maxMarks: number;
      percentage?: number;
      isPassed?: boolean;
    }>;
    feeInvoice?: any;
    feeHistory?: Array<{
      receiptNumber?: string;
      invoiceNumber: string;
      title?: string;
      amount?: number;
      totalAmount?: number;
      paidAmount?: number;
      balance?: number;
      paymentDate?: string;
      paymentMethod?: string;
      status?: string;
      dueDate?: string;
    }>;
    homework?: Array<{
      homeworkId: string;
      title: string;
      subjectName: string;
      dueDate: string;
      isSubmitted?: boolean;
      status?: string;
      marksObtained?: number;
      maxMarks?: number;
    }>;
    todayTimetable?: Array<{
      periodNumber: number;
      startTime: string;
      endTime: string;
      subjectName: string;
      teacherName?: string;
      roomNumber?: string;
    }>;
  } | null;
  notices: any[];
}

export type HomeworkStatus = 'draft' | 'published' | 'closed';

export interface IHomeworkAttachment {
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  fileType?: string;
}

export interface IHomeworkSubmission {
  _id: string;
  schoolId: string;
  homeworkId: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  classSectionId: string;
  submissionText?: string;
  attachments?: IHomeworkAttachment[];
  submittedAt: string;
  isLate: boolean;
  status: 'submitted' | 'graded';
  marksObtained?: number;
  feedback?: string;
  gradedAt?: string;
  gradedById?: string;
  gradedByName?: string;
}

export interface IHomework {
  _id: string;
  schoolId: string;
  title: string;
  description: string;
  classSectionId: string;
  className?: string;
  section?: string;
  subjectId: string;
  subjectName?: string;
  assignedDate: string;
  dueDate: string;
  teacherId: string;
  teacherName?: string;
  attachments?: IHomeworkAttachment[];
  maxMarks?: number;
  status?: HomeworkStatus;
  submissionCount?: number;
  studentSubmission?: IHomeworkSubmission;
  createdAt?: string;
}

export interface ITimetableSlot {
  _id: string;
  schoolId: string;
  classSectionId: string;
  className?: string;
  section?: string;
  dayOfWeek:
    'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  periodNumber: number;
  startTime: string;
  endTime: string;
  subjectId: string;
  subjectName?: string;
  teacherId: string;
  teacherName?: string;
  roomNumber?: string;
  academicYearId?: string;
}

export interface IStudyMaterial {
  _id: string;
  schoolId: string;
  title: string;
  description?: string;
  classSectionId: string;
  className?: string;
  section?: string;
  subjectId: string;
  subjectName?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType: 'pdf' | 'document' | 'video' | 'link';
  uploadedById: string;
  uploadedByName?: string;
  createdAt: string;
}

export interface ICommunicationLog {
  _id: string;
  schoolId: string;
  channel: 'sms' | 'email' | 'in_app';
  targetAudience: string;
  recipientCount: number;
  title: string;
  content: string;
  sentByName: string;
  sentAt: string;
  status: 'sent' | 'delivered' | 'failed';
}

export type ConversationType = 'admin_teacher' | 'teacher_parent' | 'general';

export interface IConversationParticipant {
  userId: string;
  role: UserRole;
  name: string;
  avatar?: string;
  lastReadAt?: string;
}

export interface IConversation {
  _id: string;
  schoolId: string;
  type: ConversationType;
  title?: string;
  participantIds: string[];
  participants: IConversationParticipant[];
  lastMessage?: {
    text: string;
    senderId: string;
    senderName: string;
    createdAt: string;
  };
  lastMessageAt?: string;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface IChatMessage {
  _id: string;
  schoolId: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  message: string;
  attachments?: IHomeworkAttachment[];
  readBy: string[];
  createdAt: string;
}

export interface IRegisterSchoolPayload {
  schoolName: string;
  schoolCode: string;
  address: string;
  phone: string;
  email: string;
  academicYear: string;
  principalName: string;
  adminEmail: string;
  adminPassword: string;
  adminPhone?: string;
}

export type FeeFrequency = 'monthly' | 'quarterly' | 'yearly' | 'one-time';

export type ConcessionType =
  | 'merit'
  | 'sibling'
  | 'staff_child'
  | 'financial_aid'
  | 'special_waiver'
  | 'other';

export type ConcessionDiscountType = 'fixed' | 'percentage';

export interface IFeeHead {
  _id: string;
  schoolId: string;
  title: string;
  amount: number;
  frequency: FeeFrequency;
  description?: string;
  classSectionId?: string;
  className?: string;
  academicYearId: string;
  academicYearName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IFeeStructure {
  _id: string;
  schoolId: string;
  name: string;
  classSectionId: string;
  className?: string;
  section?: string;
  academicYearId: string;
  academicYearName?: string;
  feeHeadIds: string[];
  feeHeads?: IFeeHead[];
  totalAmount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IFeeConcession {
  _id: string;
  schoolId: string;
  studentId: string;
  studentName?: string;
  studentAdmissionNumber?: string;
  className?: string;
  section?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  academicYearId: string;
  type: ConcessionType;
  discountType: ConcessionDiscountType;
  discountValue: number;
  amount: number;
  reason: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approverId?: string;
  approverName?: string;
  approvedAt?: string;
  auditHistory?: Array<{
    action: string;
    changedById: string;
    changedByName: string;
    timestamp: string;
    note?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface IDefaulterRecord {
  invoiceId: string;
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  rollNumber?: string;
  classSectionId: string;
  className: string;
  section: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  title: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  dueDate: string;
  overdueDays: number;
  status: FeeStatus;
}

export interface IFeeCollectionDashboard {
  grossInvoiced: number;
  totalConcessions: number;
  netInvoiced: number;
  totalCollected: number;
  outstandingBalance: number;
  collectionRate: number;
  totalInvoicesCount: number;
  paidInvoicesCount: number;
  defaultersCount: number;
  todayCollected: number;
  todayTransactionsCount: number;
  thisMonthCollected: number;
  methodBreakdown: Record<string, { count: number; totalAmount: number }>;
}

export interface IDailyFeeBookRecord {
  receiptNumber: string;
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  admissionNumber?: string;
  className: string;
  section: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionRef?: string;
  paymentDate: string;
  recordedById: string;
  recordedByName: string;
  notes?: string;
}

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'teacher', 'student', 'parent']).optional(),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterSchoolSchema = z.object({
  schoolName: z.string().min(2, 'School name must be at least 2 characters'),
  schoolCode: z
    .string()
    .min(2, 'School code must be at least 2 characters')
    .max(12, 'School code must be 12 characters or less')
    .regex(
      /^[A-Z0-9_-]+$/i,
      'School code must contain alphanumeric characters, hyphens, or underscores only'
    ),
  schoolEmail: z.string().email('Invalid school email address'),
  phone: z.string().min(7, 'Phone number must be at least 7 characters'),
  address: z.string().min(3, 'Address must be at least 3 characters'),
  adminName: z.string().min(2, 'Admin name must be at least 2 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  academicYear: z.string().default('2025-2026'),
});

export type RegisterSchoolInput = z.infer<typeof RegisterSchoolSchema>;

export const VerifyOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be exactly 6 digits'),
});

export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;

export const ResendOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  purpose: z
    .enum(['school_registration', 'password_reset'])
    .default('school_registration'),
});

export type ResendOtpInput = z.infer<typeof ResendOtpSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

export const VerifyResetOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().regex(/^\d{4}$/, 'OTP must be exactly 4 digits'),
});

export type VerifyResetOtpInput = z.infer<typeof VerifyResetOtpSchema>;

export const ResendResetOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type ResendResetOtpInput = z.infer<typeof ResendResetOtpSchema>;

export const ResetPasswordWithTokenSchema = z.object({
  resetToken: z.string().min(1, 'Reset authorization token is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  email: z.string().email('Invalid email address').optional(),
});

export type ResetPasswordWithTokenInput = z.infer<
  typeof ResetPasswordWithTokenSchema
>;

export const ResetPasswordSchema = z.union([
  z.object({
    resetToken: z.string().min(1, 'Reset authorization token is required'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    email: z.string().email('Invalid email address').optional(),
  }),
  z.object({
    email: z.string().email('Invalid email address'),
    code: z.string().regex(/^\d{4,6}$/, 'Reset code must be 4 to 6 digits'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  }),
]);

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export const StudentCreateSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  admissionNumber: z.string().optional(),
  rollNumber: z.string().min(1, 'Roll number is required'),
  gender: z.enum(['male', 'female', 'other']),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  bloodGroup: z.string().optional(),
  classSectionId: z.string().min(1, 'Class & Section is required'),
  parentName: z.string().optional(),
  parentEmail: z.string().email().optional().or(z.literal('')),
  parentPhone: z.string().optional(),
  parentRelationship: z.enum(['father', 'mother', 'guardian']).optional(),
  existingParentId: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  initialFeeAmount: z.number().nonnegative().optional(),
});

export type StudentCreateInput = z.infer<typeof StudentCreateSchema>;

export const StudentUpdateSchema = StudentCreateSchema.partial().extend({
  status: z.enum(['active', 'inactive', 'transferred', 'archived']).optional(),
});

export type StudentUpdateInput = z.infer<typeof StudentUpdateSchema>;

export const StudentDocumentSchema = z.object({
  title: z.string().min(1, 'Document title is required'),
  docType: z.enum([
    'birth_certificate',
    'transfer_certificate',
    'id_proof',
    'medical_record',
    'previous_marksheet',
    'other',
  ]),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z
    .union([z.number().nonnegative(), z.string().regex(/^\d+$/).transform(Number)])
    .optional(),
  publicId: z.string().optional(),
  resourceType: z.string().optional(),
  uploadedBy: z.string().optional(),
});

export type StudentDocumentInput = z.infer<typeof StudentDocumentSchema>;

export const TeacherCreateSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  employeeId: z.string().min(1, 'Employee ID is required'),
  phone: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']),
  qualification: z.string().min(2, 'Qualification is required'),
  specialization: z.string().min(2, 'Specialization is required'),
  experienceYears: z.number().int().min(0).optional(),
  joiningDate: z.string().min(1, 'Joining date is required'),
  assignedClasses: z
    .array(
      z.object({
        classSectionId: z.string(),
        subjectId: z.string(),
      })
    )
    .optional(),
});

export type TeacherCreateInput = z.infer<typeof TeacherCreateSchema>;

export const TeacherUpdateSchema = TeacherCreateSchema.partial().extend({
  status: z.enum(['active', 'on_leave', 'terminated', 'archived']).optional(),
});

export type TeacherUpdateInput = z.infer<typeof TeacherUpdateSchema>;

export const ParentCreateSchema = z.object({
  name: z.string().min(2, 'Parent name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(7, 'Phone number must be at least 7 digits'),
  relationship: z.enum(['father', 'mother', 'guardian']).default('guardian'),
  occupation: z.string().optional(),
  address: z.string().optional(),
  studentIds: z.array(z.string()).optional(),
});

export type ParentCreateInput = z.infer<typeof ParentCreateSchema>;

export const ParentLinkChildSchema = z.object({
  parentId: z.string().min(1, 'Parent ID is required'),
  studentId: z.string().min(1, 'Student ID is required'),
});

export type ParentLinkChildInput = z.infer<typeof ParentLinkChildSchema>;

export const AttendanceItemSchema = z.object({
  studentId: z.string(),
  studentName: z.string(),
  rollNumber: z.string(),
  status: z.enum(['present', 'absent', 'late', 'leave']),
  remarks: z.string().optional(),
});

export const AttendanceMarkSchema = z.object({
  classSectionId: z.string().min(1, 'Class section is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  academicYearId: z.string().optional(),
  subjectId: z.string().optional(),
  records: z
    .array(AttendanceItemSchema)
    .min(1, 'At least one student record is required'),
  isEdited: z.boolean().optional(),
  editReason: z.string().optional(),
});

export type AttendanceMarkInput = z.infer<typeof AttendanceMarkSchema>;

export const ExamSubjectConfigSchema = z.object({
  subjectId: z.string().min(1, 'Subject is required'),
  subjectName: z.string().min(1, 'Subject name is required'),
  maxMarks: z.number().positive('Max marks must be positive').default(100),
  passingMarks: z
    .number()
    .positive('Passing marks must be positive')
    .default(40),
  examDate: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

export type ExamSubjectConfigInput = z.infer<typeof ExamSubjectConfigSchema>;

export const GradingRuleSchema = z.object({
  minPercentage: z.number().min(0).max(100),
  maxPercentage: z.number().min(0).max(100),
  grade: z.string().min(1, 'Grade string is required'),
  remarks: z.string().optional(),
});

export type GradingRuleInput = z.infer<typeof GradingRuleSchema>;

export const ExamCreateSchema = z.object({
  name: z.string().min(2, 'Exam name is required'),
  type: z
    .enum([
      'unit_test',
      'term_exam',
      'final_exam',
      'quiz',
      'practical',
      'other',
    ])
    .default('unit_test'),
  classSectionId: z.string().optional(),
  academicYear: z.string().default('2025-2026'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  status: z
    .enum(['draft', 'scheduled', 'marks-entry', 'published', 'submitted'])
    .default('draft'),
  description: z.string().optional(),
  maxMarks: z.number().positive().optional().default(100),
  passingMarks: z.number().positive().optional().default(40),
  subjects: z.array(ExamSubjectConfigSchema).optional(),
  gradingRules: z.array(GradingRuleSchema).optional(),
});

export type ExamCreateInput = z.infer<typeof ExamCreateSchema>;

export const ExamUpdateSchema = ExamCreateSchema.partial();
export type ExamUpdateInput = z.infer<typeof ExamUpdateSchema>;

export const GradeItemSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  studentName: z.string().min(1, 'Student name is required'),
  rollNumber: z.string().min(1, 'Roll number is required'),
  marksObtained: z.number().min(0, 'Marks cannot be negative'),
  isAbsent: z.boolean().optional().default(false),
  remarks: z.string().optional(),
});

export type GradeItemInput = z.infer<typeof GradeItemSchema>;

export const GradeRecordSubmitSchema = z.object({
  examId: z.string().min(1, 'Exam ID is required'),
  classSectionId: z.string().min(1, 'Class section ID is required'),
  subjectId: z.string().min(1, 'Subject ID is required'),
  maxMarks: z.number().positive('Max marks must be positive').default(100),
  passingMarks: z
    .number()
    .positive('Passing marks must be positive')
    .default(40),
  grades: z.array(GradeItemSchema),
  status: z
    .enum(['draft', 'scheduled', 'marks-entry', 'submitted', 'published'])
    .default('draft'),
});

export type GradeRecordSubmitInput = z.infer<typeof GradeRecordSubmitSchema>;

export const GradeRecordCorrectionSchema = z.object({
  examId: z.string().min(1, 'Exam ID is required'),
  classSectionId: z.string().min(1, 'Class section ID is required'),
  subjectId: z.string().min(1, 'Subject ID is required'),
  studentId: z.string().min(1, 'Student ID is required'),
  marksObtained: z.number().min(0, 'Marks cannot be negative'),
  isAbsent: z.boolean().optional().default(false),
  reason: z
    .string()
    .min(3, 'Audit reason is required for correcting published marks'),
  remarks: z.string().optional(),
});

export type GradeRecordCorrectionInput = z.infer<
  typeof GradeRecordCorrectionSchema
>;

export const FeePaymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  amount: z.number().positive('Payment amount must be greater than 0'),
  paymentMethod: z.enum([
    'cash',
    'cheque',
    'dd',
    'online',
    'other',
    'card',
    'bank_transfer',
  ]),
  transactionRef: z.string().optional(),
  notes: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

export type FeePaymentInput = z.infer<typeof FeePaymentSchema>;

export const FeeHeadCreateSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  amount: z.number().int().positive('Amount must be a positive integer'),
  frequency: z.enum(['monthly', 'quarterly', 'yearly', 'one-time']),
  description: z.string().optional(),
  classSectionId: z.string().optional(),
  academicYearId: z.string().min(1, 'Academic year is required'),
});

export type FeeHeadCreateInput = z.infer<typeof FeeHeadCreateSchema>;

export const FeeHeadUpdateSchema = z.object({
  title: z.string().min(2).optional(),
  amount: z.number().int().positive().optional(),
  frequency: z.enum(['monthly', 'quarterly', 'yearly', 'one-time']).optional(),
  description: z.string().optional(),
  classSectionId: z.string().optional(),
});

export type FeeHeadUpdateInput = z.infer<typeof FeeHeadUpdateSchema>;

export const FeeStructureCreateSchema = z.object({
  name: z.string().min(2, 'Structure name is required'),
  classSectionId: z.string().min(1, 'Class is required'),
  academicYearId: z.string().min(1, 'Academic year is required'),
  feeHeadIds: z
    .array(z.string())
    .min(1, 'At least one fee head must be selected'),
});

export type FeeStructureCreateInput = z.infer<typeof FeeStructureCreateSchema>;

export const FeeStructureUpdateSchema = z.object({
  name: z.string().min(2, 'Structure name is required').optional(),
  classSectionId: z.string().min(1, 'Class is required').optional(),
  academicYearId: z.string().min(1, 'Academic year is required').optional(),
  feeHeadIds: z
    .array(z.string())
    .min(1, 'At least one fee head must be selected')
    .optional(),
  isActive: z.boolean().optional(),
});

export type FeeStructureUpdateInput = z.infer<typeof FeeStructureUpdateSchema>;

export const FeeInvoiceCreateSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  classSectionId: z.string().min(1, 'Class is required'),
  academicYearId: z.string().min(1, 'Academic year is required'),
  title: z.string().min(2, 'Invoice title is required'),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be YYYY-MM-DD'),
  items: z
    .array(
      z.object({
        feeHeadId: z.string().optional(),
        title: z.string().min(1, 'Item title is required'),
        amount: z.number().int().positive('Item amount must be positive'),
      })
    )
    .min(1, 'At least one item is required'),
  concessionId: z.string().optional(),
});

export type FeeInvoiceCreateInput = z.infer<typeof FeeInvoiceCreateSchema>;

export const FeeInvoiceUpdateSchema = z.object({
  title: z.string().min(2, 'Invoice title is required').optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be YYYY-MM-DD')
    .optional(),
  items: z
    .array(
      z.object({
        feeHeadId: z.string().optional(),
        title: z.string().min(1, 'Item title is required'),
        amount: z.number().int().positive('Item amount must be positive'),
      })
    )
    .min(1, 'At least one item is required')
    .optional(),
  totalAmount: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  status: z
    .enum([
      'pending',
      'partially paid',
      'paid',
      'overdue',
      'partial',
      'unpaid',
      'cancelled',
      'archived',
    ])
    .optional(),
});

export type FeeInvoiceUpdateInput = z.infer<typeof FeeInvoiceUpdateSchema>;

export const FeeInvoiceBulkCreateSchema = z.object({
  classSectionId: z.string().min(1, 'Class is required'),
  academicYearId: z.string().min(1, 'Academic year is required'),
  feeStructureId: z.string().optional(),
  title: z.string().min(2, 'Invoice title is required'),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be YYYY-MM-DD'),
  items: z
    .array(
      z.object({
        feeHeadId: z.string().optional(),
        title: z.string().min(1, 'Item title is required'),
        amount: z.number().int().positive('Item amount must be positive'),
      })
    )
    .optional(),
});

export type FeeInvoiceBulkCreateInput = z.infer<
  typeof FeeInvoiceBulkCreateSchema
>;

export const FeeConcessionCreateSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  invoiceId: z.string().optional(),
  academicYearId: z.string().min(1, 'Academic year is required'),
  type: z.enum([
    'merit',
    'sibling',
    'staff_child',
    'financial_aid',
    'special_waiver',
    'other',
  ]),
  discountType: z.enum(['fixed', 'percentage']),
  discountValue: z.number().positive('Discount value must be positive'),
  reason: z.string().min(3, 'Reason is required'),
});

export type FeeConcessionCreateInput = z.infer<
  typeof FeeConcessionCreateSchema
>;

export const FeeConcessionStatusUpdateSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  note: z.string().optional(),
});

export type FeeConcessionStatusUpdateInput = z.infer<
  typeof FeeConcessionStatusUpdateSchema
>;

export const NoticeCreateSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  content: z.string().min(5, 'Content is required'),
  targetRole: z.enum([
    'all',
    'teachers',
    'students',
    'parents',
    'class',
    'section',
  ]),
  targetClassId: z.string().optional(),
  targetSectionId: z.string().optional(),
  category: z
    .enum(['academic', 'holiday', 'event', 'administrative', 'urgent'])
    .default('academic'),
  isPinned: z.boolean().default(false),
  status: z
    .enum(['draft', 'scheduled', 'published', 'archived'])
    .default('published'),
  scheduledFor: z.string().optional(),
  expiresAt: z.string().optional(),
});

export type NoticeCreateInput = z.infer<typeof NoticeCreateSchema>;

export const NoticeUpdateSchema = NoticeCreateSchema.partial();
export type NoticeUpdateInput = z.infer<typeof NoticeUpdateSchema>;

export const NoticePublishSchema = z.object({
  status: z.enum(['published', 'archived', 'draft']),
});
export type NoticePublishInput = z.infer<typeof NoticePublishSchema>;

export const HomeworkCreateSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().min(5, 'Description / instructions required'),
  classSectionId: z.string().min(1, 'Class section is required'),
  subjectId: z.string().min(1, 'Subject is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  maxMarks: z.number().int().min(1).default(100),
  status: z.enum(['draft', 'published', 'closed']).default('published'),
  attachments: z
    .array(
      z.object({
        fileName: z.string(),
        fileUrl: z.string(),
        fileSize: z.number().optional(),
        fileType: z.string().optional(),
      })
    )
    .optional(),
});

export type HomeworkCreateInput = z.infer<typeof HomeworkCreateSchema>;

export const HomeworkSubmitSchema = z.object({
  submissionText: z.string().optional(),
  attachments: z
    .array(
      z.object({
        fileName: z.string(),
        fileUrl: z.string(),
        fileSize: z.number().optional(),
        fileType: z.string().optional(),
      })
    )
    .optional(),
});

export type HomeworkSubmitInput = z.infer<typeof HomeworkSubmitSchema>;

export const HomeworkGradeSchema = z.object({
  marksObtained: z.number().min(0, 'Marks cannot be negative'),
  feedback: z.string().optional(),
});

export type HomeworkGradeInput = z.infer<typeof HomeworkGradeSchema>;

export const TimetableSlotCreateSchema = z.object({
  classSectionId: z.string().min(1, 'Class section is required'),
  dayOfWeek: z.enum([
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ]),
  periodNumber: z.number().int().min(1).max(12),
  startTime: z.string().min(4, 'Start time is required (e.g. 09:00 AM)'),
  endTime: z.string().min(4, 'End time is required (e.g. 09:45 AM)'),
  subjectId: z.string().min(1, 'Subject is required'),
  teacherId: z.string().min(1, 'Teacher is required'),
  roomNumber: z.string().optional(),
  academicYearId: z.string().optional(),
});

export type TimetableSlotCreateInput = z.infer<
  typeof TimetableSlotCreateSchema
>;

export const TimetableSlotUpdateSchema = TimetableSlotCreateSchema.partial();
export type TimetableSlotUpdateInput = z.infer<
  typeof TimetableSlotUpdateSchema
>;

export const StudyMaterialCreateSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().optional(),
  classSectionId: z.string().min(1, 'Class section is required'),
  subjectId: z.string().min(1, 'Subject is required'),
  fileType: z.enum(['pdf', 'document', 'video', 'link']).default('pdf'),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
});

export type StudyMaterialCreateInput = z.infer<
  typeof StudyMaterialCreateSchema
>;

export const ConversationCreateSchema = z.object({
  type: z.enum(['admin_teacher', 'teacher_parent', 'general']),
  title: z.string().optional(),
  recipientUserId: z.string().min(1, 'Recipient user is required'),
  initialMessage: z.string().optional(),
});

export type ConversationCreateInput = z.infer<typeof ConversationCreateSchema>;

export const ChatMessageCreateSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  attachments: z
    .array(
      z.object({
        fileName: z.string(),
        fileUrl: z.string(),
        fileSize: z.number().optional(),
        fileType: z.string().optional(),
      })
    )
    .optional(),
});

export type ChatMessageCreateInput = z.infer<typeof ChatMessageCreateSchema>;

export const PermissionsUpdateSchema = z.object({
  teacherUserId: z.string(),
  permissions: z.array(z.string()),
  reason: z.string().optional(),
});

export type PermissionsUpdateInput = z.infer<typeof PermissionsUpdateSchema>;

export const AcademicYearCreateSchema = z.object({
  name: z
    .string()
    .min(
      4,
      'Academic year name must be at least 4 characters (e.g. 2025-2026)'
    ),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
  isCurrent: z.boolean().default(false),
  description: z.string().optional(),
});

export type AcademicYearCreateInput = z.infer<typeof AcademicYearCreateSchema>;

export const AcademicYearUpdateSchema = AcademicYearCreateSchema.partial();
export type AcademicYearUpdateInput = z.infer<typeof AcademicYearUpdateSchema>;

export const ClassSectionCreateSchema = z.object({
  name: z.string().min(1, 'Class name is required (e.g. Grade 10)'),
  section: z.string().min(1, 'Section is required (e.g. A)').max(5),
  roomNumber: z.string().optional(),
  capacity: z.number().int().positive().default(40),
  classTeacherId: z.string().optional().or(z.literal('')),
  academicYear: z.string().default('2025-2026'),
  academicYearId: z.string().optional(),
});

export type ClassSectionCreateInput = z.infer<typeof ClassSectionCreateSchema>;

export const ClassSectionUpdateSchema = ClassSectionCreateSchema.partial();
export type ClassSectionUpdateInput = z.infer<typeof ClassSectionUpdateSchema>;

export const SubjectCreateSchema = z.object({
  name: z.string().min(2, 'Subject name must be at least 2 characters'),
  code: z
    .string()
    .min(2, 'Subject code must be at least 2 characters')
    .max(10, 'Code must be 10 characters or less')
    .toUpperCase(),
  description: z.string().optional(),
  type: z.enum(['core', 'elective', 'extracurricular']).default('core'),
  credits: z.number().int().min(0).default(3),
});

export type SubjectCreateInput = z.infer<typeof SubjectCreateSchema>;

export const SubjectUpdateSchema = SubjectCreateSchema.partial();
export type SubjectUpdateInput = z.infer<typeof SubjectUpdateSchema>;

export const SchoolCalendarEventCreateSchema = z.object({
  title: z.string().min(2, 'Event title is required'),
  eventType: z
    .enum(['holiday', 'event', 'meeting', 'exam', 'other'])
    .default('event'),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
  isHoliday: z.boolean().default(false),
  description: z.string().optional(),
  targetAudience: z
    .enum(['all', 'teachers', 'students', 'parents'])
    .default('all'),
  academicYearId: z.string().optional(),
});

export type SchoolCalendarEventCreateInput = z.infer<
  typeof SchoolCalendarEventCreateSchema
>;

export const WorkingDaysUpdateSchema = z.object({
  workingDays: z
    .array(
      z.enum([
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ])
    )
    .min(1, 'At least one working day must be selected'),
});

export type WorkingDaysUpdateInput = z.infer<typeof WorkingDaysUpdateSchema>;

export const SchoolProfileUpdateSchema = z.object({
  name: z.string().min(2, 'School name must be at least 2 characters'),
  code: z
    .string()
    .min(2, 'School code must be at least 2 characters')
    .toUpperCase(),
  address: z.string().min(3, 'Address is required'),
  phone: z.string().min(7, 'Phone number is required'),
  email: z.string().email('Invalid email address'),
  website: z.string().optional(),
  logo: z.string().optional(),
  academicYear: z.string().optional(),
  workingDays: z.array(z.string()).optional(),
  branding: z
    .object({
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      tagline: z.string().optional(),
      logoUrl: z.string().optional(),
    })
    .optional(),
});

export type SchoolProfileUpdateInput = z.infer<
  typeof SchoolProfileUpdateSchema
>;

export const PERMISSIONS = {
  STUDENTS_VIEW: 'students.view' as const,
  STUDENTS_CREATE: 'students.create' as const,
  STUDENTS_UPDATE: 'students.update' as const,
  STUDENTS_DELETE: 'students.delete' as const,

  TEACHERS_VIEW: 'teachers.view' as const,

  ATTENDANCE_VIEW: 'attendance.view' as const,
  ATTENDANCE_MARK: 'attendance.mark' as const,
  ATTENDANCE_EDIT: 'attendance.edit' as const,

  FEES_VIEW: 'fees.view' as const,
  FEES_COLLECT: 'fees.collect' as const,
  FEES_EDIT: 'fees.edit' as const,
  FEES_RECEIPT: 'fees.receipt' as const,
  FINANCE_VIEW: 'finance.view' as const,
  FINANCE_MANAGE: 'finance.manage' as const,

  HOMEWORK_VIEW: 'homework.view' as const,
  HOMEWORK_CREATE: 'homework.create' as const,
  HOMEWORK_UPDATE: 'homework.update' as const,
  HOMEWORK_DELETE: 'homework.delete' as const,
  HOMEWORK_GRADE: 'homework.grade' as const,

  TIMETABLE_VIEW: 'timetable.view' as const,
  TIMETABLE_MANAGE: 'timetable.manage' as const,

  NOTICES_VIEW: 'notices.view' as const,
  NOTICES_CREATE: 'notices.create' as const,
  NOTICES_PUBLISH: 'notices.publish' as const,

  COMMUNICATION_VIEW: 'communication.view' as const,
  COMMUNICATION_CHAT: 'communication.chat' as const,
  COMMUNICATION_ANNOUNCEMENTS: 'communication.announcements' as const,

  EXAMS_VIEW: 'exams.view' as const,
  EXAMS_CREATE: 'exams.create' as const,
  EXAMS_EDIT: 'exams.edit' as const,
  EXAMS_UPDATE: 'exams.update' as const,
  EXAMS_DELETE: 'exams.delete' as const,

  MARKS_VIEW: 'marks.view' as const,
  MARKS_ENTER: 'marks.enter' as const,
  MARKS_EDIT: 'marks.edit' as const,
  RESULTS_VIEW: 'results.view' as const,
  RESULTS_PUBLISH: 'results.publish' as const,

  MATERIALS_VIEW: 'materials.view' as const,
  MATERIALS_UPLOAD: 'materials.upload' as const,
  MATERIALS_DELETE: 'materials.delete' as const,

  REPORTS_VIEW: 'reports.view' as const,
  REPORTS_GENERATE: 'reports.generate' as const,
  REPORTS_EXPORT: 'reports.export' as const,

  QUIZZES_VIEW: 'quizzes.view' as const,
  QUIZZES_CREATE: 'quizzes.create' as const,
  QUIZZES_UPDATE: 'quizzes.update' as const,
  QUIZZES_DELETE: 'quizzes.delete' as const,
  QUIZZES_PUBLISH: 'quizzes.publish' as const,
  QUIZZES_GRADE: 'quizzes.grade' as const,

  AI_USE: 'ai.use' as const,
  HOMEWORK_AI_HINT: 'homework.aiHint' as const,
  SETTINGS_VIEW: 'settings.view' as const,
  SETTINGS_EDIT: 'settings.edit' as const,
  ROLES_MANAGE: 'roles.manage' as const,

  STUDENTS_MANAGE: 'students.update' as const,
  TEACHERS_MANAGE: 'teachers.view' as const,
  FEES_MANAGE: 'fees.edit' as const,
  NOTICES_DELETE: 'notices.publish' as const,
  AUDIT_VIEW: 'reports.view' as const,
  MARKS_PUBLISH: 'results.publish' as const,
} as const;

export type Permission = PermissionKey;

export type PermissionModuleCategory =
  | 'Students'
  | 'Attendance'
  | 'Exams & Results'
  | 'Quizzes'
  | 'Homework'
  | 'Notice Board'
  | 'Teachers & Staff'
  | 'Fees & Finance'
  | 'Timetable & Materials'
  | 'Communication & AI'
  | 'Reports & Settings';

export interface PermissionDefinition {
  key: PermissionKey;
  label: string;
  category: PermissionModuleCategory;
  description: string;
  isDangerous?: boolean;
}

export const ALL_PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  {
    key: 'students.view',
    label: 'View All Students',
    category: 'Students',
    description:
      'Allows browsing student profiles, enrollment status, and parent details.',
  },
  {
    key: 'students.create',
    label: 'Create Student',
    category: 'Students',
    description: 'Allows enrolling new students and issuing credentials.',
    isDangerous: true,
  },
  {
    key: 'students.update',
    label: 'Edit Student',
    category: 'Students',
    description:
      'Allows modifying student profile information, section, and contact data.',
    isDangerous: true,
  },
  {
    key: 'students.delete',
    label: 'Delete Student',
    category: 'Students',
    description: 'Allows archiving or soft-deleting student records.',
    isDangerous: true,
  },

  {
    key: 'attendance.view',
    label: 'View Attendance',
    category: 'Attendance',
    description:
      'Allows viewing daily attendance statistics and class registers.',
  },
  {
    key: 'attendance.mark',
    label: 'Mark Attendance',
    category: 'Attendance',
    description:
      'Allows recording daily attendance rosters for assigned classes.',
  },
  {
    key: 'attendance.edit',
    label: 'Edit Attendance',
    category: 'Attendance',
    description:
      'Allows modifying previously submitted attendance records with an audit reason.',
    isDangerous: true,
  },

  {
    key: 'exams.view',
    label: 'View Exams',
    category: 'Exams & Results',
    description: 'Allows viewing examination schedules and exam details.',
  },
  {
    key: 'exams.create',
    label: 'Create Exam',
    category: 'Exams & Results',
    description:
      'Allows creating new exams and scheduling test papers for assigned classes.',
    isDangerous: true,
  },
  {
    key: 'exams.edit',
    label: 'Edit Exam',
    category: 'Exams & Results',
    description: 'Allows editing exam timetables and passing criteria.',
    isDangerous: true,
  },
  {
    key: 'exams.update',
    label: 'Update Exam',
    category: 'Exams & Results',
    description:
      'Allows updating exam schedules, dates, and subject configurations.',
    isDangerous: true,
  },
  {
    key: 'exams.delete',
    label: 'Delete Exam',
    category: 'Exams & Results',
    description: 'Allows cancelling or removing exam schedules.',
    isDangerous: true,
  },
  {
    key: 'marks.view',
    label: 'View Marks',
    category: 'Exams & Results',
    description:
      'Allows reviewing entered marks and student performance metrics.',
  },
  {
    key: 'marks.enter',
    label: 'Enter Marks',
    category: 'Exams & Results',
    description:
      'Allows inputting student marks and evaluation comments for assigned subjects.',
  },
  {
    key: 'marks.edit',
    label: 'Edit Marks',
    category: 'Exams & Results',
    description:
      'Allows revising previously entered marks prior to publication.',
    isDangerous: true,
  },
  {
    key: 'results.view',
    label: 'View Results',
    category: 'Exams & Results',
    description:
      'Allows viewing consolidated report cards and score summaries.',
  },
  {
    key: 'results.publish',
    label: 'Publish Results',
    category: 'Exams & Results',
    description:
      'Allows publishing final exam results to parents and students.',
    isDangerous: true,
  },

  {
    key: 'homework.view',
    label: 'View Homework',
    category: 'Homework',
    description: 'Allows viewing homework tasks and submission statuses.',
  },
  {
    key: 'homework.create',
    label: 'Assign Homework',
    category: 'Homework',
    description:
      'Allows creating and distributing new assignments to assigned classes.',
  },
  {
    key: 'homework.update',
    label: 'Edit Homework',
    category: 'Homework',
    description: 'Allows editing assignment deadlines and instructions.',
    isDangerous: true,
  },
  {
    key: 'homework.delete',
    label: 'Delete Homework',
    category: 'Homework',
    description: 'Allows removing assignments.',
    isDangerous: true,
  },
  {
    key: 'homework.grade',
    label: 'Grade Homework',
    category: 'Homework',
    description:
      'Allows reviewing student submissions and giving marks/feedback.',
  },

  {
    key: 'notices.view',
    label: 'View Notices',
    category: 'Notice Board',
    description: 'Allows reading general, departmental, and urgent notices.',
  },
  {
    key: 'notices.create',
    label: 'Post Notice',
    category: 'Notice Board',
    description:
      'Allows drafting and creating announcements for staff, students, or parents.',
  },
  {
    key: 'notices.publish',
    label: 'Post on Notice Board',
    category: 'Notice Board',
    description:
      'Allows broadcasting pinned notices directly onto the live school notice board.',
    isDangerous: true,
  },

  {
    key: 'teachers.view',
    label: 'View Teachers',
    category: 'Teachers & Staff',
    description:
      'Allows viewing faculty profiles, contact details, and department allocations.',
  },

  {
    key: 'fees.view',
    label: 'View Fees',
    category: 'Fees & Finance',
    description:
      'Allows reviewing fee structure records and student invoice balances.',
  },
  {
    key: 'fees.collect',
    label: 'Collect Fees',
    category: 'Fees & Finance',
    description:
      'Allows recording payments, handling fee balances, and confirming collections.',
    isDangerous: true,
  },
  {
    key: 'fees.edit',
    label: 'Edit Fees',
    category: 'Fees & Finance',
    description:
      'Allows modifying fee invoice line items or discounting tuition.',
    isDangerous: true,
  },
  {
    key: 'fees.receipt',
    label: 'Generate Receipts',
    category: 'Fees & Finance',
    description: 'Allows downloading and printing official payment receipts.',
  },
  {
    key: 'finance.view',
    label: 'View Finance',
    category: 'Fees & Finance',
    description:
      'Allows viewing financial revenue analytics and collection projections.',
  },
  {
    key: 'finance.manage',
    label: 'Manage Finance',
    category: 'Fees & Finance',
    description:
      'Allows adjusting financial accounts, bank reconciliations, and expense budgets.',
    isDangerous: true,
  },

  {
    key: 'timetable.view',
    label: 'View Timetable',
    category: 'Timetable & Materials',
    description:
      'Allows viewing bell schedules, classroom periods, and faculty rosters.',
  },
  {
    key: 'timetable.manage',
    label: 'Manage Timetable',
    category: 'Timetable & Materials',
    description:
      'Allows altering master period timetables and room assignments.',
    isDangerous: true,
  },
  {
    key: 'materials.view',
    label: 'View Study Materials',
    category: 'Timetable & Materials',
    description:
      'Allows browsing digital textbooks, syllabus guides, and classroom assets.',
  },
  {
    key: 'materials.upload',
    label: 'Upload Study Materials',
    category: 'Timetable & Materials',
    description:
      'Allows sharing lesson resources and documents for assigned subjects.',
  },
  {
    key: 'materials.delete',
    label: 'Delete Study Materials',
    category: 'Timetable & Materials',
    description: 'Allows deleting learning materials and lecture notes.',
    isDangerous: true,
  },

  {
    key: 'communication.view',
    label: 'View Communication',
    category: 'Communication & AI',
    description:
      'Allows viewing chat groups, message threads, and conversation activity.',
  },
  {
    key: 'communication.chat',
    label: 'Chat / Send Messages',
    category: 'Communication & AI',
    description:
      'Allows sending direct and group messages to permitted contacts.',
  },
  {
    key: 'communication.announcements',
    label: 'Broadcast Announcements',
    category: 'Communication & AI',
    description: 'Allows broadcasting urgent messages and school-wide banners.',
    isDangerous: true,
  },
  {
    key: 'ai.use',
    label: 'Use AI Assistant',
    category: 'Communication & AI',
    description:
      'Allows interacting with the Adiya AI tutor and administrative copilot.',
  },

  {
    key: 'reports.view',
    label: 'View Reports',
    category: 'Reports & Settings',
    description:
      'Allows viewing academic, demographic, and attendance analytical reports.',
  },
  {
    key: 'reports.generate',
    label: 'Generate Reports',
    category: 'Reports & Settings',
    description:
      'Allows compiling and generating customized academic and analytics reports.',
  },
  {
    key: 'reports.export',
    label: 'Export Reports',
    category: 'Reports & Settings',
    description: 'Allows downloading CSV and Excel exports of school data.',
  },
  {
    key: 'settings.view',
    label: 'View Settings',
    category: 'Reports & Settings',
    description:
      'Allows viewing institution preferences and system configurations.',
    isDangerous: true,
  },
  {
    key: 'settings.edit',
    label: 'Edit Settings',
    category: 'Reports & Settings',
    description:
      'Allows modifying school profile, session timings, and institution preferences.',
    isDangerous: true,
  },
  {
    key: 'homework.aiHint',
    label: 'AI Homework Hints',
    category: 'Homework',
    description:
      'Allows configuring and enabling progressive AI hints for homework assignments.',
  },
  {
    key: 'quizzes.view',
    label: 'View Quizzes',
    category: 'Quizzes',
    description:
      'Allows viewing subject quizzes, questions, and attempt summaries.',
  },
  {
    key: 'quizzes.create',
    label: 'Create Quizzes',
    category: 'Quizzes',
    description:
      'Allows authoring subject-wise quizzes and adding questions for assigned classes.',
  },
  {
    key: 'quizzes.update',
    label: 'Update Quizzes',
    category: 'Quizzes',
    description: 'Allows modifying existing draft quizzes and question items.',
  },
  {
    key: 'quizzes.delete',
    label: 'Delete Quizzes',
    category: 'Quizzes',
    description: 'Allows removing quizzes and question banks.',
    isDangerous: true,
  },
  {
    key: 'quizzes.publish',
    label: 'Publish Quizzes',
    category: 'Quizzes',
    description:
      'Allows publishing quizzes (minimum 10 unique questions required) to students.',
  },
  {
    key: 'quizzes.grade',
    label: 'Grade Quizzes',
    category: 'Quizzes',
    description:
      'Allows reviewing student quiz attempts, manual grading, and score adjustments.',
  },
  {
    key: 'roles.manage',
    label: 'Manage Roles & Permissions',
    category: 'Reports & Settings',
    description: 'Allows allocating system permissions and role assignments.',
    isDangerous: true,
  },
];

export const DEFAULT_TEACHER_PERMISSIONS: PermissionKey[] = [
  'attendance.view',
  'attendance.mark',
  'homework.view',
  'homework.create',
  'timetable.view',
  'notices.view',
  'communication.view',
  'communication.chat',
  'exams.view',
  'marks.view',
  'marks.enter',
  'results.view',
  'materials.view',
  'materials.upload',
  'quizzes.view',
  'quizzes.create',
  'homework.aiHint',
];

export const ALL_PERMISSIONS: PermissionKey[] = ALL_PERMISSION_DEFINITIONS.map(
  (p) => p.key
);

export function hasPermission(
  userRole: string,
  userPermissions: string[] | undefined,
  requiredPermission: PermissionKey | string
): boolean {
  if (userRole === 'admin') return true;
  if (!userPermissions || !Array.isArray(userPermissions)) return false;

  if (userPermissions.includes(requiredPermission as string)) return true;

  const dotToColon: Record<string, string> = {
    'attendance.mark': 'attendance:mark',
    'attendance.view': 'attendance:view',
    'attendance.edit': 'attendance:edit',
    'marks.enter': 'marks:enter',
    'marks.edit': 'marks:edit',
    'marks.view': 'marks:view',
    'results.publish': 'marks:publish',
    'students.view': 'students:view',
    'students.update': 'students:manage',
    'teachers.view': 'teachers:view',
    'fees.view': 'fees:view',
    'fees.collect': 'fees:collect',
    'notices.create': 'notices:create',
    'notices.publish': 'notices:delete',
  };

  const colonToDot: Record<string, string> = {
    'attendance:mark': 'attendance.mark',
    'attendance:view': 'attendance.view',
    'attendance:edit': 'attendance.edit',
    'marks:enter': 'marks.enter',
    'marks:edit': 'marks.edit',
    'marks:view': 'marks.view',
    'marks:publish': 'results.publish',
    'students:view': 'students.view',
    'students:manage': 'students.update',
    'teachers:view': 'teachers.view',
    'fees:view': 'fees.view',
    'fees:collect': 'fees.collect',
    'notices:create': 'notices.create',
    'notices:delete': 'notices.publish',
  };

  const altKey =
    dotToColon[requiredPermission] || colonToDot[requiredPermission];
  if (altKey && userPermissions.includes(altKey)) {
    return true;
  }

  const synonyms: Record<string, string[]> = {
    'exams.edit': ['exams.update'],
    'exams.update': ['exams.edit'],
    'reports.generate': ['reports.export'],
    'reports.export': ['reports.generate'],
    'settings.edit': ['settings.view'],
  };

  const matchedSynonyms = synonyms[requiredPermission];
  if (matchedSynonyms) {
    for (const syn of matchedSynonyms) {
      if (userPermissions.includes(syn)) return true;
    }
  }

  return false;
}

export type ExpenseCategory =
  | 'salaries'
  | 'utilities'
  | 'maintenance'
  | 'supplies'
  | 'events'
  | 'technology'
  | 'transportation'
  | 'laboratory'
  | 'other';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'salaries',
  'utilities',
  'maintenance',
  'supplies',
  'events',
  'technology',
  'transportation',
  'laboratory',
  'other',
];

export interface IExpense {
  _id: string;
  schoolId: string;
  category: ExpenseCategory;
  title: string;
  amount: number;
  payee: string;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  description?: string;
  attachmentName?: string;
  attachmentUrl?: string;
  attachmentSize?: number;
  recordedById: string;
  recordedByName: string;
  createdAt: string;
  updatedAt: string;
}

export const ExpenseCreateSchema = z.object({
  category: z.enum([
    'salaries',
    'utilities',
    'maintenance',
    'supplies',
    'events',
    'technology',
    'transportation',
    'laboratory',
    'other',
  ]),
  title: z.string().min(2, 'Title must be at least 2 characters'),
  amount: z.number().positive('Amount must be greater than zero'),
  payee: z.string().min(2, 'Payee must be at least 2 characters'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  paymentMethod: z.enum([
    'cash',
    'bank_transfer',
    'cheque',
    'upi',
    'card',
    'online',
  ]),
  description: z.string().optional(),
  attachmentName: z.string().optional(),
  attachmentUrl: z.string().optional(),
  attachmentSize: z.number().optional(),
});

export type ExpenseCreateInput = z.infer<typeof ExpenseCreateSchema>;

export interface IFinanceSummary {
  startDate: string;
  endDate: string;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  receiptsCount: number;
  expensesCount: number;
  categoryBreakdown: Array<{
    category: ExpenseCategory;
    amount: number;
    count: number;
    percentage: number;
  }>;
  methodBreakdown: Array<{
    method: PaymentMethod;
    incomeAmount: number;
    expenseAmount: number;
  }>;
}

export interface IReportStudentStrength {
  classSectionId: string;
  className: string;
  section: string;
  capacity: number;
  totalEnrolled: number;
  boys: number;
  girls: number;
  other: number;
  availableSeats: number;
  occupancyRate: number;
}

export interface IReportAttendanceDaily {
  date: string;
  className: string;
  section: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  leave: number;
  rate: number;
}

export interface IReportAttendanceMonthly {
  month: string;
  className: string;
  section: string;
  workingDays: number;
  avgRate: number;
  totalStudents: number;
}

export interface IReportFeeDefaulter {
  studentId: string;
  studentName: string;
  rollNumber: string;
  className: string;
  section: string;
  parentName: string;
  parentPhone: string;
  balance: number;
  dueDate: string;
  overdueDays: number;
}

export interface IReportFeesSummary {
  billed: number;
  collected: number;
  outstanding: number;
  collectionRate: number;
  defaultersCount: number;
  defaulters: IReportFeeDefaulter[];
}

export interface IReportExamPerformance {
  examId: string;
  examName: string;
  className: string;
  section: string;
  totalStudents: number;
  appeared: number;
  passed: number;
  failed: number;
  passRate: number;
  averageMarks: number;
  gradeDistribution: Record<string, number>;
  subjectAverages: Array<{
    subjectName: string;
    code: string;
    averageMarks: number;
    maxMarks: number;
  }>;
}

export interface IReportHomeworkCompletion {
  classSectionId: string;
  className: string;
  section: string;
  subject: string;
  totalHomework: number;
  totalSubmissionsExpected: number;
  submittedOnTime: number;
  submittedLate: number;
  pendingSubmissions: number;
  completionRate: number;
}

export interface IGradingPolicyTier {
  grade: string;
  minPercentage: number;
  maxPercentage: number;
  remark: string;
}

export interface ISchoolSettings {
  school: ISchool & {
    workingDays: string[];
    branding?: {
      primaryColor?: string;
      secondaryColor?: string;
      tagline?: string;
      logoUrl?: string;
    };
  };
  academicYear: {
    name: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
  };
  workingDays: string[];
  gradingPolicy: {
    tiers: IGradingPolicyTier[];
    passingPercentage: number;
  };
  attendancePolicy: {
    minimumPercentage: number;
    lateToAbsentRatio: number;
    defaultNotificationChannel: 'sms' | 'email' | 'in_app';
  };
  receiptPolicy: {
    prefix: string;
    currentCounter: number;
  };
  notificationSettings: {
    absentAlerts: boolean;
    feeReminders: boolean;
    examAlerts: boolean;
    homeworkAlerts: boolean;
  };
  userStats: {
    totalStudents: number;
    totalTeachers: number;
    totalParents: number;
    activeUsers: number;
    suspendedUsers: number;
  };
}

export const SchoolSettingsUpdateSchema = z.object({
  schoolName: z.string().min(2).optional(),
  phone: z.string().min(7).optional(),
  email: z.string().email().optional(),
  address: z.string().min(3).optional(),
  website: z.string().optional(),
  logoUrl: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  tagline: z.string().optional(),
  workingDays: z.array(z.string()).min(1).optional(),
  gradingPassingPercentage: z.number().min(0).max(100).optional(),
  attendanceMinimumPercentage: z.number().min(0).max(100).optional(),
  lateToAbsentRatio: z.number().min(1).max(10).optional(),
  defaultNotificationChannel: z.enum(['sms', 'email', 'in_app']).optional(),
  receiptPrefix: z.string().min(2).optional(),
  absentAlerts: z.boolean().optional(),
  feeReminders: z.boolean().optional(),
  examAlerts: z.boolean().optional(),
  homeworkAlerts: z.boolean().optional(),
});

export type SchoolSettingsUpdateInput = z.infer<
  typeof SchoolSettingsUpdateSchema
>;

export const BackupPayloadSchema = z.object({
  version: z.string().min(1),
  schoolCode: z.string().min(1),
  exportDate: z.string().min(1),
  collections: z.record(z.array(z.any())),
  metadata: z.record(z.any()).optional(),
});

export type BackupPayload = z.infer<typeof BackupPayloadSchema>;

export const AiAssistantRequestSchema = z.object({
  prompt: z.string().trim().min(3, 'Prompt must be at least 3 characters'),
  category: z
    .enum([
      'notice_draft',
      'attendance_summary',
      'fee_summary',
      'report_explanation',
      'general',
    ])
    .default('general'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  classSectionId: z.string().optional(),
});

export type AiAssistantRequest = z.infer<typeof AiAssistantRequestSchema>;

export const QuizQuestionTypeSchema = z.enum([
  'mcq',
  'true_false',
  'fill_in_the_blank',
  'short_answer',
]);
export type QuizQuestionType = z.infer<typeof QuizQuestionTypeSchema>;

export const QuizQuestionSchema = z.object({
  id: z.string().min(1),
  questionText: z
    .string()
    .trim()
    .min(3, 'Question text must be at least 3 characters'),
  questionType: QuizQuestionTypeSchema,
  options: z.array(z.string().trim()).optional(),
  correctAnswer: z.string().trim().min(1, 'Correct answer is required'),
  explanation: z.string().trim().optional(),
  marks: z.number().int().min(1, 'Marks must be at least 1').default(1),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium').optional(),
});
export type IQuizQuestion = z.infer<typeof QuizQuestionSchema>;

export const QuizBaseObjectSchema = z.object({
  title: z.string().trim().min(3, 'Quiz title must be at least 3 characters'),
  description: z.string().trim().optional(),
  subjectId: z.string().min(1, 'Subject is required'),
  classSectionId: z.string().min(1, 'Class & Section is required'),
  duration: z.number().int().min(1).max(180).default(15),
  totalMarks: z.number().int().min(1).optional(),
  passingMarks: z.number().int().min(1).optional(),
  dueDate: z.string().min(1, 'Due date is required'),
  allowReview: z.boolean().default(true),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  questions: z.array(QuizQuestionSchema).refine(
    (qs) => {
      const texts = qs.map((q) => q.questionText.trim().toLowerCase());
      return new Set(texts).size === texts.length;
    },
    {
      message:
        'Every question must be unique. Duplicate questions are not allowed in the same quiz.',
    }
  ),
});

export const QuizCreateSchema = QuizBaseObjectSchema.refine(
  (data) => {
    if (data.status === 'published') {
      return data.questions.length >= 10;
    }
    return true;
  },
  {
    message:
      'A quiz must contain at least 10 unique questions to be published.',
    path: ['questions'],
  }
);
export type QuizCreateInput = z.infer<typeof QuizCreateSchema>;

export const QuizUpdateSchema = QuizBaseObjectSchema.partial();
export type QuizUpdateInput = z.infer<typeof QuizUpdateSchema>;

export const QuizAnswerSubmissionItemSchema = z.object({
  questionId: z.string().min(1),
  studentAnswer: z.string().trim(),
  isFlaggedForReview: z.boolean().optional(),
});

export const QuizSubmitSchema = z.object({
  answers: z.array(QuizAnswerSubmissionItemSchema),
  durationTakenSeconds: z.number().int().min(0).optional(),
});
export type QuizSubmitInput = z.infer<typeof QuizSubmitSchema>;

export const QuizSaveAnswersSchema = z.object({
  answers: z.array(QuizAnswerSubmissionItemSchema),
});
export type QuizSaveAnswersInput = z.infer<typeof QuizSaveAnswersSchema>;

export interface IQuizSummary {
  _id: string;
  schoolId: string;
  title: string;
  description?: string;
  subjectId: string;
  subjectName: string;
  classSectionId: string;
  classSectionName: string;
  teacherId: string;
  teacherName?: string;
  duration: number;
  totalQuestions: number;
  totalMarks: number;
  passingMarks: number;
  dueDate: string;
  status: 'draft' | 'published' | 'archived';
  allowReview: boolean;
  attemptCount: number;
  myAttempt?: {
    attemptId: string;
    status: 'in_progress' | 'submitted' | 'auto_submitted';
    totalMarksObtained: number;
    percentage: number;
    isPassed: boolean;
    submittedAt?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface IQuizStudentView {
  _id: string;
  schoolId: string;
  title: string;
  description?: string;
  subjectId: string;
  subjectName: string;
  classSectionId: string;
  classSectionName: string;
  duration: number;
  totalQuestions: number;
  totalMarks: number;
  passingMarks: number;
  dueDate: string;
  status: 'draft' | 'published' | 'archived';
  allowReview: boolean;
  questions: Array<{
    id: string;
    questionText: string;
    questionType: QuizQuestionType;
    options?: string[];
    marks: number;
    difficulty?: 'easy' | 'medium' | 'hard';
  }>;
}

export interface IQuizAttemptResult {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  subjectName: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  startedAt: string;
  submittedAt: string;
  durationTakenSeconds: number;
  status: 'in_progress' | 'submitted' | 'auto_submitted';
  totalQuestions: number;
  attemptedQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedQuestions: number;
  totalMarksObtained: number;
  maxMarks: number;
  percentage: number;
  isPassed: boolean;
  allowReview: boolean;
  reviewItems?: Array<{
    questionId: string;
    questionText: string;
    questionType: QuizQuestionType;
    options?: string[];
    studentAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    marksAwarded: number;
    maxMarks: number;
    explanation?: string;
  }>;
}

export const HomeworkAiHintRequestSchema = z.object({
  studentAttempt: z.string().trim().optional(),
  hintLevel: z.number().int().min(1).max(4).default(1),
  followUpQuestion: z.string().trim().optional(),
});
export type HomeworkAiHintRequestInput = z.infer<
  typeof HomeworkAiHintRequestSchema
>;

export interface IHomeworkAiHintResponse {
  success: boolean;
  hint: string;
  concept: string;
  nextStep: string;
  selfCheckQuestion: string;
  difficulty: 'easy' | 'medium' | 'hard';
  isFinalAnswerHidden: boolean;
  message: string;
  hintLevel: number;
  remainingHints: number;
  homeworkId: string;
  subjectName: string;
}

export const QuizAiGenerateSchema = z.object({
  subjectName: z.string().trim().min(1, 'Subject name is required'),
  topic: z.string().trim().min(2, 'Topic must be at least 2 characters'),
  classLevel: z.string().trim().optional(),
  numQuestions: z.number().int().min(5).max(25).default(10),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
});
export type QuizAiGenerateInput = z.infer<typeof QuizAiGenerateSchema>;

export interface IQuizAiGeneratedResponse {
  success: boolean;
  topic: string;
  subjectName: string;
  difficulty: 'easy' | 'medium' | 'hard';
  provider: 'gemini' | 'mock';
  questions: Array<{
    id: string;
    questionText: string;
    questionType: QuizQuestionType;
    options?: string[];
    correctAnswer: string;
    explanation?: string;
    marks: number;
    difficulty?: 'easy' | 'medium' | 'hard';
  }>;
}
