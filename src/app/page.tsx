"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const { data: session } = useSession();
  const [botConfig, setBotConfig] = useState<any>(null);
  const [playerData, setPlayerData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      setLoading(true);
      Promise.all([
        fetch("/api/bot").then(res => res.json()),
        fetch("/api/player").then(res => res.json())
      ]).then(([bot, player]) => {
        if (!bot.error) setBotConfig(bot);
        if (player.success) setPlayerData(player.data);
      }).finally(() => setLoading(false));
    }
  }, [session]);

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <div className="mb-8 p-5 bg-white rounded-3xl shadow-[0_0_50px_rgba(255,255,255,0.1)] animate-float">
           <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-black">
               <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM12 4V12L18 12M12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        </div>
        <h1 className="text-4xl font-bold tracking-tighter mb-4 text-white">Your Roblox Companion, Uplinked.</h1>
        <p className="text-[#888] max-w-sm mb-10 text-[16px] leading-relaxed">
          The official remote interface for your personal roGPT NPC. Control their personality and sync your game progress in real-time.
        </p>
        <button 
          onClick={() => signIn("roblox")}
          className="px-10 py-4 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-[#eaeaea] transition-all shadow-xl active:scale-95"
        >
          Login with Roblox
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Section */}
        <div className="lg:col-span-2 space-y-12">
          <section>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#444] mb-8 px-1">Control Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href="/bot" className="glass-card p-8 rounded-2xl flex items-center gap-6 transition-all group">
                <div className="w-14 h-14 bg-gradient-to-br from-[#111] to-black rounded-xl border border-[#222] flex items-center justify-center text-2xl group-hover:scale-105 transition-transform group-hover:border-[#444]">🤖</div>
                <div>
                  <p className="text-[10px] text-[#555] font-bold uppercase tracking-widest mb-1">NPC Profile</p>
                  <p className="font-semibold text-lg tracking-tight text-[#eaeaea] group-hover:text-white">{botConfig?.name || "Initializing..."}</p>
                </div>
              </Link>
              <Link href="/stats" className="glass-card p-8 rounded-2xl flex items-center gap-6 transition-all group">
                <div className="w-14 h-14 bg-gradient-to-br from-[#111] to-black rounded-xl border border-[#222] flex items-center justify-center text-2xl group-hover:scale-105 transition-transform group-hover:border-[#444]">💰</div>
                <div>
                  <p className="text-[10px] text-[#555] font-bold uppercase tracking-widest mb-1">In-Game Wealth</p>
                  <p className="font-semibold text-lg tracking-tight text-[#eaeaea] group-hover:text-white">{playerData?.coins?.toLocaleString() || "0"} <span className="text-xs font-normal text-[#444]">Credits</span></p>
                </div>
              </Link>
              <Link href="/game" className="glass-card p-8 rounded-2xl flex items-center gap-6 transition-all group">
                <div className="w-14 h-14 bg-gradient-to-br from-[#111] to-black rounded-xl border border-[#222] flex items-center justify-center text-2xl group-hover:scale-105 transition-transform group-hover:border-[#444]">🎮</div>
                <div>
                  <p className="text-[10px] text-[#555] font-bold uppercase tracking-widest mb-1">Connected Game</p>
                  <p className="font-semibold text-lg tracking-tight text-[#eaeaea] group-hover:text-white">Active Experience</p>
                </div>
              </Link>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-8 px-1">
               <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#444]">In-Experience Presence</h2>
               <Link href="/bot" className="text-[10px] font-bold uppercase tracking-widest text-[#444] hover:text-[#888] transition-colors">Personalize NPC</Link>
            </div>
            <div className="glass-card p-10 rounded-3xl space-y-8 relative overflow-hidden border-[#222]">
              <div className="absolute top-0 right-0 p-8">
                 <div className="px-3 py-1 bg-emerald-500/5 text-emerald-500 text-[9px] font-bold uppercase tracking-widest rounded-full border border-emerald-500/10 flex items-center gap-2">
                   <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>
                   Linked to Server
                 </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-3xl font-bold tracking-tighter text-white">{botConfig?.name || "Gemma"}</p>
                <p className="text-[13px] text-[#666] font-medium tracking-tight">Your Custom Roblox NPC Companion</p>
              </div>

              <div className="text-[16px] text-[#888] leading-[1.6] italic border-l border-[#222] pl-6 py-2 max-w-xl">
                &quot;{botConfig?.persona || "Awaiting your directives."}&quot;
              </div>

              <div className="pt-4 flex gap-3">
                 <div className="px-4 py-2 rounded-lg bg-[#080808] border border-[#111] text-[11px] font-mono text-[#444]">
                   STATUS: READY
                 </div>
                 <div className="px-4 py-2 rounded-lg bg-[#080808] border border-[#111] text-[11px] font-mono text-[#444]">
                   SYNC: ACTIVE
                 </div>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-12">
          <section>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#444] mb-8 px-1">Operator Profile</h2>
            <div className="glass-card p-8 rounded-2xl space-y-8">
               <div className="flex items-center gap-5">
                 {session.user?.image && (
                   <Image 
                     src={session.user.image} 
                     alt="Avatar" 
                     width={56}
                     height={56}
                     className="rounded-xl border border-[#222] shadow-2xl"
                   />
                 )}
                 <div>
                   <p className="font-bold text-[#eaeaea] tracking-tight">{session.user?.name}</p>
                   <p className="text-[10px] font-mono text-[#444] uppercase tracking-tighter">Verified Player</p>
                 </div>
               </div>
               <div className="flex flex-wrap gap-2 pt-2">
                 {session.user?.premium && <Badge label="Premium" color="amber" />}
                 {session.user?.verified && <Badge label="Verified" color="emerald" />}
               </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  const colors: any = {
    amber: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  };
  return (
    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border ${colors[color]}`}>
      {label}
    </span>
  );
}
