"use client";

import { useState } from "react";
import Link from "next/link";

export default function TestPage() {
  const [userId, setUserId] = useState("");
  const [dataType, setDataType] = useState("Companion");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const runTest = async () => {
    if (!userId) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`/api/test-sync?userId=${userId.trim()}&type=${dataType}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err: any) {
      console.error("Test Error:", err);
      setError(err.message || "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 sm:p-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-6 sm:y-8">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">System <span className="text-indigo-400">Diagnostic</span></h1>
            <p className="text-slate-400 text-sm mt-1">Verify connection between Web, Redis, and Roblox DataStore.</p>
          </div>
          <Link href="/bot" className="text-xs font-bold uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors w-fit">
            Back to Bot
          </Link>
        </header>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 space-y-6 shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
              <button 
                onClick={() => setDataType("Companion")}
                className={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${dataType === 'Companion' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Companion Data
              </button>
              <button 
                onClick={() => setDataType("Player")}
                className={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${dataType === 'Player' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Player Stats
              </button>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Roblox User ID</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="text" 
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder={`Enter ${dataType} User ID`}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm"
                />
                <button 
                  onClick={runTest}
                  disabled={loading || !userId}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 whitespace-nowrap text-sm"
                >
                  {loading ? "Running..." : "Run Diagnostic"}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-medium break-words">
              <strong>Error:</strong> {error}
            </div>
          )}

          {result && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {/* Config Status */}
              <div className="flex flex-wrap gap-2">
                <ConfigBadge label="Universe ID" active={result.config.universeId === "Configured"} />
                <ConfigBadge label="API Key" active={result.config.apiKey === "Configured"} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Redis Card */}
                <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">Redis Cache</h3>
                    <StatusBadge status={result.redis.status} />
                  </div>
                  <div className="bg-slate-900/80 rounded-xl overflow-hidden">
                    <div className="text-[10px] bg-slate-800 px-3 py-1 text-slate-400 font-mono border-b border-slate-700">datastore:Companion_{result.userId}</div>
                    <pre className="text-[10px] text-slate-300 p-3 max-h-48 overflow-y-auto font-mono scrollbar-hide">
                      {result.redis.data ? JSON.stringify(result.redis.data, null, 2) : "// No data found in cache"}
                    </pre>
                  </div>
                </div>

                {/* Open Cloud Card */}
                <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">Open Cloud</h3>
                    <StatusBadge status={result.openCloud.status} />
                  </div>
                  <div className="bg-slate-900/80 rounded-xl overflow-hidden">
                    <div className="text-[10px] bg-slate-800 px-3 py-1 text-slate-400 font-mono border-b border-slate-700">
                      DS: {dataType === 'Companion' ? 'CompanionDataStore' : 'MainDataStore'} | Scope: {dataType === 'Companion' ? 'Companions' : 'Players'}
                    </div>
                    <pre className="text-[10px] text-slate-300 p-3 max-h-48 overflow-y-auto font-mono scrollbar-hide">
                      {result.openCloud.data ? JSON.stringify(result.openCloud.data, null, 2) : 
                       result.openCloud.error ? `// Error: ${result.openCloud.error}` : "// No data found in Roblox"}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Summary Summary */}
              <div className={`p-4 rounded-xl flex items-center justify-between border ${
                result.syncStatus === 'synchronized' ? 'bg-emerald-500/5 border-emerald-500/20' : 
                result.syncStatus === 'needs_backfill' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-slate-800/50 border-slate-700'
              }`}>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">System Status</span>
                <span className={`text-xs font-bold ${
                  result.syncStatus === 'synchronized' ? 'text-emerald-400' : 
                  result.syncStatus === 'needs_backfill' ? 'text-amber-400' : 'text-slate-400'
                }`}>
                  {result.syncStatus === 'synchronized' ? '✓ FULLY SYNCHRONIZED' : 
                   result.syncStatus === 'needs_backfill' ? '! DATA EXISTS IN ROBLOX ONLY' : '⚠ NO DATA LINK FOUND'}
                </span>
              </div>
            </div>
          )}
        </section>

        <footer className="text-center">
           <p className="text-[9px] text-slate-600 uppercase tracking-[0.2em] font-bold">
            Diagnostics Mode • Universe {process.env.NEXT_PUBLIC_ROGPT_UNIVERSE_ID || "Loaded"}
           </p>
        </footer>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: any = {
    found: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    not_found: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    error: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    not_configured: "bg-slate-500/10 text-slate-400 border-slate-800",
    pending: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
  };

  return (
    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${colors[status] || colors.pending}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function ConfigBadge({ label, active }: { label: string, active: boolean }) {
  return (
    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${
      active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
    }`}>
      <div className={`w-1 h-1 rounded-full ${active ? 'bg-emerald-400' : 'bg-rose-400'}`} />
      {label}
    </span>
  );
}
