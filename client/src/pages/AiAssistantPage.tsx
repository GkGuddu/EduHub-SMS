import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { modulesApi, academicsApi } from '../api/client';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Copy,
  Check,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  FileText,
  CalendarCheck,
  Receipt,
  GraduationCap,
} from 'lucide-react';

export const AiAssistantPage: React.FC = () => {
  type AiCategory =
    | 'notice_draft'
    | 'attendance_summary'
    | 'fee_summary'
    | 'report_explanation'
    | 'general';

  const [prompt, setPrompt] = useState('');
  const [category, setCategory] = useState<AiCategory>('notice_draft');
  const [classSectionId, setClassSectionId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const { data: statusData, isLoading: loadingStatus } = useQuery({
    queryKey: ['ai-status'],
    queryFn: () => modulesApi.getAiStatus(),
  });

  const { data: classesData } = useQuery({
    queryKey: ['classes-list'],
    queryFn: () => academicsApi.getClasses(),
  });

  const [history, setHistory] = useState<
    Array<{
      prompt: string;
      response: string;
      category?: string;
      dataRange?: { startDate: string; endDate: string; scope: string };
      isMock?: boolean;
      time: string;
    }>
  >([
    {
      prompt:
        "Draft an urgent circular announcing next week's Science Fair model submissions.",
      response:
        '**OFFICIAL SCHOOL CIRCULAR**\n**Institution:** Adiya School of Excellence\n**Date:** 2026-09-24\n**Target Audience:** School-wide\n\n**Subject:** Annual Science Fair Model Submissions\n\nDear Students, Parents, and Guardians,\n\nWe would like to formally announce that our academic administration has finalized preparations for the upcoming Annual Science Fair. Please ensure all student working models and project synopses are submitted to respective science department heads by Monday morning.\n\nWarm regards,\n\n**Office of the Principal**\nAdiya School of Excellence',
      category: 'notice_draft',
      dataRange: {
        startDate: '2026-09-24',
        endDate: '2026-09-24',
        scope: 'School-wide',
      },
      isMock: true,
      time: '10:00 AM',
    },
  ]);

  const aiMutation = useMutation({
    mutationFn: (data: { prompt: string; category: string; filters: any }) =>
      modulesApi.askAiAssistant(data.prompt, data.category, data.filters),
    onSuccess: (data) => {
      setHistory((prev) => [
        {
          prompt: data.prompt,
          response: data.response,
          category: data.category,
          dataRange: data.dataRange,
          isMock: data.isMock,
          time: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
        ...prev,
      ]);
      setPrompt('');
    },
    onError: (err: any) => alert(err.message || 'AI assistant request failed'),
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    aiMutation.mutate({
      prompt: prompt.trim(),
      category,
      filters: {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        classSectionId: classSectionId || undefined,
      },
    });
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const samplePromptsByCategory: Record<AiCategory, string[]> = {
    notice_draft: [
      "Draft an urgent circular announcing next week's Science Fair model submissions.",
      'Write a notice reminding parents about upcoming Parent-Teacher Meeting (PTM).',
      'Draft a circular regarding school timings during the winter examination cycle.',
    ],
    attendance_summary: [
      "Summarize today's school attendance and identify any student absence anomalies.",
      'Analyze attendance trends for Grade 10-A over the past 30 days.',
      'Identify students at risk of falling below the 75% attendance criteria.',
    ],
    fee_summary: [
      'Provide an executive summary of current term fee collection and outstanding arrears.',
      'Summarize fee realization rate and list high-priority defaulter balances.',
      'Analyze distribution of collections between Cash counter and Online UPI.',
    ],
    report_explanation: [
      'Explain the grade distribution and pass rate for Term 1 Mathematics examination.',
      'Provide an academic narrative on Grade 10 Science performance for the school board.',
      'Highlight strengths and suggested remedial steps for students scoring below passing cutoff.',
    ],
    general: [
      'Review overall school health and administrative synchronization for Adiya School.',
      'Draft guidelines for faculty regarding homework review turnarounds.',
    ],
  };

  const isUnavailable = statusData && !statusData.available;

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-brand-700 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-brand-500" />
          <span>EduHub Intelligent Copilot</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          AI School Assistant
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Accelerate circular drafting, daily attendance diagnostics, fee ledger
          summaries, and academic performance explanations.
        </p>
      </div>

      {isUnavailable ? (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">
              AI Assistant Unavailable: No Provider Key Configured
            </span>
            <p className="mt-0.5 text-amber-800">
              The AI copilot provider key is not configured. Please supply a
              valid <code>GEMINI_API_KEY</code> or enable Local Safe Mock Mode
              to generate insights.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-900 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Read-Only Safety Guard Enforced:</strong> AI operates
              strictly via read queries. It cannot directly modify student
              marks, tuition balances, user roles, or attendance records.
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-emerald-700 border border-emerald-200 shrink-0 capitalize">
            {statusData?.mode === 'live'
              ? 'Live Provider: Gemini'
              : 'Safe Local Mock Mode'}
          </span>
        </div>
      )}

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <span className="text-xs font-bold text-slate-700 block mb-2">
            Select Insight Category
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {[
              {
                id: 'notice_draft',
                label: 'Notice / Circular Draft',
                icon: FileText,
              },
              {
                id: 'attendance_summary',
                label: 'Attendance Summary',
                icon: CalendarCheck,
              },
              { id: 'fee_summary', label: 'Fee Ledger Summary', icon: Receipt },
              {
                id: 'report_explanation',
                label: 'Report Explanation',
                icon: GraduationCap,
              },
              { id: 'general', label: 'General Copilot', icon: Sparkles },
            ].map((cat) => {
              const Icon = cat.icon;
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id as AiCategory)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Target Scope
            </label>
            <select
              value={classSectionId}
              onChange={(e) => setClassSectionId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700"
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
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Data Window Start
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Data Window End
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700"
            />
          </div>
        </div>

        <form onSubmit={handleSend} className="space-y-3 pt-2">
          <div className="relative">
            <textarea
              rows={3}
              required
              disabled={isUnavailable}
              placeholder="Ask Adiya AI Assistant... (e.g. 'Draft an official PTM reminder for Grade 10 parents')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-xs text-slate-800 leading-relaxed placeholder:text-slate-400 disabled:opacity-50 disabled:bg-slate-50"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-400 mr-1">
                Quick prompts:
              </span>
              {samplePromptsByCategory[category]?.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(p)}
                  className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 text-[11px] border border-slate-200 transition-colors truncate max-w-[280px]"
                >
                  {p}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={aiMutation.isPending || !prompt.trim() || isUnavailable}
              className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 shrink-0"
            >
              {aiMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Thinking...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Generate AI Insight</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-sm text-slate-800 tracking-tight">
          Generation Stream
        </h3>

        {history.map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3"
          >
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-600">
                <User className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold text-slate-800">
                  {item.prompt}
                </span>
                <span className="text-[10px] text-slate-400 ml-2 font-mono">
                  {item.time}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-orange-50/40 border border-orange-200/70 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-brand-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                {item.dataRange && (
                  <div className="mb-2.5 inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white border border-orange-200 text-[10px] font-semibold text-orange-950">
                    <Calendar className="w-3 h-3 text-brand-600" />
                    <span>
                      Data Window: {item.dataRange.startDate} to{' '}
                      {item.dataRange.endDate} • Scope: {item.dataRange.scope}
                    </span>
                  </div>
                )}

                <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-sans">
                  {item.response}
                </div>

                <div className="mt-3 pt-2 border-t border-orange-200/50 flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    {item.isMock
                      ? 'Generated via Safe Local Mock Mode'
                      : 'Generated via Gemini Provider'}
                  </span>
                  <button
                    onClick={() => handleCopy(item.response, idx)}
                    className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-medium text-slate-600 hover:text-brand-600 hover:border-brand-300 transition-all flex items-center gap-1"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
