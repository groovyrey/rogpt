"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";

export default function CompanionPage() {
  const { data: session, status: authStatus } = useSession();
  const [config, setConfig] = useState({
    name: "Gemma",
    persona: "",
    ownerName: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    const fetchConfig = async () => {
      if (authStatus === "authenticated") {
        try {
          const res = await fetch("/api/companion");
          const data = await res.json();
          if (!data.error) {
            setConfig(data);
          }
        } catch (err) {
          console.error("Failed to fetch companion config", err);
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
      const res = await fetch("/api/companion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: "Companion settings saved successfully!", type: "success" });
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
        <p className="text-slate-400 mb-8 max-w-md">You need to sign in with your Roblox account to manage your companion&apos;s personality and data.</p>
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
            <h1 className="font-bold text-xl tracking-tight">Bot <span className="text-slate-500 font-medium">Settings</span></h1>
          </div>
          <Link href="/" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">Go Home</Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-8">
          <header>
            <h2 className="text-3xl font-extrabold tracking-tight mb-2">How your bot acts</h2>
            <p className="text-slate-400">Decide how your AI bot talks and behaves with players.</p>
          </header>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bot Name</label>
                <input 
                  type="text" 
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  placeholder="e.g. Gemma"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Owner Name</label>
                <input 
                  type="text" 
                  value={config.ownerName}
                  onChange={(e) => setConfig({ ...config, ownerName: e.target.value })}
                  placeholder={session?.user?.name || "Your Name"}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex justify-between">
                <span>Bot instructions</span>
                <span className="text-indigo-400 normal-case tracking-normal">Gemma AI</span>
              </label>
              <textarea 
                value={config.persona}
                onChange={(e) => setConfig({ ...config, persona: e.target.value })}
                placeholder="Describe how your bot should act... e.g. You are a helpful guide. You are polite and friendly."
                className="w-full h-48 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none font-medium leading-relaxed"
              />
              <p className="text-[10px] text-slate-500 italic">These notes tell the AI how to behave in your game.</p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800 mt-8">
              {message.text && (
                <div className={`text-sm font-medium ${message.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {message.text}
                </div>
              )}
              <button 
                onClick={handleSave}
                disabled={saving}
                className="w-full sm:w-auto px-10 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                )}
                Save Settings
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h4 className="font-bold mb-4 flex items-center gap-2">
                <span className="text-xl">💾</span>
                Save Data
              </h4>
              <p className="text-sm text-slate-500 mb-6">Your bot stores things it learns about players in your game data.</p>
              <Link href="/ds" className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-widest hover:text-indigo-300">
                View Game Data
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </Link>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h4 className="font-bold mb-4 flex items-center gap-2">
                <span className="text-xl">💬</span>
                Chat Test
              </h4>
              <p className="text-sm text-slate-500 mb-6">Try talking to your bot right now to see how it works.</p>
              <Link href="/test" className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-widest hover:text-indigo-300">
                Start Chatting
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
