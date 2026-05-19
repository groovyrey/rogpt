"use client";

import Link from "next/link";
import { ChatInterface } from "../components/ChatInterface";
import { useSession } from "next-auth/react";

export default function ChatPage() {
  const { data: session } = useSession();
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans">
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
              <span className="font-bold text-lg">C</span>
            </div>
            <h1 className="font-bold text-xl tracking-tight">Global <span className="text-slate-500 font-medium">Chat</span></h1>
          </div>
          <Link href="/" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">Go Home</Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <ChatInterface companionName={session?.user?.name || "Gemma"} />
      </main>
    </div>
  );
}
