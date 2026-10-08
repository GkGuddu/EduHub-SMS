import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi, academicsApi } from '../api/client';
import { MetricCard, LoadingState } from '../components/common';
import {
  FileText,
  Printer,
  Download,
  Users,
  CalendarCheck,
  Receipt,
  GraduationCap,
  BookOpen,
  Filter,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { PERMISSIONS } from '@eduhub/shared';

export const ReportsPage: React.FC = () => {
  type ReportTab = 'strength' | 'attendance' | 'fees' | 'exams' | 'homework';

  const { user, hasPermission } = useAuth();
  const canViewReports =
    user?.role === 'admin' || hasPermission(PERMISSIONS.REPORTS_VIEW);

  const [activeReport, setActiveReport] = useState<ReportTab>('strength');
  const [classFilter, setClassFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: classesData } = useQuery({
    queryKey: ['classes-list'],
    queryFn: () => academicsApi.getClasses(),
    enabled: canViewReports,
  });

  const { data: strengthData, isLoading: loadingStrength } = useQuery({
    queryKey: ['reports-strength', classFilter],
    queryFn: () =>
      reportsApi.getStudentStrength({
        classSectionId: classFilter || undefined,
      }),
    enabled: canViewReports && activeReport === 'strength',
  });

  const { data: attData, isLoading: loadingAtt } = useQuery({
    queryKey: ['reports-attendance', classFilter, startDate, endDate],
    queryFn: () =>
      reportsApi.getAttendanceReport({
        classSectionId: classFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
    enabled: canViewReports && activeReport === 'attendance',
  });

  const { data: feesData, isLoading: loadingFees } = useQuery({
    queryKey: ['reports-fees', classFilter],
    queryFn: () =>
      reportsApi.getFeesReport({ classSectionId: classFilter || undefined }),
    enabled: canViewReports && activeReport === 'fees',
  });

  const { data: examsData, isLoading: loadingExams } = useQuery({
    queryKey: ['reports-exams', classFilter],
    queryFn: () =>
      reportsApi.getExamPerformanceReport({
        classSectionId: classFilter || undefined,
      }),
    enabled: canViewReports && activeReport === 'exams',
  });

  const { data: homeworkData, isLoading: loadingHomework } = useQuery({
    queryKey: ['reports-homework', classFilter],
    queryFn: () =>
      reportsApi.getHomeworkReport({
        classSectionId: classFilter || undefined,
      }),
    enabled: canViewReports && activeReport === 'homework',
  });

  const handleExportCsv = () => {
    const url = reportsApi.getExportCsvUrl(
      activeReport,
      classFilter || undefined
    );
    window.open(url, '_blank');
  };

  const tabs: Array<{
    key: ReportTab;
    label: string;
    icon: React.ElementType;
  }> = [
    { key: 'strength', label: 'Student Strength', icon: Users },
    { key: 'attendance', label: 'Attendance Analysis', icon: CalendarCheck },
    { key: 'fees', label: 'Fee Collection & Defaulters', icon: Receipt },
    { key: 'exams', label: 'Exam Performance & Grades', icon: GraduationCap },
    { key: 'homework', label: 'Homework Completion', icon: BookOpen },
  ];

  if (!canViewReports) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto my-12 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Access Restricted</h2>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Institutional analytics and administrative reports are reserved for
          school administrators and authorized management personnel.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Institutional Reports & Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time executive summaries, student strength, attendance
            registers, fee defaulters, and examination statements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all"
            title="Download CSV statement"
          >
            <Download className="w-4 h-4 text-slate-500" /> Export CSV
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all"
            title="Print or export to PDF"
          >
            <Printer className="w-4 h-4" /> Print / PDF
          </button>
        </div>
      </div>

      <div className="hidden print:block pb-4 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900">
          Adiya School of Excellence - Institutional Report
        </h1>
        <p className="text-xs text-slate-500">
          Report Category: {tabs.find((t) => t.key === activeReport)?.label} |
          Generated on: {new Date().toLocaleDateString()}
        </p>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto print:hidden">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeReport === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveReport(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-brand-50 text-brand-700 border border-brand-200 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon
                className={`w-4 h-4 ${isActive ? 'text-brand-600' : 'text-slate-400'}`}
              />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600">
              Filters:
            </span>
          </div>

          <div className="w-48">
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">All Classes & Sections</option>
              {classesData?.classes?.map((c: any) => (
                <option key={c._id} value={c._id}>
                  {c.name} - Section {c.section}
                </option>
              ))}
            </select>
          </div>

          {activeReport === 'attendance' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700"
                placeholder="From date"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700"
                placeholder="To date"
              />
            </div>
          )}
        </div>

        <div className="text-xs text-slate-500">
          Showing real-time data from <strong>Adiya School Live DB</strong>
        </div>
      </div>

      {activeReport === 'strength' && (
        <div className="space-y-6">
          {loadingStrength ? (
            <LoadingState message="Calculating class enrollment and seat capacities..." />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <MetricCard
                  title="Total Enrolled"
                  value={
                    strengthData?.reports?.reduce(
                      (acc: number, r: any) => acc + r.totalEnrolled,
                      0
                    ) || 0
                  }
                  subtitle="Active students campus-wide"
                  icon={Users}
                  variant="green"
                />
                <MetricCard
                  title="Boys Enrolled"
                  value={
                    strengthData?.reports?.reduce(
                      (acc: number, r: any) => acc + r.boys,
                      0
                    ) || 0
                  }
                  subtitle="Male student roster"
                  icon={Users}
                  variant="cyan"
                />
                <MetricCard
                  title="Girls Enrolled"
                  value={
                    strengthData?.reports?.reduce(
                      (acc: number, r: any) => acc + r.girls,
                      0
                    ) || 0
                  }
                  subtitle="Female student roster"
                  icon={Users}
                  variant="purple"
                />
                <MetricCard
                  title="Total Capacity"
                  value={
                    strengthData?.reports?.reduce(
                      (acc: number, r: any) => acc + r.capacity,
                      0
                    ) || 0
                  }
                  subtitle="Authorized classroom seats"
                  icon={GraduationCap}
                  variant="peach"
                />
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-800">
                    Class & Section Enrollment Roster
                  </h3>
                  <span className="text-xs text-slate-400">
                    {strengthData?.reports?.length || 0} class sections
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3.5">Class & Section</th>
                        <th className="px-6 py-3.5 text-center">Capacity</th>
                        <th className="px-6 py-3.5 text-center">Enrolled</th>
                        <th className="px-6 py-3.5 text-center">Boys</th>
                        <th className="px-6 py-3.5 text-center">Girls</th>
                        <th className="px-6 py-3.5 text-center">
                          Available Seats
                        </th>
                        <th className="px-6 py-3.5 text-right">
                          Occupancy Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {strengthData?.reports?.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-6 py-8 text-center text-slate-400"
                          >
                            No class enrollment records found.
                          </td>
                        </tr>
                      ) : (
                        strengthData?.reports?.map((r: any) => (
                          <tr
                            key={r.classSectionId}
                            className="hover:bg-slate-50/80 transition-colors"
                          >
                            <td className="px-6 py-4 font-semibold text-slate-800">
                              {r.className} - Section {r.section}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {r.capacity}
                            </td>
                            <td className="px-6 py-4 text-center font-bold text-slate-800">
                              {r.totalEnrolled}
                            </td>
                            <td className="px-6 py-4 text-center text-sky-700 font-medium">
                              {r.boys}
                            </td>
                            <td className="px-6 py-4 text-center text-purple-700 font-medium">
                              {r.girls}
                            </td>
                            <td className="px-6 py-4 text-center text-emerald-600 font-semibold">
                              {r.availableSeats}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                                {r.occupancyRate}%
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeReport === 'attendance' && (
        <div className="space-y-6">
          {loadingAtt ? (
            <LoadingState message="Aggregating daily and monthly attendance registers..." />
          ) : (
            <>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-800">
                      Monthly Attendance Consistency
                    </h3>
                    <p className="text-xs text-slate-500">
                      Average student presence aggregated across marked working
                      days
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-center">
                  {attData?.monthly?.map((m: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200"
                    >
                      <span className="text-xs font-semibold text-slate-500 block">
                        {m.month}
                      </span>
                      <span className="text-[11px] text-slate-400 block truncate">
                        {m.className}-{m.section}
                      </span>
                      <span className="text-lg font-bold text-emerald-600 mt-1 block">
                        {m.avgRate}%
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {m.workingDays} days marked
                      </span>
                    </div>
                  ))}
                  {(!attData?.monthly || attData.monthly.length === 0) && (
                    <div className="col-span-full py-4 text-center text-slate-400 text-xs">
                      No monthly summaries recorded yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-800">
                    Daily Attendance Register Statements
                  </h3>
                  <span className="text-xs text-slate-400">
                    {attData?.daily?.length || 0} session records
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3.5">Session Date</th>
                        <th className="px-6 py-3.5">Class & Section</th>
                        <th className="px-6 py-3.5 text-center">Roster</th>
                        <th className="px-6 py-3.5 text-center">Present</th>
                        <th className="px-6 py-3.5 text-center">Absent</th>
                        <th className="px-6 py-3.5 text-center">Late</th>
                        <th className="px-6 py-3.5 text-center">Leave</th>
                        <th className="px-6 py-3.5 text-right">
                          Attendance Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {attData?.daily?.map((d: any, idx: number) => (
                        <tr
                          key={idx}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="px-6 py-4 font-semibold text-slate-800">
                            {d.date}
                          </td>
                          <td className="px-6 py-4 font-medium">
                            {d.className} - {d.section}
                          </td>
                          <td className="px-6 py-4 text-center">{d.total}</td>
                          <td className="px-6 py-4 text-center text-emerald-600 font-bold">
                            {d.present}
                          </td>
                          <td className="px-6 py-4 text-center text-rose-600 font-bold">
                            {d.absent}
                          </td>
                          <td className="px-6 py-4 text-center text-amber-600 font-medium">
                            {d.late}
                          </td>
                          <td className="px-6 py-4 text-center text-purple-600 font-medium">
                            {d.leave}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                                d.rate >= 75
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {d.rate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeReport === 'fees' && (
        <div className="space-y-6">
          {loadingFees ? (
            <LoadingState message="Compiling fee collection ledger and identifying outstanding defaulters..." />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <MetricCard
                  title="Total Billed"
                  value={`₹${(feesData?.report?.billed || 0).toLocaleString('en-IN')}`}
                  subtitle="Total invoiced tuition & fees"
                  icon={Receipt}
                  variant="blue"
                />
                <MetricCard
                  title="Total Collected"
                  value={`₹${(feesData?.report?.collected || 0).toLocaleString('en-IN')}`}
                  subtitle="Realized fee revenue"
                  icon={CheckCircle}
                  variant="green"
                />
                <MetricCard
                  title="Outstanding Balance"
                  value={`₹${(feesData?.report?.outstanding || 0).toLocaleString('en-IN')}`}
                  subtitle="Pending tuition receivables"
                  icon={AlertTriangle}
                  variant="peach"
                />
                <MetricCard
                  title="Collection Rate"
                  value={`${feesData?.report?.collectionRate || 0}%`}
                  subtitle="Realization efficiency"
                  icon={TrendingUp}
                  variant="peach"
                />
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-800">
                      Fee Defaulters & Overdue Accounts
                    </h3>
                    <p className="text-xs text-slate-500">
                      Student accounts with pending dues past invoice due date
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    {feesData?.report?.defaultersCount || 0} Defaulters
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3.5">Student Name</th>
                        <th className="px-6 py-3.5">Invoice / Roll #</th>
                        <th className="px-6 py-3.5">Class</th>
                        <th className="px-6 py-3.5">Parent / Contact</th>
                        <th className="px-6 py-3.5">Due Date</th>
                        <th className="px-6 py-3.5 text-center">
                          Overdue Days
                        </th>
                        <th className="px-6 py-3.5 text-right">Balance Due</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {feesData?.report?.defaulters?.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-6 py-8 text-center text-slate-400"
                          >
                            Zero fee defaulters. All student invoices are
                            settled.
                          </td>
                        </tr>
                      ) : (
                        feesData?.report?.defaulters?.map(
                          (d: any, idx: number) => (
                            <tr
                              key={idx}
                              className="hover:bg-slate-50/80 transition-colors"
                            >
                              <td className="px-6 py-4 font-semibold text-slate-800">
                                {d.studentName}
                              </td>
                              <td className="px-6 py-4 font-mono text-xs">
                                {d.rollNumber}
                              </td>
                              <td className="px-6 py-4">
                                {d.className} - {d.section}
                              </td>
                              <td className="px-6 py-4 text-xs">
                                <span className="font-medium text-slate-800 block">
                                  {d.parentName}
                                </span>
                                <span className="text-slate-500">
                                  {d.parentPhone}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-xs text-slate-600">
                                {d.dueDate}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  {d.overdueDays} days
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right font-bold text-rose-600">
                                ₹{d.balance?.toLocaleString('en-IN')}
                              </td>
                            </tr>
                          )
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeReport === 'exams' && (
        <div className="space-y-6">
          {loadingExams ? (
            <LoadingState message="Analyzing published examination results and grade distributions..." />
          ) : (
            <div className="space-y-6">
              {examsData?.reports?.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-sm">
                  No published exam reports found. Results must be published by
                  authorized staff to generate performance analytics.
                </div>
              ) : (
                examsData?.reports?.map((e: any) => (
                  <div
                    key={e.examId}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-slate-800">
                            {e.examName}
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
                            {e.className} - {e.section}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Examinees Appeared: {e.appeared} of {e.totalStudents}{' '}
                          | Average Marks: {e.averageMarks}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[11px] text-slate-400 block">
                            Class Pass Rate
                          </span>
                          <span className="text-xl font-black text-emerald-600">
                            {e.passRate}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2.5">
                        Grade Distribution Breakdown
                      </span>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 text-center">
                        {['A+', 'A', 'B', 'C', 'D', 'F'].map((g) => (
                          <div
                            key={g}
                            className={`p-3 rounded-xl border ${
                              g === 'F'
                                ? 'bg-rose-50 border-rose-200 text-rose-700'
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <span className="text-xs font-bold block">{g}</span>
                            <span className="text-lg font-black">
                              {e.gradeDistribution?.[g] || 0}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              students
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {e.subjectAverages && e.subjectAverages.length > 0 && (
                      <div>
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2.5">
                          Subject-wise Average Marks
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {e.subjectAverages.map((sub: any, sIdx: number) => (
                            <div
                              key={sIdx}
                              className="p-3 rounded-xl bg-slate-50/80 border border-slate-200"
                            >
                              <span className="text-xs font-semibold text-slate-800 block truncate">
                                {sub.subjectName}
                              </span>
                              <div className="flex items-baseline justify-between mt-1">
                                <span className="text-base font-bold text-brand-600">
                                  {sub.averageMarks}
                                </span>
                                <span className="text-xs text-slate-400">
                                  / {sub.maxMarks}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {activeReport === 'homework' && (
        <div className="space-y-6">
          {loadingHomework ? (
            <LoadingState message="Evaluating homework submissions and completion metrics..." />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-800">
                  Homework & Assignment Completion Matrix
                </h3>
                <span className="text-xs text-slate-400">
                  {homeworkData?.reports?.length || 0} assignments
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Class & Section</th>
                      <th className="px-6 py-3.5">Subject</th>
                      <th className="px-6 py-3.5 text-center">
                        Expected Submissions
                      </th>
                      <th className="px-6 py-3.5 text-center">
                        Submitted On-Time
                      </th>
                      <th className="px-6 py-3.5 text-center">
                        Submitted Late
                      </th>
                      <th className="px-6 py-3.5 text-center">Pending</th>
                      <th className="px-6 py-3.5 text-right">
                        Completion Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {homeworkData?.reports?.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-8 text-center text-slate-400"
                        >
                          No homework assignments found for selected filter.
                        </td>
                      </tr>
                    ) : (
                      homeworkData?.reports?.map((hw: any, idx: number) => (
                        <tr
                          key={idx}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="px-6 py-4 font-semibold text-slate-800">
                            {hw.className} - {hw.section}
                          </td>
                          <td className="px-6 py-4 font-medium">
                            {hw.subject}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {hw.totalSubmissionsExpected}
                          </td>
                          <td className="px-6 py-4 text-center text-emerald-600 font-bold">
                            {hw.submittedOnTime}
                          </td>
                          <td className="px-6 py-4 text-center text-amber-600 font-bold">
                            {hw.submittedLate}
                          </td>
                          <td className="px-6 py-4 text-center text-rose-600 font-bold">
                            {hw.pendingSubmissions}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                              {hw.completionRate}%
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
      )}
    </div>
  );
};
