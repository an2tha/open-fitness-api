'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  ArrowRight,
  Check,
  Copy,
  Database,
  KeyRound,
  LogOut,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  Eye,
} from 'lucide-react';

type ApiKeyRecord = {
  id: number;
  keyPrefix: string;
  name: string;
  owner: string;
  scopes: string[] | null;
  rateLimitMax: number | null;
  rateLimitWindowSecs: number | null;
  requestCount: number;
  lastUsedAt: string | null;
  expiresAt: string | null;
  revoked: boolean;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type OverviewResponse = {
  success: boolean;
  server: {
    uptime: number;
    memory: { rss: number; heapTotal: number; heapUsed: number; external: number; arrayBuffers: number };
    nodeVersion: string;
    timestamp: string;
  };
  dataset: { foods: number; exercises: number; supplements: number; nutrients: number };
  apiKeys: {
    total: number;
    active: number;
    revoked: number;
    expiringSoon: number;
    totalRequests: number;
    averageRequests: number;
    mostActive: ApiKeyRecord | null;
    recentActivity: ApiKeyRecord[];
  };
};

type CreateFormState = {
  name: string;
  owner: string;
  scopes: string;
  rateLimitMax: string;
  rateLimitWindowSecs: string;
  expiresInDays: string;
};

const API_PREFIX = '/api/v1';
const SESSION_KEY = 'ofdata_session_token';

const INITIAL_FORM: CreateFormState = { name: '', owner: '', scopes: '', rateLimitMax: '', rateLimitWindowSecs: '', expiresInDays: '' };

function formatNumber(value: number) {
  return new Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format(value);
}

function formatDuration(seconds: number) {
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function relativeTime(value: string | null) {
  if (!value) return '—';
  const diff = Date.now() - new Date(value).getTime();
  if (Number.isNaN(diff)) return '—';
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (minutes < 1) return 'Now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
}

function splitScopes(scopes: string[] | null | undefined) {
  if (!scopes || scopes.length === 0) return [];
  return scopes;
}

export default function DashboardPage() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [sessionToken, setSessionToken] = useState('');
  const [sessionTokenInput, setSessionTokenInput] = useState('');
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [selectedKeyId, setSelectedKeyId] = useState<number | null>(null);
  const [shownKey, setShownKey] = useState<string | null>(null);
  const [createBusy, setCreateBusy] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormState>(INITIAL_FORM);
  const [createdSecret, setCreatedSecret] = useState<{ key: string; apiKey: ApiKeyRecord } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      setSessionToken(stored);
      setSessionTokenInput(stored);
    }
    setHydrated(true);
  }, []);

  const apiFetch = useCallback(async (path: string, init: RequestInit = {}) => {
    if (!sessionToken) throw new Error('Session missing. Please sign in first.');
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${sessionToken}`);
    if (init.body && !headers.has('content-type')) headers.set('content-type', 'application/json');
    const res = await fetch(`${API_PREFIX}${path}`, { ...init, headers });
    if (res.status === 401) {
      localStorage.removeItem(SESSION_KEY);
      setSessionToken('');
      setSessionTokenInput('');
      setError('Your session was rejected. Please sign in again.');
    }
    const text = await res.text();
    if (!text) throw new Error(`Empty response from ${path}`);
    try {
      const json = JSON.parse(text);
      (json as any)._status = res.status;
      return json;
    } catch {
      throw new Error(`Invalid JSON from ${path}: ${text.slice(0, 100)}`);
    }
  }, [sessionToken]);

  const loadDashboard = useCallback(async () => {
    if (!sessionToken) return;
    setRefreshing(true);
    setError(null);
    try {
      const [overview, keys] = await Promise.all([
        apiFetch('/admin/api-keys/overview/stats'),
        apiFetch('/admin/api-keys?limit=1000&offset=0'),
      ]);
      if (!overview.success) throw new Error(overview.error?.message ?? 'Failed to load overview');
      if (!keys.success) throw new Error(keys.error?.message ?? 'Failed to load API keys');
      setOverview(overview as OverviewResponse);
      setApiKeys(((keys as { keys?: ApiKeyRecord[] }).keys ?? []) as ApiKeyRecord[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiFetch, sessionToken]);

  useEffect(() => {
    if (!hydrated || !sessionToken) return;
    setLoading(true);
    void loadDashboard();
  }, [hydrated, loadDashboard, sessionToken]);

  const filteredKeys = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return apiKeys;
    return apiKeys.filter((key) => {
      return [key.name, key.owner, key.keyPrefix, ...(key.scopes ?? [])].join(' ').toLowerCase().includes(needle);
    });
  }, [apiKeys, query]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = sessionTokenInput.trim();
    if (!trimmed) return;
    localStorage.setItem(SESSION_KEY, trimmed);
    setSessionToken(trimmed);
    setLoading(true);
    await loadDashboard();
  };

  const handleLogout = async () => {
    // Try to sign out from API
    try {
      await fetch(`${API_PREFIX}/auth/sign-out`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
    } catch {
      // Ignore errors
    }
    localStorage.removeItem(SESSION_KEY);
    setSessionToken('');
    setSessionTokenInput('');
    setOverview(null);
    setApiKeys([]);
    setSelectedKeyId(null);
    setCreatedSecret(null);
    setError(null);
    router.push('/auth');
  };

  const createApiKey = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!sessionToken) return;
    const name = createForm.name.trim();
    const owner = createForm.owner.trim();
    if (!name || !owner) {
      setError('Name and owner are required.');
      return;
    }
    setCreateBusy(true);
    setError(null);
    try {
      const scopes = createForm.scopes.split(',').map((s) => s.trim()).filter(Boolean);
      const payload: Record<string, unknown> = { name, owner };
      if (scopes.length > 0) payload.scopes = scopes;
      if (createForm.rateLimitMax.trim()) payload.rateLimitMax = Number(createForm.rateLimitMax);
      if (createForm.rateLimitWindowSecs.trim()) payload.rateLimitWindowSecs = Number(createForm.rateLimitWindowSecs);
      if (createForm.expiresInDays.trim()) payload.expiresInDays = Number(createForm.expiresInDays);
      const res = await apiFetch('/admin/api-keys', { method: 'POST', body: JSON.stringify(payload) });
      if (res._status !== 201) throw new Error(res?.error?.message ?? 'Failed to create key');
      setCreatedSecret({ key: (res as any).key as string, apiKey: (res as any).apiKey as ApiKeyRecord });
      setCreateForm(INITIAL_FORM);
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create key');
    } finally {
      setCreateBusy(false);
    }
  };

  const deleteKey = async (id: number) => {
    if (!confirm('Delete this key permanently?')) return;
    try {
      const res = await apiFetch(`/admin/api-keys/${id}`, { method: 'DELETE' });
      if (!res.success) throw new Error(res?.error?.message ?? 'Failed to delete');
      setSelectedKeyId((current) => (current === id ? null : current));
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const stats = overview?.apiKeys;
  const server = overview?.server;
  const dataset = overview?.dataset;

  const showKey = async (id: number) => {
    if (selectedKeyId === id) {
      setSelectedKeyId(null);
      setShownKey(null);
      return;
    }
    try {
      const res = await apiFetch(`/admin/api-keys/${id}`);
      if (!res.success) throw new Error(res?.error?.message ?? 'Failed to get key');
      setSelectedKeyId(id);
      setShownKey((res as any).key as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get key');
    }
  };

  if (!hydrated) return <div className="min-h-screen bg-[#0a0a0a]" />;

  if (!sessionToken) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="font-serif text-4xl mb-2">Control</h1>
            <p className="text-white/50 text-sm">Sign in to continue</p>
          </div>
          <div className="space-y-4">
            <Link
              href="/auth"
              className="block w-full bg-white text-black py-4 rounded-2xl font-mono text-sm uppercase tracking-widest text-center"
            >
              Sign In
            </Link>
          </div>
          <div className="mt-6 text-center">
            <Link href="/" className="text-white/40 text-sm hover:text-white/60">← Back</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="max-w-6xl mx-auto flex gap-6">
        {/* Sidebar */}
        <aside className="w-48 shrink-0 space-y-2">
          <Link href="/" className="block px-4 py-3 rounded-xl text-sm text-white/40 hover:text-white hover:bg-white/5">
            ← Home
          </Link>
          <Link href="/docs" className="block px-4 py-3 rounded-xl text-sm text-white/40 hover:text-white hover:bg-white/5">
            API Docs
          </Link>
          <a href="/openapi.json" target="_blank" className="block px-4 py-3 rounded-xl text-sm text-white/40 hover:text-white hover:bg-white/5">
            OpenAPI
          </a>
        </aside>

        <div className="flex-1 space-y-8">
          {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl">Control</h1>
            <div className="flex items-center gap-4 mt-2">
              <button onClick={handleLogout} className="text-white/40 text-xs hover:text-white/70">Sign out</button>
            </div>
          </div>
          <button onClick={loadDashboard} disabled={refreshing} className="flex items-center gap-2 border border-white/10 px-4 py-2 rounded-full text-sm hover:bg-white/5">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="p-4 border border-rose-500/30 bg-rose-500/10 text-rose-200 rounded-2xl text-sm">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl border border-white/10 bg-white/5">
            <p className="text-white/40 text-xs font-mono uppercase mb-1">Requests</p>
            <p className="text-2xl">{stats ? formatNumber(stats.totalRequests) : '—'}</p>
          </div>
          <div className="p-5 rounded-2xl border border-white/10 bg-white/5">
            <p className="text-white/40 text-xs font-mono uppercase mb-1">Active Keys</p>
            <p className="text-2xl">{stats ? formatNumber(stats.active) : '—'}</p>
          </div>
          <div className="p-5 rounded-2xl border border-white/10 bg-white/5">
            <p className="text-white/40 text-xs font-mono uppercase mb-1">Dataset</p>
            <p className="text-2xl">{dataset ? formatNumber(dataset.foods + dataset.exercises + dataset.supplements) : '—'}</p>
          </div>
          <div className="p-5 rounded-2xl border border-white/10 bg-white/5">
            <p className="text-white/40 text-xs font-mono uppercase mb-1">Uptime</p>
            <p className="text-2xl">{server ? formatDuration(server.uptime) : '—'}</p>
          </div>
        </div>

        {/* Create Key */}
        <div className="grid grid-cols-3 gap-6">
          <form onSubmit={createApiKey} className="col-span-1 p-5 rounded-2xl border border-white/10 bg-white/5 space-y-4">
            <p className="text-xs font-mono uppercase text-white/40">Create Key</p>
            <input
              value={createForm.name}
              onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Name"
              className="w-full bg-transparent border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-white/30"
            />
            <input
              value={createForm.owner}
              onChange={(e) => setCreateForm((p) => ({ ...p, owner: e.target.value }))}
              placeholder="Owner"
              className="w-full bg-transparent border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-white/30"
            />
            <button type="submit" disabled={createBusy} className="w-full bg-white text-black py-3 rounded-xl text-sm font-medium disabled:opacity-50">
              {createBusy ? 'Creating...' : 'Create Key'}
            </button>
          </form>

          {/* Keys Table */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter keys..."
                  className="w-full bg-transparent border border-white/10 rounded-xl py-2 pl-10 pr-3 text-sm outline-none focus:border-white/30"
                />
              </div>
            </div>

            <div className="border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-white/5 text-white/40 text-xs font-mono uppercase">
                  <tr>
                    <th className="text-left p-3 font-normal">Name</th>
                    <th className="text-left p-3 font-normal">Prefix</th>
                    <th className="text-right p-3 font-normal">Requests</th>
                    <th className="text-right p-3 font-normal">Status</th>
                    <th className="text-right p-3 font-normal">Last Used</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading && apiKeys.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-white/40">Loading...</td></tr>
                  ) : filteredKeys.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-white/40">No keys</td></tr>
                  ) : (
                    filteredKeys.map((key) => {
                      const isActive = !key.revoked && (!key.expiresAt || new Date(key.expiresAt).getTime() > Date.now());
                      return (
                        <tr key={key.id} className="hover:bg-white/5">
                          <td className="p-3">
                            <div className="font-medium">{key.name}</div>
                            <div className="text-white/40 text-xs">{key.owner}</div>
                          </td>
                          <td className="p-3 font-mono text-xs">{key.keyPrefix}</td>
                          <td className="p-3 text-right font-mono text-xs">{formatNumber(key.requestCount)}</td>
                          <td className="p-3 text-right">
                            <span className={`text-xs ${isActive ? 'text-emerald-400' : 'text-white/40'}`}>
                              {isActive ? 'Active' : 'Revoked'}
                            </span>
                          </td>
                          <td className="p-3 text-right text-white/50 text-xs">{relativeTime(key.lastUsedAt)}</td>
                          <td className="p-3 text-right">
                            <button onClick={() => showKey(key.id)} className="text-white/40 hover:text-white text-xs mr-2" title="Show">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteKey(key.id)} className="text-white/40 hover:text-rose-400 text-xs" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {shownKey && (
              <div className="mt-4 p-4 border border-white/10 rounded-xl bg-white/5">
                <p className="text-white/60 text-xs mb-2">Full Key</p>
                <code className="text-sm font-mono text-emerald-400 break-all">{shownKey}</code>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>

      {/* Created Secret Modal */}
      <AnimatePresence>
        {createdSecret && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80" onClick={() => setCreatedSecret(null)} />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="relative bg-[#0d0d0d] border border-white/10 p-6 rounded-2xl w-full max-w-md">
              <p className="text-xs font-mono uppercase text-emerald-400 mb-4">Key Created</p>
              <div className="bg-black/50 border border-white/10 p-3 rounded-xl mb-4 flex items-center gap-2">
                <code className="flex-1 text-sm font-mono break-all">{createdSecret.key}</code>
                <button onClick={() => navigator.clipboard.writeText(createdSecret.key)} className="shrink-0">
                  <Copy className="w-4 h-4 text-white/40" />
                </button>
              </div>
              <button onClick={() => setCreatedSecret(null)} className="w-full bg-white text-black py-3 rounded-xl text-sm">Close</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
