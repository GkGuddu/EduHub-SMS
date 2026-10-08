import {
  LoginInput,
  RegisterSchoolInput,
  VerifyOtpInput,
  ResendOtpInput,
  ForgotPasswordInput,
  VerifyResetOtpInput,
  ResendResetOtpInput,
  ResetPasswordInput,
  ResetPasswordWithTokenInput,
  StudentCreateInput,
  StudentUpdateInput,
  StudentDocumentInput,
  TeacherCreateInput,
  TeacherUpdateInput,
  ParentCreateInput,
  ParentLinkChildInput,
  AttendanceMarkInput,
  GradeRecordSubmitInput,
  ExamCreateInput,
  ExamUpdateInput,
  GradeRecordCorrectionInput,
  FeePaymentInput,
  NoticeCreateInput,
  PermissionsUpdateInput,
  AcademicYearCreateInput,
  AcademicYearUpdateInput,
  ClassSectionCreateInput,
  ClassSectionUpdateInput,
  SubjectCreateInput,
  SubjectUpdateInput,
  SchoolCalendarEventCreateInput,
  WorkingDaysUpdateInput,
  SchoolProfileUpdateInput,
  ExpenseCreateInput,
  SchoolSettingsUpdateInput,
  BackupPayload,
} from '@eduhub/shared';

import { z } from 'zod';

const clientEnvSchema = z.object({
  VITE_API_URL: z.string().default('/api'),
  VITE_DEMO_MODE: z
    .string()
    .optional()
    .transform((val) => val === undefined || val === 'true' || val === '1'),
});

const parsedEnv = clientEnvSchema.safeParse({
  VITE_API_URL: (import.meta as any).env?.VITE_API_URL,
  VITE_DEMO_MODE: (import.meta as any).env?.VITE_DEMO_MODE,
});

export const env = parsedEnv.success
  ? parsedEnv.data
  : {
      VITE_API_URL: '/api',
      VITE_DEMO_MODE: true,
    };

const rawBaseUrl = env.VITE_API_URL || '/api';
const BASE_URL = rawBaseUrl.endsWith('/')
  ? rawBaseUrl.slice(0, -1)
  : rawBaseUrl;

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    new RegExp('(^|;\\s*)' + name + '=([^;]*)')
  );
  return match ? decodeURIComponent(match[2]) : null;
}

export class ApiError extends Error {
  statusCode: number;
  errors?: any;
  constructor(message: string, statusCode: number, errors?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    ...(options.body instanceof FormData
      ? {}
      : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  };

  const method = (options.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const xsrfToken = getCookie('XSRF-TOKEN');
    if (xsrfToken && !headers['x-csrf-token']) {
      headers['x-csrf-token'] = xsrfToken;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    let fallbackMessage = 'Something went wrong';
    if (response.status >= 500) {
      fallbackMessage =
        'Backend server is currently unavailable. Please verify the API server is running on port 5000.';
    }
    throw new ApiError(
      data.message || fallbackMessage,
      response.status,
      data.errors
    );
  }

  return data as T;
}

export const authApi = {
  login: (credentials: LoginInput) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  registerSchool: (payload: RegisterSchoolInput) =>
    apiRequest('/auth/register-school', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  resendOtp: (payload: ResendOtpInput) =>
    apiRequest('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  verifyOtp: (payload: VerifyOtpInput) =>
    apiRequest('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  forgotPassword: (payload: ForgotPasswordInput) =>
    apiRequest<{ success: boolean; message: string; email?: string }>(
      '/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),
  verifyResetOtp: (payload: VerifyResetOtpInput) =>
    apiRequest<{ success: boolean; message: string; resetToken?: string }>(
      '/auth/verify-reset-otp',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),
  resendResetOtp: (payload: ResendResetOtpInput) =>
    apiRequest<{ success: boolean; message: string }>(
      '/auth/resend-reset-otp',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),
  resetPassword: (payload: ResetPasswordInput | ResetPasswordWithTokenInput) =>
    apiRequest<{ success: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    apiRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getCsrfToken: () => apiRequest('/auth/csrf-token'),
  getMe: async () => {
    try {
      return await apiRequest('/auth/me');
    } catch (err: any) {
      if (err?.statusCode === 401) {
        return { success: false, user: null, school: null };
      }
      throw err;
    }
  },
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
};

export const dashboardApi = {
  getStats: (params?: {
    childStudentId?: string;
    academicYear?: string;
    search?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.childStudentId)
      query.append('childStudentId', params.childStudentId);
    if (params?.academicYear) query.append('academicYear', params.academicYear);
    if (params?.search) query.append('search', params.search);
    const qs = query.toString();
    return apiRequest(`/dashboard/stats${qs ? `?${qs}` : ''}`);
  },
};

export const academicsApi = {
  getAcademicYears: () => apiRequest('/academics/academic-years'),
  createAcademicYear: (data: AcademicYearCreateInput) =>
    apiRequest('/academics/academic-years', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateAcademicYear: (id: string, data: AcademicYearUpdateInput) =>
    apiRequest(`/academics/academic-years/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  setCurrentAcademicYear: (id: string) =>
    apiRequest(`/academics/academic-years/${id}/set-current`, {
      method: 'PATCH',
    }),
  deleteAcademicYear: (id: string) =>
    apiRequest(`/academics/academic-years/${id}`, {
      method: 'DELETE',
    }),

  getClasses: (
    params: {
      academicYearId?: string;
      academicYear?: string;
      search?: string;
    } = {}
  ) => {
    const query = new URLSearchParams();
    if (params.academicYearId)
      query.append('academicYearId', params.academicYearId);
    if (params.academicYear) query.append('academicYear', params.academicYear);
    if (params.search) query.append('search', params.search);
    const qs = query.toString();
    return apiRequest(`/academics/classes${qs ? `?${qs}` : ''}`);
  },
  createClass: (data: ClassSectionCreateInput) =>
    apiRequest('/academics/classes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateClass: (id: string, data: ClassSectionUpdateInput) =>
    apiRequest(`/academics/classes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteClass: (id: string) =>
    apiRequest(`/academics/classes/${id}`, {
      method: 'DELETE',
    }),

  getSubjects: (params: { search?: string; type?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.type) query.append('type', params.type);
    const qs = query.toString();
    return apiRequest(`/academics/subjects${qs ? `?${qs}` : ''}`);
  },
  createSubject: (data: SubjectCreateInput) =>
    apiRequest('/academics/subjects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSubject: (id: string, data: SubjectUpdateInput) =>
    apiRequest(`/academics/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteSubject: (id: string) =>
    apiRequest(`/academics/subjects/${id}`, {
      method: 'DELETE',
    }),

  getAssignments: () => apiRequest('/academics/assignments'),
  assignSubjectTeacher: (data: {
    classSectionId: string;
    subjectId: string;
    teacherId: string;
  }) =>
    apiRequest('/academics/assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteAssignment: (id: string) =>
    apiRequest(`/academics/assignments/${id}`, {
      method: 'DELETE',
    }),

  getCalendarEvents: (
    params: {
      month?: string;
      isHoliday?: boolean;
      academicYearId?: string;
    } = {}
  ) => {
    const query = new URLSearchParams();
    if (params.month) query.append('month', params.month);
    if (params.isHoliday !== undefined)
      query.append('isHoliday', String(params.isHoliday));
    if (params.academicYearId)
      query.append('academicYearId', params.academicYearId);
    const qs = query.toString();
    return apiRequest(`/academics/calendar-events${qs ? `?${qs}` : ''}`);
  },
  createCalendarEvent: (data: SchoolCalendarEventCreateInput) =>
    apiRequest('/academics/calendar-events', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteCalendarEvent: (id: string) =>
    apiRequest(`/academics/calendar-events/${id}`, {
      method: 'DELETE',
    }),
  getWorkingDays: () => apiRequest('/academics/working-days'),
  updateWorkingDays: (data: WorkingDaysUpdateInput) =>
    apiRequest('/academics/working-days', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getSchoolProfile: () => apiRequest('/academics/school-profile'),
  updateSchoolProfile: (data: SchoolProfileUpdateInput) =>
    apiRequest('/academics/school-profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

export const studentsApi = {
  getStudents: (
    params: {
      classSectionId?: string;
      search?: string;
      status?: string;
      feeStatus?: string;
      page?: number;
      limit?: number;
    } = {}
  ) => {
    const query = new URLSearchParams();
    if (params.classSectionId)
      query.append('classSectionId', params.classSectionId);
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    if (params.feeStatus) query.append('feeStatus', params.feeStatus);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    return apiRequest(`/students?${query.toString()}`);
  },
  getStudentById: (id: string) => apiRequest(`/students/${id}`),
  createStudent: (data: StudentCreateInput) =>
    apiRequest('/students', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateStudent: (id: string, data: StudentUpdateInput) =>
    apiRequest(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  archiveStudent: (id: string) =>
    apiRequest(`/students/${id}/archive`, {
      method: 'PATCH',
    }),
  restoreStudent: (id: string) =>
    apiRequest(`/students/${id}/restore`, {
      method: 'PATCH',
    }),
  addDocument: (id: string, data: StudentDocumentInput | FormData) =>
    apiRequest(`/students/${id}/documents`, {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),
  deleteDocument: (id: string, docId: string) =>
    apiRequest(`/students/${id}/documents/${docId}`, {
      method: 'DELETE',
    }),
  uploadPhoto: (id: string, formData: FormData) =>
    apiRequest(`/students/${id}/photo`, {
      method: 'POST',
      body: formData,
    }),
  deletePhoto: (id: string) =>
    apiRequest(`/students/${id}/photo`, {
      method: 'DELETE',
    }),
  getSuggestedAdmissionNumber: () =>
    apiRequest('/students/generate-admission-number'),
};

export const teachersApi = {
  getTeachers: (
    params: {
      search?: string;
      status?: string;
      page?: number;
      limit?: number;
    } = {}
  ) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    return apiRequest(`/teachers?${query.toString()}`);
  },
  getTeacherById: (id: string) => apiRequest(`/teachers/${id}`),
  createTeacher: (data: TeacherCreateInput) =>
    apiRequest('/teachers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTeacher: (id: string, data: TeacherUpdateInput) =>
    apiRequest(`/teachers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  archiveTeacher: (id: string) =>
    apiRequest(`/teachers/${id}/archive`, {
      method: 'PATCH',
    }),
  restoreTeacher: (id: string) =>
    apiRequest(`/teachers/${id}/restore`, {
      method: 'PATCH',
    }),
  uploadPhoto: (id: string, formData: FormData) =>
    apiRequest(`/teachers/${id}/photo`, {
      method: 'POST',
      body: formData,
    }),
  deletePhoto: (id: string) =>
    apiRequest(`/teachers/${id}/photo`, {
      method: 'DELETE',
    }),
};

export const parentsApi = {
  getParents: (
    params: { search?: string; page?: number; limit?: number } = {}
  ) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    return apiRequest(`/parents?${query.toString()}`);
  },
  getParentById: (id: string) => apiRequest(`/parents/${id}`),
  createParent: (data: ParentCreateInput) =>
    apiRequest('/parents', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  linkChild: (data: ParentLinkChildInput) =>
    apiRequest('/parents/link-child', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  unlinkChild: (data: ParentLinkChildInput) =>
    apiRequest('/parents/unlink-child', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  uploadPhoto: (id: string, formData: FormData) =>
    apiRequest(`/parents/${id}/photo`, {
      method: 'POST',
      body: formData,
    }),
  deletePhoto: (id: string) =>
    apiRequest(`/parents/${id}/photo`, {
      method: 'DELETE',
    }),
};

export const attendanceApi = {
  getAttendance: (
    classSectionId: string,
    date: string,
    academicYearId?: string,
    subjectId?: string
  ) => {
    const query = new URLSearchParams({ classSectionId, date });
    if (academicYearId) query.append('academicYearId', academicYearId);
    if (subjectId) query.append('subjectId', subjectId);
    return apiRequest(`/attendance?${query.toString()}`);
  },
  markAttendance: (data: AttendanceMarkInput) =>
    apiRequest('/attendance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getSummary: () => apiRequest('/attendance/summary'),
  getDailyReport: (date?: string, academicYearId?: string) => {
    const query = new URLSearchParams();
    if (date) query.append('date', date);
    if (academicYearId) query.append('academicYearId', academicYearId);
    return apiRequest(
      `/attendance/reports/daily${query.toString() ? `?${query.toString()}` : ''}`
    );
  },
  getWeeklyReport: (classSectionId?: string, endDate?: string) => {
    const query = new URLSearchParams();
    if (classSectionId) query.append('classSectionId', classSectionId);
    if (endDate) query.append('endDate', endDate);
    return apiRequest(
      `/attendance/reports/weekly${query.toString() ? `?${query.toString()}` : ''}`
    );
  },
  getMonthlyReport: (
    month?: string,
    classSectionId?: string,
    academicYearId?: string
  ) => {
    const query = new URLSearchParams();
    if (month) query.append('month', month);
    if (classSectionId) query.append('classSectionId', classSectionId);
    if (academicYearId) query.append('academicYearId', academicYearId);
    return apiRequest(
      `/attendance/reports/monthly${query.toString() ? `?${query.toString()}` : ''}`
    );
  },
  getStudentReport: (studentId: string, academicYearId?: string) => {
    const query = new URLSearchParams();
    if (academicYearId) query.append('academicYearId', academicYearId);
    return apiRequest(
      `/attendance/reports/student/${studentId}${query.toString() ? `?${query.toString()}` : ''}`
    );
  },
  getMyStudentAttendance: (academicYearId?: string) => {
    const query = new URLSearchParams();
    if (academicYearId) query.append('academicYearId', academicYearId);
    return apiRequest(
      `/attendance/my-student${query.toString() ? `?${query.toString()}` : ''}`
    );
  },
  getMyChildAttendance: (studentId: string, academicYearId?: string) => {
    const query = new URLSearchParams();
    if (academicYearId) query.append('academicYearId', academicYearId);
    return apiRequest(
      `/attendance/my-child/${studentId}${query.toString() ? `?${query.toString()}` : ''}`
    );
  },
  getGuardianAlertLogs: () => apiRequest('/attendance/guardian-alerts'),
};

export const examsApi = {
  getExams: () => apiRequest('/exams'),
  createExam: (data: ExamCreateInput) =>
    apiRequest('/exams', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateExam: (id: string, data: ExamUpdateInput) =>
    apiRequest(`/exams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteExam: (id: string) =>
    apiRequest(`/exams/${id}`, {
      method: 'DELETE',
    }),
  getGrades: (examId: string, classSectionId: string, subjectId: string) =>
    apiRequest(
      `/exams/grades?examId=${examId}&classSectionId=${classSectionId}&subjectId=${subjectId}`
    ),
  submitGrades: (
    data: GradeRecordSubmitInput & { correctionReason?: string }
  ) =>
    apiRequest('/exams/grades', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  correctGrade: (data: GradeRecordCorrectionInput) =>
    apiRequest('/exams/correct-grade', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  publishGrades: (gradeRecordId: string) =>
    apiRequest('/exams/publish', {
      method: 'POST',
      body: JSON.stringify({ gradeRecordId }),
    }),
  getStudentReportCard: (studentId: string, examId: string) =>
    apiRequest(`/exams/report-card?studentId=${studentId}&examId=${examId}`),
};

export const feesApi = {
  getInvoices: (
    params: {
      status?: string;
      studentId?: string;
      classSectionId?: string;
      academicYearId?: string;
      search?: string;
      page?: number;
      limit?: number;
    } = {}
  ) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.studentId) query.append('studentId', params.studentId);
    if (params.classSectionId)
      query.append('classSectionId', params.classSectionId);
    if (params.academicYearId)
      query.append('academicYearId', params.academicYearId);
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    return apiRequest(`/fees?${query.toString()}`);
  },
  createInvoice: (data: any) =>
    apiRequest('/fees/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getInvoiceById: (id: string) => apiRequest(`/fees/${id}`),
  updateInvoice: (id: string, data: any) =>
    apiRequest(`/fees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteInvoice: (id: string) =>
    apiRequest(`/fees/${id}`, {
      method: 'DELETE',
    }),
  bulkGenerateInvoices: (data: any) =>
    apiRequest('/fees/invoices/bulk-generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  recordPayment: (data: FeePaymentInput, idempotencyKey?: string) =>
    apiRequest('/fees/pay', {
      method: 'POST',
      headers: idempotencyKey ? { 'x-idempotency-key': idempotencyKey } : {},
      body: JSON.stringify(data),
    }),
  getReceipt: (receiptNumber: string) =>
    apiRequest(`/fees/receipt/${receiptNumber}`),
  getFeeHeads: (
    params: { academicYearId?: string; classSectionId?: string } = {}
  ) => {
    const query = new URLSearchParams();
    if (params.academicYearId)
      query.append('academicYearId', params.academicYearId);
    if (params.classSectionId)
      query.append('classSectionId', params.classSectionId);
    return apiRequest(`/fees/heads?${query.toString()}`);
  },
  createFeeHead: (data: any) =>
    apiRequest('/fees/heads', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateFeeHead: (id: string, data: any) =>
    apiRequest(`/fees/heads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteFeeHead: (id: string) =>
    apiRequest(`/fees/heads/${id}`, {
      method: 'DELETE',
    }),
  getFeeStructures: (
    params: { classSectionId?: string; academicYearId?: string } = {}
  ) => {
    const query = new URLSearchParams();
    if (params.classSectionId)
      query.append('classSectionId', params.classSectionId);
    if (params.academicYearId)
      query.append('academicYearId', params.academicYearId);
    return apiRequest(`/fees/structures?${query.toString()}`);
  },
  createFeeStructure: (data: any) =>
    apiRequest('/fees/structures', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateFeeStructure: (id: string, data: any) =>
    apiRequest(`/fees/structures/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteFeeStructure: (id: string) =>
    apiRequest(`/fees/structures/${id}`, {
      method: 'DELETE',
    }),
  getConcessions: (
    params: {
      studentId?: string;
      status?: string;
      academicYearId?: string;
    } = {}
  ) => {
    const query = new URLSearchParams();
    if (params.studentId) query.append('studentId', params.studentId);
    if (params.status) query.append('status', params.status);
    if (params.academicYearId)
      query.append('academicYearId', params.academicYearId);
    return apiRequest(`/fees/concessions?${query.toString()}`);
  },
  createConcession: (data: any) =>
    apiRequest('/fees/concessions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateConcessionStatus: (
    id: string,
    status: 'approved' | 'rejected',
    note?: string
  ) =>
    apiRequest(`/fees/concessions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    }),
  getDefaultersReport: (
    params: {
      classSectionId?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
      page?: number;
      limit?: number;
    } = {}
  ) => {
    const query = new URLSearchParams();
    if (params.classSectionId)
      query.append('classSectionId', params.classSectionId);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    return apiRequest(`/fees/reports/defaulters?${query.toString()}`);
  },
  getCollectionDashboard: () => apiRequest('/fees/dashboard'),
  getDailyFeeBook: (
    params: {
      date?: string;
      paymentMethod?: string;
      page?: number;
      limit?: number;
    } = {}
  ) => {
    const query = new URLSearchParams();
    if (params.date) query.append('date', params.date);
    if (params.paymentMethod)
      query.append('paymentMethod', params.paymentMethod);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    return apiRequest(`/fees/daily-book?${query.toString()}`);
  },
};

export const noticesApi = {
  getNotices: (params: { status?: string; category?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.category) query.append('category', params.category);
    return apiRequest(`/notices?${query.toString()}`);
  },
  createNotice: (data: any) =>
    apiRequest('/notices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  publishNotice: (id: string) =>
    apiRequest(`/notices/${id}/publish`, {
      method: 'PUT',
    }),
  archiveNotice: (id: string) =>
    apiRequest(`/notices/${id}/archive`, {
      method: 'PUT',
    }),
  deleteNotice: (id: string) =>
    apiRequest(`/notices/${id}`, {
      method: 'DELETE',
    }),
};

export const rolesApi = {
  getTeacherPermissions: () => apiRequest('/roles/teachers'),
  updateTeacherPermissions: (data: PermissionsUpdateInput) =>
    apiRequest('/roles/update', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const auditApi = {
  getAuditLogs: (
    params: {
      action?: string;
      entityType?: string;
      module?: string;
      actor?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
      page?: number;
      limit?: number;
    } = {}
  ) => {
    const query = new URLSearchParams();
    if (params.action) query.append('action', params.action);
    if (params.entityType) query.append('entityType', params.entityType);
    if (params.module) query.append('module', params.module);
    if (params.actor) query.append('actor', params.actor);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    return apiRequest(`/audit-logs?${query.toString()}`);
  },
};

export const notificationsApi = {
  getMyNotifications: () => apiRequest('/notifications'),
  markAsRead: (id: string) =>
    apiRequest(`/notifications/${id}/read`, {
      method: 'PATCH',
    }),
};

export const modulesApi = {
  getHomework: (
    params: { classSectionId?: string; studentId?: string } = {}
  ) => {
    const query = new URLSearchParams();
    if (params.classSectionId)
      query.append('classSectionId', params.classSectionId);
    if (params.studentId) query.append('studentId', params.studentId);
    return apiRequest(`/homework?${query.toString()}`);
  },
  createHomework: (data: any) =>
    apiRequest('/homework', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getHomeworkSubmissions: (homeworkId: string) =>
    apiRequest(`/homework/${homeworkId}/submissions`),
  submitHomework: (
    homeworkId: string,
    data: { submissionText?: string; attachments?: any[] }
  ) =>
    apiRequest(`/homework/${homeworkId}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  gradeHomeworkSubmission: (
    submissionId: string,
    data: { marksObtained: number; feedback?: string }
  ) =>
    apiRequest(`/homework/submissions/${submissionId}/grade`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getTimetable: (
    params: { classSectionId?: string; teacherId?: string } = {}
  ) => {
    const query = new URLSearchParams();
    if (params.classSectionId)
      query.append('classSectionId', params.classSectionId);
    if (params.teacherId) query.append('teacherId', params.teacherId);
    return apiRequest(`/timetable?${query.toString()}`);
  },
  createTimetableSlot: (data: any) =>
    apiRequest('/timetable', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteTimetableSlot: (id: string) =>
    apiRequest(`/timetable/${id}`, {
      method: 'DELETE',
    }),
  getMaterials: (
    params: { classSectionId?: string; subjectId?: string } = {}
  ) => {
    const query = new URLSearchParams();
    if (params.classSectionId)
      query.append('classSectionId', params.classSectionId);
    if (params.subjectId) query.append('subjectId', params.subjectId);
    return apiRequest(`/materials?${query.toString()}`);
  },
  createMaterial: (data: any) =>
    apiRequest('/materials', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getCommunicationStats: () => apiRequest('/communication'),
  getAiStatus: () => apiRequest('/ai-assistant/status'),
  askAiAssistant: (
    prompt: string,
    category: string = 'general',
    filters: {
      startDate?: string;
      endDate?: string;
      classSectionId?: string;
    } = {}
  ) =>
    apiRequest('/ai-assistant', {
      method: 'POST',
      body: JSON.stringify({
        prompt,
        category,
        contextType: category,
        ...filters,
      }),
    }),
  getHomeworkHint: (
    homeworkId: string,
    data: {
      hintLevel?: number;
      studentQuery?: string;
      problemContext?: string;
    } = {}
  ) =>
    apiRequest(`/student/homework/${homeworkId}/hint`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const financeApi = {
  getExpenses: (
    params: {
      category?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
      page?: number;
      limit?: number;
    } = {}
  ) => {
    const query = new URLSearchParams();
    if (params.category) query.append('category', params.category);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    return apiRequest(`/finance/expenses?${query.toString()}`);
  },
  createExpense: (data: ExpenseCreateInput) =>
    apiRequest('/finance/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteExpense: (id: string) =>
    apiRequest(`/finance/expenses/${id}`, {
      method: 'DELETE',
    }),
  getFinanceSummary: (
    params: { startDate?: string; endDate?: string } = {}
  ) => {
    const query = new URLSearchParams();
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    return apiRequest(`/finance/summary?${query.toString()}`);
  },
};

export const reportsApi = {
  getStudentStrength: (params: { classSectionId?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.classSectionId)
      query.append('classSectionId', params.classSectionId);
    return apiRequest(`/reports/student-strength?${query.toString()}`);
  },
  getAttendanceReport: (
    params: {
      classSectionId?: string;
      startDate?: string;
      endDate?: string;
    } = {}
  ) => {
    const query = new URLSearchParams();
    if (params.classSectionId)
      query.append('classSectionId', params.classSectionId);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    return apiRequest(`/reports/attendance?${query.toString()}`);
  },
  getFeesReport: (params: { classSectionId?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.classSectionId)
      query.append('classSectionId', params.classSectionId);
    return apiRequest(`/reports/fees?${query.toString()}`);
  },
  getExamPerformanceReport: (
    params: { classSectionId?: string; examId?: string } = {}
  ) => {
    const query = new URLSearchParams();
    if (params.classSectionId)
      query.append('classSectionId', params.classSectionId);
    if (params.examId) query.append('examId', params.examId);
    return apiRequest(`/reports/exams?${query.toString()}`);
  },
  getHomeworkReport: (params: { classSectionId?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.classSectionId)
      query.append('classSectionId', params.classSectionId);
    return apiRequest(`/reports/homework?${query.toString()}`);
  },
  getExportCsvUrl: (type: string, classSectionId?: string) => {
    const query = new URLSearchParams();
    query.append('type', type);
    if (classSectionId) query.append('classSectionId', classSectionId);
    return `${BASE_URL}/reports/export-csv?${query.toString()}`;
  },
};

export const settingsApi = {
  getSettings: () => apiRequest('/settings'),
  updateSettings: (data: SchoolSettingsUpdateInput) =>
    apiRequest('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  exportBackup: () => apiRequest('/settings/backup'),
  restoreBackup: (data: BackupPayload) =>
    apiRequest('/settings/restore', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const communicationApi = {
  getConversations: () => apiRequest('/conversations'),
  createConversation: (data: {
    type: 'admin_teacher' | 'teacher_parent' | 'general';
    title?: string;
    recipientUserId: string;
    initialMessage?: string;
  }) =>
    apiRequest('/conversations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getMessages: (conversationId: string) =>
    apiRequest(`/conversations/${conversationId}/messages`),
  sendMessage: (
    conversationId: string,
    data: { message: string; attachments?: any[] }
  ) =>
    apiRequest(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  markAsRead: (conversationId: string) =>
    apiRequest(`/conversations/${conversationId}/read`, {
      method: 'POST',
    }),
  getRecipients: () => apiRequest('/conversations/recipients'),
};

export const quizApi = {
  getQuizzes: (
    params: {
      subjectId?: string;
      status?: string;
      classSectionId?: string;
    } = {}
  ) => {
    const query = new URLSearchParams();
    if (params.subjectId) query.append('subjectId', params.subjectId);
    if (params.status) query.append('status', params.status);
    if (params.classSectionId)
      query.append('classSectionId', params.classSectionId);
    return apiRequest(`/quizzes?${query.toString()}`);
  },
  getQuizById: (id: string) => apiRequest(`/quizzes/${id}`),
  createQuiz: (data: any) =>
    apiRequest('/quizzes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateQuiz: (id: string, data: any) =>
    apiRequest(`/quizzes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  publishQuiz: (id: string) =>
    apiRequest(`/quizzes/${id}/publish`, {
      method: 'PATCH',
    }),
  deleteQuiz: (id: string) =>
    apiRequest(`/quizzes/${id}`, {
      method: 'DELETE',
    }),
  startAttempt: (quizId: string) =>
    apiRequest(`/quizzes/${quizId}/attempt`, {
      method: 'POST',
    }),
  saveAnswers: (
    quizId: string,
    answers: Array<{
      questionId: string;
      studentAnswer: string;
      isFlaggedForReview?: boolean;
    }>
  ) =>
    apiRequest(`/quizzes/${quizId}/attempt/answers`, {
      method: 'PATCH',
      body: JSON.stringify({ answers }),
    }),
  submitQuiz: (
    quizId: string,
    answers?: Array<{
      questionId: string;
      studentAnswer: string;
      isFlaggedForReview?: boolean;
    }>
  ) =>
    apiRequest(`/quizzes/${quizId}/attempt/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers: answers || [] }),
    }),
  getStudentResult: (quizId: string) =>
    apiRequest(`/quizzes/${quizId}/attempt/result`),
  getTeacherReports: (quizId: string) =>
    apiRequest(`/quizzes/${quizId}/reports`),
  getParentChildQuizzes: (studentId: string) =>
    apiRequest(`/quizzes/parent/child?studentId=${studentId}`),
  generateAiQuiz: (data: {
    subjectName: string;
    topic: string;
    classLevel?: string;
    numQuestions?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
  }) =>
    apiRequest('/quizzes/generate-ai', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
