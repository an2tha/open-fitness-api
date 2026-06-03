'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, LogIn, Loader2, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from './client';

type AuthMode = 'sign-in' | 'sign-up';

export default function AuthForm({ allowNewLogins }: { allowNewLogins: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (mode === 'sign-up' && !allowNewLogins) {
      setError('New signups are currently disabled.');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'sign-up') {
        const { error: signUpError } = await authClient.signUp.email(
          {
            email,
            password,
            name,
            callbackURL: '/dashboard',
          },
          {
            onRequest: () => setLoading(true),
            onSuccess: () => router.push('/dashboard'),
            onError: (ctx) => {
              setError(ctx.error.message);
              setLoading(false);
            },
          },
        );

        if (signUpError) {
          setError(signUpError.message || 'Sign up failed');
          setLoading(false);
        }
      } else {
        const { error: signInError } = await authClient.signIn.email(
          {
            email,
            password,
            callbackURL: '/dashboard',
          },
          {
            onRequest: () => setLoading(true),
            onSuccess: () => router.push('/dashboard'),
            onError: (ctx) => {
              setError(ctx.error.message);
              setLoading(false);
            },
          },
        );

        if (signInError) {
          setError(signInError.message || 'Sign in failed');
          setLoading(false);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-950 p-6">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-neutral-950" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="mb-4 inline-block font-mono text-xs uppercase tracking-widest text-neutral-500">
            Open Fitness Data
          </Link>
          <h1 className="mb-2 font-serif text-4xl text-white">
            {mode === 'sign-in' ? 'Welcome back' : 'Create an account'}
          </h1>
          <p className="text-neutral-400">{allowNewLogins ? 'Sign in or create an account' : 'Sign in to continue'}</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
          <div className="flex border-b border-neutral-800">
            <button
              onClick={() => setMode('sign-in')}
              className={`flex-1 px-6 py-4 font-mono text-xs uppercase tracking-widest transition-colors ${
                mode === 'sign-in' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-white'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Sign In
              </span>
            </button>
            {allowNewLogins && (
              <button
                onClick={() => setMode('sign-up')}
                className={`flex-1 px-6 py-4 font-mono text-xs uppercase tracking-widest transition-colors ${
                  mode === 'sign-up' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-white'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Sign Up
                </span>
              </button>
            )}
          </div>

          {!allowNewLogins && (
            <div className="border-b border-neutral-800 px-6 py-3 text-sm text-neutral-400">
              New registrations are disabled.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            <AnimatePresence mode="wait">
              {mode === 'sign-up' && allowNewLogins && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-neutral-500">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full border border-neutral-800 bg-black px-4 py-3 text-white outline-none transition-colors focus:border-neutral-700"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="block text-[10px] font-mono uppercase tracking-widest text-neutral-500">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full border border-neutral-800 bg-black px-4 py-3 text-white outline-none transition-colors focus:border-neutral-700"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-mono uppercase tracking-widest text-neutral-500">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="w-full border border-neutral-800 bg-black px-4 py-3 pr-12 text-white outline-none transition-colors focus:border-neutral-700"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 transition-colors hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-xs font-mono uppercase tracking-widest text-black transition-colors hover:bg-neutral-200 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {loading ? 'Please wait' : mode === 'sign-in' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </motion.div>
    </main>
  );
}
