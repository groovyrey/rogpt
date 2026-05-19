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
      <div className="max-w-screen-xl mx-auto w-full px-6 py-6 border-b border-[#111] flex items-center justify-between bg-black/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse"></div>
          <h1 className="text-xs font-black uppercase tracking-[0.3em] text-[#444]">Companion Direct Link</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-[10px] font-mono text-[#333] hidden md:flex items-center gap-2">
            <span className="w-1 h-1 bg-[#222] rounded-full"></span>
            IN-GAME STATUS: ONLINE
          </div>
          <div className="px-3 py-1 rounded-full border border-[#222] bg-[#080808] text-[10px] font-bold text-[#666] uppercase tracking-widest">
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
