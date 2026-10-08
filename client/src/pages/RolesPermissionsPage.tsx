import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesApi } from '../api/client';
import {
  ShieldCheck,
  AlertTriangle,
  Save,
  CheckCircle2,
  RotateCcw,
  Loader2,
  Search,
  CheckSquare,
  Square,
  Clock,
  User,
  BookOpen,
  GraduationCap,
  Layers,
  X,
  FileText,
  AlertCircle,
  CalendarCheck,
  FileSpreadsheet,
  Bell,
  CreditCard,
  MessageSquare,
  BarChart3,
  Settings,
  Briefcase,
} from 'lucide-react';
import {
  PermissionDefinition,
  DEFAULT_TEACHER_PERMISSIONS,
} from '@eduhub/shared';

const MODULE_ICONS: Record<string, React.ElementType> = {
  Students: GraduationCap,
  Attendance: CalendarCheck,
  'Exams & Results': FileSpreadsheet,
  Homework: BookOpen,
  'Notice Board': Bell,
  'Teachers & Staff': Briefcase,
  'Fees & Finance': CreditCard,
  'Timetable & Materials': Layers,
  'Communication & AI': MessageSquare,
  'Reports & Settings': Settings,
};

function areEqualPerms(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  return b.every((x) => setA.has(x));
}

export const RolesPermissionsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [activePermissions, setActivePermissions] = useState<string[]>([]);
  const [originalPermissions, setOriginalPermissions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['teacher-permissions'],
    queryFn: () => rolesApi.getTeacherPermissions(),
  });

  const teachers = useMemo(() => data?.teachers || [], [data?.teachers]);

  const isDirty = useMemo(() => {
    return !areEqualPerms(activePermissions, originalPermissions);
  }, [activePermissions, originalPermissions]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (teachers.length > 0 && !selectedTeacherId) {
      const first = teachers[0];
      setSelectedTeacherId(first.userId);
      const perms = first.permissions || DEFAULT_TEACHER_PERMISSIONS;
      setActivePermissions([...perms]);
      setOriginalPermissions([...perms]);
    }
  }, [teachers, selectedTeacherId]);

  const handleSelectTeacher = (userId: string) => {
    if (userId === selectedTeacherId) return;

    if (isDirty) {
      const confirmed = window.confirm(
        'You have unsaved changes for the currently selected teacher. Switching will discard these changes. Are you sure you want to proceed?'
      );
      if (!confirmed) return;
    }

    setSelectedTeacherId(userId);
    const teacher = teachers.find((t: any) => t.userId === userId);
    if (teacher) {
      const perms = teacher.permissions || DEFAULT_TEACHER_PERMISSIONS;
      setActivePermissions([...perms]);
      setOriginalPermissions([...perms]);
    } else {
      setActivePermissions([]);
      setOriginalPermissions([]);
    }
    setReason('');
    setSuccessMsg(null);
  };

  const handleTogglePermission = (permKey: string) => {
    setActivePermissions((prev) =>
      prev.includes(permKey)
        ? prev.filter((k) => k !== permKey)
        : [...prev, permKey]
    );
  };

  const handleSelectAllInModule = (moduleDefs: PermissionDefinition[]) => {
    const keysToAdd = moduleDefs.map((d) => d.key);
    setActivePermissions((prev) =>
      Array.from(new Set([...prev, ...keysToAdd]))
    );
  };

  const handleResetModuleToDefault = (moduleDefs: PermissionDefinition[]) => {
    const moduleKeySet = new Set(moduleDefs.map((d) => d.key));
    const safeDefaults =
      data?.defaultTeacherPermissions || DEFAULT_TEACHER_PERMISSIONS;
    const defaultModuleKeys = safeDefaults.filter((k: string) =>
      moduleKeySet.has(k as any)
    );

    setActivePermissions((prev) => {
      const filtered = prev.filter((k) => !moduleKeySet.has(k as any));
      return Array.from(new Set([...filtered, ...defaultModuleKeys]));
    });
  };

  const handleClearModule = (moduleDefs: PermissionDefinition[]) => {
    const moduleKeySet = new Set(moduleDefs.map((d) => d.key));
    setActivePermissions((prev) =>
      prev.filter((k) => !moduleKeySet.has(k as any))
    );
  };

  const handleResetAllToDefault = () => {
    const safeDefaults =
      data?.defaultTeacherPermissions || DEFAULT_TEACHER_PERMISSIONS;
    setActivePermissions([...safeDefaults]);
    setReason('Reset to school-wide safe default teacher matrix');
  };

  const handleDiscardChanges = () => {
    setActivePermissions([...originalPermissions]);
    setReason('');
  };

  const updateMutation = useMutation({
    mutationFn: () =>
      rolesApi.updateTeacherPermissions({
        teacherUserId: selectedTeacherId,
        permissions: activePermissions,
        reason: reason.trim() || undefined,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      setOriginalPermissions([...activePermissions]);
      setSuccessMsg(
        res.message || 'Permissions updated and saved successfully!'
      );
      setTimeout(() => setSuccessMsg(null), 4000);
    },
    onError: (err: any) => alert(err.message || 'Failed to update permissions'),
  });

  const selectedTeacher = teachers.find(
    (t: any) => t.userId === selectedTeacherId
  );

  const categories: Record<string, PermissionDefinition[]> = useMemo(() => {
    const map: Record<string, PermissionDefinition[]> = {};
    if (data?.permissionsDefinitions) {
      for (const def of data.permissionsDefinitions as PermissionDefinition[]) {
        if (!map[def.category]) map[def.category] = [];
        map[def.category].push(def);
      }
    }
    return map;
  }, [data?.permissionsDefinitions]);

  const filteredTeachers = useMemo(() => {
    if (!searchQuery.trim()) return teachers;
    const q = searchQuery.toLowerCase();
    return teachers.filter(
      (t: any) =>
        t.name?.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q) ||
        t.employeeId?.toLowerCase().includes(q) ||
        t.specialization?.toLowerCase().includes(q)
    );
  }, [teachers, searchQuery]);

  const assignedClassBadges = useMemo(() => {
    if (!selectedTeacher?.assignedClasses) return [];
    const seen = new Set<string>();
    const badges: string[] = [];
    for (const a of selectedTeacher.assignedClasses) {
      const label = a.className ? `${a.className} - ${a.section}` : null;
      if (label && !seen.has(label)) {
        seen.add(label);
        badges.push(label);
      }
    }
    return badges;
  }, [selectedTeacher]);

  const assignedSubjectBadges = useMemo(() => {
    if (!selectedTeacher?.assignedClasses) return [];
    const seen = new Set<string>();
    const badges: string[] = [];
    for (const a of selectedTeacher.assignedClasses) {
      const label = a.subjectName
        ? `${a.subjectName} (${a.subjectCode || ''})`
        : null;
      if (label && !seen.has(label)) {
        seen.add(label);
        badges.push(label);
      }
    }
    return badges;
  }, [selectedTeacher]);

  const totalDefinitionsCount = data?.permissionsDefinitions?.length || 42;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-orange-100 text-brand-600">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Roles & Permissions Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Control exact module access, publishing rights, and sensitive
            operations for each faculty member.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleResetAllToDefault}
            type="button"
            className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-xs shadow-sm flex items-center gap-1.5 transition-all"
            title="Reset active teacher permissions to default safe matrix"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            Reset All to Safe Defaults
          </button>

          <button
            onClick={() => updateMutation.mutate()}
            disabled={
              updateMutation.isPending || !selectedTeacherId || !isDirty
            }
            type="button"
            className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save Permission Changes</span>
            {isDirty && (
              <span
                className="w-2 h-2 rounded-full bg-white animate-pulse"
                title="Unsaved edits"
              />
            )}
          </button>
        </div>
      </div>
      {isDirty && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Unsaved Permission Changes:</span> You
              have modified access rights for{' '}
              <strong>{selectedTeacher?.name || 'this faculty member'}</strong>.
              Be sure to save your changes before leaving this page or switching
              teachers.
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={handleDiscardChanges}
              className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 font-semibold text-xs transition-colors"
            >
              Discard Changes
            </button>
            <button
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
              className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1 transition-colors"
            >
              {updateMutation.isPending && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              Save Now
            </button>
          </div>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="p-1 text-emerald-600 hover:text-emerald-800 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3 flex flex-col h-fit">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Faculty Directory
            </h3>
            <span className="text-[11px] font-bold text-slate-400">
              {filteredTeachers.length} of {teachers.length}
            </span>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search faculty by name, ID, or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-slate-50/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
            {isLoading ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-500" />
                <p className="text-xs">Loading faculty roster...</p>
              </div>
            ) : filteredTeachers.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No faculty members match "{searchQuery}".
              </div>
            ) : (
              filteredTeachers.map((t: any) => {
                const isSelected = selectedTeacherId === t.userId;
                return (
                  <button
                    key={t.userId}
                    onClick={() => handleSelectTeacher(t.userId)}
                    className={`w-full p-3 rounded-xl text-left transition-all border ${
                      isSelected
                        ? 'bg-orange-50/80 border-brand-500 text-slate-900 shadow-sm ring-1 ring-brand-500/20'
                        : 'bg-white border-transparent hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs text-slate-800 truncate">
                        {t.name}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        #{t.employeeId}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {t.specialization || 'General Faculty'}
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="truncate max-w-[120px]">{t.email}</span>
                      <span
                        className={`font-semibold px-1.5 py-0.5 rounded ${
                          isSelected
                            ? 'bg-brand-100 text-brand-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isSelected
                          ? activePermissions.length
                          : t.permissions?.length || 0}{' '}
                        active
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
        <div className="lg:col-span-3 space-y-6">
          {selectedTeacher ? (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-600">
                      ID: {selectedTeacher.employeeId}
                    </span>
                    <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                      {selectedTeacher.name}
                    </h2>
                    <span className="text-xs text-slate-400">
                      ({selectedTeacher.email})
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    <span>
                      Active Privileges:{' '}
                      <strong>{activePermissions.length}</strong> /{' '}
                      {totalDefinitionsCount}
                    </span>
                    <span>•</span>
                    <span>
                      {selectedTeacher.specialization || 'General Faculty'}
                    </span>
                    {selectedTeacher.experienceYears > 0 && (
                      <>
                        <span>•</span>
                        <span>
                          {selectedTeacher.experienceYears} yrs experience
                        </span>
                      </>
                    )}
                  </p>
                </div>
                <div className="text-left sm:text-right text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1 sm:justify-end text-slate-600 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Last Updated</span>
                  </div>
                  <div className="mt-0.5 text-slate-500">
                    {selectedTeacher.permissionsUpdatedAt
                      ? new Date(
                          selectedTeacher.permissionsUpdatedAt
                        ).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: 'numeric',
                        })
                      : 'Default safe policy'}
                  </div>
                  {selectedTeacher.permissionsUpdatedByName && (
                    <div className="text-[10px] text-slate-400">
                      by {selectedTeacher.permissionsUpdatedByName}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-bold text-slate-600 block mb-1.5 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-brand-500" />
                    Assigned Classes & Sections:
                  </span>
                  {assignedClassBadges.length === 0 ? (
                    <span className="text-slate-400 italic text-[11px]">
                      No classes assigned currently.
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {assignedClassBadges.map((badge) => (
                        <span
                          key={badge}
                          className="px-2 py-0.5 rounded-lg bg-orange-50 text-brand-700 border border-orange-200 text-[11px] font-medium"
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <span className="font-bold text-slate-600 block mb-1.5 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                    Assigned Subjects:
                  </span>
                  {assignedSubjectBadges.length === 0 ? (
                    <span className="text-slate-400 italic text-[11px]">
                      No subjects assigned currently.
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {assignedSubjectBadges.map((badge) => (
                        <span
                          key={badge}
                          className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-medium"
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Reason for modification (Logged to administrative audit trail)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Authorized to enter marks and publish preliminary results for Term 1 exams"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-slate-50/40"
                />
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center text-slate-400">
              Select a faculty member from the directory to inspect and
              customize access privileges.
            </div>
          )}
          <div className="space-y-4">
            {Object.entries(categories).map(([category, perms]) => {
              const ModuleIcon = MODULE_ICONS[category] || Layers;
              const moduleActiveCount = perms.filter((p) =>
                activePermissions.includes(p.key)
              ).length;
              const isAllSelected = moduleActiveCount === perms.length;

              return (
                <div
                  key={category}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
                        <ModuleIcon className="w-4 h-4" />
                      </span>
                      <div>
                        <h3 className="font-bold text-sm text-slate-800 tracking-tight">
                          {category}
                        </h3>
                        <span className="text-[11px] text-slate-400">
                          {moduleActiveCount} of {perms.length} active
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() =>
                          isAllSelected
                            ? handleClearModule(perms)
                            : handleSelectAllInModule(perms)
                        }
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors"
                      >
                        {isAllSelected ? 'Uncheck All' : 'Select All'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleResetModuleToDefault(perms)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-[11px] transition-colors flex items-center gap-1"
                        title="Reset this module to safe defaults"
                      >
                        <RotateCcw className="w-3 h-3 text-slate-400" />
                        Reset Defaults
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {perms.map((perm) => {
                      const isChecked = activePermissions.includes(perm.key);
                      return (
                        <label
                          key={perm.key}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                            isChecked
                              ? 'bg-orange-50/50 border-orange-200 ring-1 ring-orange-500/15'
                              : 'bg-slate-50/40 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleTogglePermission(perm.key)}
                            className="mt-0.5 w-4 h-4 text-brand-500 rounded border-slate-300 focus:ring-brand-500 shrink-0 cursor-pointer accent-brand-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-slate-800 tracking-tight">
                                {perm.label}
                              </span>
                              {perm.isDangerous && (
                                <span
                                  className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200 shrink-0"
                                  title="Elevated / Sensitive administrative privilege"
                                >
                                  Sensitive
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                              {perm.description}
                            </p>
                            <span className="font-mono text-[9px] text-slate-400 block mt-1">
                              {perm.key}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
