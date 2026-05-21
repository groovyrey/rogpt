"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function BotPage() {
  const { data: session, status: authStatus } = useSession();
  const [config, setConfig] = useState({
    name: "",
    persona: "",
    ownerName: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    const fetchBot = async () => {
      if (authStatus === "authenticated") {
        try {
          const res = await fetch("/api/bot");
          const botData = await res.json();
          if (!botData.error) setConfig(botData);
        } catch (err) {
          console.error("Fetch error", err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchBot();
  }, [authStatus]);

  const handleSaveBot = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: "Agent configuration updated.", type: "success" });
      }
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    }
  };

  if (loading) return <div className="p-24 text-center text-sm text-slate-500">Loading agent settings...</div>;

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-12 space-y-16">
      {/* Agent Settings */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-2 px-1">Personality Sync</h2>
          <h3 className="text-3xl font-bold tracking-tighter text-slate-950">NPC Identity</h3>
          <p className="text-[15px] text-slate-600 leading-relaxed max-w-xs">
            Personalize your in-game companion's name and behavioral instructions. Changes take effect instantly in your Roblox server.
          </p>
          <div className="pt-4">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/5 border border-indigo-500/10">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Neural Uplink Online</span>
             </div>
          </div>
        </div>
        <div className="md:col-span-2 space-y-8 p-10 glass-card rounded-3xl shadow-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
            <Field label="In-Game NPC Name">
               <input 
                type="text" 
                value={config.name}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                className="w-full bg-white border border-blue-100 rounded-xl px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder-slate-400"
              />
            </Field>
            <Field label="Authorized Owner">
               <input 
                type="text" 
                value={config.ownerName}
                onChange={(e) => setConfig({ ...config, ownerName: e.target.value })}
                className="w-full bg-white border border-blue-100 rounded-xl px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder-slate-400"
              />
            </Field>
          </div>
          <Field label="NPC Behavioral Instructions">
            <textarea 
              value={config.persona}
              onChange={(e) => setConfig({ ...config, persona: e.target.value })}
              className="w-full h-56 bg-white border border-blue-100 rounded-xl px-4 py-3 text-sm text-slate-900 focus:border-blue-300 focus:ring-4 focus:ring-blue-100 outline-none transition-all resize-none font-mono placeholder-slate-400"
              placeholder="Tell your NPC how to act (e.g. 'You are my loyal bodyguard...')"
            />
          </Field>
          <div className="pt-8 border-t border-blue-100 flex items-center justify-between">
            <p className={`text-[11px] font-medium tracking-wide ${message.type === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}>{message.text}</p>
            <button 
              onClick={handleSaveBot}
              disabled={saving}
              className="px-8 py-2.5 bg-blue-600 text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 active:scale-95 shadow-sm shadow-blue-600/20"
            >
              {saving ? "Syncing..." : "Sync to Game"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}
