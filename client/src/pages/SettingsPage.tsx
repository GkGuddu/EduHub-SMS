import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Settings,
  Building,
  Calendar,
  ShieldCheck,
  Download,
  Upload,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Save,
  Users,
  Bell,
  Palette,
  FileCheck,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  type SettingsTab = 'profile' | 'academic' | 'policies' | 'backup';
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const { data, isLoading } = useQuery({
    queryKey: ['school-settings'],
    queryFn: () => settingsApi.getSettings(),
  });

  const [formState, setFormState] = useState<any>(null);
  const [restoreJson, setRestoreJson] = useState<string>('');
  const [restoreFeedback, setRestoreFeedback] = useState<string | null>(null);

  React.useEffect(() => {
    if (data?.settings) {
      const s = data.settings;
      setFormState({
        schoolName: s.school.name,
        phone: s.school.phone,
        email: s.school.email,
        address: s.school.address,
        website: s.school.website || '',
        logoUrl: s.school.logo || '',
        tagline: s.school.branding?.tagline || '',
        primaryColor: s.school.branding?.primaryColor || '#f97316',
        secondaryColor: s.school.branding?.secondaryColor || '#0284c7',
        workingDays: s.workingDays || [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
        ],
        gradingPassingPercentage: s.gradingPolicy?.passingPercentage || 40,
        attendanceMinimumPercentage:
          s.attendancePolicy?.minimumPercentage || 75,
        lateToAbsentRatio: s.attendancePolicy?.lateToAbsentRatio || 3,
        receiptPrefix: s.receiptPolicy?.prefix || 'REC-2026-',
        absentAlerts: s.notificationSettings?.absentAlerts ?? true,
        feeReminders: s.notificationSettings?.feeReminders ?? true,
        examAlerts: s.notificationSettings?.examAlerts ?? true,
        homeworkAlerts: s.notificationSettings?.homeworkAlerts ?? true,
      });
    }
  }, [data]);

  const updateSettingsMutation = useMutation({
    mutationFn: (payload: any) => settingsApi.updateSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-settings'] });
      alert('School settings and policies updated successfully.');
    },
    onError: (err: any) => alert(err.message || 'Failed to save settings'),
  });

  const restoreMutation = useMutation({
    mutationFn: (payload: any) => settingsApi.restoreBackup(payload),
    onSuccess: (res) => {
      setRestoreFeedback(res.message);
      queryClient.invalidateQueries();
    },
    onError: (err: any) => alert(err.message || 'Backup restoration failed'),
  });

  const handleExportBackup = async () => {
    try {
      const backupData = await settingsApi.exportBackup();
      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `eduhub-backup-${data?.settings?.school?.code || 'school'}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e.message || 'Failed to export backup');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        setRestoreJson(text);
        setRestoreFeedback(null);
      } catch (_err) {
        alert('Failed to parse uploaded backup file');
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = () => {
    try {
      if (!restoreJson.trim()) {
        alert('Please choose or paste a backup JSON payload first');
        return;
      }
      const parsed = JSON.parse(restoreJson);
      if (
        !window.confirm(
          `Are you sure you want to restore backup for school code "${parsed.schoolCode}"? This will synchronize institutional collections and generate an audit trail record.`
        )
      ) {
        return;
      }
      restoreMutation.mutate(parsed);
    } catch (err: any) {
      alert('Invalid JSON formatting: ' + err.message);
    }
  };

  if (isLoading || !formState) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-500 mb-2" />
        <span className="text-xs font-semibold text-slate-500">
          Loading institutional settings...
        </span>
      </div>
    );
  }

  const allDays = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Institutional Configuration & Disaster Recovery
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage school profile details, academic policies, working days, and
            full database backup snapshots.
          </p>
        </div>

        {user?.role === 'admin' && (
          <button
            onClick={() => updateSettingsMutation.mutate(formState)}
            disabled={updateSettingsMutation.isPending}
            className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            {updateSettingsMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save All Changes
          </button>
        )}
      </div>

      <div className="flex items-center gap-1 border-b border-slate-200 pb-1 overflow-x-auto">
        {[
          { id: 'profile', label: 'School Profile & Branding', icon: Building },
          { id: 'academic', label: 'Academic Year & Sessions', icon: Calendar },
          {
            id: 'policies',
            label: 'Institutional Policies',
            icon: ShieldCheck,
          },
          { id: 'backup', label: 'Backup & Disaster Recovery', icon: Download },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as SettingsTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Building className="w-4 h-4 text-brand-600" />
              Institutional Identity & Contact Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  School Name
                </label>
                <input
                  type="text"
                  value={formState.schoolName}
                  onChange={(e) =>
                    setFormState({ ...formState, schoolName: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  School Code (Immutable)
                </label>
                <input
                  type="text"
                  disabled
                  value={data?.settings?.school?.code}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Administrative Email
                </label>
                <input
                  type="email"
                  value={formState.email}
                  onChange={(e) =>
                    setFormState({ ...formState, email: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={formState.phone}
                  onChange={(e) =>
                    setFormState({ ...formState, phone: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Campus Physical Address
                </label>
                <input
                  type="text"
                  value={formState.address}
                  onChange={(e) =>
                    setFormState({ ...formState, address: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Official Website
                </label>
                <input
                  type="text"
                  value={formState.website}
                  onChange={(e) =>
                    setFormState({ ...formState, website: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Logo URL
                </label>
                <input
                  type="text"
                  value={formState.logoUrl}
                  onChange={(e) =>
                    setFormState({ ...formState, logoUrl: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Palette className="w-4 h-4 text-brand-600" />
                Branding & Visual Palette
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Institutional Tagline
                  </label>
                  <input
                    type="text"
                    value={formState.tagline}
                    onChange={(e) =>
                      setFormState({ ...formState, tagline: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Primary Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formState.primaryColor}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            primaryColor: e.target.value,
                          })
                        }
                        className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200"
                      />
                      <span className="font-mono text-xs">
                        {formState.primaryColor}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Secondary Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formState.secondaryColor}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            secondaryColor: e.target.value,
                          })
                        }
                        className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200"
                      />
                      <span className="font-mono text-xs">
                        {formState.secondaryColor}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 text-xs">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-brand-600" /> System Directory
                Status
              </h4>
              <div className="grid grid-cols-2 gap-2 pt-1 text-slate-600">
                <div>
                  Students:{' '}
                  <strong>
                    {data?.settings?.userStats?.totalStudents || 0}
                  </strong>
                </div>
                <div>
                  Faculty:{' '}
                  <strong>
                    {data?.settings?.userStats?.totalTeachers || 0}
                  </strong>
                </div>
                <div>
                  Parents:{' '}
                  <strong>
                    {data?.settings?.userStats?.totalParents || 0}
                  </strong>
                </div>
                <div>
                  Active Logins:{' '}
                  <strong className="text-emerald-600">
                    {data?.settings?.userStats?.activeUsers || 0}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'academic' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-800">
                Academic Year & Session Timing
              </h3>
              <p className="text-xs text-slate-500">
                Current active academic calendar and authorized instructional
                days
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200">
              Session: {data?.settings?.academicYear?.name}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 block">Session Start Date</span>
              <span className="font-bold text-slate-800 text-sm">
                {data?.settings?.academicYear?.startDate}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 block">Session End Date</span>
              <span className="font-bold text-slate-800 text-sm">
                {data?.settings?.academicYear?.endDate}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              School Instructional Working Days
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {allDays.map((day) => {
                const isSelected = formState.workingDays?.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      const updated = isSelected
                        ? formState.workingDays.filter((d: string) => d !== day)
                        : [...formState.workingDays, day];
                      setFormState({ ...formState, workingDays: updated });
                    }}
                    className={`p-3 rounded-xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-brand-50 border-brand-300 text-brand-800 font-bold shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'policies' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              Grading & Attendance Criteria
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Examination Passing Threshold Percentage (%)
                </label>
                <input
                  type="number"
                  min="20"
                  max="60"
                  value={formState.gradingPassingPercentage}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      gradingPassingPercentage: Number(e.target.value),
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Minimum Required Student Attendance (%)
                </label>
                <input
                  type="number"
                  min="50"
                  max="95"
                  value={formState.attendanceMinimumPercentage}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      attendanceMinimumPercentage: Number(e.target.value),
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Late Arrivals Equivalent to 1 Absence
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formState.lateToAbsentRatio}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      lateToAbsentRatio: Number(e.target.value),
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Official Fee Receipt Number Prefix
                </label>
                <input
                  type="text"
                  value={formState.receiptPrefix}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      receiptPrefix: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Bell className="w-4 h-4 text-brand-600" />
              Automated Notification Preferences
            </h3>

            <div className="space-y-3 text-xs">
              {[
                {
                  id: 'absentAlerts',
                  label: 'Student Absence Alerts',
                  desc: 'Dispatch instant SMS alert to parents upon unexcused absence',
                },
                {
                  id: 'feeReminders',
                  label: 'Tuition Fee Due Reminders',
                  desc: 'Broadcast automated reminders 5 days before invoice due date',
                },
                {
                  id: 'examAlerts',
                  label: 'Report Card Publication Alerts',
                  desc: 'Notify parents when term examination results are published',
                },
                {
                  id: 'homeworkAlerts',
                  label: 'Homework Assignment Notifications',
                  desc: 'Alert students and guardians upon posting new homework',
                },
              ].map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <div className="pr-4">
                    <span className="font-bold text-slate-800 block">
                      {item.label}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {item.desc}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formState[item.id]}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        [item.id]: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'backup' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-800">
                  Export Institutional Snapshot Archive
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Download an immutable JSON snapshot encompassing student
                  rosters, faculty, fees, grades, timetables, and audit records.
                </p>
              </div>

              <button
                onClick={handleExportBackup}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs shadow-sm flex items-center gap-2 transition-all shrink-0"
              >
                <Download className="w-4 h-4" />
                Export School Backup (JSON)
              </button>
            </div>

            <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-900 flex items-start gap-2.5">
              <FileCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <span>
                All exported archives include cryptographic validation headers,
                school code verification, and automatically generate an entry in
                the system audit trail.
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-sm text-slate-800">
                Restore Institutional Snapshot Archive
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Upload or paste a valid JSON backup file to synchronize
                institutional data.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>
                <strong>Restoration Warning:</strong> Restoring an archive
                replaces or updates live database records. The backup school
                code must match the active school code.
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <label className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 cursor-pointer flex items-center gap-1.5 shadow-sm">
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span>Choose JSON Backup File...</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <span className="text-slate-400">
                  or paste backup payload below:
                </span>
              </div>

              <textarea
                rows={6}
                placeholder="Paste valid backup JSON here..."
                value={restoreJson}
                onChange={(e) => setRestoreJson(e.target.value)}
                className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />

              {restoreFeedback && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>{restoreFeedback}</span>
                </div>
              )}

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleExecuteRestore}
                  disabled={restoreMutation.isPending || !restoreJson.trim()}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {restoreMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  Validate & Execute Restore
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
