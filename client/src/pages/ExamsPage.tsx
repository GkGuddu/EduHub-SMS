import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { examsApi, academicsApi, parentsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Badge, Modal } from '../components/common';
import {
  Save,
  Send,
  Printer,
  CheckCircle,
  Loader2,
  Award,
  Plus,
  History,
  UserX,
  UserCheck,
  Edit3,
  Calendar,
  Layers,
  BookOpen,
  Trash2,
  FileQuestion,
  TrendingUp,
  BarChart2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { PERMISSIONS, ExamType, ExamStatus } from '@eduhub/shared';

interface StudentGradeRow {
  studentId: string;
  studentName: string;
  rollNumber: string;
  marksObtained: number;
  maxMarks: number;
  percentage: number;
  grade: string;
  isAbsent: boolean;
  isPassed: boolean;
  remarks: string;
}

export const ExamsPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const isStaff = user?.role === 'admin' || user?.role === 'teacher';
  const isStudent = user?.role === 'student';
  const isParent = user?.role === 'parent';

  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [gradesList, setGradesList] = useState<StudentGradeRow[]>([]);
  const [reportCardStudentId, setReportCardStudentId] = useState<string | null>(
    null
  );

  const [selectedParentChildId, setSelectedParentChildId] = useState('');

  const { data: parentProfileData } = useQuery({
    queryKey: ['parent-profile', user?._id],
    queryFn: () => parentsApi.getParentById(user?._id || ''),
    enabled: isParent,
  });

  useEffect(() => {
    if (
      parentProfileData?.parent?.linkedStudents?.length > 0 &&
      !selectedParentChildId
    ) {
      setSelectedParentChildId(
        parentProfileData.parent.linkedStudents[0].studentUserId ||
          parentProfileData.parent.linkedStudents[0].studentId
      );
    }
  }, [parentProfileData, selectedParentChildId]);

  const effectiveStudentId = isStudent
    ? user?._id || ''
    : selectedParentChildId;

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newExamName, setNewExamName] = useState('');
  const [newExamType, setNewExamType] = useState<ExamType>('unit_test');
  const [newExamClassId, setNewExamClassId] = useState('');
  const [newExamYear, setNewExamYear] = useState('2025-2026');
  const [newExamStartDate, setNewExamStartDate] = useState('');
  const [newExamEndDate, setNewExamEndDate] = useState('');
  const [newExamMaxMarks, setNewExamMaxMarks] = useState(100);
  const [newExamPassingMarks, setNewExamPassingMarks] = useState(40);
  const [newExamStatus, setNewExamStatus] = useState<ExamStatus>('draft');
  const [newExamDesc, setNewExamDesc] = useState('');

  const [correctionTarget, setCorrectionTarget] =
    useState<StudentGradeRow | null>(null);
  const [correctionMarks, setCorrectionMarks] = useState<number>(0);
  const [correctionAbsent, setCorrectionAbsent] = useState<boolean>(false);
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionRemarks, setCorrectionRemarks] = useState('');
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const { data: examsData, isLoading: loadingExams } = useQuery({
    queryKey: ['exams'],
    queryFn: () => examsApi.getExams(),
  });

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => academicsApi.getClasses(),
    enabled: isStaff,
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => academicsApi.getSubjects(),
    enabled: isStaff,
  });

  const { data: studentReportData, isLoading: loadingStudentReport } = useQuery(
    {
      queryKey: ['student-report-card', effectiveStudentId, selectedExamId],
      queryFn: () =>
        examsApi.getStudentReportCard(effectiveStudentId, selectedExamId),
      enabled: !isStaff && !!effectiveStudentId && !!selectedExamId,
    }
  );

  useEffect(() => {
    if (examsData?.exams?.length > 0 && !selectedExamId) {
      if (isStaff) {
        setSelectedExamId(examsData.exams[0]._id);
      } else {
        const publishedExam = examsData.exams.find(
          (e: any) => e.status === 'published'
        );
        setSelectedExamId(
          publishedExam ? publishedExam._id : examsData.exams[0]._id
        );
      }
    }
    if (classesData?.classes?.length > 0 && !selectedClassId) {
      setSelectedClassId(classesData.classes[0]._id);
    }
    if (subjectsData?.subjects?.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjectsData.subjects[0]._id);
    }
  }, [
    examsData,
    classesData,
    subjectsData,
    selectedExamId,
    selectedClassId,
    selectedSubjectId,
    isStaff,
  ]);

  const { data: gradesData, isLoading: loadingGrades } = useQuery({
    queryKey: ['grades', selectedExamId, selectedClassId, selectedSubjectId],
    queryFn: () =>
      examsApi.getGrades(selectedExamId, selectedClassId, selectedSubjectId),
    enabled:
      isStaff && !!selectedExamId && !!selectedClassId && !!selectedSubjectId,
  });

  const currentExam = examsData?.exams?.find(
    (e: any) => e._id === selectedExamId
  );
  const maxMarksForSubject =
    gradesData?.maxMarks || currentExam?.maxMarks || 100;
  const passingMarksForSubject =
    gradesData?.passingMarks || currentExam?.passingMarks || 40;

  useEffect(() => {
    if (gradesData?.grades) {
      setGradesList(
        gradesData.grades.map((g: any) => ({
          studentId: g.studentId,
          studentName: g.studentName,
          rollNumber: g.rollNumber,
          marksObtained: g.marksObtained ?? 0,
          maxMarks: maxMarksForSubject,
          percentage: g.percentage ?? 0,
          grade: g.grade || 'F',
          isAbsent: Boolean(g.isAbsent),
          isPassed: Boolean(g.isPassed),
          remarks: g.remarks || '',
        }))
      );
    }
  }, [gradesData, maxMarksForSubject]);

  const createExamMutation = useMutation({
    mutationFn: (payload: any) => examsApi.createExam(payload),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      setIsCreateModalOpen(false);
      setNewExamName('');
      setNewExamStartDate('');
      setNewExamEndDate('');
      setNewExamDesc('');
      if (res.exam?._id) {
        setSelectedExamId(res.exam._id);
      }
      alert('Examination assessment successfully created.');
    },
    onError: (err: any) => alert(err.message || 'Failed to create exam'),
  });

  const deleteExamMutation = useMutation({
    mutationFn: (examId: string) => examsApi.deleteExam(examId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      setSelectedExamId('');
      alert('Exam deleted successfully.');
    },
    onError: (err: any) => alert(err.message || 'Failed to delete exam'),
  });

  const submitGradesMutation = useMutation({
    mutationFn: (status: 'draft' | 'submitted') =>
      examsApi.submitGrades({
        examId: selectedExamId,
        classSectionId: selectedClassId,
        subjectId: selectedSubjectId,
        maxMarks: maxMarksForSubject,
        passingMarks: passingMarksForSubject,
        grades: gradesList.map((g) => ({
          studentId: g.studentId,
          studentName: g.studentName,
          rollNumber: g.rollNumber,
          marksObtained: g.isAbsent ? 0 : g.marksObtained,
          isAbsent: g.isAbsent,
          remarks: g.remarks,
        })),
        status,
      }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      alert(res.message || 'Grades saved successfully!');
    },
    onError: (err: any) => alert(err.message || 'Failed to save marks'),
  });

  const correctGradeMutation = useMutation({
    mutationFn: (payload: any) => examsApi.correctGrade(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      setCorrectionTarget(null);
      setCorrectionReason('');
      alert('Grade correction saved with audit log record.');
    },
    onError: (err: any) => alert(err.message || 'Failed to correct mark'),
  });

  const publishMutation = useMutation({
    mutationFn: (recordId: string) => examsApi.publishGrades(recordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      alert(
        'Exam results published! Notifications dispatched to students and parents.'
      );
    },
    onError: (err: any) => alert(err.message || 'Failed to publish results'),
  });

  const { data: reportCardData, isLoading: loadingReportCard } = useQuery({
    queryKey: ['report-card', reportCardStudentId, selectedExamId],
    queryFn: () =>
      examsApi.getStudentReportCard(reportCardStudentId!, selectedExamId),
    enabled: !!reportCardStudentId && !!selectedExamId,
  });

  const handleMarksChange = (studentId: string, val: number) => {
    const marks = Math.min(maxMarksForSubject, Math.max(0, val || 0));
    setGradesList((prev) =>
      prev.map((item) => {
        if (item.studentId === studentId) {
          const pct = Math.round((marks / maxMarksForSubject) * 100);
          let letterGrade = 'F';
          if (pct >= 90) letterGrade = 'A+';
          else if (pct >= 80) letterGrade = 'A';
          else if (pct >= 70) letterGrade = 'B';
          else if (pct >= 60) letterGrade = 'C';
          else if (pct >= 40) letterGrade = 'D';

          return {
            ...item,
            marksObtained: marks,
            percentage: pct,
            grade: letterGrade,
            isPassed: marks >= passingMarksForSubject,
          };
        }
        return item;
      })
    );
  };

  const handleToggleAbsent = (studentId: string) => {
    setGradesList((prev) =>
      prev.map((item) => {
        if (item.studentId === studentId) {
          const nextAbsent = !item.isAbsent;
          return {
            ...item,
            isAbsent: nextAbsent,
            marksObtained: nextAbsent ? 0 : item.marksObtained,
            percentage: nextAbsent ? 0 : item.percentage,
            grade: nextAbsent ? 'F' : item.grade,
            isPassed: nextAbsent
              ? false
              : item.marksObtained >= passingMarksForSubject,
          };
        }
        return item;
      })
    );
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setGradesList((prev) =>
      prev.map((item) =>
        item.studentId === studentId ? { ...item, remarks } : item
      )
    );
  };

  const openCorrectionModal = (student: StudentGradeRow) => {
    setCorrectionTarget(student);
    setCorrectionMarks(student.marksObtained);
    setCorrectionAbsent(student.isAbsent);
    setCorrectionRemarks(student.remarks);
    setCorrectionReason('');
  };

  const handleConfirmCorrection = () => {
    if (!correctionTarget) return;
    if (!correctionReason.trim()) {
      alert(
        'An audit reason is required for post-publication marks correction.'
      );
      return;
    }

    correctGradeMutation.mutate({
      examId: selectedExamId,
      classSectionId: selectedClassId,
      subjectId: selectedSubjectId,
      studentId: correctionTarget.studentId,
      marksObtained: correctionAbsent ? 0 : correctionMarks,
      isAbsent: correctionAbsent,
      reason: correctionReason,
      remarks: correctionRemarks,
    });
  };

  const handleCreateExamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamName.trim() || !newExamStartDate || !newExamEndDate) {
      alert('Please fill in exam title, start date, and end date.');
      return;
    }

    createExamMutation.mutate({
      name: newExamName,
      type: newExamType,
      classSectionId: newExamClassId || undefined,
      academicYear: newExamYear,
      startDate: newExamStartDate,
      endDate: newExamEndDate,
      maxMarks: Number(newExamMaxMarks),
      passingMarks: Number(newExamPassingMarks),
      status: newExamStatus,
      description: newExamDesc,
    });
  };

  const canCreateExam =
    user?.role === 'admin' || hasPermission(PERMISSIONS.EXAMS_CREATE);
  const canDeleteExam =
    user?.role === 'admin' || hasPermission(PERMISSIONS.EXAMS_DELETE);
  const canEnterMarks =
    user?.role === 'admin' || hasPermission(PERMISSIONS.MARKS_ENTER);
  const canEditMarks =
    user?.role === 'admin' || hasPermission(PERMISSIONS.MARKS_EDIT);
  const canPublish =
    user?.role === 'admin' || hasPermission(PERMISSIONS.RESULTS_PUBLISH);
  const isSheetPublished = gradesData?.status === 'published';
  const canSubmitDraft = !isSheetPublished && (canEnterMarks || canEditMarks);

  if (!isStaff) {
    const currentPath = location.pathname;
    const isReportCardRoute = currentPath.includes('/report-card');
    const isProgressRoute = currentPath.includes('/progress');
    const isResultsRoute = currentPath.includes('/results');
    const isExamsListRoute =
      currentPath.endsWith('/exams') ||
      (!isReportCardRoute && !isProgressRoute && !isResultsRoute);

    const reportCard = studentReportData?.reportCard;
    const isPublished =
      currentExam?.status === 'published' &&
      reportCard &&
      reportCard.subjects?.length > 0;

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              {isProgressRoute
                ? 'Academic Progress & Growth'
                : isReportCardRoute
                  ? isParent
                    ? 'Ward Academic Report Card'
                    : 'Academic Report Card'
                  : isResultsRoute
                    ? 'Ward Academic Results & DMC'
                    : isParent
                      ? 'Ward Examination Schedules'
                      : 'Tests & Examinations'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {isProgressRoute
                ? 'Continuous assessment trends, subject mastery analytics, and comparative performance.'
                : isReportCardRoute || isResultsRoute
                  ? 'Official term evaluation, grades statement, and Detailed Marks Certificate (DMC).'
                  : isParent
                    ? 'Upcoming assessment timetables and paper schedules for your children.'
                    : 'Scheduled examinations, paper timetables, guidelines, and online quizzes.'}
            </p>
          </div>
          {isPublished && (isReportCardRoute || isResultsRoute || isProgressRoute) && (
            <button
              onClick={() => setReportCardStudentId(effectiveStudentId)}
              className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all self-start sm:self-auto"
            >
              <Award className="w-4 h-4" />
              View Official DMC / Transcript
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 flex-wrap">
          {isStudent ? (
            <>
              <Link
                to="/student/exams"
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isExamsListRoute
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Tests & Examinations
              </Link>
              <Link
                to="/student/report-card"
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isReportCardRoute
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                Academic Report Card
              </Link>
              <Link
                to="/student/progress"
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isProgressRoute
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Academic Progress
              </Link>
              <Link
                to="/student/quizzes"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center gap-1.5 ml-auto sm:ml-0"
              >
                <FileQuestion className="w-3.5 h-3.5 text-brand-600" />
                Subject Quizzes
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-brand-100 text-brand-800">
                  Active
                </span>
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/parent/exams"
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isExamsListRoute
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Examination Schedules
              </Link>
              <Link
                to="/parent/results"
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isResultsRoute || isReportCardRoute
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                Academic Results & DMC
              </Link>
              <Link
                to="/parent/quizzes"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center gap-1.5 ml-auto sm:ml-0"
              >
                <FileQuestion className="w-3.5 h-3.5 text-brand-600" />
                Subject Quizzes
              </Link>
            </>
          )}
        </div>

        {isParent && parentProfileData?.parent?.linkedStudents?.length > 0 && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Select Child:
              </span>
              <div className="flex flex-wrap gap-2">
                {parentProfileData.parent.linkedStudents.map((child: any) => {
                  const childId = child.studentUserId || child.studentId;
                  const isSelected = selectedParentChildId === childId;
                  return (
                    <button
                      key={childId}
                      type="button"
                      onClick={() => setSelectedParentChildId(childId)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                        isSelected
                          ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {child.name || child.studentName || 'Child'} ({child.className || 'Class'}{' '}
                      {child.section ? `-${child.section}` : ''} • #{child.rollNumber || '—'})
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {!isExamsListRoute && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Select Assessment
                </label>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 cursor-pointer min-w-[240px]"
                >
                  {loadingExams ? (
                    <option>Loading assessments...</option>
                  ) : examsData?.exams?.length === 0 ? (
                    <option value="">No examinations scheduled</option>
                  ) : (
                    examsData?.exams?.map((e: any) => (
                      <option key={e._id} value={e._id}>
                        {e.name} ({e.status === 'published' ? 'Published' : e.type || 'Assessment'})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {currentExam && (
                <div className="pt-4 sm:pt-5">
                  <Badge status={currentExam.status} variant="exam" />
                </div>
              )}
            </div>

            {currentExam && (
              <div className="text-xs text-slate-500 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {currentExam.startDate} to {currentExam.endDate}
                </span>
                <span className="hidden sm:inline text-slate-300">•</span>
                <span className="font-semibold text-slate-700">
                  {currentExam.academicYear}
                </span>
              </div>
            )}
          </div>
        )}

        {isProgressRoute ? (
          loadingStudentReport ? (
            <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
              Loading academic progress analytics...
            </div>
          ) : isPublished ? (
            <div className="space-y-6">
              {(() => {
                const subjects = reportCard?.subjects || [];
                const highestSubject =
                  subjects.length > 0
                    ? [...subjects].sort(
                        (a: any, b: any) => (b.percentage || 0) - (a.percentage || 0)
                      )[0]
                    : null;
                const lowestSubject =
                  subjects.length > 0
                    ? [...subjects].sort(
                        (a: any, b: any) => (a.percentage || 0) - (b.percentage || 0)
                      )[0]
                    : null;
                const passedCount = subjects.filter((s: any) => s.isPassed).length;
                const chartData = subjects.map((sub: any) => ({
                  name:
                    sub.subjectName?.length > 12
                      ? `${sub.subjectName.slice(0, 10)}...`
                      : sub.subjectName,
                  fullName: sub.subjectName,
                  score: sub.percentage || 0,
                  passingScore: 40,
                  marksObtained: sub.marksObtained,
                  maxMarks: sub.maxMarks,
                  grade: sub.grade,
                }));

                return (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Overall Mastery
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-2xl font-black text-brand-600">
                            {reportCard.summary.overallPercentage}%
                          </span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                            Grade {reportCard.summary.overallGrade}
                          </span>
                        </div>
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Highest Score
                        </span>
                        <p className="text-lg font-bold text-slate-800 mt-1 truncate">
                          {highestSubject?.subjectName || '—'}
                        </p>
                        <span className="text-xs text-emerald-600 font-bold block mt-0.5">
                          {highestSubject
                            ? `${highestSubject.percentage}% (Grade ${highestSubject.grade})`
                            : '—'}
                        </span>
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Focus Needed
                        </span>
                        <p className="text-lg font-bold text-slate-800 mt-1 truncate">
                          {lowestSubject?.subjectName || '—'}
                        </p>
                        <span className="text-xs text-amber-600 font-bold block mt-0.5">
                          {lowestSubject
                            ? `${lowestSubject.percentage}% (Grade ${lowestSubject.grade})`
                            : '—'}
                        </span>
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Curriculum Cleared
                        </span>
                        <p className="text-2xl font-black text-slate-800 mt-1">
                          {passedCount} / {subjects.length}
                        </p>
                        <span className="text-xs text-slate-400 font-medium block mt-0.5">
                          Subjects Above Benchmark
                        </span>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-sm text-slate-800">
                            Subject Performance Comparison
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Percentage scores across evaluated subjects (Passing Benchmark: 40%)
                          </p>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                          {currentExam?.name}
                        </span>
                      </div>
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={chartData}
                            margin={{ top: 10, right: 10, left: -20, bottom: 10 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#f1f5f9"
                              vertical={false}
                            />
                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 11, fill: '#64748b' }}
                              axisLine={{ stroke: '#e2e8f0' }}
                              tickLine={false}
                            />
                            <YAxis
                              domain={[0, 100]}
                              tick={{ fontSize: 11, fill: '#64748b' }}
                              axisLine={{ stroke: '#e2e8f0' }}
                              tickLine={false}
                              unit="%"
                            />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const d = payload[0].payload;
                                  return (
                                    <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg text-xs space-y-1">
                                      <div className="font-bold">{d.fullName}</div>
                                      <div className="text-orange-300 font-bold">
                                        Score: {d.score}% ({d.marksObtained}/{d.maxMarks})
                                      </div>
                                      <div className="text-slate-300 text-[10px]">
                                        Grade: {d.grade} • Threshold: 40%
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar
                              dataKey="score"
                              fill="#ea580c"
                              radius={[6, 6, 0, 0]}
                              maxBarSize={48}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="font-bold text-sm text-slate-800">
                          Subject Mastery & Progress
                        </h3>
                        <span className="text-xs text-slate-400">
                          Continuous Academic Assessment
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {subjects.map((sub: any, idx: number) => {
                          const pct = sub.percentage || 0;
                          const barColor =
                            pct >= 75
                              ? 'bg-emerald-500'
                              : pct >= 50
                                ? 'bg-brand-500'
                                : 'bg-rose-500';

                          return (
                            <div
                              key={idx}
                              className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-2.5"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-bold text-xs text-slate-800 block">
                                    {sub.subjectName}
                                  </span>
                                  {sub.subjectCode && (
                                    <span className="text-[10px] text-slate-400">
                                      {sub.subjectCode}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-700">
                                    {sub.marksObtained} / {sub.maxMarks}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      sub.isPassed
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-rose-100 text-rose-800'
                                    }`}
                                  >
                                    {sub.grade}
                                  </span>
                                </div>
                              </div>

                              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                                  style={{
                                    width: `${Math.min(100, Math.max(0, pct))}%`,
                                  }}
                                />
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-slate-500">
                                <span>Mastery: {pct}%</span>
                                <span>
                                  {sub.remarks
                                    ? `"${sub.remarks}"`
                                    : sub.isPassed
                                      ? 'Syllabus on track'
                                      : 'Attention needed'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto border border-brand-200">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Academic Progress Report
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                  Progress metrics and comparative mastery charts will appear here once term assessment results are officially published by school administration.
                </p>
              </div>
            </div>
          )
        ) : isExamsListRoute ? (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-6 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 uppercase tracking-wider inline-block">
                  Practice Assessment
                </span>
                <h2 className="text-xl font-extrabold tracking-tight">
                  Interactive Subject Quizzes
                </h2>
                <p className="text-xs text-orange-100 max-w-lg">
                  Prepare thoroughly for term exams with automated multiple-choice tests, instant scoring, and concept explanations.
                </p>
              </div>
              <Link
                to={`/${user?.role || 'student'}/quizzes`}
                className="px-4 py-2.5 rounded-xl bg-white text-brand-600 hover:bg-orange-50 font-bold text-xs shadow-sm transition-all self-start sm:self-auto shrink-0 flex items-center gap-1.5"
              >
                <FileQuestion className="w-4 h-4" />
                Take Practice Quizzes
              </Link>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-800">
                  Scheduled Term Examinations
                </h3>
                <span className="text-xs text-slate-500">
                  Total Assessments: {examsData?.exams?.length || 0}
                </span>
              </div>

              {loadingExams ? (
                <div className="py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
                  Loading examination timetable...
                </div>
              ) : !examsData?.exams?.length ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
                  No examinations scheduled at this time.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {examsData.exams.map((exam: any) => {
                    const isExamPublished = exam.status === 'published';
                    return (
                      <div
                        key={exam._id}
                        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 flex flex-col justify-between hover:border-brand-200 transition-all"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <h4 className="font-bold text-slate-800 text-sm">
                                {exam.name}
                              </h4>
                              <p className="text-xs text-slate-400 mt-0.5">
                                Academic Year {exam.academicYear} • {exam.type || 'Term Exam'}
                              </p>
                            </div>
                            <Badge status={exam.status} variant="exam" />
                          </div>

                          <div className="text-xs text-slate-500 flex items-center gap-2 py-2 border-y border-slate-100 my-3">
                            <Calendar className="w-3.5 h-3.5 text-brand-500" />
                            <span>
                              {exam.startDate} — {exam.endDate}
                            </span>
                          </div>

                          {exam.description && (
                            <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                              {exam.description}
                            </p>
                          )}

                          {exam.subjects && exam.subjects.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Included Papers ({exam.subjects.length})
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {exam.subjects.map((sub: any, sIdx: number) => (
                                  <span
                                    key={sIdx}
                                    className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-medium text-slate-700"
                                  >
                                    {sub.subjectName} ({sub.maxMarks}m)
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <span className="text-[11px] text-slate-400">
                            {isExamPublished ? 'Results Released' : 'Timetable Active'}
                          </span>
                          {isExamPublished ? (
                            <Link
                              to={isStudent ? '/student/report-card' : '/parent/results'}
                              onClick={() => setSelectedExamId(exam._id)}
                              className="px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs transition-all flex items-center gap-1 shadow-2xs"
                            >
                              <Award className="w-3.5 h-3.5" />
                              View Report Card
                            </Link>
                          ) : (
                            <button
                              disabled
                              className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-400 font-medium text-xs cursor-default"
                            >
                              Under Evaluation
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          loadingStudentReport ? (
            <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
              Loading assessment statement...
            </div>
          ) : isPublished ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Total Marks
                  </span>
                  <p className="text-2xl font-black text-slate-800 mt-1">
                    {reportCard.summary.totalObtained}{' '}
                    <span className="text-xs font-semibold text-slate-400">
                      / {reportCard.summary.totalMax}
                    </span>
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Overall Percentage
                  </span>
                  <p className="text-2xl font-black text-brand-600 mt-1">
                    {reportCard.summary.overallPercentage}%
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Overall Grade
                  </span>
                  <p className="text-2xl font-black text-slate-800 mt-1">
                    {reportCard.summary.overallGrade}
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Result Status
                  </span>
                  <div className="mt-1.5">
                    <span
                      className={`inline-block px-3 py-1 rounded-full font-bold text-xs ${
                        reportCard.summary.status === 'PASS'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {reportCard.summary.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-800">
                    Subject-Wise Performance Statement
                  </h3>
                  <span className="text-xs text-slate-500">
                    Passing threshold: 40%
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3.5">Subject</th>
                        <th className="px-6 py-3.5 text-center">Max Marks</th>
                        <th className="px-6 py-3.5 text-center">Pass Marks</th>
                        <th className="px-6 py-3.5 text-center">Marks Obtained</th>
                        <th className="px-6 py-3.5 text-center">Percentage</th>
                        <th className="px-6 py-3.5 text-center">Grade</th>
                        <th className="px-6 py-3.5 text-center">Status</th>
                        <th className="px-6 py-3.5">Teacher Feedback</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportCard.subjects.map((sub: any, idx: number) => (
                        <tr
                          key={idx}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          <td className="px-6 py-4 font-semibold text-slate-800">
                            {sub.subjectName}{' '}
                            {sub.subjectCode && (
                              <span className="text-xs font-normal text-slate-400">
                                ({sub.subjectCode})
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center text-slate-500 font-medium">
                            {sub.maxMarks}
                          </td>
                          <td className="px-6 py-4 text-center text-slate-500 font-medium">
                            {sub.passingMarks}
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-slate-800">
                            {sub.isAbsent ? (
                              <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                ABSENT
                              </span>
                            ) : (
                              sub.marksObtained
                            )}
                          </td>
                          <td className="px-6 py-4 text-center font-medium text-slate-700">
                            {sub.isAbsent ? '0%' : `${sub.percentage}%`}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${
                                sub.grade === 'A+' || sub.grade === 'A'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : sub.grade === 'B' || sub.grade === 'C'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : sub.grade === 'D'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {sub.grade}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                sub.isPassed
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {sub.isPassed ? 'PASS' : 'FAIL'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {sub.remarks || (
                              <span className="text-slate-400 italic">None</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
                  <span>
                    {reportCard.publishedAt && (
                      <>
                        Published officially on{' '}
                        {new Date(reportCard.publishedAt).toLocaleDateString()}
                      </>
                    )}
                    {reportCard.publishedByName && (
                      <> by {reportCard.publishedByName}</>
                    )}
                  </span>
                  <button
                    onClick={() => setReportCardStudentId(effectiveStudentId)}
                    className="text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Official Transcript
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto border border-brand-200">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {currentExam?.name || 'Assessment Scheduled'}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                  {currentExam?.status === 'scheduled'
                    ? 'This assessment is currently scheduled. Examination results and Detailed Marks Certificates (DMC) will appear here once officially published by the school administration.'
                    : 'Results for this assessment are currently being evaluated by the academic team. They will be visible here as soon as they are published.'}
                </p>
              </div>
            </div>
          )
        )}

        <Modal
          isOpen={!!reportCardStudentId}
          onClose={() => setReportCardStudentId(null)}
          title="Detailed Marks Certificate (DMC) / Official Transcript"
          subtitle="Adiya School of Excellence • Silicon Valley, Bengaluru"
          maxWidth="max-w-2xl"
        >
          {loadingReportCard ? (
            <div className="py-12 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
              Generating official transcript...
            </div>
          ) : reportCardData?.reportCard ? (
            <div className="space-y-6 text-xs" id="printable-report-card">
              <div className="border-b border-slate-200 pb-4 text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-brand-500 text-white flex items-center justify-center font-black text-xl shadow-md">
                  A
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  ADIYA SCHOOL OF EXCELLENCE
                </h2>
                <p className="text-[11px] text-slate-500">
                  14 Knowledge Park, Silicon Valley, Bengaluru, KA 560100 •
                  Affiliation Code: CBSE-2026-ADIYA
                </p>
                <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 font-bold uppercase text-[10px] border border-brand-200">
                  <Award className="w-3.5 h-3.5" />
                  {reportCardData.reportCard.exam.name} (
                  {reportCardData.reportCard.exam.academicYear})
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Student Name
                  </span>
                  <span className="font-bold text-slate-800 text-sm">
                    {reportCardData.reportCard.student.name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Class & Division
                  </span>
                  <span className="font-bold text-slate-800 text-sm">
                    {reportCardData.reportCard.student.className} - Section{' '}
                    {reportCardData.reportCard.student.section}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Roll Number
                  </span>
                  <span className="font-mono font-semibold text-slate-700">
                    #{reportCardData.reportCard.student.rollNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Admission Number
                  </span>
                  <span className="font-mono font-semibold text-slate-700">
                    {reportCardData.reportCard.student.admissionNumber}
                  </span>
                </div>
              </div>

              <table className="w-full text-left border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Subject</th>
                    <th className="p-2.5 text-center">Max Marks</th>
                    <th className="p-2.5 text-center">Pass Marks</th>
                    <th className="p-2.5 text-center">Marks Obtained</th>
                    <th className="p-2.5 text-center">Grade</th>
                    <th className="p-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {reportCardData.reportCard.subjects.map(
                    (sub: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-medium text-slate-800">
                          {sub.subjectName}{' '}
                          {sub.subjectCode ? `(${sub.subjectCode})` : ''}
                        </td>
                        <td className="p-2.5 text-center text-slate-500">
                          {sub.maxMarks}
                        </td>
                        <td className="p-2.5 text-center text-slate-500">
                          {sub.passingMarks}
                        </td>
                        <td className="p-2.5 text-center font-bold text-slate-800">
                          {sub.isAbsent ? (
                            <span className="text-rose-600 font-bold">
                              ABSENT
                            </span>
                          ) : (
                            sub.marksObtained
                          )}
                        </td>
                        <td className="p-2.5 text-center font-bold text-brand-600">
                          {sub.grade}
                        </td>
                        <td className="p-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              sub.isPassed
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {sub.isPassed ? 'PASS' : 'FAIL'}
                          </span>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>

              <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 block">
                    Aggregate Marks
                  </span>
                  <span className="text-lg font-black text-slate-800">
                    {reportCardData.reportCard.summary.totalObtained} /{' '}
                    {reportCardData.reportCard.summary.totalMax}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">
                    Percentage
                  </span>
                  <span className="text-xl font-black text-slate-800">
                    {reportCardData.reportCard.summary.overallPercentage}%
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">
                    Grade
                  </span>
                  <span className="text-xl font-black text-brand-600">
                    {reportCardData.reportCard.summary.overallGrade}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">
                    Standing
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full font-bold text-xs ${
                      reportCardData.reportCard.summary.status === 'PASS'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {reportCardData.reportCard.summary.status}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  {reportCardData.reportCard.publishedAt && (
                    <>
                      Published on:{' '}
                      {new Date(
                        reportCardData.reportCard.publishedAt
                      ).toLocaleDateString()}
                    </>
                  )}
                  {reportCardData.reportCard.publishedByName && (
                    <> by {reportCardData.reportCard.publishedByName}</>
                  )}
                </span>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Printer className="w-4 h-4" />
                  Print Official Transcript
                </button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400">
              No published marks found for this student.
            </div>
          )}
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Examinations & Assessments
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Exam scheduling, marks entry with absent validation, result
            publishing, and official transcripts.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          {canCreateExam && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              Create Exam
            </button>
          )}

          {canSubmitDraft && (
            <>
              <button
                onClick={() => submitGradesMutation.mutate('draft')}
                disabled={submitGradesMutation.isPending}
                className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-xs shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4 text-slate-500" />
                Save Draft
              </button>

              <button
                onClick={() => submitGradesMutation.mutate('submitted')}
                disabled={submitGradesMutation.isPending}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                Submit Sheet
              </button>
            </>
          )}

          {canPublish && gradesData?.recordId && !isSheetPublished && (
            <button
              onClick={() => publishMutation.mutate(gradesData.recordId)}
              disabled={publishMutation.isPending}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              Publish Results
            </button>
          )}

          {gradesData?.correctionHistory &&
            gradesData.correctionHistory.length > 0 && (
              <button
                onClick={() => setIsHistoryModalOpen(true)}
                className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs shadow-sm flex items-center gap-1.5 transition-all"
              >
                <History className="w-4 h-4 text-slate-600" />
                Correction Audit ({gradesData.correctionHistory.length})
              </button>
            )}
        </div>
      </div>

      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <button
          type="button"
          className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-500 text-white shadow-sm flex items-center gap-1.5"
        >
          <Calendar className="w-3.5 h-3.5" />
          Formal Examinations
        </button>
        <Link
          to={`/${user?.role || 'admin'}/quizzes`}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center gap-1.5"
        >
          <FileQuestion className="w-3.5 h-3.5 text-brand-600" />
          Subject Quizzes
          <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-brand-100 text-brand-800">
            ≥10 Qs Builder
          </span>
        </Link>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
            Assessment
          </label>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 cursor-pointer min-w-[220px]"
          >
            {loadingExams ? (
              <option>Loading assessments...</option>
            ) : examsData?.exams?.length === 0 ? (
              <option value="">No exams available</option>
            ) : (
              examsData?.exams?.map((e: any) => (
                <option key={e._id} value={e._id}>
                  {e.name} ({e.type || 'unit_test'}) - [{e.status}]
                </option>
              ))
            )}
          </select>
        </div>

        {isStaff && (
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Class & Section
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 cursor-pointer min-w-[180px]"
            >
              {classesData?.classes?.map((c: any) => (
                <option key={c._id} value={c._id}>
                  {c.name} - Section {c.section}
                </option>
              ))}
            </select>
          </div>
        )}

        {isStaff && (
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Subject
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 cursor-pointer min-w-[180px]"
            >
              {subjectsData?.subjects?.map((s: any) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="ml-auto flex items-center gap-3">
          {canDeleteExam &&
            currentExam &&
            currentExam.status !== 'published' && (
              <button
                onClick={() => {
                  if (window.confirm(`Delete exam "${currentExam.name}"?`)) {
                    deleteExamMutation.mutate(currentExam._id);
                  }
                }}
                className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                title="Delete examination"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">
              Sheet Status:
            </span>
            <Badge
              status={gradesData?.status || currentExam?.status || 'draft'}
              variant="exam"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5 w-24">Roll No</th>
                <th className="px-6 py-3.5">Student Name</th>
                <th className="px-6 py-3.5 w-28 text-center">Attendance</th>
                <th className="px-6 py-3.5 w-44">
                  Marks (Max: {maxMarksForSubject})
                </th>
                <th className="px-6 py-3.5 w-28">Percentage</th>
                <th className="px-6 py-3.5 w-24">Grade</th>
                <th className="px-6 py-3.5 w-24 text-center">Status</th>
                <th className="px-6 py-3.5">Teacher Feedback / Remarks</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingGrades ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
                    Loading grade sheet...
                  </td>
                </tr>
              ) : gradesList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400">
                    No student roster found for this assessment selection.
                  </td>
                </tr>
              ) : (
                gradesList.map((item) => (
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

                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        disabled={!canSubmitDraft}
                        onClick={() => handleToggleAbsent(item.studentId)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          item.isAbsent
                            ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        } ${!canSubmitDraft ? 'cursor-not-allowed opacity-80' : ''}`}
                      >
                        {item.isAbsent ? (
                          <>
                            <UserX className="w-3.5 h-3.5 text-rose-500" />
                            Absent
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                            Present
                          </>
                        )}
                      </button>
                    </td>

                    <td className="px-6 py-4">
                      {item.isAbsent ? (
                        <span className="px-2.5 py-1 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg">
                          ABSENT (0 Marks)
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            max={maxMarksForSubject}
                            disabled={!canSubmitDraft}
                            value={item.marksObtained}
                            onChange={(e) =>
                              handleMarksChange(
                                item.studentId,
                                Number(e.target.value)
                              )
                            }
                            className={`w-20 px-3 py-1.5 text-xs font-bold text-slate-800 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 ${
                              !canSubmitDraft
                                ? 'bg-slate-100 cursor-not-allowed opacity-75'
                                : ''
                            }`}
                          />
                          <span className="text-xs text-slate-400">
                            / {maxMarksForSubject}
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 font-medium text-slate-700">
                      {item.isAbsent ? '0%' : `${item.percentage}%`}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                          item.grade === 'A+' || item.grade === 'A'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : item.grade === 'B' || item.grade === 'C'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : item.grade === 'D'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {item.isAbsent ? 'F' : item.grade}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          item.isPassed
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.isPassed ? 'PASS' : 'FAIL'}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <input
                        type="text"
                        disabled={!canSubmitDraft}
                        placeholder={
                          canSubmitDraft
                            ? 'Feedback or remarks'
                            : 'No remarks entered'
                        }
                        value={item.remarks}
                        onChange={(e) =>
                          handleRemarksChange(item.studentId, e.target.value)
                        }
                        className={`w-full max-w-sm px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 ${
                          !canSubmitDraft
                            ? 'bg-slate-100 cursor-not-allowed opacity-75'
                            : ''
                        }`}
                      />
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isSheetPublished && canEditMarks && (
                          <button
                            onClick={() => openCorrectionModal(item)}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-medium border border-amber-200 transition-colors flex items-center gap-1"
                            title="Correct mark post-publication"
                          >
                            <Edit3 className="w-3 h-3" />
                            Correct
                          </button>
                        )}

                        <button
                          onClick={() => setReportCardStudentId(item.studentId)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-600 text-slate-600 text-xs font-medium border border-slate-200 transition-colors"
                        >
                          Transcript
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Examination Assessment"
        subtitle="Adiya School of Excellence • Assessment Scheduling Engine"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateExamSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Exam Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Term 1 Final Examination 2026"
              value={newExamName}
              onChange={(e) => setNewExamName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Assessment Type
              </label>
              <select
                value={newExamType}
                onChange={(e) => setNewExamType(e.target.value as ExamType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
              >
                <option value="unit_test">Unit Test</option>
                <option value="term_exam">Term Exam</option>
                <option value="final_exam">Final Exam</option>
                <option value="quiz">Class Quiz</option>
                <option value="practical">Practical / Lab Exam</option>
                <option value="other">Other Assessment</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Target Class
              </label>
              <select
                value={newExamClassId}
                onChange={(e) => setNewExamClassId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
              >
                <option value="">School-wide (All Classes)</option>
                {classesData?.classes?.map((c: any) => (
                  <option key={c._id} value={c._id}>
                    {c.name} - Section {c.section}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Lifecycle Status
              </label>
              <select
                value={newExamStatus}
                onChange={(e) => setNewExamStatus(e.target.value as ExamStatus)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
              >
                <option value="draft">Draft</option>
                <option value="scheduled">
                  Scheduled (Visible to Students)
                </option>
                <option value="marks-entry">Marks Entry Active</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={newExamStartDate}
                onChange={(e) => setNewExamStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                End Date *
              </label>
              <input
                type="date"
                required
                value={newExamEndDate}
                onChange={(e) => setNewExamEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Max Marks (Default)
              </label>
              <input
                type="number"
                min="1"
                value={newExamMaxMarks}
                onChange={(e) => setNewExamMaxMarks(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Passing Marks (Default)
              </label>
              <input
                type="number"
                min="1"
                value={newExamPassingMarks}
                onChange={(e) => setNewExamPassingMarks(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Academic Year
              </label>
              <input
                type="text"
                value={newExamYear}
                onChange={(e) => setNewExamYear(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Assessment Description
            </label>
            <textarea
              rows={2}
              placeholder="Instructions or syllabus scope..."
              value={newExamDesc}
              onChange={(e) => setNewExamDesc(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createExamMutation.isPending}
              className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold flex items-center gap-1.5 disabled:opacity-50"
            >
              {createExamMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Create Assessment
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!correctionTarget}
        onClose={() => setCorrectionTarget(null)}
        title="Post-Publication Grade Correction"
        subtitle="Mandatory Audit Trail • Adiya School of Excellence"
        maxWidth="max-w-md"
      >
        {correctionTarget && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[11px]">Student</span>
              <span className="font-bold text-slate-800 text-sm">
                {correctionTarget.studentName} (#{correctionTarget.rollNumber})
              </span>
              <div className="mt-1 flex items-center justify-between text-slate-600">
                <span>Previous Published Marks:</span>
                <span className="font-mono font-bold text-slate-800">
                  {correctionTarget.isAbsent
                    ? 'ABSENT (0)'
                    : correctionTarget.marksObtained}{' '}
                  / {maxMarksForSubject}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-700">Flag as Absent</span>
              <button
                type="button"
                onClick={() => setCorrectionAbsent(!correctionAbsent)}
                className={`px-3 py-1 rounded-lg font-semibold border ${
                  correctionAbsent
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {correctionAbsent ? 'ABSENT' : 'PRESENT'}
              </button>
            </div>

            {!correctionAbsent && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  New Adjusted Marks (Max: {maxMarksForSubject}) *
                </label>
                <input
                  type="number"
                  min="0"
                  max={maxMarksForSubject}
                  value={correctionMarks}
                  onChange={(e) => setCorrectionMarks(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                />
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Mandatory Reason for Correction *
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Scrutiny re-check: question 4 part (b) was unmarked."
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Teacher Remarks
              </label>
              <input
                type="text"
                value={correctionRemarks}
                onChange={(e) => setCorrectionRemarks(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setCorrectionTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCorrection}
                disabled={correctGradeMutation.isPending}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold flex items-center gap-1.5 disabled:opacity-50"
              >
                {correctGradeMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Save Correction
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Post-Publication Marks Correction History"
        subtitle="Immutable Audit Record of Marks Adjustments"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-3 text-xs max-h-[450px] overflow-y-auto">
          {gradesData?.correctionHistory?.length === 0 ? (
            <p className="text-center text-slate-400 py-8">
              No corrections recorded.
            </p>
          ) : (
            gradesData?.correctionHistory?.map((hist: any, idx: number) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">
                    {hist.studentName || 'Student'}
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">
                    {new Date(hist.correctedAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Marks Adjusted:</span>
                  <span className="font-mono font-bold text-rose-600">
                    {hist.previousMarks}
                  </span>
                  <span className="text-slate-400">→</span>
                  <span className="font-mono font-bold text-emerald-600">
                    {hist.newMarks}
                  </span>
                </div>
                <p className="text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-900">Reason:</span>{' '}
                  {hist.reason}
                </p>
                <div className="text-[11px] text-slate-500">
                  Authorized by:{' '}
                  <span className="font-semibold">{hist.correctedByName}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      <Modal
        isOpen={!!reportCardStudentId}
        onClose={() => setReportCardStudentId(null)}
        title="Detailed Marks Certificate (DMC) / Official Transcript"
        subtitle="Adiya School of Excellence • Silicon Valley, Bengaluru"
        maxWidth="max-w-2xl"
      >
        {loadingReportCard ? (
          <div className="py-12 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
            Generating official transcript...
          </div>
        ) : reportCardData?.reportCard ? (
          <div className="space-y-6 text-xs" id="printable-report-card">
            <div className="border-b border-slate-200 pb-4 text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-brand-500 text-white flex items-center justify-center font-black text-xl shadow-md">
                A
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                ADIYA SCHOOL OF EXCELLENCE
              </h2>
              <p className="text-[11px] text-slate-500">
                14 Knowledge Park, Silicon Valley, Bengaluru, KA 560100 •
                Affiliation Code: CBSE-2026-ADIYA
              </p>
              <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 font-bold uppercase text-[10px] border border-brand-200">
                <Award className="w-3.5 h-3.5" />
                {reportCardData.reportCard.exam.name} (
                {reportCardData.reportCard.exam.academicYear})
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[11px]">
                  Student Name
                </span>
                <span className="font-bold text-slate-800 text-sm">
                  {reportCardData.reportCard.student.name}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">
                  Class & Division
                </span>
                <span className="font-bold text-slate-800 text-sm">
                  {reportCardData.reportCard.student.className} - Section{' '}
                  {reportCardData.reportCard.student.section}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">
                  Roll Number
                </span>
                <span className="font-mono font-semibold text-slate-700">
                  #{reportCardData.reportCard.student.rollNumber}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">
                  Admission Number
                </span>
                <span className="font-mono font-semibold text-slate-700">
                  {reportCardData.reportCard.student.admissionNumber}
                </span>
              </div>
            </div>

            <table className="w-full text-left border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Subject</th>
                  <th className="p-2.5 text-center">Max Marks</th>
                  <th className="p-2.5 text-center">Pass Marks</th>
                  <th className="p-2.5 text-center">Marks Obtained</th>
                  <th className="p-2.5 text-center">Grade</th>
                  <th className="p-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {reportCardData.reportCard.subjects.map(
                  (sub: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-medium text-slate-800">
                        {sub.subjectName}{' '}
                        {sub.subjectCode ? `(${sub.subjectCode})` : ''}
                      </td>
                      <td className="p-2.5 text-center text-slate-500">
                        {sub.maxMarks}
                      </td>
                      <td className="p-2.5 text-center text-slate-500">
                        {sub.passingMarks}
                      </td>
                      <td className="p-2.5 text-center font-bold text-slate-800">
                        {sub.isAbsent ? (
                          <span className="text-rose-600 font-bold">
                            ABSENT
                          </span>
                        ) : (
                          sub.marksObtained
                        )}
                      </td>
                      <td className="p-2.5 text-center font-bold text-brand-600">
                        {sub.grade}
                      </td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            sub.isPassed
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {sub.isPassed ? 'PASS' : 'FAIL'}
                        </span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>

            <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block">
                  Aggregate Marks
                </span>
                <span className="text-lg font-black text-slate-800">
                  {reportCardData.reportCard.summary.totalObtained} /{' '}
                  {reportCardData.reportCard.summary.totalMax}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">
                  Percentage
                </span>
                <span className="text-xl font-black text-slate-800">
                  {reportCardData.reportCard.summary.overallPercentage}%
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Grade</span>
                <span className="text-xl font-black text-brand-600">
                  {reportCardData.reportCard.summary.overallGrade}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">
                  Standing
                </span>
                <span
                  className={`px-3 py-1 rounded-full font-bold text-xs ${
                    reportCardData.reportCard.summary.status === 'PASS'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}
                >
                  {reportCardData.reportCard.summary.status}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
              <span>
                {reportCardData.reportCard.publishedAt && (
                  <>
                    Published on:{' '}
                    {new Date(
                      reportCardData.reportCard.publishedAt
                    ).toLocaleDateString()}
                  </>
                )}
                {reportCardData.reportCard.publishedByName && (
                  <> by {reportCardData.reportCard.publishedByName}</>
                )}
              </span>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Printer className="w-4 h-4" />
                Print Official Transcript
              </button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400">
            No published marks found for this student.
          </div>
        )}
      </Modal>
    </div>
  );
};
