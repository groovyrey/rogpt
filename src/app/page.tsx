"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();
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
    } catch {
      setStatus({
        roblox: "offline",
        gemma: "offline",
        lastUpdate: new Date().toLocaleTimeString(),
      });
    }
  };

  useEffect(() => {
    const init = async () => {
      await checkStatus();
    };
    init();
    const interval = setInterval(checkStatus, 30000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 min-h-16 flex items-center justify-between py-3 sm:py-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0 transform hover:rotate-12 transition-transform">
              <span className="font-bold text-xl">R</span>
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight leading-none">roGPT</h1>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Internal Hub</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6 mr-6 border-r border-slate-800 pr-6">
              <Link href="/ds" className="text-sm font-medium text-slate-400 hover:text-indigo-400 transition-colors">Explorer</Link>
              <Link href="/test" className="text-sm font-medium text-slate-400 hover:text-indigo-400 transition-colors">Playground</Link>
            </nav>

            {session ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-tight">Verified Dev</p>
                  <p className="text-sm font-semibold text-slate-200">{session.user?.name}</p>
                </div>
                {session.user?.image && (
                  <div className="relative group">
                    <img 
                      src={session.user.image} 
                      alt="Profile" 
                      className="w-10 h-10 rounded-xl border-2 border-slate-800 group-hover:border-indigo-500 transition-all cursor-pointer"
                    />
                    <div className="absolute inset-0 bg-indigo-600/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                  </div>
                )}
                <button 
                  onClick={() => signOut()}
                  className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                  title="Logout"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                </button>
              </div>
            ) : (
              <button 
                onClick={() => signIn("roblox")}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
                Login with Roblox
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <section className="mb-16">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
                Welcome back, <span className="text-indigo-500">{session?.user?.name?.split(' ')[0] || "Developer"}</span>.
              </h2>
              <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
                Your centralized command center for the Gemma AI & Roblox integration. Manage DataStores, test NPC logic, and monitor bridge status.
              </p>
            </div>
            {!session && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-4 items-center">
                <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-500 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-200 uppercase tracking-tight">Login Required</h4>
                  <p className="text-xs text-amber-200/60">Connect your Roblox account to access restricted management tools.</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Quick Actions Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <ActionCard 
            title="NPC Playground" 
            desc="Chat with Gemma AI and test owner-loyalty protocols in real-time."
            href="/test"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="m12 14 4-4-4-4M3 3h18v18H3z"/></svg>}
            label="Open Studio"
          />
          <ActionCard 
            title="Open Cloud Explorer" 
            desc="Direct access to your universe DataStores and Messaging Service."
            href="/ds"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/></svg>}
            label="Manage Data"
            disabled={!session}
          />
          <ActionCard 
            title="System Diagnostics" 
            desc="Monitor bridge latency, API health, and model response metrics."
            href="#"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-400"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>}
            label="View Logs"
            secondary
          />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Status Panel */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                  Service Health
                </h3>
                <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                  Live Updates Active
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <HealthCard 
                  title="Roblox Bridge" 
                  subtitle="HttpService Endpoint"
                  status={status.roblox}
                  endpoint="/api/roblox"
                  meta={`Last Check: ${status.lastUpdate || '...'}`}
                />
                <HealthCard 
                  title="Gemma AI Node" 
                  subtitle="26B-A4B-IT Model"
                  status={status.gemma}
                  endpoint="/api/gemma"
                  meta="Minimal Thinking Default"
                />
              </div>

              <div className="mt-8 pt-8 border-t border-slate-800">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Integration Capabilities</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Badge icon="🛡️" label="Owner Aware" />
                  <Badge icon="⚡" label="Low Latency" />
                  <Badge icon="💾" label="Redis Sync" />
                  <Badge icon="🎭" label="Emote Bridge" />
                </div>
              </div>
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-sm h-fit">
            <h3 className="text-xl font-bold mb-8">System Activity</h3>
            <div className="space-y-8">
              <ActivityItem 
                time="Recent" 
                title="Auth Refactored" 
                desc="Transitioned to Roblox OIDC with ES256 support." 
                type="update"
              />
              <ActivityItem 
                time="Recent" 
                title="Open Cloud v1" 
                desc="DataStore & Messaging Service endpoints active." 
                type="success"
              />
              <ActivityItem 
                time="Static" 
                title="Gemma-4" 
                desc="Model optimized for minimal reasoning mode." 
                type="info"
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-800/50 mt-12 flex flex-col sm:flex-row justify-between items-center gap-6 text-slate-500 text-sm font-medium">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-slate-800 rounded flex items-center justify-center font-bold text-[10px]">R</div>
          <p>roGPT &bull; internal_v0.2.0</p>
        </div>
        <div className="flex gap-8">
          <Link href="/ds" className="hover:text-indigo-400 transition-colors uppercase tracking-widest text-[10px]">Cloud</Link>
          <Link href="/test" className="hover:text-indigo-400 transition-colors uppercase tracking-widest text-[10px]">Studio</Link>
          <a href="#" className="hover:text-indigo-400 transition-colors uppercase tracking-widest text-[10px]">Docs</a>
        </div>
      </footer>
    </div>
  );
}

interface ActionCardProps {
  title: string;
  desc: string;
  href: string;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  secondary?: boolean;
}

function ActionCard({ title, desc, href, icon, label, disabled, secondary }: ActionCardProps) {
  return (
    <div className={`group relative bg-slate-900 border ${disabled ? 'border-slate-800 opacity-60' : 'border-slate-800 hover:border-indigo-500/50'} rounded-3xl p-8 transition-all overflow-hidden shadow-sm`}>
      <div className="relative z-10">
        <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-slate-100 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed mb-8">{desc}</p>
        
        {disabled ? (
          <div className="flex items-center gap-2 text-rose-500/80 text-[10px] font-bold uppercase tracking-widest">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Requires Login
          </div>
        ) : (
          <Link 
            href={href}
            className={`inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${secondary ? 'text-slate-400 hover:text-white' : 'text-indigo-400 hover:text-indigo-300'} transition-colors`}
          >
            {label}
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </Link>
        )}
      </div>
      <div className={`absolute top-0 right-0 w-32 h-32 ${secondary ? 'bg-slate-500/5' : 'bg-indigo-600/5'} blur-3xl -mr-16 -mt-16 rounded-full group-hover:scale-150 transition-transform duration-700`}></div>
    </div>
  );
}

interface HealthCardProps {
  title: string;
  subtitle: string;
  status: "online" | "offline" | "loading";
  endpoint: string;
  meta: string;
}

function HealthCard({ title, subtitle, status, endpoint, meta }: HealthCardProps) {
  return (
    <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h4 className="font-bold text-slate-200">{title}</h4>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{subtitle}</p>
        </div>
        <StatusBadge status={status} />
      </div>
      <div className="flex items-end justify-between">
        <div className="text-[10px] text-slate-600 font-mono tracking-tight">{endpoint}</div>
        <div className="text-[10px] text-slate-500 italic font-medium">{meta}</div>
      </div>
      <div className={`absolute bottom-0 left-0 h-0.5 ${status === 'online' ? 'bg-emerald-500' : 'bg-rose-500'} w-0 group-hover:w-full transition-all duration-500`}></div>
    </div>
  );
}

function StatusBadge({ status }: { status: "online" | "offline" | "loading" }) {
  if (status === "loading") {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
        <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-pulse"></div>
        Syncing
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
      status === "online" 
        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
        : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
    }`}>
      <div className={`w-1.5 h-1.5 rounded-full ${status === 'online' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
      {status}
    </div>
  );
}

function Badge({ icon, label }: { icon: string, label: string }) {
  return (
    <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-2 rounded-xl border border-slate-800">
      <span className="text-xs">{icon}</span>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{label}</span>
    </div>
  );
}

function ActivityItem({ time, title, desc, type }: { time: string, title: string, desc: string, type: "update" | "success" | "info" }) {
  const colors = {
    update: "bg-indigo-500 shadow-indigo-500/40",
    success: "bg-emerald-500 shadow-emerald-500/40",
    info: "bg-slate-500 shadow-slate-500/40"
  };

  return (
    <div className="flex gap-4 group">
      <div className="relative flex flex-col items-center">
        <div className={`w-2.5 h-2.5 rounded-full ${colors[type]} z-10 shadow-lg group-hover:scale-125 transition-transform`}></div>
        <div className="w-px flex-grow bg-slate-800 absolute top-2.5"></div>
      </div>
      <div className="pb-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-600 uppercase font-bold tracking-tight">{time}</span>
          <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
          <h4 className="text-xs font-bold text-slate-300 group-hover:text-indigo-400 transition-colors">{title}</h4>
        </div>
        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
