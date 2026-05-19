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
  const [sessionId] = useState(() => "chat-" + Math.random().toString(36).substring(2, 9));
  const scrollRef = useRef<HTMLDivElement>(null);

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
    <div className="flex flex-col h-full bg-black border border-[#111] rounded-xl overflow-hidden shadow-2xl">
      <div 
        ref={scrollRef}
        className="flex-grow overflow-y-auto p-6 space-y-6 scrollbar-hide"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-[#444] space-y-4">
             <p className="text-xs font-mono uppercase tracking-[0.2em]">Ready for input</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
            <div className="flex items-center gap-2 mb-1 px-1">
               <span className="text-[10px] font-bold text-[#444] uppercase tracking-widest">
                 {msg.role === 'user' ? 'You' : msg.role === 'thought' ? 'Thinking' : msg.role === 'tool' ? 'System' : companionName}
               </span>
            </div>
            <div 
              className={`max-w-[90%] rounded-lg px-4 py-3 text-[14px] leading-relaxed ${
                msg.role === "user" 
                  ? "bg-white text-black font-medium" 
                  : msg.role === "thought"
                  ? "text-[#666] border-l border-[#333] pl-4 italic rounded-none"
                  : msg.role === "tool"
                  ? "bg-[#111] border border-[#333] text-emerald-500 font-mono text-[11px]"
                  : "bg-black border border-[#333] text-white"
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-1.5 px-2">
            <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
            <div className="w-1 h-1 bg-white rounded-full animate-pulse [animation-delay:0.2s]"></div>
            <div className="w-1 h-1 bg-white rounded-full animate-pulse [animation-delay:0.4s]"></div>
          </div>
        )}
      </div>

      <div className="p-4 bg-[#050505] border-t border-[#111]">
        <div className="relative flex items-center bg-black border border-[#333] rounded-lg focus-within:border-white transition-colors">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Command agent..."
            className="flex-grow bg-transparent px-4 py-3 text-sm outline-none placeholder-[#444]"
          />
          <button
            onClick={handleSend}
            disabled={loading || !prompt.trim()}
            className="px-4 text-white opacity-50 hover:opacity-100 disabled:opacity-20 transition-opacity"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 8L15 8M15 8L8 1M15 8L8 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
