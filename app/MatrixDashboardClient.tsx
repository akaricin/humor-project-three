"use client";

import React, { useState } from "react";
import { 
  Sun, 
  Moon, 
  ChevronUp, 
  ChevronDown, 
  Trash2, 
  Plus, 
  Play, 
  Settings,
  Database,
  Terminal,
  ShieldAlert,
  LogOut
} from "lucide-react";
import { createClient } from "./utils/supabase/client";
import { useRouter } from "next/navigation";

// Mock Data
const FLAVORS = [
  "DAD_JOKES_V1",
  "DARK_HUMOR_PRO",
  "PUN_GENERATOR_9000",
  "SARCASM_BOT_BETA",
  "WORDPLAY_ENGINE"
];

const INITIAL_STEPS = [
  { id: 1, number: 1, instruction: "INITIALIZE HUMOR_CORE WITH RETRO_VIBE_CONST" },
  { id: 2, number: 2, instruction: "LOAD DICTIONARY: 'OXFORD_UNABRIDGED_1984'" },
  { id: 3, number: 3, instruction: "PARSE INPUT_STRING FOR SEMANTIC_IRONY" },
];

export default function MatrixDashboardClient() {
  const [selectedFlavor, setSelectedFlavor] = useState(FLAVORS[0]);
  const [steps, setSteps] = useState(INITIAL_STEPS);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <div className={`flex h-screen w-full font-mono transition-colors duration-300 ${isDarkMode ? "bg-black text-white" : "bg-white text-black"}`}>
      
      {/* SIDEBAR: Humor Flavors */}
      <aside className={`w-64 border-r-2 flex flex-col shrink-0 ${isDarkMode ? "border-white" : "border-black"}`}>
        <div className={`p-6 border-b-2 flex items-center gap-2 ${isDarkMode ? "border-white" : "border-black"}`}>
          <Database size={20} />
          <span className="font-bold tracking-tighter text-xl">FLAVORS</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {FLAVORS.map((flavor) => (
            <button
              key={flavor}
              onClick={() => setSelectedFlavor(flavor)}
              className={`w-full text-left p-3 text-sm transition-all border-2 flex items-center gap-2
                ${selectedFlavor === flavor 
                  ? (isDarkMode ? "bg-white text-black border-white" : "bg-black text-white border-black") 
                  : (isDarkMode ? "bg-transparent text-white border-transparent hover:border-white/30" : "bg-transparent text-black border-transparent hover:border-black/30")
                }`}
            >
              <Terminal size={14} />
              {flavor}
            </button>
          ))}
          <button className={`w-full p-3 border-2 border-dashed mt-4 flex items-center justify-center gap-2 text-xs
            ${isDarkMode ? "border-white/40 hover:border-white" : "border-black/40 hover:border-black"}`}>
            <Plus size={14} />
            ADD_NEW_FLAVOR
          </button>
        </nav>
        <div className={`p-4 border-t-2 ${isDarkMode ? "border-white" : "border-black"}`}>
           <button 
            onClick={handleSignOut}
            className={`w-full p-3 border-2 flex items-center justify-center gap-2 text-xs font-bold transition-all
              ${isDarkMode ? "border-red-500 text-red-500 hover:bg-red-500 hover:text-white" : "border-red-600 text-red-600 hover:bg-red-600 hover:text-white"}`}>
            <LogOut size={14} />
            TERMINATE_SESSION
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <header className={`h-16 border-b-2 flex items-center justify-between px-8 shrink-0 ${isDarkMode ? "border-white" : "border-black"}`}>
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-black italic tracking-widest">MATRIX_ADMIN</h1>
            <div className={`px-2 py-1 text-[10px] font-bold border-2 flex items-center gap-1
              ${isDarkMode ? "border-red-500 text-red-500" : "border-red-600 text-red-600"}`}>
              <ShieldAlert size={10} />
              SYSTEM_ADMIN_ACTIVE
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={toggleTheme}
              className={`p-2 border-2 transition-colors ${isDarkMode ? "border-white hover:bg-white hover:text-black" : "border-black hover:bg-black hover:text-white"}`}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="flex items-center gap-2">
              <Settings size={18} />
              <span className="text-xs font-bold">V_4.2.0</span>
            </div>
          </div>
        </header>

        {/* CONTENT SCROLLABLE AREA */}
        <main className="flex-1 flex overflow-hidden">
          
          {/* FLAVOR STEPS LIST */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold underline decoration-4 underline-offset-8">
                STEPS_FOR: {selectedFlavor}
              </h2>
              <button className={`px-4 py-2 border-2 flex items-center gap-2 font-bold text-sm
                ${isDarkMode ? "border-white hover:bg-white hover:text-black" : "border-black hover:bg-black hover:text-white"}`}>
                <Plus size={16} /> NEW_STEP
              </button>
            </div>

            {steps.map((step, index) => (
              <div 
                key={step.id} 
                className={`border-2 p-6 transition-all relative ${isDarkMode ? "border-white bg-black hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]" : "border-black bg-white hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]"}`}
              >
                <div className="flex items-start gap-6">
                  <div className={`text-4xl font-black shrink-0 ${isDarkMode ? "text-white/20" : "text-black/10"}`}>
                    {String(step.number).padStart(2, '0')}
                  </div>
                  <div className="flex-1 space-y-4">
                    <label className="text-[10px] font-bold block tracking-widest uppercase opacity-70">
                      Execution_Instruction
                    </label>
                    <textarea 
                      defaultValue={step.instruction}
                      className={`w-full bg-transparent border-2 p-4 text-sm focus:outline-none min-h-[100px] resize-none
                        ${isDarkMode ? "border-white/20 focus:border-white" : "border-black/20 focus:border-black"}`}
                    />
                    <div className="flex gap-4">
                      <button className={`flex-1 border-2 py-2 text-xs font-bold flex items-center justify-center gap-2 transition-colors
                        ${isDarkMode ? "border-white/20 hover:border-white" : "border-black/20 hover:border-black"}`}>
                        <Settings size={12} /> CONFIG_PARAMS
                      </button>
                      <div className="flex gap-2">
                        <button className={`p-2 border-2 ${isDarkMode ? "border-white/20 hover:border-white" : "border-black/20 hover:border-black"}`}>
                          <ChevronUp size={16} />
                        </button>
                        <button className={`p-2 border-2 ${isDarkMode ? "border-white/20 hover:border-white" : "border-black/20 hover:border-black"}`}>
                          <ChevronDown size={16} />
                        </button>
                        <button className={`p-2 border-2 ${isDarkMode ? "border-red-500/40 hover:border-red-500 hover:bg-red-500/10 text-red-500" : "border-red-600/40 hover:border-red-600 hover:bg-red-600/10 text-red-600"}`}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* TEST PANEL */}
          <aside className={`w-96 border-l-2 p-8 flex flex-col shrink-0 ${isDarkMode ? "border-white" : "border-black"}`}>
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2 italic">
              <Play size={18} fill="currentColor" /> TEST_EXECUTION
            </h3>
            
            <div className="flex-1 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold block tracking-widest uppercase opacity-70">
                  PREVIEW_IMAGE_URL
                </label>
                <div className={`aspect-square border-2 flex items-center justify-center relative overflow-hidden group
                  ${isDarkMode ? "border-white/20 bg-white/5" : "border-black/20 bg-black/5"}`}>
                  <span className="text-[10px] font-mono opacity-50">NO_ASSET_LOADED</span>
                  {/* Decorative pixel corners */}
                  <div className={`absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 ${isDarkMode ? "border-white" : "border-black"}`} />
                  <div className={`absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 ${isDarkMode ? "border-white" : "border-black"}`} />
                  <div className={`absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 ${isDarkMode ? "border-white" : "border-black"}`} />
                  <div className={`absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 ${isDarkMode ? "border-white" : "border-black"}`} />
                </div>
              </div>

              <div className="space-y-4">
                <div className={`p-4 border-2 text-xs font-mono break-all
                  ${isDarkMode ? "border-white/10 bg-white/5 text-white/60" : "border-black/10 bg-black/5 text-black/60"}`}>
                  URL: https://matrix-assets.v4/placeholder.png
                </div>
                
                <button className={`w-full py-4 border-2 font-black text-lg tracking-[0.2em] transition-all flex items-center justify-center gap-4
                  ${isDarkMode 
                    ? "bg-white text-black border-white hover:bg-transparent hover:text-white" 
                    : "bg-black text-white border-black hover:bg-transparent hover:text-black"}`}>
                  GENERATE
                </button>
              </div>

              <div className={`mt-auto p-4 border-2 border-dashed text-[10px]
                ${isDarkMode ? "border-white/20" : "border-black/20"}`}>
                <p className="font-bold mb-1 underline">SYSTEM_LOGS:</p>
                <p>&gt; WAITING_FOR_INPUT...</p>
                <p>&gt; KERNEL_READY</p>
              </div>
            </div>
          </aside>

        </main>
      </div>
    </div>
  );
}
