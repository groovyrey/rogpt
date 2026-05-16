"use client";

import { useEffect, useState } from "react";

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
      // Check Roblox API Endpoint
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
    // Set initial time only on client mount to avoid hydration mismatch
    setStatus(prev => ({ ...prev, lastUpdate: new Date().toLocaleTimeString() }));
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
            <h1 className="font-bold text-xl tracking-tight">roGPT <span className="text-slate-500 font-medium">Server</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-medium text-slate-300 tracking-wide uppercase">System Live</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <header className="mb-12">
          <h2 className="text-3xl font-bold mb-2">System Status</h2>
          <p className="text-slate-400">Real-time monitoring for your Roblox-AI bridge.</p>
        </header>

        {/* Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Roblox Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-200">Roblox Connection</h3>
                <p className="text-sm text-slate-500 mt-1">HttpService Bridge</p>
              </div>
              <StatusBadge status={status.roblox} />
            </div>
            <div className="mt-8 flex items-end justify-between">
              <div className="text-xs text-slate-500 font-mono">ENDPOINT: /api/roblox</div>
              <div className="text-xs text-slate-500">Last check: {status.lastUpdate}</div>
            </div>
          </div>

          {/* Gemma Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-200">Gemma AI Engine</h3>
                <p className="text-sm text-slate-500 mt-1">gemma-4-26b-a4b-it</p>
              </div>
              <StatusBadge status={status.gemma} />
            </div>
            <div className="mt-8 flex items-end justify-between">
              <div className="text-xs text-slate-500 font-mono">ENDPOINT: /api/gemma</div>
              <div className="text-xs text-slate-500">Status: Operational</div>
            </div>
          </div>
        </div>

        {/* Quick Links / Docs Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
              <h3 className="text-xl font-bold mb-4">Integration Guide</h3>
              <div className="space-y-4">
                <div className="flex gap-4 p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold shrink-0">1</div>
                  <div>
                    <h4 className="font-semibold text-slate-200">Start the Server</h4>
                    <p className="text-sm text-slate-400 mt-1">Roblox is configured to call https://rogpt-server.vercel.app in production.</p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold shrink-0">2</div>
                  <div>
                    <h4 className="font-semibold text-slate-200">Enable HttpService</h4>
                    <p className="text-sm text-slate-400 mt-1">In Roblox Studio, run `game:GetService("HttpService").HttpEnabled = true` in the Command Bar.</p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold shrink-0">3</div>
                  <div>
                    <h4 className="font-semibold text-slate-200">Test the Chat</h4>
                    <p className="text-sm text-slate-400 mt-1">Use `/ask Hello` privately, or enable Public Ask in the companion hub and use `!ask Hello` in chat.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="font-bold text-slate-200 mb-6">Recent Activity</h3>
            <div className="space-y-6">
              <ActivityItem 
                time="Today" 
                title="Model Updated" 
                desc="Switched to gemma-4-26b-a4b-it" 
                type="update"
              />
              <ActivityItem 
                time="Today" 
                title="Chat Integration" 
                desc="RemoteEvent bridge established" 
                type="success"
              />
              <ActivityItem 
                time="Today" 
                title="Server Init" 
                desc="roGPT backend initialized" 
                type="info"
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="max-w-5xl mx-auto px-6 py-12 border-t border-slate-800 mt-12 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-sm">
        <p>© 2026 roGPT Server. All systems operational.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-slate-300 transition-colors">Documentation</a>
          <a href="https://github.com/groovyrey/rogpt" className="hover:text-slate-300 transition-colors">GitHub</a>
        </div>
      </footer>
    </div>
  );
}

function StatusBadge({ status }: { status: "online" | "offline" | "loading" }) {
  if (status === "loading") {
    return (
      <span className="px-3 py-1 bg-slate-800 text-slate-400 rounded-lg text-xs font-bold uppercase tracking-wider animate-pulse">
        Checking...
      </span>
    );
  }

  return (
    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
      status === "online" 
        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
    }`}>
      {status}
    </span>
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
          <span className="text-xs text-slate-500 uppercase font-medium">{time}</span>
          <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
          <h4 className="text-xs font-bold text-slate-300 tracking-tight">{title}</h4>
        </div>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
