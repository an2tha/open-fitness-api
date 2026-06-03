'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardSidebar from './sidebar';
import { useRouter } from 'next/navigation';
import { Copy, Eye, RefreshCw, Search, Trash2 } from 'lucide-react';
import { authClient } from '../auth/client';

type ApiKeyRecord = {
  id: string;
  name?: string | null;
  start?: string | null;
  prefix?: string | null;
  referenceId?: string | null;
  expiresAt?: string | Date | null;
  lastRefillAt?: string | Date | null;
  remaining?: number;
  enabled?: boolean;
  metadata?: unknown;
  permissions?: unknown;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
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
};

const INITIAL_FORM: CreateFormState = {
  name: '',
};

export default function DashboardPage() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  const session = authClient.useSession();
  const isAuthenticated = Boolean(session.data?.user);
  const isPending = session.isPending;

  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const [createBusy, setCreateBusy] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormState>(INITIAL_FORM);
  const [createdSecret, setCreatedSecret] = useState<{ key: string } | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const loadDashboard = useCallback(async () => {
    if (!isAuthenticated) return;
    setRefreshing(true);
    setError(null);
    try {
      // Load API keys directly from better-auth
      const result = await authClient.apiKey.list({
        query: { limit: 100, offset: 0 },
      });

      const { data, error: keysError } = result;
      if (keysError) throw new Error(keysError.message || 'Failed to load API keys');

      // Handle different response formats - better-auth returns data with apiKeys inside
      const responseData = data as unknown as { apiKeys?: ApiKeyRecord[]; keys?: ApiKeyRecord[] } | null;
      const keysArray = responseData?.apiKeys ?? responseData?.keys ?? [];

      setApiKeys(keysArray);

      // Set overview stats
      const now = new Date();
      setOverview({
        success: true,
        apiKeys: {
          total: keysArray.length,
          active: keysArray.filter((key) => key.enabled !== false).length,
          revoked: keysArray.filter((key) => key.enabled === false).length,
          expiringSoon: keysArray.filter(
            (key) => key.expiresAt && new Date(key.expiresAt).getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000,
          ).length,
          totalRequests: 0,
          averageRequests: 0,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!hydrated || isPending) return;
    if (!isAuthenticated) {
      router.replace('/auth');
      return;
    }

    void loadDashboard();
  }, [hydrated, isPending, isAuthenticated, loadDashboard, router]);

  const filteredKeys = useMemo(() => {
    if (!apiKeys) return [];
    const needle = query.trim().toLowerCase();
    if (!needle) return apiKeys;
    return apiKeys.filter((key) => {
      return [key.name, key.referenceId, key.prefix].filter(Boolean).join(' ').toLowerCase().includes(needle);
    });
  }, [apiKeys, query]);

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
    if (!isAuthenticated) return;
    const name = createForm.name.trim();
    if (!name) {
      setError('Name is required.');
      return;
    }
    setCreateBusy(true);
    setError(null);
    try {
      const { data, error } = await authClient.apiKey.create({
        name,
      });
      if (error) throw new Error(error.message || 'Failed to create key');
      setCreatedSecret({ key: (data as { key?: string } | null)?.key || '' });
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
      const { error } = await authClient.apiKey.delete({
        keyId: id,
      });
      if (error) throw new Error(error.message || 'Failed to delete');
      setSelectedKeyId((current) => (current === id ? null : current));
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const showKey = async (id: string) => {
    if (selectedKeyId === id) {
      setSelectedKeyId(null);
      return;
    }
    try {
      const { error } = await authClient.apiKey.get({
        query: { id },
      });
      if (error) throw new Error(error.message || 'Failed to get key');
      setSelectedKeyId(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get key');
    }
  };

  if (!hydrated || isPending || !isAuthenticated) return <div className="bg-[#0a0a0a] min-h-screen" />;

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

          {overview && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                ['Total keys', overview.apiKeys.total],
                ['Active', overview.apiKeys.active],
                ['Revoked', overview.apiKeys.revoked],
                ['Expiring soon', overview.apiKeys.expiringSoon],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">{label}</p>
                  <p className="mt-2 text-2xl text-white">{value}</p>
                </div>
              ))}
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
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-white/40 text-xs">API Key (copy now)</p>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(createdSecret.key)}
                      className="rounded-lg p-1 text-white/50 hover:bg-white/10 hover:text-white"
                      aria-label="Copy API key"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
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
                    <div key={key.id} className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-mono text-sm">{key.name || 'Untitled key'}</p>
                          <p className="mt-1 font-mono text-white/40 text-xs">
                            {[key.prefix, key.start].filter(Boolean).join('…') || key.id}
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
                      {selectedKeyId === key.id && (
                        <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-white/45">
                          Raw API keys are only shown once at creation. Delete and recreate this key if the secret was
                          lost.
                        </div>
                      )}
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
