"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { ChatInterface } from "../components/ChatInterface";

export default function ChatPage() {
  const { data: session } = useSession();
  const [botName, setBotName] = useState("Agent");

  useEffect(() => {
    fetch("/api/bot")
      .then(res => res.json())
      .then(data => {
        if (data.name) setBotName(data.name);
      })
      .catch(err => console.error("Failed to fetch bot name", err));
  }, []);
  
  return (
    <div className="flex flex-col h-[calc(100vh-104px)] bg-radial-gradient">
      <div className="mx-auto flex w-full max-w-screen-xl items-center justify-between border-b border-blue-100 bg-white/80 px-6 py-6 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse"></div>
          <h1 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Companion Direct Link</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-[10px] font-mono text-slate-400 hidden md:flex items-center gap-2">
            <span className="w-1 h-1 bg-blue-300 rounded-full"></span>
            IN-GAME STATUS: ONLINE
          </div>
          <div className="px-3 py-1 rounded-full border border-blue-100 bg-blue-50 text-[10px] font-bold text-blue-700 uppercase tracking-widest">
            {botName}
          </div>
        </div>
      </div>
      
      <main className="flex-grow overflow-hidden flex flex-col max-w-screen-xl mx-auto w-full px-6 py-8">
        <ChatInterface companionName={botName} />
      </main>
    </div>
  );
}
