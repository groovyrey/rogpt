"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function StatsPage() {
  const { status: authStatus } = useSession();
  const [loading, setLoading] = useState(true);
  const [playerData, setPlayerData] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (authStatus === "authenticated") {
        try {
          const res = await fetch("/api/player");
          const stats = await res.json();
          if (stats.success) {
            setPlayerData(stats.data);
          }
        } catch (err) {
          console.error("Fetch error", err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchStats();
  }, [authStatus]);

  if (loading) return <div className="p-24 text-center text-sm text-slate-500">Loading in-game data...</div>;

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-12 space-y-16">
      {/* Game Data Settings */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-2 px-1">Progress Sync</h2>
          <h3 className="text-3xl font-bold tracking-tighter text-slate-950">In-Game Data</h3>
          <p className="text-[15px] text-slate-600 leading-relaxed max-w-xs">
            View your real-time player attributes. These values are synced directly from your active Roblox session.
          </p>
          <div className="pt-4">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/10">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Neural Link Secure</span>
             </div>
          </div>
        </div>
        <div className="md:col-span-2 space-y-8 p-10 glass-card rounded-3xl shadow-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
            <div className="space-y-3">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Credits (MainDataStore)</p>
               <div className="bg-white border border-blue-100 rounded-xl px-5 py-4 flex items-center justify-between">
                  <span className="text-2xl font-bold text-slate-950 tracking-tighter">{playerData?.coins?.toLocaleString() || "0"}</span>
                  <span className="text-[10px] font-mono text-blue-500">CR</span>
               </div>
            </div>
            <div className="space-y-3">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tactical Asset (Weapon)</p>
               <div className="bg-white border border-blue-100 rounded-xl px-5 py-4 flex items-center justify-between">
                  <span className="text-lg font-bold text-slate-950 tracking-tight">{playerData?.weapon || "None"}</span>
                  <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
               </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
               <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
               <p className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">Manual Override Disabled</p>
            </div>
            <div className="px-6 py-2 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-blue-100 cursor-not-allowed">
              Sync Active
            </div>
          </div>
        </div>
      </section>

      {/* Information Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
         <div className="p-8 glass-card rounded-2xl">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Last Sync Time</p>
            <p className="text-xl font-bold tracking-tight text-slate-950">{new Date().toLocaleTimeString()}</p>
         </div>
         <div className="p-8 glass-card rounded-2xl">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Account Status</p>
            <p className="text-xl font-bold tracking-tight text-slate-950">Connected</p>
         </div>
      </div>
    </div>
  );
}
