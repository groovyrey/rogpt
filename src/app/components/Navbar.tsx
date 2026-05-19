"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: "Bot", href: "/bot" },
    { name: "Chat", href: "/chat" },
    { name: "Test", href: "/test" },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:rotate-12 transition-transform">
            <span className="font-bold text-lg text-white">R</span>
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-100 hidden sm:block">roGPT</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? "text-indigo-400"
                  : "text-slate-400 hover:text-indigo-300"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Auth & Mobile Toggle */}
        <div className="flex items-center gap-4">
          {session ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-tight">Verified</p>
                <p className="text-xs font-semibold text-slate-200">{session.user?.name?.split(' ')[0]}</p>
              </div>
              {session.user?.image && (
                <Image 
                  src={session.user.image} 
                  alt="Profile" 
                  width={32}
                  height={32}
                  className="rounded-lg border border-slate-700"
                />
              )}
              <button 
                onClick={() => signOut()}
                className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                title="Logout"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              </button>
            </div>
          ) : (
            <button 
              onClick={() => signIn("roblox")}
              className="hidden md:flex px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-indigo-500/20 items-center gap-2"
            >
              Sign In
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
          >
            {isMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 px-6 py-4 space-y-4 animate-in slide-in-from-top duration-200">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className={`block text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? "text-indigo-400"
                  : "text-slate-400 hover:text-indigo-300"
              }`}
            >
              {link.name}
            </Link>
          ))}
          {!session && (
            <button 
              onClick={() => signIn("roblox")}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20"
            >
              Sign In with Roblox
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
