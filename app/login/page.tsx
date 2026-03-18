"use client";

import { createClient } from "../utils/supabase/client";
import { Terminal, ShieldAlert, LogIn } from "lucide-react";

export default function LoginPage() {
  const supabase = createClient();

  const handleSignIn = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono flex items-center justify-center p-4">
      <div className="w-full max-w-md border-2 border-white p-8 space-y-8 relative shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)]">
        {/* Decorative corner pixels */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white" />

        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 border-2 border-red-500 text-red-500 px-4 py-1 text-xs font-bold animate-pulse">
            <ShieldAlert size={16} />
            UNAUTHORIZED_ACCESS_DETECTED
          </div>
          <h1 className="text-4xl font-black tracking-widest italic">MATRIX_ACCESS</h1>
          <p className="text-xs text-white/50 tracking-tighter">
            PROCEED WITH AUTHENTICATION TO INITIALIZE SYSTEM_KERNEL
          </p>
        </div>

        <div className="space-y-6 pt-4">
          <div className="border-2 border-white/20 p-4 bg-white/5 space-y-2">
            <p className="text-[10px] text-white/40 uppercase font-bold">Protocol_v4.2</p>
            <p className="text-sm">&gt; WAITING_FOR_CREDENTIALS...</p>
            <p className="text-sm">&gt; GOOGLE_OAUTH_READY</p>
          </div>

          <button
            onClick={handleSignIn}
            className="w-full group relative flex items-center justify-center gap-4 border-2 border-white bg-white text-black py-4 font-black text-lg tracking-[0.2em] transition-all hover:bg-black hover:text-white"
          >
            <LogIn className="transition-transform group-hover:translate-x-1" />
            SIGN_IN_WITH_GOOGLE
          </button>
        </div>

        <div className="flex items-center justify-between text-[10px] opacity-40 pt-4">
          <div className="flex items-center gap-2">
            <Terminal size={10} />
            NODE_ADMIN_LOGIN
          </div>
          <span>SECURE_BY_SUPABASE</span>
        </div>
      </div>
    </div>
  );
}
