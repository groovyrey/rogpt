"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const { data: session } = useSession();
  const [botConfig, setBotConfig] = useState<any>(null);
  const [playerData, setPlayerData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      setLoading(true);
      Promise.all([
        fetch("/api/bot").then(res => res.json()),
        fetch("/api/player").then(res => res.json())
      ]).then(([bot, player]) => {
        if (!bot.error) setBotConfig(bot);
        if (player.success) setPlayerData(player.data);
      }).finally(() => setLoading(false));
    }
  }, [session]);

  if (!session) {
    return (
      <div className="grid min-h-[calc(100vh-120px)] items-center gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700 shadow-sm">
            Remote Roblox companion console
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-slate-950 sm:text-6xl">
            Manage your in-game AI companion from one clean dashboard.
          </h1>
          <p className="mt-6 max-w-xl text-[17px] leading-8 text-slate-600">
            Connect with Roblox to personalize your NPC, inspect synced player data, and launch back into the experience with your settings ready.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => signIn("roblox")}
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-95"
            >
              Login with Roblox
            </button>
            <a
              href="https://www.roblox.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-blue-100 bg-white px-6 py-3 text-center text-sm font-bold text-slate-700 transition-colors hover:border-blue-200 hover:text-blue-700"
            >
              View Roblox
            </a>
          </div>
        </section>

        <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-2xl shadow-blue-950/8">
          <div className="rounded-2xl bg-blue-50/80 p-5">
            <div className="flex items-center justify-between border-b border-blue-100 pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Preview</p>
                <p className="mt-1 text-sm text-slate-500">Available after login</p>
              </div>
              <div className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                Online
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              <FeaturePreview title="Companion profile" value="Name, persona, owner" />
              <FeaturePreview title="Player sync" value="Credits and inventory state" />
              <FeaturePreview title="Experience link" value="Launch and verify connection" />
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-xl shadow-blue-950/5 lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            {session.user?.image && (
              <Image
                src={session.user.image}
                alt="Avatar"
                width={56}
                height={56}
                className="rounded-2xl border border-blue-100"
              />
            )}
            <div>
              <p className="text-sm font-medium text-slate-500">Signed in as {session.user?.name}</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Your roGPT workspace</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {session.user?.premium && <Badge label="Premium" color="amber" />}
            {session.user?.verified && <Badge label="Verified" color="emerald" />}
            <Badge label={loading ? "Syncing" : "Live sync"} color="indigo" />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_0.8fr]">
        <section className="grid gap-4 sm:grid-cols-3">
          <DashboardLink href="/bot" label="Companion" title={botConfig?.name || "Configure NPC"} detail="Edit name and behavior" />
          <DashboardLink href="/stats" label="Player Data" title={`${playerData?.coins?.toLocaleString() || "0"} credits`} detail="Review synced stats" />
          <DashboardLink href="/game" label="Experience" title="Active game" detail="Open Roblox session" />
        </section>

        <section className="rounded-2xl border border-blue-100 bg-blue-600 p-6 text-white shadow-xl shadow-blue-600/20">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-100">Next action</p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight">Tune your companion before launching.</h2>
          <p className="mt-3 text-sm leading-6 text-blue-100">
            Your current persona is saved to the Roblox-side companion profile.
          </p>
          <Link
            href="/bot"
            className="mt-6 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-bold text-blue-700 transition-colors hover:bg-blue-50"
          >
            Edit companion
          </Link>
        </section>
      </div>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-xl shadow-blue-950/5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Companion presence</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{botConfig?.name || "Gemma"}</h2>
            </div>
            <div className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-700">
              Linked
            </div>
          </div>
          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/70 p-5 text-slate-700">
            &quot;{botConfig?.persona || "Awaiting your directives."}&quot;
          </div>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-xl shadow-blue-950/5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Account status</p>
          <div className="mt-5 space-y-4">
            <StatusRow label="Roblox account" value="Connected" />
            <StatusRow label="Companion sync" value={loading ? "Refreshing" : "Ready"} />
            <StatusRow label="Data access" value="Enabled" />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeaturePreview({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-blue-100 bg-white p-4">
      <p className="text-sm font-bold text-slate-950">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{value}</p>
    </div>
  );
}

function DashboardLink({ href, label, title, detail }: { href: string; label: string; title: string; detail: string }) {
  return (
    <Link href={href} className="group rounded-2xl border border-blue-100 bg-white p-5 shadow-xl shadow-blue-950/5 transition-all hover:border-blue-300 hover:shadow-blue-950/10">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-4 text-xl font-bold tracking-tight text-slate-950 group-hover:text-blue-700">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{detail}</p>
    </Link>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-blue-50 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-bold text-slate-900">{value}</span>
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  const colors: any = {
    amber: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  };
  return (
    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border ${colors[color]}`}>
      {label}
    </span>
  );
}
