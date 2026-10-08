import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  TeacherCreateSchema,
  TeacherCreateInput,
  TeacherUpdateSchema,
  TeacherUpdateInput,
} from '@eduhub/shared';
import { teachersApi, academicsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common';
import { Drawer } from '../components/common';
import {
  Search,
  Plus,
  Mail,
  Phone,
  BookOpen,
  ShieldCheck,
  Loader2,
  Edit2,
  Archive,
  RefreshCw,
  Trash2,
  Layers,
  Award,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Eye,
} from 'lucide-react';

export const TeachersPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('active');
  const [page, setPage] = useState(1);

  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(
    null
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [teacherToEdit, setTeacherToEdit] = useState<any | null>(null);

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    register: registerAdd,
    handleSubmit: handleSubmitAdd,
    reset: resetAdd,
    control: controlAdd,
    formState: { errors: addErrors },
  } = useForm<TeacherCreateInput>({
    resolver: zodResolver(TeacherCreateSchema),
    defaultValues: {
      name: '',
      email: '',
      employeeId: '',
      phone: '',
      gender: 'female',
      qualification: 'M.Sc. B.Ed.',
      specialization: 'Mathematics',
      experienceYears: 5,
      joiningDate: '2024-06-01',
      assignedClasses: [],
    },
  });

  const {
    fields: addAssignmentFields,
    append: appendAddAssignment,
    remove: removeAddAssignment,
  } = useFieldArray({
    control: controlAdd,
    name: 'assignedClasses',
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    control: controlEdit,
    setValue: setValueEdit,
    formState: { errors: editErrors },
  } = useForm<TeacherUpdateInput>({
    resolver: zodResolver(TeacherUpdateSchema),
  });

  const {
    fields: editAssignmentFields,
    append: appendEditAssignment,
    remove: removeEditAssignment,
  } = useFieldArray({
    control: controlEdit,
    name: 'assignedClasses',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['teachers', search, selectedStatus, page],
    queryFn: () =>
      teachersApi.getTeachers({
        search: search || undefined,
        status: selectedStatus || undefined,
        page,
        limit: 10,
      }),
  });

  const { data: selectedTeacherDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['teacher-detail', selectedTeacherId],
    queryFn: () => teachersApi.getTeacherById(selectedTeacherId!),
    enabled: !!selectedTeacherId,
  });

  const { data: classData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => academicsApi.getClasses(),
  });

  const { data: subjectData } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => academicsApi.getSubjects(),
  });

  const addTeacherMutation = useMutation({
    mutationFn: (newTeacher: TeacherCreateInput) =>
      teachersApi.createTeacher(newTeacher),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setIsAddModalOpen(false);
      resetAdd();
      setActionSuccess(
        'Faculty account created successfully with credential dispatch.'
      );
      setTimeout(() => setActionSuccess(null), 5000);
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to add faculty account');
    },
  });

  const updateTeacherMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TeacherUpdateInput }) =>
      teachersApi.updateTeacher(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      if (selectedTeacherId) {
        queryClient.invalidateQueries({
          queryKey: ['teacher-detail', selectedTeacherId],
        });
      }
      setIsEditModalOpen(false);
      setTeacherToEdit(null);
      setActionSuccess('Faculty details updated successfully.');
      setTimeout(() => setActionSuccess(null), 4000);
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to update faculty account');
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => teachersApi.archiveTeacher(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      if (selectedTeacherId) {
        queryClient.invalidateQueries({
          queryKey: ['teacher-detail', selectedTeacherId],
        });
      }
      setActionSuccess(
        'Faculty account archived and login credentials deactivated.'
      );
      setTimeout(() => setActionSuccess(null), 4000);
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to archive teacher');
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => teachersApi.restoreTeacher(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      if (selectedTeacherId) {
        queryClient.invalidateQueries({
          queryKey: ['teacher-detail', selectedTeacherId],
        });
      }
      setActionSuccess('Faculty account restored to active directory.');
      setTimeout(() => setActionSuccess(null), 4000);
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to restore teacher');
    },
  });

  const handleOpenEdit = (t: any) => {
    setTeacherToEdit(t);
    setValueEdit('name', t.name);
    setValueEdit('email', t.email);
    setValueEdit('employeeId', t.employeeId);
    setValueEdit('phone', t.phone || '');
    setValueEdit('gender', t.gender);
    setValueEdit('qualification', t.qualification);
    setValueEdit('specialization', t.specialization);
    setValueEdit('experienceYears', t.experienceYears || 0);
    setValueEdit(
      'joiningDate',
      t.joiningDate
        ? new Date(t.joiningDate).toISOString().split('T')[0]
        : '2024-06-01'
    );
    setValueEdit('status', t.status);
    setValueEdit(
      'assignedClasses',
      (t.assignedClasses || []).map((a: any) => ({
        classSectionId: a.classSectionId?._id || a.classSectionId,
        subjectId: a.subjectId?._id || a.subjectId,
      }))
    );
    setIsEditModalOpen(true);
  };

  const canManageTeachers = user?.role === 'admin';

  return (
    <div className="space-y-6">
      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-emerald-600 font-bold ml-4"
          >
            ×
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-rose-600 font-bold ml-4"
          >
            ×
          </button>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Faculty & Staff Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse teaching faculty, subject allocations, experience, and
            permissions for Adiya School.
          </p>
        </div>
        {canManageTeachers && (
          <button
            onClick={() => {
              resetAdd();
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Faculty Member
          </button>
        )}
      </div>
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto flex-1">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by faculty name, employee ID, specialization..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>

          <div className="w-40">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
            >
              <option value="active">Active Faculty</option>
              <option value="on_leave">On Leave</option>
              <option value="archived">Archived (Soft Deleted)</option>
              <option value="all">All Faculty</option>
            </select>
          </div>
        </div>

        <span className="text-xs text-slate-500 font-medium shrink-0">
          Showing <strong>{data?.teachers?.length || 0}</strong> of{' '}
          <strong>{data?.pagination?.total || 0}</strong> faculty
        </span>
      </div>
      {isLoading ? (
        <div className="py-16 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-500" />
          Loading faculty records...
        </div>
      ) : data?.teachers?.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          No faculty members found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data?.teachers?.map((t: any) => (
            <div
              key={t._id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-700 font-bold text-base flex items-center justify-center border border-brand-200 shrink-0">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-800 tracking-tight">
                        {t.name}
                      </h3>
                      <p className="text-xs text-brand-600 font-medium">
                        {t.specialization}
                      </p>
                      <span className="text-[10px] font-mono text-slate-400">
                        ID: {t.employeeId} • {t.experienceYears || 0} yrs exp
                      </span>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      t.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : t.status === 'archived'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {t.status.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-1.5 py-2.5 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{t.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{t.phone || '+91 98450 12345'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-500">
                      Qualification: {t.qualification}
                    </span>
                  </div>
                </div>
                <div className="mt-2.5 pt-2.5 border-t border-slate-100">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Assigned Classes & Subjects:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {t.assignedClasses?.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">
                        No allocations yet
                      </span>
                    ) : (
                      t.assignedClasses?.map((item: any, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200"
                        >
                          {item.className}-{item.section} ({item.subjectName})
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  {t.permissions?.length || 7} privileges
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSelectedTeacherId(t._id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                    title="View details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {canManageTeachers && (
                    <>
                      <button
                        onClick={() => handleOpenEdit(t)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit faculty"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {t.status === 'archived' ? (
                        <button
                          onClick={() => restoreMutation.mutate(t._id)}
                          className="p-1.5 rounded-lg text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                          title="Restore faculty"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `Archive faculty ${t.name}? This will deactivate their login.`
                              )
                            ) {
                              archiveMutation.mutate(t._id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Archive (soft delete)"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Drawer
        isOpen={!!selectedTeacherId}
        onClose={() => setSelectedTeacherId(null)}
        title="Faculty Profile"
        subtitle={selectedTeacherDetail?.teacher?.name}
      >
        {isLoadingDetail ? (
          <div className="py-16 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
            Loading faculty profile...
          </div>
        ) : selectedTeacherDetail?.teacher ? (
          <div className="space-y-5 text-xs">
            <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-brand-500 text-white font-bold text-base flex items-center justify-center">
                  {selectedTeacherDetail.teacher.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">
                    {selectedTeacherDetail.teacher.name}
                  </h3>
                  <p className="text-xs text-brand-600 font-medium">
                    {selectedTeacherDetail.teacher.specialization}
                  </p>
                  <span className="text-[10px] font-mono text-slate-400">
                    ID: {selectedTeacherDetail.teacher.employeeId}
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {selectedTeacherDetail.teacher.status.toUpperCase()}
              </span>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
              <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Professional Qualifications
              </h4>
              <div className="grid grid-cols-2 gap-3 text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Highest Degree
                  </span>
                  <span className="font-medium text-slate-800">
                    {selectedTeacherDetail.teacher.qualification}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Total Experience
                  </span>
                  <span className="font-medium text-slate-800">
                    {selectedTeacherDetail.teacher.experienceYears || 0} Years
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Email Address
                  </span>
                  <span className="font-medium text-slate-800">
                    {selectedTeacherDetail.teacher.email}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Phone
                  </span>
                  <span className="font-medium text-slate-800">
                    {selectedTeacherDetail.teacher.phone || '+91 98450 12345'}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
              <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Current Teaching Allocations
              </h4>
              {selectedTeacherDetail.teacher.assignedClasses?.length === 0 ? (
                <p className="text-slate-400 py-2">
                  No subjects currently assigned.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedTeacherDetail.teacher.assignedClasses?.map(
                    (item: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-brand-500" />
                          <div>
                            <div className="font-bold text-slate-800">
                              {item.subjectName}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {item.className} - Section {item.section}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white text-slate-600 font-mono border border-slate-200">
                          {item.subjectCode || 'SUB'}
                        </span>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Drawer>
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Faculty Member"
        subtitle="Create teacher account with credentials and classroom allocations"
        maxWidth="max-w-2xl"
      >
        <form
          onSubmit={handleSubmitAdd((data) => addTeacherMutation.mutate(data))}
          className="space-y-4 text-xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                {...registerAdd('name')}
                placeholder="Dr. Smita Bose"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
              {addErrors.name && (
                <span className="text-[10px] text-rose-500">
                  {addErrors.name.message}
                </span>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                {...registerAdd('email')}
                placeholder="smita.bose@adiya.edu"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
              {addErrors.email && (
                <span className="text-[10px] text-rose-500">
                  {addErrors.email.message}
                </span>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Employee ID *
              </label>
              <input
                {...registerAdd('employeeId')}
                placeholder="TCH-105"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
              {addErrors.employeeId && (
                <span className="text-[10px] text-rose-500">
                  {addErrors.employeeId.message}
                </span>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                {...registerAdd('phone')}
                placeholder="+91 98450 99887"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Specialization *
              </label>
              <input
                {...registerAdd('specialization')}
                placeholder="Computer Science & AI"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
              {addErrors.specialization && (
                <span className="text-[10px] text-rose-500">
                  {addErrors.specialization.message}
                </span>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Qualification *
              </label>
              <input
                {...registerAdd('qualification')}
                placeholder="M.Tech. Computer Science"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
              {addErrors.qualification && (
                <span className="text-[10px] text-rose-500">
                  {addErrors.qualification.message}
                </span>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Experience (Years)
              </label>
              <input
                type="number"
                {...registerAdd('experienceYears', { valueAsNumber: true })}
                placeholder="5"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Joining Date *
              </label>
              <input
                type="date"
                {...registerAdd('joiningDate')}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-brand-500" />
                Teaching Allocations (Class + Subject)
              </h4>
              <button
                type="button"
                onClick={() =>
                  appendAddAssignment({ classSectionId: '', subjectId: '' })
                }
                className="text-[11px] text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Allocation
              </button>
            </div>

            {addAssignmentFields.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">
                No classes assigned yet. Click "Add Allocation" to map this
                teacher to classes.
              </p>
            ) : (
              <div className="space-y-2">
                {addAssignmentFields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <select
                      {...registerAdd(
                        `assignedClasses.${index}.classSectionId` as const
                      )}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs cursor-pointer"
                    >
                      <option value="">Select Class Section</option>
                      {classData?.classes?.map((c: any) => (
                        <option key={c._id} value={c._id}>
                          {c.name} - Section {c.section}
                        </option>
                      ))}
                    </select>

                    <select
                      {...registerAdd(
                        `assignedClasses.${index}.subjectId` as const
                      )}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs cursor-pointer"
                    >
                      <option value="">Select Subject</option>
                      {subjectData?.subjects?.map((s: any) => (
                        <option key={s._id} value={s._id}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => removeAddAssignment(index)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addTeacherMutation.isPending}
              className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {addTeacherMutation.isPending
                ? 'Saving...'
                : 'Create Faculty Account'}
            </button>
          </div>
        </form>
      </Modal>
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setTeacherToEdit(null);
        }}
        title="Edit Faculty Member"
        subtitle={teacherToEdit?.name}
        maxWidth="max-w-2xl"
      >
        <form
          onSubmit={handleSubmitEdit((data) =>
            updateTeacherMutation.mutate({ id: teacherToEdit._id, data })
          )}
          className="space-y-4 text-xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <input
                {...registerEdit('name')}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                {...registerEdit('email')}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Employee ID
              </label>
              <input
                {...registerEdit('employeeId')}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Phone
              </label>
              <input
                {...registerEdit('phone')}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Specialization
              </label>
              <input
                {...registerEdit('specialization')}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Experience (Years)
              </label>
              <input
                type="number"
                {...registerEdit('experienceYears', { valueAsNumber: true })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Status
              </label>
              <select
                {...registerEdit('status')}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white"
              >
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="terminated">Terminated</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-brand-500" />
                Teaching Allocations (Class + Subject)
              </h4>
              <button
                type="button"
                onClick={() =>
                  appendEditAssignment({ classSectionId: '', subjectId: '' })
                }
                className="text-[11px] text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Allocation
              </button>
            </div>

            <div className="space-y-2">
              {editAssignmentFields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <select
                    {...registerEdit(
                      `assignedClasses.${index}.classSectionId` as const
                    )}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs"
                  >
                    <option value="">Select Class Section</option>
                    {classData?.classes?.map((c: any) => (
                      <option key={c._id} value={c._id}>
                        {c.name} - Section {c.section}
                      </option>
                    ))}
                  </select>

                  <select
                    {...registerEdit(
                      `assignedClasses.${index}.subjectId` as const
                    )}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs"
                  >
                    <option value="">Select Subject</option>
                    {subjectData?.subjects?.map((s: any) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => removeEditAssignment(index)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setIsEditModalOpen(false);
                setTeacherToEdit(null);
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateTeacherMutation.isPending}
              className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {updateTeacherMutation.isPending ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
