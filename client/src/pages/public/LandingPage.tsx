import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  Users,
  CalendarCheck,
  Receipt,
  BookOpen,
  Calendar,
  Bell,
  MessageSquare,
  FileSpreadsheet,
  Award,
  FolderDown,
  BarChart2,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  CheckCircle,
  Building2,
  Check,
  ChevronRight,
  TrendingUp,
  Clock,
  Layers,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [activePreviewTab, setActivePreviewTab] = useState<
    'overview' | 'attendance' | 'fees' | 'exams'
  >('overview');

  const stats = [
    {
      label: 'Enrolled Students',
      value: '1,248',
      description:
        'Active student roster and profile tracking from kindergarten to grade 12',
      color: 'cyan',
      bgClass: 'bg-[#ECFEFF] border-[#A5F3FC] text-[#0891B2]',
      badgeClass: 'bg-[#CFFAFE] text-[#0E7490]',
      icon: GraduationCap,
    },
    {
      label: 'Teachers & Faculty',
      value: '184',
      description:
        'Class allocations, subject assignments, and granular permission controls',
      color: 'peach',
      bgClass: 'bg-[#FFF7ED] border-[#FFEDD5] text-[#EA580C]',
      badgeClass: 'bg-[#FFEDD5] text-[#C2410C]',
      icon: Users,
    },
    {
      label: 'Daily Attendance',
      value: '96.8%',
      description:
        'Real-time session registers with automated SMS and email notifications',
      color: 'green',
      bgClass: 'bg-[#F0FDF4] border-[#BBF7D0] text-[#16A34A]',
      badgeClass: 'bg-[#DCFCE7] text-[#15803D]',
      icon: CalendarCheck,
    },
    {
      label: 'School Operations',
      value: '100% Digital',
      description:
        'Paperless fees, instant receipts, DMC transcripts, and timetable engine',
      color: 'blue',
      bgClass: 'bg-[#EFF6FF] border-[#BFDBFE] text-[#2563EB]',
      badgeClass: 'bg-[#DBEAFE] text-[#1D4ED8]',
      icon: Building2,
    },
  ];

  const featureCards = [
    {
      title: 'Student Management',
      desc: 'Enrollment records, auto-generated admission numbers, academic history, parent links, and document archiving.',
      icon: GraduationCap,
    },
    {
      title: 'Teacher Management',
      desc: 'Faculty profiles, subject allocations, assigned classes, experience logs, and contact directories.',
      icon: Users,
    },
    {
      title: 'Attendance',
      desc: 'Daily registers with strict Present, Late, and Absent statuses, automatic recalculation, and guardian notification alerts.',
      icon: CalendarCheck,
    },
    {
      title: 'Fees and Concessions',
      desc: 'Custom fee structures, merit concessions, partial payments, automated invoices, and tamper-proof receipts.',
      icon: Receipt,
    },
    {
      title: 'Homework and Assignments',
      desc: 'Curriculum-aligned homework distribution, file submissions, on-time evaluations, and feedback notes.',
      icon: BookOpen,
    },
    {
      title: 'Timetable',
      desc: 'Conflict-free scheduling algorithm guarding against teacher, class, and room overlaps across all working days.',
      icon: Calendar,
    },
    {
      title: 'Notice Board',
      desc: 'Targeted institutional announcements filtered for students, parents, faculty, or all campus staff.',
      icon: Bell,
    },
    {
      title: 'Communication',
      desc: 'Secure parent-teacher messaging and real-time announcements keeping stakeholders connected.',
      icon: MessageSquare,
    },
    {
      title: 'Tests and Exams',
      desc: 'Assessment scheduling, subject scoring, marks entry with absent validation, and draft submission states.',
      icon: FileSpreadsheet,
    },
    {
      title: 'Results and Report Cards',
      desc: 'Gated result publishing, automated grading calculations, and official Detailed Marks Certificate (DMC) layouts.',
      icon: Award,
    },
    {
      title: 'Study Materials',
      desc: 'Digital syllabus repository for class and subject materials with secure multi-tenant cloud storage.',
      icon: FolderDown,
    },
    {
      title: 'Reports and Analytics',
      desc: 'Class strengths, attendance registers, fee defaulters, and examination statements exportable to CSV and print.',
      icon: BarChart2,
    },
    {
      title: 'AI Assistant',
      desc: 'AI-assisted drafting for notice announcements, attendance trends, fee summaries, and report explanations.',
      icon: Sparkles,
    },
    {
      title: 'Roles and Permissions',
      desc: 'Granular 42-key permission matrix giving administrators total authority over every teacher capability.',
      icon: ShieldCheck,
    },
  ];

  const solutions = [
    {
      role: 'Admin & Leadership',
      badge: 'Institutional Governance',
      title: 'Complete Command Over Campus Operations',
      desc: 'Oversee multi-tenant academic sessions, track institutional fee collection, inspect audit logs, and configure school policies with absolute security.',
      highlights: [
        'Global oversight across all student and faculty profiles',
        'Direct control over fees, concessions, and defaulters ledger',
        'Academic calendar, working days, and timetable generation',
        'Complete system backup export and disaster recovery',
      ],
      linkText: 'Explore Admin Capabilities',
    },
    {
      role: 'Teachers & Faculty',
      badge: 'Admin-Controlled RBAC',
      title: 'Focused Academic Delivery Without Friction',
      desc: 'Teachers experience a clutter-free workspace scoped strictly to assigned classes and subjects. The school Admin decides exactly which modules and actions each teacher can access, including attendance, homework, tests, exams, marks entry, results publishing, notices, communication, fees, and more.',
      highlights: [
        'Class-scoped attendance registers with absent validation',
        'Enter and submit exam marks as draft or finalized',
        'Distribute homework and grade submissions with feedback',
        'Permissions strictly granted or revoked per teacher by Admin',
      ],
      linkText: 'Explore Teacher Capabilities',
    },
    {
      role: 'Students',
      badge: 'Academic Portal',
      title: 'Transparent Learning & Real-Time Performance',
      desc: 'A dedicated, privacy-isolated student portal showing homework deadlines, upcoming tests, weekly schedules, study materials, and published report cards.',
      highlights: [
        'Personal attendance calendar with color-coded history',
        'Submit assignments online with verification timestamps',
        'View only officially published results with subject grades',
        'Weekly class timetable and accessible course materials',
      ],
      linkText: 'Explore Student Capabilities',
    },
    {
      role: 'Parents & Guardians',
      badge: 'Guardian Experience',
      title: 'Stay Informed on Child Progress & Fees',
      desc: 'Parents with multiple enrolled children can seamlessly switch between verified child contexts. Track real-time attendance, review fee dues, pay balances, and print official report cards.',
      highlights: [
        'Safe multi-child context switcher without page reloads',
        'Immediate notification alerts for student absences',
        'Itemized fee statements and official receipt downloads',
        'Detailed Marks Certificate (DMC) printable transcripts',
      ],
      linkText: 'Explore Parent Capabilities',
    },
  ];

  const steps = [
    {
      num: '01',
      title: 'Register Your School',
      desc: 'Set up your institution code, school name, academic year, and working days in under three minutes.',
    },
    {
      num: '02',
      title: 'Configure Classes & Roster',
      desc: 'Create sections, assign class teachers, define subject curricula, and import or enroll student records.',
    },
    {
      num: '03',
      title: 'Manage Daily Activities',
      desc: 'Mark color-coded attendance, assign homework, record fee receipts, and broadcast notices to stakeholders.',
    },
    {
      num: '04',
      title: 'Track Performance & Results',
      desc: 'Conduct exams, enter marks, publish verified report cards, and analyze institutional metrics in real time.',
    },
  ];

  return (
    <div className="space-y-0">
      <section className="relative min-h-[680px] h-[92vh] max-h-[880px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=2200&q=85"
            alt="Modern school campus building with green lawns and sunny academic courtyard"
            className="w-full h-full object-cover object-center scale-105 transform animate-pulse duration-[10000ms]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-900/60" />
          <div className="absolute inset-0 bg-brand-950/20 mix-blend-multiply" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-16 sm:pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-semibold uppercase tracking-wider mb-6 shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
            <span>Built for modern schools</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15] max-w-4xl mx-auto"
          >
            Smarter School Management with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-orange-300 to-amber-300">
              EduHub
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-6 text-sm sm:text-base lg:text-lg text-slate-200 leading-relaxed max-w-2xl mx-auto font-normal"
          >
            EduHub helps schools manage students, teachers, attendance, fees,
            homework, exams, results, communication, and daily operations from
            one platform.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5"
          >
            <Link
              to="/register-school"
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/features"
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-white"
            >
              Explore Features
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-300"
          >
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Multi-Tenant School Isolation</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Admin-Controlled Teacher RBAC</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Verified Parent Multi-Child Switcher</span>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative z-20 -mt-10 sm:-mt-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={`p-6 rounded-3xl border shadow-sm transition-all hover:shadow-md ${stat.bgClass}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${stat.badgeClass}`}
                  >
                    {stat.label}
                  </span>
                  <div className="p-2 rounded-xl bg-white shadow-xs">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-black text-slate-900 tracking-tight">
                  {stat.value}
                </div>
                <p className="text-xs text-slate-600 mt-2 font-medium leading-relaxed">
                  {stat.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
            Platform Experience
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
            Designed for clarity, speed, and daily ease
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-3 leading-relaxed">
            A clean, warm layout inspired by modern educational workflows. Light
            collapsible navigation, orange active markers, white rounded cards,
            and zero cluttered jargon.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
              <span className="ml-3 font-mono text-xs text-slate-400 hidden sm:inline">
                eduhub-sms.local/admin/dashboard
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200 font-bold text-[10px] uppercase tracking-wider">
                Live Preview • Adiya School Instance
              </span>
            </div>
          </div>

          <div className="bg-slate-100/60 px-6 py-2 border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs">
            <button
              onClick={() => setActivePreviewTab('overview')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activePreviewTab === 'overview'
                  ? 'bg-white text-brand-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Academic Overview
            </button>
            <button
              onClick={() => setActivePreviewTab('attendance')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activePreviewTab === 'attendance'
                  ? 'bg-white text-brand-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Attendance Register
            </button>
            <button
              onClick={() => setActivePreviewTab('fees')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activePreviewTab === 'fees'
                  ? 'bg-white text-brand-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fee Collection
            </button>
            <button
              onClick={() => setActivePreviewTab('exams')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activePreviewTab === 'exams'
                  ? 'bg-white text-brand-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Examinations & Results
            </button>
          </div>

          <div className="p-6 md:p-8 bg-[#F8FAFC] space-y-6">
            {activePreviewTab === 'overview' && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Enrolled Students
                    </span>
                    <div className="text-2xl font-black text-slate-900 mt-1">
                      1,248
                    </div>
                    <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3.5 h-3.5" /> 100% active roster
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Today's Attendance
                    </span>
                    <div className="text-2xl font-black text-slate-900 mt-1">
                      96.8%
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                      1,208 Present • 32 Absent
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Term Fees Collected
                    </span>
                    <div className="text-2xl font-black text-slate-900 mt-1">
                      ₹42.8L
                    </div>
                    <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
                      89% on-time recovery
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Active Term
                    </span>
                    <div className="text-2xl font-black text-brand-600 mt-1">
                      Term 1
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                      Mid-Term Exams Published
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="font-bold text-xs text-slate-800">
                        Class 10A Today's Schedule
                      </h3>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">
                        Monday • Room 204
                      </span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-800">
                            Mathematics
                          </span>
                          <span className="text-slate-400 text-[11px] block">
                            Rajesh Sharma
                          </span>
                        </div>
                        <span className="font-mono text-slate-500 text-[11px]">
                          09:00 - 09:45 AM
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-800">
                            Science (Biology)
                          </span>
                          <span className="text-slate-400 text-[11px] block">
                            Priya Nair
                          </span>
                        </div>
                        <span className="font-mono text-slate-500 text-[11px]">
                          09:45 - 10:30 AM
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="font-bold text-xs text-slate-800">
                        Institutional Notices
                      </h3>
                      <span className="text-[10px] font-semibold text-brand-600 uppercase">
                        Active Broadcast
                      </span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-orange-50/50 border border-orange-100 space-y-1">
                        <span className="font-bold text-slate-900 block">
                          Term 1 Examination Schedule Released
                        </span>
                        <p className="text-[11px] text-slate-600">
                          Hall tickets and Detailed Marks Certificate syllabus
                          available on student portals.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activePreviewTab === 'attendance' && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-xs text-slate-800">
                    Daily Attendance Register (Class 10A • Adiya Demo)
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Green = Present
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                      Yellow = Late
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                      Red = Absent
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                      <tr>
                        <th className="p-2.5">Roll No</th>
                        <th className="p-2.5">Student Name</th>
                        <th className="p-2.5 text-center">Monday</th>
                        <th className="p-2.5 text-center">Tuesday</th>
                        <th className="p-2.5 text-center">Wednesday</th>
                        <th className="p-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-2.5 font-mono font-bold text-slate-700">
                          #101
                        </td>
                        <td className="p-2.5 font-semibold text-slate-800">
                          Aarav Sharma
                        </td>
                        <td className="p-2.5 text-center">
                          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                        </td>
                        <td className="p-2.5 text-center">
                          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                        </td>
                        <td className="p-2.5 text-center">
                          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                        </td>
                        <td className="p-2.5 text-center font-bold text-emerald-600">
                          100% Present
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold text-slate-700">
                          #102
                        </td>
                        <td className="p-2.5 font-semibold text-slate-800">
                          Rohan Verma
                        </td>
                        <td className="p-2.5 text-center">
                          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                        </td>
                        <td className="p-2.5 text-center">
                          <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                        </td>
                        <td className="p-2.5 text-center">
                          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                        </td>
                        <td className="p-2.5 text-center font-bold text-amber-600">
                          Late Marked
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activePreviewTab === 'fees' && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-xs text-slate-800">
                    Fee Invoices & Tamper-Proof Receipts
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Idempotent transaction pipeline
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-700">
                        INV-2026-0042
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        PAID IN FULL
                      </span>
                    </div>
                    <p className="font-semibold text-slate-800">
                      Aarav Sharma (Class 10A)
                    </p>
                    <div className="flex items-center justify-between text-slate-600 text-[11px]">
                      <span>Tuition & Laboratory Fee</span>
                      <span className="font-bold text-slate-900">₹18,500</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-700">
                        INV-2026-0043
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        PARTIAL PAYMENT
                      </span>
                    </div>
                    <p className="font-semibold text-slate-800">
                      Ananya Sharma (Class 9B)
                    </p>
                    <div className="flex items-center justify-between text-slate-600 text-[11px]">
                      <span>Paid: ₹5,000 / Billed: ₹18,500</span>
                      <span className="font-bold text-amber-700">
                        Balance: ₹13,500
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activePreviewTab === 'exams' && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-xs text-slate-800">
                    Detailed Marks Certificate (DMC) Performance
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    OFFICIALLY PUBLISHED
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 text-[10px] uppercase block">
                      Aggregate Marks
                    </span>
                    <span className="text-lg font-black text-slate-800">
                      468 / 500
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-brand-50 border border-brand-100">
                    <span className="text-brand-600 text-[10px] uppercase block">
                      Percentage
                    </span>
                    <span className="text-lg font-black text-brand-600">
                      93.6%
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                    <span className="text-emerald-700 text-[10px] uppercase block">
                      Result
                    </span>
                    <span className="text-lg font-black text-emerald-700">
                      PASS (A+)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                Core Capabilities
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
                14 Comprehensive School Modules
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-xl">
                Every workflow required for high-performing educational
                institutions, built into a single cohesive architecture.
              </p>
            </div>
            <Link
              to="/features"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700"
            >
              <span>Explore detailed module specs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {featureCards.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: (idx % 4) * 0.08 }}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-brand-200 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-50 text-brand-600 flex items-center justify-center border border-orange-100">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-sm text-slate-800">
                      {feat.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-normal">
                      {feat.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/features"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-sm transition-all"
            >
              <span>View all module technical capabilities</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
            Tailored Experiences
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
            Built for Every Role in the School Community
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Distinct, secure role portals for Administrators, Teachers,
            Students, and Parents.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {solutions.map((sol, idx) => (
            <motion.div
              key={sol.role}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
                    {sol.role}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold text-[10px]">
                    {sol.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  {sol.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {sol.desc}
                </p>

                <div className="pt-2 border-t border-slate-100 space-y-2">
                  {sol.highlights.map((h, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-xs text-slate-700"
                    >
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 mt-4">
                <Link
                  to="/solutions"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700"
                >
                  <span>{sol.linkText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
              Simple Onboarding
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
              How EduHub Powers Your Institution
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              From school registration to daily operations in four
              straightforward steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((st) => (
              <div
                key={st.num}
                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs relative space-y-3"
              >
                <div className="text-3xl font-black text-brand-500 font-mono">
                  {st.num}
                </div>
                <h3 className="font-bold text-sm text-slate-800">{st.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  {st.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-gradient-to-r from-brand-600 via-orange-500 to-amber-500 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Give your school a smarter way to work
          </h2>
          <p className="text-xs sm:text-base text-orange-100 max-w-2xl mx-auto leading-relaxed">
            Join educational institutions that have simplified operations,
            secured their data, and delighted teachers, students, and parents
            with EduHub.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              to="/register-school"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-brand-600 font-bold text-xs shadow-md transition-all hover:scale-105"
            >
              Create Your School
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-brand-700/60 hover:bg-brand-700 text-white border border-white/20 font-bold text-xs transition-all"
            >
              Sign In to Portal
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
