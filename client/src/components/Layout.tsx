import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  CalendarCheck,
  Receipt,
  BookOpen,
  Calendar,
  Bell,
  MessageSquare,
  BarChart2,
  Sparkles,
  ShieldCheck,
  Layers,
  FileSpreadsheet,
  FolderDown,
  ChevronLeft,
  ChevronRight,
  School as SchoolIcon,
  Search,
  LogOut,
  ChevronDown,
  CheckCheck,
  Award,
  X,
  Settings,
  History,
  Menu,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { notificationsApi, env } from '../api/client';
import { ErrorBoundary } from './common';
import { PERMISSIONS } from '@eduhub/shared';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  visible: boolean;
  children?: NavItem[];
}

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (val: boolean) => void;
  mobileTriggerRef?: React.RefObject<HTMLButtonElement | null>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  mobileTriggerRef,
}) => {
  const { user, school, hasPermission } = useAuth();
  const location = useLocation();
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    '/admin/exams': true,
    '/teacher/exams': true,
    '/student/exams': true,
    '/parent/exams': true,
  });

  const closeMobileDrawer = useCallback(() => {
    setMobileOpen(false);
    if (mobileTriggerRef?.current) {
      mobileTriggerRef.current.focus();
    }
  }, [setMobileOpen, mobileTriggerRef]);

  const [activeTooltip, setActiveTooltip] = useState<{
    item: NavItem;
    top: number;
    left: number;
    visibleChildren: NavItem[];
  } | null>(null);

  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleItemMouseEnter = (
    item: NavItem,
    visibleChildren: NavItem[],
    e: React.MouseEvent<HTMLElement> | React.FocusEvent<HTMLElement>
  ) => {
    if (!collapsed || mobileOpen) return;
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    const delay = activeTooltip ? 0 : 80;
    tooltipTimeoutRef.current = setTimeout(() => {
      setActiveTooltip({
        item,
        top: rect.top + rect.height / 2,
        left: rect.right + 10,
        visibleChildren,
      });
    }, delay);
  };

  const handleItemMouseLeave = () => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
    closeTimeoutRef.current = setTimeout(() => {
      setActiveTooltip(null);
    }, 120);
  };

  const handleTooltipCardMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const handleTooltipCardMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setActiveTooltip(null);
    }, 120);
  };

  useEffect(() => {
    setActiveTooltip(null);
  }, [location.pathname, collapsed]);

  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const handleScrollOrResize = () => {
      setActiveTooltip(null);
    };
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveTooltip(null);
        if (mobileOpen) {
          closeMobileDrawer();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, closeMobileDrawer]);

  if (!user) return null;

  const toggleSubmenu = (path: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenSubmenus((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const adminNavItems: NavItem[] = [
    {
      label: 'Dashboard',
      path: '/admin/dashboard',
      icon: LayoutDashboard,
      visible: true,
    },
    {
      label: 'Students',
      path: '/admin/students',
      icon: GraduationCap,
      visible: true,
    },
    { label: 'Teachers', path: '/admin/teachers', icon: Users, visible: true },
    {
      label: 'Attendance',
      path: '/admin/attendance',
      icon: CalendarCheck,
      visible: true,
    },
    { label: 'Fees', path: '/admin/fees', icon: Receipt, visible: true },
    {
      label: 'Homework',
      path: '/admin/homework',
      icon: BookOpen,
      visible: true,
    },
    {
      label: 'Timetable',
      path: '/admin/timetable',
      icon: Calendar,
      visible: true,
    },
    {
      label: 'Notice Board',
      path: '/admin/notices',
      icon: Bell,
      visible: true,
    },
    {
      label: 'Communication',
      path: '/admin/communication',
      icon: MessageSquare,
      visible: true,
    },
    {
      label: 'Reports',
      path: '/admin/reports',
      icon: BarChart2,
      visible: true,
    },
    {
      label: 'AI Assistant',
      path: '/admin/ai-assistant',
      icon: Sparkles,
      visible: true,
    },
    {
      label: 'Roles & Permissions',
      path: '/admin/roles',
      icon: ShieldCheck,
      visible: true,
    },
    {
      label: 'Subject & Class',
      path: '/admin/subjects',
      icon: Layers,
      visible: true,
    },
    {
      label: 'Tests & Exams',
      path: '/admin/exams',
      icon: FileSpreadsheet,
      visible: true,
      children: [
        {
          label: 'Subject Quizzes',
          path: '/admin/quizzes',
          icon: HelpCircle,
          visible: true,
        },
      ],
    },
    {
      label: 'Study Materials',
      path: '/admin/materials',
      icon: FolderDown,
      visible: true,
    },
  ];

  const teacherNavItems: NavItem[] = [
    {
      label: 'Dashboard',
      path: '/teacher/dashboard',
      icon: LayoutDashboard,
      visible: true,
    },
    {
      label: 'Attendance',
      path: '/teacher/attendance',
      icon: CalendarCheck,
      visible: hasPermission(PERMISSIONS.ATTENDANCE_VIEW),
    },
    {
      label: 'Homework',
      path: '/teacher/homework',
      icon: BookOpen,
      visible: hasPermission(PERMISSIONS.HOMEWORK_VIEW),
    },
    {
      label: 'Tests & Exams',
      path: '/teacher/exams',
      icon: FileSpreadsheet,
      visible:
        hasPermission(PERMISSIONS.EXAMS_VIEW) ||
        hasPermission(PERMISSIONS.MARKS_VIEW) ||
        hasPermission(PERMISSIONS.RESULTS_VIEW),
      children: [
        {
          label: 'Subject Quizzes',
          path: '/teacher/quizzes',
          icon: HelpCircle,
          visible:
            hasPermission(PERMISSIONS.EXAMS_VIEW) ||
            hasPermission(PERMISSIONS.MARKS_VIEW),
        },
      ],
    },
    {
      label: 'Timetable',
      path: '/teacher/timetable',
      icon: Calendar,
      visible: hasPermission(PERMISSIONS.TIMETABLE_VIEW),
    },
    {
      label: 'Notices',
      path: '/teacher/notices',
      icon: Bell,
      visible: hasPermission(PERMISSIONS.NOTICES_VIEW),
    },
    {
      label: 'Communication',
      path: '/teacher/communication',
      icon: MessageSquare,
      visible:
        hasPermission(PERMISSIONS.COMMUNICATION_VIEW) ||
        hasPermission(PERMISSIONS.COMMUNICATION_CHAT),
    },
    {
      label: 'AI Assistant',
      path: '/teacher/ai-assistant',
      icon: Sparkles,
      visible: hasPermission(PERMISSIONS.AI_USE),
    },
    {
      label: 'Study Materials',
      path: '/teacher/materials',
      icon: FolderDown,
      visible: hasPermission(PERMISSIONS.MATERIALS_VIEW),
    },
  ];

  const studentNavItems: NavItem[] = [
    {
      label: 'Dashboard',
      path: '/student/dashboard',
      icon: LayoutDashboard,
      visible: true,
    },
    {
      label: 'Attendance',
      path: '/student/attendance',
      icon: CalendarCheck,
      visible: true,
    },
    {
      label: 'Homework',
      path: '/student/homework',
      icon: BookOpen,
      visible: true,
    },
    {
      label: 'Tests & Exams',
      path: '/student/exams',
      icon: FileSpreadsheet,
      visible: true,
      children: [
        {
          label: 'Subject Quizzes',
          path: '/student/quizzes',
          icon: HelpCircle,
          visible: true,
        },
      ],
    },
    { label: 'Notices', path: '/student/notices', icon: Bell, visible: true },
    {
      label: 'Communication',
      path: '/student/communication',
      icon: MessageSquare,
      visible: true,
    },
    {
      label: 'Report Card',
      path: '/student/report-card',
      icon: Award,
      visible: true,
    },
    {
      label: 'Progress',
      path: '/student/progress',
      icon: BarChart2,
      visible: true,
    },
    {
      label: 'AI Assistant',
      path: '/student/ai-assistant',
      icon: Sparkles,
      visible: true,
    },
    {
      label: 'Study Materials',
      path: '/student/materials',
      icon: FolderDown,
      visible: true,
    },
  ];

  const parentNavItems: NavItem[] = [
    {
      label: 'Dashboard',
      path: '/parent/dashboard',
      icon: LayoutDashboard,
      visible: true,
    },
    {
      label: 'Attendance',
      path: '/parent/attendance',
      icon: CalendarCheck,
      visible: true,
    },
    {
      label: 'Tests & Exams',
      path: '/parent/exams',
      icon: FileSpreadsheet,
      visible: true,
      children: [
        {
          label: 'Subject Quizzes',
          path: '/parent/quizzes',
          icon: HelpCircle,
          visible: true,
        },
      ],
    },
    { label: 'Results', path: '/parent/results', icon: Award, visible: true },
    { label: 'Fees', path: '/parent/fees', icon: Receipt, visible: true },
    {
      label: 'Communication',
      path: '/parent/communication',
      icon: MessageSquare,
      visible: true,
    },
    { label: 'Notices', path: '/parent/notices', icon: Bell, visible: true },
  ];

  let activeNav = adminNavItems;
  if (user.role === 'teacher') activeNav = teacherNavItems;
  else if (user.role === 'student') activeNav = studentNavItems;
  else if (user.role === 'parent') activeNav = parentNavItems;

  const visibleItems = activeNav.filter((item) => item.visible);

  const renderPortalTooltip = () => {
    if (!activeTooltip || !collapsed || mobileOpen) return null;
    if (typeof document === 'undefined') return null;

    const { item, top, left, visibleChildren } = activeTooltip;
    const hasChildren = visibleChildren && visibleChildren.length > 0;

    if (hasChildren) {
      const approximateHeight = visibleChildren.length * 36 + 100;
      const clampedTop = Math.max(
        12,
        Math.min(window.innerHeight - approximateHeight, top - 24)
      );

      return createPortal(
        <div
          style={{
            position: 'fixed',
            top: `${clampedTop}px`,
            left: `${left}px`,
            zIndex: 9999,
          }}
          onMouseEnter={handleTooltipCardMouseEnter}
          onMouseLeave={handleTooltipCardMouseLeave}
          className="select-none animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="relative bg-slate-900 text-white p-2.5 rounded-xl shadow-2xl shadow-slate-950/40 border border-slate-700/80 min-w-[170px] space-y-1">
            <div
              className="absolute -left-1.5 w-3 h-3 bg-slate-900 rotate-45 border-l border-b border-slate-700/80"
              style={{
                top: `${Math.max(16, Math.min(60, top - clampedTop))}px`,
              }}
            />
            <div className="text-[11px] font-bold text-slate-300 px-2 py-1 border-b border-slate-800 flex items-center justify-between">
              <span className="truncate pr-2">{item.label}</span>
              <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-brand-400">
                Menu
              </span>
            </div>
            <NavLink
              to={item.path}
              onClick={() => {
                setActiveTooltip(null);
                setMobileOpen(false);
              }}
              className={({ isActive }) =>
                `block text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-brand-500 text-white font-semibold'
                    : 'text-slate-200 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              Overview
            </NavLink>
            {visibleChildren.map((child) => (
              <NavLink
                key={child.path}
                to={child.path}
                onClick={() => {
                  setActiveTooltip(null);
                  setMobileOpen(false);
                }}
                className={({ isActive }) =>
                  `block text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-brand-500 text-white font-semibold'
                      : 'text-slate-200 hover:text-white hover:bg-slate-800'
                  }`
                }
              >
                {child.label}
              </NavLink>
            ))}
          </div>
        </div>,
        document.body
      );
    }

    return createPortal(
      <div
        style={{
          position: 'fixed',
          top: `${top}px`,
          left: `${left}px`,
          transform: 'translateY(-50%)',
          zIndex: 9999,
        }}
        className="pointer-events-none select-none flex items-center animate-in fade-in zoom-in-95 duration-100"
      >
        <div className="relative px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl shadow-slate-950/30 whitespace-nowrap border border-slate-700/80">
          <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45 border-l border-b border-slate-700/80" />
          <span className="relative z-10">{item.label}</span>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={closeMobileDrawer}
          aria-hidden="true"
        />
      )}
      <aside
        aria-label="Sidebar Navigation"
        className={`bg-white border-r border-slate-200 flex flex-col transition-all duration-300 motion-reduce:transition-none z-50 shrink-0 select-none fixed md:static inset-y-0 left-0 ${
          mobileOpen
            ? 'translate-x-0 shadow-2xl'
            : '-translate-x-full md:translate-x-0'
        } ${collapsed ? 'md:w-20 w-64' : 'w-64'}`}
      >
        {(!collapsed || mobileOpen) ? (
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-500 flex items-center justify-center text-white shadow-sm shrink-0">
                <SchoolIcon className="w-5 h-5" />
              </div>
              <div className="flex flex-col truncate">
                <span className="font-bold text-lg text-slate-800 tracking-tight leading-tight flex items-center gap-1.5">
                  EduHub
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                    SMS
                  </span>
                </span>
                <span className="text-xs text-slate-500 font-medium truncate">
                  {school?.name ? 'Adiya School' : 'Adiya'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={closeMobileDrawer}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 md:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                aria-label="Close sidebar menu"
                title="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="hidden md:block p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                aria-label="Collapse sidebar"
                aria-expanded={true}
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="h-24 flex flex-col items-center justify-center gap-2 py-3 px-2 border-b border-slate-100 shrink-0">
            <div
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-500 flex items-center justify-center text-white shadow-sm shrink-0 aspect-square"
              title={school?.name ? `${school.name} - EduHub` : 'EduHub SMS'}
            >
              <SchoolIcon className="w-5 h-5" />
            </div>
            <button
              onClick={() => setCollapsed(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              aria-label="Expand sidebar"
              aria-expanded={false}
              title="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {visibleItems.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const visibleChildren = hasChildren
              ? item.children!.filter((child) => child.visible)
              : [];
            const isChildActive = visibleChildren.some(
              (child) => location.pathname === child.path
            );
            const isMainActive =
              location.pathname === item.path ||
              (location.pathname.startsWith(`${item.path}/`) && !isChildActive);
            const isActive = isMainActive || isChildActive;

            const Icon = item.icon;
            const isSubOpen = !!openSubmenus[item.path];
            const isCollapsed = collapsed && !mobileOpen;

            return (
              <div key={item.path} className="relative group">
                <div className="flex items-center">
                  <NavLink
                    to={item.path}
                    onClick={() => {
                      setActiveTooltip(null);
                      setMobileOpen(false);
                    }}
                    onMouseEnter={(e) =>
                      handleItemMouseEnter(item, visibleChildren, e)
                    }
                    onMouseLeave={handleItemMouseLeave}
                    onFocus={(e) =>
                      handleItemMouseEnter(item, visibleChildren, e)
                    }
                    onBlur={handleItemMouseLeave}
                    aria-label={item.label}
                    className={`flex items-center font-medium text-xs transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                      isActive
                        ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/20 font-semibold'
                        : 'text-slate-600 hover:text-brand-600 hover:bg-orange-50/80'
                    } ${
                      isCollapsed
                        ? 'w-11 h-11 mx-auto justify-center rounded-xl p-0'
                        : 'flex-1 gap-3 px-3 py-2 rounded-xl'
                    }`}
                  >
                    <Icon
                      className={`shrink-0 transition-transform ${
                        isCollapsed ? 'w-5 h-5' : 'w-4 h-4'
                      } ${
                        isActive
                          ? 'text-white'
                          : 'text-slate-400 group-hover:text-brand-600'
                      }`}
                    />
                    {!isCollapsed && (
                      <span className="truncate flex-1">{item.label}</span>
                    )}
                  </NavLink>

                  {!isCollapsed && visibleChildren.length > 0 && (
                    <button
                      type="button"
                      onClick={(e) => toggleSubmenu(item.path, e)}
                      className={`p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-transform ${
                        isSubOpen ? 'rotate-180' : ''
                      }`}
                      aria-label={`Toggle sub-menu for ${item.label}`}
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {!isCollapsed &&
                  visibleChildren.length > 0 &&
                  isSubOpen && (
                    <div className="mt-1 ml-4 pl-3 border-l-2 border-slate-100 space-y-1">
                      {visibleChildren.map((child) => {
                        const isSubItemActive =
                          location.pathname === child.path;
                        const ChildIcon = child.icon;
                        return (
                          <NavLink
                            key={child.path}
                            to={child.path}
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                              isSubItemActive
                                ? 'bg-brand-50 text-brand-700 font-semibold border border-brand-200'
                                : 'text-slate-500 hover:text-brand-600 hover:bg-orange-50/80'
                            }`}
                          >
                            <ChildIcon className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{child.label}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
              </div>
            );
          })}
        </nav>

        {(!collapsed || mobileOpen) && (
          <div className="p-3 border-t border-slate-100 m-2 rounded-xl bg-slate-50/80">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Role:</span>
              <span className="font-semibold text-slate-700 capitalize">
                {user.role}
              </span>
            </div>
          </div>
        )}
      </aside>
      {renderPortalTooltip()}
    </>
  );
};

export const Topbar: React.FC<{
  onToggleMobileMenu?: () => void;
  mobileTriggerRef?: React.RefObject<HTMLButtonElement | null>;
  mobileOpen?: boolean;
}> = ({ onToggleMobileMenu, mobileTriggerRef, mobileOpen }) => {
  const navigate = useNavigate();
  const { user, school, logout } = useAuth();
  const { unreadCount, resetUnread } = useSocket();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await notificationsApi.getMyNotifications();
      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      fetchNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAsRead('all');
      resetUnread();
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const roleColors: Record<string, string> = {
    admin: 'bg-rose-50 text-rose-700 border-rose-200',
    teacher: 'bg-purple-50 text-purple-700 border-purple-200',
    student: 'bg-sky-50 text-sky-700 border-sky-200',
    parent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between z-20 shrink-0">
      <div className="flex items-center gap-3 sm:gap-6">
        <button
          type="button"
          ref={mobileTriggerRef}
          onClick={onToggleMobileMenu}
          aria-label="Open sidebar menu"
          aria-expanded={mobileOpen}
          className="p-2 -ml-1 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 md:hidden transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800 text-sm md:text-base tracking-tight">
            {school?.name || 'Adiya School'}
          </span>
          <span className="hidden sm:inline-block text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium border border-slate-200">
            {school?.academicYear || '2025-2026'}
          </span>
        </div>

        <div className="relative hidden md:block w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search students, classes, records..."
            className="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400"
          />
        </div>

        {env.VITE_DEMO_MODE && (
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Demo Mode (Adiya Live DB)</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative" ref={notifRef}>
          <button
            onClick={handleOpenNotifications}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 relative transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 pb-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-slate-800">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 font-medium">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 p-1 hover:bg-brand-50 rounded"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Read all
                  </button>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-sm">
                    No notifications right now
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`px-4 py-3 hover:bg-slate-50 transition-colors ${
                        !n.isRead ? 'bg-orange-50/30' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-xs text-slate-800 leading-tight">
                          {n.title}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {new Date(n.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center border border-brand-200">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-700 leading-tight">
                {user?.name}
              </span>
              <span className="text-[10px] font-medium text-slate-500 capitalize">
                {user?.role}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-800 truncate">
                  {user?.name}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {user?.email}
                </p>
                <div className="mt-1.5">
                  <span
                    className={`inline-block text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                      user ? roleColors[user.role] : ''
                    }`}
                  >
                    {user?.role}
                  </span>
                </div>
              </div>

              {user?.role === 'admin' && (
                <div className="py-1 border-b border-slate-100">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/admin/settings');
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    School Settings & Backup
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/admin/audit-logs');
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                  >
                    <History className="w-4 h-4 text-slate-400" />
                    System Audit Logs
                  </button>
                </div>
              )}

              <div className="py-1">
                <button
                  onClick={logout}
                  className="w-full px-4 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export const AppLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('eduhub_sidebar_collapsed');
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);
  const { latestNoticeAlert, clearNoticeAlert } = useSocket();

  const handleSetCollapsed = (val: boolean) => {
    setSidebarCollapsed(val);
    try {
      localStorage.setItem('eduhub_sidebar_collapsed', JSON.stringify(val));
    } catch (e) {
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC]">
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={handleSetCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        mobileTriggerRef={mobileTriggerRef}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Topbar
          onToggleMobileMenu={() => setMobileOpen(!mobileOpen)}
          mobileTriggerRef={mobileTriggerRef}
          mobileOpen={mobileOpen}
        />

        {latestNoticeAlert && (
          <div className="bg-brand-50 border-b border-brand-200 px-6 py-2.5 flex items-center justify-between animate-in slide-in-from-top-2 duration-200 shrink-0">
            <div className="flex items-center gap-2.5 text-xs text-brand-900 font-medium">
              <span className="p-1 rounded-md bg-brand-500 text-white shrink-0">
                <Bell className="w-3.5 h-3.5" />
              </span>
              <span>
                <strong>New School Notice:</strong> {latestNoticeAlert}
              </span>
            </div>
            <button
              onClick={clearNoticeAlert}
              className="text-brand-500 hover:text-brand-700 p-1 rounded-md hover:bg-brand-100 transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
};

