"use client";

import { useState } from "react";
import Link from "next/link";

export default function TestPage() {
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const runTest = async () => {
    if (!userId) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`/api/test-sync?userId=${userId}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System <span className="text-indigo-400">Diagnostic</span></h1>
            <p className="text-slate-400 mt-1">Verify connection between Web, Redis, and Roblox DataStore.</p>
          </div>
          <Link href="/bot" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Back to Bot</Link>
        </header>

        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-xl">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Roblox User ID</label>
            <div className="flex gap-4">
              <input 
                type="text" 
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="e.g. 12345678"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm"
              />
              <button 
                onClick={runTest}
                disabled={loading || !userId}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 whitespace-nowrap"
              >
                {loading ? "Running..." : "Test Connection"}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm font-medium">
              Error: {error}
            </div>
          )}

          {result && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Redis Card */}
              <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm">Redis Cache</h3>
                  <StatusBadge status={result.redis.status} />
                </div>
                {result.redis.data ? (
                  <pre className="text-[10px] text-slate-400 bg-slate-900 p-3 rounded-lg overflow-x-auto">
                    {JSON.stringify(result.redis.data, null, 2)}
                  </pre>
                ) : (
                  <p className="text-xs text-slate-500 italic">No data cached in Redis.</p>
                )}
              </div>

              {/* Open Cloud Card */}
              <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm">Roblox Open Cloud</h3>
                  <StatusBadge status={result.openCloud.status} />
                </div>
                {result.openCloud.data ? (
                  <pre className="text-[10px] text-slate-400 bg-slate-900 p-3 rounded-lg overflow-x-auto">
                    {JSON.stringify(result.openCloud.data, null, 2)}
                  </pre>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    {result.openCloud.error || "No data found in Roblox DataStore."}
                  </p>
                )}
              </div>

              {/* Summary */}
              <div className="md:col-span-2 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sync Health</span>
                <span className={`text-sm font-bold ${result.syncStatus === 'synchronized' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {result.syncStatus === 'synchronized' ? 'Perfectly In Sync' : 
                   result.syncStatus === 'needs_backfill' ? 'Data exists in Roblox only' : 'Out of Sync / Not Found'}
                </span>
              </div>
            </div>
          )}
        </section>

        <footer className="text-center text-[10px] text-slate-600 uppercase tracking-[0.2em] font-bold">
          Universe ID: {process.env.NEXT_PUBLIC_ROGPT_UNIVERSE_ID || "Loaded from Server"}
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
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${colors[status] || colors.pending}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
