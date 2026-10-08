import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import {
  School,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Clock,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { authApi } from '../api/client';

export const VerifyResetOtpPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const emailFromState = (location.state as { email?: string })?.email;
  const email = (emailFromState || searchParams.get('email') || '').trim().toLowerCase();

  const [otp, setOtp] = useState<string[]>(['', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const [cooldown, setCooldown] = useState<number>(60);
  const [expirySeconds, setExpirySeconds] = useState<number>(300);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    if (expirySeconds <= 0) return;
    const timer = setInterval(() => {
      setExpirySeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [expirySeconds]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const nextOtp = [...otp];
    nextOtp[index] = digit;
    setOtp(nextOtp);
    setError(null);

    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 4);

    if (pastedData.length > 0) {
      const nextOtp = [...otp];
      for (let i = 0; i < pastedData.length; i++) {
        nextOtp[i] = pastedData[i];
      }
      setOtp(nextOtp);
      setError(null);
      const nextIndex = Math.min(pastedData.length, 3);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    if (!email) {
      setError('Email address is missing. Please restart from Forgot Password.');
      return;
    }

    setIsResending(true);
    setError(null);
    setInfoMessage(null);
    try {
      await authApi.resendResetOtp({ email });
      setCooldown(60);
      setExpirySeconds(300);
      setOtp(['', '', '', '']);
      inputRefs.current[0]?.focus();
      setInfoMessage('A fresh 4-digit verification code has been dispatched to your email.');
    } catch (err: any) {
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length !== 4) {
      setError('Please enter all 4 digits of the verification code.');
      return;
    }

    if (!email) {
      setError('Email address is missing. Please restart from Forgot Password.');
      return;
    }

    if (expirySeconds <= 0) {
      setError('Verification code has expired. Please request a new code.');
      return;
    }

    setError(null);
    setIsVerifying(true);
    try {
      const res = await authApi.verifyResetOtp({ email, otp: fullOtp });
      if (res.resetToken) {
        sessionStorage.setItem('eduhub_reset_token', res.resetToken);
        sessionStorage.setItem('eduhub_reset_email', email);

        navigate('/reset-password', {
          state: {
            resetToken: res.resetToken,
            email,
          },
        });
      } else {
        setError('Verification succeeded, but no authorization token was issued.');
      }
    } catch (err: any) {
      setError(err.message || 'Incorrect verification code. Please check your email.');
    } finally {
      setIsVerifying(false);
    }
  };

  const isComplete = otp.every((digit) => digit.length === 1);

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-6 bg-[#F8FAFC]">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl space-y-6">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-200 text-brand-500 flex items-center justify-center mx-auto mb-3 shadow-sm">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-[11px] font-medium text-slate-500 mb-2">
            <School className="w-3.5 h-3.5 text-brand-500" />
            <span>Adiya School • EduHub</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Enter 4-Digit OTP
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            We sent a 4-digit password reset code to:
          </p>
          <div className="mt-1 flex items-center justify-center gap-2">
            <span className="font-semibold text-xs text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
              {email || 'your email'}
            </span>
            <Link
              to="/forgot-password"
              className="text-[11px] text-brand-600 hover:text-brand-700 font-semibold hover:underline"
            >
              Change
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {infoMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{infoMessage}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-5">
          {/* 4 separate OTP boxes */}
          <div className="flex justify-center items-center gap-3 py-2">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                className={`w-14 h-16 text-center text-2xl font-bold font-mono rounded-2xl border transition-all focus:outline-none focus:ring-4 ${
                  digit
                    ? 'border-brand-500 bg-orange-50/30 text-brand-900 focus:ring-brand-500/20 shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-800 focus:border-brand-500 focus:ring-brand-500/20'
                }`}
              />
            ))}
          </div>

          {/* Expiration countdown display */}
          <div className="flex items-center justify-center gap-2 text-xs">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {expirySeconds > 0 ? (
              <span className="text-slate-500 font-medium">
                Code expires in{' '}
                <span className="font-semibold text-brand-600 font-mono">
                  {formatTime(expirySeconds)}
                </span>
              </span>
            ) : (
              <span className="text-rose-600 font-semibold">
                Code expired. Please request a new code.
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isVerifying || !isComplete || expirySeconds <= 0}
            className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Code...</span>
              </>
            ) : (
              <>
                <span>Verify & Proceed to Reset</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Resend button with 60s cooldown */}
          <div className="pt-2 text-center">
            <button
              type="button"
              disabled={cooldown > 0 || isResending}
              onClick={handleResend}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:text-slate-400 inline-flex items-center gap-1 transition-colors"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
              {cooldown > 0
                ? `Resend OTP in ${cooldown}s`
                : isResending
                ? 'Resending...'
                : 'Resend 4-Digit OTP'}
            </button>
          </div>

          <div className="pt-2 text-center border-t border-slate-100">
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
