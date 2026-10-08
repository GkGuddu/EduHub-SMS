import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Calendar,
  Clock,
  ArrowRight,
  Search,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Award,
  ArrowLeft,
  CheckCircle2,
  Bookmark,
  School,
} from 'lucide-react';
export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  readTime: string;
  author: {
    name: string;
    role: string;
  };
  content: {
    intro: string;
    sections: {
      heading: string;
      paragraphs: string[];
      bulletPoints?: string[];
    }[];
    conclusion: string;
  };
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'modern-attendance-tracking',
    title:
      'Modernizing School Attendance: Why Red, Yellow, and Green States Cut Chronic Absenteeism',
    excerpt:
      'Binary present-or-absent registers hide critical patterns. Discover how granular attendance states, real-time parent notifications, and monthly analytics empower schools to intervene earlier.',
    category: 'Attendance & Discipline',
    publishedAt: 'October 12, 2026',
    readTime: '5 min read',
    author: {
      name: 'Dr. Evelyn Ward',
      role: 'Head of Academic Governance, EduHub Advisory',
    },
    content: {
      intro:
        'For decades, school attendance has been recorded as a simple binary: present or absent. But real-world classroom life is rarely binary. A student who arrives twenty minutes late to first period faces completely different academic and pastoral needs than a student who was absent the entire day. By transitioning to a tri-state classification system—Green for Present, Yellow for Late, and Red for Absent—schools unlock unprecedented clarity into pupil engagement.',
      sections: [
        {
          heading: 'The Visual Power of Tri-State Calendars',
          paragraphs: [
            'When parents and educators glance at an attendance calendar, cognitive load matters. A student who has fifteen yellow dots over a three-month period might still technically boast a 96% attendance rate on a legacy report card, yet they are missing foundational instruction during the first period of every school day.',
            'In EduHub, the intuitive visual coding system renders real-time status indicators across student, teacher, and parent views. Parents see the exact timestamp their child arrived at school, eliminating the mystery of unexcused morning tardiness.',
          ],
          bulletPoints: [
            'Green (Present): On time, present in class for full instructional duration.',
            'Yellow (Late): Arrived after morning bell; triggers timestamped notation and automated SMS notification to guardians.',
            'Red (Absent): Fully absent; requires administrative clearance or verified parent leave application.',
          ],
        },
        {
          heading: 'Automated Parent Alerts and Reduced Administrative Burden',
          paragraphs: [
            'In traditional school settings, attendance office staff spend between 90 and 120 minutes each morning calling parents of absent students. With modern web-first management systems, class teachers submit morning roll calls with two clicks on their tablets.',
            'The system immediately batches absent and late records, dispatching instant notifications to verified parents. This immediate feedback loop not only reassures guardians regarding student safety during transit, but also cuts truancy by over 40% in the first semester of deployment.',
          ],
        },
        {
          heading: 'Data-Driven Pastoral Interventions',
          paragraphs: [
            'EduHub reports module surfaces longitudinal attendance curves segmented by class, section, and individual student. When a learner drops below the statutory 85% threshold, academic coordinators receive an automated alert with recommended intervention workflows.',
            'By catching attendance decline in week three rather than week twelve when report cards are published, educators keep vulnerable students on track for examination success.',
          ],
        },
      ],
      conclusion:
        'Transforming attendance from a passive record-keeping chore into an active student engagement tool is one of the highest-leverage improvements an institution can make. Tri-state visual clarity, instant mobile alerts, and audit-ready reporting provide the structural foundation for student success.',
    },
  },
  {
    slug: 'granular-teacher-permissions',
    title:
      'Granular Teacher Permissions: Safeguarding Examination Records and School Finances',
    excerpt:
      'Why role-based access control must go beyond static titles. Explore how administrator-controlled permission toggles preserve academic integrity and financial segregation of duties.',
    category: 'Security & Administration',
    publishedAt: 'October 8, 2026',
    readTime: '6 min read',
    author: {
      name: 'Marcus Vance',
      role: 'Principal Systems Architect, EduHub Core',
    },
    content: {
      intro:
        'In many legacy school management systems, assigning a user the "Teacher" role grants them either blanket access to every administrative module or locks them out of basic classroom utilities. Both extremes jeopardize institutional integrity. A modern school requires fine-grained, administrator-controlled permissions where each teacher’s access privileges mirror their specific contractual duties.',
      sections: [
        {
          heading: 'The Hazard of Monolithic Teacher Accounts',
          paragraphs: [
            'Consider a typical mid-sized school with fifty teachers. Some are senior coordinators tasked with curriculum scheduling and fee follow-ups; others are temporary subject teachers who should only record homework and lesson plans. If every teacher can view student fee defaulter lists or tamper with published exam marks, the school faces compliance risks and accidental data corruption.',
            'The principle of least privilege dictates that users should only access the data and functional operations necessary for their specific role. EduHub solves this through granular, switchable permission sets configured directly by the school principal or administrator.',
          ],
        },
        {
          heading: 'Modular Action Matrices: Beyond Simple View Rights',
          paragraphs: [
            'Effective permission management distinguishes between viewing a module, creating entries, modifying records, and publishing irreversible outcomes. In EduHub, an administrator can toggle access across every core domain:',
          ],
          bulletPoints: [
            'Attendance: Permit morning roll-call submissions while restricting past-date record modifications to headmasters.',
            'Exams & Marks: Allow marks entry for assigned subjects while keeping DMC publishing rights strictly with the Examination Controller.',
            'Fees & Financials: Segregate fee collection so only authorized accounting teachers can log receipt transactions.',
            'Notices & Communication: Enable classroom broadcast drafts while requiring administrative approval for school-wide emergency broadcasts.',
          ],
        },
        {
          heading: 'Multi-Tenant Data Isolation and Server-Side Guardrails',
          paragraphs: [
            'Client-side button hiding is never sufficient for enterprise school security. Every REST API endpoint and WebSocket channel in EduHub validates permissions against the school tenant ID and teacher identity on every request.',
            'Even if an unauthorized user attempts to craft a direct HTTP request to update an exam sheet or delete a fee receipt, server-side middleware rejects the request with a strict 403 Forbidden and records an entry in the tamper-evident audit log.',
          ],
        },
      ],
      conclusion:
        'Institutional trust is built on digital security. When teachers operate within transparent, administrator-tailored permission boundaries, faculty collaboration thrives without exposing sensitive institutional assets.',
    },
  },
  {
    slug: 'detailed-marks-certificates-dmc',
    title:
      'Designing Transparent Report Cards: Detailed Marks Certificates in Modern Curriculums',
    excerpt:
      'From simple percentages to comprehensive competency breakdowns. How verifiable digital DMC generation builds parent trust and eliminates grade tampering.',
    category: 'Academics & Grading',
    publishedAt: 'September 28, 2026',
    readTime: '4 min read',
    author: {
      name: 'Priya Sharma',
      role: 'Director of Curriculum Design, Adiya Demonstration School',
    },
    content: {
      intro:
        'The era of handwritten, easily altered report cards has come to an end. Today’s parents and university admissions boards demand comprehensive Detailed Marks Certificates (DMC) that showcase subject-wise breakdowns, practical competencies, percentile benchmarks, and automated grade calculations.',
      sections: [
        {
          heading: 'The Elements of an Audit-Ready DMC',
          paragraphs: [
            'A true Detailed Marks Certificate is far more than a single composite score. It provides a multi-dimensional portrait of a student’s academic term, including continuous assessments, mid-term examinations, laboratory work, and final evaluations.',
            'EduHub’s DMC engine automatically aggregates teacher grade inputs according to weighted curriculum rubrics, generating cryptographic verification codes and printable layout formats tailored for official board submissions.',
          ],
          bulletPoints: [
            'Weighted Assessment Components: Custom weighting for homework, quizzes, laboratory practicals, and written theory exams.',
            'Auto-Grade Computations: Strict letter-grade and GPA calculation based on administrator-configured boundaries.',
            'Published-Only Visibility: Draft marks remain strictly invisible to students and parents until the administrative review board clicks "Publish".',
            'Tamper-Proof Formatting: Clean CSS print stylesheets optimized for standard A4 archival paper with official institution headers.',
          ],
        },
        {
          heading: 'Preventing Unintentional Leaks of Draft Grades',
          paragraphs: [
            'One of the most common complaints in educational software is students witnessing grades fluctuate in real time while teachers are still grading mid-term papers. This creates unnecessary anxiety and premature inquiries.',
            'EduHub enforces a hard invariant: assessment scores are partitioned into Draft, Moderated, and Published states. Only published grades flow into student dashboards, parent mobile views, and generated report cards.',
          ],
        },
      ],
      conclusion:
        'When academic reporting is accurate, visually clear, and securely published, students receive constructive feedback they can trust, and schools enhance their reputation for administrative excellence.',
    },
  },
  {
    slug: 'digital-school-fee-management',
    title:
      'Digitizing School Fees & Concessions: Eliminating Audit Discrepancies and Defaulters',
    excerpt:
      'Paper receipts and disconnected spreadsheets cause revenue leakage. Learn how unified fee schedules, partial installment tracking, and automated receipts streamline school finances.',
    category: 'Financial Management',
    publishedAt: 'September 15, 2026',
    readTime: '5 min read',
    author: {
      name: 'Sarah Jenkins',
      role: 'Chief Financial Consultant, EduHub Systems',
    },
    content: {
      intro:
        'Managing tuition fees, transportation charges, laboratory dues, and scholarship concessions across hundreds or thousands of students is a monumental accounting challenge. Without a unified digital ledger, schools suffer from duplicate receipt entries, uncollected arrears, and protracted end-of-year audits.',
      sections: [
        {
          heading: 'The Perils of Spreadsheets in Bursar Offices',
          paragraphs: [
            'Spreadsheets lack transactional locking, historical audit trails, and role-based segregation. A single mistaken formula or untracked manual override can throw an entire semester’s balance sheet out of balance.',
            'EduHub replaces fragmented ledgers with an integrated fee management module. Every invoice is tied to the student profile, class fee structure, and approved concessions. Payment collection updates outstanding balances in real time.',
          ],
        },
        {
          heading: 'Transparent Invoicing and Instant Receipts',
          paragraphs: [
            'When parents pay tuition fees—whether at the school counter or through integrated digital gateways—they immediately receive a numbered, printable receipt. Parents can view their historical payment log at any time from their verified parent portal.',
          ],
          bulletPoints: [
            'Structured Installments: Configure term-wise, quarterly, or monthly payment schedules with grace period settings.',
            'Sibling & Merit Concessions: Transparently log and audit fee discounts with administrator sign-off.',
            'Defaulter Safeguards: Filter students with outstanding dues by class, section, or amount range for respectful automated reminders.',
            'Zero Double Counting: Strict transactional integrity guarantees receipts cannot be collected or recorded twice.',
          ],
        },
        {
          heading: 'Financial Reporting for Strategic Decision Making',
          paragraphs: [
            'School trustees and management boards need immediate visibility into cash flow, outstanding receivables, and expense allocations. EduHub’s finance dashboard renders visual breakdowns of monthly collections versus operating expenses, empowering leadership to make informed budget decisions.',
          ],
        },
      ],
      conclusion:
        'A healthy school balance sheet ensures steady investments in modern classrooms, faculty development, and student programs. Digital fee automation eliminates friction for parents and provides administrative peace of mind.',
    },
  },
];

export const BlogPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = [
    'All',
    'Attendance & Discipline',
    'Security & Administration',
    'Academics & Grading',
    'Financial Management',
  ];

  const filteredPosts = BLOG_POSTS.filter((post) => {
    const matchesCategory =
      selectedCategory === 'All' || post.category === selectedCategory;
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredPost = BLOG_POSTS[0];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800">
      <section className="relative pt-32 pb-16 overflow-hidden bg-gradient-to-b from-brand-500/5 via-transparent to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 uppercase tracking-widest mb-3">
            <Link to="/" className="hover:underline text-slate-500">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span>EduHub Perspectives</span>
          </div>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-medium mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Insights & Best Practices</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              School Leadership, Technology & Modern Governance
            </h1>
            <p className="mt-4 text-lg text-slate-600 leading-relaxed">
              In-depth articles, case studies from our demonstration school{' '}
              <strong className="text-slate-800 font-semibold">
                Adiya School of Excellence
              </strong>
              , and strategic insights on attendance optimization, granular
              RBAC, and transparent grading.
            </p>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-2 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles on attendance, fees, permissions, DMC..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-800 placeholder-slate-400"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 px-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {selectedCategory === 'All' && !searchQuery && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-12"
            >
              <div className="group relative bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-brand-500/10 via-brand-500/5 to-transparent rounded-bl-full pointer-events-none" />
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative z-10">
                  <div className="max-w-2xl">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-500 text-white">
                        Featured Article
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        {featuredPost.category}
                      </span>
                    </div>
                    <Link to={`/blog/${featuredPost.slug}`}>
                      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 group-hover:text-brand-600 transition-colors leading-snug">
                        {featuredPost.title}
                      </h2>
                    </Link>
                    <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed line-clamp-3">
                      {featuredPost.excerpt}
                    </p>
                    <div className="mt-6 flex items-center gap-4 text-xs text-slate-500">
                      <span className="font-medium text-slate-700">
                        {featuredPost.author.name}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {featuredPost.publishedAt}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {featuredPost.readTime}
                      </span>
                    </div>
                  </div>
                  <Link
                    to={`/blog/${featuredPost.slug}`}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors shadow-sm shrink-0"
                  >
                    <span>Read Full Guide</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          {filteredPosts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800">
                No articles match your query
              </h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                Try searching for different keywords such as
                &apos;attendance&apos;, &apos;permissions&apos;, or
                &apos;fees&apos;.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchQuery('');
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post, idx) => (
                <motion.article
                  key={post.slug}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="flex flex-col bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md hover:border-brand-200 transition-all group"
                >
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">
                      {post.category}
                    </span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </span>
                  </div>

                  <Link to={`/blog/${post.slug}`} className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-2 mb-2 leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </Link>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        {post.author.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {post.publishedAt}
                      </p>
                    </div>
                    <Link
                      to={`/blog/${post.slug}`}
                      className="p-2 rounded-lg bg-slate-50 text-slate-600 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors"
                      aria-label={`Read ${post.title}`}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.article>
              ))}
            </div>
          )}

          <div className="mt-16 bg-slate-900 rounded-3xl p-8 sm:p-10 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="max-w-2xl relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold mb-4 border border-brand-500/30">
                <Award className="w-3.5 h-3.5" />
                <span>Adiya School of Excellence Reference Case</span>
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-white">
                Tested & Proven in Real Classroom Environments
              </h3>
              <p className="mt-2 text-slate-300 text-sm leading-relaxed">
                All workflows detailed in these articles are active in our
                demonstration instance at{' '}
                <strong className="text-white">
                  Adiya School of Excellence
                </strong>
                , managing 1,240+ students, 78 faculty members, and daily parent
                communications.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Link
                  to="/solutions"
                  className="px-5 py-2.5 rounded-xl bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 transition-colors"
                >
                  Explore Role Solutions
                </Link>
                <Link
                  to="/contact"
                  className="px-5 py-2.5 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition-colors"
                >
                  Schedule a Walkthrough
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (!post) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pt-32 pb-24 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <Bookmark className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Article Not Found
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            The article you are looking for does not exist or may have been
            moved.
          </p>
          <Link
            to="/blog"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Perspectives</span>
          </Link>
        </div>
      </div>
    );
  }

  const relatedPosts = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(
    0,
    2
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800">
      <section className="pt-32 pb-12 bg-gradient-to-b from-brand-500/5 via-transparent to-transparent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-6 flex-wrap">
            <Link to="/" className="hover:text-brand-600">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link to="/blog" className="hover:text-brand-600">
              EduHub Perspectives
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-brand-600 truncate max-w-[200px] sm:max-w-xs">
              {post.title}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 border border-brand-200 text-brand-700">
              {post.category}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {post.readTime}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {post.title}
          </h1>

          <div className="mt-6 pt-6 border-t border-slate-200/80 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-100 border border-brand-200 flex items-center justify-center font-bold text-brand-700 text-sm">
                {post.author.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {post.author.name}
                </p>
                <p className="text-xs text-slate-500">{post.author.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {post.publishedAt}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-12 shadow-sm"
          >
            <div className="p-6 rounded-2xl bg-brand-500/5 border-l-4 border-brand-500 mb-10 text-slate-700 text-base sm:text-lg leading-relaxed font-normal">
              {post.content.intro}
            </div>

            <div className="space-y-10">
              {post.content.sections.map((section, idx) => (
                <div key={idx} className="space-y-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {section.heading}
                  </h2>
                  {section.paragraphs.map((p, pIdx) => (
                    <p
                      key={pIdx}
                      className="text-slate-600 text-sm sm:text-base leading-relaxed"
                    >
                      {p}
                    </p>
                  ))}
                  {section.bulletPoints && section.bulletPoints.length > 0 && (
                    <ul className="mt-4 space-y-2.5 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                      {section.bulletPoints.map((item, bIdx) => (
                        <li
                          key={bIdx}
                          className="flex items-start gap-3 text-sm text-slate-700"
                        >
                          <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-12 pt-8 border-t border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Executive Takeaway
              </h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                {post.content.conclusion}
              </p>
            </div>

            <div className="mt-8 p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3 text-xs text-slate-600">
              <School className="w-4 h-4 text-brand-600 shrink-0" />
              <span>
                Demonstrated in live operations at{' '}
                <strong>Adiya School of Excellence</strong>. Experience this
                system in action with an active sandbox session.
              </span>
            </div>
          </motion.div>

          <div className="mt-8 flex items-center justify-between">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-brand-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to all articles</span>
            </Link>
          </div>

          {relatedPosts.length > 0 && (
            <div className="mt-16">
              <h3 className="text-xl font-bold text-slate-900 mb-6">
                Recommended Readings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {relatedPosts.map((rel) => (
                  <Link
                    key={rel.slug}
                    to={`/blog/${rel.slug}`}
                    className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-brand-200 hover:shadow-md transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[11px] font-semibold text-brand-600 uppercase tracking-wider">
                        {rel.category}
                      </span>
                      <h4 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors mt-1 mb-2">
                        {rel.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {rel.excerpt}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                      <span>{rel.readTime}</span>
                      <span className="text-brand-500 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                        Read <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-16 bg-brand-500 text-white rounded-3xl p-8 sm:p-10 text-center relative overflow-hidden">
            <div className="max-w-xl mx-auto relative z-10">
              <h3 className="text-2xl font-bold">
                Bring EduHub to Your Institution
              </h3>
              <p className="mt-2 text-brand-100 text-sm">
                Get started today or request a tailored demonstration for your
                leadership board.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/register-school"
                  className="px-5 py-2.5 rounded-xl bg-white text-brand-600 text-xs font-bold hover:bg-brand-50 transition-colors shadow-sm"
                >
                  Register School
                </Link>
                <Link
                  to="/contact"
                  className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-colors"
                >
                  Contact Our Advisory Team
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BlogPage;
