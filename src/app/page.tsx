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
        <div className="mb-8 p-4 bg-white rounded-2xl">
           <svg width="40" height="40" viewBox="0 0 76 65" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-black">
               <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="currentColor"/>
            </svg>
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Connect to roGPT</h1>
        <p className="text-[#888] max-w-sm mb-10 text-[15px] leading-relaxed">
          Manage your Roblox AI NPCs and monitor game statistics in a unified dashboard.
        </p>
        <button 
          onClick={() => signIn("roblox")}
          className="px-10 py-3 bg-white text-black font-semibold rounded-lg hover:bg-[#eaeaea] transition-all"
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
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-6 text-white tracking-tight">Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/bot" className="p-6 bg-[#000] border border-[#333] rounded-xl flex items-center gap-5 hover:border-[#555] transition-all group">
                <div className="w-12 h-12 bg-[#111] rounded-full border border-[#333] flex items-center justify-center text-xl group-hover:scale-110 transition-transform">🤖</div>
                <div>
                  <p className="text-[10px] text-[#888] font-bold uppercase tracking-widest mb-0.5">Agent Status</p>
                  <p className="font-semibold text-[15px]">{botConfig?.name || "Initializing..."}</p>
                </div>
              </Link>
              <Link href="/stats" className="p-6 bg-[#000] border border-[#333] rounded-xl flex items-center gap-5 hover:border-[#555] transition-all group">
                <div className="w-12 h-12 bg-[#111] rounded-full border border-[#333] flex items-center justify-center text-xl group-hover:scale-110 transition-transform">💰</div>
                <div>
                  <p className="text-[10px] text-[#888] font-bold uppercase tracking-widest mb-0.5">Total Coins</p>
                  <p className="font-semibold text-[15px]">{playerData?.coins?.toLocaleString() || "0"}</p>
                </div>
              </Link>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-6">
               <h2 className="text-xl font-semibold text-white tracking-tight">Active Agent</h2>
               <Link href="/bot" className="text-xs font-bold uppercase tracking-widest text-[#888] hover:text-white transition-colors">Manage</Link>
            </div>
            <div className="p-8 bg-[#000] border border-[#333] rounded-xl space-y-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-2xl font-bold tracking-tight">{botConfig?.name || "Gemma"}</p>
                  <p className="text-sm text-[#888]">Primary NPC Assistant</p>
                </div>
                <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase rounded-full border border-emerald-500/20">
                  Online
                </div>
              </div>
              <div className="text-[15px] text-[#888] leading-relaxed italic border-l-2 border-[#333] pl-4 py-1">
                &quot;{botConfig?.persona || "No instructions set."}&quot;
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-6">User</h2>
            <div className="p-6 bg-[#000] border border-[#333] rounded-xl space-y-6">
               <div className="flex items-center gap-4">
                 {session.user?.image && (
                   <Image 
                     src={session.user.image} 
                     alt="Avatar" 
                     width={48}
                     height={48}
                     className="rounded-full border border-[#333]"
                   />
                 )}
                 <div>
                   <p className="font-semibold">{session.user?.name}</p>
                   <p className="text-xs text-[#888]">ID: {session.user?.id}</p>
                 </div>
               </div>
               <div className="flex flex-wrap gap-2 pt-2">
                 {session.user?.premium && <Badge label="Premium" color="amber" />}
                 {session.user?.verified && <Badge label="Verified" color="emerald" />}
               </div>
            </div>
          </section>

          <section>
             <h2 className="text-xl font-semibold mb-6">Environment</h2>
             <div className="p-6 bg-[#000] border border-[#333] rounded-xl space-y-4">
               <div className="flex justify-between text-sm">
                 <span className="text-[#888]">Universe ID</span>
                 <span className="font-mono text-xs">{process.env.NEXT_PUBLIC_ROGPT_UNIVERSE_ID || "10174033054"}</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-[#888]">Deployment</span>
                 <span className="text-white">Production</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-[#888]">Region</span>
                 <span className="text-white">Global</span>
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
