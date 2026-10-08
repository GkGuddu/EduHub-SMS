import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  GraduationCap,
  CalendarCheck,
  CreditCard,
  PlusCircle,
  FileText,
  ShieldCheck,
  ArrowUpRight,
  Clock,
  Search,
  Calendar,
  AlertCircle,
  Award,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  Filter,
  CheckCircle2,
  BookOpen,
  Receipt,
  FileSpreadsheet,
  Loader2,
  MessageSquare,
  FolderDown,
  Bell,
  Download,
  Sparkles,
  Play,
  FileQuestion,
  UserCheck,
  Phone,
  Mail,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import { dashboardApi, academicsApi, quizApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  MetricCard,
  Badge,
  EmptyState,
  AiHomeworkHintModal,
} from '../components/common';
import { PERMISSIONS } from '@eduhub/shared';

interface AdminDashboardProps {
  stats: any;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stats: initialStats,
}) => {
  const navigate = useNavigate();
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: dynamicData, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats', academicYear, searchQuery],
    queryFn: () =>
      dashboardApi.getStats({ academicYear, search: searchQuery || undefined }),
    placeholderData: (prev) => prev,
  });

  const { data: academicYearsData } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => academicsApi.getAcademicYears(),
  });

  const stats = dynamicData?.stats || initialStats;

  const formatCurrency = (val: number) => `₹${(val / 1000).toFixed(1)}k`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Admin Overview
            </h1>
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
              Adiya Campus
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Real-time management dashboard for Adiya School of Excellence.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search dashboard..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400"
            />
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">
              Session:
            </span>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer text-xs"
            >
              {academicYearsData?.academicYears?.length ? (
                academicYearsData.academicYears.map((ay: any) => (
                  <option key={ay._id} value={ay.name}>
                    {ay.name} {ay.isCurrent ? '(Current)' : ''}
                  </option>
                ))
              ) : (
                <>
                  <option value="2025-2026">2025-2026 (Current)</option>
                  <option value="2024-2025">2024-2025</option>
                  <option value="2026-2027">2026-2027</option>
                </>
              )}
            </select>
          </div>
          <button
            onClick={() => navigate('/admin/attendance')}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-xs shadow-sm flex items-center gap-1.5 transition-all"
          >
            <CalendarCheck className="w-3.5 h-3.5 text-brand-500" />
            <span>Attendance</span>
          </button>
          <button
            onClick={() => navigate('/admin/subjects')}
            className="px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Setup Module</span>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 bg-white rounded-2xl border border-slate-200 animate-pulse"
            />
          ))
        ) : (
          <>
            <MetricCard
              title="Total Students"
              value={stats?.totalStudents || 12}
              subtitle="Enrolled in active divisions"
              icon={GraduationCap}
              variant="peach"
              trend={{ value: '+4.2%', isPositive: true }}
            />
            <MetricCard
              title="Teaching Staff"
              value={stats?.totalTeachers || 4}
              subtitle="All faculty members active"
              icon={Users}
              variant="cyan"
            />
            <MetricCard
              title="Attendance Rate"
              value={`${stats?.todayAttendanceRate || 95}%`}
              subtitle={`${stats?.presentToday || 18} Present • ${stats?.lateToday || 1} Late • ${stats?.absentToday || 1} Absent`}
              icon={CalendarCheck}
              variant="green"
              trend={{ value: '+1.5%', isPositive: true }}
            />
            <MetricCard
              title="Fee Collection"
              value={formatCurrency(stats?.feesCollected || 39500)}
              subtitle={`Pending: ${formatCurrency(stats?.feesPending || 35500)} (${stats?.collectionRate || 52}%)`}
              icon={CreditCard}
              variant="blue"
            />
          </>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-800 tracking-tight">
                Weekly Attendance Overview
              </h3>
              <p className="text-xs text-slate-500">
                Day-by-day attendance trends across school
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              Avg: {stats?.todayAttendanceRate || 95}%
            </span>
          </div>

          <div className="h-64 w-full">
            {isLoading ? (
              <div className="h-full flex items-center justify-center bg-slate-50/50 rounded-xl animate-pulse">
                <span className="text-xs text-slate-400">
                  Loading weekly metrics...
                </span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.weeklyAttendance || []}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#F1F5F9"
                  />
                  <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} />
                  <YAxis stroke="#94A3B8" fontSize={11} domain={[0, 25]} />
                  <Tooltip
                    formatter={(value: any, name: string) => [
                      `${value} students`,
                      name === 'present'
                        ? 'Present'
                        : name === 'late'
                          ? 'Late'
                          : 'Absent',
                    ]}
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                  <Bar
                    dataKey="present"
                    name="present"
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="late"
                    name="late"
                    fill="#F59E0B"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="absent"
                    name="absent"
                    fill="#EF4444"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-center gap-6 text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Present
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Late
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Absent
            </span>
          </div>
        </div>
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-800 tracking-tight">
                Monthly Fee Collection vs Billed
              </h3>
              <p className="text-xs text-slate-500">
                Academic session financial progress in INR
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              Session {academicYear}
            </span>
          </div>

          <div className="h-64 w-full">
            {isLoading ? (
              <div className="h-full flex items-center justify-center bg-slate-50/50 rounded-xl animate-pulse">
                <span className="text-xs text-slate-400">
                  Loading billing trends...
                </span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.feeCollectionByMonth || []}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#F1F5F9"
                  />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    tickFormatter={(v) => `₹${v / 1000}k`}
                  />
                  <Tooltip
                    formatter={(value: any) => [
                      `₹${Number(value).toLocaleString()}`,
                      '',
                    ]}
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                  <Bar
                    dataKey="billed"
                    name="Billed"
                    fill="#CBD5E1"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="collected"
                    name="Collected"
                    fill="#f97316"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-center gap-6 text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-300" /> Billed
              Tuition
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-brand-500" /> Collected
              Funds
            </span>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="font-bold text-sm text-slate-800 tracking-tight flex items-center gap-2">
              <Award className="w-4 h-4 text-brand-500" />
              Class Academic Performance Overview
            </h3>
            <p className="text-xs text-slate-500">
              Aggregated grade record scores and pass metrics by class section
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/exams')}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            Manage Examinations <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(stats?.classPerformance || []).length === 0 ? (
            <div className="col-span-4 py-8 text-center text-slate-400 text-xs">
              No class score evaluations found.
            </div>
          ) : (
            stats.classPerformance.map((cp: any) => (
              <div
                key={cp.classSectionId}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-all hover:border-slate-300"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800 text-sm">
                    {cp.className} - {cp.section}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      cp.averageScore >= 80
                        ? 'bg-emerald-100 text-emerald-800'
                        : cp.averageScore >= 60
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {cp.averageScore}% Avg
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2.5">
                  <div
                    className={`h-full rounded-full ${
                      cp.averageScore >= 80
                        ? 'bg-emerald-500'
                        : cp.averageScore >= 60
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(cp.averageScore, 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>
                    Enrolled: <strong>{cp.studentCount}</strong>
                  </span>
                  <span>
                    Range: {cp.lowestScore}% - {cp.highestScore}%
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-800 tracking-tight flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-500" />
              School Calendar
            </h3>
            <button
              onClick={() => navigate('/admin/subjects')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              Setup
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-96 pr-1">
            {(stats?.calendarEvents || []).length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No upcoming calendar events
              </div>
            ) : (
              stats.calendarEvents.map((ev: any) => (
                <div
                  key={ev._id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-start gap-3"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 text-center font-bold ${
                      ev.isHoliday
                        ? 'bg-rose-50 text-rose-600 border border-rose-200'
                        : ev.eventType === 'meeting'
                          ? 'bg-purple-50 text-purple-600 border border-purple-200'
                          : 'bg-brand-50 text-brand-600 border border-brand-200'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold leading-none">
                      {new Date(ev.startDate).toLocaleDateString('en-US', {
                        month: 'short',
                      })}
                    </span>
                    <span className="text-xs font-black leading-none mt-0.5">
                      {new Date(ev.startDate).getDate()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {ev.title}
                      </span>
                      <span
                        className={`text-[9px] uppercase font-semibold px-1.5 py-0.5 rounded ${
                          ev.isHoliday
                            ? 'bg-rose-100 text-rose-700'
                            : ev.eventType === 'meeting'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {ev.eventType}
                      </span>
                    </div>
                    {ev.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {ev.description}
                      </p>
                    )}
                    <div className="mt-1.5 text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Audience: {ev.targetAudience}</span>
                      <span>
                        {ev.startDate === ev.endDate
                          ? ev.startDate
                          : `${ev.startDate} to ${ev.endDate}`}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-800 tracking-tight flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-500" />
                Pending Tuition Dues
              </h3>
              <p className="text-xs text-slate-500">
                Unsettled student invoices
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/fees')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              Fee Module
            </button>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-96 pr-1">
            {(stats?.pendingFees || []).length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No pending fee balances
              </div>
            ) : (
              stats.pendingFees.map((fee: any) => (
                <div
                  key={fee.invoiceId}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">
                        {fee.studentName}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                        {fee.className}-{fee.section}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span>Inv #{fee.invoiceNumber}</span>
                      <span>• Due: {fee.dueDate}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="block text-xs font-bold text-rose-600">
                      ₹{Number(fee.balance).toLocaleString()}
                    </span>
                    <span className="inline-block text-[9px] uppercase font-semibold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">
                      {fee.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-800 tracking-tight flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-500" />
                Upcoming Examinations
              </h3>
              <button
                onClick={() => navigate('/admin/exams')}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                View
              </button>
            </div>

            <div className="space-y-2.5">
              {(stats?.upcomingExams || []).length === 0 ? (
                <div className="py-4 text-center text-slate-400 text-xs">
                  No upcoming exams scheduled
                </div>
              ) : (
                stats.upcomingExams.map((ex: any) => (
                  <div
                    key={ex.examId}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-800 block truncate">
                        {ex.name}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {ex.startDate} • Session {ex.academicYear}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                        ex.status === 'published'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {ex.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-800 tracking-tight flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                Recent Activities
              </h3>
              <button
                onClick={() => navigate('/admin/audit-logs')}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                Audit Trail
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {(stats?.recentActivities || stats?.recentAuditLogs || [])
                .slice(0, 4)
                .map((log: any) => (
                  <div
                    key={log._id}
                    className="py-2.5 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800 truncate">
                          {log.userName}
                        </span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-600 uppercase font-mono">
                          {log.action}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {log.details}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(
                        log.createdAt || log.timestamp
                      ).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface TeacherDashboardProps {
  stats: any;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  stats,
}) => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canViewAttendance = hasPermission(PERMISSIONS.ATTENDANCE_VIEW);
  const canMarkAttendance = hasPermission(PERMISSIONS.ATTENDANCE_MARK);
  const canViewHomework = hasPermission(PERMISSIONS.HOMEWORK_VIEW);
  const canGradeHomework = hasPermission(PERMISSIONS.HOMEWORK_GRADE);
  const canViewExams =
    hasPermission(PERMISSIONS.EXAMS_VIEW) ||
    hasPermission(PERMISSIONS.MARKS_VIEW) ||
    hasPermission(PERMISSIONS.RESULTS_VIEW);
  const canViewCommunication =
    hasPermission(PERMISSIONS.COMMUNICATION_VIEW) ||
    hasPermission(PERMISSIONS.COMMUNICATION_CHAT);
  const canViewNotices = hasPermission(PERMISSIONS.NOTICES_VIEW);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Faculty Dashboard
            </h1>
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
              Teacher Portal
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Welcome back! Review your assigned classes, subject schedules, and
            pending student tasks.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {canMarkAttendance && (
            <button
              onClick={() => navigate('/teacher/attendance')}
              className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Mark Today's Attendance</span>
            </button>
          )}
          {canViewCommunication && (
            <button
              onClick={() => navigate('/teacher/communication')}
              className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium text-xs border border-slate-200 shadow-sm flex items-center gap-1.5 transition-all"
            >
              <MessageSquare className="w-4 h-4 text-brand-500" />
              <span>Messages</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Assigned Classes"
          value={stats?.assignedClassesCount || 0}
          subtitle={`${stats?.assignedSubjectsCount || 0} subjects handled`}
          icon={BookOpen}
          variant="peach"
        />
        <MetricCard
          title="Students Taught"
          value={stats?.totalStudentsTaught || 0}
          subtitle="Enrolled in assigned rosters"
          icon={Users}
          variant="cyan"
        />
        <MetricCard
          title="Attendance Rate"
          value={`${stats?.attendanceOverview?.rate || 95}%`}
          subtitle={`${stats?.attendanceOverview?.present || 0} Present • ${stats?.attendanceOverview?.absent || 0} Absent`}
          icon={CalendarCheck}
          variant="green"
        />
        <MetricCard
          title="Pending Homework"
          value={stats?.pendingHomeworkCount || 0}
          subtitle={
            (stats?.pendingHomeworkCount || 0) > 0
              ? 'Submissions awaiting review'
              : 'All submissions reviewed'
          }
          icon={FileText}
          variant={(stats?.pendingHomeworkCount || 0) > 0 ? 'peach' : 'blue'}
        />
      </div>

      {canViewAttendance && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-800 tracking-tight">
                My Teaching Schedule & Daily Attendance
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Class sections assigned to your teacher profile for today's
                session.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
              Today:{' '}
              {new Date().toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Class & Section</th>
                  <th className="px-6 py-3.5">Subject</th>
                  <th className="px-6 py-3.5">Location</th>
                  <th className="px-6 py-3.5">Attendance Status</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(stats?.todayClasses || []).length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-6 text-center text-slate-400 text-xs"
                    >
                      No teaching classes assigned for today.
                    </td>
                  </tr>
                ) : (
                  (stats?.todayClasses || []).map((item: any, idx: number) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {item.className} - Section {item.section}
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {item.subjectName}
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {item.room || 'Room 101'}
                      </td>
                      <td className="px-6 py-4">
                        {item.attendanceTaken ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Marked for Today
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3.5 h-3.5" />
                            Pending Attendance
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {canMarkAttendance ? (
                          <button
                            onClick={() => navigate('/teacher/attendance')}
                            className="px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 font-medium text-xs border border-brand-200 transition-colors"
                          >
                            {item.attendanceTaken
                              ? 'View Roster'
                              : 'Mark Roster'}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">
                            View Only
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {canViewExams && (stats?.classPerformance || []).length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-800 tracking-tight">
                Assigned Class Performance
              </h3>
              <p className="text-xs text-slate-500">
                Official average scores across your assigned classes
              </p>
            </div>
            <button
              onClick={() => navigate('/teacher/exams')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              Gradebook <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(stats?.classPerformance || []).map((cls: any) => (
              <div
                key={cls.classSectionId}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-sm text-slate-800">
                    {cls.className} - {cls.section}
                  </h4>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                    Avg: {cls.averageScore}%
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">
                      Students
                    </span>
                    <span className="font-semibold text-slate-700">
                      {cls.studentCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">
                      Highest
                    </span>
                    <span className="font-semibold text-emerald-600">
                      {cls.highestScore}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">
                      Lowest
                    </span>
                    <span className="font-semibold text-rose-600">
                      {cls.lowestScore}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {canViewHomework && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-800 tracking-tight">
                  Pending Homework Submissions
                </h3>
                <p className="text-xs text-slate-500">
                  Student submissions awaiting faculty evaluation
                </p>
              </div>
              <button
                onClick={() => navigate('/teacher/homework')}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                All Homework <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {(stats?.pendingHomeworkList || []).length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No submissions pending grading. Great job!
                </div>
              ) : (
                stats.pendingHomeworkList.map((hw: any) => (
                  <div
                    key={hw.homeworkId}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="font-semibold text-xs text-slate-800">
                        {hw.title}
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        {hw.className} - {hw.section} • Due: {hw.dueDate}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        {hw.submittedCount} Submitted
                      </span>
                      {canGradeHomework && (
                        <button
                          onClick={() => navigate('/teacher/homework')}
                          className="px-2.5 py-1 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs transition-colors"
                        >
                          Grade
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {canViewExams && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-800 tracking-tight">
                  Upcoming Exams
                </h3>
                <p className="text-xs text-slate-500">
                  Tests & assessments scheduled for your classes
                </p>
              </div>
              <button
                onClick={() => navigate('/teacher/exams')}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                Exam Schedule <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {(stats?.upcomingExams || []).length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No upcoming exams currently scheduled.
                </div>
              ) : (
                stats.upcomingExams.map((ex: any) => (
                  <div
                    key={ex.examId}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-semibold text-xs text-slate-800">
                        {ex.name}
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        Session {ex.academicYear} • Starts: {ex.startDate}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                        ex.status === 'published'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {ex.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {canViewCommunication && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-800 tracking-tight">
                  Faculty Communication
                </h3>
                {(stats?.communicationSummary?.unreadConversations || 0) >
                  0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                    {stats.communicationSummary.unreadConversations} Unread
                  </span>
                )}
              </div>
              <button
                onClick={() => navigate('/teacher/communication')}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                Open Messenger
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {(stats?.communicationSummary?.recentConversations || [])
                .length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  No active conversations found.
                </p>
              ) : (
                stats.communicationSummary.recentConversations.map(
                  (conv: any) => (
                    <div
                      key={conv.conversationId || conv.id}
                      onClick={() => navigate('/teacher/communication')}
                      className="py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 px-2 rounded-lg transition-colors"
                    >
                      <div className="min-w-0 pr-3">
                        <h4 className="font-semibold text-xs text-slate-800 truncate">
                          {conv.title}
                        </h4>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {conv.lastMessage ||
                            conv.lastMessageText ||
                            'No message preview'}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(conv.updatedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )
                )
              )}
            </div>
          </div>
        )}

        {canViewNotices && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-800 tracking-tight">
                Staff & Faculty Notices
              </h3>
              <button
                onClick={() => navigate('/teacher/notices')}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                All Notices
              </button>
            </div>

            <div className="space-y-3">
              {(stats?.recentNotices || []).length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  No notices published for staff.
                </p>
              ) : (
                stats.recentNotices.map((notice: any) => (
                  <div
                    key={notice._id}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-xs text-slate-800 line-clamp-1">
                        {notice.title}
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        {new Date(notice.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {notice.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface StudentDashboardProps {
  stats: any;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  stats,
}) => {
  const navigate = useNavigate();
  const [selectedHintHomework, setSelectedHintHomework] = useState<any | null>(
    null
  );

  const { data: quizzesData } = useQuery({
    queryKey: ['student-upcoming-quizzes'],
    queryFn: () => quizApi.getQuizzes({ status: 'published' }),
  });

  const upcomingQuizzes = (quizzesData?.quizzes || []).filter(
    (q: any) => !q.studentAttempt?.isCompleted
  );

  const [selectedTimetableDay, setSelectedTimetableDay] = useState<string>(
    () => {
      const today = new Date().toLocaleDateString(undefined, {
        weekday: 'long',
      });
      return [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ].includes(today)
        ? today
        : 'Monday';
    }
  );
  const [isWeeklyView, setIsWeeklyView] = useState(false);
  const todayDayName = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
  });
  const weeklyTimetable: any[] = stats?.weeklyTimetable || [];
  const currentDaySlots =
    weeklyTimetable.length > 0
      ? weeklyTimetable.filter(
          (s: any) =>
            s.dayOfWeek.toLowerCase() === selectedTimetableDay.toLowerCase()
        )
      : selectedTimetableDay.toLowerCase() === todayDayName.toLowerCase()
        ? stats?.todayTimetable || []
        : [];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-brand-600 to-brand-500 rounded-3xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 uppercase tracking-wider">
            Student Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">
            {stats?.studentName || 'Student'}
          </h1>
          <p className="text-xs sm:text-sm text-brand-100 mt-1">
            {stats?.className} - Section {stats?.section} • Admission No:{' '}
            {stats?.admissionNumber || 'ADM-2024-001'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/student/quizzes')}
            className="px-4 py-2.5 rounded-xl bg-white text-brand-600 font-semibold text-xs shadow-sm hover:bg-orange-50 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileQuestion className="w-4 h-4" />
            Subject Quizzes
          </button>
          <button
            onClick={() => navigate('/student/report-card')}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Award className="w-4 h-4" />
            My Report Card
          </button>
          <button
            onClick={() => navigate('/student/materials')}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FolderDown className="w-4 h-4" />
            Study Materials
          </button>
        </div>
      </div>

      {/* Assigned Class Teacher Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-brand-600 shrink-0 shadow-xs">
            <UserCheck className="w-5 h-5 text-brand-500" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Assigned Class Teacher
            </span>
            {stats?.classTeacher ? (
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                <span className="font-bold text-slate-800 text-sm">
                  {stats.classTeacher.name}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-600 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" />
                  {stats.classTeacher.email}
                </span>
                {stats.classTeacher.phone && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-600 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {stats.classTeacher.phone}
                    </span>
                  </>
                )}
                {stats.classTeacher.qualification && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                    {stats.classTeacher.qualification}
                  </span>
                )}
                {stats.classTeacher.specialization && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium border border-slate-200">
                    {stats.classTeacher.specialization}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs text-slate-500 italic mt-0.5 block">
                Class teacher not assigned
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Attendance Rate"
          value={`${stats?.attendanceRate || 96}%`}
          subtitle={`${stats?.attendanceBreakdown?.present || 0} Present • ${stats?.attendanceBreakdown?.late || 0} Late • ${stats?.attendanceBreakdown?.absent || 0} Absent`}
          icon={CalendarCheck}
          variant="green"
        />
        <MetricCard
          title="Average Score"
          value={`${stats?.averageScore || 88}%`}
          subtitle="Official verified exam marks"
          icon={Award}
          variant="peach"
        />
        <MetricCard
          title="Fee Status"
          value={
            stats?.feeStatus?.balance === 0
              ? 'Fully Paid'
              : `₹${(stats?.feeStatus?.balance || 0).toLocaleString()}`
          }
          subtitle={
            stats?.feeStatus?.balance === 0
              ? 'No outstanding balance'
              : `Due: ${stats?.feeStatus?.dueDate || 'Pending'}`
          }
          icon={CreditCard}
          variant={stats?.feeStatus?.balance === 0 ? 'cyan' : 'peach'}
        />
        <MetricCard
          title="Upcoming Quizzes"
          value={`${upcomingQuizzes.length} Available`}
          subtitle="10-Question Evaluations"
          icon={FileQuestion}
          variant="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-800 tracking-tight">
                  Class Timetable
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                  {stats?.className || 'Class'}-{stats?.section || ''}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Periods, subjects, and classroom locations
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsWeeklyView(!isWeeklyView)}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
              >
                {isWeeklyView ? 'Daily View' : 'Full Week'}
              </button>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                Today: {todayDayName}
              </span>
            </div>
          </div>

          {!isWeeklyView && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3">
              {[
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday',
              ].map((day) => {
                const isSelected =
                  selectedTimetableDay.toLowerCase() === day.toLowerCase();
                const isToday =
                  todayDayName.toLowerCase() === day.toLowerCase();
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedTimetableDay(day)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-brand-500 text-white border-brand-500 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{day.slice(0, 3)}</span>
                    {isToday && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-white' : 'bg-emerald-500'
                        }`}
                        title="Today"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {isWeeklyView ? (
            <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
              {[
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday',
              ].map((day) => {
                const daySlots = weeklyTimetable.filter(
                  (s: any) => s.dayOfWeek.toLowerCase() === day.toLowerCase()
                );
                if (daySlots.length === 0) return null;
                return (
                  <div
                    key={day}
                    className="border border-slate-100 rounded-xl p-3 bg-slate-50/50"
                  >
                    <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-brand-500" />
                      <span>{day}</span>
                      {todayDayName.toLowerCase() === day.toLowerCase() && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                          Today
                        </span>
                      )}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {daySlots.map((slot: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg border border-slate-200/80 bg-white flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-brand-600 mr-1.5">
                              P{slot.periodNumber}
                            </span>
                            <span className="font-semibold text-slate-800">
                              {slot.subjectName}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {slot.teacherName}{' '}
                              {slot.roomNumber ? `• ${slot.roomNumber}` : ''}
                            </span>
                          </div>
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            {slot.startTime} - {slot.endTime}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2.5">
              {currentDaySlots.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No classes scheduled for {selectedTimetableDay}. Click another
                  day tab above to view your routine.
                </div>
              ) : (
                currentDaySlots.map((slot: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 font-bold text-xs flex items-center justify-center border border-brand-200">
                        P{slot.periodNumber}
                      </span>
                      <div>
                        <h4 className="font-semibold text-xs text-slate-800">
                          {slot.subjectName}
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          {slot.teacherName}{' '}
                          {slot.roomNumber ? `• ${slot.roomNumber}` : ''}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                      {slot.startTime} - {slot.endTime}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-800 tracking-tight">
                  Upcoming Quizzes
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                  {upcomingQuizzes.length} Pending
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Subject mastery quizzes with instant grading
              </p>
            </div>
            <button
              onClick={() => navigate('/student/quizzes')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 cursor-pointer"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {upcomingQuizzes.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No upcoming quizzes pending. You're all caught up!
              </div>
            ) : (
              upcomingQuizzes.slice(0, 3).map((quiz: any) => (
                <div
                  key={quiz._id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3 hover:bg-slate-50 transition-all"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-xs text-slate-800 truncate">
                        {quiz.title}
                      </h4>
                      <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-white text-brand-700 border border-brand-200 shrink-0">
                        {quiz.subjectName}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {quiz.questions?.length || 10} Qs • {quiz.duration} mins •
                      Due{' '}
                      {quiz.dueDate
                        ? new Date(quiz.dueDate).toLocaleDateString()
                        : 'Soon'}
                    </span>
                  </div>

                  <button
                    onClick={() => navigate('/student/quizzes')}
                    className="px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1 transition-all shrink-0 cursor-pointer"
                  >
                    <Play className="w-3 h-3" />
                    Attempt
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-800 tracking-tight">
                Homework & Assignments
              </h3>
              <p className="text-xs text-slate-500">
                Deadlines and your submission status
              </p>
            </div>
            <button
              onClick={() => navigate('/student/homework')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {(stats?.homeworkList || []).length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No active homework assignments found.
              </div>
            ) : (
              stats.homeworkList.map((hw: any) => (
                <div
                  key={hw.homeworkId}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <h4 className="font-semibold text-xs text-slate-800 truncate">
                      {hw.title}
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      {hw.subjectName} • Due: {hw.dueDate}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedHintHomework({
                          _id: hw.homeworkId,
                          title: hw.title,
                          description: hw.description,
                          subjectName: hw.subjectName,
                          dueDate: hw.dueDate,
                        })
                      }
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold text-[11px] flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-600" />
                      AI Hint
                    </button>
                    {hw.status === 'graded' ? (
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Graded: {hw.marksObtained}/{hw.maxMarks}
                      </span>
                    ) : hw.status === 'submitted' ? (
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        Submitted
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-800 tracking-tight">
                Recent Published Results
              </h3>
              <p className="text-xs text-slate-500">
                Official verified assessment marks
              </p>
            </div>
            <button
              onClick={() => navigate('/student/report-card')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              Full Report <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {(stats?.recentGrades || []).length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No examination results have been published yet.
              </div>
            ) : (
              stats.recentGrades.map((grade: any, idx: number) => (
                <div
                  key={idx}
                  className="py-3 flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-semibold text-xs text-slate-800">
                      {grade.subjectName}
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      {grade.examName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-700">
                      {grade.marksObtained} / {grade.maxMarks} (
                      {grade.percentage}%)
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200">
                      {grade.grade}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-800 tracking-tight">
                Study Materials
              </h3>
              <p className="text-xs text-slate-500">
                Learning notes and lesson guides
              </p>
            </div>
            <button
              onClick={() => navigate('/student/materials')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              All Files
            </button>
          </div>

          <div className="space-y-3">
            {(stats?.studyMaterials || []).length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No study materials uploaded for your class yet.
              </div>
            ) : (
              stats.studyMaterials.map((sm: any) => (
                <div
                  key={sm.materialId || sm.id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-xs">
                      <FolderDown className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-slate-800">
                        {sm.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 capitalize">
                        {sm.subjectName} • {sm.fileType}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/student/materials')}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <AiHomeworkHintModal
        isOpen={!!selectedHintHomework}
        onClose={() => setSelectedHintHomework(null)}
        homework={selectedHintHomework}
      />
    </div>
  );
};

interface ParentDashboardProps {
  stats: any;
  selectedChildId: string | null;
  onSelectChild: (studentId: string) => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  stats,
  selectedChildId,
  onSelectChild,
}) => {
  const navigate = useNavigate();
  const children = stats?.children || [];
  const selectedSummary = stats?.selectedChildSummary;

  const [parentTimetableDay, setParentTimetableDay] = useState<string>(() => {
    const today = new Date().toLocaleDateString(undefined, { weekday: 'long' });
    return [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ].includes(today)
      ? today
      : 'Monday';
  });
  const [isParentWeeklyView, setIsParentWeeklyView] = useState(false);

  const calendarRecords: Array<{
    date: string;
    status: 'present' | 'late' | 'absent';
  }> = selectedSummary?.attendanceCalendar || [];
  const presentCount = calendarRecords.filter(
    (r) => r.status === 'present'
  ).length;
  const lateCount = calendarRecords.filter((r) => r.status === 'late').length;
  const absentCount = calendarRecords.filter(
    (r) => r.status === 'absent'
  ).length;

  const parentWeeklyTimetable: any[] = selectedSummary?.weeklyTimetable || [];
  const parentTodayDayName = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
  });
  const activeParentDaySlots =
    parentWeeklyTimetable.length > 0
      ? parentWeeklyTimetable.filter(
          (s: any) =>
            s.dayOfWeek?.toLowerCase() === parentTimetableDay.toLowerCase()
        )
      : selectedSummary?.todayTimetable || [];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
              Parent Portal
            </span>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight mt-2">
              Welcome, {stats?.parentName || 'Parent'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Monitoring academic performance, attendance records, and fee
              payments for your children.
            </p>
          </div>
          <button
            onClick={() => navigate('/parent/communication')}
            className="self-start md:self-auto px-4 py-2.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 font-semibold text-xs flex items-center gap-2 transition-all shadow-xs hover:shadow-sm"
          >
            <MessageSquare className="w-4 h-4 text-brand-600" />
            <span>Teacher & School Chat</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-brand-500" />
          </button>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <label className="text-xs font-bold text-slate-600 mb-2 block uppercase tracking-wider">
            Select Linked Child:
          </label>
          <div className="flex flex-wrap gap-2.5">
            {children.map((child: any) => {
              const isSelected =
                (selectedChildId || children[0]?.studentId) === child.studentId;
              return (
                <button
                  key={child.studentId}
                  onClick={() => onSelectChild(child.studentId)}
                  className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                    isSelected
                      ? 'bg-brand-500 text-white border-brand-500 shadow-sm shadow-brand-500/20'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-brand-50 text-brand-700'
                    }`}
                  >
                    {child.name.charAt(0)}
                  </div>
                  <span>{child.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {child.className}-{child.section}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-3 bg-brand-50/70 border border-brand-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-brand-900">
          <div className="flex flex-wrap items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Active Child Context:</span>
            <span className="font-bold">
              {selectedSummary?.name} ({selectedSummary?.className}-
              {selectedSummary?.section})
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600">
              {selectedSummary?.classTeacher ? (
                <>
                  Class Teacher: <strong className="text-slate-800">{selectedSummary.classTeacher.name}</strong>
                  {selectedSummary.classTeacher.qualification && (
                    <span className="ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white border border-brand-200 text-brand-700">
                      {selectedSummary.classTeacher.qualification}
                    </span>
                  )}
                </>
              ) : (
                <em className="text-slate-500">Class teacher not assigned</em>
              )}
            </span>
          </div>
          <span className="text-[11px] text-brand-700 font-medium">
            Attendance: {selectedSummary?.attendance?.rate || 0}% • Avg Score:{' '}
            {selectedSummary?.averageScore || 0}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Attendance Rate"
          value={`${selectedSummary?.attendance?.rate || 95}%`}
          subtitle={`${selectedSummary?.attendance?.present || 0} Present • ${selectedSummary?.attendance?.late || 0} Late • ${selectedSummary?.attendance?.absent || 0} Absent`}
          icon={CalendarCheck}
          variant="green"
        />
        <MetricCard
          title="Average Score"
          value={`${selectedSummary?.averageScore || 90}%`}
          subtitle="Term published assessments"
          icon={Award}
          variant="peach"
        />
        <MetricCard
          title="Outstanding Fees"
          value={
            selectedSummary?.feeInvoice?.balance === 0
              ? '₹0'
              : `₹${(selectedSummary?.feeInvoice?.balance || 0).toLocaleString()}`
          }
          subtitle={`Due: ${selectedSummary?.feeInvoice?.dueDate || 'N/A'}`}
          icon={CreditCard}
          variant={
            selectedSummary?.feeInvoice?.balance === 0 ? 'cyan' : 'peach'
          }
        />
        <MetricCard
          title="Linked Children"
          value={`${children.length} Enrolled`}
          subtitle="Verified family students"
          icon={Users}
          variant="blue"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-slate-800 tracking-tight flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-500" />
              Attendance Calendar ({selectedSummary?.name})
            </h3>
            <p className="text-xs text-slate-500">
              Daily record: Green for Present, Yellow for Late, Red for Absent
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />{' '}
              Present ({presentCount})
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Late (
              {lateCount})
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Absent (
              {absentCount})
            </span>
          </div>
        </div>

        {calendarRecords.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No attendance entries logged for {selectedSummary?.name} in this
            session.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
            {calendarRecords.map((item, idx) => {
              const isPresent = item.status === 'present';
              const isLate = item.status === 'late';
              const isAbsent = item.status === 'absent';

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    isPresent
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                      : isLate
                        ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                        : 'bg-rose-50/60 border-rose-200 text-rose-900'
                  }`}
                >
                  <span className="text-[10px] font-semibold text-slate-500 block">
                    {new Date(item.date).toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <div className="mt-2 flex items-center justify-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isPresent
                          ? 'bg-emerald-500 text-white'
                          : isLate
                            ? 'bg-amber-400 text-slate-900'
                            : 'bg-rose-500 text-white'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-800 tracking-tight">
                {selectedSummary?.name}'s Published Exam Grades
              </h3>
              <p className="text-xs text-slate-500">
                Official verified assessment scores
              </p>
            </div>
            <button
              onClick={() => navigate('/parent/results')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              Report Card
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {(selectedSummary?.recentGrades || []).length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No exam results published yet for this student.
              </p>
            ) : (
              selectedSummary.recentGrades.map((grade: any, idx: number) => (
                <div
                  key={idx}
                  className="py-3 flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-semibold text-xs text-slate-800">
                      {grade.subjectName}
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Max Marks: {grade.maxMarks}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-700">
                      {grade.marksObtained} / {grade.maxMarks}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200">
                      {grade.grade}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-800 tracking-tight">
                Fee Statement ({selectedSummary?.name})
              </h3>
              <p className="text-xs text-slate-500">
                Invoice details and payments
              </p>
            </div>
            <button
              onClick={() => navigate('/parent/fees')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              All Invoices
            </button>
          </div>

          {selectedSummary?.feeInvoice ? (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-slate-500">
                    {selectedSummary.feeInvoice.invoiceNumber}
                  </span>
                  <h4 className="font-bold text-sm text-slate-800">
                    {selectedSummary.feeInvoice.title}
                  </h4>
                </div>
                <Badge
                  status={selectedSummary.feeInvoice.status}
                  variant="fee"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Total Fee
                  </span>
                  <span className="font-bold text-slate-700">
                    ₹{selectedSummary.feeInvoice.totalAmount.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Paid</span>
                  <span className="font-bold text-emerald-600">
                    ₹{selectedSummary.feeInvoice.paidAmount.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Due Balance
                  </span>
                  <span className="font-bold text-rose-600">
                    ₹{selectedSummary.feeInvoice.balance.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Due by: {selectedSummary.feeInvoice.dueDate}
                </span>
                <button
                  onClick={() => navigate('/parent/fees')}
                  className="px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs shadow-sm transition-all"
                >
                  Inspect Invoices
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">
              No fee invoice records found.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-800 tracking-tight">
                  Class Timetable
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                  {selectedSummary?.className || 'Class'}-
                  {selectedSummary?.section || ''}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {selectedSummary?.name}'s daily class schedule & routine
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsParentWeeklyView(!isParentWeeklyView)}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
              >
                {isParentWeeklyView ? 'Daily View' : 'Full Week'}
              </button>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                Today: {parentTodayDayName}
              </span>
            </div>
          </div>

          {!isParentWeeklyView && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3">
              {[
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday',
              ].map((day) => {
                const isSelected =
                  parentTimetableDay.toLowerCase() === day.toLowerCase();
                const isToday =
                  parentTodayDayName.toLowerCase() === day.toLowerCase();
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setParentTimetableDay(day)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-brand-500 text-white border-brand-500 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{day.slice(0, 3)}</span>
                    {isToday && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-white' : 'bg-emerald-500'
                        }`}
                        title="Today"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {isParentWeeklyView ? (
            <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
              {[
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday',
              ].map((day) => {
                const daySlots = parentWeeklyTimetable.filter(
                  (s: any) => s.dayOfWeek?.toLowerCase() === day.toLowerCase()
                );
                if (daySlots.length === 0) return null;
                return (
                  <div
                    key={day}
                    className="border border-slate-100 rounded-xl p-3 bg-slate-50/50"
                  >
                    <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-brand-500" />
                      <span>{day}</span>
                      {parentTodayDayName.toLowerCase() ===
                        day.toLowerCase() && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                          Today
                        </span>
                      )}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {daySlots.map((slot: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg border border-slate-200/80 bg-white flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-brand-600 mr-1.5">
                              P{slot.periodNumber}
                            </span>
                            <span className="font-semibold text-slate-800">
                              {slot.subjectName}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {slot.teacherName}{' '}
                              {slot.roomNumber ? `• ${slot.roomNumber}` : ''}
                            </span>
                          </div>
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            {slot.startTime} - {slot.endTime}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2.5">
              {activeParentDaySlots.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No classes scheduled for {parentTimetableDay}. Click another
                  day tab above to view the routine.
                </div>
              ) : (
                activeParentDaySlots.map((slot: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 font-bold text-xs flex items-center justify-center border border-brand-200">
                        P{slot.periodNumber}
                      </span>
                      <div>
                        <h4 className="font-semibold text-xs text-slate-800">
                          {slot.subjectName}
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          {slot.teacherName}{' '}
                          {slot.roomNumber ? `• ${slot.roomNumber}` : ''}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                      {slot.startTime} - {slot.endTime}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-800 tracking-tight">
                Homework Tracking
              </h3>
              <p className="text-xs text-slate-500">
                Submission progress for child's class
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {(selectedSummary?.homework || []).length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No homework assigned for this week.
              </p>
            ) : (
              selectedSummary.homework.map((hw: any) => (
                <div
                  key={hw.homeworkId}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-semibold text-xs text-slate-800">
                      {hw.title}
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      {hw.subjectName} • Due: {hw.dueDate}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-semibold capitalize ${
                      hw.status === 'submitted' || hw.status === 'graded'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {hw.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 border border-brand-100">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-800 tracking-tight">
                  Teacher & School Communication
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Directly message{' '}
                {selectedSummary?.name
                  ? `${selectedSummary.name}'s class teachers`
                  : 'faculty'}{' '}
                and school administration regarding academic progress, homework,
                attendance, or school queries.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/parent/communication')}
            className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-sm shadow-brand-500/20 flex items-center justify-center gap-2 transition-all shrink-0 hover:shadow-md"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Open Messages</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats', 'admin'],
    queryFn: () => dashboardApi.getStats(),
    enabled: !!user,
  });

  if (user && user.role !== 'admin') {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  if (isLoading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        <span className="text-xs font-medium">
          Loading administrative dashboard...
        </span>
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="p-8 text-center text-rose-600 bg-rose-50 rounded-2xl border border-rose-200">
        <h3 className="font-bold text-sm">Failed to load admin dashboard</h3>
        <p className="text-xs mt-1 text-rose-500">
          Please check network or backend status.
        </p>
      </div>
    );
  }

  return <AdminDashboard stats={data.stats} />;
};

export const TeacherDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats', 'teacher'],
    queryFn: () => dashboardApi.getStats(),
    enabled: !!user,
  });

  if (user && user.role !== 'teacher') {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  if (isLoading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        <span className="text-xs font-medium">
          Loading teacher workspace...
        </span>
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="p-8 text-center text-rose-600 bg-rose-50 rounded-2xl border border-rose-200">
        <h3 className="font-bold text-sm">Failed to load teacher dashboard</h3>
        <p className="text-xs mt-1 text-rose-500">
          Please check network or backend status.
        </p>
      </div>
    );
  }

  return <TeacherDashboard stats={data.stats} />;
};

export const StudentDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats', 'student'],
    queryFn: () => dashboardApi.getStats(),
    enabled: !!user,
  });

  if (user && user.role !== 'student') {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  if (isLoading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        <span className="text-xs font-medium">Loading student portal...</span>
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="p-8 text-center text-rose-600 bg-rose-50 rounded-2xl border border-rose-200">
        <h3 className="font-bold text-sm">Failed to load student dashboard</h3>
        <p className="text-xs mt-1 text-rose-500">
          Please check network or backend status.
        </p>
      </div>
    );
  }

  return <StudentDashboard stats={data.stats} />;
};

export const ParentDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats', 'parent', selectedChildId],
    queryFn: () =>
      dashboardApi.getStats({ childStudentId: selectedChildId || undefined }),
    enabled: !!user,
  });

  if (user && user.role !== 'parent') {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  if (isLoading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        <span className="text-xs font-medium">Loading guardian portal...</span>
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="p-8 text-center text-rose-600 bg-rose-50 rounded-2xl border border-rose-200">
        <h3 className="font-bold text-sm">Failed to load parent dashboard</h3>
        <p className="text-xs mt-1 text-rose-500">
          Please check network or backend status.
        </p>
      </div>
    );
  }

  return (
    <ParentDashboard
      stats={data.stats}
      selectedChildId={selectedChildId}
      onSelectChild={(id) => setSelectedChildId(id)}
    />
  );
};

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'admin') return <AdminDashboardPage />;
  if (user?.role === 'teacher') return <TeacherDashboardPage />;
  if (user?.role === 'student') return <StudentDashboardPage />;
  if (user?.role === 'parent') return <ParentDashboardPage />;
  return <Navigate to="/login" replace />;
};
