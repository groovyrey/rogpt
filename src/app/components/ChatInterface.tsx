"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Message {
  role: "user" | "model" | "thought" | "tool";
  text: string;
}

interface ChatInterfaceProps {
  companionName?: string;
}

export function ChatInterface({ companionName = "Gemma" }: ChatInterfaceProps) {
  const { data: session } = useSession();
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [ownerName, setOwnerName] = useState("Player");
  const [sessionId, setSessionId] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSessionId("chat-" + Math.random().toString(36).substring(2, 9));
  }, []);

  useEffect(() => {
    if (session?.user?.name) {
      setOwnerName(session.user.name);
    }
  }, [session]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!prompt.trim() || loading) return;

    const userMsg: Message = { role: "user", text: prompt };
    setMessages((prev) => [...prev, userMsg]);
    setPrompt("");
    setLoading(true);

    try {
      const res = await fetch("/api/gemma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt,
          sessionId: sessionId,
          companionName: companionName,
          ownerName: ownerName,
          ownerUserId: session?.user?.id,
          minimal: true,
        }),
      });

      const data = await res.json();

      if (data.success) {
        if (data.thoughts) {
          setMessages((prev) => [...prev, { role: "thought", text: data.thoughts }]);
        }
        
        if (data.toolCalls && data.toolCalls.length > 0) {
          data.toolCalls.forEach((tool: any) => {
            setMessages((prev) => [...prev, { 
              role: "tool", 
              text: `Action: ${tool.name} (${JSON.stringify(tool.args)})` 
            }]);
          });
        }

        setMessages((prev) => [...prev, { role: "model", text: data.text }]);
      } else {
        setMessages((prev) => [...prev, { role: "model", text: "Error: " + (data.error || "Unknown error") }]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: "model", text: "Error: " + (err as Error).message }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-xl shadow-blue-950/5">
      <div 
        ref={scrollRef}
        className="flex-grow overflow-y-auto p-8 space-y-8 scrollbar-hide"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4">
             <div className="w-12 h-12 rounded-full border border-blue-100 bg-blue-50 flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
             </div>
             <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-50">Awaiting Neural Uplink</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
            <div className={`flex items-center gap-2 mb-2 px-1 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
               <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${msg.role === 'user' ? 'text-blue-700' : 'text-slate-400'}`}>
                 {msg.role === 'user' ? 'Operator' : msg.role === 'thought' ? 'Internal Logic' : msg.role === 'tool' ? 'Subroutine' : companionName}
               </span>
               <div className={`w-1 h-1 rounded-full ${msg.role === 'user' ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
            </div>
            <div 
              className={`max-w-[85%] rounded-2xl px-5 py-3 text-[14px] leading-relaxed transition-all ${
                msg.role === "user" 
                  ? "bg-blue-600 text-white font-medium shadow-lg shadow-blue-600/15" 
                  : msg.role === "thought"
                  ? "text-slate-500 border-l-2 border-blue-100 pl-6 italic rounded-none mb-4"
                  : msg.role === "tool"
                  ? "bg-emerald-50 border border-emerald-100 text-emerald-700 font-mono text-[10px] py-2 px-4 rounded-lg"
                  : "bg-slate-50 border border-blue-100 text-slate-700 shadow-sm"
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full w-fit animate-pulse">
            <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
            <div className="text-[9px] font-bold text-blue-700 uppercase tracking-widest">Processing</div>
          </div>
        )}
      </div>

      <div className="border-t border-blue-100 bg-blue-50/70 p-4 sm:p-6">
        <div className="relative flex items-center rounded-xl border border-blue-100 bg-white shadow-sm transition-all focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100">
          <div className="pl-4 text-blue-400">
             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
             </svg>
          </div>
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={`Transmit command to ${companionName}...`}
            className="flex-grow bg-transparent px-3 py-4 text-[13px] outline-none placeholder-slate-400 text-slate-900 font-medium"
          />
          <button
            onClick={handleSend}
            disabled={loading || !prompt.trim()}
            className="mr-3 rounded-lg bg-blue-600 p-2 text-white transition-all hover:bg-blue-700 disabled:opacity-30 active:scale-90"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
               <line x1="22" y1="2" x2="11" y2="13"></line>
               <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
