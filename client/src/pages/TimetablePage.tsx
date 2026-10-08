import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { modulesApi, academicsApi, teachersApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal, LoadingState } from '../components/common';
import {
  Calendar,
  Clock,
  BookOpen,
  User,
  Building,
  Plus,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { hasPermission, PERMISSIONS } from '@eduhub/shared';

export const TimetablePage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedClassId, setSelectedClassId] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);

  const [form, setForm] = useState({
    classSectionId: '',
    dayOfWeek: 'Monday',
    periodNumber: 1,
    startTime: '09:00 AM',
    endTime: '09:45 AM',
    subjectId: '',
    teacherId: '',
    roomNumber: 'Room 301',
  });

  const canManage =
    user?.role === 'admin' ||
    (user?.role === 'teacher' &&
      hasPermission(user.role, user.permissions, PERMISSIONS.TIMETABLE_MANAGE));

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => academicsApi.getClasses(),
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => academicsApi.getSubjects(),
  });

  const { data: teachersData } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => teachersApi.getTeachers(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['timetable', selectedClassId],
    queryFn: () =>
      modulesApi.getTimetable({ classSectionId: selectedClassId || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: (newSlot: any) => modulesApi.createTimetableSlot(newSlot),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable'] });
      setIsAddModalOpen(false);
      setConflictError(null);
      alert('Period slot added successfully.');
    },
    onError: (err: any) => {
      setConflictError(err.message || 'Timetable conflict detected');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => modulesApi.deleteTimetableSlot(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable'] });
      alert('Period slot removed.');
    },
    onError: (err: any) => alert(err.message || 'Failed to delete period slot'),
  });

  const days = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const periods = [1, 2, 3, 4, 5, 6];

  const slotMap = new Map<string, any>();
  if (data?.slots) {
    for (const slot of data.slots) {
      slotMap.set(`${slot.dayOfWeek}-${slot.periodNumber}`, slot);
    }
  }

  const periodTimeLabels: Record<number, string> = {
    1: '09:00 - 09:45 AM',
    2: '09:45 - 10:30 AM',
    3: '10:45 - 11:30 AM',
    4: '11:30 - 12:15 PM',
    5: '01:00 - 01:45 PM',
    6: '01:45 - 02:30 PM',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Class Timetable & Schedule
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Weekly curriculum periods, room allocations, and faculty timetables
            for Adiya School.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-56">
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-300 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 cursor-pointer shadow-sm"
            >
              <option value="">All Classes / Default View</option>
              {classesData?.classes?.map((c: any) => (
                <option key={c._id} value={c._id}>
                  {c.name} - Section {c.section}
                </option>
              ))}
            </select>
          </div>

          {canManage && (
            <button
              onClick={() => {
                setConflictError(null);
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Add Period Slot
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <LoadingState message="Loading weekly timetable..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5 border-r border-slate-200 w-28 text-center bg-slate-100/70">
                    Day
                  </th>
                  {periods.map((p) => (
                    <th
                      key={p}
                      className="p-3.5 border-r border-slate-200 text-center min-w-[160px]"
                    >
                      <span className="font-bold text-slate-800 block">
                        Period {p}
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {periodTimeLabels[p] || 'Scheduled Period'}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {days.map((day) => (
                  <tr
                    key={day}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-3.5 font-bold text-slate-800 text-center bg-slate-50/60 border-r border-slate-200">
                      {day}
                    </td>
                    {periods.map((p) => {
                      const slot = slotMap.get(`${day}-${p}`);
                      return (
                        <td
                          key={p}
                          className="p-3 border-r border-slate-200 align-top"
                        >
                          {slot ? (
                            <div className="p-2.5 rounded-xl bg-orange-50/70 border border-orange-200 hover:bg-orange-50 transition-colors space-y-1 relative group">
                              <span className="font-bold text-slate-800 text-xs block leading-tight">
                                {slot.subjectName}
                              </span>
                              <div className="text-[11px] text-slate-600 flex items-center gap-1 truncate">
                                <User className="w-3 h-3 text-brand-500 shrink-0" />
                                <span>{slot.teacherName}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                                <Building className="w-3 h-3 shrink-0" />
                                <span>{slot.roomNumber || 'Room 301'}</span>
                              </div>

                              {canManage &&
                                slot._id &&
                                !slot._id.startsWith('slot-') && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (
                                        confirm('Delete this timetable slot?')
                                      ) {
                                        deleteMutation.mutate(slot._id);
                                      }
                                    }}
                                    className="absolute top-1.5 right-1.5 p-1 rounded bg-white text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity border border-rose-200"
                                    title="Delete Slot"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                            </div>
                          ) : (
                            <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-slate-300 text-[11px]">
                              Free Slot
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setConflictError(null);
        }}
        title="Schedule Timetable Period"
        subtitle="Automatic Conflict Detection Engine"
        maxWidth="max-w-md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setConflictError(null);
            createMutation.mutate(form);
          }}
          className="space-y-4 text-xs"
        >
          {conflictError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div>
                <span className="font-bold block">
                  Scheduling Conflict Detected
                </span>
                <span>{conflictError}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Class & Section *
            </label>
            <select
              required
              value={form.classSectionId}
              onChange={(e) =>
                setForm({ ...form, classSectionId: e.target.value })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
            >
              <option value="">Select Class Section</option>
              {classesData?.classes?.map((c: any) => (
                <option key={c._id} value={c._id}>
                  {c.name} - Section {c.section}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Day of Week *
              </label>
              <select
                value={form.dayOfWeek}
                onChange={(e) =>
                  setForm({ ...form, dayOfWeek: e.target.value })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
              >
                {days.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Period Number *
              </label>
              <select
                value={form.periodNumber}
                onChange={(e) => {
                  const pNum = Number(e.target.value);
                  const times: Record<number, { start: string; end: string }> =
                    {
                      1: { start: '09:00 AM', end: '09:45 AM' },
                      2: { start: '09:45 AM', end: '10:30 AM' },
                      3: { start: '10:45 AM', end: '11:30 AM' },
                      4: { start: '11:30 AM', end: '12:15 PM' },
                      5: { start: '01:00 PM', end: '01:45 PM' },
                      6: { start: '01:45 PM', end: '02:30 PM' },
                    };
                  setForm({
                    ...form,
                    periodNumber: pNum,
                    startTime: times[pNum]?.start || form.startTime,
                    endTime: times[pNum]?.end || form.endTime,
                  });
                }}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
              >
                {periods.map((p) => (
                  <option key={p} value={p}>
                    Period {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Start Time *
              </label>
              <input
                type="text"
                required
                placeholder="09:00 AM"
                value={form.startTime}
                onChange={(e) =>
                  setForm({ ...form, startTime: e.target.value })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                End Time *
              </label>
              <input
                type="text"
                required
                placeholder="09:45 AM"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Subject *
            </label>
            <select
              required
              value={form.subjectId}
              onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
            >
              <option value="">Select Subject</option>
              {subjectsData?.subjects?.map((s: any) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Assigned Teacher *
            </label>
            <select
              required
              value={form.teacherId}
              onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
            >
              <option value="">Select Teacher</option>
              {teachersData?.teachers?.map((t: any) => (
                <option
                  key={t.userId?._id || t.userId}
                  value={t.userId?._id || t.userId}
                >
                  {t.name} ({t.employeeId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Room / Lab Number
            </label>
            <input
              type="text"
              placeholder="e.g. Room 301, Physics Lab"
              value={form.roomNumber}
              onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setConflictError(null);
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-sm transition-all"
            >
              {createMutation.isPending
                ? 'Validating Conflicts...'
                : 'Save Period'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
