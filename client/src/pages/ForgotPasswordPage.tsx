import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  School,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Mail,
  ShieldCheck,
  Users,
  GraduationCap,
  UserCheck,
} from 'lucide-react';
import { authApi } from '../api/client';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const demoAccounts = [
    { role: 'Admin', email: 'admin@adiya.edu', icon: ShieldCheck },
    { role: 'Teacher', email: 'rajesh.sharma@adiya.edu', icon: Users },
    { role: 'Student', email: 'aarav.sharma@adiya.edu', icon: GraduationCap },
    { role: 'Parent', email: 'sunita.sharma@adiya.edu', icon: UserCheck },
  ];

  const validate = (): boolean => {
    setEmailError(null);
    setGeneralError(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError('Please enter your registered email address.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError('Please enter a valid email address.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setGeneralError(null);
    try {
      const trimmedEmail = email.trim().toLowerCase();
      await authApi.forgotPassword({ email: trimmedEmail });
      navigate(`/verify-reset-otp?email=${encodeURIComponent(trimmedEmail)}`, {
        state: { email: trimmedEmail },
      });
    } catch (err: any) {
      setGeneralError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-6 bg-[#F8FAFC]">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl space-y-6">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-200 text-brand-500 flex items-center justify-center mx-auto mb-3 shadow-sm">
            <KeyRound className="w-7 h-7" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-[11px] font-medium text-slate-500 mb-2">
            <School className="w-3.5 h-3.5 text-brand-500" />
            <span>Adiya School • EduHub</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Forgot Password?
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Enter your registered school email address. We will send a secure 4-digit OTP to verify your identity.
          </p>
        </div>

        {generalError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{generalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Registered Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(null);
                  setGeneralError(null);
                }}
                placeholder="name@adiya.edu"
                className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                  emailError
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200 bg-rose-50/20'
                    : 'border-slate-200 focus:border-brand-500 focus:ring-brand-500/20'
                }`}
              />
            </div>
            {emailError && (
              <p className="text-[11px] text-rose-600 font-medium mt-1">
                {emailError}
              </p>
            )}
          </div>

          {/* Quick fill demo role buttons */}
          <div className="pt-1">
            <span className="text-[11px] font-medium text-slate-400 block mb-1.5">
              Or quick select a demo account:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {demoAccounts.map((account) => {
                const Icon = account.icon;
                return (
                  <button
                    key={account.role}
                    type="button"
                    onClick={() => {
                      setEmail(account.email);
                      setEmailError(null);
                      setGeneralError(null);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium border flex items-center gap-1.5 text-left transition-all ${
                      email === account.email
                        ? 'border-brand-400 bg-orange-50/70 text-brand-700'
                        : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0 text-brand-500" />
                    <span className="truncate">{account.role}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 mt-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending 4-Digit OTP...</span>
              </>
            ) : (
              <>
                <span>Send 4-Digit OTP</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="pt-3 text-center border-t border-slate-100">
            <Link
              to="/login"
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
