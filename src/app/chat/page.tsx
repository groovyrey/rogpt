"use client";

import { useSession } from "next-auth/react";
import { ChatInterface } from "../components/ChatInterface";

export default function ChatPage() {
  const { data: session } = useSession();
  
  return (
    <div className="flex flex-col h-[calc(100vh-104px)]">
      <div className="max-w-screen-xl mx-auto w-full px-6 py-6 border-b border-[#111] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <h1 className="text-sm font-semibold uppercase tracking-widest text-[#888]">Live Terminal</h1>
        </div>
        <div className="text-[11px] font-mono text-[#444] hidden sm:block">
          TARGET: {session?.user?.name || "Initializing..."}
        </div>
      </div>
      
      <main className="flex-grow overflow-hidden flex flex-col max-w-screen-xl mx-auto w-full px-6 py-8">
        <ChatInterface companionName={session?.user?.name || "Gemma"} />
      </main>
    </div>
  );
}
