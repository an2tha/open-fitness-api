'use client';

import { RefreshCw, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardSidebar from '../sidebar';
import { authClient } from '../../auth/client';

type SettingsResponse = {
  success: boolean;
  allowNewLogins: boolean;
  settings?: Record<string, unknown>;
};

const API_PREFIX = '/api/v1';

export default function DashboardSettingsPage() {
  const router = useRouter();
  const session = authClient.useSession();
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [allowNewLogins, setAllowNewLogins] = useState(true);
  const [initialAllowNewLogins, setInitialAllowNewLogins] = useState(true);

  const isAuthenticated = Boolean(session.data?.user);
  const isPending = session.isPending;
  const isDirty = allowNewLogins !== initialAllowNewLogins;

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || isPending) return;
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }

    const controller = new AbortController();

    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_PREFIX}/admin/settings`, {
          credentials: 'include',
          signal: controller.signal,
        });
        const data = (await response.json()) as SettingsResponse & { error?: { message?: string } };
        if (!response.ok) {
          throw new Error(data.error?.message || 'Failed to load settings');
        }

        const nextValue = Boolean(data.allowNewLogins);
        setAllowNewLogins(nextValue);
        setInitialAllowNewLogins(nextValue);
        setSavedAt(new Date().toISOString());
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [hydrated, isPending, isAuthenticated, router]);

  const summary = allowNewLogins
    ? 'Open to new registrations.'
    : 'New registrations are blocked; existing users can still sign in.';

  const saveSettings = async () => {
    if (!isDirty) return;
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`${API_PREFIX}/admin/settings`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ allowNewLogins }),
      });
      const data = (await response.json()) as SettingsResponse & { error?: { message?: string } };
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to save settings');
      }

      const nextValue = Boolean(data.allowNewLogins);
      setAllowNewLogins(nextValue);
      setInitialAllowNewLogins(nextValue);
      setSavedAt(new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authClient.signOut();
    } catch {
      // ignore
    }
    router.push('/auth');
  };

  if (!hydrated || isPending || !isAuthenticated) {
    return <div className="bg-[#0a0a0a] min-h-screen" />;
  }

  return (
    <main className="bg-[#0a0a0a] p-6 min-h-screen text-white">
      <div className="flex gap-6 mx-auto max-w-6xl">
        <DashboardSidebar active="settings" />

        <div className="flex-1 space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="font-serif text-3xl">Settings</h1>
              <div className="flex items-center gap-4 mt-2">
                <button onClick={handleLogout} className="text-white/40 hover:text-white/70 text-xs">
                  Sign out
                </button>
              </div>
            </div>

            <button
              onClick={saveSettings}
              disabled={saving || !isDirty}
              className="flex items-center gap-2 hover:bg-white/5 disabled:opacity-40 px-4 py-2 border border-white/10 rounded-full text-sm"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving' : isDirty ? 'Save' : 'Saved'}
            </button>
          </div>

          {error && (
            <div className="bg-rose-500/10 p-4 border border-rose-500/30 rounded-2xl text-rose-200 text-sm">
              {error}
            </div>
          )}
          {loading && <p className="text-neutral-500 text-xs uppercase tracking-[0.3em]">Loading…</p>}

          <div className="gap-6 grid grid-cols-3">
            <div className="col-span-1 bg-white/5 p-5 border border-white/10 rounded-2xl">
              <p className="font-mono text-[10px] text-white/40 uppercase tracking-widest">Access</p>
              <h2 className="mt-2 text-white text-sm uppercase tracking-widest">New logins</h2>
              <p className="mt-4 text-white/45 text-sm leading-6">{summary}</p>

              <button
                type="button"
                onClick={() => setAllowNewLogins((value) => !value)}
                className={`mt-6 flex h-10 w-16 items-center rounded-full border p-1 transition-colors ${
                  allowNewLogins ? 'border-white bg-white text-black' : 'border-white/10 bg-transparent text-white'
                }`}
                aria-pressed={allowNewLogins}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-transform ${
                    allowNewLogins ? 'translate-x-7 bg-black text-white' : 'translate-x-0 bg-white text-black'
                  }`}
                />
              </button>

              <div className="flex justify-between items-center mt-6 pt-4 border-white/10 border-t text-white/40 text-xs">
                <span>{allowNewLogins ? 'Enabled' : 'Disabled'}</span>
                <span>{savedAt ? new Date(savedAt).toLocaleTimeString() : '—'}</span>
              </div>
            </div>

            <div className="col-span-2 bg-white/5 p-5 border border-white/10 rounded-2xl">
              <p className="font-mono text-[10px] text-white/40 uppercase tracking-widest">Policy</p>
              <div className="space-y-3 mt-4">
                {[
                  ['Current state', allowNewLogins ? 'Open' : 'Closed'],
                  ['Saved at', savedAt ? new Date(savedAt).toLocaleTimeString() : '—'],
                  ['Scope', 'New account creation only'],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between items-center bg-black/25 px-4 py-3 border border-white/10 rounded-xl"
                  >
                    <span className="text-white text-sm">{label}</span>
                    <span className="text-[10px] text-white/40 uppercase tracking-[0.3em]">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
