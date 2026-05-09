// @ts-nocheck
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type FormEvent } from 'react';
import DashboardSidebar from './sidebar';
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
import { authClient } from '../auth/client';

type ApiKeyRecord = {
  id: string;
  name: string;
  start?: string;
  prefix?: string;
  referenceId: string;
  expiresAt?: string;
  lastRefillAt?: string;
  remaining?: number;
  enabled?: boolean;
  metadata?: Record<string, unknown>;
  permissions?: Record<string, string[]>;
  createdAt?: string;
  updatedAt?: string;
};

type OverviewResponse = {
  success: boolean;
  apiKeys: {
    total: number;
    active: number;
    revoked: number;
    expiringSoon: number;
    totalRequests: number;
    averageRequests: number;
  };
};

type CreateFormState = {
  name: string;
  scopes: string;
  rateLimitMax: string;
  rateLimitWindowSecs: string;
  expiresInDays: string;
};

const API_PREFIX = '/api/v1';

const INITIAL_FORM: CreateFormState = {
  name: '',
  scopes: '',
  rateLimitMax: '',
  rateLimitWindowSecs: '',
  expiresInDays: '',
};

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

export default function DashboardPage() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  // Get session state from better-auth using the useSession hook
  const session = authClient.useSession();
  const sessionToken = session.data?.session?.token;
  const isAuthenticated = !!sessionToken;
  const isPending = session.isPending;

  // Get the API key client plugin
  const apiKey = authClient.apiKey;

  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const [shownKey, setShownKey] = useState<string | null>(null);
  const [createBusy, setCreateBusy] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormState>(INITIAL_FORM);
  const [createdSecret, setCreatedSecret] = useState<{ key: string } | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const loadDashboard = useCallback(async () => {
    if (!sessionToken) return;
    setRefreshing(true);
    setError(null);
    try {
      // Load API keys directly from better-auth
      const result = await apiKey.list({
        query: { configId: '1', limit: 100, offset: 0 },
      });

      const { data, error: keysError } = result;
      if (keysError) throw new Error(keysError.message || 'Failed to load API keys');

      // Handle different response formats - better-auth returns data with apiKeys inside
      const keysArray = data?.apiKeys || data?.keys || [];

      setApiKeys(keysArray as unknown as ApiKeyRecord[]);

      // Set overview stats
      const now = new Date();
      setOverview({
        success: true,
        apiKeys: {
          total: keysArray.length,
          active: keysArray.filter((k: any) => k.enabled !== false).length,
          revoked: keysArray.filter((k: any) => k.enabled === false).length,
          expiringSoon: keysArray.filter(
            (k: any) => k.expiresAt && new Date(k.expiresAt).getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000,
          ).length,
          totalRequests: 0,
          averageRequests: 0,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiKey, sessionToken]);

  useEffect(() => {
    if (!hydrated || !sessionToken || loading || refreshing) return;
    setLoading(true);
    loadDashboard();
  }, [hydrated, sessionToken]);

  const filteredKeys = useMemo(() => {
    if (!apiKeys) return [];
    const needle = query.trim().toLowerCase();
    if (!needle) return apiKeys;
    return apiKeys.filter((key) => {
      return [key.name, key.referenceId, key.prefix].join(' ').toLowerCase().includes(needle);
    });
  }, [apiKeys, query]);

  // Login is now handled on /auth page - redirect there if not authenticated
  const handleLogin = () => {
    router.push('/auth');
  };

  // Sign out using better-auth
  const handleLogout = async () => {
    try {
      await authClient.signOut();
    } catch {
      // Ignore errors
    }
    setOverview(null);
    setApiKeys([]);
    setSelectedKeyId(null);
    setCreatedSecret(null);
    setError(null);
    router.push('/auth');
  };

  const createApiKeyHandler = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!sessionToken) return;
    const name = createForm.name.trim();
    if (!name) {
      setError('Name is required.');
      return;
    }
    setCreateBusy(true);
    setError(null);
    try {
      const { data, error } = await apiKey.create({
        body: {
          configId: '1',
          name: name,
        },
      });
      if (error) throw new Error(error.message || 'Failed to create key');
      setCreatedSecret({ key: data?.key || '' });
      setCreateForm(INITIAL_FORM);
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create key');
    } finally {
      setCreateBusy(false);
    }
  };

  const deleteKey = async (id: string) => {
    if (!confirm('Delete this key permanently?')) return;
    try {
      const { error } = await apiKey.delete({
        configId: '1',
        keyId: id,
      });
      if (error) throw new Error(error.message || 'Failed to delete');
      setSelectedKeyId((current) => (current === id ? null : current));
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const stats = overview?.apiKeys;

  const showKey = async (id: string) => {
    if (selectedKeyId === id) {
      setSelectedKeyId(null);
      setShownKey(null);
      return;
    }
    try {
      const { data, error } = await apiKey.get({
        query: { configId: '1', id },
      });
      if (error) throw new Error(error.message || 'Failed to get key');
      setSelectedKeyId(id);
      setShownKey(data?.key || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get key');
    }
  };

  if (!hydrated || isPending) return <div className="bg-[#0a0a0a] min-h-screen" />;

  if (!isAuthenticated) {
    if (typeof window !== 'undefined') {
      window.location.href = '/auth';
    }
    return <div className="bg-[#0a0a0a] min-h-screen" />;
  }

  return (
    <main className="bg-[#0a0a0a] p-6 min-h-screen text-white">
      <div className="flex gap-6 mx-auto max-w-6xl">
        <DashboardSidebar active="control" />

        <div className="flex-1 space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="font-serif text-3xl">Control</h1>
              <div className="flex items-center gap-4 mt-2">
                <button onClick={handleLogout} className="text-white/40 hover:text-white/70 text-xs">
                  Sign out
                </button>
              </div>
            </div>
            <button
              onClick={loadDashboard}
              disabled={refreshing}
              className="flex items-center gap-2 hover:bg-white/5 px-4 py-2 border border-white/10 rounded-full text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {error && (
            <div className="bg-rose-500/10 p-4 border border-rose-500/30 rounded-2xl text-rose-200 text-sm">
              {error}
            </div>
          )}

          {/* Create Key */}
          <div className="gap-6 grid grid-cols-3">
            <form
              onSubmit={createApiKeyHandler}
              className="space-y-4 col-span-1 bg-white/5 p-5 border border-white/10 rounded-2xl"
            >
              <p className="font-mono text-white/40 text-xs uppercase">Create Key</p>
              <input
                value={createForm.name}
                onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Name"
                className="bg-transparent px-3 py-2 border border-white/10 focus:border-white/30 rounded-xl outline-none w-full text-sm"
              />

              <button
                type="submit"
                disabled={createBusy}
                className="bg-white disabled:opacity-50 py-3 rounded-xl w-full font-medium text-black text-sm"
              >
                {createBusy ? 'Creating...' : 'Create Key'}
              </button>
              {createdSecret && (
                <div className="space-y-2 bg-white/5 p-3 rounded-lg">
                  <p className="text-white/40 text-xs">API Key (copy now)</p>
                  <code className="block text-xs break-all">{createdSecret.key}</code>
                </div>
              )}
            </form>

            {/* Key List */}
            <div className="space-y-4 col-span-2">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="top-1/2 left-3 absolute w-4 h-4 text-white/20 -translate-y-1/2" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search keys..."
                    className="bg-transparent py-2 pr-3 pl-10 border border-white/10 focus:border-white/30 rounded-xl outline-none w-full text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                {filteredKeys.length === 0 ? (
                  <div className="py-8 text-white/40 text-center">No API keys found. Create one to get started.</div>
                ) : (
                  filteredKeys.map((key) => (
                    <div
                      key={key.id}
                      className="flex justify-between items-center bg-white/5 p-4 border border-white/10 rounded-xl"
                    >
                      <div className="flex-1">
                        <p className="font-mono text-sm">{key.name}</p>
                        <p className="mt-1 font-mono text-white/40 text-xs">
                          {key.prefix}... {key.start}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {key.enabled === false && <span className="text-rose-400 text-xs">Revoked</span>}
                        <button onClick={() => showKey(key.id)} className="hover:bg-white/10 p-2 rounded-lg">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteKey(key.id)}
                          className="hover:bg-white/10 p-2 rounded-lg text-rose-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
