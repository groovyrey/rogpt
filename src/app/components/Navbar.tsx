"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const navLinks = [
    { name: "Overview", href: "/" },
    { name: "Console", href: "/chat" },
    { name: "Stats", href: "/stats" },
    { name: "Companion", href: "/bot" },
    { name: "Game", href: "/game" },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 border-b border-blue-100/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-screen-2xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex min-w-0 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm shadow-blue-600/20 group-hover:bg-blue-700 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                 <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM12 4V12L18 12M12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="min-w-0">
              <span className="block font-bold text-[16px] leading-tight tracking-tight text-slate-950">roGPT</span>
              <span className="hidden text-[11px] font-medium text-slate-500 sm:block">Roblox AI console</span>
            </div>
          </Link>

          {session ? (
            <div className="flex items-center gap-3 lg:hidden">
              {session.user?.image && (
                <Image 
                  src={session.user.image} 
                  alt="Profile" 
                  width={24}
                  height={24}
                  className="rounded-full border border-blue-100"
                />
              )}
            </div>
          ) : (
            <button 
              onClick={() => signIn("roblox")}
              className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-600/20 transition-colors hover:bg-blue-700 lg:hidden"
            >
              Log In
            </button>
          )}
        </div>

        {session ? (
          <div className="flex min-w-0 flex-1 items-center justify-between gap-4 lg:justify-end">
            <div className="flex min-w-0 items-center gap-1 overflow-x-auto rounded-xl border border-blue-100 bg-blue-50/70 p-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative flex h-9 shrink-0 items-center rounded-lg px-3 text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? "bg-white text-blue-700 shadow-sm shadow-blue-950/5"
                      : "text-slate-500 hover:bg-white/70 hover:text-slate-950"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
            <div className="hidden items-center gap-3 lg:flex">
              <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-white px-3 py-2 shadow-sm shadow-blue-950/5">
                {session.user?.image && (
                  <Image
                    src={session.user.image}
                    alt="Profile"
                    width={24}
                    height={24}
                    className="rounded-full border border-blue-100"
                  />
                )}
                <span className="max-w-36 truncate text-xs font-medium text-slate-600">{session.user?.name}</span>
              </div>
              <button
                onClick={() => signOut()}
                className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-700"
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div className="hidden lg:block">
            <button
              onClick={() => signIn("roblox")}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-600/20 transition-colors hover:bg-blue-700"
            >
              Log In
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
