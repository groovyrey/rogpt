"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface Message {
  role: "user" | "model" | "thought";
  text: string;
}

export default function TestPage() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [minimal, setMinimal] = useState(false);
  const [ownerName, setOwnerName] = useState("Alex");
  const scrollRef = useRef<HTMLDivElement>(null);

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
          sessionId: "test-session-" + Date.now(),
          companionName: "Gemma Test Bot",
          ownerName: ownerName,
          minimal: minimal,
        }),
      });

      const data = await res.json();

      if (data.success) {
        if (data.thoughts) {
          setMessages((prev) => [...prev, { role: "thought", text: data.thoughts }]);
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
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans">
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="font-bold text-lg">T</span>
            </div>
            <h1 className="font-bold text-xl tracking-tight">Gemma <span className="text-slate-500 font-medium">Test Playground</span></h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 uppercase">Owner:</span>
              <input 
                type="text" 
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-24"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer group">
              <div 
                onClick={() => setMinimal(!minimal)}
                className={`w-10 h-5 rounded-full relative transition-colors ${minimal ? "bg-indigo-600" : "bg-slate-700"}`}
              >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${minimal ? "left-6" : "left-1"}`}></div>
              </div>
              <span className="text-xs font-medium text-slate-400 group-hover:text-slate-200 transition-colors">Minimal Thinking</span>
            </label>
            <Link href="/" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">Back to Dashboard</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div 
          ref={scrollRef}
          className="bg-slate-900 border border-slate-800 rounded-2xl h-[60vh] overflow-y-auto p-6 space-y-4 mb-6"
        >
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
              <p>No messages yet. Start a conversation with Gemma!</p>
              <p className="text-xs font-mono bg-slate-800 px-2 py-1 rounded">Model: gemma-4-26b-a4b-it</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div 
                className={`max-w-[85%] rounded-2xl p-4 ${
                  msg.role === "user" 
                    ? "bg-indigo-600 text-white" 
                    : msg.role === "thought"
                    ? "bg-slate-800/50 border border-slate-700 text-slate-400 text-sm italic font-serif"
                    : "bg-slate-800 text-slate-200"
                }`}
              >
                {msg.role === "thought" && <div className="text-[10px] uppercase tracking-widest font-sans mb-1 not-italic opacity-50">Gemma&apos;s Reasoning</div>}
                <div className="whitespace-pre-wrap">{msg.text}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 text-slate-400 rounded-2xl p-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
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
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 pr-16 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none h-24 text-slate-200 placeholder:text-slate-600"
          />
          <button
            onClick={handleSend}
            disabled={loading || !prompt.trim()}
            className="absolute right-3 bottom-3 p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
        <p className="mt-4 text-center text-xs text-slate-600">
          Press Enter to send, Shift + Enter for new line.
        </p>
      </main>
    </div>
  );
}
