import React, { useState, useEffect } from 'react';
import {
  Link,
  NavLink,
  useLocation,
  Outlet,
} from 'react-router-dom';
import {
  School,
  Menu,
  X,
  ArrowRight,
  LogIn,
  ShieldCheck,
  Heart,
  ArrowUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface PublicNavbarProps {
  transparentOnTop?: boolean;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({
  transparentOnTop = false,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!transparentOnTop) {
      setIsScrolled(true);
      return;
    }

    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [transparentOnTop]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'Features', to: '/features' },
    { label: 'Solutions', to: '/solutions' },
    { label: 'Blog', to: '/blog' },
    { label: 'About', to: '/about' },
    { label: 'Contact', to: '/contact' },
  ];

  const isTransparent = transparentOnTop && !isScrolled && !isMobileMenuOpen;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isTransparent
          ? 'bg-transparent py-5 text-white'
          : 'bg-white/95 backdrop-blur-md border-b border-slate-200/80 py-3.5 shadow-sm text-slate-800'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-3 select-none cursor-pointer group focus:outline-none"
            aria-label="EduHub SMS Home"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <School className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span
                className={`font-black text-xl tracking-tight leading-none flex items-center gap-1.5 transition-colors ${
                  isTransparent ? 'text-white' : 'text-slate-900'
                }`}
              >
                EduHub
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-500 text-white shadow-sm">
                  SMS
                </span>
              </span>
              <span
                className={`text-[11px] font-medium transition-colors ${
                  isTransparent ? 'text-slate-300' : 'text-slate-500'
                }`}
              >
                School Management System
              </span>
            </div>
          </Link>

          <nav
            className="hidden md:flex items-center gap-1"
            aria-label="Main Navigation"
          >
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-xl text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    isActive
                      ? isTransparent
                        ? 'text-white bg-white/20'
                        : 'text-brand-600 bg-brand-50'
                      : isTransparent
                        ? 'text-slate-200 hover:text-white hover:bg-white/10'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <Link
                to={`/${user.role}/dashboard`}
                className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-sm shadow-brand-500/20 flex items-center gap-1.5 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
              >
                <span>Dashboard ({user.name.split(' ')[0]})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    isTransparent
                      ? 'text-white hover:bg-white/15'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In
                </Link>

                <Link
                  to="/register-school"
                  className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-sm shadow-brand-500/20 flex items-center gap-1.5 transition-all hover:shadow-md hover:shadow-brand-500/30 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                >
                  Get Started
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center md:hidden gap-1.5">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-2 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                isTransparent
                  ? 'text-white hover:bg-white/10'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-white text-slate-900 border-b border-slate-200 px-4 pt-3 pb-6 space-y-3 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <nav
            className="flex flex-col space-y-1"
            aria-label="Mobile Navigation"
          >
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-600'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {isAuthenticated && user ? (
              <Link
                to={`/${user.role}/dashboard`}
                className="w-full py-2.5 px-4 rounded-xl bg-brand-500 text-white font-semibold text-xs text-center shadow-sm flex items-center justify-center gap-1.5"
              >
                Open {user.role.charAt(0).toUpperCase() + user.role.slice(1)}{' '}
                Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs text-center flex items-center justify-center gap-1.5"
                >
                  <LogIn className="w-4 h-4 text-slate-500" />
                  Sign In to Portal
                </Link>
                <Link
                  to="/register-school"
                  className="w-full py-2.5 px-4 rounded-xl bg-brand-500 text-white hover:bg-brand-600 font-semibold text-xs text-center shadow-sm flex items-center justify-center gap-1.5"
                >
                  Get Started • Register School
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export const PublicFooter: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 text-slate-600 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3 select-none cursor-default">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-500 flex items-center justify-center text-white shadow-sm">
                <School className="w-5 h-5" />
              </div>
              <span className="font-black text-lg text-slate-900 tracking-tight flex items-center gap-1.5">
                EduHub
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                  SMS
                </span>
              </span>
            </div>
            <p className="text-slate-500 leading-relaxed text-xs">
              EduHub is the modern, unified School Management System designed
              for institutions to coordinate academic instruction, attendance,
              student records, fee collection, and guardian communication with
              total transparency.
            </p>
            <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Multi-Tenant Architecture • Role-Scoped Access</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Platform
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/features"
                  className="hover:text-brand-600 transition-colors"
                >
                  All 14 Modules
                </Link>
              </li>
              <li>
                <Link
                  to="/features"
                  className="hover:text-brand-600 transition-colors"
                >
                  Attendance Tracking
                </Link>
              </li>
              <li>
                <Link
                  to="/features"
                  className="hover:text-brand-600 transition-colors"
                >
                  Fee Collection & Concessions
                </Link>
              </li>
              <li>
                <Link
                  to="/features"
                  className="hover:text-brand-600 transition-colors"
                >
                  Examinations & DMC Transcripts
                </Link>
              </li>
              <li>
                <Link
                  to="/features"
                  className="hover:text-brand-600 transition-colors"
                >
                  Timetable & Conflict Engine
                </Link>
              </li>
              <li>
                <Link
                  to="/features"
                  className="hover:text-brand-600 transition-colors"
                >
                  AI Academic Assistant
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Solutions
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/solutions"
                  className="hover:text-brand-600 transition-colors"
                >
                  For School Leadership & Admin
                </Link>
              </li>
              <li>
                <Link
                  to="/solutions"
                  className="hover:text-brand-600 transition-colors"
                >
                  For Teachers & Faculty
                </Link>
              </li>
              <li>
                <Link
                  to="/solutions"
                  className="hover:text-brand-600 transition-colors"
                >
                  For Students
                </Link>
              </li>
              <li>
                <Link
                  to="/solutions"
                  className="hover:text-brand-600 transition-colors"
                >
                  For Parents & Guardians
                </Link>
              </li>
              <li>
                <Link
                  to="/solutions"
                  className="hover:text-brand-600 transition-colors"
                >
                  Admin-Controlled Teacher RBAC
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Resources & Access
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/blog"
                  className="hover:text-brand-600 transition-colors"
                >
                  School Operations Blog
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="hover:text-brand-600 transition-colors"
                >
                  About EduHub
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="hover:text-brand-600 transition-colors"
                >
                  Request a Demo & Contact
                </Link>
              </li>
              <li>
                <Link
                  to="/register-school"
                  className="text-brand-600 hover:text-brand-700 font-semibold transition-colors"
                >
                  Register New School
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="text-slate-700 hover:text-slate-900 font-semibold transition-colors"
                >
                  Portal Sign In
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span>© {new Date().getFullYear()} EduHub SMS. Built with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
            <span>for academic excellence.</span>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">
              Demo School: Adiya School of Excellence
            </span>
            <Link
              to="/about"
              className="hover:text-slate-600 transition-colors"
            >
              Architecture
            </Link>
            <Link
              to="/contact"
              className="hover:text-slate-600 transition-colors"
            >
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

interface PublicLayoutProps {
  children?: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const handleScrollToTop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-800 selection:bg-brand-500 selection:text-white relative">
      <PublicNavbar transparentOnTop={isHomePage} />
      <main className="flex-1">{children || <Outlet />}</main>
      <PublicFooter />

      <button
        type="button"
        onClick={handleScrollToTop}
        title="Scroll to Top"
        aria-label="Scroll to Top"
        className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/30 border border-brand-400 hover:scale-110 active:scale-95 transition-all flex items-center justify-center cursor-pointer group focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
      >
        <ArrowUp className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" />
      </button>
    </div>
  );
};
