"use client";

import { useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<any[]>([]);
  const [botConfig, setBotConfig] = useState<any>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingBot, setLoadingBot] = useState(false);

  useEffect(() => {
    if (session) {
      setLoadingMessages(true);
      fetch("/api/messages")
        .then(res => res.json())
        .then(data => {
          if (data.messages) setMessages(data.messages);
        })
        .finally(() => setLoadingMessages(false));

      setLoadingBot(true);
      fetch("/api/bot")
        .then(res => res.json())
        .then(data => {
          if (!data.error) setBotConfig(data);
        })
        .finally(() => setLoadingBot(false));
    }
  }, [session]);

  return (
    <div className="min-h-screen bg-slate-950 p-6 selection:bg-indigo-500/30">
      <main className="max-w-4xl mx-auto space-y-8 py-12">
        {session ? (
          <>
            {/* Header / Profile Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-indigo-500/5">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {session.user?.image && (
                  <div className="relative shrink-0">
                    <Image 
                      src={session.user.image} 
                      alt="Profile" 
                      width={120}
                      height={120}
                      className="rounded-3xl border-2 border-slate-800 shadow-xl"
                    />
                    {session.user?.verified && (
                      <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-full border-4 border-slate-900 shadow-lg" title="Verified Account">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex-grow text-center md:text-left space-y-4">
                  <div>
                    <h1 className="text-4xl font-black text-white tracking-tight">
                      {session.user?.name}
                    </h1>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-1">
                      <p className="text-indigo-400 font-mono text-sm">ID: {session.user?.id}</p>
                      {session.user?.displayName && session.user.displayName !== session.user.name && (
                        <p className="text-slate-500 text-sm font-medium">@{session.user.displayName}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-center md:justify-start gap-2">
                    {session.user?.premium && (
                      <span className="px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-xs font-bold uppercase tracking-wider">Premium Member</span>
                    )}
                    {session.user?.ageBracket && (
                      <span className="px-3 py-1 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 rounded-full text-xs font-bold uppercase tracking-wider">
                        Age: {session.user.ageBracket.toString().replace('age_', '').replace('_', ' ')}
                      </span>
                    )}
                    {session.user?.verified && (
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold uppercase tracking-wider">Verified User</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3 shrink-0">
                  <Link href="/bot" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 text-center">
                    Manage Bot
                  </Link>
                  <button 
                    onClick={() => signOut()}
                    className="px-6 py-2.5 bg-slate-800 hover:bg-rose-950/30 text-rose-500 rounded-xl text-sm font-bold transition-all border border-slate-700 hover:border-rose-900/50"
                  >
                    Log Out
                  </button>
                </div>
              </div>

              {/* Bot Info Section */}
              <div className="mt-8 pt-8 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mb-4">Your AI NPC</p>
                  {loadingBot ? (
                    <div className="h-12 bg-slate-950/50 animate-pulse rounded-2xl border border-slate-800"></div>
                  ) : botConfig ? (
                    <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center text-xl">🤖</div>
                        <div>
                          <p className="text-sm font-bold text-white">{botConfig.name || "Unnamed Bot"}</p>
                          <p className="text-[10px] text-indigo-400 font-medium">Status: Active</p>
                        </div>
                      </div>
                      <Link href="/bot" className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest">Settings</Link>
                    </div>
                  ) : (
                    <div className="bg-slate-950/50 p-4 rounded-2xl border border-dashed border-slate-800 text-center">
                      <p className="text-xs text-slate-500">No bot configured yet.</p>
                      <Link href="/bot" className="text-[10px] font-bold text-indigo-400 mt-1 inline-block uppercase tracking-widest">Create One</Link>
                    </div>
                  )}
                </div>

                {/* Social Accounts */}
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mb-4">Linked Accounts</p>
                  {session.user?.social && session.user.social.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {session.user.social.map((account: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 bg-slate-950/50 px-4 py-2 rounded-xl border border-slate-800">
                          <span className="text-xs font-bold text-slate-300 capitalize">{account.provider}</span>
                          <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                          <span className="text-[10px] text-slate-500">@{account.username || 'Connected'}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 text-center">
                      <p className="text-xs text-slate-500 italic">No social accounts linked.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Messages Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-indigo-500/5">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                  Recent Messages
                </h2>
                <Link href="/chat" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest">Open Chat</Link>
              </div>

              {loadingMessages ? (
                <div className="py-12 flex justify-center">
                  <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : messages.length > 0 ? (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {messages.slice(-10).map((msg: any, idx: number) => (
                    <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${
                        msg.role === 'user' 
                          ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-500/10' 
                          : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700/50'
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.parts?.[0]?.text || "No text content"}</p>
                      </div>
                      <span className="text-[9px] text-slate-600 mt-1 uppercase font-bold tracking-tighter px-1">
                        {msg.role === 'user' ? 'You' : (botConfig?.name || 'Bot')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center border-2 border-dashed border-slate-800 rounded-2xl">
                  <p className="text-slate-500 text-sm">No recent messages found.</p>
                  <Link href="/chat" className="text-indigo-400 text-xs font-bold mt-2 inline-block">Start a new conversation</Link>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center shadow-2xl shadow-indigo-500/10">
            <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mx-auto mb-8 transform hover:rotate-12 transition-transform">
              <span className="font-bold text-4xl text-white">R</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight mb-4">
              Welcome to roGPT
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed mb-10">
              Connect your Roblox account to access the AI bot and view your game stats.
            </p>
            <button 
              onClick={() => signIn("roblox")}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
              Login with Roblox
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
