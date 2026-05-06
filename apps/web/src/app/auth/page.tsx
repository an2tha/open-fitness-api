'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, LogIn, UserPlus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_PREFIX = '/api/v1';

type AuthMode = 'sign-in' | 'sign-up';

export default function AuthPage() {
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

    try {
      const endpoint = mode === 'sign-up' ? 'sign-up' : 'sign-in';
      const res = await fetch(`${API_PREFIX}/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, ...(mode === 'sign-up' && name && { name }) }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || `Failed to ${mode === 'sign-up' ? 'sign up' : 'sign in'}`);
      }

      // Store session token
      if (data.session?.token) {
        localStorage.setItem('ofdata_session_token', data.session.token);
      }

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-neutral-950 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-neutral-950" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-block font-mono text-xs text-neutral-500 uppercase tracking-widest mb-4">
            Open Fitness Data
          </Link>
          <h1 className="text-4xl font-serif text-white mb-2">
            {mode === 'sign-in' ? 'Welcome back' : 'Create an account'}
          </h1>
          <p className="text-neutral-400">
            {mode === 'sign-in' ? 'Sign in to manage your API keys' : 'Sign up to get started'}
          </p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-neutral-800">
            <button
              onClick={() => setMode('sign-in')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-mono text-xs uppercase tracking-widest transition-colors ${
                mode === 'sign-in' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
            <button
              onClick={() => setMode('sign-up')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-mono text-xs uppercase tracking-widest transition-colors ${
                mode === 'sign-up' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <AnimatePresence mode="wait">
              {mode === 'sign-up' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label className="block font-mono text-[10px] text-neutral-500 uppercase tracking-widest">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full bg-black border border-neutral-800 px-4 py-3 text-white outline-none focus:border-neutral-700 transition-colors"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="block font-mono text-[10px] text-neutral-500 uppercase tracking-widest">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-black border border-neutral-800 px-4 py-3 text-white outline-none focus:border-neutral-700 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="block font-mono text-[10px] text-neutral-500 uppercase tracking-widest">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="w-full bg-black border border-neutral-800 px-4 py-3 pr-12 text-white outline-none focus:border-neutral-700 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-white text-black py-3 rounded-xl font-mono text-xs uppercase tracking-widest hover:bg-neutral-200 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {mode === 'sign-in' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-neutral-500 text-sm mt-6">
          <Link href="/" className="hover:text-white transition-colors">
            ← Back to home
          </Link>
        </p>
      </motion.div>
    </main>
  );
}