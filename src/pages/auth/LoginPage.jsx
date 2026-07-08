import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { authApi } from '../../api/authApi';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import tccLogo from '../../assets/tcc_logo.jpg';

const FEATURES = [
  'Secure student access',
  'Easy examination monitoring',
  'Fast and reliable results',
];

function EmailIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const inputFocusClasses =
    '[&_input]:focus:border-[#0B2D5C] [&_input]:focus:ring-2 [&_input]:focus:ring-[#0B2D5C]/20';

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Left branding panel */}
      <aside
        className="relative hidden w-1/2 overflow-hidden bg-[#0B2D5C] lg:flex lg:flex-col lg:justify-center lg:px-14 lg:py-16 xl:px-20"
        aria-label="Tagoloan Community College branding"
      >
        {/* Abstract background shapes */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -left-16 -top-16 h-72 w-72 rounded-full bg-white/5" />
          <div className="absolute -bottom-24 -right-12 h-96 w-96 rounded-full bg-[#D8901F]/10" />
          <div className="absolute right-1/4 top-1/3 h-48 w-48 rounded-full bg-white/5" />
          <div className="absolute bottom-1/4 left-1/3 h-32 w-32 rotate-45 rounded-2xl bg-[#D8901F]/5" />
          <svg className="absolute inset-0 h-full w-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10 max-w-lg">
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-[#D8901F]/40 bg-white p-1 shadow-lg">
              <img src={tccLogo} alt="" className="h-full w-full rounded-full object-cover" />
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-widest text-[#D8901F]">Official Portal</p>
              <p className="text-lg font-semibold text-white">Tagoloan Community College</p>
            </div>
          </div>

          <h1 className="text-3xl font-bold leading-tight text-white xl:text-4xl">
            Entrance Examination System
          </h1>
          <p className="mt-4 text-base leading-relaxed text-blue-100/90">
            Secure, simple, and organized online entrance examination access.
          </p>

          <ul className="mt-10 space-y-4" role="list">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm text-blue-50/90">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#D8901F]/20 text-[#D8901F]">
                  <CheckIcon />
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Right login panel */}
      <main className="flex w-full flex-col items-center justify-center px-4 py-10 sm:px-6 lg:w-1/2 lg:px-10">
        {/* Mobile branding header */}
        <div className="mb-6 flex flex-col items-center text-center lg:hidden">
          <div className="mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-[#0B2D5C]/10 bg-white p-1 shadow-md">
            <img src={tccLogo} alt="Tagoloan Community College logo" className="h-full w-full rounded-full object-cover" />
          </div>
          <p className="text-sm font-semibold text-[#0B2D5C]">Tagoloan Community College</p>
          <p className="text-xs text-gray-500">Entrance Examination System</p>
        </div>

        <div className="w-full max-w-md rounded-2xl bg-white px-6 py-8 shadow-xl shadow-slate-200/60 sm:px-8 sm:py-10">
          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-[#0B2D5C]/10 bg-slate-50 p-1.5 shadow-sm">
              <img
                src={tccLogo}
                alt="Tagoloan Community College logo"
                className="h-full w-full rounded-full object-cover"
              />
            </div>
          </div>

          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-[#0B2D5C]">Welcome Back</h2>
            <p className="mt-1.5 text-sm text-gray-500">
              Sign in to access your entrance examination dashboard.
            </p>
          </div>

          {error && <Alert type="error" message={error} onClose={() => setError('')} />}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email */}
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-[34px] text-gray-400">
                <EmailIcon />
              </span>
              <Input
                label="Email"
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className={`${inputFocusClasses} [&_input]:pl-10`}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <LockIcon />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-10 text-sm outline-none transition focus:border-[#0B2D5C] focus:ring-2 focus:ring-[#0B2D5C]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-gray-400 transition hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B2D5C] focus-visible:ring-offset-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-[#D8901F] transition hover:text-[#b87a1a] focus:outline-none focus-visible:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full gap-2 bg-[#0B2D5C] py-2.5 hover:bg-[#092447] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B2D5C] focus-visible:ring-offset-2 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Spinner className="h-4 w-4 border-white border-t-transparent" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 font-medium tracking-wider text-gray-400">OR</span>
            </div>
          </div>

          {/* Google sign-in */}
          <a
            href={authApi.googleRedirect()}
            className="inline-flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B2D5C] focus-visible:ring-offset-2"
          >
            <GoogleIcon />
            Continue with Google
          </a>

          <p className="mt-6 text-center text-sm text-gray-600">
            New applicant?{' '}
            <Link
              to="/register"
              className="font-semibold text-[#0B2D5C] transition hover:text-[#D8901F] focus:outline-none focus-visible:underline"
            >
              Create an account
            </Link>
          </p>
        </div>

        <p className="mt-8 text-center text-xs text-gray-400">
          &copy; 2026 Tagoloan Community College. All rights reserved.
        </p>
      </main>
    </div>
  );
}
