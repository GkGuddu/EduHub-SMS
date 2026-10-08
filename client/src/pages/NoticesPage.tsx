import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { noticesApi, academicsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common';
import {
  Bell,
  Plus,
  Pin,
  Calendar,
  Tag,
  Trash2,
  Loader2,
  Send,
  Archive,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { PERMISSIONS } from '@eduhub/shared';

export const NoticesPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const [audienceFilter, setAudienceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<string>('published');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [form, setForm] = useState({
    title: '',
    content: '',
    targetRole: 'all',
    targetClassId: '',
    category: 'academic',
    isPinned: false,
    status: 'published',
    scheduledFor: '',
  });

  const canCreate =
    user?.role === 'admin' || hasPermission(PERMISSIONS.NOTICES_CREATE);
  const canPublish =
    user?.role === 'admin' || hasPermission(PERMISSIONS.NOTICES_PUBLISH);

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => academicsApi.getClasses(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['notices', statusFilter],
    queryFn: () =>
      noticesApi.getNotices({
        status: user?.role === 'admin' ? statusFilter : undefined,
      }),
  });

  const createNoticeMutation = useMutation({
    mutationFn: (newNotice: any) => noticesApi.createNotice(newNotice),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
      setIsCreateModalOpen(false);
      setForm({
        title: '',
        content: '',
        targetRole: 'all',
        targetClassId: '',
        category: 'academic',
        isPinned: false,
        status: 'published',
        scheduledFor: '',
      });
      alert('Announcement created successfully.');
    },
    onError: (err: any) => alert(err.message || 'Failed to post notice'),
  });

  const publishNoticeMutation = useMutation({
    mutationFn: (id: string) => noticesApi.publishNotice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
      alert('Notice published.');
    },
    onError: (err: any) => alert(err.message || 'Failed to publish notice'),
  });

  const archiveNoticeMutation = useMutation({
    mutationFn: (id: string) => noticesApi.archiveNotice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
      alert('Notice archived.');
    },
    onError: (err: any) => alert(err.message || 'Failed to archive notice'),
  });

  const deleteNoticeMutation = useMutation({
    mutationFn: (id: string) => noticesApi.deleteNotice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
    },
    onError: (err: any) => alert(err.message || 'Failed to delete notice'),
  });

  const filteredNotices = (data?.notices || []).filter((n: any) => {
    if (audienceFilter === 'all') return true;
    return n.targetRole === audienceFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Notice Board
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            School-wide circulars, official updates, and scheduled announcements
            for Adiya School.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            Post Announcement
          </button>
        )}
      </div>

      {user?.role === 'admin' && (
        <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl w-fit text-xs font-semibold">
          {[
            { key: 'published', label: 'Published' },
            { key: 'scheduled', label: 'Scheduled' },
            { key: 'draft', label: 'Drafts' },
            { key: 'archived', label: 'Archived' },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setStatusFilter(s.key)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                statusFilter === s.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        {[
          { key: 'all', label: 'All Audiences' },
          { key: 'teachers', label: 'Staff & Teachers' },
          { key: 'students', label: 'Students' },
          { key: 'parents', label: 'Parents' },
          { key: 'class', label: 'Class Scoped' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setAudienceFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              audienceFilter === tab.key
                ? 'bg-brand-50 text-brand-700 border border-brand-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-500" />
          Loading announcements...
        </div>
      ) : filteredNotices.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-sm">
            No announcements found
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            There are no notices matching the selected filters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotices.map((notice: any) => (
            <div
              key={notice._id}
              className={`bg-white rounded-2xl border p-5 transition-all shadow-sm ${
                notice.isPinned
                  ? 'border-brand-300 bg-brand-50/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {notice.isPinned && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 bg-brand-100/80 px-2 py-0.5 rounded-full">
                        <Pin className="w-3 h-3 fill-current" /> Pinned Notice
                      </span>
                    )}
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      {notice.category}
                    </span>
                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                      Target:{' '}
                      {notice.targetRole === 'class'
                        ? `Class ${notice.targetClassName || ''}`
                        : notice.targetRole}
                    </span>
                    {notice.status && notice.status !== 'published' && (
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 uppercase">
                        {notice.status}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-slate-800 mb-2">
                    {notice.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {notice.content}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
                    <span>
                      Published by:{' '}
                      <strong className="text-slate-600">
                        {notice.authorName}
                      </strong>{' '}
                      ({notice.authorRole})
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(notice.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    {notice.scheduledFor && (
                      <>
                        <span>•</span>
                        <span className="text-amber-600 font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Releases:{' '}
                          {new Date(notice.scheduledFor).toLocaleString()}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {canPublish && notice.status !== 'published' && (
                    <button
                      onClick={() => publishNoticeMutation.mutate(notice._id)}
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200"
                      title="Publish Notice Now"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                  {canCreate && notice.status !== 'archived' && (
                    <button
                      onClick={() => archiveNoticeMutation.mutate(notice._id)}
                      className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                      title="Archive Notice"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  )}
                  {(user?.role === 'admin' ||
                    hasPermission(PERMISSIONS.NOTICES_PUBLISH)) && (
                    <button
                      onClick={() => {
                        if (
                          confirm('Delete this notice circular permanently?')
                        ) {
                          deleteNoticeMutation.mutate(notice._id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Notice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Post School Announcement"
        subtitle="Adiya School Official Notice Board"
        maxWidth="max-w-lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createNoticeMutation.mutate(form);
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Notice Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Annual Sports Day 2026 Schedule & Guidelines"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Target Audience *
              </label>
              <select
                value={form.targetRole}
                onChange={(e) =>
                  setForm({ ...form, targetRole: e.target.value })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
              >
                <option value="all">Whole School Community</option>
                <option value="teachers">Teaching Staff Only</option>
                <option value="students">Students Only</option>
                <option value="parents">Parents Only</option>
                <option value="class">Specific Class</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Notice Category *
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
              >
                <option value="academic">Academic & Exams</option>
                <option value="holiday">Holiday Circular</option>
                <option value="event">Sports & Events</option>
                <option value="administrative">Administrative Update</option>
                <option value="urgent">Urgent Alert</option>
              </select>
            </div>
          </div>

          {form.targetRole === 'class' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Select Target Class *
              </label>
              <select
                required
                value={form.targetClassId}
                onChange={(e) =>
                  setForm({ ...form, targetClassId: e.target.value })
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
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Release Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
              >
                <option value="published">Publish Immediately</option>
                <option value="draft">Save as Draft</option>
                <option value="scheduled">Schedule for Later</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Schedule Date & Time
              </label>
              <input
                type="datetime-local"
                value={form.scheduledFor}
                onChange={(e) =>
                  setForm({
                    ...form,
                    scheduledFor: e.target.value,
                    status: e.target.value ? 'scheduled' : form.status,
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Announcement Content *
            </label>
            <textarea
              rows={4}
              required
              placeholder="Write the full circular announcement text here..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPinned"
              checked={form.isPinned}
              onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
              className="rounded text-brand-500 focus:ring-brand-500 w-4 h-4 cursor-pointer"
            />
            <label
              htmlFor="isPinned"
              className="text-slate-700 font-semibold cursor-pointer"
            >
              Pin to top of board for high priority visibility
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
              disabled={createNoticeMutation.isPending}
              className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-sm transition-all flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              {form.status === 'scheduled'
                ? 'Schedule Notice'
                : form.status === 'draft'
                  ? 'Save Draft'
                  : 'Publish Circular'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
