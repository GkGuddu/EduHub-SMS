import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { modulesApi, academicsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal, LoadingState, EmptyState } from '../components/common';
import {
  FileText,
  Download,
  Plus,
  BookOpen,
  ExternalLink,
  Tag,
  Video,
  Link as LinkIcon,
  File,
} from 'lucide-react';
import { hasPermission, PERMISSIONS } from '@eduhub/shared';

export const StudyMaterialsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    classSectionId: '',
    subjectId: '',
    fileType: 'pdf' as 'pdf' | 'document' | 'video' | 'link',
    fileName: '',
    fileUrl: '',
  });

  const canUpload =
    user?.role === 'admin' ||
    (user?.role === 'teacher' &&
      hasPermission(user.role, user.permissions, PERMISSIONS.MATERIALS_UPLOAD));

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => academicsApi.getClasses(),
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => academicsApi.getSubjects(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['materials', selectedSubjectId, selectedClassId],
    queryFn: () =>
      modulesApi.getMaterials({
        subjectId: selectedSubjectId || undefined,
        classSectionId: selectedClassId || undefined,
      }),
  });

  const uploadMutation = useMutation({
    mutationFn: (newMat: any) => modulesApi.createMaterial(newMat),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      setIsUploadModalOpen(false);
      setForm({
        title: '',
        description: '',
        classSectionId: '',
        subjectId: '',
        fileType: 'pdf',
        fileName: '',
        fileUrl: '',
      });
      alert('Study material uploaded successfully!');
    },
    onError: (err: any) => alert(err.message || 'Failed to upload material'),
  });

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '1.2 MB';
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-5 h-5 text-rose-500" />;
      case 'link':
        return <LinkIcon className="w-5 h-5 text-blue-500" />;
      case 'document':
        return <File className="w-5 h-5 text-indigo-500" />;
      default:
        return <FileText className="w-5 h-5 text-brand-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Digital Study Materials
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Prescribed syllabi, lecture notes, lab manuals, and revision guides
            for Adiya School.
          </p>
        </div>

        {canUpload && (
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            Upload Material
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="w-48">
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

          <div className="w-56">
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 cursor-pointer"
            >
              <option value="">All Curriculum Subjects</option>
              {subjectsData?.subjects?.map((s: any) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <span className="text-xs text-slate-500 font-medium hidden sm:inline-block">
          Resources Available: <strong>{data?.materials?.length || 0}</strong>
        </span>
      </div>

      {isLoading ? (
        <LoadingState message="Loading study materials catalog..." />
      ) : data?.materials?.length === 0 ? (
        <EmptyState
          title="No study materials available"
          description="Faculty have not yet uploaded digital notes for this subject selection."
          actionLabel={canUpload ? 'Upload First Material' : undefined}
          onAction={() => setIsUploadModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.materials?.map((mat: any) => (
            <div
              key={mat._id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                    {getFileIcon(mat.fileType)}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {mat.fileType}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-800 tracking-tight mb-1 line-clamp-2">
                  {mat.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-3">
                  {mat.description || 'Curriculum notes and study guide.'}
                </p>

                <div className="space-y-1 text-[11px] text-slate-500 font-medium pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span>Subject:</span>
                    <strong className="text-slate-700">
                      {mat.subjectName}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Target Class:</span>
                    <strong className="text-slate-700">
                      {mat.className} - {mat.section}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Uploaded By:</span>
                    <span>{mat.uploadedByName || 'Faculty'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  {formatFileSize(mat.fileSize)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    alert(
                      `Downloading "${mat.fileName || mat.title}" (Local Mock Storage Adapter acknowledged).`
                    );
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-brand-50 hover:text-brand-600 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Study Material"
        subtitle="Digital Library & Academic Assets"
        maxWidth="max-w-lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            uploadMutation.mutate(form);
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Document Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Chapter 6 - Trigonometry Solved Practice Problems"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Class Section *
              </label>
              <select
                required
                value={form.classSectionId}
                onChange={(e) =>
                  setForm({ ...form, classSectionId: e.target.value })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
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
                value={form.subjectId}
                onChange={(e) =>
                  setForm({ ...form, subjectId: e.target.value })
                }
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Resource Type *
              </label>
              <select
                value={form.fileType}
                onChange={(e) =>
                  setForm({ ...form, fileType: e.target.value as any })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
              >
                <option value="pdf">PDF Handbook / Notes</option>
                <option value="document">Word / Office Doc</option>
                <option value="video">Lecture Video Recording</option>
                <option value="link">Web Resource / URL</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                File Name
              </label>
              <input
                type="text"
                placeholder="e.g. Chapter6_Trig.pdf"
                value={form.fileName}
                onChange={(e) => setForm({ ...form, fileName: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Description / Summary
            </label>
            <textarea
              rows={3}
              placeholder="Outline topics covered or instructions for students..."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploadMutation.isPending}
              className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-sm transition-all"
            >
              {uploadMutation.isPending ? 'Uploading...' : 'Save & Publish'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
