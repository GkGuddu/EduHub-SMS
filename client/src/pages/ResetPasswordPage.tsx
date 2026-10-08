import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  School,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Check,
} from 'lucide-react';
import { authApi } from '../api/client';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const stateToken = (location.state as { resetToken?: string; email?: string })?.resetToken;
  const stateEmail = (location.state as { resetToken?: string; email?: string })?.email;

  const resetToken = stateToken || sessionStorage.getItem('eduhub_reset_token') || '';
  const email = stateEmail || sessionStorage.getItem('eduhub_reset_email') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState<number>(5);

  useEffect(() => {
    if (!isSuccess) return;
    if (countdown <= 0) {
      sessionStorage.removeItem('eduhub_reset_token');
      sessionStorage.removeItem('eduhub_reset_email');
      navigate('/login');
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isSuccess, countdown, navigate]);

  const hasMinLength = newPassword.length >= 6;
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken) {
      setError('Reset authorization session is missing. Please restart from Forgot Password.');
      return;
    }

    if (!hasMinLength) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please ensure both fields are identical.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await authApi.resetPassword({
        resetToken,
        newPassword,
      });

      sessionStorage.removeItem('eduhub_reset_token');
      sessionStorage.removeItem('eduhub_reset_email');

      setIsSuccess(true);
    } catch (err: any) {
      setError(
        err.message ||
          'Failed to update password. Your reset session may have expired. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!resetToken && !isSuccess) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center p-6 bg-[#F8FAFC]">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl space-y-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            Authorization Required
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            To set a new password, you must first verify your identity with a 4-digit email code.
          </p>
          <div className="pt-2 space-y-2">
            <Link
              to="/forgot-password"
              className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all"
            >
              Start Forgot Password Flow <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 inline-block pt-2"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-6 bg-[#F8FAFC]">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl space-y-6">
        {!isSuccess ? (
          <>
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-200 text-brand-500 flex items-center justify-center mx-auto mb-3 shadow-sm">
                <Lock className="w-7 h-7" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-[11px] font-medium text-slate-500 mb-2">
                <School className="w-3.5 h-3.5 text-brand-500" />
                <span>Adiya School • EduHub</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                Set New Password
              </h2>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                {email ? (
                  <>
                    Updating password for{' '}
                    <strong className="text-slate-700">{email}</strong>.
                  </>
                ) : (
                  'Choose a secure new password for your account.'
                )}
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter at least 6 characters"
                    className="w-full px-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password strength and matching guidelines */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100">
                <div className="flex items-center gap-2 text-xs">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      hasMinLength
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <span
                    className={
                      hasMinLength
                        ? 'text-emerald-700 font-medium'
                        : 'text-slate-500'
                    }
                  >
                    At least 6 characters long
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      passwordsMatch
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <span
                    className={
                      passwordsMatch
                        ? 'text-emerald-700 font-medium'
                        : 'text-slate-500'
                    }
                  >
                    Passwords match
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !hasMinLength || !passwordsMatch}
                className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <span>Save New Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center border-t border-slate-100">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Cancel & Return to Sign In
                </Link>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center space-y-5 py-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                Password Updated!
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                Your EduHub account password has been safely updated. You can now log into your account using your new credentials.
              </p>
            </div>

            <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-xl text-xs text-emerald-800 font-medium">
              Redirecting to sign in page in {countdown} second{countdown === 1 ? '' : 's'}...
            </div>

            <button
              onClick={() => {
                sessionStorage.removeItem('eduhub_reset_token');
                sessionStorage.removeItem('eduhub_reset_email');
                navigate('/login');
              }}
              className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all"
            >
              Sign In With New Password <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
