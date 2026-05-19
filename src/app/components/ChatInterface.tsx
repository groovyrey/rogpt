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
    <div className="flex flex-col h-full glass-card rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-[#222]">
      <div 
        ref={scrollRef}
        className="flex-grow overflow-y-auto p-8 space-y-8 scrollbar-hide"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-[#333] space-y-4">
             <div className="w-12 h-12 rounded-full border border-[#111] flex items-center justify-center">
                <div className="w-2 h-2 bg-[#222] rounded-full animate-ping"></div>
             </div>
             <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-50">Awaiting Neural Uplink</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
            <div className={`flex items-center gap-2 mb-2 px-1 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
               <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${msg.role === 'user' ? 'text-white' : 'text-[#666]'}`}>
                 {msg.role === 'user' ? 'Operator' : msg.role === 'thought' ? 'Internal Logic' : msg.role === 'tool' ? 'Subroutine' : companionName}
               </span>
               <div className={`w-1 h-1 rounded-full ${msg.role === 'user' ? 'bg-white' : 'bg-[#333]'}`}></div>
            </div>
            <div 
              className={`max-w-[85%] rounded-2xl px-5 py-3 text-[14px] leading-relaxed transition-all ${
                msg.role === "user" 
                  ? "bg-white text-black font-medium shadow-[0_10px_30px_rgba(255,255,255,0.05)]" 
                  : msg.role === "thought"
                  ? "text-[#555] border-l-2 border-[#111] pl-6 italic rounded-none mb-4"
                  : msg.role === "tool"
                  ? "bg-[#080808] border border-[#111] text-emerald-500/80 font-mono text-[10px] py-2 px-4 rounded-lg"
                  : "bg-[#0a0a0a] border border-[#222] text-[#eaeaea] shadow-2xl"
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 px-4 py-2 bg-[#050505] border border-[#111] rounded-full w-fit animate-pulse">
            <div className="w-1 h-1 bg-white/20 rounded-full"></div>
            <div className="text-[9px] font-bold text-[#333] uppercase tracking-widest">Processing</div>
          </div>
        )}
      </div>

      <div className="p-6 bg-black/80 backdrop-blur-xl border-t border-[#111]">
        <div className="relative flex items-center bg-[#050505] border border-[#222] rounded-xl focus-within:border-[#444] transition-all group shadow-inner">
          <div className="pl-4 text-[#333]">
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
            className="flex-grow bg-transparent px-3 py-4 text-[13px] outline-none placeholder-[#222] text-[#eaeaea] font-medium"
          />
          <button
            onClick={handleSend}
            disabled={loading || !prompt.trim()}
            className="mr-3 p-2 text-black bg-white rounded-lg hover:bg-[#ccc] disabled:opacity-10 transition-all active:scale-90"
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
