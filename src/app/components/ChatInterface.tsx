"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Message {
  role: "user" | "model" | "thought" | "tool";
  text: string;
}

interface ChatInterfaceProps {
  companionName?: string;
  showTitle?: boolean;
}

export function ChatInterface({ companionName = "Gemma", showTitle = true }: ChatInterfaceProps) {
  const { data: session } = useSession();
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [minimal, setMinimal] = useState(false);
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
          minimal: minimal,
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
    <div className="flex flex-col h-full max-w-3xl mx-auto">
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
            Chatting with {companionName}
          </h2>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div 
                onClick={() => setMinimal(!minimal)}
                className={`w-8 h-4 rounded-full relative transition-colors ${minimal ? "bg-indigo-600" : "bg-slate-700"}`}
              >
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${minimal ? "left-4.5" : "left-0.5"}`}></div>
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase group-hover:text-slate-300">Quick Mode</span>
            </label>
          </div>
        </div>
      )}

      <div 
        ref={scrollRef}
        className="flex-grow bg-slate-900 border border-slate-800 rounded-3xl overflow-y-auto p-6 space-y-4 mb-6 min-h-[400px]"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center">
              <span className="text-2xl">🤖</span>
            </div>
            <div>
              <p className="font-bold text-slate-300">Your bot is ready</p>
              <p className="text-xs">Say hello to start the conversation</p>
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div 
              className={`max-w-[85%] rounded-2xl p-4 ${
                msg.role === "user" 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10" 
                  : msg.role === "thought"
                  ? "bg-slate-800/50 border border-slate-700 text-slate-400 text-sm italic font-serif"
                  : msg.role === "tool"
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono"
                  : "bg-slate-800 text-slate-200 border border-slate-700/50"
              }`}
            >
              {msg.role === "thought" && <div className="text-[9px] uppercase tracking-widest font-sans mb-1 not-italic opacity-50 font-bold">Bot is thinking...</div>}
              {msg.role === "tool" && <div className="text-[9px] uppercase tracking-widest font-sans mb-1 font-bold">Tool Execution</div>}
              <div className="whitespace-pre-wrap">{msg.text}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 border border-slate-700/50 text-slate-400 rounded-2xl p-4 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
      </div>

      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type your message here..."
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 pr-16 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none h-20 text-slate-200 placeholder:text-slate-600"
        />
        <button
          onClick={handleSend}
          disabled={loading || !prompt.trim()}
          className="absolute right-3 bottom-3 p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </div>
    </div>
  );
}
