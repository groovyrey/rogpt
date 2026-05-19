"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function BotPage() {
  const { data: session, status: authStatus } = useSession();
  const [config, setConfig] = useState({
    name: "",
    persona: "",
    ownerName: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    const fetchBot = async () => {
      if (authStatus === "authenticated") {
        try {
          const res = await fetch("/api/bot");
          const botData = await res.json();
          if (!botData.error) setConfig(botData);
        } catch (err) {
          console.error("Fetch error", err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchBot();
  }, [authStatus]);

  const handleSaveBot = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: "Agent configuration updated.", type: "success" });
      }
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    }
  };

  if (loading) return <div className="p-24 text-center text-sm text-[#888]">Loading agent settings...</div>;

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-12 space-y-16">
      {/* Agent Settings */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Agent Settings</h2>
          <p className="text-sm text-[#888] leading-relaxed">
            Configure how your AI assistant identifies and behaves across your Roblox experiences. 
            Changes are applied in real-time to all active NPC instances.
          </p>
        </div>
        <div className="md:col-span-2 space-y-8 p-8 bg-[#000] border border-[#333] rounded-xl shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <Field label="Agent Name">
               <input 
                type="text" 
                value={config.name}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                className="w-full bg-black border border-[#333] rounded-md px-3 py-2 text-sm focus:border-white outline-none transition-colors"
              />
            </Field>
            <Field label="Owner Name">
               <input 
                type="text" 
                value={config.ownerName}
                onChange={(e) => setConfig({ ...config, ownerName: e.target.value })}
                className="w-full bg-black border border-[#333] rounded-md px-3 py-2 text-sm focus:border-white outline-none transition-colors"
              />
            </Field>
          </div>
          <Field label="System Instructions (Persona)">
            <textarea 
              value={config.persona}
              onChange={(e) => setConfig({ ...config, persona: e.target.value })}
              className="w-full h-48 bg-black border border-[#333] rounded-md px-3 py-2 text-sm focus:border-white outline-none transition-colors resize-none font-mono"
              placeholder="e.g. You are a helpful guide in the Roblox world..."
            />
          </Field>
          <div className="pt-6 border-t border-[#333] flex items-center justify-between">
            <p className={`text-xs ${message.type === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}>{message.text}</p>
            <button 
              onClick={handleSaveBot}
              disabled={saving}
              className="px-6 py-2 bg-white text-black text-sm font-semibold rounded hover:bg-[#eaeaea] transition-all disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Agent"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-[#888] uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}
