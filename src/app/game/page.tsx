"use client";

import { useSession } from "next-auth/react";

export default function GamePage() {
  const { status: authStatus } = useSession();
  const universeId = process.env.NEXT_PUBLIC_ROGPT_UNIVERSE_ID || "10174033054";

  if (authStatus === "loading") return <div className="p-24 text-center text-sm text-slate-500">Establishing Link...</div>;

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-12 space-y-16">
      {/* Game Details Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-2 px-1">Experience Info</h2>
          <h3 className="text-3xl font-bold tracking-tighter text-slate-950">The Experience</h3>
          <p className="text-[15px] text-slate-600 leading-relaxed max-w-xs">
            You are currently uplinked to this Roblox experience. All NPC settings and progress are synchronized here.
          </p>
          <div className="pt-4">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/10">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Active Link</span>
             </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-8 p-10 glass-card rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="space-y-6">
            <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Universe Identifier</p>
               <p className="text-2xl font-mono font-bold text-slate-950 tracking-tight">{universeId}</p>
            </div>
            
            <div className="pt-6 border-t border-blue-100 space-y-4">
               <p className="text-sm text-slate-600">This interface provides remote access to your Companion in the following Roblox experience.</p>
               <a 
                 href={`https://www.roblox.com/games/refer?PlaceId=0&UniverseId=${universeId}`}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="inline-flex items-center gap-3 px-8 py-3 bg-blue-600 text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
               >
                 Launch Experience
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="7" y1="17" x2="17" y2="7"></line>
                    <polyline points="7 7 17 7 17 17"></polyline>
                 </svg>
               </a>
            </div>
          </div>
          
          {/* Subtle background decoration */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-100/60 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* Connection Architecture */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
         <div className="p-8 glass-card rounded-2xl">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Protocol</p>
            <p className="text-xl font-bold tracking-tight text-slate-950">Open Cloud v2</p>
         </div>
         <div className="p-8 glass-card rounded-2xl">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Sync Method</p>
            <p className="text-xl font-bold tracking-tight text-slate-950">Real-time Push</p>
         </div>
         <div className="p-8 glass-card rounded-2xl">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Region</p>
            <p className="text-xl font-bold tracking-tight text-slate-950">Global Edge</p>
         </div>
      </div>
    </div>
  );
}
