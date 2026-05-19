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
    { name: "Agent", href: "/bot" },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-black border-b border-[#333]">
      {/* Top Header */}
      <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <svg width="24" height="24" viewBox="0 0 76 65" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
               <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="currentColor"/>
            </svg>
            <span className="font-semibold text-[15px] tracking-tight">roGPT</span>
          </Link>
          <div className="w-[1px] h-4 bg-[#333] rotate-[20deg] mx-1"></div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">Project</span>
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
