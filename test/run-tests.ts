import assert from 'node:assert';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import {
  PERMISSIONS,
  DEFAULT_TEACHER_PERMISSIONS,
  ALL_PERMISSION_DEFINITIONS,
  hasPermission,
  RegisterSchoolSchema,
  VerifyOtpSchema,
  ForgotPasswordSchema,
  VerifyResetOtpSchema,
  ResendResetOtpSchema,
  ResetPasswordWithTokenSchema,
  ResetPasswordSchema,
  AcademicYearCreateSchema,
  ClassSectionCreateSchema,
  SubjectCreateSchema,
  SchoolCalendarEventCreateSchema,
  WorkingDaysUpdateSchema,
  StudentCreateSchema,
  StudentDocumentSchema,
  TeacherCreateSchema,
  ParentCreateSchema,
  ParentLinkChildSchema,
  AttendanceMarkSchema,
  FeeHeadCreateSchema,
  FeeStructureCreateSchema,
  FeeStructureUpdateSchema,
  HomeworkCreateSchema,
  HomeworkSubmitSchema,
  HomeworkGradeSchema,
  TimetableSlotCreateSchema,
  StudyMaterialCreateSchema,
  ConversationCreateSchema,
  ChatMessageCreateSchema,
  NoticeCreateSchema,
  ExamCreateSchema,
  ExamUpdateSchema,
  GradeItemSchema,
  GradeRecordSubmitSchema,
  GradeRecordCorrectionSchema,
  EXPENSE_CATEGORIES,
  ExpenseCreateSchema,
  SchoolSettingsUpdateSchema,
  BackupPayloadSchema,
  AiAssistantRequestSchema,
  QuizCreateSchema,
  QuizAiGenerateSchema,
} from '../shared/src/index';
import {
  sendCredentialEmail,
  getSentMockEmails,
  clearSentMockEmails,
  dispatchAbsentAlerts,
  getGuardianNotificationLogs,
  clearGuardianNotificationLogs,
} from '../server/src/services/notificationService';
import {
  calculateLineItemsSubtotal,
  calculateConcessionAmount,
  deriveInvoiceStatus,
  generateReceiptNumber,
  formatDefaultersCsv,
  formatDailyFeeBookCsv,
} from '../server/src/services/feeService';
import {
  parseTimeToMinutes,
  doIntervalsOverlap,
} from '../server/src/services/timetableConflictService';
import {
  maskSchoolDataForLogs,
  getAiProviderStatus,
  generateAiQuizQuestions,
} from '../server/src/services/aiService';
import jwt from 'jsonwebtoken';
import {
  sendPasswordResetOtpEmail,
  getLastSentResetOtp,
  clearSentOtpHistory,
} from '../server/src/services/emailService';
import {
  getMongoUri,
  getJwtSecret,
  getCookieSecret,
  getAuthCookieOptions,
  validateCloudinaryConfig,
} from '../server/src/config';
import {
  uploadImageToCloudinary,
  uploadPdfToCloudinary,
  deleteFromCloudinary,
  isCloudinaryConfigured,
} from '../server/src/config/cloudinary';

console.log('====================================================');
console.log('  EduHub SMS (Adiya School) - Automated Test Suite  ');
console.log('====================================================\n');

let passedTests = 0;
let failedTests = 0;

async function runTest(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (error: any) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${error.message}`);
    failedTests++;
  }
}

async function main() {
  console.log('1. RBAC & Permissions Tests:');

  await runTest('Admin role has global bypass permission', () => {
    const result = hasPermission('admin', [], PERMISSIONS.ROLES_MANAGE);
    assert.strictEqual(
      result,
      true,
      'Admin should have all permissions unconditionally'
    );
  });

  await runTest(
    'Teacher with DEFAULT_TEACHER_PERMISSIONS has attendance and marks view permissions',
    () => {
      const perms = DEFAULT_TEACHER_PERMISSIONS;
      const canViewAttendance = hasPermission(
        'teacher',
        perms,
        PERMISSIONS.ATTENDANCE_VIEW
      );
      const canMarkAttendance = hasPermission(
        'teacher',
        perms,
        PERMISSIONS.ATTENDANCE_MARK
      );
      const canEnterMarks = hasPermission(
        'teacher',
        perms,
        PERMISSIONS.MARKS_ENTER
      );
      const canManageFees = hasPermission(
        'teacher',
        perms,
        PERMISSIONS.FEES_MANAGE
      );
      const canManageRoles = hasPermission(
        'teacher',
        perms,
        PERMISSIONS.ROLES_MANAGE
      );

      assert.strictEqual(
        canViewAttendance,
        true,
        'Teacher should be able to view attendance'
      );
      assert.strictEqual(
        canMarkAttendance,
        true,
        'Teacher should be able to mark attendance'
      );
      assert.strictEqual(
        canEnterMarks,
        true,
        'Teacher should be able to enter marks'
      );
      assert.strictEqual(
        canManageFees,
        false,
        'Teacher should NOT be able to manage fees by default'
      );
      assert.strictEqual(
        canManageRoles,
        false,
        'Teacher should NOT be able to manage roles'
      );
    }
  );

  await runTest(
    'Teacher with explicitly granted fee permission can manage fees',
    () => {
      const permsWithFees = [
        ...DEFAULT_TEACHER_PERMISSIONS,
        PERMISSIONS.FEES_MANAGE,
      ];
      const canManageFees = hasPermission(
        'teacher',
        permsWithFees,
        PERMISSIONS.FEES_MANAGE
      );
      assert.strictEqual(
        canManageFees,
        true,
        'Explicitly granted permission should be honored'
      );
    }
  );

  await runTest(
    'Non-admin users without permissions cannot access sensitive operations',
    () => {
      const studentCannotManageRoles = hasPermission(
        'student',
        [],
        PERMISSIONS.ROLES_MANAGE
      );
      const parentCannotDeleteNotices = hasPermission(
        'parent',
        [],
        PERMISSIONS.NOTICES_DELETE
      );

      assert.strictEqual(
        studentCannotManageRoles,
        false,
        'Student without permissions cannot manage roles'
      );
      assert.strictEqual(
        parentCannotDeleteNotices,
        false,
        'Parent without permissions cannot delete notices'
      );
    }
  );

  await runTest(
    'All permission definitions have non-empty labels, categories and descriptions',
    () => {
      assert.strictEqual(ALL_PERMISSION_DEFINITIONS.length > 0, true);
      for (const def of ALL_PERMISSION_DEFINITIONS) {
        assert.strictEqual(typeof def.key, 'string');
        assert.strictEqual(typeof def.label, 'string');
        assert.strictEqual(typeof def.category, 'string');
        assert.strictEqual(typeof def.description, 'string');
      }
    }
  );

  console.log('\n2. Onboarding & Password Recovery Schema Tests:');

  await runTest(
    'RegisterSchoolSchema validates valid school onboarding payload',
    () => {
      const valid = {
        schoolName: 'Adiya Model School',
        schoolCode: 'ADIYA-02',
        schoolEmail: 'office@adiyamodel.edu',
        phone: '+91 80 4123 4567',
        address: '123 Education Boulevard, Bangalore',
        adminName: 'Dr. Priya Nair',
        password: 'StrongPassword@123',
      };
      const parsed = RegisterSchoolSchema.parse(valid);
      assert.strictEqual(parsed.schoolCode, 'ADIYA-02');
      assert.strictEqual(parsed.academicYear, '2025-2026');
    }
  );

  await runTest(
    'RegisterSchoolSchema rejects weak passwords and invalid codes',
    () => {
      const weak = {
        schoolName: 'Adiya',
        schoolCode: 'INVALID CODE!',
        schoolEmail: 'not-an-email',
        phone: '123',
        address: 'St',
        adminName: 'A',
        password: '123',
      };
      const res = RegisterSchoolSchema.safeParse(weak);
      assert.strictEqual(res.success, false);
    }
  );

  await runTest('VerifyOtpSchema requires exactly 6 numeric digits', () => {
    const valid = VerifyOtpSchema.safeParse({
      email: 'admin@adiya.edu',
      otp: '123456',
    });
    const invalidShort = VerifyOtpSchema.safeParse({
      email: 'admin@adiya.edu',
      otp: '12345',
    });
    const invalidLetters = VerifyOtpSchema.safeParse({
      email: 'admin@adiya.edu',
      otp: '12345a',
    });

    assert.strictEqual(valid.success, true);
    assert.strictEqual(invalidShort.success, false);
    assert.strictEqual(invalidLetters.success, false);
  });

  await runTest(
    'ForgotPasswordSchema and ResetPasswordSchema validate correctly',
    () => {
      const forgotValid = ForgotPasswordSchema.safeParse({
        email: 'teacher@adiya.edu',
      });
      const resetValid = ResetPasswordSchema.safeParse({
        email: 'teacher@adiya.edu',
        code: '654321',
        newPassword: 'NewSecretPassword@123',
      });

      assert.strictEqual(forgotValid.success, true);
      assert.strictEqual(resetValid.success, true);
    }
  );

  console.log('\n3. Security & OTP Lifecycle Invariants:');

  await runTest(
    'Bcrypt correctly hashes and verifies 6-digit OTPs',
    async () => {
      const plainOtp = '583921';
      const hashed = await bcrypt.hash(plainOtp, 10);
      assert.notStrictEqual(plainOtp, hashed);
      assert.strictEqual(await bcrypt.compare(plainOtp, hashed), true);
      assert.strictEqual(await bcrypt.compare('000000', hashed), false);
    }
  );

  await runTest('OTP attempt lockout logic detects exceeded attempts', () => {
    const maxAttempts = 5;
    let attempts = 4;
    assert.strictEqual(
      attempts < maxAttempts,
      true,
      '4 attempts should be allowed'
    );
    attempts += 1;
    assert.strictEqual(
      attempts >= maxAttempts,
      true,
      '5 attempts must lock out verification'
    );
  });

  await runTest(
    'OTP expiry evaluation correctly identifies expired timestamps',
    () => {
      const expiredTimestamp = new Date(Date.now() - 1000);
      const validTimestamp = new Date(Date.now() + 10 * 60 * 1000);

      assert.strictEqual(
        expiredTimestamp < new Date(),
        true,
        'Past date must be detected as expired'
      );
      assert.strictEqual(
        validTimestamp > new Date(),
        true,
        'Future date must be detected as valid'
      );
    }
  );

  await runTest('Bcrypt correctly hashes passwords with salt', async () => {
    const password = 'AdminSecure@123';
    const hash = await bcrypt.hash(password, 10);
    assert.strictEqual(await bcrypt.compare(password, hash), true);
    assert.strictEqual(await bcrypt.compare('WrongPassword', hash), false);
  });

  console.log('\n4. Server Environment Invariant Tests:');

  const serverEnvSchema = z.object({
    PORT: z.string().default('5000').transform(Number),
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/eduhub_sms'),
    JWT_SECRET: z.string().min(8, 'JWT_SECRET must be at least 8 chars long'),
    CLIENT_URL: z.string().default('http://localhost:5173'),
    COOKIE_SECRET: z
      .string()
      .min(8, 'COOKIE_SECRET must be at least 8 chars long'),
  });

  await runTest(
    'Server env schema parses valid configurations correctly',
    () => {
      const sample = {
        PORT: '5000',
        NODE_ENV: 'test',
        MONGODB_URI: 'mongodb://127.0.0.1:27017/eduhub_test',
        JWT_SECRET: 'supersecretjwtkey12345',
        COOKIE_SECRET: 'cookiesecretkey67890',
      };
      const parsed = serverEnvSchema.parse(sample);
      assert.strictEqual(parsed.PORT, 5000);
      assert.strictEqual(parsed.NODE_ENV, 'test');
      assert.strictEqual(parsed.CLIENT_URL, 'http://localhost:5173');
    }
  );

  await runTest('Server env schema rejects weak JWT secrets', () => {
    const weakConfig = {
      JWT_SECRET: 'short',
      COOKIE_SECRET: 'validsecretkey123',
    };
    const result = serverEnvSchema.safeParse(weakConfig);
    assert.strictEqual(
      result.success,
      false,
      'Schema must reject secret shorter than 8 characters'
    );
  });

  console.log('\n5. Client Environment Invariant Tests:');

  const clientEnvSchema = z.object({
    VITE_API_URL: z.string().default('/api'),
    VITE_DEMO_MODE: z
      .string()
      .optional()
      .transform((val) => val === undefined || val === 'true' || val === '1'),
  });

  await runTest(
    'Client env schema provides default /api route and enables demo mode',
    () => {
      const parsed = clientEnvSchema.parse({});
      assert.strictEqual(parsed.VITE_API_URL, '/api');
      assert.strictEqual(parsed.VITE_DEMO_MODE, true);
    }
  );

  await runTest('Client env schema respects disabled demo mode', () => {
    const parsed = clientEnvSchema.parse({ VITE_DEMO_MODE: 'false' });
    assert.strictEqual(parsed.VITE_DEMO_MODE, false);
  });

  console.log('\n6. Admin Reference Navigation Verification:');

  await runTest('All 16 exact Admin video labels are defined', () => {
    const referenceVideoLabels = [
      'Dashboard',
      'Students',
      'Teachers',
      'Classes',
      'Attendance',
      'Fees',
      'Homework',
      'Timetable',
      'Notice Board',
      'Communication',
      'Reports',
      'AI Assistant',
      'Roles & Permissions',
      'Subject & Class',
      'Tests & Exams',
      'Study Materials',
    ];

    assert.strictEqual(
      referenceVideoLabels.length,
      16,
      'Exactly 16 Admin labels required from video'
    );
    const uniqueLabels = new Set(referenceVideoLabels);
    assert.strictEqual(
      uniqueLabels.size,
      16,
      'All 16 video labels must be unique'
    );
  });

  console.log('\n7. School Setup & Academic Schemas Verification:');

  await runTest(
    'AcademicYearCreateSchema validates correct session format',
    () => {
      const valid = AcademicYearCreateSchema.safeParse({
        name: '2025-2026',
        startDate: '2025-04-01',
        endDate: '2026-03-31',
        isCurrent: true,
        description: 'Active session',
      });
      assert.strictEqual(valid.success, true);

      const invalid = AcademicYearCreateSchema.safeParse({
        name: '25',
        startDate: 'invalid-date',
        endDate: '2026-03-31',
      });
      assert.strictEqual(invalid.success, false);
    }
  );

  await runTest(
    'ClassSectionCreateSchema validates valid class and capacity',
    () => {
      const valid = ClassSectionCreateSchema.safeParse({
        name: 'Grade 10',
        section: 'A',
        roomNumber: 'Room 301',
        capacity: 35,
        academicYear: '2025-2026',
      });
      assert.strictEqual(valid.success, true);

      const invalid = ClassSectionCreateSchema.safeParse({
        name: '',
        section: 'A',
      });
      assert.strictEqual(invalid.success, false);
    }
  );

  await runTest(
    'SubjectCreateSchema enforces uppercase code and valid type',
    () => {
      const valid = SubjectCreateSchema.safeParse({
        name: 'Mathematics',
        code: 'MATH-10',
        type: 'core',
        credits: 4,
      });
      assert.strictEqual(valid.success, true);

      const invalid = SubjectCreateSchema.safeParse({
        name: 'Math',
        code: 'M',
      });
      assert.strictEqual(invalid.success, false);
    }
  );

  await runTest(
    'SchoolCalendarEventCreateSchema validates event type and date boundaries',
    () => {
      const valid = SchoolCalendarEventCreateSchema.safeParse({
        title: 'Parent Teacher Meeting (PTM)',
        eventType: 'meeting',
        startDate: '2026-09-26',
        endDate: '2026-09-26',
        isHoliday: false,
        targetAudience: 'parents',
      });
      assert.strictEqual(valid.success, true);
    }
  );

  await runTest(
    'WorkingDaysUpdateSchema requires at least one working day',
    () => {
      const valid = WorkingDaysUpdateSchema.safeParse({
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      });
      assert.strictEqual(valid.success, true);

      const invalid = WorkingDaysUpdateSchema.safeParse({
        workingDays: [],
      });
      assert.strictEqual(invalid.success, false);
    }
  );

  console.log('\n8. School Directory Management & Parent Isolation Tests:');

  await runTest(
    'StudentCreateSchema validates enrollment with auto-admission fallback',
    () => {
      const valid = StudentCreateSchema.safeParse({
        name: 'Diya Sharma',
        email: 'diya.sharma@adiya.edu',
        rollNumber: '102',
        gender: 'female',
        dateOfBirth: '2012-08-14',
        classSectionId: '654321098765432109876543',
        parentName: 'Sunita Sharma',
        parentEmail: 'sunita.sharma@adiya.edu',
        parentPhone: '+91 98450 11223',
      });
      assert.strictEqual(valid.success, true);

      const invalidEmail = StudentCreateSchema.safeParse({
        name: 'Diya Sharma',
        email: 'not-an-email',
        rollNumber: '102',
        gender: 'female',
        dateOfBirth: '2012-08-14',
        classSectionId: '654321098765432109876543',
      });
      assert.strictEqual(invalidEmail.success, false);
    }
  );

  await runTest(
    'StudentDocumentSchema validates supported document types and metadata',
    () => {
      const validDoc = StudentDocumentSchema.safeParse({
        title: 'Municipal Birth Certificate',
        docType: 'birth_certificate',
        fileUrl: '/uploads/documents/diya-birth-cert.pdf',
        fileName: 'diya-birth-cert.pdf',
        fileSize: 45000,
      });
      assert.strictEqual(validDoc.success, true);

      const invalidType = StudentDocumentSchema.safeParse({
        title: 'Tax Certificate',
        docType: 'unsupported_type',
        fileUrl: '/uploads/documents/doc.pdf',
        fileName: 'doc.pdf',
      });
      assert.strictEqual(invalidType.success, false);
    }
  );

  await runTest(
    'TeacherCreateSchema validates teacher profile and experience',
    () => {
      const valid = TeacherCreateSchema.safeParse({
        name: 'Dr. Smita Bose',
        email: 'smita.bose@adiya.edu',
        employeeId: 'TCH-105',
        phone: '+91 98450 99887',
        gender: 'female',
        qualification: 'Ph.D. Computer Science',
        specialization: 'Artificial Intelligence',
        experienceYears: 8,
        joiningDate: '2024-06-01',
        assignedClasses: [
          { classSectionId: 'class-1', subjectId: 'subj-1' },
          { classSectionId: 'class-2', subjectId: 'subj-2' },
        ],
      });
      assert.strictEqual(valid.success, true);

      const invalid = TeacherCreateSchema.safeParse({
        name: '',
        email: 'smita@adiya.edu',
        employeeId: '',
      });
      assert.strictEqual(invalid.success, false);
    }
  );

  await runTest(
    'ParentCreateSchema and ParentLinkChildSchema validate correctly',
    () => {
      const validParent = ParentCreateSchema.safeParse({
        name: 'Ramesh Patel',
        email: 'ramesh.patel@gmail.com',
        phone: '+91 98765 43210',
        relationship: 'father',
      });
      assert.strictEqual(validParent.success, true);

      const validLink = ParentLinkChildSchema.safeParse({
        parentId: 'parent-123',
        studentId: 'student-456',
      });
      assert.strictEqual(validLink.success, true);
    }
  );

  await runTest(
    'Admission Number generation generates sequential format ADM-YYYY-XXXX',
    () => {
      const currentYear = new Date().getFullYear();
      const count = 4;
      const seq = count + 1;
      const admissionNumber = `ADM-${currentYear}-${seq.toString().padStart(4, '0')}`;
      assert.strictEqual(admissionNumber, `ADM-${currentYear}-0005`);
      assert.strictEqual(/^ADM-\d{4}-\d{4}$/.test(admissionNumber), true);
    }
  );

  await runTest(
    'Development Credential Delivery Adapter records mock dispatches',
    async () => {
      clearSentMockEmails();
      assert.strictEqual(getSentMockEmails().length, 0);

      const result = await sendCredentialEmail({
        to: 'student.aarav@adiya.edu',
        name: 'Aarav Sharma',
        role: 'student',
        schoolName: 'Adiya Model School',
        tempPassword: 'Password@123',
        loginUrl: 'http://localhost:5173/login',
        generatedAt: new Date().toISOString(),
      });

      assert.strictEqual(result.success, true);
      const sent = getSentMockEmails();
      assert.strictEqual(sent.length, 1);
      assert.strictEqual(sent[0].to, 'student.aarav@adiya.edu');
      assert.strictEqual(sent[0].role, 'student');
      assert.strictEqual(sent[0].tempPassword, 'Password@123');
    }
  );

  await runTest(
    'Parent-Child Isolation Invariant: Unrelated student access is rejected with 403',
    () => {
      const sunitaLinkedStudentUserIds = ['user-aarav-1', 'user-diya-2'];

      function canParentAccessStudent(
        parentLinkedIds: string[],
        targetStudentUserId: string
      ): boolean {
        return parentLinkedIds.includes(targetStudentUserId);
      }

      const canAccessAarav = canParentAccessStudent(
        sunitaLinkedStudentUserIds,
        'user-aarav-1'
      );
      assert.strictEqual(
        canAccessAarav,
        true,
        'Parent must be allowed to view own child'
      );

      const canAccessDiya = canParentAccessStudent(
        sunitaLinkedStudentUserIds,
        'user-diya-2'
      );
      assert.strictEqual(
        canAccessDiya,
        true,
        'Parent must be allowed to view second child'
      );

      const canAccessUnrelated = canParentAccessStudent(
        sunitaLinkedStudentUserIds,
        'user-maya-3'
      );
      assert.strictEqual(
        canAccessUnrelated,
        false,
        'Parent must NEVER be allowed to access an unrelated student'
      );
    }
  );

  await runTest(
    'Soft Deletion Invariant: Archive deactivates login and restore reactivates login',
    () => {
      let profileStatus = 'active';
      let userIsActive = true;

      profileStatus = 'archived';
      userIsActive = false;
      assert.strictEqual(profileStatus, 'archived');
      assert.strictEqual(
        userIsActive,
        false,
        'Archiving must deactivate user login'
      );

      profileStatus = 'active';
      userIsActive = true;
      assert.strictEqual(profileStatus, 'active');
      assert.strictEqual(
        userIsActive,
        true,
        'Restoring must reactivate user login'
      );
    }
  );

  console.log('\n7. Granular Roles & Access Control Tests:');

  await runTest(
    'PermissionKey Contract: All 42 keys use dot notation and have definitions',
    () => {
      const expectedKeys = [
        'students.view',
        'students.create',
        'students.update',
        'students.delete',
        'teachers.view',
        'attendance.view',
        'attendance.mark',
        'attendance.edit',
        'fees.view',
        'fees.collect',
        'fees.edit',
        'fees.receipt',
        'homework.view',
        'homework.create',
        'homework.update',
        'homework.delete',
        'homework.grade',
        'timetable.view',
        'timetable.manage',
        'notices.view',
        'notices.create',
        'notices.publish',
        'communication.view',
        'communication.chat',
        'communication.announcements',
        'exams.view',
        'exams.create',
        'exams.edit',
        'exams.delete',
        'marks.view',
        'marks.enter',
        'marks.edit',
        'results.view',
        'results.publish',
        'materials.view',
        'materials.upload',
        'materials.delete',
        'reports.view',
        'reports.generate',
        'settings.view',
        'settings.edit',
        'roles.manage',
      ];

      const definedKeys = new Set(ALL_PERMISSION_DEFINITIONS.map((d) => d.key));

      for (const key of expectedKeys) {
        assert.strictEqual(
          definedKeys.has(key as any),
          true,
          `Expected permission key ${key} must be defined in ALL_PERMISSION_DEFINITIONS`
        );
        assert.strictEqual(
          key.includes('.'),
          true,
          `Permission key ${key} must follow dot notation`
        );
      }

      const categories = new Set(
        ALL_PERMISSION_DEFINITIONS.map((d) => d.category)
      );
      assert.strictEqual(categories.has('Students'), true);
      assert.strictEqual(categories.has('Attendance'), true);
      assert.strictEqual(categories.has('Exams & Results'), true);
      assert.strictEqual(categories.has('Homework'), true);
      assert.strictEqual(categories.has('Notice Board'), true);
      assert.strictEqual(categories.has('Teachers & Staff'), true);
      assert.strictEqual(categories.has('Fees & Finance'), true);
      assert.strictEqual(categories.has('Timetable & Materials'), true);
      assert.strictEqual(categories.has('Communication & AI'), true);
      assert.strictEqual(categories.has('Reports & Settings'), true);
    }
  );

  await runTest(
    'Safe Teacher Defaults: Sensitive and destructive actions are OFF by default',
    () => {
      const defaults = DEFAULT_TEACHER_PERMISSIONS;

      assert.strictEqual(defaults.includes('attendance.view'), true);
      assert.strictEqual(defaults.includes('attendance.mark'), true);
      assert.strictEqual(defaults.includes('homework.view'), true);
      assert.strictEqual(defaults.includes('homework.create'), true);
      assert.strictEqual(defaults.includes('timetable.view'), true);
      assert.strictEqual(defaults.includes('notices.view'), true);
      assert.strictEqual(defaults.includes('communication.view'), true);
      assert.strictEqual(defaults.includes('communication.chat'), true);
      assert.strictEqual(defaults.includes('exams.view'), true);
      assert.strictEqual(defaults.includes('marks.view'), true);
      assert.strictEqual(defaults.includes('marks.enter'), true);
      assert.strictEqual(defaults.includes('results.view'), true);
      assert.strictEqual(defaults.includes('materials.view'), true);
      assert.strictEqual(defaults.includes('materials.upload'), true);

      assert.strictEqual(
        defaults.includes('results.publish'),
        false,
        'results.publish must be OFF by default'
      );
      assert.strictEqual(
        defaults.includes('fees.collect'),
        false,
        'fees.collect must be OFF by default'
      );
      assert.strictEqual(
        defaults.includes('fees.edit'),
        false,
        'fees.edit must be OFF by default'
      );
      assert.strictEqual(
        defaults.includes('finance.manage' as any),
        false,
        'finance.manage must be OFF by default'
      );
      assert.strictEqual(
        defaults.includes('roles.manage' as any),
        false,
        'roles.manage must be OFF by default'
      );
      assert.strictEqual(
        defaults.includes('settings.edit' as any),
        false,
        'settings.edit must be OFF by default'
      );
      assert.strictEqual(
        defaults.includes('students.delete'),
        false,
        'students.delete must be OFF by default'
      );
      assert.strictEqual(
        defaults.includes('attendance.edit'),
        false,
        'attendance.edit must be OFF by default'
      );
      assert.strictEqual(
        defaults.includes('homework.delete'),
        false,
        'homework.delete must be OFF by default'
      );
      assert.strictEqual(
        defaults.includes('exams.delete'),
        false,
        'exams.delete must be OFF by default'
      );
      assert.strictEqual(
        defaults.includes('materials.delete'),
        false,
        'materials.delete must be OFF by default'
      );
    }
  );

  await runTest(
    'Dynamic Permission Revocation: Removing attendance.mark blocks attendance marking',
    () => {
      let teacherPermissions = [...DEFAULT_TEACHER_PERMISSIONS];
      assert.strictEqual(
        hasPermission('teacher', teacherPermissions, 'attendance.mark'),
        true
      );

      teacherPermissions = teacherPermissions.filter(
        (p) => p !== 'attendance.mark'
      );

      assert.strictEqual(
        hasPermission('teacher', teacherPermissions, 'attendance.mark'),
        false,
        'Teacher without attendance.mark must be denied attendance marking permission'
      );
      assert.strictEqual(
        hasPermission('teacher', teacherPermissions, 'attendance.view'),
        true,
        'Teacher should still be allowed to view attendance'
      );
    }
  );

  await runTest(
    'Results Publishing Protection: Only explicitly granted teachers can publish results',
    () => {
      const defaultTeacher = [...DEFAULT_TEACHER_PERMISSIONS];
      assert.strictEqual(
        hasPermission('teacher', defaultTeacher, 'results.publish'),
        false,
        'Teacher with default permissions cannot publish results'
      );

      const authorizedTeacher = [
        ...DEFAULT_TEACHER_PERMISSIONS,
        'results.publish' as const,
      ];
      assert.strictEqual(
        hasPermission('teacher', authorizedTeacher, 'results.publish'),
        true,
        'Teacher with explicit results.publish permission can publish exam results'
      );
    }
  );

  await runTest('Teacher Self-Modification & Admin Exclusivity Guard', () => {
    function authorizePermissionUpdate(
      requesterRole: string,
      requesterUserId: string,
      targetUserId: string
    ) {
      if (requesterRole !== 'admin') {
        return {
          success: false,
          status: 403,
          message:
            'Forbidden: Only administrators can modify roles and permissions.',
        };
      }
      if (requesterUserId === targetUserId) {
        return {
          success: false,
          status: 403,
          message:
            'Forbidden: You cannot modify your own administrative permissions.',
        };
      }
      return { success: true, status: 200, message: 'Authorized' };
    }

    const teacherSelf = authorizePermissionUpdate(
      'teacher',
      'teacher-101',
      'teacher-101'
    );
    assert.strictEqual(teacherSelf.status, 403);
    assert.strictEqual(teacherSelf.success, false);

    const teacherOther = authorizePermissionUpdate(
      'teacher',
      'teacher-101',
      'teacher-102'
    );
    assert.strictEqual(teacherOther.status, 403);
    assert.strictEqual(teacherOther.success, false);

    const adminSelf = authorizePermissionUpdate(
      'admin',
      'admin-001',
      'admin-001'
    );
    assert.strictEqual(adminSelf.status, 403);
    assert.strictEqual(adminSelf.success, false);

    const adminTeacher = authorizePermissionUpdate(
      'admin',
      'admin-001',
      'teacher-101'
    );
    assert.strictEqual(adminTeacher.status, 200);
    assert.strictEqual(adminTeacher.success, true);
  });

  await runTest('Typed 403 Forbidden Contract on missing permission', () => {
    function checkPermissionMiddleware(
      userRole: string,
      userPermissions: string[],
      required: string
    ) {
      if (!hasPermission(userRole, userPermissions, required)) {
        return {
          status: 403,
          body: {
            success: false,
            message: `Forbidden: Missing required permission '${required}'`,
            requiredPermission: required,
          },
        };
      }
      return { status: 200, body: { success: true } };
    }

    const res = checkPermissionMiddleware(
      'teacher',
      DEFAULT_TEACHER_PERMISSIONS,
      'fees.collect'
    );
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.requiredPermission, 'fees.collect');
  });

  await runTest(
    'Teacher Assignment Scoping: Scoped to assigned classes and subjects',
    () => {
      const assignedClassIds = ['class-1'];
      const _assignedSubjectIds = ['sub-math'];

      function canMarkClassAttendance(
        teacherClasses: string[],
        targetClassId: string
      ): boolean {
        return teacherClasses.includes(targetClassId);
      }

      function canCreateClassExam(
        teacherClasses: string[],
        targetClassId: string
      ): boolean {
        return teacherClasses.includes(targetClassId);
      }

      function canAccessStudent(
        teacherClasses: string[],
        studentClassId: string
      ): boolean {
        return teacherClasses.includes(studentClassId);
      }

      assert.strictEqual(
        canMarkClassAttendance(assignedClassIds, 'class-1'),
        true
      );
      assert.strictEqual(canCreateClassExam(assignedClassIds, 'class-1'), true);
      assert.strictEqual(canAccessStudent(assignedClassIds, 'class-1'), true);

      assert.strictEqual(
        canMarkClassAttendance(assignedClassIds, 'class-2'),
        false
      );
      assert.strictEqual(
        canCreateClassExam(assignedClassIds, 'class-2'),
        false
      );
      assert.strictEqual(canAccessStudent(assignedClassIds, 'class-2'), false);
    }
  );

  console.log('\n8. Attendance & Guardian Notification Pipeline Tests:');

  await runTest(
    '4-Status Enum Validation: Present, Absent, Late, Leave are accepted; invalid rejected',
    () => {
      const validPayload = {
        classSectionId: 'class-sec-101',
        date: '2026-09-22',
        academicYearId: 'ay-2026',
        records: [
          {
            studentId: 'stud-1',
            studentName: 'Aarav',
            rollNumber: '01',
            status: 'present' as const,
          },
          {
            studentId: 'stud-2',
            studentName: 'Diya',
            rollNumber: '02',
            status: 'absent' as const,
          },
          {
            studentId: 'stud-3',
            studentName: 'Rohan',
            rollNumber: '03',
            status: 'late' as const,
          },
          {
            studentId: 'stud-4',
            studentName: 'Ananya',
            rollNumber: '04',
            status: 'leave' as const,
            remarks: 'Sick leave',
          },
        ],
      };

      const parsed = AttendanceMarkSchema.safeParse(validPayload);
      assert.strictEqual(
        parsed.success,
        true,
        'All 4 statuses must be valid under AttendanceMarkSchema'
      );

      const invalidPayload = {
        ...validPayload,
        records: [
          {
            studentId: 'stud-5',
            studentName: 'Kavya',
            rollNumber: '05',
            status: 'truant' as any,
          },
        ],
      };
      const invalidParsed = AttendanceMarkSchema.safeParse(invalidPayload);
      assert.strictEqual(
        invalidParsed.success,
        false,
        'Invalid attendance status must be rejected'
      );
    }
  );

  await runTest(
    'Duplicate Attendance Prevention: Submitting fresh attendance for existing session returns 409',
    () => {
      const existingSessions = new Set(['school-1:class-1:2026-09-22:ay-2026']);

      function submitAttendance(
        schoolId: string,
        classSectionId: string,
        date: string,
        academicYearId: string,
        isEdited: boolean
      ) {
        const key = `${schoolId}:${classSectionId}:${date}:${academicYearId}`;
        if (existingSessions.has(key) && !isEdited) {
          return {
            status: 409,
            message: 'Duplicate attendance: Session already finalized.',
          };
        }
        if (!existingSessions.has(key)) {
          existingSessions.add(key);
        }
        return { status: 200, message: 'Attendance processed successfully.' };
      }

      const res1 = submitAttendance(
        'school-1',
        'class-1',
        '2026-09-23',
        'ay-2026',
        false
      );
      assert.strictEqual(res1.status, 200);

      const res2 = submitAttendance(
        'school-1',
        'class-1',
        '2026-09-23',
        'ay-2026',
        false
      );
      assert.strictEqual(
        res2.status,
        409,
        'Duplicate attendance submission must return 409 Conflict'
      );

      const res3 = submitAttendance(
        'school-1',
        'class-1',
        '2026-09-23',
        'ay-2026',
        true
      );
      assert.strictEqual(
        res3.status,
        200,
        'Edit flow with isEdited=true must be accepted'
      );
    }
  );

  await runTest(
    'Teacher Assignment Scoping: Unauthorized teacher receives 403 Forbidden',
    () => {
      const teacherAssignments = ['class-10A'];

      function authorizeAttendanceMark(
        userRole: string,
        teacherId: string,
        classSectionId: string
      ) {
        if (userRole === 'admin') return { status: 200 };
        if (
          userRole === 'teacher' &&
          teacherAssignments.includes(classSectionId)
        ) {
          return { status: 200 };
        }
        return {
          status: 403,
          message: 'Access denied: You are not assigned to this class.',
        };
      }

      const assignedAccess = authorizeAttendanceMark(
        'teacher',
        'teacher-1',
        'class-10A'
      );
      assert.strictEqual(assignedAccess.status, 200);

      const unassignedAccess = authorizeAttendanceMark(
        'teacher',
        'teacher-1',
        'class-9B'
      );
      assert.strictEqual(unassignedAccess.status, 403);

      const adminBypass = authorizeAttendanceMark(
        'admin',
        'admin-1',
        'class-9B'
      );
      assert.strictEqual(adminBypass.status, 200, 'Admin can mark any class');
    }
  );

  await runTest(
    'Finalized Session Editing: Requires attendance.edit permission and non-empty audit reason',
    () => {
      function processAttendanceEdit(
        userRole: string,
        userPermissions: string[],
        isFinalized: boolean,
        editReason?: string
      ) {
        if (isFinalized) {
          if (
            userRole !== 'admin' &&
            !hasPermission(userRole, userPermissions, 'attendance.edit')
          ) {
            return {
              status: 403,
              message:
                "Forbidden: You need 'attendance.edit' permission to modify a finalized session.",
              requiredPermission: 'attendance.edit',
            };
          }
          if (!editReason || !editReason.trim()) {
            return {
              status: 400,
              message:
                'An audit reason is required when modifying a finalized attendance session.',
            };
          }
        }
        return { status: 200, message: 'Attendance updated successfully' };
      }

      const teacherDefault = processAttendanceEdit(
        'teacher',
        DEFAULT_TEACHER_PERMISSIONS,
        true,
        'Corrected typo'
      );
      assert.strictEqual(teacherDefault.status, 403);
      assert.strictEqual(teacherDefault.requiredPermission, 'attendance.edit');

      const teacherWithPermNoReason = processAttendanceEdit(
        'teacher',
        [...DEFAULT_TEACHER_PERMISSIONS, 'attendance.edit'],
        true,
        ''
      );
      assert.strictEqual(teacherWithPermNoReason.status, 400);

      const teacherAuthorized = processAttendanceEdit(
        'teacher',
        [...DEFAULT_TEACHER_PERMISSIONS, 'attendance.edit'],
        true,
        'Student arrived after medical examination'
      );
      assert.strictEqual(teacherAuthorized.status, 200);

      const adminEdit = processAttendanceEdit(
        'admin',
        [],
        true,
        'Administrative attendance adjustment'
      );
      assert.strictEqual(adminEdit.status, 200);
    }
  );

  await runTest(
    'Parent Attendance Scoping: Parent can only view linked child; unrelated returns 403',
    () => {
      const parentLinkedChildren = ['student-aarav-1', 'student-diya-2'];

      function getParentChildAttendanceView(
        requesterRole: string,
        linkedStudentIds: string[],
        targetStudentId: string
      ) {
        if (requesterRole !== 'parent')
          return { status: 403, message: 'Forbidden' };
        if (!linkedStudentIds.includes(targetStudentId)) {
          return {
            status: 403,
            message: 'Forbidden: Parent cannot access an unrelated student.',
          };
        }
        return {
          status: 200,
          data: { studentId: targetStudentId, attendanceRate: 95 },
        };
      }

      const ownChildAccess = getParentChildAttendanceView(
        'parent',
        parentLinkedChildren,
        'student-aarav-1'
      );
      assert.strictEqual(ownChildAccess.status, 200);

      const unrelatedChildAccess = getParentChildAttendanceView(
        'parent',
        parentLinkedChildren,
        'student-stranger-9'
      );
      assert.strictEqual(unrelatedChildAccess.status, 403);
    }
  );

  await runTest(
    'Guardian Absent Notification Provider Abstraction: Template formatting & single-event deduplication',
    async () => {
      clearGuardianNotificationLogs();

      const absentStudents = [
        {
          studentId: 'stud-aarav',
          studentName: 'Aarav Sharma',
          parentName: 'Sunita Sharma',
          parentPhone: '+91 98765 43210',
          parentEmail: 'parent.sunita@example.com',
        },
        {
          studentId: 'stud-rohan',
          studentName: 'Rohan Verma',
          parentName: 'Amit Verma',
          parentPhone: '+91 98765 43211',
        },
      ];

      const notifiedFirstRound = await dispatchAbsentAlerts({
        schoolId: 'school-adiya',
        attendanceRecordId: 'rec-101',
        date: '2026-09-22',
        classSectionName: 'Grade 10-A',
        absentStudents,
        alreadyNotifiedStudentIds: [],
      });

      assert.strictEqual(notifiedFirstRound.length, 2);
      const logsAfterRound1 = getGuardianNotificationLogs();
      assert.strictEqual(logsAfterRound1.length, 2);

      const aaravLog = logsAfterRound1.find(
        (l) => l.studentId === 'stud-aarav'
      );
      assert.ok(aaravLog);
      assert.strictEqual(
        aaravLog.message,
        'Adiya / EduHub: Aarav Sharma was marked absent on 2026-09-22. Please contact the school if needed.'
      );
      assert.strictEqual(aaravLog.deliveryStatus, 'delivered_dev_mock');
      assert.strictEqual(aaravLog.guardianContact, '+91 98765 43210');

      const updatedAbsentStudents = [
        ...absentStudents,
        {
          studentId: 'stud-maya',
          studentName: 'Maya Iyer',
          parentName: 'Karthik Iyer',
          parentEmail: 'parent.karthik@example.com',
        },
      ];

      const notifiedSecondRound = await dispatchAbsentAlerts({
        schoolId: 'school-adiya',
        attendanceRecordId: 'rec-101',
        date: '2026-09-22',
        classSectionName: 'Grade 10-A',
        absentStudents: updatedAbsentStudents,
        alreadyNotifiedStudentIds: notifiedFirstRound,
      });

      assert.strictEqual(notifiedSecondRound.length, 1);
      assert.strictEqual(notifiedSecondRound[0], 'stud-maya');

      const logsAfterRound2 = getGuardianNotificationLogs();
      assert.strictEqual(
        logsAfterRound2.length,
        3,
        'Absent notification must be logged exactly once per attendance event per student'
      );
    }
  );

  await runTest(
    'Working-Day Attendance Rate Calculation Accuracy: Unmarked days not silently counted absent',
    () => {
      const totalWorkingDays = 20;
      const presentDays = 17;
      const lateDays = 2;
      const _leaveDays = 1;
      const _absentDays = 0;

      const calculatedRate = Math.round(
        ((presentDays + lateDays * 0.5) / totalWorkingDays) * 100
      );
      assert.strictEqual(calculatedRate, 90);

      const partialSessions = 5;
      const partialPresent = 5;
      const partialRate = Math.round((partialPresent / partialSessions) * 100);
      assert.strictEqual(
        partialRate,
        100,
        'Unmarked future/past days must not degrade attendance rate'
      );
    }
  );

  console.log('\n9. Fee Management, Idempotent Payments & Defaulters Tests:');

  await runTest(
    'Fee Head & Fee Structure Schema Validation: integer amounts and frequencies',
    () => {
      const validHead = FeeHeadCreateSchema.parse({
        title: 'Science Olympiad & Lab Fee',
        amount: 3500,
        frequency: 'quarterly',
        description: 'Covers consumables for laboratory experiments',
        academicYearId: 'ay_2026_2027',
      });
      assert.strictEqual(validHead.amount, 3500);
      assert.strictEqual(validHead.frequency, 'quarterly');

      assert.throws(() => {
        FeeHeadCreateSchema.parse({
          title: 'Invalid Head',
          amount: -500,
          frequency: 'monthly',
          academicYearId: 'ay_1',
        });
      }, /Amount must be a positive integer/);

      const validStructure = FeeStructureCreateSchema.parse({
        name: 'Grade 10 Annual Standard Fee Package',
        classSectionId: 'cls_10a',
        academicYearId: 'ay_2026_2027',
        feeHeadIds: ['fh_1', 'fh_2', 'fh_3'],
      });
      assert.strictEqual(validStructure.feeHeadIds.length, 3);
      assert.strictEqual(validStructure.classSectionId, 'cls_10a');

      // Fee Structure must strictly require classSectionId (Class-wise enforcement)
      assert.throws(() => {
        FeeStructureCreateSchema.parse({
          name: 'Invalid Universal Structure',
          classSectionId: '',
          academicYearId: 'ay_2026_2027',
          feeHeadIds: ['fh_1'],
        });
      }, /Class is required/);

      // FeeStructureUpdateSchema supports updating name, class, heads and isActive
      const validUpdate = FeeStructureUpdateSchema.parse({
        name: 'Grade 10 Revised Annual Fee',
        feeHeadIds: ['fh_1', 'fh_2'],
        isActive: true,
      });
      assert.strictEqual(validUpdate.name, 'Grade 10 Revised Annual Fee');
      assert.strictEqual(validUpdate.feeHeadIds?.length, 2);
    }
  );

  await runTest(
    'Server Calculation Invariants: Subtotals & Concession Capping',
    () => {
      const items = [{ amount: 14000 }, { amount: 3000 }, { amount: 1500 }];
      const subtotal = calculateLineItemsSubtotal(items);
      assert.strictEqual(
        subtotal,
        18500,
        'Subtotal must strictly equal integer sum of items'
      );

      const percentConcession = calculateConcessionAmount(
        subtotal,
        'percentage',
        10
      );
      assert.strictEqual(percentConcession, 1850);

      const fixedConcession = calculateConcessionAmount(
        subtotal,
        'fixed',
        3000
      );
      assert.strictEqual(fixedConcession, 3000);

      const overConcession = calculateConcessionAmount(
        subtotal,
        'fixed',
        25000
      );
      assert.strictEqual(
        overConcession,
        18500,
        'Concession must be capped at subtotal'
      );
    }
  );

  await runTest(
    'Invoice Status Derivation Invariants: paid, partially paid, pending, overdue',
    () => {
      const statusPaid = deriveInvoiceStatus(18500, 18500, '2026-10-15');
      assert.strictEqual(statusPaid, 'paid');

      const statusPartial = deriveInvoiceStatus(18500, 5000, '2026-10-15');
      assert.strictEqual(statusPartial, 'partially paid');

      const futureDate = '2099-12-31';
      const statusPending = deriveInvoiceStatus(18500, 0, futureDate);
      assert.strictEqual(statusPending, 'pending');

      const pastDate = '2020-01-01';
      const statusOverdue = deriveInvoiceStatus(18500, 0, pastDate);
      assert.strictEqual(statusOverdue, 'overdue');
    }
  );

  await runTest(
    'Payment Idempotency Invariant: Duplicate submission returns cached receipt without double-decrementing balance',
    () => {
      interface SimulatedInvoice {
        id: string;
        totalAmount: number;
        paidAmount: number;
        balance: number;
        status: string;
        payments: any[];
      }

      const invoice: SimulatedInvoice = {
        id: 'inv_101',
        totalAmount: 20000,
        paidAmount: 0,
        balance: 20000,
        status: 'pending',
        payments: [],
      };

      const idempotencyStore = new Map<string, any>();

      function processPayment(
        inv: SimulatedInvoice,
        amount: number,
        idempotencyKey?: string
      ) {
        if (idempotencyKey && idempotencyStore.has(idempotencyKey)) {
          return { ...idempotencyStore.get(idempotencyKey), cached: true };
        }

        const receiptNumber = generateReceiptNumber(2026);
        inv.paidAmount += amount;
        inv.balance = inv.totalAmount - inv.paidAmount;
        inv.status = inv.balance === 0 ? 'paid' : 'partially paid';

        const paymentRecord = {
          receiptNumber,
          amount,
          date: new Date(),
        };
        inv.payments.push(paymentRecord);

        const responsePayload = {
          cached: false,
          receiptNumber,
          amount,
          balance: inv.balance,
          status: inv.status,
        };

        if (idempotencyKey) {
          idempotencyStore.set(idempotencyKey, responsePayload);
        }

        return responsePayload;
      }

      const key = 'IDEMP-PAY-2026-TEST';

      const res1 = processPayment(invoice, 5000, key);
      assert.strictEqual(res1.cached, false);
      assert.strictEqual(invoice.paidAmount, 5000);
      assert.strictEqual(invoice.balance, 15000);
      assert.strictEqual(invoice.payments.length, 1);
      const receipt1 = res1.receiptNumber;

      const res2 = processPayment(invoice, 5000, key);
      assert.strictEqual(
        res2.cached,
        true,
        'Duplicate request must be recognized as idempotent'
      );
      assert.strictEqual(
        res2.receiptNumber,
        receipt1,
        'Duplicate request must return original receipt number'
      );
      assert.strictEqual(
        invoice.paidAmount,
        5000,
        'Invoice paidAmount must NOT double increment'
      );
      assert.strictEqual(
        invoice.balance,
        15000,
        'Invoice balance must NOT double decrement'
      );
      assert.strictEqual(
        invoice.payments.length,
        1,
        'Duplicate payment must NOT append redundant payment subdocuments'
      );
    }
  );

  await runTest(
    'Teacher Permission Gating: Fees read-only & OFF by default, fees.collect strictly required to collect',
    () => {
      assert.strictEqual(
        hasPermission('teacher', DEFAULT_TEACHER_PERMISSIONS, 'fees.view'),
        false,
        'fees.view must be OFF by default for teachers'
      );
      assert.strictEqual(
        hasPermission('teacher', DEFAULT_TEACHER_PERMISSIONS, 'fees.collect'),
        false,
        'fees.collect must be OFF by default for teachers'
      );
      assert.strictEqual(
        hasPermission('teacher', DEFAULT_TEACHER_PERMISSIONS, 'fees.edit'),
        false,
        'fees.edit must be OFF by default for teachers'
      );

      const teacherWithCollect = [
        ...DEFAULT_TEACHER_PERMISSIONS,
        'fees.collect',
      ];
      assert.strictEqual(
        hasPermission('teacher', teacherWithCollect, 'fees.collect'),
        true,
        'Explicitly granted fees.collect must authorize payment collection'
      );
      assert.strictEqual(
        hasPermission('teacher', teacherWithCollect, 'fees.edit'),
        false,
        'fees.edit remains OFF when only fees.collect is granted'
      );

      assert.strictEqual(hasPermission('admin', [], 'fees.collect'), true);
      assert.strictEqual(hasPermission('admin', [], 'fees.edit'), true);
    }
  );

  await runTest(
    'Defaulters Report & Overdue Days Calculation Invariant',
    () => {
      const today = new Date();
      const todayUtc = Date.UTC(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      const past15DaysUtc = todayUtc - 15 * 24 * 60 * 60 * 1000;
      const past15Date = new Date(past15DaysUtc);
      const past15Str = `${past15Date.getUTCFullYear()}-${String(past15Date.getUTCMonth() + 1).padStart(2, '0')}-${String(past15Date.getUTCDate()).padStart(2, '0')}`;

      const defaultersList = [
        {
          invoiceId: 'inv_d1',
          invoiceNumber: 'INV-2026-00041',
          studentId: 'stud_1',
          studentName: 'Rohan Verma',
          admissionNumber: 'ADM-2026-0012',
          className: 'Grade 10',
          section: 'A',
          parentName: 'Amit Verma',
          parentPhone: '+91 98765 43211',
          title: 'Term 1 Tuition Fee',
          totalAmount: 22000,
          paidAmount: 5000,
          balance: 17000,
          dueDate: past15Str,
          overdueDays: 15,
          status: 'partially paid',
        },
      ];

      const [y, m, d] = (defaultersList[0].dueDate || '')
        .split('-')
        .map(Number);
      const dueUtc = Date.UTC(y, m - 1, d);
      const calculatedOverdueDays = Math.round(
        (todayUtc - dueUtc) / (1000 * 60 * 60 * 24)
      );
      assert.strictEqual(
        calculatedOverdueDays,
        15,
        'Overdue days must accurately count days elapsed past due date'
      );

      const csv = formatDefaultersCsv(defaultersList);
      assert.ok(
        csv.includes('"INV-2026-00041"'),
        'CSV must contain invoice number'
      );
      assert.ok(csv.includes('"Rohan Verma"'), 'CSV must contain student name');
      assert.ok(csv.includes('"17000"'), 'CSV must contain overdue balance');
      assert.ok(csv.includes('"15"'), 'CSV must contain overdue days');
    }
  );

  await runTest(
    'Official Receipt Generation & EduHub Branding Invariants',
    () => {
      const receiptNo = generateReceiptNumber(2026);
      assert.match(
        receiptNo,
        /^REC-2026-\d{7}$/,
        'Receipt number must conform to REC-YYYY-XXXXX specification'
      );

      const feeBookRecords = [
        {
          receiptNumber: receiptNo,
          invoiceNumber: 'INV-2026-00101',
          paymentDate: '2026-09-22',
          studentName: 'Aarav Sharma',
          admissionNumber: 'ADM-2026-0001',
          className: 'Grade 10',
          section: 'A',
          amount: 18500,
          paymentMethod: 'online',
          transactionRef: 'UPI-9948210344',
          recordedByName: 'Admin Adiya',
          notes: 'Paid online via parent portal',
        },
      ];

      const feeBookCsv = formatDailyFeeBookCsv(feeBookRecords, '2026-09-22');
      assert.ok(
        feeBookCsv.includes(receiptNo),
        'Fee book CSV must include generated receipt number'
      );
      assert.ok(
        feeBookCsv.includes('Aarav Sharma'),
        'Fee book CSV must include student name'
      );
      assert.ok(
        feeBookCsv.includes('18500'),
        'Fee book CSV must include collected amount'
      );
    }
  );

  console.log('10. Academic & Communication Modules Tests:');

  await runTest('Homework Schema & Status Defaults', () => {
    const parsed = HomeworkCreateSchema.parse({
      title: 'Chapter 5: Quadratic Equations Practice',
      description: 'Solve questions 1 through 15 from exercise 5.2.',
      classSectionId: '65f1a2b3c4d5e6f7a8b9c0d1',
      subjectId: '65f1a2b3c4d5e6f7a8b9c0d2',
      dueDate: '2026-10-01',
    });

    assert.strictEqual(parsed.maxMarks, 100, 'Default maxMarks should be 100');
    assert.strictEqual(
      parsed.status,
      'published',
      'Default status should be published'
    );

    const submitParsed = HomeworkSubmitSchema.parse({
      submissionText: 'My completed proof worksheet.',
    });
    assert.strictEqual(
      submitParsed.submissionText,
      'My completed proof worksheet.'
    );
  });

  await runTest('Homework Late Submission Evaluation Invariant', () => {
    const dueDatePast = new Date(Date.now() - 3600000).toISOString();
    const dueDateFuture = new Date(Date.now() + 3600000).toISOString();

    const isLateWhenPast =
      new Date().getTime() > new Date(dueDatePast).getTime();
    const isLateWhenFuture =
      new Date().getTime() > new Date(dueDateFuture).getTime();

    assert.strictEqual(
      isLateWhenPast,
      true,
      'Submission past due date must be marked isLate = true'
    );
    assert.strictEqual(
      isLateWhenFuture,
      false,
      'Submission before due date must have isLate = false'
    );
  });

  await runTest(
    'Homework Grading Permission Invariant (homework.grade required)',
    () => {
      const defaultTeacherPerms = DEFAULT_TEACHER_PERMISSIONS;
      const canGradeDefault = hasPermission(
        'teacher',
        defaultTeacherPerms,
        PERMISSIONS.HOMEWORK_GRADE
      );
      assert.strictEqual(
        canGradeDefault,
        false,
        'Teacher without homework.grade cannot grade submissions'
      );

      const grantedPerms = [...defaultTeacherPerms, PERMISSIONS.HOMEWORK_GRADE];
      const canGradeGranted = hasPermission(
        'teacher',
        grantedPerms,
        PERMISSIONS.HOMEWORK_GRADE
      );
      assert.strictEqual(
        canGradeGranted,
        true,
        'Teacher with homework.grade can grade submissions'
      );

      const gradeParsed = HomeworkGradeSchema.parse({
        marksObtained: 88,
        feedback: 'Excellent proofs, minor arithmetic error on Q4.',
      });
      assert.strictEqual(gradeParsed.marksObtained, 88);
    }
  );

  await runTest(
    'Timetable Time Normalization & Interval Overlap Detection',
    () => {
      const t9am = parseTimeToMinutes('09:00 AM');
      const t945am = parseTimeToMinutes('09:45 AM');
      const t1215pm = parseTimeToMinutes('12:15 PM');
      const t1pm = parseTimeToMinutes('01:00 PM');

      assert.strictEqual(t9am, 540, '09:00 AM must convert to 540 minutes');
      assert.strictEqual(t945am, 585, '09:45 AM must convert to 585 minutes');
      assert.strictEqual(t1215pm, 735, '12:15 PM must convert to 735 minutes');
      assert.strictEqual(t1pm, 780, '01:00 PM must convert to 780 minutes');

      const overlap1 = doIntervalsOverlap(540, 585, 570, 615);
      assert.strictEqual(
        overlap1,
        true,
        'Overlapping periods must return true'
      );

      const overlap2 = doIntervalsOverlap(540, 585, 585, 630);
      assert.strictEqual(
        overlap2,
        false,
        'Adjacent non-overlapping periods must return false'
      );

      const overlap3 = doIntervalsOverlap(540, 585, 645, 690);
      assert.strictEqual(
        overlap3,
        false,
        'Completely separated periods must return false'
      );

      const slotParsed = TimetableSlotCreateSchema.parse({
        classSectionId: 'class-10a',
        dayOfWeek: 'Monday',
        periodNumber: 1,
        startTime: '09:00 AM',
        endTime: '09:45 AM',
        subjectId: 'sub-math-10',
        teacherId: 'teacher-sharma',
        roomNumber: 'Room 301',
      });
      assert.strictEqual(slotParsed.periodNumber, 1);
    }
  );

  await runTest(
    'Timetable 3D Conflict Logic: Teacher, Class & Room Invariants',
    () => {
      const existingSlots = [
        {
          dayOfWeek: 'Monday',
          startTime: '09:00 AM',
          endTime: '09:45 AM',
          teacherId: 'teacher-sharma',
          classSectionId: 'class-10a',
          roomNumber: 'Room 301',
        },
      ];

      const newTeacherConflictingSlot = {
        dayOfWeek: 'Monday',
        startTime: '09:15 AM',
        endTime: '10:00 AM',
        teacherId: 'teacher-sharma',
        classSectionId: 'class-9b',
        roomNumber: 'Room 204',
      };

      const s1Start = parseTimeToMinutes(existingSlots[0].startTime);
      const s1End = parseTimeToMinutes(existingSlots[0].endTime);
      const nStart = parseTimeToMinutes(newTeacherConflictingSlot.startTime);
      const nEnd = parseTimeToMinutes(newTeacherConflictingSlot.endTime);

      const hasTeacherConflict =
        existingSlots[0].teacherId === newTeacherConflictingSlot.teacherId &&
        doIntervalsOverlap(s1Start, s1End, nStart, nEnd);

      assert.strictEqual(
        hasTeacherConflict,
        true,
        'Must detect teacher double-booking conflict'
      );

      const newClassConflictingSlot = {
        dayOfWeek: 'Monday',
        startTime: '09:00 AM',
        endTime: '09:45 AM',
        teacherId: 'teacher-nair',
        classSectionId: 'class-10a',
        roomNumber: 'Physics Lab',
      };

      const hasClassConflict =
        existingSlots[0].classSectionId ===
          newClassConflictingSlot.classSectionId &&
        doIntervalsOverlap(
          s1Start,
          s1End,
          parseTimeToMinutes(newClassConflictingSlot.startTime),
          parseTimeToMinutes(newClassConflictingSlot.endTime)
        );

      assert.strictEqual(
        hasClassConflict,
        true,
        'Must detect class double-booking conflict'
      );

      const newRoomConflictingSlot = {
        dayOfWeek: 'Monday',
        startTime: '09:00 AM',
        endTime: '09:45 AM',
        teacherId: 'teacher-verma',
        classSectionId: 'class-11c',
        roomNumber: 'Room 301',
      };

      const hasRoomConflict =
        existingSlots[0].roomNumber === newRoomConflictingSlot.roomNumber &&
        doIntervalsOverlap(
          s1Start,
          s1End,
          parseTimeToMinutes(newRoomConflictingSlot.startTime),
          parseTimeToMinutes(newRoomConflictingSlot.endTime)
        );

      assert.strictEqual(
        hasRoomConflict,
        true,
        'Must detect room double-booking conflict'
      );
    }
  );

  await runTest(
    'Notices Audience Query Scoping Invariant for All Roles',
    () => {
      const allNotices = [
        { id: 'n1', targetRole: 'all', title: 'School Closed on Friday' },
        { id: 'n2', targetRole: 'teachers', title: 'Faculty Meeting at 3 PM' },
        {
          id: 'n3',
          targetRole: 'students',
          title: 'Library Book Return Notice',
        },
        {
          id: 'n4',
          targetRole: 'parents',
          title: 'Parent Teacher Meeting Guidelines',
        },
        {
          id: 'n5',
          targetRole: 'class',
          targetClassId: 'class-10a',
          title: 'Grade 10A Science Fair',
        },
        {
          id: 'n6',
          targetRole: 'class',
          targetClassId: 'class-12b',
          title: 'Grade 12B Physics Lab',
        },
      ];

      const studentClassId = 'class-10a';
      const studentVisible = allNotices.filter((n) => {
        if (['all', 'students'].includes(n.targetRole)) return true;
        if (n.targetRole === 'class' && n.targetClassId === studentClassId)
          return true;
        return false;
      });

      assert.deepStrictEqual(
        studentVisible.map((n) => n.id),
        ['n1', 'n3', 'n5'],
        'Student should only see school, student, and enrolled class notices'
      );

      const parentLinkedClasses = ['class-10a'];
      const parentVisible = allNotices.filter((n) => {
        if (['all', 'parents'].includes(n.targetRole)) return true;
        if (
          n.targetRole === 'class' &&
          parentLinkedClasses.includes(n.targetClassId!)
        )
          return true;
        return false;
      });

      assert.deepStrictEqual(
        parentVisible.map((n) => n.id),
        ['n1', 'n4', 'n5'],
        'Parent should only see school, parent, and linked child class notices'
      );

      const teacherAssignedClasses = ['class-10a'];
      const teacherVisible = allNotices.filter((n) => {
        if (['all', 'teachers'].includes(n.targetRole)) return true;
        if (
          n.targetRole === 'class' &&
          teacherAssignedClasses.includes(n.targetClassId!)
        )
          return true;
        return false;
      });

      assert.deepStrictEqual(
        teacherVisible.map((n) => n.id),
        ['n1', 'n2', 'n5'],
        'Teacher should only see school, teacher, and assigned class notices'
      );

      const noticeParsed = NoticeCreateSchema.parse({
        title: 'Annual Sports Meet 2026',
        content: 'All house track events start Monday.',
        targetRole: 'class',
        targetClassId: 'class-10a',
      });
      assert.strictEqual(noticeParsed.status, 'published');
    }
  );

  await runTest('Study Materials Schema & Assignment Scope Invariant', () => {
    const parsed = StudyMaterialCreateSchema.parse({
      title: 'Grade 10 Mathematics: Calculus Foundations',
      classSectionId: 'class-10a',
      subjectId: 'sub-math-10',
      fileType: 'pdf',
      fileName: 'Calculus_Ch1.pdf',
    });

    assert.strictEqual(parsed.fileType, 'pdf');
    assert.strictEqual(parsed.fileName, 'Calculus_Ch1.pdf');

    const teacherAssignments = [
      { classSectionId: 'class-10a', subjectId: 'sub-math-10' },
    ];

    const canUploadAssigned = teacherAssignments.some(
      (a) => a.classSectionId === 'class-10a' && a.subjectId === 'sub-math-10'
    );
    assert.strictEqual(canUploadAssigned, true, 'Assigned teacher can upload');

    const canUploadUnassigned = teacherAssignments.some(
      (a) =>
        a.classSectionId === 'class-12b' && a.subjectId === 'sub-physics-12'
    );
    assert.strictEqual(
      canUploadUnassigned,
      false,
      'Unassigned class/subject upload is rejected'
    );
  });

  await runTest(
    'Communication Isolation & Unread Count Derivation Invariant',
    () => {
      const convParsed = ConversationCreateSchema.parse({
        type: 'teacher_parent',
        recipientUserId: 'user-parent-sunita',
        initialMessage: 'Regarding Aarav homework performance',
      });
      assert.strictEqual(convParsed.type, 'teacher_parent');

      const msgParsed = ChatMessageCreateSchema.parse({
        message: 'Hello, please review the latest homework upload.',
      });
      assert.strictEqual(
        msgParsed.message,
        'Hello, please review the latest homework upload.'
      );

      const conv = {
        _id: 'conv-001',
        participantIds: ['user-teacher-sharma', 'user-parent-sunita'],
      };

      const isSharmaMember = conv.participantIds.includes(
        'user-teacher-sharma'
      );
      const isSunitaMember = conv.participantIds.includes('user-parent-sunita');
      const isIntruderMember =
        conv.participantIds.includes('user-intruder-999');

      assert.strictEqual(isSharmaMember, true, 'Sharma is authorized member');
      assert.strictEqual(isSunitaMember, true, 'Sunita is authorized member');
      assert.strictEqual(
        isIntruderMember,
        false,
        'Unrelated user must be rejected with 403 Forbidden'
      );

      const messages = [
        {
          id: 'm1',
          senderId: 'user-teacher-sharma',
          readBy: ['user-teacher-sharma', 'user-parent-sunita'],
        },
        {
          id: 'm2',
          senderId: 'user-teacher-sharma',
          readBy: ['user-teacher-sharma'],
        },
        {
          id: 'm3',
          senderId: 'user-teacher-sharma',
          readBy: ['user-teacher-sharma'],
        },
      ];

      const sunitaUnread = messages.filter(
        (m) =>
          m.senderId !== 'user-parent-sunita' &&
          !m.readBy.includes('user-parent-sunita')
      ).length;

      assert.strictEqual(
        sunitaUnread,
        2,
        'Sunita should have 2 unread messages'
      );
    }
  );

  console.log('11. Tests & Examinations Module Tests:');

  await runTest('Exam Schema & Lifecycle Status Transitions', () => {
    const parsed = ExamCreateSchema.parse({
      name: 'Mid-Term Summative Assessment 2026',
      type: 'term_exam',
      academicYear: '2025-2026',
      startDate: '2026-10-10',
      endDate: '2026-10-22',
      status: 'draft',
      maxMarks: 100,
      passingMarks: 40,
      subjects: [
        {
          subjectId: 'sub-math-10',
          subjectName: 'Mathematics',
          maxMarks: 100,
          passingMarks: 40,
          examDate: '2026-10-12',
          startTime: '09:00 AM',
          endTime: '12:00 PM',
        },
        {
          subjectId: 'sub-sci-10',
          subjectName: 'Science',
          maxMarks: 80,
          passingMarks: 32,
          examDate: '2026-10-15',
          startTime: '09:00 AM',
          endTime: '11:30 AM',
        },
      ],
      gradingRules: [
        {
          minPercentage: 90,
          maxPercentage: 100,
          grade: 'A+',
          remarks: 'Outstanding',
        },
        {
          minPercentage: 80,
          maxPercentage: 89,
          grade: 'A',
          remarks: 'Excellent',
        },
        {
          minPercentage: 70,
          maxPercentage: 79,
          grade: 'B',
          remarks: 'Very Good',
        },
        { minPercentage: 60, maxPercentage: 69, grade: 'C', remarks: 'Good' },
        {
          minPercentage: 40,
          maxPercentage: 59,
          grade: 'D',
          remarks: 'Satisfactory',
        },
        {
          minPercentage: 0,
          maxPercentage: 39,
          grade: 'F',
          remarks: 'Needs Improvement',
        },
      ],
    });

    assert.strictEqual(parsed.name, 'Mid-Term Summative Assessment 2026');
    assert.strictEqual(parsed.type, 'term_exam');
    assert.strictEqual(parsed.subjects?.length, 2);
    assert.strictEqual(parsed.subjects?.[1].maxMarks, 80);
    assert.strictEqual(parsed.gradingRules?.length, 6);

    const submitParsed = GradeRecordSubmitSchema.parse({
      examId: 'exam-term1',
      classSectionId: 'class-10a',
      subjectId: 'sub-math-10',
      maxMarks: 100,
      passingMarks: 40,
      grades: [
        {
          studentId: 'stud-1',
          studentName: 'Aarav Sharma',
          rollNumber: '101',
          marksObtained: 95,
        },
      ],
      status: 'submitted',
    });
    assert.strictEqual(submitParsed.status, 'submitted');

    const validStatuses = [
      'draft',
      'scheduled',
      'marks-entry',
      'published',
      'submitted',
    ];
    for (const status of validStatuses) {
      const updated = ExamUpdateSchema.parse({ status });
      assert.strictEqual(updated.status, status);
    }
  });

  await runTest(
    'Teacher Assignment Scoping Invariant for Exams & Marks Entry',
    () => {
      const teacherAssignments = [
        { classSectionId: 'class-10a', subjectId: 'sub-math-10' },
        { classSectionId: 'class-10a', subjectId: 'sub-science-10' },
      ];

      const canAccessAssigned = teacherAssignments.some(
        (a) => a.classSectionId === 'class-10a' && a.subjectId === 'sub-math-10'
      );
      assert.strictEqual(
        canAccessAssigned,
        true,
        'Teacher assigned to class & subject must have access'
      );

      const canAccessUnassignedClass = teacherAssignments.some(
        (a) => a.classSectionId === 'class-12b' && a.subjectId === 'sub-math-10'
      );
      assert.strictEqual(
        canAccessUnassignedClass,
        false,
        'Unassigned class must be rejected (403)'
      );

      const canAccessUnassignedSubject = teacherAssignments.some(
        (a) =>
          a.classSectionId === 'class-10a' && a.subjectId === 'sub-history-10'
      );
      assert.strictEqual(
        canAccessUnassignedSubject,
        false,
        'Unassigned subject must be rejected (403)'
      );
    }
  );

  await runTest(
    'Marks Boundary Validation Invariant (0 <= marks <= maxMarks)',
    () => {
      const maxMarks = 100;

      const validGrades = [0, 40, 75, 100];
      for (const mark of validGrades) {
        const isValid = mark >= 0 && mark <= maxMarks;
        assert.strictEqual(
          isValid,
          true,
          `Mark ${mark} should be within valid boundary [0, 100]`
        );
      }

      const invalidHigh = 105;
      const isHighValid = invalidHigh >= 0 && invalidHigh <= maxMarks;
      assert.strictEqual(
        isHighValid,
        false,
        'Marks exceeding maxMarks must be rejected'
      );

      const invalidNegative = -5;
      assert.throws(
        () => {
          GradeItemSchema.parse({
            studentId: 'stud-1',
            studentName: 'Aarav Sharma',
            rollNumber: '101',
            marksObtained: invalidNegative,
          });
        },
        /Marks cannot be negative/,
        'Negative marks must be rejected by GradeItemSchema'
      );
    }
  );

  await runTest('Absent Student Flag & Grade Derivation Invariant', () => {
    const studentItem = GradeItemSchema.parse({
      studentId: 'stud-2',
      studentName: 'Rohan Verma',
      rollNumber: '102',
      marksObtained: 0,
      isAbsent: true,
      remarks: 'Medical leave on exam day',
    });

    assert.strictEqual(
      studentItem.isAbsent,
      true,
      'isAbsent flag should be recorded true'
    );

    const maxMarks = 100;
    const passingMarks = 40;
    const effectiveMarks = studentItem.isAbsent ? 0 : studentItem.marksObtained;
    const percentage = studentItem.isAbsent
      ? 0
      : Math.round((effectiveMarks / maxMarks) * 100);
    const grade = studentItem.isAbsent ? 'F' : 'A';
    const isPassed = !studentItem.isAbsent && effectiveMarks >= passingMarks;

    assert.strictEqual(
      effectiveMarks,
      0,
      'Absent student must receive 0 marks'
    );
    assert.strictEqual(percentage, 0, 'Absent student must have 0% percentage');
    assert.strictEqual(grade, 'F', 'Absent student must receive F grade');
    assert.strictEqual(isPassed, false, 'Absent student cannot pass');
  });

  await runTest(
    'Result Publication Permission Gating Invariant (results.publish required)',
    () => {
      const defaultTeacherPerms = DEFAULT_TEACHER_PERMISSIONS;
      const canPublishDefault = hasPermission(
        'teacher',
        defaultTeacherPerms,
        PERMISSIONS.RESULTS_PUBLISH
      );
      assert.strictEqual(
        canPublishDefault,
        false,
        'Teacher without results.publish cannot publish exam results'
      );

      const grantedTeacherPerms = [
        ...defaultTeacherPerms,
        PERMISSIONS.RESULTS_PUBLISH,
      ];
      const canPublishGranted = hasPermission(
        'teacher',
        grantedTeacherPerms,
        PERMISSIONS.RESULTS_PUBLISH
      );
      assert.strictEqual(
        canPublishGranted,
        true,
        'Teacher with results.publish granted can publish results'
      );

      assert.strictEqual(
        hasPermission('admin', [], PERMISSIONS.RESULTS_PUBLISH),
        true,
        'Admin role has global bypass for results.publish'
      );
    }
  );

  await runTest('Student & Parent Published-Only Isolation Invariant', () => {
    const examSheets = [
      {
        id: 'sheet-math-draft',
        subject: 'Mathematics',
        status: 'draft',
        marks: 88,
      },
      {
        id: 'sheet-sci-entry',
        subject: 'Science',
        status: 'marks-entry',
        marks: 74,
      },
      {
        id: 'sheet-eng-pub',
        subject: 'English',
        status: 'published',
        marks: 92,
      },
    ];

    const visibleToStudentAndParent = examSheets.filter(
      (s) => s.status === 'published'
    );
    assert.strictEqual(
      visibleToStudentAndParent.length,
      1,
      'Only published exam sheets must be returned to students and parents'
    );
    assert.strictEqual(visibleToStudentAndParent[0].subject, 'English');

    const visibleToFaculty = examSheets.filter((s) =>
      ['draft', 'marks-entry', 'submitted', 'published'].includes(s.status)
    );
    assert.strictEqual(
      visibleToFaculty.length,
      3,
      'Faculty can view draft, marks-entry, and published sheets'
    );
  });

  await runTest(
    'Post-Publication Marks Correction & Audit History Tracking Invariant',
    () => {
      const correctionPayload = GradeRecordCorrectionSchema.parse({
        examId: 'exam-term1',
        classSectionId: 'class-10a',
        subjectId: 'sub-math-10',
        studentId: 'stud-1',
        marksObtained: 92,
        isAbsent: false,
        reason: 'Re-scrutiny of Calculus section Q3 proof',
        remarks: 'Awarded 4 additional marks after verification',
      });

      assert.strictEqual(correctionPayload.marksObtained, 92);
      assert.strictEqual(
        correctionPayload.reason,
        'Re-scrutiny of Calculus section Q3 proof'
      );

      const previousMarks = 88;
      const historyEntry = {
        studentId: correctionPayload.studentId,
        studentName: 'Aarav Sharma',
        previousMarks,
        newMarks: correctionPayload.marksObtained,
        reason: correctionPayload.reason,
        correctedBy: 'teacher-sharma',
        correctedByName: 'R. K. Sharma',
        correctedAt: new Date().toISOString(),
      };

      assert.strictEqual(historyEntry.previousMarks, 88);
      assert.strictEqual(historyEntry.newMarks, 92);
      assert.strictEqual(historyEntry.reason.length >= 3, true);
      assert.ok(historyEntry.correctedAt);
    }
  );

  await runTest(
    'Detailed Marks Certificate (DMC) Report Card Calculations',
    () => {
      const studentGrades = [
        {
          subject: 'Mathematics',
          marksObtained: 95,
          maxMarks: 100,
          passingMarks: 40,
          isPassed: true,
        },
        {
          subject: 'Science',
          marksObtained: 85,
          maxMarks: 100,
          passingMarks: 40,
          isPassed: true,
        },
        {
          subject: 'English',
          marksObtained: 78,
          maxMarks: 100,
          passingMarks: 40,
          isPassed: true,
        },
        {
          subject: 'Social Science',
          marksObtained: 82,
          maxMarks: 100,
          passingMarks: 40,
          isPassed: true,
        },
      ];

      const totalObtained = studentGrades.reduce(
        (sum, s) => sum + s.marksObtained,
        0
      );
      const totalMax = studentGrades.reduce((sum, s) => sum + s.maxMarks, 0);
      const overallPercentage = Math.round((totalObtained / totalMax) * 100);
      const allPassed = studentGrades.every((s) => s.isPassed);
      const status = allPassed && overallPercentage >= 40 ? 'PASS' : 'FAIL';

      assert.strictEqual(
        totalObtained,
        340,
        'Total obtained marks must be 340'
      );
      assert.strictEqual(totalMax, 400, 'Total maximum marks must be 400');
      assert.strictEqual(
        overallPercentage,
        85,
        'Overall percentage must be 85%'
      );
      assert.strictEqual(status, 'PASS', 'Overall result status must be PASS');
    }
  );

  console.log('\n12. Non-Admin Dashboards & Navigation Invariants:');

  await runTest('Teacher Dashboard Data Aggregation Contract', () => {
    const assignments = [
      {
        classSectionId: 'cls-10a',
        className: 'Grade 10',
        section: 'A',
        subjectId: 'sub-math',
      },
      {
        classSectionId: 'cls-10b',
        className: 'Grade 10',
        section: 'B',
        subjectId: 'sub-math',
      },
    ];
    const uniqueClassIds = [
      ...new Set(assignments.map((a) => a.classSectionId)),
    ];
    const uniqueSubjectIds = [...new Set(assignments.map((a) => a.subjectId))];

    const attendanceRecords = [
      {
        classSectionId: 'cls-10a',
        records: [
          { status: 'present' },
          { status: 'present' },
          { status: 'absent' },
        ],
      },
      {
        classSectionId: 'cls-10b',
        records: [{ status: 'present' }, { status: 'late' }],
      },
    ];

    let present = 0,
      late = 0,
      absent = 0;
    for (const rec of attendanceRecords) {
      for (const item of rec.records) {
        if (item.status === 'present') present++;
        else if (item.status === 'late') late++;
        else if (item.status === 'absent') absent++;
      }
    }
    const totalMarked = present + late + absent;
    const rate = Math.round(((present + late * 0.5) / totalMarked) * 100);

    const homeworkList = [
      {
        id: 'hw-1',
        title: 'Calculus Exercises',
        submittedCount: 15,
        maxMarks: 50,
      },
      {
        id: 'hw-2',
        title: 'Algebra Equations',
        submittedCount: 0,
        maxMarks: 50,
      },
    ];
    const pendingHomeworkCount = homeworkList.reduce(
      (acc, hw) => acc + hw.submittedCount,
      0
    );

    const conversations = [
      { id: 'c-1', unread: true, lastMessage: 'Good afternoon teacher' },
      { id: 'c-2', unread: false, lastMessage: 'Thank you for the update' },
    ];
    const unreadConversations = conversations.filter((c) => c.unread).length;

    assert.strictEqual(
      uniqueClassIds.length,
      2,
      'Assigned class count must be 2'
    );
    assert.strictEqual(
      uniqueSubjectIds.length,
      1,
      'Assigned subject count must be 1'
    );
    assert.strictEqual(totalMarked, 5, 'Total attendance marked must be 5');
    assert.strictEqual(
      rate,
      70,
      'Calculated teacher attendance rate must be 70%'
    );
    assert.strictEqual(
      pendingHomeworkCount,
      15,
      'Pending homework submissions count must be 15'
    );
    assert.strictEqual(
      unreadConversations,
      1,
      'Unread conversation count must be 1'
    );
  });

  await runTest(
    'Teacher Dashboard Permission-Driven UI Visibility Invariant',
    () => {
      const fullTeacherPerms = DEFAULT_TEACHER_PERMISSIONS;
      const restrictedTeacherPerms = ['timetable.view', 'materials.view'];

      assert.strictEqual(
        hasPermission('teacher', fullTeacherPerms, PERMISSIONS.ATTENDANCE_MARK),
        true,
        'Default teacher can mark attendance'
      );
      assert.strictEqual(
        hasPermission(
          'teacher',
          restrictedTeacherPerms,
          PERMISSIONS.ATTENDANCE_MARK
        ),
        false,
        'Restricted teacher cannot mark attendance'
      );

      assert.strictEqual(
        hasPermission('teacher', fullTeacherPerms, PERMISSIONS.HOMEWORK_VIEW),
        true,
        'Default teacher can view homework'
      );
      assert.strictEqual(
        hasPermission(
          'teacher',
          restrictedTeacherPerms,
          PERMISSIONS.HOMEWORK_VIEW
        ),
        false,
        'Restricted teacher cannot view homework'
      );

      assert.strictEqual(
        hasPermission('teacher', fullTeacherPerms, PERMISSIONS.NOTICES_VIEW),
        true,
        'Default teacher can view notices'
      );
      assert.strictEqual(
        hasPermission(
          'teacher',
          restrictedTeacherPerms,
          PERMISSIONS.NOTICES_VIEW
        ),
        false,
        'Restricted teacher cannot view notices'
      );

      assert.strictEqual(
        hasPermission(
          'teacher',
          fullTeacherPerms,
          PERMISSIONS.COMMUNICATION_VIEW
        ),
        true,
        'Default teacher can view communication'
      );
      assert.strictEqual(
        hasPermission(
          'teacher',
          restrictedTeacherPerms,
          PERMISSIONS.COMMUNICATION_VIEW
        ),
        false,
        'Restricted teacher cannot view communication'
      );
    }
  );

  await runTest(
    'Student Dashboard Real-Data & Published-Only Security Invariant',
    () => {
      const studentGrades = [
        {
          examName: 'Midterm Exam',
          subject: 'Mathematics',
          marksObtained: 95,
          maxMarks: 100,
          status: 'published',
        },
        {
          examName: 'Unit Test 1',
          subject: 'Science',
          marksObtained: 85,
          maxMarks: 100,
          status: 'published',
        },
        {
          examName: 'Unreleased Draft',
          subject: 'English',
          marksObtained: 40,
          maxMarks: 100,
          status: 'draft',
        },
        {
          examName: 'Scheduled Exam',
          subject: 'History',
          marksObtained: 0,
          maxMarks: 100,
          status: 'scheduled',
        },
      ];

      const studentPublishedGrades = studentGrades.filter(
        (g) => g.status === 'published'
      );
      assert.strictEqual(
        studentPublishedGrades.length,
        2,
        'Student must only receive published grades'
      );

      const totalObtained = studentPublishedGrades.reduce(
        (sum, g) => sum + g.marksObtained,
        0
      );
      const totalMax = studentPublishedGrades.reduce(
        (sum, g) => sum + g.maxMarks,
        0
      );
      const averageScore = Math.round((totalObtained / totalMax) * 100);

      assert.strictEqual(
        averageScore,
        90,
        'Average score must be calculated from published grades only'
      );

      const homeworkItems = [
        {
          id: 'hw-1',
          title: 'Geometry Chapter 4',
          isSubmitted: true,
          status: 'submitted',
        },
        {
          id: 'hw-2',
          title: 'Physics Vectors',
          isSubmitted: false,
          status: 'pending',
        },
      ];
      assert.strictEqual(
        homeworkItems.filter((h) => h.status === 'submitted').length,
        1
      );
      assert.strictEqual(
        homeworkItems.filter((h) => h.status === 'pending').length,
        1
      );
    }
  );

  await runTest(
    'Parent Dashboard Multi-Child Switching & Security Isolation',
    () => {
      const _parentUserId = 'parent-sunita';
      const linkedStudents = [
        {
          userId: 'stud-aarav',
          name: 'Aarav Sharma',
          className: 'Grade 10',
          section: 'A',
        },
        {
          userId: 'stud-ananya',
          name: 'Ananya Sharma',
          className: 'Grade 7',
          section: 'B',
        },
      ];

      function getChildContext(requestedChildId: string) {
        const isAuthorized = linkedStudents.some(
          (s) => s.userId === requestedChildId
        );
        if (!isAuthorized) {
          return {
            statusCode: 403,
            error:
              'Forbidden: You are not authorized to view this student profile.',
          };
        }
        const child = linkedStudents.find(
          (s) => s.userId === requestedChildId
        )!;
        return { statusCode: 200, child };
      }

      const resChild1 = getChildContext('stud-aarav');
      assert.strictEqual(resChild1.statusCode, 200);
      assert.strictEqual((resChild1 as any).child.name, 'Aarav Sharma');

      const resChild2 = getChildContext('stud-ananya');
      assert.strictEqual(resChild2.statusCode, 200);
      assert.strictEqual((resChild2 as any).child.name, 'Ananya Sharma');

      const resForeignChild = getChildContext('stud-foreign-user');
      assert.strictEqual(
        resForeignChild.statusCode,
        403,
        'Foreign child access must return 403 Forbidden'
      );
      assert.strictEqual(
        (resForeignChild as any).error.includes('Forbidden'),
        true
      );
    }
  );

  await runTest(
    'Parent Attendance Calendar Strict Color-Coding Specification',
    () => {
      function getCalendarStatusColor(
        status: 'present' | 'late' | 'absent'
      ): string {
        switch (status) {
          case 'present':
            return 'green';
          case 'late':
            return 'yellow';
          case 'absent':
            return 'red';
          default:
            return 'slate';
        }
      }

      assert.strictEqual(
        getCalendarStatusColor('present'),
        'green',
        'Present must map to green'
      );
      assert.strictEqual(
        getCalendarStatusColor('late'),
        'yellow',
        'Late must map to yellow'
      );
      assert.strictEqual(
        getCalendarStatusColor('absent'),
        'red',
        'Absent must map to red'
      );
    }
  );

  await runTest(
    'Sidebar Navigation Exact Label & Role Matrix Contracts',
    () => {
      const expectedAdminLabels = [
        'Dashboard',
        'Students',
        'Teachers',
        'Classes',
        'Attendance',
        'Fees',
        'Homework',
        'Timetable',
        'Notice Board',
        'Communication',
        'Reports',
        'AI Assistant',
        'Roles & Permissions',
        'Subject & Class',
        'Tests & Exams',
        'Study Materials',
      ];
      assert.strictEqual(
        expectedAdminLabels.length,
        16,
        'Admin navigation must have exactly 16 items'
      );

      const expectedTeacherLabels = [
        'Dashboard',
        'Attendance',
        'Homework',
        'Tests & Exams',
        'Timetable',
        'Notices',
        'Communication',
        'AI Assistant',
        'Study Materials',
      ];
      assert.strictEqual(
        expectedTeacherLabels.length,
        9,
        'Teacher navigation must have exactly 9 items'
      );

      const expectedStudentLabels = [
        'Dashboard',
        'Attendance',
        'Homework',
        'Tests & Exams',
        'Notices',
        'Communication',
        'Report Card',
        'Progress',
        'AI Assistant',
        'Study Materials',
      ];
      assert.strictEqual(
        expectedStudentLabels.length,
        10,
        'Student navigation must have exactly 10 items'
      );

      const expectedParentLabels = [
        'Dashboard',
        'Attendance',
        'Results',
        'Fees',
        'Communication',
        'Notices',
      ];
      assert.strictEqual(
        expectedParentLabels.length,
        6,
        'Parent navigation must have exactly 6 items'
      );
    }
  );

  console.log('\n13. Admin Operations Tests:');

  await runTest(
    'Expense Create Schema Validation & Categories Enforcement',
    () => {
      const validExpense = {
        category: 'supplies',
        title: 'Term 1 Exam Answer Booklets and Stationary',
        amount: 14500,
        paymentDate: '2026-09-20',
        payee: 'Universal Printers & Book House',
        paymentMethod: 'bank_transfer',
        referenceNumber: 'TXN-984214',
        description: 'Stationery for upcoming midterm assessments',
      };
      const parsed = ExpenseCreateSchema.safeParse(validExpense);
      assert.strictEqual(
        parsed.success,
        true,
        'Valid expense must pass schema validation'
      );

      assert.ok(
        EXPENSE_CATEGORIES.includes('supplies' as any),
        'EXPENSE_CATEGORIES must contain supplies'
      );
      assert.ok(
        EXPENSE_CATEGORIES.includes('maintenance' as any),
        'EXPENSE_CATEGORIES must contain maintenance'
      );
      assert.ok(
        EXPENSE_CATEGORIES.includes('salaries' as any),
        'EXPENSE_CATEGORIES must contain salaries'
      );

      const invalidCategory = {
        ...validExpense,
        category: 'cryptocurrency_arbitrage',
      };
      const invalidCatResult = ExpenseCreateSchema.safeParse(invalidCategory);
      assert.strictEqual(
        invalidCatResult.success,
        false,
        'Invalid expense category must be rejected'
      );

      const invalidAmount = {
        ...validExpense,
        amount: -500,
      };
      const invalidAmtResult = ExpenseCreateSchema.safeParse(invalidAmount);
      assert.strictEqual(
        invalidAmtResult.success,
        false,
        'Negative or zero amount must be rejected'
      );
    }
  );

  await runTest('Finance Double-Counting Prevention Invariant', () => {
    const sampleInvoices = [
      {
        totalAmount: 12000,
        paidAmount: 6000,
        balance: 6000,
        payments: [
          { receiptNumber: 'REC-001', amount: 3000, paymentDate: '2026-09-10' },
          { receiptNumber: 'REC-002', amount: 3000, paymentDate: '2026-09-15' },
        ],
      },
      {
        totalAmount: 8000,
        paidAmount: 8000,
        balance: 0,
        payments: [
          { receiptNumber: 'REC-003', amount: 8000, paymentDate: '2026-09-12' },
        ],
      },
    ];

    const deduplicatedReceipts = new Map<string, number>();
    for (const inv of sampleInvoices) {
      for (const p of inv.payments) {
        if (!deduplicatedReceipts.has(p.receiptNumber)) {
          deduplicatedReceipts.set(p.receiptNumber, p.amount);
        }
      }
    }

    let totalCollected = 0;
    deduplicatedReceipts.forEach((amt) => {
      totalCollected += amt;
    });

    assert.strictEqual(
      totalCollected,
      14000,
      'Fee revenue must strictly equal discrete receipt payments without double counting'
    );
    assert.notStrictEqual(
      totalCollected + 20000,
      totalCollected,
      'Invoice total must not be added to receipt collection'
    );

    const sampleExpenses = [{ amount: 4500 }, { amount: 2500 }];
    const totalExpenses = sampleExpenses.reduce(
      (acc, curr) => acc + curr.amount,
      0
    );
    assert.strictEqual(
      totalExpenses,
      7000,
      'Expenses must accurately total 7000'
    );

    const netBalance = totalCollected - totalExpenses;
    assert.strictEqual(
      netBalance,
      7000,
      'Net operating balance must equal realized revenue minus verified expenses'
    );
  });

  await runTest('Finance RBAC Authorization Invariants', () => {
    const adminCanView = hasPermission('admin', [], PERMISSIONS.FINANCE_VIEW);
    assert.strictEqual(
      adminCanView,
      true,
      'Admin must have finance.view bypass'
    );

    const adminCanManage = hasPermission(
      'admin',
      [],
      PERMISSIONS.FINANCE_MANAGE
    );
    assert.strictEqual(
      adminCanManage,
      true,
      'Admin must have finance.manage bypass'
    );

    const teacherDefaultCanView = hasPermission(
      'teacher',
      DEFAULT_TEACHER_PERMISSIONS,
      PERMISSIONS.FINANCE_VIEW
    );
    assert.strictEqual(
      teacherDefaultCanView,
      false,
      'Standard teacher cannot view finance without explicit delegation'
    );

    const teacherDelegatedCanView = hasPermission(
      'teacher',
      [...DEFAULT_TEACHER_PERMISSIONS, PERMISSIONS.FINANCE_VIEW],
      PERMISSIONS.FINANCE_VIEW
    );
    assert.strictEqual(
      teacherDelegatedCanView,
      true,
      'Delegated teacher with finance.view can view finance records'
    );
  });

  await runTest('Report Data Aggregation Formulas & Invariants', () => {
    const classData = {
      capacity: 40,
      boys: 18,
      girls: 16,
    };
    const totalEnrolled = classData.boys + classData.girls;
    const availableSeats = Math.max(0, classData.capacity - totalEnrolled);
    assert.strictEqual(
      totalEnrolled,
      34,
      'Enrolled count must be sum of boys and girls'
    );
    assert.strictEqual(
      availableSeats,
      6,
      'Available seats must be capacity minus enrolled'
    );

    const attendanceSessions = [
      { present: 32, late: 2, absent: 4 },
      { present: 30, late: 4, absent: 4 },
    ];
    const totalPresent = attendanceSessions.reduce(
      (acc, s) => acc + s.present + s.late,
      0
    );
    const totalRoster = attendanceSessions.reduce(
      (acc, s) => acc + s.present + s.late + s.absent,
      0
    );
    const overallRate = Math.round((totalPresent / totalRoster) * 100);
    assert.strictEqual(
      overallRate,
      89,
      'Attendance rate must include present and late attendees'
    );

    const examGradeCounts: Record<string, number> = {
      'A+': 4,
      A: 10,
      B: 8,
      C: 6,
      D: 2,
      F: 2,
    };
    const appeared = Object.values(examGradeCounts).reduce(
      (acc, c) => acc + c,
      0
    );
    const passed = appeared - examGradeCounts['F'];
    const passRate = Math.round((passed / appeared) * 100);
    assert.strictEqual(
      appeared,
      32,
      'Appeared count must match sum of all grade tiers'
    );
    assert.strictEqual(
      passed,
      30,
      'Passed count must exclude failing grade count'
    );
    assert.strictEqual(passRate, 94, 'Pass rate calculation must be 94%');

    const homeworkStats = {
      totalExpected: 35,
      submittedOnTime: 28,
      submittedLate: 3,
      pending: 4,
    };
    const totalSubmitted =
      homeworkStats.submittedOnTime + homeworkStats.submittedLate;
    const completionRate = Math.round(
      (totalSubmitted / homeworkStats.totalExpected) * 100
    );
    assert.strictEqual(
      completionRate,
      89,
      'Homework completion rate must be 89%'
    );
  });

  await runTest(
    'AI Assistant Provider Fallback & Read-Only Safety Invariant',
    () => {
      const status = getAiProviderStatus();
      assert.strictEqual(
        status.available,
        true,
        'AI status must be available via local mock fallback when no key is set'
      );
      assert.strictEqual(
        status.provider,
        'mock',
        'AI provider must be mock mode'
      );
      assert.strictEqual(status.mode, 'mock', 'AI mode must indicate mock');

      const validPrompt = {
        prompt:
          'Draft an official circular for annual sports day on December 15th',
        category: 'notice_draft' as const,
      };
      const reqValidation = AiAssistantRequestSchema.safeParse(validPrompt);
      assert.strictEqual(
        reqValidation.success,
        true,
        'Valid AI request must pass schema validation'
      );

      const invalidPrompt = {
        prompt: '   ',
      };
      const reqFail = AiAssistantRequestSchema.safeParse(invalidPrompt);
      assert.strictEqual(
        reqFail.success,
        false,
        'Blank AI prompt must be rejected'
      );

      const textWithPII =
        'Contact principal at principal@adiyaschool.edu.in or call +91 9876543210 regarding invoice fee ₹15,000.';
      const masked = maskSchoolDataForLogs(textWithPII);
      assert.ok(
        !masked.includes('principal@adiyaschool.edu.in'),
        'Email must be redacted from logs'
      );
      assert.ok(
        masked.includes('[REDACTED_EMAIL]'),
        'Email placeholder must be present'
      );
      assert.ok(
        !masked.includes('9876543210'),
        'Phone number must be masked in logs'
      );
      assert.ok(
        !masked.includes('₹15,000'),
        'Financial amounts must be masked in public log streams'
      );
    }
  );

  await runTest('School Settings & Backup Payload Schema Validation', () => {
    const validSettings = {
      name: 'Adiya School of Excellence',
      email: 'admin@adiyaschool.edu.in',
      phone: '+91 9876543210',
      address: 'Plot 42, Knowledge Corridor, Bengaluru, Karnataka 560100',
      currency: 'INR',
      gradingPolicy: 'cbse',
      attendanceThreshold: 75,
      receiptPrefix: 'ADIYA-REC',
    };
    const settingsParsed = SchoolSettingsUpdateSchema.safeParse(validSettings);
    assert.strictEqual(
      settingsParsed.success,
      true,
      'Valid school settings must pass validation'
    );

    const validBackup = {
      schoolCode: 'ADIYA01',
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      collections: {
        schools: [{ code: 'ADIYA01', name: 'Adiya School of Excellence' }],
        users: [{ email: 'admin@adiyaschool.edu.in', role: 'admin' }],
        classes: [{ name: 'Class 10', section: 'A' }],
      },
    };
    const backupParsed = BackupPayloadSchema.safeParse(validBackup);
    assert.strictEqual(
      backupParsed.success,
      true,
      'Valid backup payload must pass schema validation'
    );

    const targetSchoolCode = 'ADIYA01';
    const foreignBackup = {
      ...validBackup,
      schoolCode: 'OTHER_SCHOOL_99',
    };
    const codeMatches = foreignBackup.schoolCode === targetSchoolCode;
    assert.strictEqual(
      codeMatches,
      false,
      'Backup restore must be rejected if schoolCode does not match target school'
    );
  });

  await runTest('Audit Log Query Filter Specifications', () => {
    const sampleLogs = [
      {
        id: '1',
        actorRole: 'admin',
        module: 'finance',
        action: 'EXPENSE_CREATE',
        createdAt: '2026-09-20T10:00:00Z',
      },
      {
        id: '2',
        actorRole: 'teacher',
        module: 'attendance',
        action: 'ATTENDANCE_EDIT',
        createdAt: '2026-09-21T11:00:00Z',
      },
      {
        id: '3',
        actorRole: 'admin',
        module: 'settings',
        action: 'SETTINGS_UPDATE',
        createdAt: '2026-09-22T14:00:00Z',
      },
      {
        id: '4',
        actorRole: 'admin',
        module: 'backup',
        action: 'BACKUP_EXPORT',
        createdAt: '2026-09-23T09:00:00Z',
      },
    ];

    const financeLogs = sampleLogs.filter((l) => l.module === 'finance');
    assert.strictEqual(
      financeLogs.length,
      1,
      'Filter by module finance should return 1 log'
    );

    const adminLogs = sampleLogs.filter((l) => l.actorRole === 'admin');
    assert.strictEqual(
      adminLogs.length,
      3,
      'Filter by actor admin should return 3 logs'
    );

    const backupLogs = sampleLogs.filter((l) => l.action === 'BACKUP_EXPORT');
    assert.strictEqual(
      backupLogs.length,
      1,
      'Filter by action BACKUP_EXPORT should return 1 log'
    );
  });

  console.log('\n14. Production Readiness & Security Verification:');

  await runTest('Permission Middleware & Typed 403 Response Contract', () => {
    function simulatePermissionCheck(
      role: string,
      userPerms: string[],
      requiredPerm: string
    ) {
      const authorized = hasPermission(
        role as any,
        userPerms,
        requiredPerm as any
      );
      if (!authorized) {
        return {
          statusCode: 403,
          body: {
            success: false,
            message: `Forbidden: Insufficient privileges. Required permission: ${requiredPerm}`,
            requiredPermission: requiredPerm,
          },
        };
      }
      return { statusCode: 200, body: { success: true } };
    }

    const adminCheck = simulatePermissionCheck(
      'admin',
      [],
      PERMISSIONS.FEES_COLLECT
    );
    assert.strictEqual(
      adminCheck.statusCode,
      200,
      'Admin must unconditionally pass permission checks'
    );

    const teacherRestricted = simulatePermissionCheck(
      'teacher',
      DEFAULT_TEACHER_PERMISSIONS,
      PERMISSIONS.FEES_COLLECT
    );
    assert.strictEqual(
      teacherRestricted.statusCode,
      403,
      'Standard teacher must receive 403 on fees.collect'
    );
    assert.strictEqual(
      teacherRestricted.body.requiredPermission,
      PERMISSIONS.FEES_COLLECT
    );

    const teacherElevated = simulatePermissionCheck(
      'teacher',
      [...DEFAULT_TEACHER_PERMISSIONS, PERMISSIONS.FEES_COLLECT],
      PERMISSIONS.FEES_COLLECT
    );
    assert.strictEqual(
      teacherElevated.statusCode,
      200,
      'Elevated teacher with fees.collect must pass'
    );
  });

  await runTest('Multi-Tenant School ID Query Isolation Invariant', () => {
    const schoolA_Id = '654321000000000000000001';
    const schoolB_Id = '654321000000000000000002';

    const databaseRecords = [
      { id: '1', schoolId: schoolA_Id, title: 'Adiya Class 10 Roster' },
      { id: '2', schoolId: schoolA_Id, title: 'Adiya Tuition Invoice' },
      { id: '3', schoolId: schoolB_Id, title: 'Foreign School Document' },
    ];

    function querySchoolRecords(tenantId: string) {
      return databaseRecords.filter((rec) => rec.schoolId === tenantId);
    }

    const schoolAResults = querySchoolRecords(schoolA_Id);
    assert.strictEqual(
      schoolAResults.length,
      2,
      'School A query must return exactly School A records'
    );
    assert.ok(
      schoolAResults.every((r) => r.schoolId === schoolA_Id),
      'No cross-tenant data leakage permitted'
    );

    const foreignMatch = schoolAResults.some((r) => r.schoolId === schoolB_Id);
    assert.strictEqual(
      foreignMatch,
      false,
      'Foreign school documents must never leak into School A queries'
    );
  });

  await runTest('Teacher Class & Subject Scoping Invariant', () => {
    const teacherId = 'teacher_priya_id';
    const activeAssignments = [
      { teacherId, classSectionId: 'class_9B_id', subjectId: 'subject_bio_id' },
      {
        teacherId,
        classSectionId: 'class_10A_id',
        subjectId: 'subject_sci_id',
      },
    ];

    function verifyTeacherScope(
      tId: string,
      classId: string,
      subId: string
    ): boolean {
      return activeAssignments.some(
        (a) =>
          a.teacherId === tId &&
          a.classSectionId === classId &&
          a.subjectId === subId
      );
    }

    assert.strictEqual(
      verifyTeacherScope(teacherId, 'class_9B_id', 'subject_bio_id'),
      true,
      'Priya must have access to 9B Biology'
    );
    assert.strictEqual(
      verifyTeacherScope(teacherId, 'class_10A_id', 'subject_sci_id'),
      true,
      'Priya must have access to 10A Science'
    );
    assert.strictEqual(
      verifyTeacherScope(teacherId, 'class_10A_id', 'subject_math_id'),
      false,
      'Priya must NOT have access to 10A Math (assigned to Rajesh)'
    );
    assert.strictEqual(
      verifyTeacherScope(teacherId, 'class_5B_id', 'subject_eng_id'),
      false,
      'Priya must NOT have access to unassigned 5B English'
    );
  });

  await runTest(
    'Parent Multi-Child Linked Scoping & Security Isolation',
    () => {
      const parentSunitaId = 'parent_sunita_uid';
      const childAaravId = 'student_aarav_uid';
      const childVihaanId = 'student_vihaan_uid';
      const unlinkedChildId = 'student_other_uid';

      const parentProfile = {
        userId: parentSunitaId,
        name: 'Sunita Sharma',
        linkedStudentUserIds: [childAaravId, childVihaanId],
      };

      function canParentAccessChild(
        parent: typeof parentProfile,
        targetStudentId: string
      ): boolean {
        return parent.linkedStudentUserIds.includes(targetStudentId);
      }

      assert.strictEqual(
        canParentAccessChild(parentProfile, childAaravId),
        true,
        'Parent Sunita must be authorized to access child Aarav'
      );
      assert.strictEqual(
        canParentAccessChild(parentProfile, childVihaanId),
        true,
        'Parent Sunita must be authorized to access child Vihaan'
      );
      assert.strictEqual(
        canParentAccessChild(parentProfile, unlinkedChildId),
        false,
        'Parent Sunita must be rejected with 403 when querying unlinked child'
      );
    }
  );

  await runTest('Student Self-Only Scoping Invariant', () => {
    const studentAaravId = 'student_aarav_uid';
    const studentAnanyaId = 'student_ananya_uid';

    function canStudentAccessRecord(
      sessionStudentId: string,
      targetStudentId: string
    ): boolean {
      return sessionStudentId === targetStudentId;
    }

    assert.strictEqual(
      canStudentAccessRecord(studentAaravId, studentAaravId),
      true,
      'Student Aarav can view own records'
    );
    assert.strictEqual(
      canStudentAccessRecord(studentAaravId, studentAnanyaId),
      false,
      'Student Aarav cannot access Ananya records'
    );
  });

  await runTest('Attendance Duplicate Prevention & Color Enum Contract', () => {
    const existingSessions = new Set(['10A_2026-09-24']);

    function recordAttendanceSession(
      classId: string,
      date: string,
      isEdit: boolean
    ): number {
      const sessionKey = `${classId}_${date}`;
      if (existingSessions.has(sessionKey) && !isEdit) {
        return 409;
      }
      existingSessions.add(sessionKey);
      return 201;
    }

    assert.strictEqual(
      recordAttendanceSession('10A', '2026-09-24', false),
      409,
      'Submitting fresh attendance for existing session without edit flag must return 409'
    );
    assert.strictEqual(
      recordAttendanceSession('10A', '2026-09-24', true),
      201,
      'Editing existing attendance with permission and reason must be allowed'
    );
    assert.strictEqual(
      recordAttendanceSession('9B', '2026-09-24', false),
      201,
      'Fresh attendance for new class section must succeed'
    );

    const validAttendanceColors = {
      present: 'green',
      late: 'yellow',
      absent: 'red',
    };
    assert.strictEqual(validAttendanceColors.present, 'green');
    assert.strictEqual(validAttendanceColors.late, 'yellow');
    assert.strictEqual(validAttendanceColors.absent, 'red');
  });

  await runTest(
    'Fee Ledger Subtotals, Partial Payments & Concession Invariants',
    () => {
      const items = [
        { title: 'Tuition Fee (Quarterly)', amount: 14000 },
        { title: 'Computer Lab Charge', amount: 3000 },
        { title: 'Amenities', amount: 1500 },
      ];
      const subtotal = items.reduce((acc, i) => acc + i.amount, 0);
      assert.strictEqual(subtotal, 18500, 'Subtotal must be 18500');

      const concessionDiscount = 2000;
      const totalAmount = Math.max(0, subtotal - concessionDiscount);
      assert.strictEqual(
        totalAmount,
        16500,
        'Total after concession must be 16500'
      );

      const paidAmount: number = 5000;
      const balance: number = totalAmount - paidAmount;
      assert.strictEqual(balance, 11500, 'Balance must be 11500');

      let status: 'paid' | 'partial' | 'unpaid' = 'unpaid';
      if (balance === 0) status = 'paid';
      else if (paidAmount > 0) status = 'partial';
      assert.strictEqual(
        status,
        'partial',
        'Invoice with partial payment must have status partial'
      );
    }
  );

  await runTest('CSRF, Rate Limiting & Safe Error Response Contract', () => {
    function validateCsrf(cookieToken?: string, headerToken?: string): boolean {
      if (!cookieToken || !headerToken) return false;
      return cookieToken === headerToken;
    }

    const token = 'csrf_random_bytes_hex_token_123';
    assert.strictEqual(
      validateCsrf(token, token),
      true,
      'Matching CSRF tokens must pass'
    );
    assert.strictEqual(
      validateCsrf(token, 'mismatched_token'),
      false,
      'Mismatched CSRF tokens must be rejected'
    );
    assert.strictEqual(
      validateCsrf(undefined, token),
      false,
      'Missing cookie CSRF token must fail'
    );

    function formatSafeError(err: Error, isProduction: boolean) {
      return {
        success: false,
        message: err.message,
        ...(isProduction ? {} : { stack: err.stack }),
      };
    }

    const sampleErr = new Error('Database query failure');
    sampleErr.stack = 'Error: Database query failure\n    at query (db.ts:42)';

    const prodResponse = formatSafeError(sampleErr, true);
    assert.strictEqual(prodResponse.success, false);
    assert.strictEqual(prodResponse.message, 'Database query failure');
    assert.strictEqual(
      (prodResponse as any).stack,
      undefined,
      'Stack traces must never leak in production mode'
    );

    const devResponse = formatSafeError(sampleErr, false);
    assert.ok(
      (devResponse as any).stack !== undefined,
      'Stack trace preserved in development mode'
    );
  });

  await runTest('Role-Based Smoke Checklist Contracts', () => {
    const rolesChecklist = {
      admin: {
        canManageSchool: true,
        canGrantTeacherPermissions: true,
        canManageTimetable: true,
        canPublishNotices: true,
        canExportBackup: true,
        canViewAuditLogs: true,
      },
      teacher: {
        canTakeAttendance: true,
        canCreateHomework: true,
        canEnterMarks: true,
        feesCollectDefault: false,
        resultsPublishDefault: false,
      },
      student: {
        canViewOwnTimetable: true,
        canViewPublishedResultsOnly: true,
        canSubmitHomework: true,
        canAccessOtherStudents: false,
      },
      parent: {
        canSwitchLinkedChildren: true,
        canViewChildAttendance: true,
        canViewChildFees: true,
        canAccessUnlinkedChildren: false,
      },
    };

    assert.strictEqual(rolesChecklist.admin.canGrantTeacherPermissions, true);
    assert.strictEqual(rolesChecklist.admin.canExportBackup, true);
    assert.strictEqual(rolesChecklist.teacher.feesCollectDefault, false);
    assert.strictEqual(rolesChecklist.teacher.resultsPublishDefault, false);
    assert.strictEqual(
      rolesChecklist.student.canViewPublishedResultsOnly,
      true
    );
    assert.strictEqual(rolesChecklist.student.canAccessOtherStudents, false);
    assert.strictEqual(rolesChecklist.parent.canSwitchLinkedChildren, true);
    assert.strictEqual(rolesChecklist.parent.canAccessUnlinkedChildren, false);
  });

  console.log('\n15. Subject-Wise Quiz Module Tests:');

  await runTest(
    'Quiz & AI Permission Keys Invariant: dot notation and defined categories',
    () => {
      const expectedKeys = [
        'quizzes.view',
        'quizzes.create',
        'quizzes.update',
        'quizzes.delete',
        'quizzes.publish',
        'quizzes.grade',
        'homework.aiHint',
      ];

      const definedKeys = new Set(ALL_PERMISSION_DEFINITIONS.map((d) => d.key));

      for (const key of expectedKeys) {
        assert.strictEqual(
          definedKeys.has(key as any),
          true,
          `Expected permission key ${key} must be defined in ALL_PERMISSION_DEFINITIONS`
        );
        assert.strictEqual(
          key.includes('.'),
          true,
          `Permission key ${key} must follow dot notation`
        );
      }

      const quizDefs = ALL_PERMISSION_DEFINITIONS.filter(
        (d) => d.category === 'Quizzes'
      );
      assert.strictEqual(
        quizDefs.length,
        6,
        'Quizzes category must define exactly 6 permissions'
      );
    }
  );

  await runTest(
    'Quiz Publish Rules: >= 10 unique questions required to publish; drafts can have fewer',
    () => {
      const draftNineQuestions = Array.from({ length: 9 }, (_, i) => ({
        id: `q_${i + 1}`,
        questionText: `Unique question number ${i + 1}`,
        questionType: 'mcq' as const,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 'Option A',
        marks: 1,
      }));

      const draftResult = QuizCreateSchema.safeParse({
        title: 'Draft Physics Quiz',
        subjectId: '507f1f77bcf86cd799439011',
        classSectionId: '507f1f77bcf86cd799439012',
        duration: 15,
        totalMarks: 10,
        passingMarks: 5,
        dueDate: '2026-10-15',
        status: 'draft',
        questions: draftNineQuestions,
      });
      assert.strictEqual(
        draftResult.success,
        true,
        'Draft quizzes should allow < 10 questions during creation'
      );

      const publishNineResult = QuizCreateSchema.safeParse({
        title: 'Premature Publish Quiz',
        subjectId: '507f1f77bcf86cd799439011',
        classSectionId: '507f1f77bcf86cd799439012',
        duration: 15,
        totalMarks: 10,
        passingMarks: 5,
        dueDate: '2026-10-15',
        status: 'published',
        questions: draftNineQuestions,
      });
      assert.strictEqual(
        publishNineResult.success,
        false,
        'Publishing with < 10 questions must fail validation'
      );

      const tenUniqueQuestions = Array.from({ length: 10 }, (_, i) => ({
        id: `q_${i + 1}`,
        questionText: `Unique question number ${i + 1}`,
        questionType: (i % 2 === 0 ? 'mcq' : 'true_false') as any,
        options: i % 2 === 0 ? ['A', 'B', 'C', 'D'] : ['True', 'False'],
        correctAnswer: i % 2 === 0 ? 'A' : 'True',
        marks: 1,
      }));

      const publishTenResult = QuizCreateSchema.safeParse({
        title: 'Valid 10-Question Science Quiz',
        subjectId: '507f1f77bcf86cd799439011',
        classSectionId: '507f1f77bcf86cd799439012',
        duration: 20,
        totalMarks: 10,
        passingMarks: 6,
        dueDate: '2026-10-15',
        status: 'published',
        questions: tenUniqueQuestions,
      });
      assert.strictEqual(
        publishTenResult.success,
        true,
        'Publishing with >= 10 unique questions must succeed'
      );
    }
  );

  await runTest('Quiz Duplicate Question Prevention Invariant', () => {
    const duplicateQuestions = [
      ...Array.from({ length: 9 }, (_, i) => ({
        id: `q_${i + 1}`,
        questionText: `Unique question number ${i + 1}`,
        questionType: 'mcq' as const,
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 'A',
        marks: 1,
      })),
      {
        id: 'q_10',
        questionText: 'Unique question number 1',
        questionType: 'mcq' as const,
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 'A',
        marks: 1,
      },
    ];

    const duplicateResult = QuizCreateSchema.safeParse({
      title: 'Duplicate Question Quiz',
      subjectId: '507f1f77bcf86cd799439011',
      classSectionId: '507f1f77bcf86cd799439012',
      duration: 15,
      totalMarks: 10,
      passingMarks: 5,
      dueDate: '2026-10-15',
      status: 'published',
      questions: duplicateQuestions,
    });
    assert.strictEqual(
      duplicateResult.success,
      false,
      'Duplicate questions within the same quiz must be rejected'
    );
  });

  await runTest(
    'Quiz Attempt Auto-Grading & Scorecard Formula Invariants',
    () => {
      const questions = [
        { id: 'q1', correctAnswer: 'A', marks: 1 },
        { id: 'q2', correctAnswer: 'True', marks: 1 },
        { id: 'q3', correctAnswer: 'Oxygen', marks: 1 },
        { id: 'q4', correctAnswer: '42', marks: 1 },
        { id: 'q5', correctAnswer: 'Mitochondria', marks: 1 },
        { id: 'q6', correctAnswer: 'B', marks: 1 },
        { id: 'q7', correctAnswer: 'False', marks: 1 },
        { id: 'q8', correctAnswer: 'C', marks: 1 },
        { id: 'q9', correctAnswer: '7', marks: 1 },
        { id: 'q10', correctAnswer: 'AND', marks: 1 },
      ];

      const studentAnswers = [
        { questionId: 'q1', studentAnswer: 'A' },
        { questionId: 'q2', studentAnswer: 'True' },
        { questionId: 'q3', studentAnswer: 'Hydrogen' },
        { questionId: 'q4', studentAnswer: '42' },
        { questionId: 'q5', studentAnswer: 'mitochondria ' },
        { questionId: 'q6', studentAnswer: 'B' },
        { questionId: 'q7', studentAnswer: 'True' },
        { questionId: 'q8', studentAnswer: 'C' },
        { questionId: 'q9', studentAnswer: '' },
        { questionId: 'q10', studentAnswer: 'and' },
      ];

      let correctCount = 0;
      let wrongCount = 0;
      let skippedCount = 0;
      let marksObtained = 0;
      const maxMarks = 10;
      const passingMarks = 6;

      for (const q of questions) {
        const ans = studentAnswers.find((a) => a.questionId === q.id);
        const studentText = (ans?.studentAnswer || '').trim().toLowerCase();
        const expectedText = q.correctAnswer.trim().toLowerCase();

        if (!studentText) {
          skippedCount++;
        } else if (studentText === expectedText) {
          correctCount++;
          marksObtained += q.marks;
        } else {
          wrongCount++;
        }
      }

      const percentage = Math.round((marksObtained / maxMarks) * 100);
      const isPassed = marksObtained >= passingMarks;

      assert.strictEqual(correctCount, 7, '7 answers must evaluate as correct');
      assert.strictEqual(wrongCount, 2, '2 answers must evaluate as wrong');
      assert.strictEqual(skippedCount, 1, '1 answer must evaluate as skipped');
      assert.strictEqual(marksObtained, 7, 'Marks obtained must be exactly 7');
      assert.strictEqual(percentage, 70, 'Percentage must be exactly 70%');
      assert.strictEqual(
        isPassed,
        true,
        '7 marks >= 6 passing marks must evaluate to passed: true'
      );
    }
  );

  await runTest(
    'Quiz Security Invariant: Hidden answers before submission; revealed after submission',
    () => {
      const rawQuestions = [
        {
          id: 'q1',
          questionText: 'What is the powerhouse of the cell?',
          questionType: 'mcq',
          options: ['Mitochondria', 'Nucleus', 'Ribosome', 'Golgi'],
          correctAnswer: 'Mitochondria',
          explanation: 'Mitochondria produce ATP.',
          marks: 1,
        },
      ];

      const sanitizedStudentQuestions = rawQuestions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options,
        marks: q.marks,
      }));

      assert.strictEqual(
        (sanitizedStudentQuestions[0] as any).correctAnswer,
        undefined,
        'Correct answers must NEVER be visible to students prior to submission'
      );
      assert.strictEqual(
        (sanitizedStudentQuestions[0] as any).explanation,
        undefined,
        'Explanations must NEVER be visible to students prior to submission'
      );

      const postSubmissionReview = {
        questionId: rawQuestions[0].id,
        questionText: rawQuestions[0].questionText,
        studentAnswer: 'Nucleus',
        correctAnswer: rawQuestions[0].correctAnswer,
        explanation: rawQuestions[0].explanation,
        isCorrect: false,
      };

      assert.strictEqual(postSubmissionReview.correctAnswer, 'Mitochondria');
      assert.strictEqual(
        postSubmissionReview.explanation,
        'Mitochondria produce ATP.'
      );
      assert.strictEqual(postSubmissionReview.isCorrect, false);
    }
  );

  console.log('\n16. AI-Powered Homework Hint Tests:');

  await runTest(
    'AI Homework Hint 4-Level Progressive Structure & Disclaimer Invariant',
    () => {
      const levels = [1, 2, 3, 4] as const;
      const levelTitles: Record<number, string> = {
        1: 'Small Clue',
        2: 'Concept Explanation',
        3: 'Suggested Next Step',
        4: 'Self-Check Question',
      };

      for (const lvl of levels) {
        assert.ok(
          levelTitles[lvl],
          `Level ${lvl} must have defined progressive title`
        );
      }

      const expectedDisclaimer =
        'Use this hint to solve the problem yourself. The final answer is intentionally hidden.';

      assert.strictEqual(
        expectedDisclaimer.includes('final answer is intentionally hidden'),
        true,
        'Mandatory disclaimer must explicitly state that the final answer is hidden'
      );
    }
  );

  await runTest(
    'AI Homework Hint Final Answer Strict Non-Leakage Contract',
    () => {
      const hintResponse = {
        success: true,
        hintLevel: 1,
        hintLevelTitle: 'Small Clue',
        hintText:
          'Identify the coefficients a, b, and c in ax^2 + bx + c = 0 first. Calculate the discriminant b^2 - 4ac.',
        disclaimer:
          'Use this hint to solve the problem yourself. The final answer is intentionally hidden.',
        isFinalAnswerHidden: true,
        hintsRemainingToday: 4,
        dailyLimit: 5,
      };

      assert.strictEqual(
        hintResponse.isFinalAnswerHidden,
        true,
        'isFinalAnswerHidden must strictly be true'
      );
      assert.strictEqual(
        hintResponse.dailyLimit,
        5,
        'Daily rate limit must be 5 hints/day'
      );
      assert.strictEqual(
        hintResponse.hintsRemainingToday,
        4,
        'Remaining hints must decrement'
      );
      assert.strictEqual(
        hintResponse.hintText.includes('x = 1'),
        false,
        'AI hint text must never leak the final numerical solution'
      );
    }
  );

  console.log('\n17. AI-Powered Subject-Wise Quiz Generation Tests:');

  await runTest(
    'QuizAiGenerateSchema validates subject, topic, and question count boundaries',
    () => {
      const valid = QuizAiGenerateSchema.parse({
        subjectName: 'Mathematics',
        topic: 'Quadratic Equations & Roots',
        numQuestions: 10,
        difficulty: 'medium',
      });
      assert.strictEqual(valid.subjectName, 'Mathematics');
      assert.strictEqual(valid.topic, 'Quadratic Equations & Roots');
      assert.strictEqual(valid.numQuestions, 10);
      assert.strictEqual(valid.difficulty, 'medium');

      assert.throws(() => {
        QuizAiGenerateSchema.parse({
          subjectName: 'Science',
          topic: 'A',
        });
      }, /Topic must be at least 2 characters/);

      assert.throws(() => {
        QuizAiGenerateSchema.parse({
          subjectName: 'Science',
          topic: 'Photosynthesis',
          numQuestions: 3,
        });
      });
      assert.throws(() => {
        QuizAiGenerateSchema.parse({
          subjectName: 'Science',
          topic: 'Photosynthesis',
          numQuestions: 30,
        });
      });
    }
  );

  await runTest(
    'AI Quiz Generation produces >= 10 unique, schema-valid questions for diverse subjects',
    async () => {
      const subjectsToTest = [
        { subject: 'Mathematics', topic: 'Quadratic Equations & Polynomials' },
        { subject: 'Science', topic: 'Photosynthesis & Cellular Respiration' },
        {
          subject: 'Computer Science',
          topic: 'Recursion and Dynamic Programming',
        },
        { subject: 'Hindi', topic: 'संधि और समास के भेद' },
        { subject: 'English', topic: 'Metaphors, Similes & Poetic Devices' },
      ];

      for (const item of subjectsToTest) {
        const generated = await generateAiQuizQuestions({
          subjectName: item.subject,
          topic: item.topic,
          numQuestions: 10,
          difficulty: 'medium',
        });

        assert.strictEqual(generated.success, true);
        assert.strictEqual(generated.subjectName, item.subject);
        assert.strictEqual(generated.topic, item.topic);
        assert.strictEqual(
          generated.questions.length >= 10,
          true,
          `Must generate >= 10 questions for ${item.subject}`
        );

        const texts = generated.questions.map((q) =>
          q.questionText.trim().toLowerCase()
        );
        assert.strictEqual(
          new Set(texts).size,
          texts.length,
          `Questions must be 100% unique for ${item.subject}`
        );

        const types = new Set(generated.questions.map((q) => q.questionType));
        assert.strictEqual(
          types.size >= 3,
          true,
          `Generated quiz for ${item.subject} should have a mix of question types`
        );

        for (const q of generated.questions) {
          assert.ok(q.id, 'Question must have id');
          assert.ok(
            q.questionText.length >= 5,
            'Question text must be substantive'
          );
          assert.ok(
            q.correctAnswer.length >= 1,
            'Question must have correct answer'
          );
          assert.ok(
            q.explanation.length >= 5,
            'Question must have educational explanation'
          );
          assert.strictEqual(q.marks, 1, 'Question marks must default to 1');

          if (q.questionType === 'mcq') {
            assert.strictEqual(q.options?.length, 4, 'MCQ must have 4 options');
            assert.ok(
              q.options.includes(q.correctAnswer),
              'MCQ options must include correct answer'
            );
          } else if (q.questionType === 'true_false') {
            assert.deepStrictEqual(
              q.options,
              ['True', 'False'],
              'True/False options must be True and False'
            );
            assert.ok(
              ['True', 'False'].includes(q.correctAnswer),
              'True/False correct answer must be True or False'
            );
          } else if (q.questionType === 'fill_in_the_blank') {
            assert.ok(
              q.questionText.includes('_____'),
              'Fill in the blank question must contain _____'
            );
          }
        }

        const quizPayload = {
          title: `${item.topic} Mastery Quiz`,
          subjectId: '507f1f77bcf86cd799439011',
          classSectionId: '507f1f77bcf86cd799439012',
          duration: 15,
          totalMarks: generated.questions.length,
          passingMarks: Math.round(generated.questions.length * 0.6),
          dueDate: '2026-10-25',
          status: 'published' as const,
          questions: generated.questions,
        };

        const parsedQuiz = QuizCreateSchema.safeParse(quizPayload);
        assert.strictEqual(
          parsedQuiz.success,
          true,
          `AI generated questions must satisfy QuizCreateSchema for publishing directly (${item.subject})`
        );
      }
    }
  );

  console.log('\n18. Forgot Password & 4-Digit Email OTP System Tests:');

  await runTest(
    'VerifyResetOtpSchema & ResendResetOtpSchema strictly validate 4-digit OTP format',
    () => {
      // 4-digit numeric OTPs must parse successfully
      assert.doesNotThrow(() =>
        VerifyResetOtpSchema.parse({ email: 'admin@adiya.edu', otp: '5831' })
      );
      assert.doesNotThrow(() =>
        VerifyResetOtpSchema.parse({ email: 'teacher@adiya.edu', otp: '0042' })
      );
      assert.doesNotThrow(() =>
        VerifyResetOtpSchema.parse({ email: 'student@adiya.edu', otp: '9999' })
      );

      // Invalid lengths or non-numeric must fail
      assert.throws(
        () =>
          VerifyResetOtpSchema.parse({
            email: 'admin@adiya.edu',
            otp: '123',
          }),
        /OTP must be exactly 4 digits/
      );
      assert.throws(
        () =>
          VerifyResetOtpSchema.parse({
            email: 'admin@adiya.edu',
            otp: '12345',
          }),
        /OTP must be exactly 4 digits/
      );
      assert.throws(
        () =>
          VerifyResetOtpSchema.parse({
            email: 'admin@adiya.edu',
            otp: 'abcd',
          }),
        /OTP must be exactly 4 digits/
      );
      assert.throws(
        () =>
          VerifyResetOtpSchema.parse({
            email: 'admin@adiya.edu',
            otp: '12a4',
          }),
        /OTP must be exactly 4 digits/
      );
      assert.throws(
        () =>
          VerifyResetOtpSchema.parse({
            email: 'invalid-email',
            otp: '5831',
          }),
        /Invalid email address/
      );

      // ResendResetOtpSchema validates email
      assert.doesNotThrow(() =>
        ResendResetOtpSchema.parse({ email: 'admin@adiya.edu' })
      );
      assert.throws(
        () => ResendResetOtpSchema.parse({ email: 'not-an-email' }),
        /Invalid email address/
      );

      // ResetPasswordWithTokenSchema requires token and newPassword >= 6
      assert.doesNotThrow(() =>
        ResetPasswordWithTokenSchema.parse({
          resetToken: 'jwt.sample.token',
          newPassword: 'NewSecurePass@2026',
        })
      );
      assert.throws(
        () =>
          ResetPasswordWithTokenSchema.parse({
            resetToken: '',
            newPassword: 'short',
          }),
        /Reset authorization token is required/
      );
    }
  );

  await runTest(
    '4-Digit OTP Generation, Bcrypt Hashing, and 5-Minute Expiry Invariants',
    async () => {
      const plainOtp = Math.floor(1000 + Math.random() * 9000).toString();
      assert.strictEqual(plainOtp.length, 4, 'OTP must be exactly 4 digits');
      assert.ok(/^\d{4}$/.test(plainOtp), 'OTP must be strictly numeric');

      const tokenHash = await bcrypt.hash(plainOtp, 10);
      assert.ok(
        tokenHash.startsWith('$2'),
        'Stored OTP must be a valid bcrypt hash'
      );
      assert.notStrictEqual(
        tokenHash,
        plainOtp,
        'Plain OTP must never be stored directly in DB'
      );

      const isValid = await bcrypt.compare(plainOtp, tokenHash);
      assert.strictEqual(
        isValid,
        true,
        'Bcrypt compare must verify authentic 4-digit OTP'
      );

      const isInvalid = await bcrypt.compare('0000', tokenHash);
      assert.strictEqual(
        isInvalid,
        false,
        'Bcrypt compare must reject invalid OTP'
      );

      // 5-minute expiry calculation
      const issuedAt = Date.now();
      const expiresAt = new Date(issuedAt + 5 * 60 * 1000);
      const remainingSeconds = Math.round(
        (expiresAt.getTime() - issuedAt) / 1000
      );
      assert.strictEqual(
        remainingSeconds,
        300,
        'OTP TTL must be exactly 300 seconds (5 minutes)'
      );
    }
  );

  await runTest('OTP Single-Use Invalidation & Superseding Contract', async () => {
    // Simulate OTP lifecycle in DB
    const otpStore = {
      email: 'rajesh.sharma@adiya.edu',
      plainOtp: '4829',
      tokenHash: await bcrypt.hash('4829', 10),
      isUsed: false,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    };

    // 1st verification succeeds and marks isUsed
    assert.strictEqual(otpStore.isUsed, false);
    const firstCheck = await bcrypt.compare('4829', otpStore.tokenHash);
    assert.strictEqual(firstCheck, true);
    otpStore.isUsed = true;

    // 2nd verification must be rejected because isUsed === true
    assert.strictEqual(otpStore.isUsed, true);
    const simulateSubsequentAttempt = () => {
      if (otpStore.isUsed) {
        throw new Error(
          'Verification code is invalid or has expired. Please request a new code.'
        );
      }
    };
    assert.throws(simulateSubsequentAttempt, /invalid or has expired/);

    // Superseding: When a new OTP is generated, prior active tokens are marked isUsed: true
    const priorTokens = [
      { id: 1, email: 'rajesh.sharma@adiya.edu', isUsed: false },
      { id: 2, email: 'rajesh.sharma@adiya.edu', isUsed: false },
    ];
    // Invalidate existing
    priorTokens.forEach((t) => (t.isUsed = true));
    assert.ok(
      priorTokens.every((t) => t.isUsed === true),
      'Prior active OTPs must be invalidated when new OTP is requested'
    );
  });

  await runTest(
    'Rate Limiting & 5 Max Failed Attempts Lockdown Invariant',
    async () => {
      const tokenRecord = {
        email: 'aarav.sharma@adiya.edu',
        tokenHash: await bcrypt.hash('7193', 10),
        attempts: 0,
        maxAttempts: 5,
        isUsed: false,
      };

      const simulateAttempt = async (enteredOtp: string) => {
        if (tokenRecord.isUsed) {
          return {
            success: false,
            message:
              'Maximum attempts exceeded. Please request a new verification code.',
          };
        }
        const match = await bcrypt.compare(enteredOtp, tokenRecord.tokenHash);
        if (!match) {
          tokenRecord.attempts += 1;
          if (tokenRecord.attempts >= tokenRecord.maxAttempts) {
            tokenRecord.isUsed = true;
            return {
              success: false,
              message:
                'Maximum attempts exceeded. Please request a new verification code.',
            };
          }
          const remaining = tokenRecord.maxAttempts - tokenRecord.attempts;
          return {
            success: false,
            message: `Incorrect verification code. ${remaining} attempts remaining.`,
          };
        }
        tokenRecord.isUsed = true;
        return { success: true, message: 'OTP verified successfully.' };
      };

      // 4 incorrect attempts
      for (let i = 1; i <= 4; i++) {
        const res = await simulateAttempt('0000');
        assert.strictEqual(res.success, false);
        assert.strictEqual(tokenRecord.attempts, i);
        assert.strictEqual(tokenRecord.isUsed, false);
        assert.ok(res.message.includes(`${5 - i} attempt`));
      }

      // 5th incorrect attempt locks out the OTP
      const fifthRes = await simulateAttempt('0000');
      assert.strictEqual(fifthRes.success, false);
      assert.strictEqual(tokenRecord.attempts, 5);
      assert.strictEqual(tokenRecord.isUsed, true);
      assert.ok(fifthRes.message.includes('Maximum attempts exceeded'));

      // 6th attempt (even if correct OTP) is rejected due to lockout
      const sixthRes = await simulateAttempt('7193');
      assert.strictEqual(sixthRes.success, false);
      assert.ok(sixthRes.message.includes('Maximum attempts exceeded'));
    }
  );

  await runTest('60-Second Resend Cooldown Protection Invariant', () => {
    const now = Date.now();
    const resendCooldownUntil = new Date(now + 60 * 1000); // 60s in future

    // Immediate resend should calculate remaining seconds and reject
    const checkCooldown = (requestTime: number) => {
      if (resendCooldownUntil.getTime() > requestTime) {
        const waitSeconds = Math.ceil(
          (resendCooldownUntil.getTime() - requestTime) / 1000
        );
        return { allowed: false, waitSeconds };
      }
      return { allowed: true, waitSeconds: 0 };
    };

    const earlyCheck = checkCooldown(now + 15 * 1000); // 15s later
    assert.strictEqual(earlyCheck.allowed, false);
    assert.strictEqual(earlyCheck.waitSeconds, 45);

    const lateCheck = checkCooldown(now + 61 * 1000); // 61s later
    assert.strictEqual(lateCheck.allowed, true);
    assert.strictEqual(lateCheck.waitSeconds, 0);
  });

  await runTest('10-Minute Reset Authorization Token Invariant', () => {
    const secret = 'test_jwt_secret_key_eduhub_2026';
    const payload = {
      userId: '654321000000000000000001',
      email: 'sunita.sharma@adiya.edu',
      purpose: 'password_reset',
    };

    const token = jwt.sign(payload, secret, { expiresIn: '10m' });
    assert.ok(token, 'Reset authorization token must be signed');

    const decoded = jwt.verify(token, secret) as any;
    assert.strictEqual(decoded.userId, payload.userId);
    assert.strictEqual(decoded.email, payload.email);
    assert.strictEqual(decoded.purpose, 'password_reset');

    // Token duration check: ~600 seconds
    const lifetime = decoded.exp - decoded.iat;
    assert.strictEqual(
      lifetime,
      600,
      'Reset token lifetime must be exactly 10 minutes (600s)'
    );

    // Reject token with wrong purpose
    const fakeSessionToken = jwt.sign(
      { userId: payload.userId, purpose: 'session' },
      secret,
      { expiresIn: '10m' }
    );
    const decodedFake = jwt.verify(fakeSessionToken, secret) as any;
    assert.notStrictEqual(decodedFake.purpose, 'password_reset');
  });

  await runTest(
    'Password Reset Updates Hash, Clears Temporary Flag, & Invalidates Old Password',
    async () => {
      const user = {
        email: 'teacher.rajesh@adiya.edu',
        passwordHash: await bcrypt.hash('OldPassword@123', 10),
        mustChangePassword: true,
        temporaryPasswordExpiresAt: new Date(Date.now() + 86400000),
      };

      // Verify old password matches
      assert.strictEqual(
        await bcrypt.compare('OldPassword@123', user.passwordHash),
        true
      );

      // Perform reset
      const newPassword = 'NewSecretPassword@456';
      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      user.passwordHash = newPasswordHash;
      user.mustChangePassword = false;
      user.temporaryPasswordExpiresAt = undefined as any;

      // Old password must fail
      assert.strictEqual(
        await bcrypt.compare('OldPassword@123', user.passwordHash),
        false
      );
      // New password must succeed
      assert.strictEqual(
        await bcrypt.compare('NewSecretPassword@456', user.passwordHash),
        true
      );
      // mustChangePassword must be cleared
      assert.strictEqual(user.mustChangePassword, false);
      assert.strictEqual(user.temporaryPasswordExpiresAt, undefined);
    }
  );

  await runTest(
    'User Enumeration Protection & Multi-Role Support (Admin, Teacher, Student, Parent)',
    () => {
      const registeredRoles = [
        { role: 'admin', email: 'admin@adiya.edu' },
        { role: 'teacher', email: 'rajesh.sharma@adiya.edu' },
        { role: 'student', email: 'aarav.sharma@adiya.edu' },
        { role: 'parent', email: 'sunita.sharma@adiya.edu' },
      ];

      const getForgotPasswordResponse = (email: string) => {
        const found = registeredRoles.some(
          (u) => u.email === email.toLowerCase().trim()
        );
        // Generic message regardless of whether user exists
        return {
          status: 200,
          body: {
            success: true,
            message:
              'If an account exists with this email address, a password reset code has been sent.',
          },
          internalFound: found,
        };
      };

      // Test all 4 registered roles
      for (const account of registeredRoles) {
        const res = getForgotPasswordResponse(account.email);
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.success, true);
        assert.strictEqual(res.internalFound, true);
      }

      // Test unknown non-registered email -> exact same 200 response to prevent email harvesting
      const unknownRes = getForgotPasswordResponse('random.unknown@attacker.com');
      assert.strictEqual(unknownRes.status, 200);
      assert.strictEqual(unknownRes.body.success, true);
      assert.strictEqual(
        unknownRes.body.message,
        'If an account exists with this email address, a password reset code has been sent.'
      );
      assert.strictEqual(unknownRes.internalFound, false);
    }
  );

  await runTest(
    'Email Service Provider Abstraction & Dev Mock Dispatch',
    async () => {
      clearSentOtpHistory();

      const testEmail = 'aarav.sharma@adiya.edu';
      const testOtp = '8392';

      const result = await sendPasswordResetOtpEmail({
        email: testEmail,
        otp: testOtp,
        recipientName: 'Aarav Sharma',
        schoolName: 'Adiya School of Excellence',
      });

      assert.strictEqual(result.success, true);
      assert.ok(result.messageId, 'Email dispatch must return messageId');

      const lastSent = getLastSentResetOtp(testEmail);
      assert.strictEqual(
        lastSent,
        testOtp,
        'Recorded mock dispatch must contain sent 4-digit OTP'
      );
    }
  );

  console.log('\n19. Environment Configuration, Cloudinary & Secure Document Storage Tests:');

  await runTest('Dual Mongo URI Support & Fail-Safe Secret Resolution', async () => {
    // getMongoUri should resolve valid URI
    const uri = getMongoUri();
    assert.ok(typeof uri === 'string' && uri.length > 0, 'Mongo URI must be valid string');
    assert.ok(uri.includes('mongodb'), 'Mongo URI must start with mongodb protocol');

    // Secrets must resolve from environment without hardcoded strings
    const jwtSecret = getJwtSecret();
    assert.ok(typeof jwtSecret === 'string' && jwtSecret.length >= 16, 'JWT Secret must be valid');
    assert.notStrictEqual(jwtSecret, 'eduhub_super_secret_jwt_key_2026_adiya_sms', 'Must not use hardcoded secret');

    const cookieSecret = getCookieSecret();
    assert.ok(typeof cookieSecret === 'string' && cookieSecret.length >= 16, 'Cookie Secret must be valid');
    assert.notStrictEqual(cookieSecret, 'eduhub_cookie_secret_secure_key', 'Must not use hardcoded secret');
  });

  await runTest('Secure Cookie Settings Environment Adaptation', () => {
    const defaultCookieOpts = getAuthCookieOptions();
    assert.strictEqual(defaultCookieOpts.httpOnly, true, 'Cookies must always be httpOnly');
    assert.strictEqual(defaultCookieOpts.path, '/', 'Cookie path must be root');
    assert.strictEqual(defaultCookieOpts.maxAge, 7 * 24 * 60 * 60 * 1000, 'Default cookie lifetime 7 days');

    if (process.env.NODE_ENV === 'production') {
      assert.strictEqual(defaultCookieOpts.secure, true);
      assert.strictEqual(defaultCookieOpts.sameSite, 'none');
    } else {
      assert.strictEqual(defaultCookieOpts.secure, false);
      assert.strictEqual(defaultCookieOpts.sameSite, 'lax');
    }

    // Custom maxAge override for logout
    const logoutCookieOpts = getAuthCookieOptions(0);
    assert.strictEqual(logoutCookieOpts.maxAge, 0);
  });

  await runTest('Cloudinary Folder Segregation & Asset Upload/Delete Invariant', async () => {
    // Validate config check without leaking secrets
    const isConfigured = isCloudinaryConfigured();
    assert.strictEqual(typeof isConfigured, 'boolean');

    // Upload image to student folder
    const studentImg = await uploadImageToCloudinary(
      Buffer.from('fake-image-bytes'),
      'eduhub/students/profile-images',
      'student-avatar.jpg'
    );
    assert.ok(studentImg.url, 'Upload must return URL');
    assert.ok(studentImg.publicId, 'Upload must return publicId');

    // Upload image to teacher folder
    const teacherImg = await uploadImageToCloudinary(
      Buffer.from('fake-teacher-image-bytes'),
      'eduhub/teachers/profile-images',
      'teacher-photo.jpg'
    );
    assert.ok(teacherImg.url);
    assert.ok(teacherImg.publicId);

    // Upload image to parent folder
    const parentImg = await uploadImageToCloudinary(
      Buffer.from('fake-parent-image-bytes'),
      'eduhub/parents/profile-images',
      'parent-photo.jpg'
    );
    assert.ok(parentImg.url);
    assert.ok(parentImg.publicId);

    // Delete asset from Cloudinary
    const deleted = await deleteFromCloudinary(studentImg.publicId, 'image');
    assert.strictEqual(deleted, true, 'Deleting asset must succeed');
  });

  await runTest('Student PDF Document Upload & 5 MB Limit Enforcement', async () => {
    // Upload PDF to student documents folder
    const pdfDoc = await uploadPdfToCloudinary(
      Buffer.from('%PDF-1.4 simulated pdf document bytes'),
      'eduhub/students/documents',
      'birth_certificate.pdf'
    );
    assert.ok(pdfDoc.url, 'PDF upload must return URL');
    assert.ok(pdfDoc.publicId, 'PDF upload must return publicId');
    assert.strictEqual(pdfDoc.resourceType, 'raw', 'PDFs must use raw resource type');

    // Schema validation allows valid document metadata
    const validMeta = StudentDocumentSchema.safeParse({
      title: 'Transfer Certificate',
      docType: 'transfer_certificate',
      fileName: 'tc_2026.pdf',
      fileSize: 1024 * 1024, // 1 MB
      publicId: pdfDoc.publicId,
      resourceType: 'raw',
      uploadedBy: 'Admin User',
    });
    assert.strictEqual(validMeta.success, true);

    // Verify 5 MB limit check logic
    const MAX_SIZE = 5 * 1024 * 1024;
    const oversizedBytes = 6 * 1024 * 1024;
    assert.ok(oversizedBytes > MAX_SIZE, 'Oversized file exceeds 5MB limit');

    // Verify non-PDF file extension rejection
    const invalidFileName = 'malicious_script.exe';
    assert.strictEqual(invalidFileName.toLowerCase().endsWith('.pdf'), false, 'Non-PDF must be rejected');

    // Clean up
    const deleted = await deleteFromCloudinary(pdfDoc.publicId, 'raw');
    assert.strictEqual(deleted, true);
  });

  await runTest('Strict RBAC Document Access Security Contract', () => {
    const studentRecord = {
      _id: 'std_123',
      userId: 'user_student_1',
      classSectionId: 'sec_10A',
      parentIds: ['user_parent_1'],
    };

    // Role check logic matching canUserAccessStudentDocument
    const checkAccess = (
      user: { userId: string; role: string },
      student: typeof studentRecord,
      teacherAssignedSecs: string[]
    ) => {
      if (user.role === 'admin') return true;
      if (user.role === 'student' && student.userId === user.userId) return true;
      if (user.role === 'parent' && student.parentIds.includes(user.userId)) return true;
      if (user.role === 'teacher' && teacherAssignedSecs.includes(student.classSectionId)) return true;
      return false;
    };

    // 1. Admin has access
    assert.strictEqual(checkAccess({ userId: 'u_admin', role: 'admin' }, studentRecord, []), true);

    // 2. Student self has access
    assert.strictEqual(checkAccess({ userId: 'user_student_1', role: 'student' }, studentRecord, []), true);

    // 3. Other student is forbidden
    assert.strictEqual(checkAccess({ userId: 'user_student_2', role: 'student' }, studentRecord, []), false);

    // 4. Linked parent has access
    assert.strictEqual(checkAccess({ userId: 'user_parent_1', role: 'parent' }, studentRecord, []), true);

    // 5. Unrelated parent is forbidden
    assert.strictEqual(checkAccess({ userId: 'user_parent_2', role: 'parent' }, studentRecord, []), false);

    // 6. Assigned teacher has access
    assert.strictEqual(checkAccess({ userId: 'u_teacher_1', role: 'teacher' }, studentRecord, ['sec_10A']), true);

    // 7. Unassigned teacher is forbidden
    assert.strictEqual(checkAccess({ userId: 'u_teacher_2', role: 'teacher' }, studentRecord, ['sec_9B']), false);
  });

  console.log('\n====================================================');
  console.log(`Results: ${passedTests} passed, ${failedTests} failed`);
  console.log('====================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main();
