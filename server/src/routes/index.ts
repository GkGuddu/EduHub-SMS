import { Router, Request, Response, NextFunction } from 'express';
import {
  requireAuth,
  requireRole,
  requirePermission,
  requireAnyPermission,
  validate,
  loginRateLimiter,
  otpRateLimiter,
  passwordResetRateLimiter,
} from '../middleware';
import { uploadSinglePdf, uploadSingleImage } from '../middleware/upload';
import {
  PERMISSIONS,
  hasPermission,
  LoginSchema,
  RegisterSchoolSchema,
  VerifyOtpSchema,
  ResendOtpSchema,
  ForgotPasswordSchema,
  VerifyResetOtpSchema,
  ResendResetOtpSchema,
  ResetPasswordSchema,
  ChangePasswordSchema,
  AttendanceMarkSchema,
  ExamCreateSchema,
  ExamUpdateSchema,
  GradeRecordSubmitSchema,
  GradeRecordCorrectionSchema,
  FeePaymentSchema,
  FeeInvoiceCreateSchema,
  FeeInvoiceUpdateSchema,
  FeeInvoiceBulkCreateSchema,
  FeeHeadCreateSchema,
  FeeHeadUpdateSchema,
  FeeStructureCreateSchema,
  FeeStructureUpdateSchema,
  FeeConcessionCreateSchema,
  FeeConcessionStatusUpdateSchema,
  NoticeCreateSchema,
  ParentCreateSchema,
  ParentLinkChildSchema,
  PermissionsUpdateSchema,
  StudentCreateSchema,
  StudentUpdateSchema,
  StudentDocumentSchema,
  TeacherCreateSchema,
  TeacherUpdateSchema,
} from '@eduhub/shared';

import {
  login,
  getMe,
  logout,
  registerSchool,
  resendOtp,
  verifyOtp,
  forgotPassword,
  verifyResetOtp,
  resendResetOtp,
  resetPassword,
  changePassword,
  getCsrfToken,
} from '../controllers/authController';
import {
  getAcademicYears,
  createAcademicYear,
  updateAcademicYear,
  setCurrentAcademicYear,
  deleteAcademicYear,
  getClasses,
  createClass,
  updateClass,
  deleteClass,
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  getAssignments,
  assignSubjectTeacher,
  deleteAssignment,
  getCalendarEvents,
  createCalendarEvent,
  deleteCalendarEvent,
  getWorkingDays,
  updateWorkingDays,
  getSchoolProfile,
  updateSchoolProfile,
} from '../controllers/academicController';
import {
  getAttendance,
  markAttendance,
  getAttendanceSummary,
  getDailyReport,
  getWeeklyReport,
  getMonthlyReport,
  getStudentAttendanceReport,
  getParentChildAttendance,
  getStudentPersonalAttendance,
  getGuardianAlerts,
} from '../controllers/attendanceController';
import { getAuditLogs } from '../controllers/auditController';
import {
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
  markAsRead as markCommunicationAsRead,
  getAvailableRecipients,
} from '../controllers/communicationController';
import { getDashboardStats } from '../controllers/dashboardController';
import {
  getExams,
  createExam,
  updateExam,
  deleteExam,
  getGrades,
  submitGrades,
  correctGrade,
  publishGrades,
  getStudentReportCard,
} from '../controllers/examController';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  bulkGenerateInvoices,
  recordPayment,
  getReceipt,
  getFeeHeads,
  createFeeHead,
  updateFeeHead,
  deleteFeeHead,
  getFeeStructures,
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure,
  getConcessions,
  createConcession,
  updateConcessionStatus,
  getDefaultersReport,
  getCollectionDashboard,
  getDailyFeeBook,
} from '../controllers/feeController';
import {
  getExpenses,
  createExpense,
  deleteExpense,
  getFinanceSummary,
} from '../controllers/financeController';
import {
  getHomework,
  createHomework,
  getHomeworkSubmissions,
  submitHomework,
  gradeHomeworkSubmission,
  getHomeworkAiHint,
  getTimetable,
  createTimetableSlot,
  deleteTimetableSlot,
  getMaterials,
  createMaterial,
  getCommunicationStats,
  promptAiAssistant,
  getAiStatus,
} from '../controllers/moduleController';
import {
  getNotices,
  createNotice,
  publishNotice,
  archiveNotice,
  deleteNotice,
} from '../controllers/noticeController';
import {
  getMyNotifications,
  markAsRead as markNotificationAsRead,
} from '../controllers/notificationController';
import {
  getParents,
  getParentById,
  createParent,
  linkChild,
  unlinkChild,
  uploadParentPhoto,
  deleteParentPhoto,
} from '../controllers/parentController';
import {
  listQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  publishQuiz,
  deleteQuiz,
  startQuizAttempt,
  saveQuizAnswers,
  submitQuiz,
  getStudentQuizResult,
  getTeacherQuizReports,
  getParentChildQuizzes,
  generateAiQuiz,
} from '../controllers/quizController';
import {
  getStudentStrengthReport,
  getAttendanceReport,
  getFeesReport,
  getExamPerformanceReport,
  getHomeworkReport,
  exportCsvReport,
} from '../controllers/reportController';
import {
  getTeacherPermissionsList,
  updateTeacherPermissions,
} from '../controllers/roleController';
import {
  getSettings,
  updateSettings,
  exportBackup,
  restoreBackup,
} from '../controllers/settingsController';
import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  archiveStudent,
  restoreStudent,
  addStudentDocument,
  deleteStudentDocument,
  getStudentDocumentFile,
  uploadStudentPhoto,
  deleteStudentPhoto,
  getSuggestedAdmissionNumber,
} from '../controllers/studentController';
import {
  getTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  archiveTeacher,
  restoreTeacher,
  uploadTeacherPhoto,
  deleteTeacherPhoto,
} from '../controllers/teacherController';

const router = Router();

const authRouter = Router();
authRouter.get('/csrf-token', getCsrfToken);
authRouter.post('/login', loginRateLimiter, validate(LoginSchema), login);
authRouter.get('/me', requireAuth, getMe);
authRouter.post('/logout', logout);
authRouter.post(
  '/register-school',
  otpRateLimiter,
  validate(RegisterSchoolSchema),
  registerSchool
);
authRouter.post(
  '/resend-otp',
  otpRateLimiter,
  validate(ResendOtpSchema),
  resendOtp
);
authRouter.post(
  '/verify-otp',
  otpRateLimiter,
  validate(VerifyOtpSchema),
  verifyOtp
);
authRouter.post(
  '/forgot-password',
  passwordResetRateLimiter,
  validate(ForgotPasswordSchema),
  forgotPassword
);
authRouter.post(
  '/verify-reset-otp',
  otpRateLimiter,
  validate(VerifyResetOtpSchema),
  verifyResetOtp
);
authRouter.post(
  '/resend-reset-otp',
  otpRateLimiter,
  validate(ResendResetOtpSchema),
  resendResetOtp
);
authRouter.post(
  '/reset-password',
  passwordResetRateLimiter,
  validate(ResetPasswordSchema),
  resetPassword
);
authRouter.post(
  '/change-password',
  requireAuth,
  validate(ChangePasswordSchema),
  changePassword
);

const academicRouter = Router();
academicRouter.use(requireAuth);
academicRouter.get('/academic-years', getAcademicYears);
academicRouter.post(
  '/academic-years',
  requireRole('admin'),
  createAcademicYear
);
academicRouter.put(
  '/academic-years/:id',
  requireRole('admin'),
  updateAcademicYear
);
academicRouter.patch(
  '/academic-years/:id/set-current',
  requireRole('admin'),
  setCurrentAcademicYear
);
academicRouter.delete(
  '/academic-years/:id',
  requireRole('admin'),
  deleteAcademicYear
);
academicRouter.get('/classes', getClasses);
academicRouter.post('/classes', requireRole('admin'), createClass);
academicRouter.put('/classes/:id', requireRole('admin'), updateClass);
academicRouter.delete('/classes/:id', requireRole('admin'), deleteClass);
academicRouter.get('/subjects', getSubjects);
academicRouter.post('/subjects', requireRole('admin'), createSubject);
academicRouter.put('/subjects/:id', requireRole('admin'), updateSubject);
academicRouter.delete('/subjects/:id', requireRole('admin'), deleteSubject);
academicRouter.get('/assignments', getAssignments);
academicRouter.post('/assignments', requireRole('admin'), assignSubjectTeacher);
academicRouter.delete(
  '/assignments/:id',
  requireRole('admin'),
  deleteAssignment
);
academicRouter.get('/calendar-events', getCalendarEvents);
academicRouter.post(
  '/calendar-events',
  requireRole('admin'),
  createCalendarEvent
);
academicRouter.delete(
  '/calendar-events/:id',
  requireRole('admin'),
  deleteCalendarEvent
);
academicRouter.get('/working-days', getWorkingDays);
academicRouter.put('/working-days', requireRole('admin'), updateWorkingDays);
academicRouter.get('/school-profile', getSchoolProfile);
academicRouter.put(
  '/school-profile',
  requireRole('admin'),
  updateSchoolProfile
);

const attendanceRouter = Router();
attendanceRouter.use(requireAuth);
attendanceRouter.get(
  '/summary',
  requirePermission(PERMISSIONS.ATTENDANCE_VIEW),
  getAttendanceSummary
);
attendanceRouter.get(
  '/reports/daily',
  requirePermission(PERMISSIONS.ATTENDANCE_VIEW),
  getDailyReport
);
attendanceRouter.get(
  '/reports/weekly',
  requirePermission(PERMISSIONS.ATTENDANCE_VIEW),
  getWeeklyReport
);
attendanceRouter.get(
  '/reports/monthly',
  requirePermission(PERMISSIONS.ATTENDANCE_VIEW),
  getMonthlyReport
);
attendanceRouter.get('/reports/student/:studentId', getStudentAttendanceReport);
attendanceRouter.get('/my-child/:studentId', getParentChildAttendance);
attendanceRouter.get('/my-student', getStudentPersonalAttendance);
attendanceRouter.get(
  '/guardian-alerts',
  requirePermission(PERMISSIONS.ATTENDANCE_VIEW),
  getGuardianAlerts
);
attendanceRouter.get(
  '/',
  requirePermission(PERMISSIONS.ATTENDANCE_VIEW),
  getAttendance
);
attendanceRouter.post(
  '/',
  requirePermission(PERMISSIONS.ATTENDANCE_MARK),
  validate(AttendanceMarkSchema),
  markAttendance
);

const auditRouter = Router();
auditRouter.use(requireAuth);
auditRouter.use(requirePermission(PERMISSIONS.AUDIT_VIEW));
auditRouter.get('/', getAuditLogs);

const communicationRouter = Router();
communicationRouter.use(requireAuth);
communicationRouter.get('/recipients', getAvailableRecipients);
communicationRouter.get('/', getConversations);
communicationRouter.post('/', createConversation);
communicationRouter.get('/:id/messages', getMessages);
communicationRouter.post('/:id/messages', sendMessage);
communicationRouter.post('/:id/read', markCommunicationAsRead);

const dashboardRouter = Router();
dashboardRouter.use(requireAuth);
dashboardRouter.get('/stats', getDashboardStats);

const examRouter = Router();
examRouter.use(requireAuth);
examRouter.get('/', requirePermission(PERMISSIONS.EXAMS_VIEW), getExams);
examRouter.post(
  '/',
  requirePermission(PERMISSIONS.EXAMS_CREATE),
  validate(ExamCreateSchema),
  createExam
);
examRouter.put(
  '/:id',
  requirePermission(PERMISSIONS.EXAMS_EDIT),
  validate(ExamUpdateSchema),
  updateExam
);
examRouter.delete(
  '/:id',
  requirePermission(PERMISSIONS.EXAMS_DELETE),
  deleteExam
);
examRouter.get('/grades', requirePermission(PERMISSIONS.MARKS_VIEW), getGrades);
examRouter.post(
  '/grades',
  requireAnyPermission(PERMISSIONS.MARKS_ENTER, PERMISSIONS.MARKS_EDIT),
  validate(GradeRecordSubmitSchema),
  submitGrades
);
examRouter.post(
  '/correct-grade',
  requirePermission(PERMISSIONS.MARKS_EDIT),
  validate(GradeRecordCorrectionSchema),
  correctGrade
);
examRouter.post(
  '/publish',
  requirePermission(PERMISSIONS.RESULTS_PUBLISH),
  publishGrades
);
examRouter.get(
  '/report-card',
  requirePermission(PERMISSIONS.RESULTS_VIEW),
  getStudentReportCard
);

function requireFeeViewOrSelf(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res
      .status(401)
      .json({ success: false, message: 'Authentication required' });
    return;
  }
  if (
    req.user.role === 'student' ||
    req.user.role === 'parent' ||
    req.user.role === 'admin'
  ) {
    next();
    return;
  }
  if (req.user.role === 'teacher') {
    if (
      hasPermission(req.user.role, req.user.permissions, PERMISSIONS.FEES_VIEW)
    ) {
      next();
      return;
    }
    res.status(403).json({
      success: false,
      message: `Forbidden: You do not possess the required permission '${PERMISSIONS.FEES_VIEW}'.`,
      requiredPermission: PERMISSIONS.FEES_VIEW,
    });
    return;
  }
  next();
}

function requireReceiptViewOrSelf(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    res
      .status(401)
      .json({ success: false, message: 'Authentication required' });
    return;
  }
  if (
    req.user.role === 'student' ||
    req.user.role === 'parent' ||
    req.user.role === 'admin'
  ) {
    next();
    return;
  }
  if (req.user.role === 'teacher') {
    if (
      hasPermission(
        req.user.role,
        req.user.permissions,
        PERMISSIONS.FEES_RECEIPT
      ) ||
      hasPermission(req.user.role, req.user.permissions, PERMISSIONS.FEES_VIEW)
    ) {
      next();
      return;
    }
    res.status(403).json({
      success: false,
      message: `Forbidden: You do not possess the required permission '${PERMISSIONS.FEES_RECEIPT}'.`,
      requiredPermission: PERMISSIONS.FEES_RECEIPT,
    });
    return;
  }
  next();
}

const feeRouter = Router();
feeRouter.use(requireAuth);
feeRouter.get('/', requireFeeViewOrSelf, getInvoices);
feeRouter.post(
  '/invoices',
  requirePermission(PERMISSIONS.FEES_EDIT),
  validate(FeeInvoiceCreateSchema),
  createInvoice
);
feeRouter.get('/invoices/:id', requireFeeViewOrSelf, getInvoiceById);
feeRouter.put(
  '/invoices/:id',
  requirePermission(PERMISSIONS.FEES_EDIT),
  validate(FeeInvoiceUpdateSchema),
  updateInvoice
);
feeRouter.delete(
  '/invoices/:id',
  requirePermission(PERMISSIONS.FEES_EDIT),
  deleteInvoice
);
feeRouter.post(
  '/invoices/bulk-generate',
  requirePermission(PERMISSIONS.FEES_EDIT),
  validate(FeeInvoiceBulkCreateSchema),
  bulkGenerateInvoices
);
feeRouter.post(
  '/pay',
  requirePermission(PERMISSIONS.FEES_COLLECT),
  validate(FeePaymentSchema),
  recordPayment
);
feeRouter.get('/receipt/:receiptNumber', requireReceiptViewOrSelf, getReceipt);
feeRouter.get('/heads', requirePermission(PERMISSIONS.FEES_VIEW), getFeeHeads);
feeRouter.post(
  '/heads',
  requirePermission(PERMISSIONS.FEES_EDIT),
  validate(FeeHeadCreateSchema),
  createFeeHead
);
feeRouter.put(
  '/heads/:id',
  requirePermission(PERMISSIONS.FEES_EDIT),
  validate(FeeHeadUpdateSchema),
  updateFeeHead
);
feeRouter.delete(
  '/heads/:id',
  requirePermission(PERMISSIONS.FEES_EDIT),
  deleteFeeHead
);
feeRouter.get(
  '/structures',
  requirePermission(PERMISSIONS.FEES_VIEW),
  getFeeStructures
);
feeRouter.post(
  '/structures',
  requirePermission(PERMISSIONS.FEES_EDIT),
  validate(FeeStructureCreateSchema),
  createFeeStructure
);
feeRouter.put(
  '/structures/:id',
  requirePermission(PERMISSIONS.FEES_EDIT),
  validate(FeeStructureUpdateSchema),
  updateFeeStructure
);
feeRouter.delete(
  '/structures/:id',
  requirePermission(PERMISSIONS.FEES_EDIT),
  deleteFeeStructure
);
feeRouter.get(
  '/concessions',
  requirePermission(PERMISSIONS.FEES_VIEW),
  getConcessions
);
feeRouter.post(
  '/concessions',
  requirePermission(PERMISSIONS.FEES_EDIT),
  validate(FeeConcessionCreateSchema),
  createConcession
);
feeRouter.patch(
  '/concessions/:id/status',
  requirePermission(PERMISSIONS.FEES_EDIT),
  validate(FeeConcessionStatusUpdateSchema),
  updateConcessionStatus
);
feeRouter.get(
  '/reports/defaulters',
  requirePermission(PERMISSIONS.FEES_VIEW),
  getDefaultersReport
);
feeRouter.get(
  '/dashboard',
  requirePermission(PERMISSIONS.FEES_VIEW),
  getCollectionDashboard
);
feeRouter.get(
  '/daily-book',
  requirePermission(PERMISSIONS.FEES_VIEW),
  getDailyFeeBook
);
feeRouter.get('/:id', requireFeeViewOrSelf, getInvoiceById);
feeRouter.put(
  '/:id',
  requirePermission(PERMISSIONS.FEES_EDIT),
  validate(FeeInvoiceUpdateSchema),
  updateInvoice
);
feeRouter.delete(
  '/:id',
  requirePermission(PERMISSIONS.FEES_EDIT),
  deleteInvoice
);

const financeRouter = Router();
financeRouter.use(requireAuth);
financeRouter.get(
  '/expenses',
  requirePermission(PERMISSIONS.FINANCE_VIEW),
  getExpenses
);
financeRouter.post(
  '/expenses',
  requirePermission(PERMISSIONS.FINANCE_MANAGE),
  createExpense
);
financeRouter.delete(
  '/expenses/:id',
  requirePermission(PERMISSIONS.FINANCE_MANAGE),
  deleteExpense
);
financeRouter.get(
  '/summary',
  requirePermission(PERMISSIONS.FINANCE_VIEW),
  getFinanceSummary
);

const moduleRouter = Router();
moduleRouter.use(requireAuth);
moduleRouter.get('/homework', getHomework);
moduleRouter.post('/homework', requireRole('admin', 'teacher'), createHomework);
moduleRouter.get(
  '/homework/:id/submissions',
  requireRole('admin', 'teacher'),
  getHomeworkSubmissions
);
moduleRouter.post(
  '/homework/:id/submit',
  requireRole('student'),
  submitHomework
);
moduleRouter.post(
  '/homework/submissions/:subId/grade',
  requireRole('admin', 'teacher'),
  gradeHomeworkSubmission
);
moduleRouter.post(
  '/student/homework/:homeworkId/hint',
  requireRole('student'),
  getHomeworkAiHint
);
moduleRouter.post(
  '/homework/:id/hint',
  requireRole('student'),
  getHomeworkAiHint
);
moduleRouter.get('/timetable', getTimetable);
moduleRouter.post(
  '/timetable',
  requireRole('admin', 'teacher'),
  createTimetableSlot
);
moduleRouter.delete(
  '/timetable/:id',
  requireRole('admin', 'teacher'),
  deleteTimetableSlot
);
moduleRouter.get('/materials', getMaterials);
moduleRouter.post(
  '/materials',
  requireRole('admin', 'teacher'),
  createMaterial
);
moduleRouter.get('/communication', getCommunicationStats);
moduleRouter.get('/ai-assistant/status', getAiStatus);
moduleRouter.post('/ai-assistant', promptAiAssistant);

const noticeRouter = Router();
noticeRouter.use(requireAuth);
noticeRouter.get('/', getNotices);
noticeRouter.post(
  '/',
  requirePermission(PERMISSIONS.NOTICES_CREATE),
  validate(NoticeCreateSchema),
  createNotice
);
noticeRouter.put(
  '/:id/publish',
  requirePermission(PERMISSIONS.NOTICES_PUBLISH),
  publishNotice
);
noticeRouter.put(
  '/:id/archive',
  requirePermission(PERMISSIONS.NOTICES_CREATE),
  archiveNotice
);
noticeRouter.delete(
  '/:id',
  requirePermission(PERMISSIONS.NOTICES_PUBLISH),
  deleteNotice
);

const notificationRouter = Router();
notificationRouter.use(requireAuth);
notificationRouter.get('/', getMyNotifications);
notificationRouter.patch('/:id/read', markNotificationAsRead);

const parentRouter = Router();
parentRouter.use(requireAuth);
parentRouter.get('/', getParents);
parentRouter.get('/:id', getParentById);
parentRouter.post(
  '/',
  requireRole('admin'),
  validate(ParentCreateSchema),
  createParent
);
parentRouter.post(
  '/link-child',
  requireRole('admin'),
  validate(ParentLinkChildSchema),
  linkChild
);
parentRouter.post(
  '/unlink-child',
  requireRole('admin'),
  validate(ParentLinkChildSchema),
  unlinkChild
);
parentRouter.post('/:id/photo', uploadSingleImage, uploadParentPhoto);
parentRouter.delete('/:id/photo', deleteParentPhoto);

const quizRouter = Router();
quizRouter.use(requireAuth);
quizRouter.get('/', listQuizzes);
quizRouter.get('/parent/child', getParentChildQuizzes);
quizRouter.post('/generate-ai', generateAiQuiz);
quizRouter.get('/:id', getQuizById);
quizRouter.post('/', createQuiz);
quizRouter.put('/:id', updateQuiz);
quizRouter.post('/:id/publish', publishQuiz);
quizRouter.delete('/:id', deleteQuiz);
quizRouter.post('/:id/attempt', startQuizAttempt);
quizRouter.post('/:id/save', saveQuizAnswers);
quizRouter.patch('/:id/attempt/answers', saveQuizAnswers);
quizRouter.post('/:id/submit', submitQuiz);
quizRouter.post('/:id/attempt/submit', submitQuiz);
quizRouter.get('/:id/result', getStudentQuizResult);
quizRouter.get('/:id/attempt/result', getStudentQuizResult);
quizRouter.get('/:id/reports', getTeacherQuizReports);

const reportRouter = Router();
reportRouter.use(requireAuth);
reportRouter.use(requirePermission(PERMISSIONS.REPORTS_VIEW));
reportRouter.get('/student-strength', getStudentStrengthReport);
reportRouter.get('/attendance', getAttendanceReport);
reportRouter.get('/fees', getFeesReport);
reportRouter.get('/exams', getExamPerformanceReport);
reportRouter.get('/homework', getHomeworkReport);
reportRouter.get(
  '/export-csv',
  requirePermission(PERMISSIONS.REPORTS_EXPORT),
  exportCsvReport
);

const roleRouter = Router();
roleRouter.use(requireAuth);
roleRouter.use(requireRole('admin'));
roleRouter.get('/teachers', getTeacherPermissionsList);
roleRouter.post(
  '/update',
  validate(PermissionsUpdateSchema),
  updateTeacherPermissions
);

const settingsRouter = Router();
settingsRouter.use(requireAuth);
settingsRouter.get(
  '/',
  requirePermission(PERMISSIONS.SETTINGS_VIEW),
  getSettings
);
settingsRouter.put(
  '/',
  requirePermission(PERMISSIONS.SETTINGS_EDIT),
  updateSettings
);
settingsRouter.get('/backup', requireRole('admin'), exportBackup);
settingsRouter.post('/restore', requireRole('admin'), restoreBackup);

const studentRouter = Router();
studentRouter.use(requireAuth);
studentRouter.get(
  '/generate-admission-number',
  requireRole('admin'),
  getSuggestedAdmissionNumber
);
studentRouter.get('/', getStudents);
studentRouter.get('/:id', getStudentById);
studentRouter.post(
  '/',
  requireRole('admin'),
  validate(StudentCreateSchema),
  createStudent
);
studentRouter.put(
  '/:id',
  requireRole('admin'),
  validate(StudentUpdateSchema),
  updateStudent
);
studentRouter.patch('/:id/archive', requireRole('admin'), archiveStudent);
studentRouter.patch('/:id/restore', requireRole('admin'), restoreStudent);
studentRouter.post(
  '/:id/documents',
  uploadSinglePdf,
  validate(StudentDocumentSchema),
  addStudentDocument
);
studentRouter.get('/:id/documents/:docId', getStudentDocumentFile);
studentRouter.get('/:id/documents/:docId/view', getStudentDocumentFile);
studentRouter.delete(
  '/:id/documents/:docId',
  deleteStudentDocument
);
studentRouter.post('/:id/photo', uploadSingleImage, uploadStudentPhoto);
studentRouter.delete('/:id/photo', deleteStudentPhoto);

const teacherRouter = Router();
teacherRouter.use(requireAuth);
teacherRouter.get('/', getTeachers);
teacherRouter.get('/:id', getTeacherById);
teacherRouter.post(
  '/',
  requireRole('admin'),
  validate(TeacherCreateSchema),
  createTeacher
);
teacherRouter.put(
  '/:id',
  requireRole('admin'),
  validate(TeacherUpdateSchema),
  updateTeacher
);
teacherRouter.patch('/:id/archive', requireRole('admin'), archiveTeacher);
teacherRouter.patch('/:id/restore', requireRole('admin'), restoreTeacher);
teacherRouter.post('/:id/photo', uploadSingleImage, uploadTeacherPhoto);
teacherRouter.delete('/:id/photo', deleteTeacherPhoto);

router.use('/academics', academicRouter);
router.use('/attendance', attendanceRouter);
router.use('/audit-logs', auditRouter);
router.use('/auth', authRouter);
router.use('/conversations', communicationRouter);
router.use('/dashboard', dashboardRouter);
router.use('/exams', examRouter);
router.use('/fees', feeRouter);
router.use('/finance', financeRouter);
router.use('/reports', reportRouter);
router.use('/settings', settingsRouter);
router.use('/notices', noticeRouter);
router.use('/notifications', notificationRouter);
router.use('/parents', parentRouter);
router.use('/roles', roleRouter);
router.use('/students', studentRouter);
router.use('/teachers', teacherRouter);
router.use('/quizzes', quizRouter);
router.use('/', moduleRouter);

export default router;
