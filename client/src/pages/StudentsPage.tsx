import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  StudentCreateSchema,
  StudentCreateInput,
  StudentUpdateSchema,
  StudentUpdateInput,
  StudentDocumentSchema,
  StudentDocumentInput,
  PERMISSIONS,
} from '@eduhub/shared';
import { studentsApi, academicsApi, parentsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common';
import { Drawer } from '../components/common';
import { Modal } from '../components/common';
import {
  Search,
  Plus,
  Eye,
  Edit2,
  Archive,
  RefreshCw,
  FileText,
  Clock,
  Sparkles,
  CreditCard,
  GraduationCap,
  Calendar,
  Phone,
  Mail,
  Loader2,
  Trash2,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Upload,
} from 'lucide-react';

export const StudentsPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedFeeStatus, setSelectedFeeStatus] = useState('');
  const [selectedDirectoryStatus, setSelectedDirectoryStatus] =
    useState('active');
  const [page, setPage] = useState(1);

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<
    'overview' | 'attendance' | 'marks' | 'fees' | 'documents' | 'enrollment'
  >('overview');

  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<any | null>(null);
  const [parentMode, setParentMode] = useState<'new' | 'existing'>('new');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [pdfFileError, setPdfFileError] = useState<string | null>(null);
  const [docUploadError, setDocUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register: registerEnroll,
    handleSubmit: handleSubmitEnroll,
    reset: resetEnroll,
    setValue: setValueEnroll,
    formState: { errors: enrollErrors },
  } = useForm<StudentCreateInput>({
    resolver: zodResolver(StudentCreateSchema),
    defaultValues: {
      name: '',
      email: '',
      admissionNumber: '',
      rollNumber: '',
      gender: 'female',
      dateOfBirth: '2010-05-15',
      bloodGroup: 'B+',
      classSectionId: '',
      parentName: '',
      parentEmail: '',
      parentPhone: '',
      parentRelationship: 'guardian',
      existingParentId: '',
      address: '',
      emergencyContact: '',
      initialFeeAmount: 18000,
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    setValue: setValueEdit,
    formState: { errors: editErrors },
  } = useForm<StudentUpdateInput>({
    resolver: zodResolver(StudentUpdateSchema),
  });

  const {
    register: registerDoc,
    handleSubmit: handleSubmitDoc,
    reset: resetDoc,
    setValue: setValueDoc,
    getValues: getValuesDoc,
    formState: { errors: docErrors },
  } = useForm<StudentDocumentInput>({
    resolver: zodResolver(StudentDocumentSchema),
    defaultValues: {
      title: '',
      docType: 'birth_certificate',
    },
  });

  const { data: classData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => academicsApi.getClasses(),
  });

  const { data: parentsData } = useQuery({
    queryKey: ['parents-list'],
    queryFn: () => parentsApi.getParents({ limit: 100 }),
    enabled: isEnrollModalOpen,
  });

  const { data, isLoading } = useQuery({
    queryKey: [
      'students',
      selectedClass,
      search,
      selectedDirectoryStatus,
      selectedFeeStatus,
      page,
    ],
    queryFn: () =>
      studentsApi.getStudents({
        classSectionId: selectedClass || undefined,
        search: search || undefined,
        status: selectedDirectoryStatus || undefined,
        feeStatus: selectedFeeStatus || undefined,
        page,
        limit: 12,
      }),
  });

  const { data: studentDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['student-detail', selectedStudentId],
    queryFn: () => studentsApi.getStudentById(selectedStudentId!),
    enabled: !!selectedStudentId,
  });

  const enrollMutation = useMutation({
    mutationFn: (newStudent: StudentCreateInput) =>
      studentsApi.createStudent(newStudent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setIsEnrollModalOpen(false);
      resetEnroll();
      setActionSuccess(
        'Student enrolled successfully with initial credentials generated.'
      );
      setTimeout(() => setActionSuccess(null), 5000);
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to enroll student');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: StudentUpdateInput }) =>
      studentsApi.updateStudent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      if (selectedStudentId) {
        queryClient.invalidateQueries({
          queryKey: ['student-detail', selectedStudentId],
        });
      }
      setIsEditModalOpen(false);
      setStudentToEdit(null);
      setActionSuccess('Student updated successfully.');
      setTimeout(() => setActionSuccess(null), 4000);
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to update student');
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => studentsApi.archiveStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      if (selectedStudentId) {
        queryClient.invalidateQueries({
          queryKey: ['student-detail', selectedStudentId],
        });
      }
      setActionSuccess(
        'Student archived (soft-deleted) and user login deactivated.'
      );
      setTimeout(() => setActionSuccess(null), 4000);
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to archive student');
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => studentsApi.restoreStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      if (selectedStudentId) {
        queryClient.invalidateQueries({
          queryKey: ['student-detail', selectedStudentId],
        });
      }
      setActionSuccess(
        'Student restored to active directory and login reactivated.'
      );
      setTimeout(() => setActionSuccess(null), 4000);
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to restore student');
    },
  });

  const addDocMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: StudentDocumentInput | FormData }) =>
      studentsApi.addDocument(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['student-detail', selectedStudentId],
      });
      resetDoc();
      setSelectedPdfFile(null);
      setPdfFileError(null);
      setDocUploadError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setActionSuccess('Document uploaded and attached successfully.');
      setTimeout(() => setActionSuccess(null), 4000);
    },
    onError: (err: any) => {
      const msg = err.message || 'Failed to attach document';
      setActionError(msg);
      setDocUploadError(msg);
    },
  });

  const deleteDocMutation = useMutation({
    mutationFn: ({ id, docId }: { id: string; docId: string }) =>
      studentsApi.deleteDocument(id, docId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['student-detail', selectedStudentId],
      });
      setActionSuccess('Document removed.');
      setTimeout(() => setActionSuccess(null), 4000);
    },
  });

  const handleGenerateAdmission = async () => {
    try {
      const res = await studentsApi.getSuggestedAdmissionNumber();
      if (res?.admissionNumber) {
        setValueEnroll('admissionNumber', res.admissionNumber);
      }
    } catch (_e: any) {
      setActionError('Could not auto-generate admission number');
    }
  };

  const handleOpenEdit = (student: any) => {
    setStudentToEdit(student);
    setValueEdit('name', student.name);
    setValueEdit('email', student.email);
    setValueEdit('rollNumber', student.rollNumber);
    setValueEdit('gender', student.gender);
    setValueEdit(
      'dateOfBirth',
      student.dateOfBirth
        ? new Date(student.dateOfBirth).toISOString().split('T')[0]
        : '2010-01-01'
    );
    setValueEdit('bloodGroup', student.bloodGroup || 'O+');
    setValueEdit(
      'classSectionId',
      student.classSectionId?._id || student.classSectionId
    );
    setValueEdit('address', student.address || '');
    setValueEdit('emergencyContact', student.emergencyContact || '');
    setValueEdit('status', student.status);
    setIsEditModalOpen(true);
  };

  const canManageStudents =
    user?.role === 'admin' || hasPermission(PERMISSIONS.STUDENTS_MANAGE);

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
            Student Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage student admissions, classroom rosters, verification, and
            documents for Adiya School.
          </p>
        </div>
        {canManageStudents && (
          <button
            onClick={() => {
              resetEnroll();
              handleGenerateAdmission();
              setIsEnrollModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            Enroll New Student
          </button>
        )}
      </div>
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center gap-3 justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto flex-1">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, roll, email, or admission..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>
          <div className="w-44">
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
            >
              <option value="">All Classes</option>
              {classData?.classes?.map((c: any) => (
                <option key={c._id} value={c._id}>
                  {c.name} - Section {c.section}
                </option>
              ))}
            </select>
          </div>
          <div className="w-36">
            <select
              value={selectedFeeStatus}
              onChange={(e) => {
                setSelectedFeeStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
            >
              <option value="">All Fees</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="unpaid">Unpaid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div className="w-36">
            <select
              value={selectedDirectoryStatus}
              onChange={(e) => {
                setSelectedDirectoryStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
            >
              <option value="active">Active Directory</option>
              <option value="archived">Archived (Soft Deleted)</option>
              <option value="all">All Records</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium shrink-0">
          Showing <strong>{data?.students?.length || 0}</strong> of{' '}
          <strong>{data?.pagination?.total || 0}</strong> students
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Roll No</th>
                <th className="px-5 py-3.5">Student Details</th>
                <th className="px-5 py-3.5">Admission No</th>
                <th className="px-5 py-3.5">Class & Section</th>
                <th className="px-5 py-3.5">Parent / Guardian</th>
                <th className="px-5 py-3.5">Fee Status</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
                    Loading student directory...
                  </td>
                </tr>
              ) : data?.students?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No students match the criteria.
                  </td>
                </tr>
              ) : (
                data?.students?.map((student: any) => (
                  <tr
                    key={student._id}
                    onClick={() => {
                      setSelectedStudentId(student._id);
                      setActiveTab('overview');
                    }}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                  >
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-700">
                      #{student.rollNumber}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        {student.photo ? (
                          <img
                            src={student.photo}
                            alt={student.name}
                            className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {student.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-slate-800">
                            {student.name}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {student.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-600 text-[11px]">
                      {student.admissionNumber}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-700">
                      <div>
                        {student.className} - {student.section}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {student.classTeacherName
                          ? `Teacher: ${student.classTeacherName}`
                          : 'Class teacher not assigned'}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {student.parentName ? (
                        <div>
                          <div className="font-medium text-slate-800">
                            {student.parentName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {student.parentPhone}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge status={student.feeStatus} variant="fee" />
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          student.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : student.status === 'archived'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {student.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            setSelectedStudentId(student._id);
                            setActiveTab('overview');
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                          title="View complete profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canManageStudents && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(student)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Edit student"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {student.status === 'archived' ? (
                              <button
                                onClick={() =>
                                  restoreMutation.mutate(student._id)
                                }
                                className="p-1.5 rounded-lg text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                                title="Restore student"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  if (
                                    confirm(
                                      `Archive student ${student.name}? This will deactivate their login.`
                                    )
                                  ) {
                                    archiveMutation.mutate(student._id);
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
      <Drawer
        isOpen={!!selectedStudentId}
        onClose={() => {
          setSelectedStudentId(null);
          setSelectedPdfFile(null);
          setPdfFileError(null);
          setDocUploadError(null);
          resetDoc();
          if (fileInputRef.current) fileInputRef.current.value = '';
        }}
        title="Student Profile & Records"
        subtitle={studentDetail?.student?.name}
        width="max-w-2xl"
      >
        {isLoadingDetail ? (
          <div className="py-16 text-center text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin mx-auto mb-2 text-brand-500" />
            Loading complete student profile...
          </div>
        ) : studentDetail?.student ? (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/80 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {studentDetail.student.photo ? (
                  <img
                    src={studentDetail.student.photo}
                    alt={studentDetail.student.name}
                    className="w-14 h-14 rounded-2xl object-cover shrink-0 shadow-sm border border-orange-200"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-brand-500 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-sm">
                    {studentDetail.student.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-base text-slate-800">
                    {studentDetail.student.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {studentDetail.student.classSectionId?.name} - Section{' '}
                    {studentDetail.student.classSectionId?.section} • Roll #
                    {studentDetail.student.rollNumber}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white text-slate-700 font-mono font-bold border border-slate-200">
                      {studentDetail.student.admissionNumber}
                    </span>
                    <Badge status={studentDetail.student.status} />
                  </div>
                </div>
              </div>

              {canManageStudents && (
                <button
                  onClick={() => handleOpenEdit(studentDetail.student)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Profile
                </button>
              )}
            </div>
            <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto text-xs pb-px">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'attendance', label: 'Attendance' },
                { id: 'marks', label: 'Marks & Grades' },
                { id: 'fees', label: 'Fee History' },
                {
                  id: 'documents',
                  label: `Documents (${studentDetail.student.documents?.length || 0})`,
                },
                { id: 'enrollment', label: 'Enrollment' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-2 font-semibold transition-all border-b-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-brand-500 text-brand-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 text-xs">
                  <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Personal & Contact Details
                  </h4>
                  <div className="grid grid-cols-2 gap-3.5 text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[11px]">
                        Email Address
                      </span>
                      <span className="font-medium text-slate-800">
                        {studentDetail.student.email}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">
                        Gender
                      </span>
                      <span className="font-medium text-slate-800 capitalize">
                        {studentDetail.student.gender}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">
                        Date of Birth
                      </span>
                      <span className="font-medium text-slate-800">
                        {new Date(
                          studentDetail.student.dateOfBirth
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">
                        Blood Group
                      </span>
                      <span className="font-medium text-slate-800">
                        {studentDetail.student.bloodGroup || 'Not specified'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">
                        Emergency Contact
                      </span>
                      <span className="font-medium text-slate-800">
                        {studentDetail.student.emergencyContact ||
                          'None provided'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">
                        Residential Address
                      </span>
                      <span className="font-medium text-slate-800">
                        {studentDetail.student.address ||
                          'Adiya Campus, Bangalore'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 text-xs">
                  <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Verified Parent / Guardian Links
                  </h4>
                  {studentDetail.student.parentIds?.length === 0 ? (
                    <div className="p-3 bg-slate-50 rounded-xl text-slate-400 text-xs">
                      No linked parents found. You can link a verified parent
                      from the Edit modal.
                    </div>
                  ) : (
                    studentDetail.student.parentIds.map((p: any) => (
                      <div
                        key={p._id}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-800 flex items-center gap-2">
                            <span>{p.name}</span>
                            <span className="px-2 py-0.2 rounded-full text-[10px] bg-blue-50 text-blue-700 capitalize border border-blue-200">
                              {p.relationship || 'Guardian'}
                            </span>
                          </div>
                          <div className="text-slate-500 text-[11px] flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {p.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {p.phone}
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                          Active Link
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                      Assigned Class Teacher
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                      {studentDetail.student.classSectionId?.name} - {studentDetail.student.classSectionId?.section}
                    </span>
                  </div>
                  {studentDetail.classTeacher ? (
                    <div className="p-3.5 rounded-xl bg-orange-50/50 border border-orange-200 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                          <span>{studentDetail.classTeacher.name}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-brand-50 text-brand-700 font-semibold border border-brand-200">
                            Class Teacher
                          </span>
                        </div>
                        <div className="text-slate-500 text-[11px] flex flex-wrap items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {studentDetail.classTeacher.email}
                          </span>
                          {studentDetail.classTeacher.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {studentDetail.classTeacher.phone}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                          {studentDetail.classTeacher.qualification && (
                            <span className="px-2 py-0.5 rounded-md bg-white border border-orange-200 text-orange-700 font-semibold text-[10px]">
                              {studentDetail.classTeacher.qualification}
                            </span>
                          )}
                          {studentDetail.classTeacher.specialization && (
                            <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[10px]">
                              {studentDetail.classTeacher.specialization}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-xl text-slate-400 text-xs italic">
                      Class teacher not assigned
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === 'attendance' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                  <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Attendance Statistics
                  </h4>
                  <div className="grid grid-cols-4 gap-2.5 text-center">
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                      <span className="text-xl font-black text-emerald-700 block">
                        {studentDetail.attendance?.rate}%
                      </span>
                      <span className="text-[10px] text-emerald-600 font-semibold">
                        Overall Rate
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-xl font-bold text-slate-700 block">
                        {studentDetail.attendance?.present}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        Days Present
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                      <span className="text-xl font-bold text-amber-700 block">
                        {studentDetail.attendance?.late}
                      </span>
                      <span className="text-[10px] text-amber-600 font-semibold">
                        Late Marks
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
                      <span className="text-xl font-bold text-rose-700 block">
                        {studentDetail.attendance?.absent}
                      </span>
                      <span className="text-[10px] text-rose-600 font-semibold">
                        Days Absent
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-white">
                  <p className="text-xs text-slate-500">
                    Attendance records are marked daily by the assigned class
                    teacher according to the Adiya academic schedule.
                  </p>
                </div>
              </div>
            )}
            {activeTab === 'marks' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                  <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Academic Performance Summary
                  </h4>
                  {studentDetail.marksSummary?.length === 0 ? (
                    <p className="text-slate-400 py-3 text-center">
                      No published examination grades found for this student.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {studentDetail.marksSummary?.map(
                        (m: any, idx: number) => (
                          <div
                            key={idx}
                            className="py-2.5 flex items-center justify-between"
                          >
                            <div>
                              <span className="font-bold text-slate-800 text-xs block">
                                {m.subjectName}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {m.examName}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-bold text-slate-800 text-xs">
                                {m.marksObtained} / {m.maxMarks}
                              </span>
                              <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 font-bold">
                                Grade {m.grade}
                              </span>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === 'fees' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                  <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Tuition & Fee Invoices
                  </h4>
                  {studentDetail.invoices?.length === 0 ? (
                    <p className="text-slate-400 py-3 text-center">
                      No fee invoices recorded.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {studentDetail.invoices?.map((inv: any) => (
                        <div
                          key={inv._id}
                          className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                        >
                          <div>
                            <div className="font-bold text-slate-800">
                              {inv.title}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              Invoice: {inv.invoiceNumber} • Due {inv.dueDate}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-bold text-slate-800">
                              ₹{inv.totalAmount?.toLocaleString()}
                            </div>
                            <Badge status={inv.status} variant="fee" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === 'documents' && (
              <div className="space-y-4 text-xs">
                {canManageStudents && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setDocUploadError(null);
                      if (!selectedPdfFile) {
                        setPdfFileError('Please select a PDF document (.pdf) to attach.');
                        return;
                      }
                      handleSubmitDoc((doc) => {
                        const finalTitle = (
                          doc.title?.trim() ||
                          selectedPdfFile.name.replace(/\.[^/.]+$/, '')
                        ).trim();

                        if (!finalTitle || finalTitle.length < 1) {
                          setDocUploadError('Document title is required.');
                          return;
                        }

                        const formData = new FormData();
                        formData.append('title', finalTitle);
                        formData.append('docType', doc.docType || 'birth_certificate');
                        formData.append('file', selectedPdfFile);
                        addDocMutation.mutate({
                          id: studentDetail.student._id,
                          data: formData,
                        });
                      })(e);
                    }}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
                  >
                    <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-brand-500" />
                      Attach New Document
                    </h4>

                    {docUploadError && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between animate-in fade-in duration-200">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>{docUploadError}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDocUploadError(null)}
                          className="text-rose-600 font-bold ml-3 hover:text-rose-800"
                        >
                          ×
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Document Title <span className="text-rose-500">*</span>
                        </label>
                        <input
                          {...registerDoc('title')}
                          placeholder="e.g. Birth Certificate"
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                        {docErrors.title && (
                          <span className="text-[10px] text-rose-500">
                            {docErrors.title.message}
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Document Type <span className="text-rose-500">*</span>
                        </label>
                        <select
                          {...registerDoc('docType')}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                        >
                          <option value="birth_certificate">
                            Birth Certificate
                          </option>
                          <option value="transfer_certificate">
                            Transfer Certificate
                          </option>
                          <option value="id_proof">ID Proof / Aadhaar</option>
                          <option value="medical_record">Medical Record</option>
                          <option value="previous_marksheet">
                            Previous Marksheet
                          </option>
                          <option value="other">Other Document</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          PDF Document (Max 5 MB) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="application/pdf,.pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (
                                !file.name.toLowerCase().endsWith('.pdf') &&
                                file.type !== 'application/pdf'
                              ) {
                                setPdfFileError(
                                  'Only PDF documents (.pdf) are permitted.'
                                );
                                setSelectedPdfFile(null);
                                return;
                              }
                              if (file.size > 5 * 1024 * 1024) {
                                setPdfFileError('File size exceeds 5 MB.');
                                setSelectedPdfFile(null);
                                return;
                              }
                              setPdfFileError(null);
                              setSelectedPdfFile(file);
                              setDocUploadError(null);
                              const currentTitle = getValuesDoc('title');
                              if (!currentTitle || currentTitle.trim() === '') {
                                const defTitle = file.name
                                  .replace(/\.[^/.]+$/, '')
                                  .trim();
                                if (defTitle.length >= 1) {
                                  setValueDoc('title', defTitle);
                                }
                              }
                            }
                          }}
                          className="w-full text-xs text-slate-500 file:mr-2.5 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-orange-50 file:text-brand-600 hover:file:bg-orange-100 cursor-pointer"
                        />
                        {pdfFileError && (
                          <span className="text-[10px] text-rose-500 block mt-0.5">
                            {pdfFileError}
                          </span>
                        )}
                        {selectedPdfFile && (
                          <div className="flex items-center justify-between mt-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            <span className="truncate">
                              Selected: <strong>{selectedPdfFile.name}</strong> ({(selectedPdfFile.size / 1024).toFixed(1)} KB)
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPdfFile(null);
                                setPdfFileError(null);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                              }}
                              className="text-slate-400 hover:text-rose-600 font-bold ml-2 text-xs"
                              title="Remove selected file"
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={addDocMutation.isPending || !selectedPdfFile || !!pdfFileError}
                        className="px-3.5 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {addDocMutation.isPending
                          ? 'Uploading & Attaching...'
                          : 'Attach Document'}
                      </button>
                    </div>
                  </form>
                )}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                  <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Archived Verification Documents
                  </h4>
                  {studentDetail.student.documents?.length === 0 ? (
                    <p className="text-slate-400 py-3 text-center">
                      No documents currently attached.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {studentDetail.student.documents?.map((doc: any) => (
                        <div
                          key={doc._id}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2.5">
                            <FileText className="w-5 h-5 text-brand-500 shrink-0" />
                            <div>
                              <div className="font-bold text-slate-800">
                                {doc.title}
                              </div>
                              <div className="text-[10px] text-slate-400 capitalize">
                                {doc.docType.replace('_', ' ')} • Uploaded{' '}
                                {new Date(doc.uploadedAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 text-[11px] font-semibold hover:bg-slate-100"
                            >
                              View
                            </a>
                            {canManageStudents && (
                              <button
                                onClick={() =>
                                  deleteDocMutation.mutate({
                                    id: studentDetail.student._id,
                                    docId: doc._id,
                                  })
                                }
                                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                                title="Remove document"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === 'enrollment' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                  <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Academic Enrollment History
                  </h4>
                  {studentDetail.student.enrollmentHistory?.length === 0 ? (
                    <p className="text-slate-400 py-3 text-center">
                      No enrollment history logged.
                    </p>
                  ) : (
                    <div className="space-y-3 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                      {studentDetail.student.enrollmentHistory?.map(
                        (rec: any, idx: number) => (
                          <div
                            key={idx}
                            className="relative pl-8 flex items-start justify-between"
                          >
                            <div className="absolute left-2 top-1.5 w-3 h-3 rounded-full bg-brand-500 border-2 border-white ring-2 ring-brand-100" />
                            <div>
                              <div className="font-bold text-slate-800">
                                Session {rec.academicYear} - {rec.className}{' '}
                                (Sec {rec.section})
                              </div>
                              <div className="text-[11px] text-slate-400">
                                Roll No #{rec.rollNumber} • Enrolled on{' '}
                                {new Date(rec.enrolledAt).toLocaleDateString()}
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {rec.status.toUpperCase()}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Drawer>
      <Modal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        title="Enroll New Student"
        subtitle="Adiya School Admissions & Auto-Credential Generation"
        maxWidth="max-w-2xl"
      >
        <form
          onSubmit={handleSubmitEnroll((data) => enrollMutation.mutate(data))}
          className="space-y-4 text-xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Student Full Name *
              </label>
              <input
                {...registerEnroll('name')}
                placeholder="e.g. Diya Sharma"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
              {enrollErrors.name && (
                <span className="text-[10px] text-rose-500">
                  {enrollErrors.name.message}
                </span>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Student Email Address *
              </label>
              <input
                type="email"
                {...registerEnroll('email')}
                placeholder="diya.sharma@adiya.edu"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
              {enrollErrors.email && (
                <span className="text-[10px] text-rose-500">
                  {enrollErrors.email.message}
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">
                  Admission Number
                </label>
                <button
                  type="button"
                  onClick={handleGenerateAdmission}
                  className="text-[10px] text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> Auto-Generate
                </button>
              </div>
              <input
                {...registerEnroll('admissionNumber')}
                placeholder="ADM-2026-0001"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Class Roll Number *
              </label>
              <input
                {...registerEnroll('rollNumber')}
                placeholder="101"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
              {enrollErrors.rollNumber && (
                <span className="text-[10px] text-rose-500">
                  {enrollErrors.rollNumber.message}
                </span>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Class & Section *
              </label>
              <select
                {...registerEnroll('classSectionId')}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white cursor-pointer"
              >
                <option value="">Select Class Section</option>
                {classData?.classes?.map((c: any) => (
                  <option key={c._id} value={c._id}>
                    {c.name} - Section {c.section}
                  </option>
                ))}
              </select>
              {enrollErrors.classSectionId && (
                <span className="text-[10px] text-rose-500">
                  {enrollErrors.classSectionId.message}
                </span>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Gender
              </label>
              <select
                {...registerEnroll('gender')}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                {...registerEnroll('dateOfBirth')}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Blood Group
              </label>
              <input
                {...registerEnroll('bloodGroup')}
                placeholder="B+"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-brand-500" />
                Parent / Guardian Association
              </h4>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setParentMode('new')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    parentMode === 'new'
                      ? 'bg-brand-500 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  New Parent
                </button>
                <button
                  type="button"
                  onClick={() => setParentMode('existing')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    parentMode === 'existing'
                      ? 'bg-brand-500 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  Link Existing
                </button>
              </div>
            </div>

            {parentMode === 'existing' ? (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Select Existing Registered Parent
                </label>
                <select
                  {...registerEnroll('existingParentId')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  <option value="">
                    -- Choose from existing parents list --
                  </option>
                  {parentsData?.parents?.map((p: any) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.email} • {p.phone})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Enables one parent account to manage multiple children across
                  different classes.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Parent Full Name
                  </label>
                  <input
                    {...registerEnroll('parentName')}
                    placeholder="e.g. Sunita Sharma"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Parent Email
                  </label>
                  <input
                    type="email"
                    {...registerEnroll('parentEmail')}
                    placeholder="sunita.sharma@gmail.com"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Parent Phone
                  </label>
                  <input
                    {...registerEnroll('parentPhone')}
                    placeholder="+91 98450 11223"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs"
                  />
                </div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Initial Term Tuition Fee (INR)
              </label>
              <input
                type="number"
                {...registerEnroll('initialFeeAmount', { valueAsNumber: true })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Emergency Contact Phone
              </label>
              <input
                {...registerEnroll('emergencyContact')}
                placeholder="+91 98450 99887"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsEnrollModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={enrollMutation.isPending}
              className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {enrollMutation.isPending
                ? 'Enrolling...'
                : 'Confirm Admission & Issue Credentials'}
            </button>
          </div>
        </form>
      </Modal>
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setStudentToEdit(null);
        }}
        title="Edit Student Information"
        subtitle={studentToEdit?.name}
        maxWidth="max-w-xl"
      >
        <form
          onSubmit={handleSubmitEdit((data) =>
            updateMutation.mutate({ id: studentToEdit._id, data })
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
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                {...registerEdit('email')}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Roll Number
              </label>
              <input
                {...registerEdit('rollNumber')}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Class Section
              </label>
              <select
                {...registerEdit('classSectionId')}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
              >
                {classData?.classes?.map((c: any) => (
                  <option key={c._id} value={c._id}>
                    {c.name} - Section {c.section}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Status
              </label>
              <select
                {...registerEdit('status')}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="transferred">Transferred</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Emergency Contact
              </label>
              <input
                {...registerEdit('emergencyContact')}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setIsEditModalOpen(false);
                setStudentToEdit(null);
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
