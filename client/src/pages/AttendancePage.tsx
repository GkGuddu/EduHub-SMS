import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi, academicsApi, parentsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  AttendanceStatus,
  PERMISSIONS,
  IAttendanceDailyClassSummary,
  IAttendanceWeeklyDay,
} from '@eduhub/shared';
import {
  CalendarCheck,
  CheckCheck,
  AlertTriangle,
  History,
  Clock,
  Save,
  Loader2,
  RotateCcw,
  UserCheck,
  UserX,
  Calendar,
  BarChart3,
  Bell,
  FileSpreadsheet,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  ShieldCheck,
  Search,
  ChevronRight,
  GraduationCap,
  X,
  Coffee,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

interface AttendanceItemState {
  studentId: string;
  studentName: string;
  rollNumber: string;
  status: AttendanceStatus | null;
  remarks: string;
}

export const AttendancePage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const isParent = user?.role === 'parent';
  const isStudent = user?.role === 'student';
  const isFaculty = user?.role === 'admin' || user?.role === 'teacher';

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.slice(0, 7);

  const [activeTab, setActiveTab] = useState<'register' | 'reports' | 'alerts'>(
    'register'
  );
  const [reportSubTab, setReportSubTab] = useState<
    'daily' | 'weekly' | 'monthly' | 'student'
  >('daily');

  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const [roster, setRoster] = useState<AttendanceItemState[]>([]);
  const [originalRoster, setOriginalRoster] = useState<AttendanceItemState[]>(
    []
  );
  const [editReason, setEditReason] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [selectedReportStudentId, setSelectedReportStudentId] = useState<
    string | null
  >(null);

  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [parentStatusFilter, setParentStatusFilter] = useState<string>('all');

  const { data: yearsData } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => academicsApi.getAcademicYears(),
    enabled: isFaculty,
  });

  useEffect(() => {
    if (yearsData?.academicYears?.length > 0 && !selectedAcademicYearId) {
      const current = yearsData.academicYears.find((y: any) => y.isCurrent);
      setSelectedAcademicYearId(
        current ? current._id : yearsData.academicYears[0]._id
      );
    }
  }, [yearsData, selectedAcademicYearId]);

  const { data: classData, isLoading: loadingClasses } = useQuery({
    queryKey: ['classes'],
    queryFn: () => academicsApi.getClasses(),
    enabled: isFaculty,
  });

  useEffect(() => {
    if (classData?.classes?.length > 0 && !selectedClassId) {
      setSelectedClassId(classData.classes[0]._id);
    }
  }, [classData, selectedClassId]);

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => academicsApi.getSubjects(),
    enabled: isFaculty,
  });

  const {
    data: attendanceData,
    isLoading: loadingAttendance,
    refetch: refetchAttendance,
  } = useQuery({
    queryKey: [
      'attendance',
      selectedClassId,
      selectedDate,
      selectedAcademicYearId,
      selectedSubjectId,
    ],
    queryFn: () =>
      attendanceApi.getAttendance(
        selectedClassId,
        selectedDate,
        selectedAcademicYearId || undefined,
        selectedSubjectId || undefined
      ),
    enabled: isFaculty && !!selectedClassId && !!selectedDate,
  });

  useEffect(() => {
    if (attendanceData?.records) {
      const mapped = attendanceData.records.map((r: any) => ({
        studentId: r.studentId,
        studentName: r.studentName,
        rollNumber: r.rollNumber,
        status: r.status,
        remarks: r.remarks || '',
      }));
      setRoster(mapped);
      setOriginalRoster(JSON.parse(JSON.stringify(mapped)));
      setEditReason('');
    }
  }, [attendanceData]);

  const canMark =
    user?.role === 'admin' || hasPermission(PERMISSIONS.ATTENDANCE_MARK);
  const canEditPast =
    user?.role === 'admin' || hasPermission(PERMISSIONS.ATTENDANCE_EDIT);

  const isFinalized = !!attendanceData?.alreadyMarked;
  const isEditingLocked = isFinalized && !canEditPast;

  const saveMutation = useMutation({
    mutationFn: (payload: any) => attendanceApi.markAttendance(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-reports'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['guardian-alerts'] });
      setSuccessMessage(data.message || 'Attendance saved successfully!');
      setErrorMessage(null);
      setTimeout(() => setSuccessMessage(null), 4500);
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to record attendance');
      setTimeout(() => setErrorMessage(null), 5000);
    },
  });

  const handleBulkMarkPresent = () => {
    if (isEditingLocked) return;
    setRoster((prev) => prev.map((item) => ({ ...item, status: 'present' })));
  };

  const handleBulkMarkAbsent = () => {
    if (isEditingLocked) return;
    setRoster((prev) => prev.map((item) => ({ ...item, status: 'absent' })));
  };

  const handleResetRoster = () => {
    if (isEditingLocked) return;
    setRoster(JSON.parse(JSON.stringify(originalRoster)));
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    if (isEditingLocked || !canMark) return;
    setRoster((prev) =>
      prev.map((item) =>
        item.studentId === studentId ? { ...item, status } : item
      )
    );
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    if (isEditingLocked || !canMark) return;
    setRoster((prev) =>
      prev.map((item) =>
        item.studentId === studentId ? { ...item, remarks } : item
      )
    );
  };

  const handleSave = () => {
    if (!selectedClassId || !selectedDate || roster.length === 0) return;

    const unmarkedStudents = roster.filter((r) => r.status === null);
    if (unmarkedStudents.length > 0) {
      const confirmSave = window.confirm(
        `${unmarkedStudents.length} student(s) are currently unmarked. Do you want to mark them as Present before saving?`
      );
      if (confirmSave) {
        setRoster((prev) =>
          prev.map((r) => (r.status === null ? { ...r, status: 'present' } : r))
        );
      } else {
        return;
      }
    }

    if (isFinalized && !editReason.trim()) {
      alert(
        'Please provide an audit reason for editing this finalized attendance session.'
      );
      return;
    }

    saveMutation.mutate({
      classSectionId: selectedClassId,
      academicYearId: selectedAcademicYearId || undefined,
      subjectId: selectedSubjectId || undefined,
      date: selectedDate,
      records: roster.map((r) => ({
        ...r,
        status: r.status || 'present',
      })),
      isEdited: isFinalized,
      editReason: editReason.trim() || undefined,
    });
  };

  const presentCount = roster.filter((r) => r.status === 'present').length;
  const absentCount = roster.filter((r) => r.status === 'absent').length;
  const lateCount = roster.filter((r) => r.status === 'late').length;
  const leaveCount = roster.filter((r) => r.status === 'leave').length;
  const totalMarked = presentCount + absentCount + lateCount + leaveCount;
  const totalStudents = roster.length;
  const liveRate =
    totalMarked > 0
      ? Math.round(((presentCount + lateCount * 0.5) / totalMarked) * 100)
      : 0;

  const { data: dailyReportData, isLoading: loadingDaily } = useQuery({
    queryKey: [
      'attendance-reports',
      'daily',
      selectedDate,
      selectedAcademicYearId,
    ],
    queryFn: () =>
      attendanceApi.getDailyReport(
        selectedDate,
        selectedAcademicYearId || undefined
      ),
    enabled: isFaculty && activeTab === 'reports' && reportSubTab === 'daily',
  });

  const { data: weeklyReportData, isLoading: loadingWeekly } = useQuery({
    queryKey: ['attendance-reports', 'weekly', selectedClassId, selectedDate],
    queryFn: () =>
      attendanceApi.getWeeklyReport(selectedClassId || undefined, selectedDate),
    enabled: isFaculty && activeTab === 'reports' && reportSubTab === 'weekly',
  });

  const { data: monthlyReportData, isLoading: loadingMonthly } = useQuery({
    queryKey: [
      'attendance-reports',
      'monthly',
      selectedClassId,
      currentMonthStr,
      selectedAcademicYearId,
    ],
    queryFn: () =>
      attendanceApi.getMonthlyReport(
        currentMonthStr,
        selectedClassId || undefined,
        selectedAcademicYearId || undefined
      ),
    enabled: isFaculty && activeTab === 'reports' && reportSubTab === 'monthly',
  });

  const { data: studentReportData, isLoading: loadingStudentReport } = useQuery(
    {
      queryKey: [
        'attendance-reports',
        'student',
        selectedReportStudentId,
        selectedAcademicYearId,
      ],
      queryFn: () =>
        attendanceApi.getStudentReport(
          selectedReportStudentId!,
          selectedAcademicYearId || undefined
        ),
      enabled:
        isFaculty &&
        activeTab === 'reports' &&
        reportSubTab === 'student' &&
        !!selectedReportStudentId,
    }
  );

  const { data: alertLogsData, isLoading: loadingAlertLogs } = useQuery({
    queryKey: ['guardian-alerts'],
    queryFn: () => attendanceApi.getGuardianAlertLogs(),
    enabled: isFaculty && activeTab === 'alerts',
  });

  const { data: personalAttendanceData, isLoading: loadingPersonal } = useQuery(
    {
      queryKey: ['my-student-attendance'],
      queryFn: () => attendanceApi.getMyStudentAttendance(),
      enabled: isStudent,
    }
  );

  const { data: parentProfileData } = useQuery({
    queryKey: ['parent-profile'],
    queryFn: () => parentsApi.getParentById(user?._id || ''),
    enabled: isParent,
  });

  useEffect(() => {
    if (
      parentProfileData?.parent?.linkedStudents?.length > 0 &&
      !selectedChildId
    ) {
      const first = parentProfileData.parent.linkedStudents[0];
      setSelectedChildId(first.studentUserId || first.studentId);
    }
  }, [parentProfileData, selectedChildId]);

  const { data: childAttendanceData, isLoading: loadingChildAttendance } =
    useQuery({
      queryKey: ['child-attendance', selectedChildId],
      queryFn: () => attendanceApi.getMyChildAttendance(selectedChildId),
      enabled: isParent && !!selectedChildId,
    });

  if (isStudent) {
    const report = personalAttendanceData?.report;
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-brand-500 to-orange-400 rounded-3xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 uppercase tracking-wider">
              Student Attendance Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">
              My Academic Attendance
            </h1>
            <p className="text-xs sm:text-sm text-orange-100 mt-1">
              Class {report?.className} - Section {report?.section} • Roll #
              {report?.rollNumber}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-center">
            <span className="text-[11px] uppercase tracking-wider text-orange-100 block">
              Overall Rate
            </span>
            <span className="text-3xl font-black">
              {report?.attendanceRate ?? 100}%
            </span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] text-slate-400 block font-medium">
              Total Working Days
            </span>
            <span className="text-xl font-bold text-slate-800">
              {report?.totalWorkingDays ?? 0}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
            <span className="text-[11px] text-emerald-600 block font-medium">
              Present Days
            </span>
            <span className="text-xl font-bold text-emerald-700">
              {report?.presentDays ?? 0}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
            <span className="text-[11px] text-amber-600 block font-medium">
              Late Arrivals
            </span>
            <span className="text-xl font-bold text-amber-700">
              {report?.lateDays ?? 0}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100">
            <span className="text-[11px] text-indigo-600 block font-medium">
              Authorized Leaves
            </span>
            <span className="text-xl font-bold text-indigo-700">
              {report?.leaveDays ?? 0}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
            <span className="text-[11px] text-rose-600 block font-medium">
              Absences
            </span>
            <span className="text-xl font-bold text-rose-700">
              {report?.absentDays ?? 0}
            </span>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Attendance Session Logs
            </h3>
            <span className="text-xs text-slate-400">
              Formula: (Present + 0.5 × Late) / Working Days × 100%
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Day</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Teacher Note / Remarks</th>
                  <th className="px-6 py-3">Verified By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingPersonal ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-12 text-center text-slate-400"
                    >
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-500 mb-2" />
                      Loading records...
                    </td>
                  </tr>
                ) : !report?.history?.length ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-12 text-center text-slate-400"
                    >
                      No attendance sessions recorded yet.
                    </td>
                  </tr>
                ) : (
                  report.history.map((h: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="px-6 py-3.5 font-mono font-medium text-slate-700">
                        {h.date}
                      </td>
                      <td className="px-6 py-3.5 text-slate-500">
                        {h.dayName}
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            h.status === 'present'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : h.status === 'late'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : h.status === 'leave'
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {h.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-600">
                        {h.remarks || '—'}
                      </td>
                      <td className="px-6 py-3.5 text-slate-400">
                        {h.takenByName || 'Class Faculty'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (isParent) {
    const linkedStudents = parentProfileData?.parent?.linkedStudents || [];
    const childReport = childAttendanceData?.report;

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Ward Attendance Monitor
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Verified parent access for Adiya School of Excellence.
            </p>
          </div>
          {linkedStudents.length > 1 && (
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 px-2">
                Child:
              </span>
              {linkedStudents.map((child: any) => {
                const childId = child.studentUserId || child.studentId;
                const isSelected = selectedChildId === childId;
                return (
                  <button
                    key={childId}
                    onClick={() => setSelectedChildId(childId)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-brand-500 text-white shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    {child.name || child.studentName || 'Child'} ({child.className || 'Class'}-{child.section || 'A'})
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="bg-gradient-to-r from-brand-500 to-amber-500 rounded-3xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 uppercase tracking-wider">
              Student Record
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">
              {childReport?.studentName || 'Student'}
            </h2>
            <p className="text-xs sm:text-sm text-amber-100 mt-1">
              Class {childReport?.className} - Section {childReport?.section} •
              Roll #{childReport?.rollNumber} • Admission #
              {childReport?.admissionNumber || 'ADM-2024'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 text-center">
            <span className="text-[11px] uppercase tracking-wider text-amber-100 block">
              Attendance Rate
            </span>
            <span className="text-3xl font-black">
              {childReport?.attendanceRate ?? 100}%
            </span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] text-slate-400 block font-medium">
              Total Working Days
            </span>
            <span className="text-xl font-bold text-slate-800">
              {childReport?.totalWorkingDays ?? 0}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
            <span className="text-[11px] text-emerald-600 block font-medium">
              Present Days
            </span>
            <span className="text-xl font-bold text-emerald-700">
              {childReport?.presentDays ?? 0}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
            <span className="text-[11px] text-amber-600 block font-medium">
              Late Arrivals
            </span>
            <span className="text-xl font-bold text-amber-700">
              {childReport?.lateDays ?? 0}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100">
            <span className="text-[11px] text-indigo-600 block font-medium">
              Approved Leaves
            </span>
            <span className="text-xl font-bold text-indigo-700">
              {childReport?.leaveDays ?? 0}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
            <span className="text-[11px] text-rose-600 block font-medium">
              Recorded Absences
            </span>
            <span className="text-xl font-bold text-rose-700">
              {childReport?.absentDays ?? 0}
            </span>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Attendance Activity Log
              </h3>
              <span className="text-xs text-slate-400">
                Strict Guardian Isolation Verified
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['all', 'present', 'late', 'leave', 'absent'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setParentStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                    parentStatusFilter === st
                      ? 'bg-brand-500 text-white shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Day</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Faculty Remarks</th>
                  <th className="px-6 py-3">Faculty In Charge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingChildAttendance ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-12 text-center text-slate-400"
                    >
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-500 mb-2" />
                      Loading student attendance records...
                    </td>
                  </tr>
                ) : !childReport?.history?.length ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-12 text-center text-slate-400"
                    >
                      No attendance sessions recorded for this academic year.
                    </td>
                  </tr>
                ) : childReport.history.filter((h: any) =>
                    parentStatusFilter === 'all' ? true : h.status === parentStatusFilter
                  ).length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-12 text-center text-slate-400"
                    >
                      No {parentStatusFilter} attendance sessions recorded.
                    </td>
                  </tr>
                ) : (
                  childReport.history
                    .filter((h: any) =>
                      parentStatusFilter === 'all' ? true : h.status === parentStatusFilter
                    )
                    .map((h: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="px-6 py-3.5 font-mono font-medium text-slate-700">
                        {h.date}
                      </td>
                      <td className="px-6 py-3.5 text-slate-500">
                        {h.dayName}
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            h.status === 'present'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : h.status === 'late'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : h.status === 'leave'
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {h.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-600">
                        {h.remarks || '—'}
                      </td>
                      <td className="px-6 py-3.5 text-slate-400">
                        {h.takenByName || 'Class Teacher'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-orange-100 text-brand-600">
              <CalendarCheck className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Student Attendance Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Adiya School of Excellence • Class registers, 4-status rosters,
            guardian absent alerts, and analytics.
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('register')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'register'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            Daily Register
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'reports'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Reports & Analytics
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'alerts'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Bell className="w-4 h-4" />
            Guardian Alerts
          </button>
        </div>
      </div>
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-600 hover:text-rose-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {activeTab === 'register' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Academic Session
                </label>
                <select
                  value={selectedAcademicYearId}
                  onChange={(e) => setSelectedAcademicYearId(e.target.value)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 cursor-pointer min-w-[150px]"
                >
                  {yearsData?.academicYears?.map((y: any) => (
                    <option key={y._id} value={y._id}>
                      {y.name} {y.isCurrent ? '(Current)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Class & Section
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 cursor-pointer min-w-[180px]"
                >
                  {classData?.classes?.map((c: any) => (
                    <option key={c._id} value={c._id}>
                      {c.name} - Section {c.section} ({c.studentCount || 0}{' '}
                      students)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Subject (Optional)
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 cursor-pointer min-w-[150px]"
                >
                  <option value="">All Subjects (Daily Roll)</option>
                  {subjectsData?.subjects?.map((s: any) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Attendance Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 cursor-pointer"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center gap-1 text-emerald-700 font-bold px-2 py-0.5 bg-emerald-100 rounded-lg">
                <span>P: {presentCount}</span>
              </div>
              <div className="flex items-center gap-1 text-rose-700 font-bold px-2 py-0.5 bg-rose-100 rounded-lg">
                <span>A: {absentCount}</span>
              </div>
              <div className="flex items-center gap-1 text-amber-700 font-bold px-2 py-0.5 bg-amber-100 rounded-lg">
                <span>L: {lateCount}</span>
              </div>
              <div className="flex items-center gap-1 text-indigo-700 font-bold px-2 py-0.5 bg-indigo-100 rounded-lg">
                <span>Lv: {leaveCount}</span>
              </div>
              <div className="font-extrabold text-slate-700 px-2">
                Rate: {liveRate}%
              </div>
            </div>
          </div>
          {isFinalized && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <span className="font-bold">
                    Finalized Attendance Session:
                  </span>{' '}
                  Attendance for this class on {selectedDate} was finalized by{' '}
                  <strong>{attendanceData.takenByName}</strong>.
                  {isEditingLocked ? (
                    <span className="block text-amber-700 mt-0.5">
                      You need <code>attendance.edit</code> privilege to revise
                      this session. Modification is locked.
                    </span>
                  ) : (
                    <span className="block text-amber-700 mt-0.5">
                      Modifications require an audit reason. An audit log and
                      guardian update will be recorded.
                    </span>
                  )}
                </div>
              </div>

              {canEditPast && (
                <div className="w-full sm:w-80 shrink-0">
                  <input
                    type="text"
                    placeholder="Audit reason for revision (required)..."
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              )}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBulkMarkPresent}
                disabled={isEditingLocked || !canMark}
                className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                Mark All Present
              </button>

              <button
                type="button"
                onClick={handleBulkMarkAbsent}
                disabled={isEditingLocked || !canMark}
                className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs border border-rose-200 shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <UserX className="w-3.5 h-3.5 text-rose-600" />
                Mark All Absent
              </button>

              <button
                type="button"
                onClick={handleResetRoster}
                disabled={isEditingLocked || !canMark}
                className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 font-semibold text-xs border border-slate-200 shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                Reset Roster
              </button>
            </div>
            {canMark && !isEditingLocked && (
              <button
                type="button"
                onClick={handleSave}
                disabled={
                  saveMutation.isPending || (isFinalized && !editReason.trim())
                }
                className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Records...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>
                      {isFinalized
                        ? 'Update Finalized Attendance'
                        : 'Save Daily Attendance'}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5 w-24">Roll No</th>
                    <th className="px-6 py-3.5">Student Name</th>
                    <th className="px-6 py-3.5 text-center">
                      Attendance Status (4 Options)
                    </th>
                    <th className="px-6 py-3.5">Remarks / Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingAttendance ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-16 text-center text-slate-400"
                      >
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
                        Loading student register...
                      </td>
                    </tr>
                  ) : roster.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-16 text-center text-slate-400"
                      >
                        No active students enrolled in this class section.
                      </td>
                    </tr>
                  ) : (
                    roster.map((item) => (
                      <tr
                        key={item.studentId}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="px-6 py-4 font-mono font-bold text-slate-700">
                          #{item.rollNumber}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          {item.studentName}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              disabled={isEditingLocked || !canMark}
                              onClick={() =>
                                handleStatusChange(item.studentId, 'present')
                              }
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border ${
                                item.status === 'present'
                                  ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                                  : 'bg-emerald-50/60 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              } ${isEditingLocked ? 'cursor-not-allowed opacity-75' : ''}`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${item.status === 'present' ? 'bg-white' : 'bg-emerald-500'}`}
                              />
                              Present
                            </button>
                            <button
                              type="button"
                              disabled={isEditingLocked || !canMark}
                              onClick={() =>
                                handleStatusChange(item.studentId, 'absent')
                              }
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border ${
                                item.status === 'absent'
                                  ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
                                  : 'bg-rose-50/60 text-rose-700 border-rose-200 hover:bg-rose-100'
                              } ${isEditingLocked ? 'cursor-not-allowed opacity-75' : ''}`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${item.status === 'absent' ? 'bg-white' : 'bg-rose-500'}`}
                              />
                              Absent
                            </button>
                            <button
                              type="button"
                              disabled={isEditingLocked || !canMark}
                              onClick={() =>
                                handleStatusChange(item.studentId, 'late')
                              }
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border ${
                                item.status === 'late'
                                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                                  : 'bg-amber-50/60 text-amber-700 border-amber-200 hover:bg-amber-100'
                              } ${isEditingLocked ? 'cursor-not-allowed opacity-75' : ''}`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${item.status === 'late' ? 'bg-white' : 'bg-amber-500'}`}
                              />
                              Late
                            </button>
                            <button
                              type="button"
                              disabled={isEditingLocked || !canMark}
                              onClick={() =>
                                handleStatusChange(item.studentId, 'leave')
                              }
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border ${
                                item.status === 'leave'
                                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                                  : 'bg-indigo-50/60 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                              } ${isEditingLocked ? 'cursor-not-allowed opacity-75' : ''}`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${item.status === 'leave' ? 'bg-white' : 'bg-indigo-500'}`}
                              />
                              Leave
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            disabled={isEditingLocked || !canMark}
                            placeholder={
                              canMark
                                ? item.status === 'leave'
                                  ? 'Reason for leave (e.g. medical / family)...'
                                  : 'Optional remarks...'
                                : 'No remarks'
                            }
                            value={item.remarks}
                            onChange={(e) =>
                              handleRemarksChange(
                                item.studentId,
                                e.target.value
                              )
                            }
                            className={`w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-slate-50/50 ${
                              isEditingLocked
                                ? 'cursor-not-allowed opacity-75 bg-slate-100'
                                : ''
                            }`}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <button
              onClick={() => setReportSubTab('daily')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                reportSubTab === 'daily'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Daily Class Summary
            </button>
            <button
              onClick={() => setReportSubTab('weekly')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                reportSubTab === 'weekly'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Weekly Trend (Chart)
            </button>
            <button
              onClick={() => setReportSubTab('monthly')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                reportSubTab === 'monthly'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Monthly Calendar
            </button>
            <button
              onClick={() => setReportSubTab('student')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                reportSubTab === 'student'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Student Attendance Card
            </button>
          </div>
          {reportSubTab === 'daily' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">
                    Daily School Attendance Register (
                    {dailyReportData?.date || selectedDate})
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Unmarked classes are preserved cleanly without falsely
                    marking students absent.
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3">Class & Section</th>
                      <th className="px-6 py-3">Enrolled</th>
                      <th className="px-6 py-3 text-emerald-700">Present</th>
                      <th className="px-6 py-3 text-rose-700">Absent</th>
                      <th className="px-6 py-3 text-amber-700">Late</th>
                      <th className="px-6 py-3 text-indigo-700">Leave</th>
                      <th className="px-6 py-3">Attendance Rate</th>
                      <th className="px-6 py-3">Session Status</th>
                      <th className="px-6 py-3">Recorded By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loadingDaily ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="py-12 text-center text-slate-400"
                        >
                          <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-500 mb-2" />
                          Loading daily report...
                        </td>
                      </tr>
                    ) : !dailyReportData?.summary?.length ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="py-12 text-center text-slate-400"
                        >
                          No class records found.
                        </td>
                      </tr>
                    ) : (
                      dailyReportData.summary.map(
                        (row: IAttendanceDailyClassSummary) => (
                          <tr
                            key={row.classSectionId}
                            className="hover:bg-slate-50/60"
                          >
                            <td className="px-6 py-3.5 font-bold text-slate-800">
                              {row.className} - Section {row.section}
                            </td>
                            <td className="px-6 py-3.5 text-slate-600">
                              {row.totalStudents}
                            </td>
                            <td className="px-6 py-3.5 font-bold text-emerald-600">
                              {row.present}
                            </td>
                            <td className="px-6 py-3.5 font-bold text-rose-600">
                              {row.absent}
                            </td>
                            <td className="px-6 py-3.5 font-bold text-amber-600">
                              {row.late}
                            </td>
                            <td className="px-6 py-3.5 font-bold text-indigo-600">
                              {row.leave}
                            </td>
                            <td className="px-6 py-3.5">
                              <span
                                className={`font-black ${
                                  row.rate >= 90
                                    ? 'text-emerald-600'
                                    : row.rate >= 75
                                      ? 'text-amber-600'
                                      : 'text-rose-600'
                                }`}
                              >
                                {row.isMarked ? `${row.rate}%` : '—'}
                              </span>
                            </td>
                            <td className="px-6 py-3.5">
                              {row.isMarked ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Finalized {row.isEdited ? '(Edited)' : ''}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-500">
                                  Pending / Unmarked
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-3.5 text-slate-500">
                              {row.takenByName || 'Not Taken'}
                            </td>
                          </tr>
                        )
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {reportSubTab === 'weekly' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-sm text-slate-800">
                  7-Day Attendance Trend ({selectedDate})
                </h3>
                <span className="text-[11px] text-slate-400">
                  Daily distribution of Present, Late, Leave, and Absent
                  attendance events.
                </span>
              </div>

              {loadingWeekly ? (
                <div className="py-24 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-500 mb-2" />
                  Loading weekly trend metrics...
                </div>
              ) : (
                <div className="h-72 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyReportData?.trend || []}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#F1F5F9"
                      />
                      <XAxis dataKey="dayName" stroke="#94A3B8" fontSize={11} />
                      <YAxis stroke="#94A3B8" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1E293B',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '11px',
                          border: 'none',
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="present"
                        name="Present"
                        fill="#10B981"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="late"
                        name="Late"
                        fill="#F59E0B"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="leave"
                        name="Leave"
                        fill="#6366F1"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="absent"
                        name="Absent"
                        fill="#EF4444"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
          {reportSubTab === 'monthly' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">
                    Monthly School Activity & Working Days (
                    {monthlyReportData?.month || currentMonthStr})
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Working Days Held:{' '}
                    <strong>{monthlyReportData?.workingDaysCount ?? 0}</strong>{' '}
                    • Overall Attendance Rate:{' '}
                    <strong>{monthlyReportData?.overallRate ?? 100}%</strong>
                  </span>
                </div>
              </div>

              {loadingMonthly ? (
                <div className="py-24 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-500 mb-2" />
                  Loading monthly metrics...
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 pt-2">
                  {monthlyReportData?.dailyBreakdown?.map((day: any) => (
                    <div
                      key={day.date}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 transition-colors text-center"
                    >
                      <span className="font-mono text-[10px] text-slate-400 block">
                        {day.date}
                      </span>
                      <span className="text-lg font-bold text-slate-800 block mt-1">
                        {day.rate}%
                      </span>
                      <div className="mt-1 flex items-center justify-center gap-1.5 text-[9px] font-bold">
                        <span className="text-emerald-700">
                          P:{day.present}
                        </span>
                        <span className="text-rose-700">A:{day.absent}</span>
                        <span className="text-amber-700">L:{day.late}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {reportSubTab === 'student' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search student in this class by name or roll number..."
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <select
                  value={selectedReportStudentId || ''}
                  onChange={(e) => setSelectedReportStudentId(e.target.value)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 cursor-pointer min-w-[220px]"
                >
                  <option value="">Select Student to inspect...</option>
                  {roster
                    .filter(
                      (s) =>
                        s.studentName
                          .toLowerCase()
                          .includes(studentSearchQuery.toLowerCase()) ||
                        s.rollNumber.includes(studentSearchQuery)
                    )
                    .map((s) => (
                      <option key={s.studentId} value={s.studentId}>
                        #{s.rollNumber} - {s.studentName}
                      </option>
                    ))}
                </select>
              </div>
              {selectedReportStudentId && studentReportData?.report ? (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-600">
                          Roll #{studentReportData.report.rollNumber}
                        </span>
                        <h3 className="text-lg font-bold text-slate-800">
                          {studentReportData.report.studentName}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Class {studentReportData.report.className} - Section{' '}
                        {studentReportData.report.section} • Working Days:{' '}
                        <strong>
                          {studentReportData.report.totalWorkingDays}
                        </strong>
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-orange-50 border border-orange-200 text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 block">
                        Overall Rate
                      </span>
                      <span className="text-2xl font-black text-brand-600">
                        {studentReportData.report.attendanceRate}%
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-medium">
                        Working Days
                      </span>
                      <span className="text-base font-bold text-slate-800">
                        {studentReportData.report.totalWorkingDays}
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-emerald-200 bg-emerald-50/20">
                      <span className="text-[10px] text-emerald-600 block font-medium">
                        Present
                      </span>
                      <span className="text-base font-bold text-emerald-700">
                        {studentReportData.report.presentDays}
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-amber-200 bg-amber-50/20">
                      <span className="text-[10px] text-amber-600 block font-medium">
                        Late
                      </span>
                      <span className="text-base font-bold text-amber-700">
                        {studentReportData.report.lateDays}
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-indigo-200 bg-indigo-50/20">
                      <span className="text-[10px] text-indigo-600 block font-medium">
                        Leave
                      </span>
                      <span className="text-base font-bold text-indigo-700">
                        {studentReportData.report.leaveDays}
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-rose-200 bg-rose-50/20">
                      <span className="text-[10px] text-rose-600 block font-medium">
                        Absent
                      </span>
                      <span className="text-base font-bold text-rose-700">
                        {studentReportData.report.absentDays}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Day</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Remarks</th>
                            <th className="px-6 py-3">Teacher</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {studentReportData.report.history?.map(
                            (h: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50/60">
                                <td className="px-6 py-3 font-mono font-medium text-slate-700">
                                  {h.date}
                                </td>
                                <td className="px-6 py-3 text-slate-500">
                                  {h.dayName}
                                </td>
                                <td className="px-6 py-3">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                      h.status === 'present'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : h.status === 'late'
                                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                          : h.status === 'leave'
                                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                                    }`}
                                  >
                                    {h.status}
                                  </span>
                                </td>
                                <td className="px-6 py-3 text-slate-600">
                                  {h.remarks || '—'}
                                </td>
                                <td className="px-6 py-3 text-slate-400">
                                  {h.takenByName || 'Faculty'}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : selectedReportStudentId && loadingStudentReport ? (
                <div className="py-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-500 mb-2" />
                  Generating student attendance record...
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}
      {activeTab === 'alerts' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-800">
                Guardian Absence Alerts Dispatch Log
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Automatically enqueued when a student is saved as Absent. Sent
                via configured mock provider abstraction.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
              Provider: Local Dev Mock Active
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">Guardian Recipient</th>
                  <th className="px-4 py-3">Channel</th>
                  <th className="px-4 py-3">Template Message</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingAlertLogs ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-slate-400"
                    >
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-500 mb-2" />
                      Loading alert records...
                    </td>
                  </tr>
                ) : !alertLogsData?.logs?.length ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-slate-400"
                    >
                      No guardian absent notifications dispatched yet. Mark a
                      student as Absent to see alerts logged here.
                    </td>
                  </tr>
                ) : (
                  alertLogsData.logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-mono text-slate-500">
                        {new Date(log.sentAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800">
                        {log.studentName}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {log.classSectionName}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-700">
                          {log.guardianName}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          {log.guardianContact}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                          {log.channel}
                        </span>
                      </td>
                      <td
                        className="px-4 py-3 text-slate-600 max-w-xs truncate"
                        title={log.message}
                      >
                        "{log.message}"
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {log.deliveryStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
