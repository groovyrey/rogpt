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
    <nav className="sticky top-0 z-50 bg-black border-b border-[#333]">
      {/* Top Header */}
      <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center group-hover:bg-[#eaeaea] transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-black">
                 <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM12 4V12L18 12M12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-bold text-[16px] tracking-tight text-white ml-1">roGPT</span>
          </Link>
          <div className="w-[1px] h-4 bg-[#333] rotate-[20deg] mx-1"></div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold uppercase tracking-widest text-[#444]">Uplink</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {session ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#888] font-medium hidden sm:block">{session.user?.name}</span>
              {session.user?.image && (
                <Image 
                  src={session.user.image} 
                  alt="Profile" 
                  width={24}
                  height={24}
                  className="rounded-full border border-[#333]"
                />
              )}
              <button 
                onClick={() => signOut()}
                className="text-xs text-[#888] hover:text-white transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <button 
              onClick={() => signIn("roblox")}
              className="px-3 py-1 bg-white text-black text-xs font-semibold rounded hover:bg-[#eaeaea] transition-colors"
            >
              Log In
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-screen-xl mx-auto px-6">
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative h-12 flex items-center text-sm transition-colors pt-1 ${
                isActive(link.href)
                  ? "text-white"
                  : "text-[#888] hover:text-white"
              }`}
            >
              {link.name}
              {isActive(link.href) && (
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white"></div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
