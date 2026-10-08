import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '../api/client';
import {
  History,
  Search,
  Filter,
  ShieldAlert,
  Clock,
  Loader2,
  Calendar,
  User,
  Layers,
} from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [actionFilter, setActionFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [actorSearch, setActorSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: [
      'audit-logs',
      actionFilter,
      moduleFilter,
      actorSearch,
      startDate,
      endDate,
      search,
      page,
    ],
    queryFn: () =>
      auditApi.getAuditLogs({
        action: actionFilter || undefined,
        module: moduleFilter || undefined,
        actor: actorSearch || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: search || undefined,
        page,
        limit: 25,
      }),
  });

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'PERMISSION_UPDATE':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'RESULT_PUBLISH':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'RESULT_UPDATE':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'ATTENDANCE_EDIT':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'FEE_PAYMENT':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'FEE_CONCESSION_APPLY':
      case 'FEE_CONCESSION_APPROVE':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'BACKUP_EXPORT':
      case 'BACKUP_RESTORE':
        return 'bg-rose-50 text-rose-700 border-rose-200 font-bold';
      case 'SETTINGS_UPDATE':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'EXPENSE_CREATE':
      case 'EXPENSE_DELETE':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'STUDENT_CREATE':
      case 'TEACHER_CREATE':
        return 'bg-orange-50 text-brand-700 border-brand-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            System Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable administrative event log for permissions, marks
            publishing, fee concessions, attendance edits, and system backups.
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search details, event notes, or IP address..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="w-full md:w-44">
            <input
              type="text"
              placeholder="Filter by Actor Name..."
              value={actorSearch}
              onChange={(e) => {
                setActorSearch(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="w-full md:w-44">
            <select
              value={moduleFilter}
              onChange={(e) => {
                setModuleFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium cursor-pointer"
            >
              <option value="">All Modules</option>
              <option value="permission">Permissions & Roles</option>
              <option value="attendance">Attendance Register</option>
              <option value="fee">Fees & Concessions</option>
              <option value="finance">Finance & Expenses</option>
              <option value="exam">Tests & Exams</option>
              <option value="grade">Marks & Results</option>
              <option value="settings">School Settings</option>
              <option value="backup">Backup & Restore</option>
              <option value="student">Student Directory</option>
              <option value="teacher">Teacher Staff</option>
            </select>
          </div>

          <div className="w-full md:w-48">
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium cursor-pointer"
            >
              <option value="">All Action Types</option>
              <option value="PERMISSION_UPDATE">PERMISSION_UPDATE</option>
              <option value="RESULT_PUBLISH">RESULT_PUBLISH</option>
              <option value="RESULT_UPDATE">RESULT_UPDATE</option>
              <option value="ATTENDANCE_EDIT">ATTENDANCE_EDIT</option>
              <option value="FEE_PAYMENT">FEE_PAYMENT</option>
              <option value="FEE_CONCESSION_APPLY">FEE_CONCESSION_APPLY</option>
              <option value="FEE_CONCESSION_APPROVE">
                FEE_CONCESSION_APPROVE
              </option>
              <option value="EXPENSE_CREATE">EXPENSE_CREATE</option>
              <option value="EXPENSE_DELETE">EXPENSE_DELETE</option>
              <option value="SETTINGS_UPDATE">SETTINGS_UPDATE</option>
              <option value="BACKUP_EXPORT">BACKUP_EXPORT</option>
              <option value="BACKUP_RESTORE">BACKUP_RESTORE</option>
              <option value="STUDENT_CREATE">STUDENT_CREATE</option>
              <option value="TEACHER_CREATE">TEACHER_CREATE</option>
              <option value="USER_LOGIN">USER_LOGIN</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Date Range:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="px-2 py-1 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-700"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="px-2 py-1 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-700"
            />
          </div>

          <div className="text-slate-500 font-medium">
            Total Logged Events: <strong>{data?.pagination?.total || 0}</strong>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5 w-44">Timestamp</th>
                <th className="px-6 py-3.5 w-44">User / Actor</th>
                <th className="px-6 py-3.5 w-32">Module</th>
                <th className="px-6 py-3.5 w-40">Action</th>
                <th className="px-6 py-3.5">
                  Audit Details & Event Description
                </th>
                <th className="px-6 py-3.5 w-32 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
                    Loading audit trail...
                  </td>
                </tr>
              ) : data?.logs?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    No audit records match the selected filter.
                  </td>
                </tr>
              ) : (
                data?.logs?.map((log: any) => (
                  <tr
                    key={log._id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">
                        {log.userName}
                      </div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">
                        {log.userRole}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize bg-slate-100 text-slate-600">
                        {log.entityType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-medium leading-relaxed">
                      {log.details}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-[11px] text-slate-400">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {data.pagination.page} of {data.pagination.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 font-medium hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 font-medium hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
