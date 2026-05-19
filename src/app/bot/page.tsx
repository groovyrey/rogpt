"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { ChatInterface } from "../components/ChatInterface";

export default function BotPage() {
  const { data: session, status: authStatus } = useSession();
  const [config, setConfig] = useState({
    name: session?.user?.name || "Gemma",
    persona: "",
    ownerName: session?.user?.name || ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [showSettings, setShowSettings] = useState(false);
  const [playerData, setPlayerData] = useState<any>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      if (authStatus === "authenticated") {
        try {
          const res = await fetch("/api/bot");
          const data = await res.json();
          if (!data.error) {
            setConfig(data);
          }
          
          // Fetch Player Stats
          const playerRes = await fetch("/api/player");
          const playerData = await playerRes.json();
          if (playerData.success) {
            setPlayerData(playerData.data);
          }
        } catch (err) {
          console.error("Failed to fetch bot config or player stats", err);
        } finally {
          setLoading(false);
        }
      } else if (authStatus === "unauthenticated") {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [authStatus]);

  const handleSave = async () => {
    setSaving(true);
    setMessage({ text: "", type: "" });
    try {
      const res = await fetch("/api/bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: "Bot settings saved successfully!", type: "success" });
      } else {
        setMessage({ text: data.error || "Failed to save settings", type: "error" });
      }
    } catch {
      setMessage({ text: "Network error", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authStatus === "unauthenticated") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-bold mb-4">Login Required</h1>
        <p className="text-slate-400 mb-8 max-w-md">You need to sign in with your Roblox account to manage your bot&apos;s personality and chat with it.</p>
        <button 
          onClick={() => signIn("roblox")}
          className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20 transition-all"
        >
          Login with Roblox
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans">
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="font-bold text-lg">B</span>
            </div>
            <h1 className="font-bold text-xl tracking-tight">Manage <span className="text-slate-500 font-medium">Bot</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="text-xs font-bold uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {showSettings ? "Close Settings" : "Configure Bot"}
            </button>
            <Link href="/" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">Go Home</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-12">
        {showSettings && (
          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
            <header>
              <h2 className="text-2xl font-bold tracking-tight mb-2">Bot Personality</h2>
              <p className="text-slate-400 text-sm">Decide how your AI bot talks and behaves.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bot Name</label>
                <input 
                  type="text" 
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  placeholder="e.g. Gemma"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Owner Name</label>
                <input 
                  type="text" 
                  value={config.ownerName}
                  onChange={(e) => setConfig({ ...config, ownerName: e.target.value })}
                  placeholder={session?.user?.name || "Your Name"}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bot Instructions</label>
              <textarea 
                value={config.persona}
                onChange={(e) => setConfig({ ...config, persona: e.target.value })}
                placeholder="Describe how your bot should act... e.g. You are a helpful guide. You are polite and friendly."
                className="w-full h-32 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none text-sm font-medium leading-relaxed"
              />
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800">
              {message.text && (
                <div className={`text-sm font-medium ${message.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {message.text}
                </div>
              )}
              <button 
                onClick={handleSave}
                disabled={saving}
                className="w-full sm:w-auto px-8 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 text-sm"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Save Settings"
                )}
              </button>
            </div>
          </section>
        )}

        {/* Player Stats Dashboard */}
        {playerData && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em]">Live Game Stats</h2>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">CONNECTED</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Coins" value={playerData.coins?.toLocaleString() || "0"} icon="💰" />
              <StatCard label="Current Weapon" value={playerData.weapon || "Fist"} icon="⚔️" />
              <StatCard label="Inventory Items" value={playerData.inventory?.length || "0"} icon="🎒" />
              <StatCard label="Experience" value="Level 1" icon="✨" />
            </div>
          </section>
        )}

        <section>
          <ChatInterface companionName={config.name} />
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex items-center gap-4 hover:border-indigo-500/30 transition-colors group">
      <div className="text-2xl group-hover:scale-110 transition-transform">{icon}</div>
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-lg font-bold text-slate-100">{value}</p>
      </div>
    </div>
  );
}
