"use client";

import { useState } from "react";
import Link from "next/link";

export default function DataStorePage() {
  const [universeId, setUniverseId] = useState("");
  const [datastoreName, setDatastoreName] = useState("");
  const [entryKey, setEntryKey] = useState("");
  const [scope, setScope] = useState("global");
  const [value, setValue] = useState("");
  const [topic, setTopic] = useState("");
  const [msgBody, setMsgBody] = useState("");
  const [results, setResults] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const callApi = async (action: string, bodyValue?: unknown) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/roblox/open-cloud", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-roblox-scope": scope
        },
        body: JSON.stringify({
          universeId,
          datastoreName,
          entryKey,
          topic,
          message: msgBody,
          action,
          value: bodyValue
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(typeof data.error === 'object' ? JSON.stringify(data.error) : data.error);
      } else {
        setResults(data);
      }
    } catch {
      setError("Failed to reach API");
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
              <span className="font-bold text-lg">D</span>
            </div>
            <h1 className="font-bold text-xl tracking-tight">Open Cloud <span className="text-slate-500 font-medium">Dashboard</span></h1>
          </div>
          <Link href="/" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">Back to Dashboard</Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Controls */}
          <div className="xl:col-span-1 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="font-bold text-slate-200 mb-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                Connection
              </h3>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Universe ID</label>
                <input 
                  type="text" 
                  value={universeId}
                  onChange={(e) => setUniverseId(e.target.value)}
                  placeholder="Universe ID"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
              </div>

              <div className="pt-2">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2">DataStore Service</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Store Name</label>
                    <input 
                      type="text" 
                      value={datastoreName}
                      onChange={(e) => setDatastoreName(e.target.value)}
                      placeholder="e.g. PlayerData"
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Scope</label>
                    <input 
                      type="text" 
                      value={scope}
                      onChange={(e) => setScope(e.target.value)}
                      placeholder="global"
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Key</label>
                    <input 
                      type="text" 
                      value={entryKey}
                      onChange={(e) => setEntryKey(e.target.value)}
                      placeholder="Player_123"
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="pt-4 grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => callApi('list_datastores')}
                    disabled={loading || !universeId}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 rounded-lg text-[10px] font-bold uppercase transition-colors disabled:opacity-50"
                  >
                    List Stores
                  </button>
                  <button 
                    onClick={() => callApi('list_keys')}
                    disabled={loading || !universeId || !datastoreName}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 rounded-lg text-[10px] font-bold uppercase transition-colors disabled:opacity-50"
                  >
                    List Keys
                  </button>
                  <button 
                    onClick={() => callApi('get_entry')}
                    disabled={loading || !universeId || !datastoreName || !entryKey}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg text-[10px] font-bold uppercase transition-colors col-span-2 disabled:opacity-50 shadow-lg shadow-indigo-500/20"
                  >
                    Fetch Entry
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 pb-2">Messaging Service</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Topic</label>
                    <input 
                      type="text" 
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="GlobalAnnouncement"
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Message</label>
                    <input 
                      type="text" 
                      value={msgBody}
                      onChange={(e) => setMsgBody(e.target.value)}
                      placeholder="Hello from Web!"
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <button 
                    onClick={() => callApi('publish_message')}
                    disabled={loading || !universeId || !topic || !msgBody}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-indigo-400 py-2 rounded-lg text-[10px] font-bold uppercase transition-colors disabled:opacity-50 border border-indigo-500/20"
                  >
                    Publish
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Center Area: Write & Output */}
          <div className="xl:col-span-3 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col shadow-sm">
                <h3 className="font-bold text-slate-200 mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  Write Operation
                </h3>
                <textarea 
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder='Enter JSON or String value to save...'
                  className="flex-grow min-h-[150px] bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none transition-all"
                />
                <button 
                  onClick={() => {
                    try {
                      let parsed;
                      try {
                        parsed = JSON.parse(value);
                      } catch {
                        parsed = value; // Fallback to raw string
                      }
                      callApi('set_entry', parsed);
                    } catch {
                      setError("Failed to process input");
                    }
                  }}
                  disabled={loading || !universeId || !datastoreName || !entryKey || !value}
                  className="mt-4 w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  Save Entry to DataStore
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-200 flex items-center gap-2">
                    <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                    Response Log
                  </h3>
                  {loading && <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>}
                </div>
                
                <div className="flex-grow bg-slate-950/50 rounded-xl p-4 overflow-auto font-mono text-[11px] min-h-[200px] border border-slate-800">
                  {error && (
                    <div className="text-rose-400 mb-2 p-2 bg-rose-500/10 border border-rose-500/20 rounded">
                      ERROR: {error}
                    </div>
                  )}
                  
                  {!results && !error && (
                    <div className="h-full flex items-center justify-center text-slate-700 italic">
                      Waiting for command...
                    </div>
                  )}

                  {results && (
                    <pre className="text-emerald-400 whitespace-pre-wrap">
                      {JSON.stringify(results, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions / Tips */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TipCard title="v1 API" desc="Using standard DataStore v1 endpoints for maximum compatibility." />
              <TipCard title="Scope" desc="Default scope is 'global'. Players usually use 'global' or 'User_ID'." />
              <TipCard title="Message" desc="MessagingService has a 1KB limit per message." />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function TipCard({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-4">
      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{title}</h4>
      <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}
