import React, {
  Component,
  ErrorInfo,
  ReactNode,
  useEffect,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Loader2,
  AlertCircle,
  RotateCcw,
  LucideIcon,
  Inbox,
  X,
  AlertOctagon,
  Home,
  Sparkles,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  ShieldAlert,
  CheckCircle,
  BookOpen,
  Compass,
} from 'lucide-react';
import { modulesApi } from '../api/client';

interface BadgeProps {
  status: string;
  variant?: 'attendance' | 'fee' | 'role' | 'exam' | 'default';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  variant = 'default',
  className = '',
}) => {
  const norm = status.toLowerCase();

  if (
    variant === 'attendance' ||
    norm === 'present' ||
    norm === 'late' ||
    norm === 'absent'
  ) {
    if (norm === 'present') {
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Present
        </span>
      );
    }
    if (norm === 'late') {
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Late
        </span>
      );
    }
    if (norm === 'absent') {
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          Absent
        </span>
      );
    }
  }

  if (
    variant === 'fee' ||
    [
      'paid',
      'partial',
      'partially paid',
      'unpaid',
      'pending',
      'overdue',
    ].includes(norm)
  ) {
    if (norm === 'paid') {
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Paid
        </span>
      );
    }
    if (norm === 'partial' || norm === 'partially paid') {
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Partially Paid
        </span>
      );
    }
    if (norm === 'unpaid' || norm === 'pending') {
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          Pending
        </span>
      );
    }
    if (norm === 'overdue') {
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          Overdue
        </span>
      );
    }
  }

  if (
    variant === 'exam' ||
    ['draft', 'submitted', 'published'].includes(norm)
  ) {
    if (norm === 'published') {
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}
        >
          Published
        </span>
      );
    }
    if (norm === 'submitted') {
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 ${className}`}
        >
          Submitted
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 ${className}`}
      >
        Draft
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 capitalize ${className}`}
    >
      {status}
    </span>
  );
};

export type MetricVariant = 'cyan' | 'peach' | 'green' | 'blue' | 'purple';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: MetricVariant;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'peach',
  trend,
}) => {
  const styles: Record<
    MetricVariant,
    { bg: string; iconBg: string; text: string; border: string }
  > = {
    cyan: {
      bg: 'bg-cyan-50/60',
      iconBg: 'bg-cyan-500 text-white',
      text: 'text-cyan-800',
      border: 'border-cyan-200/80',
    },
    peach: {
      bg: 'bg-orange-50/60',
      iconBg: 'bg-brand-500 text-white',
      text: 'text-orange-950',
      border: 'border-orange-200/80',
    },
    green: {
      bg: 'bg-emerald-50/60',
      iconBg: 'bg-emerald-500 text-white',
      text: 'text-emerald-900',
      border: 'border-emerald-200/80',
    },
    blue: {
      bg: 'bg-blue-50/60',
      iconBg: 'bg-blue-500 text-white',
      text: 'text-blue-900',
      border: 'border-blue-200/80',
    },
    purple: {
      bg: 'bg-purple-50/60',
      iconBg: 'bg-purple-500 text-white',
      text: 'text-purple-900',
      border: 'border-purple-200/80',
    },
  };

  const theme = styles[variant];

  return (
    <div
      className={`rounded-2xl p-5 border ${theme.border} ${theme.bg} bg-white transition-all duration-200 shadow-sm hover:shadow-md flex items-start justify-between gap-4`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 truncate">
          {title}
        </p>
        <h3
          className={`text-2xl font-bold tracking-tight ${theme.text} mb-1 truncate`}
        >
          {value}
        </h3>
        {subtitle && (
          <p className="text-xs text-slate-500 font-medium truncate">
            {subtitle}
          </p>
        )}
        {trend && (
          <div className="mt-2 flex items-center gap-1 text-xs">
            <span
              className={`font-semibold ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}
            >
              {trend.value}
            </span>
            <span className="text-slate-400">vs last month</span>
          </div>
        )}
      </div>

      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${theme.iconBg}`}
      >
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
};

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading data...',
  className = 'py-16',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 text-slate-400 ${className}`}
    >
      <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      <span className="text-xs font-semibold text-slate-500 tracking-wide">
        {message}
      </span>
    </div>
  );
};

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to load information',
  message = 'An unexpected server error occurred while retrieving this data.',
  onRetry,
  className = 'p-8',
}) => {
  return (
    <div
      className={`rounded-2xl bg-rose-50/80 border border-rose-200 text-center flex flex-col items-center justify-center ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="font-bold text-sm text-rose-900 tracking-tight">
        {title}
      </h3>
      <p className="text-xs text-rose-700 max-w-md mt-1 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Try Again
        </button>
      )}
    </div>
  );
};

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'There are no items matching your criteria right now.',
  icon: Icon = Inbox,
  actionLabel,
  onAction,
  className = 'py-16',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center px-4 bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-200 text-brand-500 flex items-center justify-center mb-3">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="font-bold text-sm text-slate-800 tracking-tight">
        {title}
      </h3>
      <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-sm transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-xl',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative w-full ${maxWidth} bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all z-10`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800 tracking-tight">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>
  );
};

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = 'max-w-lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          className={`w-screen ${width} bg-white shadow-2xl border-l border-slate-200 flex flex-col`}
        >
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-base font-bold text-slate-800 tracking-tight">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">{children}</div>
        </div>
      </div>
    </div>
  );
};

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  public state: ErrorBoundaryState = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-screen flex items-center justify-center p-6 bg-[#F8FAFC]">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertOctagon className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
              Something went wrong
            </h2>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              An unexpected application error occurred. You can retry the action
              or return to your dashboard.
            </p>
            {this.state.error && (
              <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-left overflow-auto max-h-32 text-[11px] font-mono text-rose-700">
                {this.state.error.message}
              </div>
            )}
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => this.setState({ hasError: false })}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 flex items-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all"
              >
                <Home className="w-4 h-4" />
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export interface AiHomeworkHintModalProps {
  isOpen: boolean;
  onClose: () => void;
  homework: any;
}

const HINT_LEVELS = [
  {
    level: 1,
    title: 'Small Clue',
    desc: 'A gentle nudge pointing in the right direction.',
  },
  {
    level: 2,
    title: 'Concept Explanation',
    desc: 'Core academic principle & formula breakdown.',
  },
  {
    level: 3,
    title: 'Suggested Next Step',
    desc: 'Step-by-step guidance on how to structure the solution.',
  },
  {
    level: 4,
    title: 'Self-Check Question',
    desc: 'Verify your intermediate work with a guiding check.',
  },
];

export const AiHomeworkHintModal: React.FC<AiHomeworkHintModalProps> = ({
  isOpen,
  onClose,
  homework,
}) => {
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [studentQuery, setStudentQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [hintResult, setHintResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!homework) return null;

  const handleFetchHint = async (levelToFetch: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await modulesApi.getHomeworkHint(
        homework._id || homework.homeworkId,
        {
          hintLevel: levelToFetch,
          studentQuery: studentQuery.trim() || undefined,
          problemContext: homework.description || homework.title,
        }
      );

      if (res.success) {
        setHintResult(res);
        setCurrentLevel(levelToFetch);
      } else {
        setError(res.message || 'Unable to generate hint at this time.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to request AI homework hint.');
    } finally {
      setLoading(false);
    }
  };

  const handleNextLevel = () => {
    if (currentLevel < 4) {
      handleFetchHint(currentLevel + 1);
    }
  };

  const handleReset = () => {
    setHintResult(null);
    setStudentQuery('');
    setError(null);
    setCurrentLevel(1);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Homework Hint Assistant"
      subtitle="Guiding you to learn and solve problems independently"
      maxWidth="max-w-2xl"
    >
      <div className="p-6 space-y-5 text-xs">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 border border-brand-200 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-slate-800 text-sm truncate">
              {homework.title}
            </h4>
            <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">
              {homework.description || 'Assigned academic practice problem.'}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 rounded-full font-semibold bg-white border border-slate-200 text-slate-600 text-[10px]">
                {homework.subjectName || 'Subject'}
              </span>
              <span className="text-slate-400 text-[11px]">
                Due: {homework.dueDate}
              </span>
            </div>
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2">
            Select Hint Depth (Level {currentLevel} of 4)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {HINT_LEVELS.map((hl) => {
              const isSelected = currentLevel === hl.level;
              return (
                <button
                  key={hl.level}
                  type="button"
                  onClick={() => {
                    setCurrentLevel(hl.level);
                    if (hintResult) {
                      handleFetchHint(hl.level);
                    }
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-brand-50 border-brand-500 text-brand-900 shadow-xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs">Level {hl.level}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isSelected ? 'bg-brand-500' : 'bg-slate-200'
                      }`}
                    />
                  </div>
                  <p className="font-semibold text-[11px] truncate">
                    {hl.title}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
            Where are you stuck? (Optional)
          </label>
          <input
            type="text"
            value={studentQuery}
            onChange={(e) => setStudentQuery(e.target.value)}
            placeholder="e.g. How do I factorize when the leading coefficient is not 1?"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-xs text-slate-800"
          />
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!hintResult && !loading && (
          <button
            type="button"
            onClick={() => handleFetchHint(currentLevel)}
            className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            Generate Hint Level {currentLevel}:{' '}
            {HINT_LEVELS[currentLevel - 1].title}
          </button>
        )}

        {loading && (
          <div className="py-8 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
            <span className="text-xs font-semibold">
              Crafting pedagogical hint...
            </span>
          </div>
        )}

        {hintResult && !loading && (
          <div className="space-y-4 pt-2">
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-semibold">{hintResult.disclaimer}</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-brand-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                  Level {hintResult.hintLevel}: {hintResult.hintLevelTitle}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {hintResult.hintsRemainingToday} hints remaining today (Max
                  5/day)
                </span>
              </div>

              <div className="text-slate-800 leading-relaxed font-medium text-xs whitespace-pre-line bg-slate-50/60 p-4 rounded-xl border border-slate-100">
                {hintResult.hintText}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Ask Another Question
                </button>

                {currentLevel < 4 ? (
                  <button
                    type="button"
                    onClick={handleNextLevel}
                    className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <span>Need More Help? Unlock Level {currentLevel + 1}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    All 4 Progressive Levels Explored
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const getHomeRoute = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'teacher':
        return '/teacher/dashboard';
      case 'student':
        return '/student/dashboard';
      case 'parent':
        return '/parent/dashboard';
      default:
        return '/login';
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-6 bg-[#F8FAFC]">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl text-center">
        <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-200 text-brand-500 flex items-center justify-center mx-auto mb-4 shadow-sm">
          <Compass className="w-8 h-8" />
        </div>
        <span className="text-4xl font-extrabold text-brand-500 tracking-tight block">
          404
        </span>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight mt-1">
          Page Not Found
        </h2>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          The requested path does not exist or has been relocated within the
          EduHub ERP system.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => navigate(getHomeRoute())}
            className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Home className="w-4 h-4" />
            Go to Your Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
