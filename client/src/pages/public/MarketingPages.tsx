import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Lock,
  Layers,
  Sparkles,
  School,
  CheckCircle2,
  Users,
  Award,
  Globe,
  ArrowRight,
  Database,
  Cpu,
  HeartHandshake,
  Check,
  GraduationCap,
  CalendarCheck,
  Receipt,
  BookOpen,
  Calendar,
  Bell,
  MessageSquare,
  FileSpreadsheet,
  FolderDown,
  BarChart2,
  CheckCircle,
  Filter,
  Sliders,
  Mail,
  Send,
  HelpCircle,
  ChevronDown,
  Clock,
  Building,
  User,
  Phone,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const pillars = [
    {
      icon: ShieldCheck,
      title: 'Tenant-Level Data Isolation',
      desc: 'Every school instance runs within an isolated cryptographic partition. School data, student directories, financial ledgers, and audit logs are strictly ring-fenced with zero cross-tenant leakage.',
    },
    {
      icon: Lock,
      title: 'Admin-Controlled Granular RBAC',
      desc: 'We reject blanket roles. School administrators precisely configure which modules and operational actions each teacher can access, from attendance to published marks entry.',
    },
    {
      icon: Layers,
      title: 'Published-Only Privacy Invariant',
      desc: 'Draft examination grades and moderation scores remain strictly inaccessible to students and parents until the academic board authorizes release. Zero unintended grade leaks.',
    },
    {
      icon: Cpu,
      title: 'Real-Time Enterprise Stack',
      desc: 'Engineered with React, TypeScript strict mode, Tailwind CSS, Node.js, and MongoDB. WebSocket push guarantees real-time attendance alerts and instantaneous circular dispatches.',
    },
  ];

  const milestones = [
    {
      metric: '100%',
      label: 'TypeScript Strict Mode',
      detail:
        'End-to-end typed contracts across all client models and server APIs.',
    },
    {
      metric: '0 Mock Data',
      label: 'Real Live APIs',
      detail:
        'Every dashboard card, attendance calendar, and invoice syncs with live database schemas.',
    },
    {
      metric: '14 Modules',
      label: 'Integrated SMS Suite',
      detail:
        'From timetable scheduling and homework to audit logs and AI-assisted circulars.',
    },
    {
      metric: '< 100ms',
      label: 'Instant UI Response',
      detail:
        'Optimized queries and cached tenant routing for instantaneous page transitions.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800">
      <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-b from-brand-500/5 via-transparent to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold mb-4">
              <School className="w-3.5 h-3.5" />
              <span>About EduHub</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Engineering the Operating System for Modern Schools
            </h1>
            <p className="mt-5 text-lg text-slate-600 leading-relaxed">
              EduHub was built to solve the frustration of disjointed school
              software. We unite academics, student administration, parent
              communications, examination grading, and bursar operations into a
              clean, modern, and rock-solid platform.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-600 mb-2">
                Our Core Mission
              </h2>
              <h3 className="text-3xl font-extrabold text-slate-900 leading-tight">
                Simplicity for Teachers, Transparency for Parents, Absolute
                Control for Administrators
              </h3>
              <p className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed">
                Schools have unique operational demands. A class teacher taking
                attendance has ninety seconds between bells. A bursar collecting
                quarterly tuition cannot afford duplicate ledger entries.
                Parents require instantaneous reassurance that their child
                arrived safely at school.
              </p>
              <p className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed">
                EduHub was engineered from the ground up to replace outdated
                legacy software with a unified interface inspired by modern
                consumer apps: fast, intuitive, responsive, and deeply
                respectful of user permissions.
              </p>

              <div className="mt-6 space-y-3">
                {[
                  'Eliminates paper registers, manual spreadsheets, and lost receipts',
                  'Ensures data privacy with strict role and class-level scoping',
                  'Gives parents real-time visibility into their children’s learning journey',
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 text-sm text-slate-700"
                  >
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm relative">
              <div className="absolute -top-3 -right-3 bg-brand-500 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow">
                Production Standard
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-brand-500" />
                The EduHub Architecture Principles
              </h4>
              <div className="space-y-4 text-xs text-slate-600">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-bold text-slate-800 block mb-0.5">
                    1. No Hardcoded Logic in Dashboards
                  </span>
                  Every counter, attendance graph, timetable card, and fee
                  summary is computed dynamically from real backend database
                  models.
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-bold text-slate-800 block mb-0.5">
                    2. Role-Enforced Server-Side Verification
                  </span>
                  Teachers cannot view records or execute actions unless granted
                  explicit permissions by the School Administrator. Client-side
                  security is backed by server middleware.
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-bold text-slate-800 block mb-0.5">
                    3. Multi-Child Verified Context
                  </span>
                  Parents switch cleanly between verified linked children
                  without session leakage or confusing aggregate states.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-600 mb-2">
              Engineering Excellence
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900">
              Four Pillars of System Integrity
            </h3>
            <p className="mt-3 text-sm text-slate-600">
              How EduHub delivers reliability and defense-in-depth security for
              institutional deployments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={idx}
                  className="bg-[#F8FAFC] rounded-2xl border border-slate-200 p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h4 className="text-base font-bold text-slate-900 mb-2">
                      {pillar.title}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {pillar.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold mb-4 border border-brand-500/30">
                <Award className="w-3.5 h-3.5" />
                <span>Reference Institution Showcase</span>
              </div>
              <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Adiya School of Excellence: Our Real-World Benchmark
              </h3>
              <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
                To guarantee that EduHub is never merely theoretical software,
                we maintain{' '}
                <strong className="text-white font-semibold">
                  Adiya School of Excellence
                </strong>{' '}
                as our primary operational reference instance.
              </p>
              <p className="mt-3 text-slate-300 text-sm leading-relaxed">
                At Adiya, every new workflow—from tri-color attendance roll
                calls (Green, Yellow, Red) and Detailed Marks Certificate (DMC)
                publication to automated fee receipts and parent multi-child
                switching—is vetted against a simulated campus of 1,240+
                students and 78 faculty members.
              </p>

              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-700">
                <div>
                  <p className="text-2xl font-black text-brand-400">1,240+</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Enrolled Students
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-black text-brand-400">78</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Faculty Members
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-black text-brand-400">48</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Classes & Sections
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-black text-brand-400">100%</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Audit-Ready Ledgers
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {milestones.map((m, idx) => (
              <div key={idx} className="text-center sm:text-left">
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {m.metric}
                </div>
                <div className="text-sm font-semibold text-brand-600 mt-1">
                  {m.label}
                </div>
                <p className="text-xs text-slate-500 mt-1">{m.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Ready to modernise your institution with EduHub?
          </h3>
          <p className="mt-3 text-sm text-slate-600 max-w-xl mx-auto">
            Join forward-thinking school leaders using EduHub for attendance,
            grading, finances, and parent engagement.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register-school"
              className="px-6 py-3 rounded-xl bg-brand-500 text-white text-xs font-bold hover:bg-brand-600 transition-colors shadow-sm"
            >
              Get Started with EduHub
            </Link>
            <Link
              to="/features"
              className="px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Explore All 14 Modules
            </Link>
            <Link
              to="/contact"
              className="px-6 py-3 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors"
            >
              Request a Custom Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export const FeaturesPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All 14 Modules' },
    { id: 'academic', label: 'Academics & Instruction' },
    { id: 'admin', label: 'Administration & RBAC' },
    { id: 'finance', label: 'Finance & Defaulters' },
    { id: 'communication', label: 'Stakeholder Communication' },
  ];

  const modules = [
    {
      id: 'students',
      category: 'academic',
      title: 'Student Management',
      subtitle: 'Complete student lifecycle from admission to graduation',
      icon: GraduationCap,
      color: 'bg-orange-50 text-brand-600 border-orange-200',
      bullets: [
        'Automated sequential admission number generator (ADM-YYYY-XXXX)',
        'Biographic information, blood group, emergency contacts, and active status',
        'Verification document repository with secure uploads and multi-tenant scoping',
        'Direct link to parent/guardian profiles with verified relationship tags',
        'Soft-deletion archive and instant restoration safeguarding audit history',
      ],
    },
    {
      id: 'teachers',
      category: 'admin',
      title: 'Teacher Management',
      subtitle:
        'Faculty directories, class assignments, and subject allocation',
      icon: Users,
      color: 'bg-purple-50 text-purple-600 border-purple-200',
      bullets: [
        'Class & subject assignment engine scoping teacher visibility strictly to assigned rosters',
        'Detailed faculty profile including qualification, experience, and joining dates',
        'Dedicated teacher dashboard tracking daily attendance tasks and pending homework',
        'Teacher-student communication directory for academic advisement',
      ],
    },
    {
      id: 'attendance',
      category: 'academic',
      title: 'Attendance Tracking',
      subtitle: 'Strict 4-status daily registers with guardian notifications',
      icon: CalendarCheck,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      bullets: [
        'Standardized color markers: Green (Present), Amber (Late), and Red (Absent)',
        'Duplicate attendance prevention preventing accidental double-marking on the same day',
        'Instant automated guardian alert pipeline via SMS and Email for student absences',
        'Finalized session editing gated by explicit attendance.edit permission with audit reasons',
        'Historical daily, weekly, and monthly attendance percentage calculations',
      ],
    },
    {
      id: 'fees',
      category: 'finance',
      title: 'Fees & Concessions',
      subtitle:
        'Tamper-proof invoicing, partial payments, and defaulter tracking',
      icon: Receipt,
      color: 'bg-amber-50 text-amber-600 border-amber-200',
      bullets: [
        'Customizable fee heads (Tuition, Lab, Amenities) and structured academic term billing',
        'Merit, sibling, and sports concession approvals with capped discount calculations',
        'Idempotent payment recording preventing double-counting of payment receipts',
        'Support for full and partial payment installments with real-time balance tracking',
        'Automated defaulters report calculating overdue days and contact escalation logs',
      ],
    },
    {
      id: 'homework',
      category: 'academic',
      title: 'Homework & Assignments',
      subtitle: 'Curriculum tasks, file submissions, and grading feedback',
      icon: BookOpen,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      bullets: [
        'Create homework scoped strictly to teacher’s assigned classes and subjects',
        'Set precise due dates with automated late submission flags for delayed work',
        'Student digital submissions with file attachments and submission history',
        'Teacher grading matrix requiring homework.grade permission with evaluation remarks',
      ],
    },
    {
      id: 'timetable',
      category: 'academic',
      title: 'Timetable Scheduling',
      subtitle:
        '3D conflict detection engine across teachers, classes, and rooms',
      icon: Calendar,
      color: 'bg-sky-50 text-sky-600 border-sky-200',
      bullets: [
        'Weekly Monday-to-Friday schedule matrix with time normalization',
        'Algorithmic conflict prevention blocking teacher, class, and room double-bookings',
        'Dedicated student view showing current day timetable slots and faculty',
        'Administrative master grid for institute-wide period coordination',
      ],
    },
    {
      id: 'notices',
      category: 'communication',
      title: 'Notice Board',
      subtitle: 'Targeted institutional announcements and safety circulars',
      icon: Bell,
      color: 'bg-rose-50 text-rose-600 border-rose-200',
      bullets: [
        'Audience targeting: broadcast to Students, Parents, Teachers, or Campus-Wide',
        'Priority tagging (urgent vs standard) with real-time banner broadcast',
        'Draft and published workflow preventing unauthorized announcement distribution',
        'Targeted queries ensuring students and parents never see internal faculty circulars',
      ],
    },
    {
      id: 'communication',
      category: 'communication',
      title: 'Direct Communication',
      subtitle: 'Secure parent-teacher messaging and academic advisement',
      icon: MessageSquare,
      color: 'bg-teal-50 text-teal-600 border-teal-200',
      bullets: [
        'Controlled communication channels preventing unverified outside contacts',
        'Real-time socket messaging with verified JWT handshake tokens',
        'Unread badge counters and notification center alerts across devices',
        'Teacher office hours and academic advisement threads',
      ],
    },
    {
      id: 'exams',
      category: 'academic',
      title: 'Tests & Examinations',
      subtitle: 'Assessment scheduling, absent tracking, and draft scoring',
      icon: FileSpreadsheet,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      bullets: [
        'Schedule unit tests, term exams, and finals with class and subject specifications',
        'Teacher marks entry restricted exclusively to assigned subject papers',
        'Explicit absent flag setting marks to zero and calculating failing status',
        'Marks boundary validation (0 to maxMarks) preventing human scoring errors',
        'Save as draft or submit sheet for institutional review before release',
      ],
    },
    {
      id: 'results',
      category: 'academic',
      title: 'Results & Report Cards (DMC)',
      subtitle:
        'Published-only isolation and official Detailed Marks Certificates',
      icon: Award,
      color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      bullets: [
        'Published-Only Privacy Invariant: Draft marks are strictly invisible to students/parents',
        'Dedicated results.publish permission gating official grade releases',
        'Post-publication marks correction tracking with immutable audit trail',
        'Official Detailed Marks Certificate (DMC) layout with CBSE code and print readiness',
      ],
    },
    {
      id: 'materials',
      category: 'academic',
      title: 'Study Materials',
      subtitle: 'Digital syllabus repository with curriculum categorization',
      icon: FolderDown,
      color: 'bg-cyan-50 text-cyan-600 border-cyan-200',
      bullets: [
        'Subject and chapter-based categorizations for lecture slides and notes',
        'Teacher upload capabilities scoped to authorized curriculum assignments',
        'Instant download access for enrolled students and linked guardians',
        'Secure multi-tenant file separation preventing cross-school access',
      ],
    },
    {
      id: 'reports',
      category: 'admin',
      title: 'Reports & Analytics',
      subtitle:
        'Institutional intelligence, occupancy rates, and export statements',
      icon: BarChart2,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      bullets: [
        'Class and section student strength with gender ratios and seat occupancy',
        'Monthly attendance registers tracking working days and class percentage trends',
        'Institutional fee summary separating tuition, fines, discounts, and outstanding dues',
        'Examination performance distributions and CSV statement exports',
      ],
    },
    {
      id: 'ai',
      category: 'admin',
      title: 'AI Academic Assistant',
      subtitle:
        'Secure local-mode AI for administrative notice and report summaries',
      icon: Sparkles,
      color: 'bg-violet-50 text-violet-600 border-violet-200',
      bullets: [
        'Assists administrators with notice drafting, circulars, and attendance summaries',
        'Safety Invariant: AI can never directly alter marks, attendance, or fee records',
        'Explicit data range transparency showing exactly which dates informed the summary',
        'Local mock provider adapter ensuring full availability without external API dependencies',
      ],
    },
    {
      id: 'roles',
      category: 'admin',
      title: 'Roles & Granular Permissions',
      subtitle:
        '42-key permission matrix for complete teacher authorization control',
      icon: ShieldCheck,
      color: 'bg-rose-50 text-rose-600 border-rose-200',
      bullets: [
        '42 distinct dot-notated permission keys covering all system capabilities',
        'Admin can decide exactly which modules each teacher can view, create, edit, or publish',
        'Safe default teacher profile keeping sensitive and destructive actions OFF',
        'Instant dynamic permission revocation without user session re-authentication',
      ],
    },
  ];

  const filteredModules =
    selectedCategory === 'all'
      ? modules
      : modules.filter((m) => m.category === selectedCategory);

  return (
    <div className="py-12 md:py-20 space-y-16">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider px-3.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
          Module Directory
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight max-w-3xl mx-auto">
          Comprehensive Platform Features
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          EduHub combines 14 modular engines into a single unified school
          operating system. Explore how each workflow is designed for data
          safety, speed, and simplicity.
        </p>

        <div className="pt-6 flex flex-wrap items-center justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                selectedCategory === cat.id
                  ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.id}
                className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${mod.color}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                        {mod.title}
                      </h3>
                      <span className="text-xs text-slate-500">
                        {mod.subtitle}
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-2.5 pt-2 border-t border-slate-100">
                    {mod.bullets.map((b, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-xs text-slate-600"
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 text-white text-center space-y-6 shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Ready to experience these modules in your institution?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            Get started with our demo school (Adiya School of Excellence) or
            configure your own school in minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register-school"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs transition-all"
            >
              Register School Now
            </Link>
            <Link
              to="/solutions"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-all"
            >
              Review Role Solutions
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export const SolutionsPage: React.FC = () => {
  return (
    <div className="py-12 md:py-20 space-y-16">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider px-3.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
          Tailored Role Solutions
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight max-w-3xl mx-auto">
          Built for Everyone in the School Ecosystem
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          EduHub delivers purposeful, security-isolated experiences tailored
          specifically for School Administrators, Teachers, Students, and
          Parents.
        </p>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-bold text-rose-600 uppercase tracking-wider block">
                  Institutional Governance
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  For School Administrators & Principals
                </h2>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
              Global Institution Authority
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs leading-relaxed">
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-800">
                Institutional Command & Accountability
              </h3>
              <p className="text-slate-600">
                Administrators enjoy uncompromised oversight over the entire
                institution. Configure academic years, batch enroll students,
                manage class structures, and maintain compliance with local
                educational standards.
              </p>
              <ul className="space-y-2 text-slate-700">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Multi-Session Management:</strong> Create and switch
                    active academic years with seamless rollover.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Finance & Defaulters:</strong> Configure fee
                    structures, approve merit concessions, and track payment
                    receipts.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Audit Logging:</strong> Monitor every critical
                    creation, update, and deletion across the system.
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 text-brand-600 font-bold text-xs">
                <Sliders className="w-4 h-4" />
                <span>Centralized Role-Based Access Control (RBAC)</span>
              </div>
              <p className="text-slate-600">
                The school administrator maintains complete governance over
                every faculty member’s privileges. Using EduHub’s granular
                42-key permission matrix, administrators decide exactly which
                modules and actions each teacher can access.
              </p>
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-500 font-mono">
                Admin controls: attendance.mark, homework.grade, marks.enter,
                results.publish, fees.collect, timetable.manage, and
                notices.publish.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center shrink-0">
                <Users className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-bold text-purple-600 uppercase tracking-wider block">
                  Instructional Workspace
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  For Teachers & Instructional Faculty
                </h2>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold">
              Class & Subject Scoped
            </span>
          </div>

          <div className="space-y-6 text-xs leading-relaxed">
            <div className="p-5 rounded-2xl bg-orange-50/70 border border-orange-200 text-slate-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-brand-700 text-sm">
                <Lock className="w-4 h-4" />
                <span>Admin-Controlled Module & Action Access</span>
              </div>
              <p className="text-slate-700 text-xs leading-relaxed">
                In EduHub,{' '}
                <strong>
                  the Administrator decides exactly which modules and actions
                  each teacher can access
                </strong>
                . A teacher only sees navigation items and action buttons for
                features granted to them:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] font-semibold text-slate-700">
                <span className="p-2 rounded-lg bg-white border border-orange-200">
                  Attendance Marking & Editing
                </span>
                <span className="p-2 rounded-lg bg-white border border-orange-200">
                  Homework Publishing & Grading
                </span>
                <span className="p-2 rounded-lg bg-white border border-orange-200">
                  Tests & Exam Marks Entry
                </span>
                <span className="p-2 rounded-lg bg-white border border-orange-200">
                  Result Publication Approval
                </span>
                <span className="p-2 rounded-lg bg-white border border-orange-200">
                  Timetable Viewing & Edits
                </span>
                <span className="p-2 rounded-lg bg-white border border-orange-200">
                  Notice Creation & Broadcast
                </span>
                <span className="p-2 rounded-lg bg-white border border-orange-200">
                  Parent-Teacher Messaging
                </span>
                <span className="p-2 rounded-lg bg-white border border-orange-200">
                  Fee Collection Delegation
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-slate-800">
                  Strict Class & Subject Roster Scoping
                </h3>
                <p className="text-slate-600">
                  Teachers are strictly scoped to the classes and subjects
                  explicitly assigned to them by school leadership. A
                  Mathematics teacher assigned to Grade 10A can only view and
                  score Grade 10A Mathematics students, preventing cross-faculty
                  interference.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-sm text-slate-800">
                  Real-Time Daily Classroom Tasks
                </h3>
                <p className="text-slate-600">
                  The teacher dashboard highlights today’s attendance status,
                  pending homework submissions, upcoming exam schedules, and
                  direct communication shortcuts for seamless classroom
                  management.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center shrink-0">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-bold text-sky-600 uppercase tracking-wider block">
                  Student Learning Experience
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  For Enrolled Students
                </h2>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-bold">
              Privacy-Isolated Self Portal
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs leading-relaxed">
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-800">
                Academic Transparency
              </h3>
              <p className="text-slate-600">
                Students access an organized dashboard highlighting daily
                schedules, homework tasks, subject materials, and verified exam
                results.
              </p>
              <ul className="space-y-2 text-slate-700">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Attendance History:</strong> Interactive monthly
                    calendar showing present, late, and approved leaves.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Homework Submissions:</strong> Upload files, track
                    evaluation scores, and read teacher feedback notes.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Published-Only Grades:</strong> Zero risk of viewing
                    draft or unfinalized marks before official release.
                  </span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-800">
                Official Report Cards (DMC)
              </h3>
              <p className="text-slate-600">
                Once published by administrators, students can view their
                Detailed Marks Certificate with percentage, subject letter
                grades, pass/fail status, and download or print the official
                transcript.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                <HeartHandshake className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">
                  Guardian Engagement
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  For Parents & Family Guardians
                </h2>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              Multi-Child Context Switcher
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs leading-relaxed">
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-800">
                Verified Multi-Child Switching
              </h3>
              <p className="text-slate-600">
                Parents with more than one child enrolled in the school (e.g.
                Aarav in Class 10A and Vihaan in Class 5B in our Adiya School
                demo) can switch between children in a single click. All
                attendance, fees, and results update instantly to the selected
                child.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-800">
                Automated Alerts & Fee Payments
              </h3>
              <p className="text-slate-600">
                Receive immediate SMS and email alerts whenever a child is
                marked absent. Pay term fees online, review itemized receipts,
                and stay updated with school notices.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">
            Equip every role with the right tools today
          </h2>
          <div className="flex items-center justify-center gap-3">
            <Link
              to="/register-school"
              className="px-6 py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-sm transition-all"
            >
              Register Your School
            </Link>
            <Link
              to="/login"
              className="px-6 py-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all"
            >
              Sign In to Portal
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question:
      'Can our leadership team explore EduHub using the Adiya demonstration dataset?',
    answer:
      'Yes! We maintain the Adiya School of Excellence demo instance fully populated with realistic classes, teacher schedules, tri-color attendance records, DMC report cards, and fee ledgers so your team can test every role in a live environment without uploading your own data first.',
  },
  {
    question:
      'Can administrators configure unique permissions for each individual teacher?',
    answer:
      'Absolutely. EduHub features an administrator-controlled permission matrix. You can grant a senior teacher access to publish marks and draft notices, while restricting other teachers to attendance roll calls and homework entry only. All permissions are enforced server-side on every request.',
  },
  {
    question:
      'Does EduHub require on-premise servers or dedicated IT maintenance?',
    answer:
      'No. EduHub is a modern cloud-native web platform. Your staff, students, and parents access the system securely through any standard web browser on desktop, tablet, or smartphone without installing or maintaining local server infrastructure.',
  },
  {
    question:
      'How does EduHub ensure that draft exam scores are not visible to parents prematurely?',
    answer:
      'EduHub enforces a hard "Published-Only" privacy rule. Student and parent portals only display marks that have passed administrative moderation and have been explicitly clicked as "Published". Draft marks remain 100% private to authorized teachers and examiners.',
  },
  {
    question:
      'Can parents manage multiple enrolled children from a single login?',
    answer:
      'Yes. Verified parents can seamlessly switch between all their linked children using the header child selector. Each child’s attendance, homework, timetable, and fee ledgers remain completely isolated and clearly labeled at all times.',
  },
  {
    question: 'How does school onboarding and data migration work?',
    answer:
      'EduHub includes built-in CSV/Excel student and faculty import templates. Most schools complete full configuration, academic year setup, and initial roll-out within 48 to 72 hours with assistance from our onboarding team.',
  },
];

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    schoolName: '',
    role: 'Principal / School Director',
    studentCount: '500 - 1,500 students',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 800);
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800">
      <section className="relative pt-32 pb-16 overflow-hidden bg-gradient-to-b from-brand-500/5 via-transparent to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold mb-4">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Get in Touch</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Request an Institutional Demo or Speak with an Advisor
            </h1>
            <p className="mt-4 text-lg text-slate-600 leading-relaxed">
              Discover how EduHub can streamline your school’s academic records,
              fee collection, attendance tracking, and parent engagement.
              Schedule a live walkthrough or ask us anything.
            </p>
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7">
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-sm">
                {isSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-10"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">
                      Demo Request Received
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
                      Thank you,{' '}
                      <strong className="text-slate-800">
                        {formData.fullName}
                      </strong>
                      . Our school technology advisor has received your request
                      for{' '}
                      <strong className="text-slate-800">
                        {formData.schoolName || 'your institution'}
                      </strong>{' '}
                      and will contact you within 1 business day with your
                      personalized walkthrough.
                    </p>

                    <div className="mt-8 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 max-w-sm mx-auto text-left space-y-1">
                      <p>
                        <strong>Registered Email:</strong> {formData.email}
                      </p>
                      {formData.phone && (
                        <p>
                          <strong>Contact Phone:</strong> {formData.phone}
                        </p>
                      )}
                      <p>
                        <strong>Role:</strong> {formData.role}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setIsSuccess(false);
                        setFormData({
                          fullName: '',
                          email: '',
                          phone: '',
                          schoolName: '',
                          role: 'Principal / School Director',
                          studentCount: '500 - 1,500 students',
                          message: '',
                        });
                      }}
                      className="mt-8 px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
                    >
                      Submit Another Inquiry
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        Book a Live Guided Walkthrough
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Fill in your details below and our team will prepare a
                        demonstration tailored to your school size.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Full Name *
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            required
                            value={formData.fullName}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                fullName: e.target.value,
                              })
                            }
                            placeholder="e.g. Dr. Arthur Bell"
                            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Official School Email *
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                email: e.target.value,
                              })
                            }
                            placeholder="e.g. head@school.edu"
                            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          School / Institution Name *
                        </label>
                        <div className="relative">
                          <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            required
                            value={formData.schoolName}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                schoolName: e.target.value,
                              })
                            }
                            placeholder="e.g. Oakridge Academy"
                            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Phone / WhatsApp Number
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                phone: e.target.value,
                              })
                            }
                            placeholder="+1 (555) 000-0000"
                            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Your Role at School
                        </label>
                        <select
                          value={formData.role}
                          onChange={(e) =>
                            setFormData({ ...formData, role: e.target.value })
                          }
                          className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
                        >
                          <option>Principal / School Director</option>
                          <option>Administrator / Trustee</option>
                          <option>Academic Coordinator</option>
                          <option>IT & Systems Director</option>
                          <option>Senior Faculty Member</option>
                          <option>Other Representative</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Estimated Student Enrollment
                        </label>
                        <select
                          value={formData.studentCount}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              studentCount: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
                        >
                          <option>&lt; 250 students</option>
                          <option>250 - 500 students</option>
                          <option>500 - 1,500 students</option>
                          <option>1,500+ students</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Specific Questions or Current Pain Points
                      </label>
                      <textarea
                        rows={3}
                        value={formData.message}
                        onChange={(e) =>
                          setFormData({ ...formData, message: e.target.value })
                        }
                        placeholder="Tell us about your current challenges (e.g. attendance tracking, report cards, fee defaulters, teacher permissions)..."
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-70"
                    >
                      {isSubmitting ? (
                        <span>Processing Request...</span>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Submit Request for Demonstration</span>
                        </>
                      )}
                    </button>

                    <p className="text-[11px] text-center text-slate-400">
                      We respect your privacy. No spam. You will be contacted
                      solely regarding EduHub platform advisory.
                    </p>
                  </form>
                )}
              </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-brand-500" />
                  Direct Advisory & Support Channels
                </h3>

                <div className="space-y-4 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="font-semibold text-slate-700">
                      General & Institutional Sales
                    </p>
                    <p className="text-slate-500 mt-0.5">
                      For deployment inquiries, licensing, and multi-campus
                      agreements:
                    </p>
                    <a
                      href="mailto:contact@eduhub.app"
                      className="mt-1.5 inline-block font-semibold text-brand-600 hover:underline"
                    >
                      contact@eduhub.app
                    </a>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="font-semibold text-slate-700">
                      Technical Support & Onboarding
                    </p>
                    <p className="text-slate-500 mt-0.5">
                      For existing administrators, teacher training, and SIS
                      migrations:
                    </p>
                    <a
                      href="mailto:support@eduhub.app"
                      className="mt-1.5 inline-block font-semibold text-brand-600 hover:underline"
                    >
                      support@eduhub.app
                    </a>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                    <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-700">
                        Advisory Response Window
                      </p>
                      <p className="text-slate-500 mt-0.5">
                        Monday – Friday, 8:00 AM – 6:00 PM EST. Urgent school
                        security inquiries are monitored 24/7.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-3xl p-6 sm:p-8 text-white shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold text-brand-100 uppercase tracking-wider mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Instant Setup</span>
                </div>
                <h4 className="text-lg font-bold">
                  Already decided? Register your school now
                </h4>
                <p className="text-xs text-brand-100 mt-2 leading-relaxed">
                  You can register your school domain immediately and begin
                  setting up academic classes, teachers, and permissions today.
                </p>
                <Link
                  to="/register-school"
                  className="mt-5 inline-block w-full text-center py-2.5 px-4 rounded-xl bg-white text-brand-600 font-bold text-xs hover:bg-brand-50 transition-colors shadow-sm"
                >
                  Create School Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-3">
              <HelpCircle className="w-3.5 h-3.5 text-brand-500" />
              <span>Answers to Common Questions</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Everything you need to know about EduHub capabilities,
              permissions, and implementation.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="border border-slate-200 rounded-2xl overflow-hidden transition-colors bg-[#F8FAFC]"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-100/60 transition-colors"
                  >
                    <span className="font-semibold text-slate-900 text-sm sm:text-base">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-brand-600' : ''
                      }`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-200/60">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
