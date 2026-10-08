import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quizApi, academicsApi, parentsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Badge, Modal, LoadingState, EmptyState } from '../components/common';
import {
  HelpCircle,
  Clock,
  Award,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  CheckSquare,
  FileQuestion,
  ChevronLeft,
  ChevronRight,
  Filter,
  Layers,
  Flag,
  RotateCcw,
  BarChart2,
  Users,
  Plus,
  Trash2,
  Eye,
  Send,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { QuizQuestionType } from '@eduhub/shared';

const SUBJECT_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  Mathematics: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
  },
  Science: {
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    border: 'border-cyan-200',
  },
  Biology: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  English: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  Computer: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  Hindi: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

export const QuizzesPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const role = user?.role || 'student';
  const isStudent = role === 'student';
  const isTeacher = role === 'teacher';
  const isAdmin = role === 'admin';
  const isParent = role === 'parent';
  const isStaff = isAdmin || isTeacher;

  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedStatusTab, setSelectedStatusTab] = useState<
    'all' | 'available' | 'completed'
  >('all');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');

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

  const { data: quizzesData, isLoading: loadingQuizzes } = useQuery({
    queryKey: ['quizzes', selectedSubject, selectedClassId],
    queryFn: () =>
      quizApi.getQuizzes({
        subjectId: selectedSubject !== 'all' ? selectedSubject : undefined,
        classSectionId: selectedClassId !== 'all' ? selectedClassId : undefined,
      }),
    enabled: !isParent,
  });

  const { data: parentQuizzesData, isLoading: loadingParentQuizzes } = useQuery(
    {
      queryKey: ['parent-child-quizzes', selectedParentChildId],
      queryFn: () => quizApi.getParentChildQuizzes(selectedParentChildId),
      enabled: isParent && !!selectedParentChildId,
    }
  );

  const { data: classesData } = useQuery({
    queryKey: ['academic-classes'],
    queryFn: () => academicsApi.getClasses(),
    enabled: isStaff,
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['academic-subjects'],
    queryFn: () => academicsApi.getSubjects(),
  });

  const [activeQuiz, setActiveQuiz] = useState<any | null>(null);
  const [preStartModalQuiz, setPreStartModalQuiz] = useState<any | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [studentAnswers, setStudentAnswers] = useState<
    Record<string, { answer: string; isFlagged: boolean }>
  >({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [viewResultQuizId, setViewResultQuizId] = useState<string | null>(null);
  const { data: resultData, isLoading: loadingResult } = useQuery({
    queryKey: ['quiz-result', viewResultQuizId],
    queryFn: () => quizApi.getStudentResult(viewResultQuizId!),
    enabled: !!viewResultQuizId,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (activeQuiz && timeLeftSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeftSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeQuiz]);

  const handleStartQuiz = async (quiz: any) => {
    try {
      const res: any = await quizApi.startAttempt(quiz._id);
      let fullQuiz = res?.quiz;
      if (!fullQuiz?.questions || fullQuiz.questions.length === 0) {
        const fullRes: any = await quizApi.getQuizById(quiz._id);
        fullQuiz = fullRes?.quiz || quiz;
      }
      setActiveQuiz(fullQuiz);
      setPreStartModalQuiz(null);
      setCurrentQuestionIndex(0);

      const initialMap: Record<string, { answer: string; isFlagged: boolean }> =
        {};
      if (res?.attempt?.answers) {
        for (const ans of res.attempt.answers) {
          initialMap[ans.questionId] = {
            answer: ans.studentAnswer || '',
            isFlagged: !!ans.isFlaggedForReview,
          };
        }
      }
      setStudentAnswers(initialMap);

      const totalSeconds = (fullQuiz.duration || quiz.duration || 15) * 60;
      setTimeLeftSeconds(totalSeconds);
    } catch (err: any) {
      alert(err.message || 'Failed to start quiz attempt');
    }
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setStudentAnswers((prev) => ({
      ...prev,
      [questionId]: {
        answer,
        isFlagged: prev[questionId]?.isFlagged || false,
      },
    }));
  };

  const handleToggleFlag = (questionId: string) => {
    setStudentAnswers((prev) => ({
      ...prev,
      [questionId]: {
        answer: prev[questionId]?.answer || '',
        isFlagged: !prev[questionId]?.isFlagged,
      },
    }));
  };

  const handleClearAnswer = (questionId: string) => {
    setStudentAnswers((prev) => ({
      ...prev,
      [questionId]: {
        answer: '',
        isFlagged: prev[questionId]?.isFlagged || false,
      },
    }));
  };

  const buildAnswersPayload = () => {
    return Object.entries(studentAnswers).map(([qId, data]) => ({
      questionId: qId,
      studentAnswer: data.answer,
      isFlaggedForReview: data.isFlagged,
    }));
  };

  const handleAutoSubmit = async () => {
    if (!activeQuiz) return;
    setIsSubmitting(true);
    try {
      const payload = buildAnswersPayload();
      await quizApi.submitQuiz(activeQuiz._id, payload);
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      setViewResultQuizId(activeQuiz._id);
      setActiveQuiz(null);
    } catch (err: any) {
      console.error('Auto submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!activeQuiz) return;
    setIsSubmitting(true);
    try {
      const payload = buildAnswersPayload();
      await quizApi.submitQuiz(activeQuiz._id, payload);
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      setIsSubmitConfirmOpen(false);
      setViewResultQuizId(activeQuiz._id);
      setActiveQuiz(null);
    } catch (err: any) {
      alert(err.message || 'Failed to submit quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [builderTitle, setBuilderTitle] = useState('');
  const [builderDescription, setBuilderDescription] = useState('');
  const [builderSubjectId, setBuilderSubjectId] = useState('');
  const [builderClassId, setBuilderClassId] = useState('');
  const [builderDuration, setBuilderDuration] = useState(15);
  const [builderPassingMarks, setBuilderPassingMarks] = useState(6);
  const [builderDueDate, setBuilderDueDate] = useState('');
  const [builderQuestions, setBuilderQuestions] = useState<any[]>([]);

  const [qText, setQText] = useState('');
  const [qType, setQType] = useState<QuizQuestionType>('mcq');
  const [qOptions, setQOptions] = useState<string[]>(['', '', '', '']);
  const [qCorrectAnswer, setQCorrectAnswer] = useState('');
  const [qExplanation, setQExplanation] = useState('');
  const [qDifficulty, setQDifficulty] = useState<'easy' | 'medium' | 'hard'>(
    'medium'
  );
  const [qError, setQError] = useState('');

  const [reportsQuiz, setReportsQuiz] = useState<any | null>(null);
  const { data: teacherReportsData, isLoading: loadingReports } = useQuery({
    queryKey: ['teacher-quiz-reports', reportsQuiz?._id],
    queryFn: () => quizApi.getTeacherReports(reportsQuiz?._id),
    enabled: !!reportsQuiz,
  });

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiSubjectId, setAiSubjectId] = useState('');
  const [aiNumQuestions, setAiNumQuestions] = useState(10);
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>(
    'medium'
  );
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiSuccessMessage, setAiSuccessMessage] = useState('');

  const handleGenerateWithAi = async () => {
    setAiError('');
    if (!aiTopic.trim()) {
      setAiError(
        'Please enter a topic name (e.g., Photosynthesis, Quadratic Equations).'
      );
      return;
    }
    const chosenSubjectId =
      aiSubjectId || builderSubjectId || (subjectsList[0]?._id ?? '');
    const chosenSubject = subjectsList.find(
      (s: any) => s._id === chosenSubjectId
    );
    const subjectName = chosenSubject?.name || 'General';

    setIsGeneratingAi(true);
    try {
      const res: any = await quizApi.generateAiQuiz({
        subjectName,
        topic: aiTopic.trim(),
        numQuestions: aiNumQuestions,
        difficulty: aiDifficulty,
      });

      if (res?.questions && Array.isArray(res.questions)) {
        setBuilderQuestions(res.questions);
        if (!builderTitle.trim()) {
          setBuilderTitle(`${aiTopic.trim()} - Mastery Quiz`);
        }
        if (!builderSubjectId && chosenSubjectId) {
          setBuilderSubjectId(chosenSubjectId);
        }
        setBuilderPassingMarks(Math.round(res.questions.length * 0.6));
        setBuilderDuration(
          Math.max(10, Math.round(res.questions.length * 1.5))
        );
        setAiSuccessMessage(
          `✨ Generated ${res.questions.length} questions for "${aiTopic.trim()}" in ${subjectName} using AI (${res.provider === 'gemini' ? 'Google Gemini' : 'EduHub AI Engine'}).`
        );
        setIsAiModalOpen(false);
        setIsBuilderOpen(true);
      } else {
        throw new Error(res?.message || 'Failed to generate questions with AI');
      }
    } catch (err: any) {
      setAiError(err.message || 'AI Generation encountered an issue');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleAddQuestionToBuilder = () => {
    setQError('');
    if (!qText.trim()) {
      setQError('Question text cannot be empty');
      return;
    }

    const isDuplicate = builderQuestions.some(
      (q) => q.questionText.trim().toLowerCase() === qText.trim().toLowerCase()
    );
    if (isDuplicate) {
      setQError(
        'This question is already added! Quizzes require unique questions.'
      );
      return;
    }

    if (qType === 'mcq') {
      const filledOptions = qOptions.map((o) => o.trim()).filter(Boolean);
      if (filledOptions.length < 2) {
        setQError('MCQ questions require at least 2 non-empty options.');
        return;
      }
      if (!qCorrectAnswer.trim()) {
        setQError('Please specify the correct answer option.');
        return;
      }
    } else if (qType === 'true_false') {
      if (!qCorrectAnswer.trim()) {
        setQError("Please select whether 'True' or 'False' is correct.");
        return;
      }
    } else {
      if (!qCorrectAnswer.trim()) {
        setQError('Please specify the expected answer.');
        return;
      }
    }

    const newQuestion = {
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      questionText: qText.trim(),
      questionType: qType,
      options:
        qType === 'mcq'
          ? qOptions.map((o) => o.trim())
          : qType === 'true_false'
            ? ['True', 'False']
            : [],
      correctAnswer: qCorrectAnswer.trim(),
      explanation: qExplanation.trim(),
      marks: 1,
      difficulty: qDifficulty,
    };

    setBuilderQuestions((prev) => [...prev, newQuestion]);
    setQText('');
    setQOptions(['', '', '', '']);
    setQCorrectAnswer('');
    setQExplanation('');
    setQError('');
  };

  const handleRemoveQuestionFromBuilder = (index: number) => {
    setBuilderQuestions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const createQuizMutation = useMutation({
    mutationFn: (data: any) => quizApi.createQuiz(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      setIsBuilderOpen(false);
      resetBuilder();
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to create quiz');
    },
  });

  const publishQuizMutation = useMutation({
    mutationFn: (quizId: string) => quizApi.publishQuiz(quizId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to publish quiz');
    },
  });

  const deleteQuizMutation = useMutation({
    mutationFn: (quizId: string) => quizApi.deleteQuiz(quizId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to delete quiz');
    },
  });

  const resetBuilder = () => {
    setBuilderTitle('');
    setBuilderDescription('');
    setBuilderSubjectId('');
    setBuilderClassId('');
    setBuilderDuration(15);
    setBuilderPassingMarks(6);
    setBuilderDueDate('');
    setBuilderQuestions([]);
    setQText('');
    setQOptions(['', '', '', '']);
    setQCorrectAnswer('');
    setQExplanation('');
    setQError('');
    setAiTopic('');
    setAiError('');
    setAiSuccessMessage('');
  };

  const handleSaveQuiz = (status: 'draft' | 'published') => {
    if (!builderTitle.trim()) {
      alert('Please enter a quiz title');
      return;
    }
    if (!builderSubjectId) {
      alert('Please select a subject');
      return;
    }
    if (!builderClassId) {
      alert('Please select a class');
      return;
    }
    if (status === 'published' && builderQuestions.length < 10) {
      alert(
        `Cannot publish: Quiz requires at least 10 unique questions (currently ${builderQuestions.length}/10). You can save it as a draft instead.`
      );
      return;
    }

    createQuizMutation.mutate({
      title: builderTitle.trim(),
      description: builderDescription.trim(),
      subjectId: builderSubjectId,
      classSectionId: builderClassId,
      duration: builderDuration,
      passingMarks: builderPassingMarks,
      dueDate:
        builderDueDate ||
        new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status,
      questions: builderQuestions,
    });
  };

  const allQuizzes: any[] = quizzesData?.quizzes || [];
  const filteredQuizzes = allQuizzes.filter((q) => {
    if (selectedSubject !== 'all' && q.subjectId !== selectedSubject)
      return false;
    if (isStudent) {
      if (selectedStatusTab === 'available' && q.studentAttempt?.isCompleted)
        return false;
      if (selectedStatusTab === 'completed' && !q.studentAttempt?.isCompleted)
        return false;
    }
    return true;
  });

  const subjectsList = subjectsData?.subjects || [];

  if (activeQuiz) {
    const currentQ = activeQuiz.questions?.[currentQuestionIndex];
    const totalQCount = activeQuiz.questions?.length || 0;
    const answeredCount = Object.values(studentAnswers).filter(
      (a) => a.answer.trim() !== ''
    ).length;
    const flaggedCount = Object.values(studentAnswers).filter(
      (a) => a.isFlagged
    ).length;

    const mins = Math.floor(timeLeftSeconds / 60);
    const secs = timeLeftSeconds % 60;
    const isTimeUrgent = timeLeftSeconds < 120;

    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex flex-col justify-between overflow-hidden">
        <div className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center font-bold">
              <FileQuestion className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-slate-800 text-base">
                  {activeQuiz.title}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                  {activeQuiz.subjectName}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {activeQuiz.classSectionName} • {totalQCount} Questions • Total{' '}
                {activeQuiz.totalMarks} Marks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-bold text-sm tracking-wider transition-colors ${
                isTimeUrgent
                  ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                  : 'bg-slate-100 border-slate-300 text-slate-800'
              }`}
            >
              <Clock
                className={`w-4 h-4 ${isTimeUrgent ? 'text-rose-600' : 'text-slate-600'}`}
              />
              <span>
                {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
              </span>
            </div>

            <button
              onClick={() => setIsSubmitConfirmOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <CheckSquare className="w-4 h-4" />
              Submit Quiz
            </button>
          </div>
        </div>

        <div className="flex-1 bg-slate-50 overflow-y-auto p-4 sm:p-8 flex justify-center">
          <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col justify-between min-h-[460px]">
              {currentQ ? (
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Question {currentQuestionIndex + 1} of {totalQCount}
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                        {currentQ.questionType.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                        +{currentQ.marks || 1} Mark
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleFlag(currentQ.id)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                        studentAnswers[currentQ.id]?.isFlagged
                          ? 'bg-amber-50 text-amber-700 border-amber-300'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Flag className="w-3.5 h-3.5" />
                      {studentAnswers[currentQ.id]?.isFlagged
                        ? 'Flagged for Review'
                        : 'Mark for Review'}
                    </button>
                  </div>

                  <h2 className="text-base sm:text-lg font-semibold text-slate-800 leading-relaxed mb-6">
                    {currentQ.questionText}
                  </h2>

                  <div className="mt-4">
                    {currentQ.questionType === 'mcq' && (
                      <div className="space-y-3">
                        {currentQ.options?.map(
                          (option: string, idx: number) => {
                            const isSelected =
                              studentAnswers[currentQ.id]?.answer === option;
                            const optionLetter = String.fromCharCode(65 + idx);
                            return (
                              <div
                                key={idx}
                                onClick={() =>
                                  handleAnswerSelect(currentQ.id, option)
                                }
                                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                                  isSelected
                                    ? 'bg-brand-50/70 border-brand-500 shadow-sm text-brand-900 font-medium'
                                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                <div
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                    isSelected
                                      ? 'bg-brand-500 text-white shadow-sm'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {optionLetter}
                                </div>
                                <span className="text-sm">{option}</span>
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}

                    {currentQ.questionType === 'true_false' && (
                      <div className="grid grid-cols-2 gap-4">
                        {['True', 'False'].map((choice) => {
                          const isSelected =
                            studentAnswers[currentQ.id]?.answer === choice;
                          return (
                            <button
                              key={choice}
                              type="button"
                              onClick={() =>
                                handleAnswerSelect(currentQ.id, choice)
                              }
                              className={`py-6 rounded-xl border text-base font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                                isSelected
                                  ? choice === 'True'
                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                                    : 'bg-rose-50 border-rose-500 text-rose-800 shadow-sm'
                                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <span className="text-lg">
                                {choice === 'True' ? '✓' : '✕'}
                              </span>
                              <span>{choice}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {currentQ.questionType === 'fill_in_the_blank' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-2">
                          Type your answer in the field below:
                        </label>
                        <input
                          type="text"
                          value={studentAnswers[currentQ.id]?.answer || ''}
                          onChange={(e) =>
                            handleAnswerSelect(currentQ.id, e.target.value)
                          }
                          placeholder="Type answer here..."
                          className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm font-medium"
                        />
                      </div>
                    )}

                    {currentQ.questionType === 'short_answer' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-2">
                          Write a concise answer:
                        </label>
                        <textarea
                          rows={3}
                          value={studentAnswers[currentQ.id]?.answer || ''}
                          onChange={(e) =>
                            handleAnswerSelect(currentQ.id, e.target.value)
                          }
                          placeholder="Write concise answer..."
                          className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm font-medium resize-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => handleClearAnswer(currentQ?.id)}
                  disabled={!studentAnswers[currentQ?.id]?.answer}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-all cursor-pointer"
                >
                  Clear Answer
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
                    }
                    disabled={currentQuestionIndex === 0}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs flex items-center gap-1.5 disabled:opacity-40 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  {currentQuestionIndex < totalQCount - 1 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentQuestionIndex((prev) =>
                          Math.min(totalQCount - 1, prev + 1)
                        )
                      }
                      className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsSubmitConfirmOpen(true)}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      Finish & Submit
                      <CheckSquare className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3">
                Question Navigator
              </h3>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-600 mb-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-500 shrink-0"></span>
                  Answered ({answeredCount})
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-400 shrink-0"></span>
                  Flagged ({flaggedCount})
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-slate-200 shrink-0"></span>
                  Unanswered ({totalQCount - answeredCount})
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded border-2 border-brand-500 shrink-0"></span>
                  Current
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {activeQuiz.questions?.map((q: any, idx: number) => {
                  const hasAnswer =
                    (studentAnswers[q.id]?.answer || '').trim() !== '';
                  const isFlagged = studentAnswers[q.id]?.isFlagged;
                  const isCurrent = idx === currentQuestionIndex;

                  let btnStyle =
                    'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200';
                  if (hasAnswer) {
                    btnStyle =
                      'bg-emerald-500 text-white border-emerald-600 font-bold';
                  }
                  if (isFlagged) {
                    btnStyle =
                      'bg-amber-400 text-slate-900 border-amber-500 font-bold';
                  }
                  if (isCurrent) {
                    btnStyle += ' ring-2 ring-brand-500 ring-offset-2';
                  }

                  return (
                    <button
                      key={q.id || idx}
                      type="button"
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`h-9 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${btnStyle}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSubmitConfirmOpen(true)}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <CheckSquare className="w-4 h-4" />
                  Submit Quiz
                </button>
              </div>
            </div>
          </div>
        </div>

        <Modal
          isOpen={isSubmitConfirmOpen}
          onClose={() => setIsSubmitConfirmOpen(false)}
          title="Submit Quiz Confirmation"
        >
          <div className="p-6 space-y-4">
            <p className="text-sm text-slate-600">
              Are you sure you want to finalize and submit your answers? Once
              submitted, your score will be computed and your attempt will be
              completed.
            </p>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xl font-bold text-emerald-600">
                  {answeredCount}
                </p>
                <p className="text-[11px] font-semibold text-slate-500 uppercase">
                  Answered
                </p>
              </div>
              <div>
                <p className="text-xl font-bold text-amber-500">
                  {flaggedCount}
                </p>
                <p className="text-[11px] font-semibold text-slate-500 uppercase">
                  Flagged
                </p>
              </div>
              <div>
                <p className="text-xl font-bold text-slate-500">
                  {totalQCount - answeredCount}
                </p>
                <p className="text-[11px] font-semibold text-slate-500 uppercase">
                  Unanswered
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsSubmitConfirmOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100"
              >
                Return to Quiz
              </button>
              <button
                type="button"
                onClick={handleManualSubmit}
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
              >
                {isSubmitting ? 'Submitting...' : 'Yes, Submit Now'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Subject-wise Quizzes
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200">
              {role.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Standardized assessments, 10-question evaluation modules, and
            instant grading analytics.
          </p>
        </div>

        {isStaff && (
          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                resetBuilder();
                setIsAiModalOpen(true);
                setIsBuilderOpen(true);
              }}
              className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Generate with AI</span>
            </button>
            <button
              type="button"
              onClick={() => {
                resetBuilder();
                setIsBuilderOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Subject Quiz</span>
            </button>
          </div>
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
                    {child.name} ({child.className || 'Class'}{' '}
                    {child.section || ''} • #{child.rollNumber || '—'})
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {!isParent && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-500 uppercase">
                Subject:
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setSelectedSubject('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  selectedSubject === 'all'
                    ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                All Subjects
              </button>
              {subjectsList.map((sub: any) => {
                const isSelected = selectedSubject === sub._id;
                return (
                  <button
                    key={sub._id}
                    type="button"
                    onClick={() => setSelectedSubject(sub._id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {sub.name}
                  </button>
                );
              })}
            </div>
          </div>

          {isStudent && (
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
              {(['all', 'available', 'completed'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSelectedStatusTab(tab)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                    selectedStatusTab === tab
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab === 'all' ? 'All' : tab}
                </button>
              ))}
            </div>
          )}

          {isStaff && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">
                Class:
              </span>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="all">All Classes</option>
                {classesData?.classes?.map((c: any) => (
                  <option key={c._id} value={c._id}>
                    Class {c.name}-{c.section}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {isParent ? (
        <div>
          {loadingParentQuizzes ? (
            <LoadingState message="Loading child's quiz performance..." />
          ) : !parentQuizzesData?.history?.length ? (
            <EmptyState
              title="No Quiz Records Yet"
              description="Your child has not completed any subject quizzes yet. Records will display here once submitted."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {parentQuizzesData.history.map((record: any) => {
                const subColor = SUBJECT_COLORS[record.subjectName] || {
                  bg: 'bg-slate-50',
                  text: 'text-slate-700',
                  border: 'border-slate-200',
                };
                return (
                  <div
                    key={record.attemptId}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${subColor.bg} ${subColor.text} ${subColor.border}`}
                        >
                          {record.subjectName}
                        </span>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                            record.isPassed
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {record.isPassed ? 'Passed' : 'Needs Improvement'}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-800 text-sm mb-1">
                        {record.quizTitle}
                      </h3>
                      <p className="text-xs text-slate-400">
                        Taken on{' '}
                        {new Date(record.submittedAt).toLocaleDateString()}
                      </p>

                      <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-semibold text-slate-500 uppercase">
                            Score
                          </p>
                          <p className="text-base font-bold text-slate-800">
                            {record.totalMarksObtained} / {record.maxMarks}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] font-semibold text-slate-500 uppercase">
                            Percentage
                          </p>
                          <p className="text-base font-bold text-brand-600">
                            {record.percentage}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div>
          {loadingQuizzes ? (
            <LoadingState message="Loading subject quizzes..." />
          ) : filteredQuizzes.length === 0 ? (
            <EmptyState
              title="No Quizzes Found"
              description="There are currently no quizzes matching your selected filters."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredQuizzes.map((quiz: any) => {
                const subColor = SUBJECT_COLORS[quiz.subjectName] || {
                  bg: 'bg-slate-50',
                  text: 'text-slate-700',
                  border: 'border-slate-200',
                };
                const isCompleted = quiz.studentAttempt?.isCompleted;
                const isDraft = quiz.status === 'draft';
                const has10Questions = (quiz.questions?.length || 0) >= 10;

                return (
                  <div
                    key={quiz._id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${subColor.bg} ${subColor.text} ${subColor.border}`}
                        >
                          {quiz.subjectName}
                        </span>

                        {isStudent ? (
                          isCompleted ? (
                            <span
                              className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                                quiz.studentAttempt?.isPassed
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {quiz.studentAttempt?.isPassed
                                ? 'Passed'
                                : 'Completed'}{' '}
                              ({quiz.studentAttempt?.score}/{quiz.totalMarks})
                            </span>
                          ) : (
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-brand-50 text-brand-700 border border-brand-200">
                              Available to Attempt
                            </span>
                          )
                        ) : (
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                              quiz.status === 'published'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {quiz.status}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-slate-800 text-base mb-1.5">
                        {quiz.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                        {quiz.description ||
                          'Subject mastery evaluation module.'}
                      </p>

                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-5">
                        <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <Layers className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">
                            {quiz.classSectionName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <FileQuestion className="w-3.5 h-3.5 text-slate-400" />
                          <span>{quiz.questions?.length || 10} Questions</span>
                        </div>
                        <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{quiz.duration} Minutes</span>
                        </div>
                        <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <Award className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            Total {quiz.totalMarks} (Pass: {quiz.passingMarks})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400 font-medium">
                        Due:{' '}
                        {quiz.dueDate
                          ? new Date(quiz.dueDate).toLocaleDateString()
                          : 'Open'}
                      </span>

                      {isStudent && (
                        <div>
                          {isCompleted ? (
                            <button
                              type="button"
                              onClick={() => setViewResultQuizId(quiz._id)}
                              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                              <Award className="w-3.5 h-3.5 text-brand-600" />
                              View Scorecard
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setPreStartModalQuiz(quiz)}
                              className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5" />
                              Attempt Quiz
                            </button>
                          )}
                        </div>
                      )}

                      {isStaff && (
                        <div className="flex items-center gap-1.5">
                          {isDraft && (
                            <button
                              type="button"
                              onClick={() =>
                                publishQuizMutation.mutate(quiz._id)
                              }
                              disabled={!has10Questions}
                              title={
                                !has10Questions
                                  ? 'Requires at least 10 unique questions to publish'
                                  : 'Publish quiz to class'
                              }
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <Send className="w-3 h-3" />
                              Publish
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setReportsQuiz(quiz)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <BarChart2 className="w-3 h-3 text-slate-500" />
                            Reports ({quiz.attemptCount || 0})
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  'Are you sure you want to delete this quiz?'
                                )
                              ) {
                                deleteQuizMutation.mutate(quiz._id);
                              }
                            }}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={!!preStartModalQuiz}
        onClose={() => setPreStartModalQuiz(null)}
        title="Quiz Instructions & Rules"
      >
        {preStartModalQuiz && (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 p-3.5 bg-brand-50 rounded-xl border border-brand-200">
              <BookOpen className="w-5 h-5 text-brand-600 shrink-0" />
              <div>
                <h4 className="font-bold text-brand-900 text-sm">
                  {preStartModalQuiz.title}
                </h4>
                <p className="text-xs text-brand-700">
                  {preStartModalQuiz.subjectName} •{' '}
                  {preStartModalQuiz.classSectionName}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  <strong>Duration:</strong> {preStartModalQuiz.duration}{' '}
                  minutes countdown from when you click Start.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  <strong>Total Questions:</strong>{' '}
                  {preStartModalQuiz.questions?.length || 10} questions (MCQ,
                  True/False, Fill in Blank, Short Answer).
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  <strong>Single Attempt:</strong> You can only take this quiz
                  once. Auto-submission occurs when time expires.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  <strong>Immediate Review:</strong> Explanations and correct
                  answers are revealed right after submission.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPreStartModalQuiz(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleStartQuiz(preStartModalQuiz)}
                className="px-5 py-2.5 text-xs font-bold rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-4 h-4" />
                Start Quiz Now
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!viewResultQuizId}
        onClose={() => setViewResultQuizId(null)}
        title="Quiz Scorecard & Answer Review"
      >
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {loadingResult ? (
            <LoadingState message="Loading your result scorecard..." />
          ) : resultData?.result ? (
            <>
              <div
                className={`p-6 rounded-2xl border text-center ${
                  resultData.result.isPassed
                    ? 'bg-gradient-to-b from-emerald-50 to-white border-emerald-200'
                    : 'bg-gradient-to-b from-amber-50 to-white border-amber-200'
                }`}
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 shadow-sm bg-white">
                  {resultData.result.isPassed ? (
                    <Award className="w-7 h-7 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-7 h-7 text-amber-500" />
                  )}
                </div>
                <h3 className="text-xl font-bold text-slate-800">
                  {resultData.result.isPassed
                    ? 'Congratulations! You Passed!'
                    : 'Quiz Completed'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {resultData.result.quizTitle} •{' '}
                  {resultData.result.subjectName}
                </p>

                <div className="grid grid-cols-4 gap-2 mt-6 pt-4 border-t border-slate-200/60">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase">
                      Score
                    </p>
                    <p className="text-lg font-bold text-slate-800">
                      {resultData.result.totalMarksObtained} /{' '}
                      {resultData.result.maxMarks}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase">
                      Percentage
                    </p>
                    <p className="text-lg font-bold text-brand-600">
                      {resultData.result.percentage}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase">
                      Correct
                    </p>
                    <p className="text-lg font-bold text-emerald-600">
                      {resultData.result.correctAnswers}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase">
                      Wrong
                    </p>
                    <p className="text-lg font-bold text-rose-600">
                      {resultData.result.wrongAnswers}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-3">
                  Question-by-Question Review
                </h4>
                <div className="space-y-4">
                  {resultData.result.questions?.map(
                    (item: any, idx: number) => {
                      const isCorrect = item.isCorrect;
                      return (
                        <div
                          key={item.questionId || idx}
                          className={`p-4 rounded-xl border text-xs ${
                            isCorrect
                              ? 'bg-emerald-50/40 border-emerald-200'
                              : 'bg-rose-50/40 border-rose-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-slate-700">
                              Question {idx + 1}
                            </span>
                            <span
                              className={`font-semibold px-2 py-0.5 rounded-full ${
                                isCorrect
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {isCorrect ? 'Correct (+1)' : 'Incorrect (0)'}
                            </span>
                          </div>
                          <p className="text-slate-800 font-medium mb-3">
                            {item.questionText}
                          </p>

                          <div className="space-y-1.5 bg-white p-3 rounded-lg border border-slate-200/80 mb-2">
                            <div>
                              <span className="text-slate-500 font-semibold">
                                Your Answer:{' '}
                              </span>
                              <span
                                className={`font-bold ${
                                  isCorrect
                                    ? 'text-emerald-700'
                                    : 'text-rose-700'
                                }`}
                              >
                                {item.studentAnswer || '(No answer provided)'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 font-semibold">
                                Correct Answer:{' '}
                              </span>
                              <span className="font-bold text-emerald-700">
                                {item.correctAnswer}
                              </span>
                            </div>
                          </div>

                          {item.explanation && (
                            <p className="text-slate-600 italic">
                              <strong>Explanation:</strong> {item.explanation}
                            </p>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-500">No result data available.</p>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setViewResultQuizId(null)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-white hover:bg-slate-900"
            >
              Close Scorecard
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        title="Create Subject Quiz (≥ 10 Questions Required to Publish)"
      >
        <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Quiz Title *
              </label>
              <input
                type="text"
                value={builderTitle}
                onChange={(e) => setBuilderTitle(e.target.value)}
                placeholder="e.g., Trigonometry & Quadratic Equations Mastery"
                className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Subject *
              </label>
              <select
                value={builderSubjectId}
                onChange={(e) => setBuilderSubjectId(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="">Select Subject...</option>
                {subjectsList.map((s: any) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Class & Section *
              </label>
              <select
                value={builderClassId}
                onChange={(e) => setBuilderClassId(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="">Select Class...</option>
                {classesData?.classes?.map((c: any) => (
                  <option key={c._id} value={c._id}>
                    Class {c.name}-{c.section}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={builderDueDate}
                onChange={(e) => setBuilderDueDate(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Duration (Minutes)
              </label>
              <input
                type="number"
                min={5}
                max={120}
                value={builderDuration}
                onChange={(e) => setBuilderDuration(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Passing Marks
              </label>
              <input
                type="number"
                min={1}
                value={builderPassingMarks}
                onChange={(e) => setBuilderPassingMarks(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={builderDescription}
              onChange={(e) => setBuilderDescription(e.target.value)}
              placeholder="Instructions or syllabus covered..."
              className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500/20 resize-none"
            />
          </div>

          {aiSuccessMessage && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{aiSuccessMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setAiSuccessMessage('')}
                className="text-emerald-600 hover:text-emerald-800 font-bold text-sm px-1.5 cursor-pointer"
              >
                ×
              </button>
            </div>
          )}

          <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1.5">
                  AI Quiz Generator
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 normal-case tracking-normal">
                    Topic & Subject
                  </span>
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Type any topic (e.g. <em>Photosynthesis</em>,{' '}
                  <em>Quadratic Equations</em>, <em>Python Loops</em>) to
                  auto-generate 10+ questions.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setAiSubjectId(builderSubjectId);
                setAiError('');
                setIsAiModalOpen(true);
              }}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-sm flex items-center justify-center gap-1.5 shrink-0 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>✨ Generate with AI</span>
            </button>
          </div>

          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/70 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Add Questions ({builderQuestions.length} added • Minimum 10
                required to publish)
              </h4>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  builderQuestions.length >= 10
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {builderQuestions.length >= 10
                  ? 'Ready to Publish'
                  : `${10 - builderQuestions.length} more needed to publish`}
              </span>
            </div>

            {qError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{qError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Question Type
                </label>
                <select
                  value={qType}
                  onChange={(e) => setQType(e.target.value as any)}
                  className="w-full px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-300 bg-white"
                >
                  <option value="mcq">Multiple Choice (MCQ)</option>
                  <option value="true_false">True / False</option>
                  <option value="fill_in_the_blank">Fill in the Blank</option>
                  <option value="short_answer">Short Answer</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Difficulty
                </label>
                <select
                  value={qDifficulty}
                  onChange={(e) => setQDifficulty(e.target.value as any)}
                  className="w-full px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-300 bg-white"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Question Text *
              </label>
              <input
                type="text"
                value={qText}
                onChange={(e) => setQText(e.target.value)}
                placeholder="Enter unique question text..."
                className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-white"
              />
            </div>

            {qType === 'mcq' && (
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-600 uppercase">
                  Options (4 Options)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {qOptions.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-5 text-xs font-bold text-slate-400">
                        {String.fromCharCode(65 + i)}:
                      </span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const next = [...qOptions];
                          next[i] = e.target.value;
                          setQOptions(next);
                        }}
                        placeholder={`Option ${String.fromCharCode(65 + i)}`}
                        className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Correct Answer *
                </label>
                {qType === 'true_false' ? (
                  <select
                    value={qCorrectAnswer}
                    onChange={(e) => setQCorrectAnswer(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="">Select Correct Option...</option>
                    <option value="True">True</option>
                    <option value="False">False</option>
                  </select>
                ) : qType === 'mcq' ? (
                  <select
                    value={qCorrectAnswer}
                    onChange={(e) => setQCorrectAnswer(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="">Select Correct Answer...</option>
                    {qOptions.filter(Boolean).map((opt, i) => (
                      <option key={i} value={opt}>
                        {String.fromCharCode(65 + i)}: {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={qCorrectAnswer}
                    onChange={(e) => setQCorrectAnswer(e.target.value)}
                    placeholder="Exact correct answer key..."
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
                  />
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Explanation
                </label>
                <input
                  type="text"
                  value={qExplanation}
                  onChange={(e) => setQExplanation(e.target.value)}
                  placeholder="Rationale shown to student after submission..."
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleAddQuestionToBuilder}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Question
              </button>
            </div>
          </div>

          {builderQuestions.length > 0 && (
            <div>
              <h5 className="font-bold text-slate-700 text-xs uppercase mb-3">
                Questions List ({builderQuestions.length})
              </h5>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {builderQuestions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-bold text-slate-400">
                        #{idx + 1}
                      </span>
                      <span className="font-semibold text-slate-800 truncate">
                        {q.questionText}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                        {q.questionType}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveQuestionFromBuilder(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsBuilderOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSaveQuiz('draft')}
                disabled={createQuizMutation.isPending}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                Save as Draft
              </button>

              <button
                type="button"
                onClick={() => handleSaveQuiz('published')}
                disabled={
                  builderQuestions.length < 10 || createQuizMutation.isPending
                }
                className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Publish Quiz (≥ 10 Questions)
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!reportsQuiz}
        onClose={() => setReportsQuiz(null)}
        title={`Quiz Reports: ${reportsQuiz?.title || ''}`}
      >
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {loadingReports ? (
            <LoadingState message="Loading student attempt records..." />
          ) : !teacherReportsData?.reports?.length ? (
            <EmptyState
              title="No Attempts Recorded"
              description="No students have submitted an attempt for this quiz yet."
            />
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                  <tr>
                    <th className="px-3 py-2.5">Roll No</th>
                    <th className="px-3 py-2.5">Student Name</th>
                    <th className="px-3 py-2.5">Score</th>
                    <th className="px-3 py-2.5">Percentage</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5">Submitted At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teacherReportsData.reports.map((rep: any) => (
                    <tr
                      key={rep.attemptId || rep.studentId}
                      className="hover:bg-slate-50/50"
                    >
                      <td className="px-3 py-2.5 font-bold text-slate-700">
                        {rep.rollNumber}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-slate-800">
                        {rep.studentName}
                      </td>
                      <td className="px-3 py-2.5 font-bold text-slate-800">
                        {rep.score} / {rep.maxMarks}
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-brand-600">
                        {rep.percentage}%
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            rep.isPassed
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {rep.isPassed ? 'Passed' : 'Failed'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-400">
                        {rep.submittedAt
                          ? new Date(rep.submittedAt).toLocaleString()
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setReportsQuiz(null)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-white hover:bg-slate-900"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isAiModalOpen}
        onClose={() => !isGeneratingAi && setIsAiModalOpen(false)}
        title="✨ Generate Quiz with AI (Topic & Subject)"
      >
        <div className="p-6 space-y-4">
          <div className="p-3.5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 text-xs text-slate-700 leading-relaxed flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-indigo-950">
                AI Academic Quiz Synthesizer
              </p>
              <p className="text-slate-600 mt-0.5">
                EduHub AI synthesizes a balanced set of conceptual questions
                (MCQ, True/False, Fill in Blank, Short Answer) with validated
                correct answers and explanations for your chosen topic.
              </p>
            </div>
          </div>

          {aiError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{aiError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Select Subject *
            </label>
            <select
              value={aiSubjectId || builderSubjectId}
              onChange={(e) => setAiSubjectId(e.target.value)}
              disabled={isGeneratingAi}
              className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">Select Subject...</option>
              {subjectsList.map((s: any) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Topic or Chapter Name *
            </label>
            <input
              type="text"
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder="e.g. Photosynthesis, Quadratic Equations, Newton's Laws, Python Lists..."
              disabled={isGeneratingAi}
              className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Enter any specific academic topic or unit from your syllabus.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Number of Questions
              </label>
              <select
                value={aiNumQuestions}
                onChange={(e) => setAiNumQuestions(Number(e.target.value))}
                disabled={isGeneratingAi}
                className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value={10}>10 Questions (Required to publish)</option>
                <option value={12}>12 Questions</option>
                <option value={15}>15 Questions</option>
                <option value={20}>20 Questions</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Difficulty Level
              </label>
              <select
                value={aiDifficulty}
                onChange={(e) => setAiDifficulty(e.target.value as any)}
                disabled={isGeneratingAi}
                className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="easy">Easy (Foundational)</option>
                <option value="medium">Medium (Standard)</option>
                <option value="hard">Hard (Advanced)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAiModalOpen(false)}
              disabled={isGeneratingAi}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleGenerateWithAi}
              disabled={isGeneratingAi || !aiTopic.trim()}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isGeneratingAi ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Synthesizing Questions...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Generate Questions</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default QuizzesPage;
