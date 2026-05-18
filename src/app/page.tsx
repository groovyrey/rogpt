"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Home() {
  const [status, setStatus] = useState<{
    roblox: "online" | "offline" | "loading";
    gemma: "online" | "offline" | "loading";
    lastUpdate: string;
  }>({
    roblox: "loading",
    gemma: "loading",
    lastUpdate: "",
  });

  const checkStatus = async () => {
    try {
      const robloxRes = await fetch("/api/roblox");
      const robloxData = await robloxRes.json();
      
      setStatus({
        roblox: robloxData.status === "online" ? "online" : "offline",
        gemma: "online", 
        lastUpdate: new Date().toLocaleTimeString(),
      });
    } catch (error) {
      setStatus({
        roblox: "offline",
        gemma: "offline",
        lastUpdate: new Date().toLocaleTimeString(),
      });
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="font-bold text-lg">R</span>
            </div>
            <h1 className="font-bold text-xl tracking-tight">roGPT</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/test" 
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-sm font-medium transition-all shadow-lg shadow-indigo-500/20"
            >
              Open Playground
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <header className="mb-12">
          <h2 className="text-4xl font-extrabold mb-4 tracking-tight">Project Dashboard</h2>
          <p className="text-slate-400 text-lg">Managing the Gemma AI & Roblox integration.</p>
        </header>

        {/* Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Roblox Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-200">Roblox Bridge</h3>
                <p className="text-sm text-slate-500 mt-1">HttpService Connection</p>
              </div>
              <StatusBadge status={status.roblox} />
            </div>
            <div className="mt-8 flex items-end justify-between">
              <div className="text-xs text-slate-500 font-mono uppercase tracking-wider">/api/roblox</div>
              <div className="text-xs text-slate-500 italic">Checked: {status.lastUpdate || "..."}</div>
            </div>
          </div>

          {/* Gemma Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-200">Gemma 4 IT</h3>
                <p className="text-sm text-slate-500 mt-1">26B-A4B-IT Model</p>
              </div>
              <StatusBadge status={status.gemma} />
            </div>
            <div className="mt-8 flex items-end justify-between">
              <div className="text-xs text-slate-500 font-mono uppercase tracking-wider">/api/gemma</div>
              <div className="text-xs text-indigo-400 font-semibold uppercase tracking-widest text-[10px]">Minimal Mode Default</div>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-indigo-600/5 border border-indigo-500/20 rounded-2xl p-8">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                Core Capabilities
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FeatureCard 
                  title="Owner Aware" 
                  desc="AI recognizes you as its owner and maintains loyalty."
                />
                <FeatureCard 
                  title="Ultra Fast" 
                  desc="Minimal Thinking mode enabled by default for instant NPC chat."
                />
                <FeatureCard 
                  title="Memory Store" 
                  desc="NPCs remember facts about players between sessions."
                />
                <FeatureCard 
                  title="Emote Bridge" 
                  desc="AI can trigger Roblox animations and emotes physically."
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="font-bold text-slate-200 mb-6">System Log</h3>
            <div className="space-y-6">
              <ActivityItem 
                time="Recent" 
                title="Thinking Refactored" 
                desc="Defaulted to minimal tier for 2x speed." 
                type="update"
              />
              <ActivityItem 
                time="Recent" 
                title="Owner Identity" 
                desc="Loyalty protocols integrated into persona." 
                type="success"
              />
              <ActivityItem 
                time="Static" 
                title="Model Locked" 
                desc="Gemma-4-26b-a4b-it active." 
                type="info"
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="max-w-5xl mx-auto px-6 py-12 border-t border-slate-800 mt-12 flex justify-between items-center text-slate-500 text-sm font-medium">
        <p>roGPT &bull; Personal Project</p>
        <div className="flex gap-6">
          <Link href="/test" className="hover:text-indigo-400 transition-colors uppercase tracking-widest text-[10px]">Test API</Link>
        </div>
      </footer>
    </div>
  );
}

function StatusBadge({ status }: { status: "online" | "offline" | "loading" }) {
  if (status === "loading") {
    return (
      <span className="px-3 py-1 bg-slate-800 text-slate-400 rounded-lg text-[10px] font-bold uppercase tracking-wider animate-pulse">
        Syncing
      </span>
    );
  }

  return (
    <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
      status === "online" 
        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
    }`}>
      {status}
    </span>
  );
}

function FeatureCard({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
      <h4 className="font-bold text-slate-200 text-sm mb-1">{title}</h4>
      <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
    </div>
  );
}

function ActivityItem({ time, title, desc, type }: { time: string, title: string, desc: string, type: "update" | "success" | "info" }) {
  const colors = {
    update: "bg-indigo-500",
    success: "bg-emerald-500",
    info: "bg-slate-500"
  };

  return (
    <div className="flex gap-4">
      <div className="relative flex flex-col items-center">
        <div className={`w-2 h-2 rounded-full ${colors[type]} z-10`}></div>
        <div className="w-px flex-grow bg-slate-800 absolute top-2"></div>
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-600 uppercase font-bold tracking-tight">{time}</span>
          <span className="w-1 h-1 bg-slate-800 rounded-full"></span>
          <h4 className="text-xs font-bold text-slate-300">{title}</h4>
        </div>
        <p className="text-[11px] text-slate-500 mt-1 leading-tight">{desc}</p>
      </div>
    </div>
  );
}
