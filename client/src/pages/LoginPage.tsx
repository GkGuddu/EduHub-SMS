import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  School,
  ShieldCheck,
  GraduationCap,
  Users,
  UserCheck,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/client';
import { UserRole } from '@eduhub/shared';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [email, setEmail] = useState('admin@adiya.edu');
  const [password, setPassword] = useState('Admin@123');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const demoAccounts: Record<
    UserRole,
    {
      email: string;
      pass: string;
      label: string;
      desc: string;
      icon: React.ElementType;
    }
  > = {
    admin: {
      email: 'admin@adiya.edu',
      pass: 'Admin@123',
      label: 'Admin',
      desc: 'Principal & Administration Oversight',
      icon: ShieldCheck,
    },
    teacher: {
      email: 'rajesh.sharma@adiya.edu',
      pass: 'Teacher@123',
      label: 'Teacher',
      desc: 'Attendance, Homework & Exam Marks',
      icon: Users,
    },
    student: {
      email: 'aarav.sharma@adiya.edu',
      pass: 'Student@123',
      label: 'Student',
      desc: 'Personal Academics, Grades & Fees',
      icon: GraduationCap,
    },
    parent: {
      email: 'sunita.sharma@adiya.edu',
      pass: 'Parent@123',
      label: 'Parent',
      desc: 'Multi-Child Attendance & Fee Portal',
      icon: UserCheck,
    },
  };

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    setEmail(demoAccounts[role].email);
    setPassword(demoAccounts[role].pass);
    setEmailError(null);
    setPasswordError(null);
    setGeneralError(null);
  };

  const validateForm = (): boolean => {
    let isValid = true;
    setEmailError(null);
    setPasswordError(null);
    setGeneralError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError('Please enter your school email address.');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError('Please enter a valid email address.');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Please enter your password.');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const res: any = await login({ email: email.trim(), password });
      const targetRole = res?.user?.role || selectedRole;
      navigate(`/${targetRole}/dashboard`, { replace: true });
    } catch (err: any) {
      setGeneralError(
        err.message ||
          'Invalid email or password. Please verify your credentials.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen h-screen flex flex-col lg:flex-row bg-[#F8FAFC]">
      <div className="lg:w-1/2 bg-gradient-to-br from-brand-600 via-brand-500 to-orange-400 p-8 sm:p-12 lg:p-16 flex flex-col justify-between text-white relative overflow-hidden">
        <div className="absolute -right-24 -bottom-24 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -top-12 w-72 h-72 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-3 mb-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/25 text-xs font-semibold text-white transition-all group shadow-sm focus:outline-none focus:ring-2 focus:ring-white/50"
              title="Return to EduHub Home Page"
              aria-label="Return to Home Page"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to Home</span>
            </Link>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20">
              <School className="w-4 h-4 text-white" />
              <span className="text-xs font-bold tracking-wide uppercase">
                Adiya School Campus
              </span>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none mb-3">
            EduHub
          </h1>
          <p className="text-xl sm:text-2xl font-medium text-orange-100 mb-5">
            School Management System
          </p>
          <p className="text-sm sm:text-base text-white/95 max-w-md leading-relaxed font-normal">
            Manage your school with confidence. A unified ERP ecosystem for
            educators, parents, and students.
          </p>
        </div>
        <div className="relative z-10 my-8 sm:my-12">
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-200 mb-3">
            Active Campus Overview
          </p>
          <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-md">
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center shadow-sm">
              <span className="block text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                2,847
              </span>
              <span className="text-[11px] font-semibold text-orange-100 uppercase tracking-wider">
                Students
              </span>
            </div>
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center shadow-sm">
              <span className="block text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                184
              </span>
              <span className="text-[11px] font-semibold text-orange-100 uppercase tracking-wider">
                Teachers
              </span>
            </div>
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center shadow-sm">
              <span className="block text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                12
              </span>
              <span className="text-[11px] font-semibold text-orange-100 uppercase tracking-wider">
                Schools
              </span>
            </div>
          </div>
        </div>
        <div className="relative z-10 text-xs text-orange-200 border-t border-white/20 pt-6 flex items-center justify-between">
          <span>Demo Environment 2025–2026</span>
          <span className="font-semibold">School Code: ADIYA</span>
        </div>
      </div>
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-7 bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-medium text-slate-500">
              <School className="w-3.5 h-3.5 text-brand-500" />
              <span>EduHub SMS</span>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              Sign in to EduHub
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select your role and enter your school credentials below.
            </p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Select Your Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['admin', 'teacher', 'student', 'parent'] as UserRole[]).map(
                (role) => {
                  const isSelected = selectedRole === role;
                  const config = demoAccounts[role];
                  const Icon = config.icon;

                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleSelectRole(role)}
                      className={`px-3 py-2.5 rounded-xl text-left transition-all border flex items-center gap-2.5 ${
                        isSelected
                          ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-sm ring-1 ring-brand-500'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-brand-500 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold capitalize leading-tight">
                          {config.label}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {config.email.split('@')[0]}
                        </div>
                      </div>
                    </button>
                  );
                }
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-2 italic">
              {demoAccounts[selectedRole].desc}
            </p>
          </div>
          {generalError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{generalError}</span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                School Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none transition-all ${
                  emailError
                    ? 'border-rose-300 bg-rose-50/30 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500'
                    : 'border-slate-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500'
                }`}
                placeholder="name@adiya.edu"
              />
              {emailError && (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {emailError}
                </p>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-brand-600 hover:text-brand-700 font-semibold hover:underline transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none transition-all ${
                  passwordError
                    ? 'border-rose-300 bg-rose-50/30 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500'
                    : 'border-slate-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500'
                }`}
                placeholder="••••••••"
              />
              {passwordError && (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {passwordError}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In as {selectedRole.toUpperCase()}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
          <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-3">
            <p className="text-xs text-slate-500">
              New school?{' '}
              <Link
                to="/register-school"
                className="text-brand-600 hover:text-brand-700 font-bold underline transition-colors"
              >
                Register
              </Link>
            </p>
          </div>
          <p className="text-[11px] text-slate-400 text-center">
            Active campus: <strong>Adiya School</strong> • Session 2025–2026
          </p>
        </div>
      </div>
    </div>
  );
};

export { ForgotPasswordPage } from './ForgotPasswordPage';
export { VerifyResetOtpPage } from './VerifyResetOtpPage';
export { ResetPasswordPage } from './ResetPasswordPage';

export const VerifyOtpPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const email = searchParams.get('email') || '';
  const initialDemoOtp = searchParams.get('demoOtp') || '';

  const [demoOtp, setDemoOtp] = useState<string>(initialDemoOtp);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState<number>(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const nextOtp = [...otp];
    nextOtp[index] = digit;
    setOtp(nextOtp);
    setError(null);

    if (digit && index < 5) {
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
      .slice(0, 6);
    if (pastedData.length > 0) {
      const nextOtp = [...otp];
      for (let i = 0; i < pastedData.length; i++) {
        nextOtp[i] = pastedData[i];
      }
      setOtp(nextOtp);
      const nextIndex = Math.min(pastedData.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleQuickFillDemo = () => {
    if (demoOtp && demoOtp.length === 6) {
      setOtp(demoOtp.split(''));
      setError(null);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    setError(null);
    setInfoMessage(null);
    try {
      const res = await authApi.resendOtp({
        email,
        purpose: 'school_registration',
      });
      setCooldown(60);
      setInfoMessage('A new 6-digit confirmation code has been dispatched.');
      if (res.demoOtp) {
        setDemoOtp(res.demoOtp);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = otp.join('');
    if (fullCode.length !== 6) {
      setError('Please enter all 6 digits of the OTP.');
      return;
    }

    setError(null);
    setIsVerifying(true);
    try {
      const res = await authApi.verifyOtp({ email, otp: fullCode });
      if (res.success) {
        window.location.href = '/admin/dashboard';
      }
    } catch (err: any) {
      setError(err.message || 'Invalid or expired OTP code.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-6 bg-[#F8FAFC]">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-200 text-brand-500 flex items-center justify-center mx-auto shadow-sm">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Verify Your Account
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Enter the 6-digit confirmation OTP sent to{' '}
            <strong className="text-slate-700">{email || 'your email'}</strong>
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {infoMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 text-left">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{infoMessage}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                className="w-11 h-12 sm:w-12 sm:h-14 text-center font-bold text-xl rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-800"
              />
            ))}
          </div>
          {demoOtp && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-center justify-between gap-2">
              <span>
                Dev Demo OTP: <strong>{demoOtp}</strong>
              </span>
              <button
                type="button"
                onClick={handleQuickFillDemo}
                className="font-bold underline hover:text-amber-950"
              >
                Auto-fill
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isVerifying}
            className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isVerifying ? (
              <span>Verifying & Activating School...</span>
            ) : (
              <>
                <span>Confirm & Enter Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <Link to="/login" className="hover:text-slate-800 font-medium">
            Back to Sign In
          </Link>
          <button
            type="button"
            disabled={cooldown > 0 || isResending}
            onClick={handleResend}
            className={`font-semibold flex items-center gap-1 transition-colors ${
              cooldown > 0
                ? 'text-slate-400 cursor-not-allowed'
                : 'text-brand-600 hover:text-brand-700'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {cooldown > 0
              ? `Resend in ${cooldown}s`
              : isResending
                ? 'Resending...'
                : 'Resend Code'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const RegisterSchoolPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    schoolName: '',
    schoolCode: '',
    address: '',
    phone: '',
    schoolEmail: '',
    academicYear: '2025-2026',
    adminName: '',
    password: '',
  });

  const [confirmPassword, setConfirmPassword] = useState('');

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.schoolName.trim() ||
      !formData.schoolCode.trim() ||
      !formData.phone.trim() ||
      !formData.schoolEmail.trim() ||
      !formData.address.trim()
    ) {
      setError('Please fill in all mandatory school fields.');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.adminName.trim()) {
      setError('Please enter the administrator name.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Administrator password must be at least 6 characters long.');
      return;
    }
    if (formData.password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const res = await authApi.registerSchool(formData);
      if (res.success) {
        navigate(
          `/verify-otp?email=${encodeURIComponent(formData.schoolEmail)}${res.demoOtp ? `&demoOtp=${res.demoOtp}` : ''}`
        );
      }
    } catch (err: any) {
      setError(
        err.message || 'Failed to register school. Please check details.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-6 bg-[#F8FAFC]">
      <div className="max-w-2xl w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors group"
            title="Return to EduHub Home Page"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to Home</span>
          </Link>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-brand-700 border border-orange-200">
            Step {step} of 2
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-sm">
            <School className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              Register New School
            </h1>
            <p className="text-xs text-slate-500">
              EduHub School Management System Onboarding
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {step === 1 && (
          <form onSubmit={handleNext} className="space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-800">
              1. School Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  School Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Adiya Model High School"
                  value={formData.schoolName}
                  onChange={(e) =>
                    setFormData({ ...formData, schoolName: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Unique School Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ADIYA-02"
                  value={formData.schoolCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      schoolCode: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm uppercase font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Campus Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Campus Road, City, State, PIN"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Official Phone *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+91 80 4123 4567"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Official School Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="office@school.edu"
                  value={formData.schoolEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, schoolEmail: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <Link
                to="/login"
                className="text-slate-500 hover:text-slate-800 text-xs font-semibold"
              >
                Already registered? Sign In
              </Link>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all"
              >
                Continue to Admin Details <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-800">
              2. Principal / Primary Administrator Account
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Administrator / Principal Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Priya Nair"
                  value={formData.adminName}
                  onChange={(e) =>
                    setFormData({ ...formData, adminName: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Create Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200 flex items-start gap-2.5 text-xs text-orange-950">
              <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
              <span>
                Submitting will initiate OTP verification sent to{' '}
                <strong>{formData.schoolEmail}</strong>. Once confirmed with the
                6-digit code, your school and Admin account will be activated.
              </span>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                {isSubmitting
                  ? 'Registering School...'
                  : 'Complete Registration & Verify'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
