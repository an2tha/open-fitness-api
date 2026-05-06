'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Database, 
  Activity, 
  Terminal, 
  Cpu, 
  Copy,
  ExternalLink,
  Code2,
  LayoutDashboard,
  BookText
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// --- Types ---
type ServerStats = {
  uptime: number;
  memory: { rss: number; heapTotal: number; heapUsed: number };
  counts: { foods: number; exercises: number; supplements: number };
  timestamp: string;
};

// --- Utils ---
const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatUptime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
};

function CodeSnippet({ id, type }: { id: string, type: 'python' | 'js' }) {
  const jsCode = `const response = await fetch('http://localhost:3000/api/v1/foods/${id}', {
  headers: { 'Authorization': 'Bearer YOUR_KEY' }
});
const data = await response.json();
console.log(data);`;

  const pyCode = `import requests

url = "http://localhost:3000/api/v1/foods/${id}"
headers = {"Authorization": "Bearer YOUR_KEY"}

response = requests.get(url, headers=headers)
print(response.json())`;

  const code = type === 'js' ? jsCode : pyCode;

  return (
    <div className="relative group">
      <button 
        onClick={() => navigator.clipboard.writeText(code)}
        className="absolute right-3 top-3 p-1.5 bg-neutral-900 border border-neutral-800 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Copy className="w-3 h-3 text-neutral-500" />
      </button>
      <pre className="bg-black/50 border border-neutral-900 p-4 font-mono text-[11px] text-neutral-400 overflow-x-auto">
        {code}
      </pre>
    </div>
  );
}

function ExplorerRow({ record }: { record: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [codeType, setCodeType] = useState<'js' | 'python'>('js');

  return (
    <div className="border border-neutral-900 bg-neutral-950 mb-px group">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-neutral-900/30 transition-colors text-left"
      >
        <div className="flex items-center gap-6 min-w-0">
          <span className="font-mono text-[10px] text-neutral-600 uppercase tracking-widest shrink-0">{record.externalId || record.id}</span>
          <span className="font-mono text-sm text-neutral-200 truncate uppercase">{record.name}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-mono text-neutral-600 uppercase tracking-tighter">{record.dataSource || record.source}</span>
          <ChevronDown className={`w-4 h-4 text-neutral-700 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-neutral-900 bg-neutral-900/10"
          >
            <div className="p-6 grid grid-cols-1 xl:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex justify-between items-end border-b border-neutral-800 pb-2">
                  <h4 className="font-mono text-[10px] uppercase text-neutral-500 tracking-[0.2em]">Record_Metadata</h4>
                </div>
                <div className="bg-black/20 p-4 font-mono text-[11px] text-neutral-500 overflow-x-auto">
                  <pre>{JSON.stringify(record, null, 2)}</pre>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                  <h4 className="font-mono text-[10px] uppercase text-neutral-500 tracking-[0.2em]">Access_Boilerplate</h4>
                  <div className="flex gap-4 font-mono text-[9px]">
                    <button onClick={() => setCodeType('js')} className={codeType === 'js' ? 'text-white' : 'text-neutral-600'}>JAVASCRIPT</button>
                    <button onClick={() => setCodeType('python')} className={codeType === 'python' ? 'text-white' : 'text-neutral-600'}>PYTHON</button>
                  </div>
                </div>
                <CodeSnippet id={record.id} type={codeType} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const key = localStorage.getItem('ofdata_api_key');
    if (!key) {
      router.push('/');
      return;
    }

    // Fetch Initial Stats
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/v1/health/stats');
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Stats fetch failed: ${res.status}. Output: ${text.slice(0, 100)}`);
        }
        const data = await res.json();
        setStats(data);
      } catch (e) {
        console.error('Telemetry fetch error:', e);
      }
    };

    fetchStats();
    handleSearch('');
  }, [router]);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    setIsSearching(true);
    try {
      const res = await fetch(`/api/v1/foods/search?q=${q || 'a'}&limit=10`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Search failed: ${res.status}. Output: ${text.slice(0, 100)}`);
      }
      const data = await res.json();
      setResults(data.data || []);
    } catch (e) {
      console.error('Data Explorer error:', e);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-400 font-sans selection:bg-white selection:text-black">
      {/* 1. MINIMAL SIDEBAR */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 border-r border-neutral-900 bg-neutral-950 z-20 hidden lg:flex flex-col">
        <div className="p-8 border-b border-neutral-900 flex items-center gap-3">
          <div className="w-2 h-2 bg-white" />
          <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-white font-bold italic">OF_DATA</span>
        </div>

        <nav className="flex-1 p-6 space-y-8">
          <div className="space-y-4">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-600 px-2">Navigation</span>
            <ul className="space-y-1">
              <li>
                <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 bg-neutral-900 text-white font-mono text-xs uppercase tracking-widest border border-neutral-800">
                  <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                </Link>
              </li>
              <li>
                <Link href="/docs" className="flex items-center gap-3 px-3 py-2 text-neutral-500 hover:text-white transition-colors font-mono text-xs uppercase tracking-widest">
                  <BookText className="w-3.5 h-3.5" /> API Docs <ExternalLink className="w-2.5 h-2.5 ml-auto opacity-50" />
                </Link>
              </li>
            </ul>
          </div>

          {stats && (
            <div className="space-y-4">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-600 px-2">Server_Telemetry</span>
              <div className="space-y-4 px-2">
                <div className="space-y-1">
                  <p className="text-[9px] uppercase text-neutral-700">Memory_Usage</p>
                  <p className="font-mono text-xs text-neutral-300">{formatBytes(stats.memory.heapUsed)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] uppercase text-neutral-700">System_Uptime</p>
                  <p className="font-mono text-xs text-neutral-300">{formatUptime(stats.uptime)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] uppercase text-neutral-700">Node_Runtime</p>
                  <p className="font-mono text-xs text-neutral-300">Bun v1.3.12</p>
                </div>
              </div>
            </div>
          )}
        </nav>

        <div className="p-8 border-t border-neutral-900">
          <Link href="/" className="font-mono text-[10px] uppercase tracking-widest text-neutral-600 hover:text-white transition-colors">
            [ Terminate_Session ]
          </Link>
        </div>
      </aside>

      {/* 2. MAIN CONTENT */}
      <main className="lg:ml-64 p-6 md:p-12 lg:p-16 max-w-screen-2xl mx-auto space-y-16">
        
        {/* Header Section */}
        <header className="space-y-6">
          <h1 className="font-serif text-5xl md:text-7xl text-white tracking-tight">Infrastructure.</h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-8 border-y border-neutral-900">
             <div className="space-y-1">
                <p className="text-[9px] uppercase text-neutral-600 tracking-[0.2em]">Total_Foods</p>
                <p className="text-3xl text-white font-serif">{stats?.counts.foods.toLocaleString() || '---'}</p>
             </div>
             <div className="space-y-1">
                <p className="text-[9px] uppercase text-neutral-600 tracking-[0.2em]">Exercises</p>
                <p className="text-3xl text-white font-serif">{stats?.counts.exercises.toLocaleString() || '---'}</p>
             </div>
             <div className="space-y-1">
                <p className="text-[9px] uppercase text-neutral-600 tracking-[0.2em]">Supplements</p>
                <p className="text-3xl text-white font-serif">{stats?.counts.supplements.toLocaleString() || '---'}</p>
             </div>
             <div className="space-y-1">
                <p className="text-[9px] uppercase text-neutral-600 tracking-[0.2em]">Infrastructure</p>
                <p className="text-3xl text-emerald-500 font-serif">ACTIVE</p>
             </div>
          </div>
        </header>

        {/* Data Explorer Section */}
        <section className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h2 className="font-mono text-xs uppercase text-white tracking-[0.3em]">Data_Explorer</h2>
              <p className="text-sm text-neutral-500">Live search across the universal registry.</p>
            </div>
            
            <div className="relative group w-full md:w-96">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isSearching ? 'text-white animate-pulse' : 'text-neutral-700'}`} />
              <input 
                type="text"
                placeholder="SEARCH_REGISTRY..."
                className="w-full bg-transparent border-b border-neutral-800 py-3 pl-12 font-mono text-sm text-white focus:border-white transition-colors outline-none uppercase tracking-widest"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col border border-neutral-900">
            {results.map((r, i) => (
              <ExplorerRow key={r.id} record={r} />
            ))}
            {results.length === 0 && !isSearching && (
              <div className="py-24 text-center font-mono text-[10px] uppercase text-neutral-700 tracking-[0.5em]">
                No_Data_Matches_Query
              </div>
            )}
          </div>
        </section>

        {/* Usage Analytics Placeholder */}
        <section className="space-y-8">
          <div className="space-y-2">
            <h2 className="font-mono text-xs uppercase text-white tracking-[0.3em]">Usage_Analytics</h2>
            <p className="text-sm text-neutral-500">API throughput and endpoint popularity over time.</p>
          </div>
          <div className="h-64 border border-neutral-900 bg-neutral-950 flex flex-col items-center justify-center space-y-4">
             <Activity className="w-8 h-8 text-neutral-800" />
             <p className="font-mono text-[9px] text-neutral-700 uppercase tracking-widest italic">Temporal tracking disabled in developer_build</p>
          </div>
        </section>

      </main>
    </div>
  );
}
