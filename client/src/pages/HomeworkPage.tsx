import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { modulesApi, academicsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Modal,
  LoadingState,
  EmptyState,
  AiHomeworkHintModal,
} from '../components/common';
import {
  BookOpen,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
  Award,
  Send,
  Eye,
  Sparkles,
} from 'lucide-react';
import { hasPermission, PERMISSIONS } from '@eduhub/shared';

export const HomeworkPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedClassId, setSelectedClassId] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedHomeworkForSubmissions, setSelectedHomeworkForSubmissions] =
    useState<any | null>(null);
  const [selectedHomeworkForSubmit, setSelectedHomeworkForSubmit] = useState<
    any | null
  >(null);
  const [hintHomework, setHintHomework] = useState<any | null>(null);

  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    classSectionId: '',
    subjectId: '',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    maxMarks: 100,
    aiHintsEnabled: true,
  });

  const [submissionForm, setSubmissionForm] = useState({
    submissionText: '',
    fileName: '',
  });

  const [gradeInputs, setGradeInputs] = useState<
    Record<string, { marks: number; feedback: string }>
  >({});

  const canCreate =
    user?.role === 'admin' ||
    (user?.role === 'teacher' &&
      hasPermission(user.role, user.permissions, PERMISSIONS.HOMEWORK_CREATE));
  const canGrade =
    user?.role === 'admin' ||
    (user?.role === 'teacher' &&
      hasPermission(user.role, user.permissions, PERMISSIONS.HOMEWORK_GRADE));

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => academicsApi.getClasses(),
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => academicsApi.getSubjects(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['homework', selectedClassId],
    queryFn: () =>
      modulesApi.getHomework({ classSectionId: selectedClassId || undefined }),
  });

  const { data: submissionsData, isLoading: isLoadingSubmissions } = useQuery({
    queryKey: ['homework-submissions', selectedHomeworkForSubmissions?._id],
    queryFn: () =>
      modulesApi.getHomeworkSubmissions(selectedHomeworkForSubmissions!._id),
    enabled: !!selectedHomeworkForSubmissions?._id,
  });

  const createMutation = useMutation({
    mutationFn: (newHw: any) => modulesApi.createHomework(newHw),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homework'] });
      setIsCreateModalOpen(false);
      setCreateForm({
        title: '',
        description: '',
        classSectionId: '',
        subjectId: '',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        maxMarks: 100,
        aiHintsEnabled: true,
      });
      alert('Homework created successfully.');
    },
    onError: (err: any) => alert(err.message || 'Failed to assign homework'),
  });

  const submitMutation = useMutation({
    mutationFn: ({
      homeworkId,
      payload,
    }: {
      homeworkId: string;
      payload: any;
    }) => modulesApi.submitHomework(homeworkId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homework'] });
      setSelectedHomeworkForSubmit(null);
      setSubmissionForm({ submissionText: '', fileName: '' });
      alert('Homework submitted successfully!');
    },
    onError: (err: any) => alert(err.message || 'Failed to submit homework'),
  });

  const gradeMutation = useMutation({
    mutationFn: ({
      subId,
      marks,
      feedback,
    }: {
      subId: string;
      marks: number;
      feedback: string;
    }) =>
      modulesApi.gradeHomeworkSubmission(subId, {
        marksObtained: marks,
        feedback,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['homework-submissions', selectedHomeworkForSubmissions?._id],
      });
      queryClient.invalidateQueries({ queryKey: ['homework'] });
      alert('Grade saved successfully.');
    },
    onError: (err: any) => alert(err.message || 'Failed to grade submission'),
  });

  const handleGradeSubmit = (subId: string) => {
    const input = gradeInputs[subId];
    if (!input || input.marks === undefined) {
      alert('Please enter a valid marks score.');
      return;
    }
    gradeMutation.mutate({
      subId,
      marks: Number(input.marks),
      feedback: input.feedback || '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Homework & Assignments
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Curriculum assignments, student submissions, and evaluations for
            Adiya School.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            Assign Homework
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="w-64">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 cursor-pointer"
          >
            <option value="">All Classes</option>
            {classesData?.classes?.map((c: any) => (
              <option key={c._id} value={c._id}>
                {c.name} - Section {c.section}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-500 font-medium hidden sm:inline-block">
          Active Assignments: <strong>{data?.homework?.length || 0}</strong>
        </span>
      </div>

      {isLoading ? (
        <LoadingState message="Loading homework assignments..." />
      ) : data?.homework?.length === 0 ? (
        <EmptyState
          title="No homework assigned"
          description="There are currently no homework assignments for this selection."
          actionLabel={canCreate ? 'Assign First Homework' : undefined}
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data?.homework?.map((hw: any) => {
            const isStudent = user?.role === 'student';
            const isParent = user?.role === 'parent';
            const studentSub = hw.studentSubmission;

            return (
              <div
                key={hw._id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                      {hw.subjectName}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      Due: {hw.dueDate}
                    </div>
                  </div>

                  <h3 className="font-bold text-base text-slate-800 tracking-tight mb-2">
                    {hw.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {hw.description}
                  </p>

                  <div className="mt-3 flex items-center gap-3 text-xs text-slate-500 font-medium">
                    <span>Max Marks: {hw.maxMarks || 100}</span>
                    <span>•</span>
                    <span>
                      {hw.className} - {hw.section}
                    </span>
                    <span>•</span>
                    <span>By {hw.teacherName || 'Faculty'}</span>
                  </div>

                  {(isStudent || isParent) && (
                    <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      {studentSub ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-700">
                              Submission Status:
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                              Submitted {studentSub.isLate ? '(Late)' : ''}
                            </span>
                          </div>
                          {studentSub.status === 'graded' ? (
                            <div className="pt-2 border-t border-slate-200 mt-2 flex items-center justify-between text-brand-700 font-semibold">
                              <span>
                                Grade: {studentSub.marksObtained} /{' '}
                                {hw.maxMarks || 100}
                              </span>
                              {studentSub.feedback && (
                                <span className="text-slate-500 font-normal italic">
                                  "{studentSub.feedback}"
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="text-slate-500 text-[11px] pt-1">
                              Awaiting teacher grading and feedback.
                            </div>
                          )}
                          {isStudent && hw.aiHintsEnabled !== false && (
                            <button
                              type="button"
                              onClick={() => setHintHomework(hw)}
                              className="mt-2.5 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold text-[11px] transition-all flex items-center gap-1 cursor-pointer w-fit shadow-xs"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                              Review with AI Hint
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-amber-700 font-medium flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> Pending
                            Submission
                          </span>
                          {isStudent && (
                            <div className="flex items-center gap-2">
                              {hw.aiHintsEnabled !== false && (
                                <button
                                  type="button"
                                  onClick={() => setHintHomework(hw)}
                                  className="px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                                  AI Homework Hint
                                </button>
                              )}
                              <button
                                onClick={() => setSelectedHomeworkForSubmit(hw)}
                                className="px-3 py-1 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs transition-all shadow-sm cursor-pointer"
                              >
                                Submit Now
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {hw.submissionCount || 0} Submissions
                  </span>

                  {(user?.role === 'admin' || user?.role === 'teacher') && (
                    <button
                      onClick={() => setSelectedHomeworkForSubmissions(hw)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-1 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Submissions
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Assign New Homework"
        subtitle="Adiya School Academic Assignment"
        maxWidth="max-w-xl"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(createForm);
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Assignment Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Exercise 4.2 - Quadratic Equations Proofs"
              value={createForm.title}
              onChange={(e) =>
                setCreateForm({ ...createForm, title: e.target.value })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Target Class *
              </label>
              <select
                required
                value={createForm.classSectionId}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    classSectionId: e.target.value,
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white cursor-pointer"
              >
                <option value="">Select Class</option>
                {classesData?.classes?.map((c: any) => (
                  <option key={c._id} value={c._id}>
                    {c.name} - Section {c.section}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Subject *
              </label>
              <select
                required
                value={createForm.subjectId}
                onChange={(e) =>
                  setCreateForm({ ...createForm, subjectId: e.target.value })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white cursor-pointer"
              >
                <option value="">Select Subject</option>
                {subjectsData?.subjects?.map((s: any) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Due Date *
              </label>
              <input
                type="date"
                required
                value={createForm.dueDate}
                onChange={(e) =>
                  setCreateForm({ ...createForm, dueDate: e.target.value })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Max Marks *
              </label>
              <input
                type="number"
                min={1}
                max={500}
                required
                value={createForm.maxMarks}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    maxMarks: Number(e.target.value),
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Instructions & Questions *
            </label>
            <textarea
              rows={3}
              required
              placeholder="List specific question numbers, textbook chapters, or project criteria..."
              value={createForm.description}
              onChange={(e) =>
                setCreateForm({ ...createForm, description: e.target.value })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-1 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
            <input
              type="checkbox"
              id="aiHintsEnabled"
              checked={createForm.aiHintsEnabled}
              onChange={(e) =>
                setCreateForm({
                  ...createForm,
                  aiHintsEnabled: e.target.checked,
                })
              }
              className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
            />
            <label
              htmlFor="aiHintsEnabled"
              className="text-xs font-semibold text-slate-700 cursor-pointer"
            >
              Enable AI Homework Hints for Students (4-level guided clues, final
              answers kept hidden)
            </label>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-sm transition-all"
            >
              {createMutation.isPending ? 'Publishing...' : 'Assign Homework'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!selectedHomeworkForSubmit}
        onClose={() => setSelectedHomeworkForSubmit(null)}
        title="Submit Homework"
        subtitle={selectedHomeworkForSubmit?.title || ''}
        maxWidth="max-w-lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const payload: any = {
              submissionText: submissionForm.submissionText,
            };
            if (submissionForm.fileName) {
              payload.attachments = [
                {
                  fileName: submissionForm.fileName,
                  fileUrl: `/mock-submissions/${Date.now()}-${submissionForm.fileName}`,
                  fileSize: 1024 * 512,
                },
              ];
            }
            submitMutation.mutate({
              homeworkId: selectedHomeworkForSubmit._id,
              payload,
            });
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Your Answer / Solution Text
            </label>
            <textarea
              rows={4}
              required
              placeholder="Type your homework solution, explanations, or answers here..."
              value={submissionForm.submissionText}
              onChange={(e) =>
                setSubmissionForm({
                  ...submissionForm,
                  submissionText: e.target.value,
                })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Attachment Name (Optional File Upload)
            </label>
            <input
              type="text"
              placeholder="e.g. Solution_Worksheet_Aarav.pdf"
              value={submissionForm.fileName}
              onChange={(e) =>
                setSubmissionForm({
                  ...submissionForm,
                  fileName: e.target.value,
                })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setSelectedHomeworkForSubmit(null)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitMutation.isPending}
              className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-sm transition-all"
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit Homework'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!selectedHomeworkForSubmissions}
        onClose={() => setSelectedHomeworkForSubmissions(null)}
        title="Student Submissions & Grading"
        subtitle={selectedHomeworkForSubmissions?.title || ''}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4 text-xs">
          {isLoadingSubmissions ? (
            <LoadingState message="Loading submissions..." />
          ) : submissionsData?.submissions?.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No submissions have been received for this assignment yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-2">
              {submissionsData?.submissions?.map((sub: any) => {
                const currentGrade = gradeInputs[sub._id] || {
                  marks: sub.marksObtained ?? '',
                  feedback: sub.feedback || '',
                };

                return (
                  <div key={sub._id} className="py-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800 text-sm">
                          {sub.studentName}
                        </span>
                        <span className="ml-2 text-slate-500 text-xs">
                          Roll: {sub.rollNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {sub.isLate && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Late Submission
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            sub.status === 'graded'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {sub.status === 'graded' ? 'Graded' : 'Submitted'}
                        </span>
                      </div>
                    </div>

                    {sub.submissionText && (
                      <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {sub.submissionText}
                      </p>
                    )}

                    {sub.attachments?.length > 0 && (
                      <div className="flex items-center gap-2 pt-1">
                        <FileText className="w-3.5 h-3.5 text-brand-600" />
                        <span className="text-slate-600 font-medium">
                          {sub.attachments[0].fileName}
                        </span>
                      </div>
                    )}

                    {canGrade && (
                      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 p-2.5 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-2">
                          <label className="font-semibold text-slate-600">
                            Marks (Max{' '}
                            {selectedHomeworkForSubmissions?.maxMarks || 100}):
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={
                              selectedHomeworkForSubmissions?.maxMarks || 100
                            }
                            value={currentGrade.marks}
                            onChange={(e) =>
                              setGradeInputs({
                                ...gradeInputs,
                                [sub._id]: {
                                  ...currentGrade,
                                  marks: Number(e.target.value),
                                },
                              })
                            }
                            className="w-20 px-2.5 py-1 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-brand-500"
                          />
                        </div>

                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Feedback (e.g. Well done!)..."
                            value={currentGrade.feedback}
                            onChange={(e) =>
                              setGradeInputs({
                                ...gradeInputs,
                                [sub._id]: {
                                  ...currentGrade,
                                  feedback: e.target.value,
                                },
                              })
                            }
                            className="w-full px-2.5 py-1 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-brand-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleGradeSubmit(sub._id)}
                            disabled={gradeMutation.isPending}
                            className="px-3 py-1 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs whitespace-nowrap shadow-sm"
                          >
                            Save Grade
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => setSelectedHomeworkForSubmissions(null)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      <AiHomeworkHintModal
        isOpen={!!hintHomework}
        onClose={() => setHintHomework(null)}
        homework={hintHomework}
      />
    </div>
  );
};
