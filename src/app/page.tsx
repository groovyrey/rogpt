"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 selection:bg-indigo-500/30">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-indigo-500/10 text-center">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mx-auto mb-6 transform hover:rotate-12 transition-transform">
          <span className="font-bold text-3xl text-white">R</span>
        </div>

        {session ? (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
                Hi, <span className="text-indigo-400">{session.user?.name?.split(' ')[0]}</span>!
              </h1>
              <p className="text-slate-400 text-sm leading-relaxed">
                You are logged into your roGPT control center.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {/* @ts-expect-error - Custom session field */}
              {session.user?.verified && (
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-md text-[10px] font-bold uppercase tracking-tight">Verified</span>
              )}
              {/* @ts-expect-error - Custom session field */}
              {session.user?.premium && (
                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-md text-[10px] font-bold uppercase tracking-tight">Premium</span>
              )}
              {/* @ts-expect-error - Custom session field */}
              {session.user?.ageBracket && (
                <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 rounded-md text-[10px] font-bold uppercase tracking-tight">
                  {/* @ts-expect-error - Custom session field */}
                  {session.user.ageBracket.replace('age_', '').replace('_', ' ')}
                </span>
              )}
            </div>

            {session.user?.image && (
              <div className="flex justify-center">
                <img 
                  src={session.user.image} 
                  alt="Profile" 
                  className="w-20 h-20 rounded-2xl border-2 border-slate-800 shadow-md"
                />
              </div>
            )}

            <div className="pt-4">
              <button 
                onClick={() => signOut()}
                className="w-full py-3 bg-slate-950 hover:bg-rose-950/30 text-rose-500 rounded-xl text-sm font-bold transition-all border border-slate-800 hover:border-rose-900/50"
              >
                Log Out
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
                Welcome to roGPT
              </h1>
              <p className="text-slate-400 text-sm leading-relaxed">
                Connect your Roblox account to start using the AI tools.
              </p>
            </div>

            <button 
              onClick={() => signIn("roblox")}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
              Login with Roblox
            </button>
            
            <p className="text-[10px] text-slate-600 uppercase tracking-[0.2em] font-bold">
              Secure Login
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
