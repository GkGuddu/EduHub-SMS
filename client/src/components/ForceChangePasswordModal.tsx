import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/client';
import { KeyRound, ShieldAlert, CheckCircle2, Loader2, LogOut, Lock } from 'lucide-react';

export const ForceChangePasswordScreen: React.FC = () => {
  const { user, logout, setMustChangePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword) {
      setError('Please enter your current temporary password.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match. Please re-enter.');
      return;
    }

    if (newPassword === currentPassword) {
      setError('Your new password must be different from your temporary password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authApi.changePassword({
        currentPassword,
        newPassword,
      });

      if (res.success) {
        setIsSuccess(true);
        setTimeout(() => {
          setMustChangePassword(false);
        }, 1200);
      } else {
        setError(res.message || 'Failed to update password.');
      }
    } catch (err: any) {
      setError(err?.message || 'Server error while updating password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 fixed inset-0">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <KeyRound className="w-7 h-7 text-brand-600" />
          </div>
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 mb-2">
            Action Required • First Login
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Set Permanent Password
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Welcome, <strong>{user?.name}</strong>! Your account was initialized with a temporary password.
            Please choose a secure permanent password to activate your dashboard access.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
            <h3 className="font-bold text-slate-800 text-base">Password Updated Successfully!</h3>
            <p className="text-xs text-slate-500">Redirecting to your dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Current Temporary Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Enter temporary password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-xs"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                New Password (minimum 6 characters)
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Create new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-xs"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-xs"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  'Save & Continue to Dashboard'
                )}
              </button>

              <button
                type="button"
                onClick={() => logout()}
                className="w-full py-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-50 font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out instead
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
