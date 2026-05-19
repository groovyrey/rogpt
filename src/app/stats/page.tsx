"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function StatsPage() {
  const { data: session, status: authStatus } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [playerData, setPlayerData] = useState<any>(null);
  const [editStats, setEditStats] = useState({ coins: 0, weapon: "" });

  useEffect(() => {
    const fetchStats = async () => {
      if (authStatus === "authenticated") {
        try {
          const res = await fetch("/api/player");
          const stats = await res.json();
          if (stats.success) {
            setPlayerData(stats.data);
            setEditStats({ 
              coins: stats.data.coins || 0, 
              weapon: stats.data.weapon || "Fist" 
            });
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

  const handleSaveStats = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editStats),
      });
      const data = await res.json();
      if (data.success) {
        setPlayerData(data.data);
        setMessage({ text: "Stats synced to Roblox successfully.", type: "success" });
      } else {
        setMessage({ text: "Failed to update stats.", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Network error.", type: "error" });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    }
  };

  if (loading) return <div className="p-24 text-center text-sm text-[#888]">Loading game data...</div>;

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-12 space-y-16">
      {/* Game Data Settings */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#444] mb-2 px-1">Progress Sync</h2>
          <h3 className="text-3xl font-bold tracking-tighter text-white">In-Game Data</h3>
          <p className="text-[15px] text-[#666] leading-relaxed max-w-xs">
            Manage your player attributes remotely. Your changes are saved directly to your Roblox account progress.
          </p>
          <div className="pt-4">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/10">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Game Data Linked</span>
             </div>
          </div>
        </div>
        <div className="md:col-span-2 space-y-8 p-10 glass-card rounded-3xl shadow-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
            <Field label="Total Credits (In-Game)">
               <input 
                type="number" 
                value={editStats.coins}
                onChange={(e) => setEditStats({ ...editStats, coins: parseInt(e.target.value) || 0 })}
                className="w-full bg-[#050505] border border-[#222] rounded-xl px-4 py-3 text-sm focus:border-[#444] outline-none transition-all placeholder-[#333]"
              />
            </Field>
            <Field label="Current In-Game Weapon">
               <input 
                type="text" 
                value={editStats.weapon}
                onChange={(e) => setEditStats({ ...editStats, weapon: e.target.value })}
                className="w-full bg-[#050505] border border-[#222] rounded-xl px-4 py-3 text-sm focus:border-[#444] outline-none transition-all placeholder-[#333]"
              />
            </Field>
          </div>
          
          <div className="pt-8 border-t border-[#111] flex items-center justify-between">
            <p className={`text-[11px] font-medium tracking-wide ${message.type === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}>
              {message.text}
            </p>
            <button 
              onClick={handleSaveStats}
              disabled={saving}
              className="px-8 py-2.5 bg-white text-black text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-[#ccc] transition-all disabled:opacity-50 active:scale-95"
            >
              {saving ? "Saving Progress..." : "Save to Account"}
            </button>
          </div>
        </div>
      </section>

      {/* Information Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
         <div className="p-8 glass-card rounded-2xl border-[#222]">
            <p className="text-[10px] font-bold text-[#444] uppercase tracking-widest mb-4">Last Sync Time</p>
            <p className="text-xl font-bold tracking-tight text-[#eaeaea]">{new Date().toLocaleTimeString()}</p>
         </div>
         <div className="p-8 glass-card rounded-2xl border-[#222]">
            <p className="text-[10px] font-bold text-[#444] uppercase tracking-widest mb-4">Experience Code</p>
            <p className="text-xl font-bold tracking-tight text-[#eaeaea] font-mono">{process.env.NEXT_PUBLIC_ROGPT_UNIVERSE_ID?.slice(0, 8) || "10174033"}</p>
         </div>
         <div className="p-8 glass-card rounded-2xl border-[#222]">
            <p className="text-[10px] font-bold text-[#444] uppercase tracking-widest mb-4">Account Status</p>
            <p className="text-xl font-bold tracking-tight text-[#eaeaea]">Connected</p>
         </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-[#888] uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}
