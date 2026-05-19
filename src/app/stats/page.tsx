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
          <h2 className="text-2xl font-bold tracking-tight">Player Stats</h2>
          <p className="text-sm text-[#888] leading-relaxed">
            Directly modify player attributes in the Roblox DataStore using Open Cloud integration. 
            Changes are applied immediately to the game state.
          </p>
          <div className="pt-4">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Connected</span>
             </div>
          </div>
        </div>
        <div className="md:col-span-2 space-y-8 p-8 bg-[#000] border border-[#333] rounded-xl shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <Field label="Coins (DataStore)">
               <input 
                type="number" 
                value={editStats.coins}
                onChange={(e) => setEditStats({ ...editStats, coins: parseInt(e.target.value) || 0 })}
                className="w-full bg-black border border-[#333] rounded-md px-3 py-2 text-sm focus:border-white outline-none transition-colors"
              />
            </Field>
            <Field label="Equipped Weapon">
               <input 
                type="text" 
                value={editStats.weapon}
                onChange={(e) => setEditStats({ ...editStats, weapon: e.target.value })}
                className="w-full bg-black border border-[#333] rounded-md px-3 py-2 text-sm focus:border-white outline-none transition-colors"
              />
            </Field>
          </div>
          
          <div className="pt-6 border-t border-[#333] flex items-center justify-between">
            <p className={`text-xs ${message.type === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}>
              {message.text}
            </p>
            <button 
              onClick={handleSaveStats}
              disabled={saving}
              className="px-6 py-2 bg-white text-black text-sm font-semibold rounded hover:bg-[#eaeaea] transition-all disabled:opacity-50"
            >
              {saving ? "Syncing..." : "Sync to Roblox"}
            </button>
          </div>
        </div>
      </section>

      {/* Information Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
         <div className="p-6 bg-[#000] border border-[#333] rounded-xl">
            <p className="text-[10px] font-bold text-[#888] uppercase tracking-widest mb-2">Last Sync</p>
            <p className="text-lg font-medium">{new Date().toLocaleTimeString()}</p>
         </div>
         <div className="p-6 bg-[#000] border border-[#333] rounded-xl">
            <p className="text-[10px] font-bold text-[#888] uppercase tracking-widest mb-2">Universe ID</p>
            <p className="text-lg font-medium font-mono">{process.env.NEXT_PUBLIC_ROGPT_UNIVERSE_ID || "10174033054"}</p>
         </div>
         <div className="p-6 bg-[#000] border border-[#333] rounded-xl">
            <p className="text-[10px] font-bold text-[#888] uppercase tracking-widest mb-2">Environment</p>
            <p className="text-lg font-medium">Production</p>
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
