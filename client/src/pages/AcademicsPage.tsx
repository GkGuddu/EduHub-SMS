import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { academicsApi, teachersApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common';
import { EmptyState } from '../components/common';
import {
  BookOpen,
  School,
  Users,
  Plus,
  Layers,
  Calendar,
  Settings,
  CalendarCheck,
  CheckCircle2,
  Trash2,
  Edit2,
  Search,
  Check,
  Building,
  Sparkles,
  Loader2,
  Save,
  Tag,
} from 'lucide-react';

export const AcademicsPage: React.FC = () => {
  const { user, school } = useAuth();
  const queryClient = useQueryClient();

  type TabType =
    | 'academic-years'
    | 'classes'
    | 'subjects'
    | 'working-days'
    | 'profile'
    | 'allocations';

  const [activeTab, setActiveTab] = useState<TabType>('classes');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSessionFilter, setSelectedSessionFilter] = useState('');

  const [isAddYearOpen, setIsAddYearOpen] = useState(false);
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [isEditClassOpen, setIsEditClassOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);

  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isAssignTeacherOpen, setIsAssignTeacherOpen] = useState(false);

  const [yearForm, setYearForm] = useState({
    name: '',
    startDate: '2025-04-01',
    endDate: '2026-03-31',
    isCurrent: false,
    description: '',
  });

  const [classForm, setClassForm] = useState({
    name: '',
    section: 'A',
    roomNumber: '',
    capacity: 35,
    classTeacherId: '',
    academicYear: '2025-2026',
    academicYearId: '',
  });

  const [subjectForm, setSubjectForm] = useState({
    name: '',
    code: '',
    description: '',
    type: 'core' as 'core' | 'elective' | 'extracurricular',
    credits: 3,
  });

  const [eventForm, setEventForm] = useState({
    title: '',
    eventType: 'event' as 'holiday' | 'event' | 'meeting' | 'exam' | 'other',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    isHoliday: false,
    description: '',
    targetAudience: 'all' as 'all' | 'teachers' | 'students' | 'parents',
  });

  const [assignForm, setAssignForm] = useState({
    classSectionId: '',
    subjectId: '',
    teacherId: '',
  });

  const [profileForm, setProfileForm] = useState({
    name: school?.name || 'Adiya School of Excellence',
    code: school?.code || 'ADIYA',
    address: school?.address || '14 Knowledge Park, Bengaluru',
    phone: school?.phone || '+91 80 4123 4567',
    email: school?.email || 'info@adiya.edu',
    website: school?.website || 'https://adiya.edu',
    logo: school?.logo || '',
    academicYear: school?.academicYear || '2025-2026',
    primaryColor: '#f97316',
    secondaryColor: '#0284c7',
    tagline: 'Inspiring young minds towards leadership and academic brilliance',
  });

  const [selectedWorkingDays, setSelectedWorkingDays] = useState<string[]>([
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ]);

  const { data: yearsData, isLoading: loadingYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => academicsApi.getAcademicYears(),
  });

  const { data: classesData, isLoading: loadingClasses } = useQuery({
    queryKey: ['classes', selectedSessionFilter, searchQuery],
    queryFn: () =>
      academicsApi.getClasses({
        academicYear: selectedSessionFilter || undefined,
        search: searchQuery || undefined,
      }),
  });

  const { data: subjectsData, isLoading: loadingSubjects } = useQuery({
    queryKey: ['subjects', searchQuery],
    queryFn: () =>
      academicsApi.getSubjects({ search: searchQuery || undefined }),
  });

  const { data: allocationsData, isLoading: loadingAllocations } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => academicsApi.getAssignments(),
  });

  const { data: eventsData, isLoading: loadingEvents } = useQuery({
    queryKey: ['calendar-events'],
    queryFn: () => academicsApi.getCalendarEvents(),
  });

  const { data: workingDaysData } = useQuery({
    queryKey: ['working-days'],
    queryFn: async () => {
      const res = await academicsApi.getWorkingDays();
      if (res.success && res.workingDays) {
        setSelectedWorkingDays(res.workingDays);
      }
      return res;
    },
  });

  const { data: profileData } = useQuery({
    queryKey: ['school-profile'],
    queryFn: async () => {
      const res = await academicsApi.getSchoolProfile();
      if (res.success && res.school) {
        const s = res.school;
        setProfileForm({
          name: s.name || '',
          code: s.code || '',
          address: s.address || '',
          phone: s.phone || '',
          email: s.email || '',
          website: s.website || '',
          logo: s.logo || '',
          academicYear: s.academicYear || '2025-2026',
          primaryColor: s.branding?.primaryColor || '#f97316',
          secondaryColor: s.branding?.secondaryColor || '#0284c7',
          tagline: s.branding?.tagline || 'Excellence in Education',
        });
      }
      return res;
    },
  });

  const { data: teachersData } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => teachersApi.getTeachers(),
  });

  const createYearMutation = useMutation({
    mutationFn: (data: any) => academicsApi.createAcademicYear(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-years'] });
      setIsAddYearOpen(false);
      setYearForm({
        name: '',
        startDate: '2025-04-01',
        endDate: '2026-03-31',
        isCurrent: false,
        description: '',
      });
    },
    onError: (err: any) =>
      alert(err.message || 'Failed to create academic year'),
  });

  const setYearCurrentMutation = useMutation({
    mutationFn: (id: string) => academicsApi.setCurrentAcademicYear(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-years'] });
      queryClient.invalidateQueries({ queryKey: ['school-profile'] });
    },
  });

  const deleteYearMutation = useMutation({
    mutationFn: (id: string) => academicsApi.deleteAcademicYear(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['academic-years'] }),
    onError: (err: any) =>
      alert(err.message || 'Failed to delete academic year'),
  });

  const createClassMutation = useMutation({
    mutationFn: (data: any) => academicsApi.createClass(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setIsAddClassOpen(false);
      setClassForm({
        name: '',
        section: 'A',
        roomNumber: '',
        capacity: 35,
        classTeacherId: '',
        academicYear: '2025-2026',
        academicYearId: '',
      });
    },
    onError: (err: any) => alert(err.message || 'Failed to create class'),
  });

  const updateClassMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      academicsApi.updateClass(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setIsEditClassOpen(false);
      setSelectedClass(null);
    },
    onError: (err: any) => alert(err.message || 'Failed to update class'),
  });

  const deleteClassMutation = useMutation({
    mutationFn: (id: string) => academicsApi.deleteClass(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['classes'] }),
    onError: (err: any) => alert(err.message || 'Failed to delete class'),
  });

  const createSubjectMutation = useMutation({
    mutationFn: (data: any) => academicsApi.createSubject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setIsAddSubjectOpen(false);
      setSubjectForm({
        name: '',
        code: '',
        description: '',
        type: 'core',
        credits: 3,
      });
    },
    onError: (err: any) => alert(err.message || 'Failed to create subject'),
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: (id: string) => academicsApi.deleteSubject(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subjects'] }),
  });

  const createEventMutation = useMutation({
    mutationFn: (data: any) => academicsApi.createCalendarEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      setIsAddEventOpen(false);
      setEventForm({
        title: '',
        eventType: 'event',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        isHoliday: false,
        description: '',
        targetAudience: 'all',
      });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: (id: string) => academicsApi.deleteCalendarEvent(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] }),
  });

  const updateWorkingDaysMutation = useMutation({
    mutationFn: (days: string[]) =>
      academicsApi.updateWorkingDays({ workingDays: days as any }),
    onSuccess: () => alert('Working days configuration saved!'),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) =>
      academicsApi.updateSchoolProfile({
        name: data.name,
        code: data.code,
        address: data.address,
        phone: data.phone,
        email: data.email,
        website: data.website,
        logo: data.logo,
        academicYear: data.academicYear,
        branding: {
          primaryColor: data.primaryColor,
          secondaryColor: data.secondaryColor,
          tagline: data.tagline,
        },
      }),
    onSuccess: () => alert('School profile and branding updated successfully!'),
  });

  const assignTeacherMutation = useMutation({
    mutationFn: (data: any) => academicsApi.assignSubjectTeacher(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      setIsAssignTeacherOpen(false);
    },
  });

  const deleteAssignMutation = useMutation({
    mutationFn: (id: string) => academicsApi.deleteAssignment(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['assignments'] }),
  });

  const daysOfWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  const toggleDay = (d: string) => {
    if (selectedWorkingDays.includes(d)) {
      if (selectedWorkingDays.length === 1) return;
      setSelectedWorkingDays(selectedWorkingDays.filter((x) => x !== d));
    } else {
      setSelectedWorkingDays([...selectedWorkingDays, d]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              School Setup & Academics
            </h1>
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
              Adiya
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Master structure configuration, sessions, divisions, curricula,
            holidays, and school branding.
          </p>
        </div>
        {user?.role === 'admin' && (
          <div className="flex items-center gap-2">
            {activeTab === 'academic-years' && (
              <button
                onClick={() => setIsAddYearOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" /> Add Academic Session
              </button>
            )}
            {activeTab === 'classes' && (
              <button
                onClick={() => setIsAddClassOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" /> Add Class & Section
              </button>
            )}
            {activeTab === 'subjects' && (
              <button
                onClick={() => setIsAddSubjectOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" /> Add Subject
              </button>
            )}
            {activeTab === 'working-days' && (
              <button
                onClick={() => setIsAddEventOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" /> Add Calendar Event
              </button>
            )}
            {activeTab === 'allocations' && (
              <button
                onClick={() => setIsAssignTeacherOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" /> Assign Faculty
              </button>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveTab('classes')}
          className={`px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'classes'
              ? 'bg-brand-50 text-brand-700 border border-brand-200 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <School className="w-4 h-4" />
          Classes & Sections
        </button>
        <button
          onClick={() => setActiveTab('subjects')}
          className={`px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'subjects'
              ? 'bg-brand-50 text-brand-700 border border-brand-200 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Subjects Curriculum
        </button>
        <button
          onClick={() => setActiveTab('academic-years')}
          className={`px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'academic-years'
              ? 'bg-brand-50 text-brand-700 border border-brand-200 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Academic Years
        </button>
        <button
          onClick={() => setActiveTab('working-days')}
          className={`px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'working-days'
              ? 'bg-brand-50 text-brand-700 border border-brand-200 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          Working Days & Holidays
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'profile'
              ? 'bg-brand-50 text-brand-700 border border-brand-200 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building className="w-4 h-4" />
          School Profile & Branding
        </button>
        <button
          onClick={() => setActiveTab('allocations')}
          className={`px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'allocations'
              ? 'bg-brand-50 text-brand-700 border border-brand-200 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          Faculty Allocations
        </button>
      </div>
      {activeTab === 'classes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search class, section, room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Session:</span>
              <select
                value={selectedSessionFilter}
                onChange={(e) => setSelectedSessionFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl font-semibold text-slate-700 focus:outline-none"
              >
                <option value="">All Sessions</option>
                {yearsData?.academicYears?.map((ay: any) => (
                  <option key={ay._id} value={ay.name}>
                    {ay.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingClasses ? (
              <div className="col-span-3 py-16 text-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-500" />
                Loading classes...
              </div>
            ) : (classesData?.classes || []).length === 0 ? (
              <div className="col-span-3">
                <EmptyState
                  title="No classes found"
                  description="Add classes and sections for your school to start enrolling students."
                  actionLabel="Add New Class"
                  onAction={() => setIsAddClassOpen(true)}
                />
              </div>
            ) : (
              classesData?.classes?.map((c: any) => (
                <div
                  key={c._id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 text-brand-600 border border-orange-200 flex items-center justify-center font-bold text-sm">
                        {c.section}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {c.roomNumber || 'Room 101'}
                        </span>
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => {
                              setSelectedClass(c);
                              setIsEditClassOpen(true);
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                            title="Edit class"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <h3 className="font-bold text-base text-slate-800 mb-1">
                      {c.name} - Section {c.section}
                    </h3>
                    <p className="text-xs text-slate-500 mb-2">
                      Class Teacher:{' '}
                      <strong>{c.classTeacherName || 'Unassigned'}</strong>
                    </p>
                    <span className="text-[11px] text-slate-400 font-medium block mb-4">
                      Session: {c.academicYear}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Enrolled Students</span>
                    <span className="font-bold text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                      {c.studentCount} / {c.capacity || 40}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      {activeTab === 'subjects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search subject code, name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <span className="text-xs text-slate-500">
              Total Subjects:{' '}
              <strong>{(subjectsData?.subjects || []).length}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingSubjects ? (
              <div className="col-span-3 py-16 text-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-500" />
                Loading curriculum...
              </div>
            ) : (subjectsData?.subjects || []).length === 0 ? (
              <div className="col-span-3">
                <EmptyState
                  title="No subjects registered"
                  description="Define syllabus subjects with unique subject codes to link teachers and timetable."
                  actionLabel="Add Subject"
                  onAction={() => setIsAddSubjectOpen(true)}
                />
              </div>
            ) : (
              subjectsData?.subjects?.map((s: any) => (
                <div
                  key={s._id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        {s.code}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {s.type || 'core'}
                        </span>
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => {
                              if (confirm(`Delete subject ${s.name}?`)) {
                                deleteSubjectMutation.mutate(s._id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="Delete subject"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <h3 className="font-bold text-base text-slate-800 mt-2 mb-1">
                      {s.name}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                      {s.description || 'Core syllabus module'}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Credits: {s.credits || 3}</span>
                    <span>School Curriculum</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      {activeTab === 'academic-years' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-800">
                Academic Sessions
              </h3>
              <p className="text-xs text-slate-500">
                Only one session can be active at a time. All students and
                grades are mapped by academic session.
              </p>
            </div>
          </div>

          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Session Name</th>
                <th className="px-6 py-3.5">Start Date</th>
                <th className="px-6 py-3.5">End Date</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loadingYears ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
                    Loading academic years...
                  </td>
                </tr>
              ) : (
                yearsData?.academicYears?.map((ay: any) => (
                  <tr
                    key={ay._id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-brand-500" />
                      {ay.name}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(ay.startDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(ay.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {ay.isCurrent ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Current
                          Session
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user?.role === 'admin' && (
                        <div className="flex items-center justify-end gap-2">
                          {!ay.isCurrent && (
                            <button
                              onClick={() =>
                                setYearCurrentMutation.mutate(ay._id)
                              }
                              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 transition-colors"
                            >
                              Make Current
                            </button>
                          )}
                          {!ay.isCurrent && (
                            <button
                              onClick={() => {
                                if (confirm(`Delete session ${ay.name}?`)) {
                                  deleteYearMutation.mutate(ay._id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              title="Delete session"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {activeTab === 'working-days' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-sm text-slate-800 mb-1">
              Campus Working Days
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Select which days timetable and attendance sessions run at Adiya
              School.
            </p>

            <div className="space-y-2 mb-6">
              {daysOfWeek.map((day) => {
                const isActive = selectedWorkingDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`w-full p-3 rounded-xl border flex items-center justify-between text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-brand-50/80 border-brand-300 text-brand-900'
                        : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    <span>{day}</span>
                    {isActive ? (
                      <span className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 uppercase font-mono">
                        Off
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() =>
                updateWorkingDaysMutation.mutate(selectedWorkingDays)
              }
              disabled={updateWorkingDaysMutation.isPending}
              className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all"
            >
              <Save className="w-4 h-4" />
              {updateWorkingDaysMutation.isPending
                ? 'Saving...'
                : 'Save Working Days'}
            </button>
          </div>
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-800">
                  School Calendar & Holidays
                </h3>
                <p className="text-xs text-slate-500">
                  Scheduled breaks, parent-teacher meetings, health camps, and
                  exams
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {loadingEvents ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
                  Loading calendar events...
                </div>
              ) : (eventsData?.events || []).length === 0 ? (
                <EmptyState
                  title="No events added"
                  description="Add holidays, parent-teacher meetings, and assessments to the school calendar."
                  actionLabel="Add Calendar Event"
                  onAction={() => setIsAddEventOpen(true)}
                />
              ) : (
                eventsData?.events?.map((ev: any) => (
                  <div
                    key={ev._id}
                    className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 flex items-start justify-between gap-4 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 font-bold ${
                          ev.isHoliday
                            ? 'bg-rose-50 text-rose-600 border border-rose-200'
                            : ev.eventType === 'meeting'
                              ? 'bg-purple-50 text-purple-600 border border-purple-200'
                              : 'bg-brand-50 text-brand-600 border border-brand-200'
                        }`}
                      >
                        <span className="text-[10px] uppercase">
                          {new Date(ev.startDate).toLocaleDateString('en-US', {
                            month: 'short',
                          })}
                        </span>
                        <span className="text-sm font-black">
                          {new Date(ev.startDate).getDate()}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-800 text-xs sm:text-sm">
                            {ev.title}
                          </h4>
                          <span
                            className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${
                              ev.isHoliday
                                ? 'bg-rose-100 text-rose-800'
                                : ev.eventType === 'meeting'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {ev.eventType}
                          </span>
                        </div>
                        {ev.description && (
                          <p className="text-xs text-slate-500 mt-1">
                            {ev.description}
                          </p>
                        )}
                        <div className="mt-1.5 flex items-center gap-4 text-[11px] text-slate-400">
                          <span>
                            Dates:{' '}
                            {ev.startDate === ev.endDate
                              ? ev.startDate
                              : `${ev.startDate} to ${ev.endDate}`}
                          </span>
                          <span>Audience: {ev.targetAudience}</span>
                        </div>
                      </div>
                    </div>

                    {user?.role === 'admin' && (
                      <button
                        onClick={() => {
                          if (confirm(`Remove calendar event: ${ev.title}?`)) {
                            deleteEventMutation.mutate(ev._id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Delete event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-3xl">
          <h3 className="font-bold text-sm text-slate-800 mb-1">
            School Profile & Branding
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Configure institute identification, contact information, theme
            accent colors, and tagline.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateProfileMutation.mutate(profileForm);
            }}
            className="space-y-4 text-xs"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  School Name
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, name: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  School Code
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.code}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Official Email
                </label>
                <input
                  type="email"
                  required
                  value={profileForm.email}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, email: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.phone}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, phone: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Campus Address
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.address}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, address: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Website URL
                </label>
                <input
                  type="text"
                  value={profileForm.website}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, website: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Brand Tagline
                </label>
                <input
                  type="text"
                  value={profileForm.tagline}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, tagline: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all"
              >
                <Save className="w-4 h-4" />
                {updateProfileMutation.isPending
                  ? 'Saving...'
                  : 'Save Profile & Branding'}
              </button>
            </div>
          </form>
        </div>
      )}
      {activeTab === 'allocations' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Class & Section</th>
                <th className="px-6 py-3.5">Subject</th>
                <th className="px-6 py-3.5">Assigned Faculty Member</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loadingAllocations ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
                    Loading allocations...
                  </td>
                </tr>
              ) : (
                allocationsData?.assignments?.map((a: any) => (
                  <tr
                    key={a._id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {a.className} - {a.section}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {a.subjectName}
                    </td>
                    <td className="px-6 py-4 text-brand-600 font-semibold">
                      {a.teacherName}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user?.role === 'admin' && (
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `Remove teacher allocation for ${a.subjectName}?`
                              )
                            ) {
                              deleteAssignMutation.mutate(a._id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      <Modal
        isOpen={isAddYearOpen}
        onClose={() => setIsAddYearOpen(false)}
        title="Add Academic Session"
        subtitle="Adiya School Setup"
        maxWidth="max-w-md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createYearMutation.mutate(yearForm);
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Session Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 2026-2027"
              value={yearForm.name}
              onChange={(e) =>
                setYearForm({ ...yearForm, name: e.target.value })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                required
                value={yearForm.startDate}
                onChange={(e) =>
                  setYearForm({ ...yearForm, startDate: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                required
                value={yearForm.endDate}
                onChange={(e) =>
                  setYearForm({ ...yearForm, endDate: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isCurrent"
              checked={yearForm.isCurrent}
              onChange={(e) =>
                setYearForm({ ...yearForm, isCurrent: e.target.checked })
              }
              className="rounded text-brand-500 focus:ring-brand-500"
            />
            <label htmlFor="isCurrent" className="font-semibold text-slate-700">
              Set as current active academic session
            </label>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAddYearOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createYearMutation.isPending}
              className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-sm"
            >
              {createYearMutation.isPending ? 'Creating...' : 'Create Session'}
            </button>
          </div>
        </form>
      </Modal>
      <Modal
        isOpen={isAddClassOpen}
        onClose={() => setIsAddClassOpen(false)}
        title="Add Class & Section"
        subtitle="Adiya Academic Division"
        maxWidth="max-w-md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createClassMutation.mutate(classForm);
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Class Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Grade 11"
              value={classForm.name}
              onChange={(e) =>
                setClassForm({ ...classForm, name: e.target.value })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Section
              </label>
              <input
                type="text"
                required
                placeholder="A, B, C..."
                value={classForm.section}
                onChange={(e) =>
                  setClassForm({
                    ...classForm,
                    section: e.target.value.toUpperCase(),
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Room Number
              </label>
              <input
                type="text"
                placeholder="Room 402"
                value={classForm.roomNumber}
                onChange={(e) =>
                  setClassForm({ ...classForm, roomNumber: e.target.value })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Capacity
              </label>
              <input
                type="number"
                min="10"
                max="100"
                value={classForm.capacity}
                onChange={(e) =>
                  setClassForm({
                    ...classForm,
                    capacity: parseInt(e.target.value) || 40,
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Academic Session
              </label>
              <select
                value={classForm.academicYear}
                onChange={(e) =>
                  setClassForm({ ...classForm, academicYear: e.target.value })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white"
              >
                {yearsData?.academicYears?.map((ay: any) => (
                  <option key={ay._id} value={ay.name}>
                    {ay.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Class Teacher (Optional)
            </label>
            <select
              value={classForm.classTeacherId}
              onChange={(e) =>
                setClassForm({ ...classForm, classTeacherId: e.target.value })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white"
            >
              <option value="">Select Faculty Mentor</option>
              {teachersData?.teachers?.map((t: any) => (
                <option key={t.userId} value={t.userId}>
                  {t.name} ({t.specialization})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAddClassOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createClassMutation.isPending}
              className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-sm"
            >
              {createClassMutation.isPending ? 'Creating...' : 'Create Class'}
            </button>
          </div>
        </form>
      </Modal>
      <Modal
        isOpen={isEditClassOpen}
        onClose={() => {
          setIsEditClassOpen(false);
          setSelectedClass(null);
        }}
        title="Edit Class & Section"
        subtitle={
          selectedClass
            ? `${selectedClass.name} - ${selectedClass.section}`
            : ''
        }
        maxWidth="max-w-md"
      >
        {selectedClass && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateClassMutation.mutate({
                id: selectedClass._id,
                data: {
                  name: selectedClass.name,
                  section: selectedClass.section,
                  roomNumber: selectedClass.roomNumber,
                  capacity: selectedClass.capacity,
                  classTeacherId:
                    selectedClass.classTeacherId?._id ||
                    selectedClass.classTeacherId,
                },
              });
            }}
            className="space-y-4 text-xs"
          >
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Class Name
              </label>
              <input
                type="text"
                required
                value={selectedClass.name}
                onChange={(e) =>
                  setSelectedClass({ ...selectedClass, name: e.target.value })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Section
                </label>
                <input
                  type="text"
                  required
                  value={selectedClass.section}
                  onChange={(e) =>
                    setSelectedClass({
                      ...selectedClass,
                      section: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Room Number
                </label>
                <input
                  type="text"
                  value={selectedClass.roomNumber || ''}
                  onChange={(e) =>
                    setSelectedClass({
                      ...selectedClass,
                      roomNumber: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Class Teacher
              </label>
              <select
                value={
                  selectedClass.classTeacherId?._id ||
                  selectedClass.classTeacherId ||
                  ''
                }
                onChange={(e) =>
                  setSelectedClass({
                    ...selectedClass,
                    classTeacherId: e.target.value,
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white"
              >
                <option value="">Unassigned</option>
                {teachersData?.teachers?.map((t: any) => (
                  <option key={t.userId} value={t.userId}>
                    {t.name} ({t.specialization})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  if (
                    confirm(
                      `Delete class ${selectedClass.name}-${selectedClass.section}?`
                    )
                  ) {
                    deleteClassMutation.mutate(selectedClass._id);
                    setIsEditClassOpen(false);
                  }
                }}
                className="text-xs text-rose-600 font-semibold hover:underline"
              >
                Delete Class
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditClassOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateClassMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold"
                >
                  {updateClassMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        )}
      </Modal>
      <Modal
        isOpen={isAddSubjectOpen}
        onClose={() => setIsAddSubjectOpen(false)}
        title="Add Subject to Curriculum"
        subtitle="Adiya Curriculum Framework"
        maxWidth="max-w-md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createSubjectMutation.mutate(subjectForm);
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Subject Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Computer Science"
              value={subjectForm.name}
              onChange={(e) =>
                setSubjectForm({ ...subjectForm, name: e.target.value })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Subject Code
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CS-101"
                value={subjectForm.code}
                onChange={(e) =>
                  setSubjectForm({
                    ...subjectForm,
                    code: e.target.value.toUpperCase(),
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Type
              </label>
              <select
                value={subjectForm.type}
                onChange={(e) =>
                  setSubjectForm({
                    ...subjectForm,
                    type: e.target.value as any,
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white"
              >
                <option value="core">Core Subject</option>
                <option value="elective">Elective</option>
                <option value="extracurricular">Extracurricular</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Course description and learning objectives..."
              value={subjectForm.description}
              onChange={(e) =>
                setSubjectForm({ ...subjectForm, description: e.target.value })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAddSubjectOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createSubjectMutation.isPending}
              className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-sm"
            >
              {createSubjectMutation.isPending
                ? 'Creating...'
                : 'Create Subject'}
            </button>
          </div>
        </form>
      </Modal>
      <Modal
        isOpen={isAddEventOpen}
        onClose={() => setIsAddEventOpen(false)}
        title="Add Calendar Event or Holiday"
        subtitle="Adiya Event Schedule"
        maxWidth="max-w-md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createEventMutation.mutate(eventForm);
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Event Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Science & Innovation Expo"
              value={eventForm.title}
              onChange={(e) =>
                setEventForm({ ...eventForm, title: e.target.value })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Event Type
              </label>
              <select
                value={eventForm.eventType}
                onChange={(e) => {
                  const t = e.target.value as any;
                  setEventForm({
                    ...eventForm,
                    eventType: t,
                    isHoliday: t === 'holiday',
                  });
                }}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white"
              >
                <option value="event">School Event</option>
                <option value="meeting">PTM / Conference</option>
                <option value="holiday">Official Holiday</option>
                <option value="exam">Examination</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Audience
              </label>
              <select
                value={eventForm.targetAudience}
                onChange={(e) =>
                  setEventForm({
                    ...eventForm,
                    targetAudience: e.target.value as any,
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white"
              >
                <option value="all">All Stakeholders</option>
                <option value="parents">Parents Only</option>
                <option value="teachers">Teachers Only</option>
                <option value="students">Students Only</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                required
                value={eventForm.startDate}
                onChange={(e) =>
                  setEventForm({ ...eventForm, startDate: e.target.value })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                required
                value={eventForm.endDate}
                onChange={(e) =>
                  setEventForm({ ...eventForm, endDate: e.target.value })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Instructions or schedule notes..."
              value={eventForm.description}
              onChange={(e) =>
                setEventForm({ ...eventForm, description: e.target.value })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAddEventOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createEventMutation.isPending}
              className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-sm"
            >
              {createEventMutation.isPending ? 'Adding...' : 'Add Event'}
            </button>
          </div>
        </form>
      </Modal>
      <Modal
        isOpen={isAssignTeacherOpen}
        onClose={() => setIsAssignTeacherOpen(false)}
        title="Assign Faculty to Subject"
        subtitle="Class Curriculum Mapping"
        maxWidth="max-w-md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            assignTeacherMutation.mutate(assignForm);
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Class & Section
            </label>
            <select
              required
              value={assignForm.classSectionId}
              onChange={(e) =>
                setAssignForm({ ...assignForm, classSectionId: e.target.value })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white"
            >
              <option value="">Select Class</option>
              {classesData?.classes?.map((c: any) => (
                <option key={c._id} value={c._id}>
                  {c.name} - Section {c.section} ({c.academicYear})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Subject
            </label>
            <select
              required
              value={assignForm.subjectId}
              onChange={(e) =>
                setAssignForm({ ...assignForm, subjectId: e.target.value })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white"
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
              Teacher
            </label>
            <select
              required
              value={assignForm.teacherId}
              onChange={(e) =>
                setAssignForm({ ...assignForm, teacherId: e.target.value })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white"
            >
              <option value="">Select Faculty</option>
              {teachersData?.teachers?.map((t: any) => (
                <option key={t.userId} value={t.userId}>
                  {t.name} ({t.specialization})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAssignTeacherOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={assignTeacherMutation.isPending}
              className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-sm"
            >
              {assignTeacherMutation.isPending
                ? 'Assigning...'
                : 'Assign Faculty'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
