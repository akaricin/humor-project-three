"use client";

import React, { useState, useEffect } from "react";
import { 
  Sun, 
  Moon, 
  Trash2, 
  Plus, 
  Settings,
  Database,
  Terminal,
  ShieldAlert,
  LogOut,
  Loader2,
  Zap
} from "lucide-react";
import { createClient } from "../lib/supabase";
import { useRouter } from "next/navigation";
import { useAdmin } from "../hooks/useAdmin";
import { Database as DBTypes } from "../types/supabase";
import ImageCaptioningDashboard from "../components/ImageCaptioningDashboard";

type Flavor = DBTypes['public']['Tables']['humor_flavors']['Row'];
type FlavorStep = DBTypes['public']['Tables']['humor_flavor_steps']['Row'];

interface StepCardProps {
  step: FlavorStep;
  isDarkMode: boolean;
  onMove: (id: number, direction: 'up' | 'down') => void;
  onDelete: (id: number) => void;
}

const StepCard = ({ step, isDarkMode, onMove, onDelete }: StepCardProps) => {
  return (
    <div 
      className={`border-2 p-6 transition-all relative ${isDarkMode ? "border-white bg-black hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]" : "border-black bg-white hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]"}`}
    >
      <div className="flex items-start gap-6">
        <div className={`text-4xl font-black shrink-0 ${isDarkMode ? "text-white/20" : "text-black/10"}`}>
          {String(step.order_by).padStart(2, '0')}
        </div>
        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold block tracking-widest uppercase opacity-70">
                LLM_SYSTEM_PROMPT
              </label>
              <textarea 
                defaultValue={step.llm_system_prompt || ""}
                className={`w-full bg-transparent border-2 p-3 text-xs focus:outline-none min-h-[80px] resize-none
                  ${isDarkMode ? "border-white/20 focus:border-white" : "border-black/20 focus:border-black"}`}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold block tracking-widest uppercase opacity-70">
                LLM_USER_PROMPT
              </label>
              <textarea 
                defaultValue={step.llm_user_prompt || ""}
                className={`w-full bg-transparent border-2 p-3 text-xs font-mono focus:outline-none min-h-[80px] resize-none
                  ${isDarkMode ? "border-white/20 focus:border-white" : "border-black/20 focus:border-black"}`}
              />
            </div>
          </div>
          <div className="flex gap-4">
            <button className={`flex-1 border-2 py-2 text-xs font-bold flex items-center justify-center gap-2 transition-colors
              ${isDarkMode ? "border-white/20 hover:border-white" : "border-black/20 hover:border-black"}`}>
              <Settings size={12} /> CONFIG_PARAMS
            </button>
            <div className="flex gap-2">
              <button 
                onClick={() => onMove(step.id, 'up')}
                className={`w-10 h-10 border-2 text-xl font-bold flex items-center justify-center transition-colors
                  ${isDarkMode ? "border-white/20 hover:border-white hover:bg-white/10" : "border-black/20 hover:border-black hover:bg-black/10"}`}
              >
                ↑
              </button>
              <button 
                onClick={() => onMove(step.id, 'down')}
                className={`w-10 h-10 border-2 text-xl font-bold flex items-center justify-center transition-colors
                  ${isDarkMode ? "border-white/20 hover:border-white hover:bg-white/10" : "border-black/20 hover:border-black hover:bg-black/10"}`}
              >
                ↓
              </button>
              <button 
                onClick={() => onDelete(step.id)}
                className={`w-10 h-10 border-2 flex items-center justify-center transition-colors
                  ${isDarkMode ? "border-red-500/40 hover:border-red-500 hover:bg-red-500/10 text-red-500" : "border-red-600/40 hover:border-red-600 hover:bg-red-600/10 text-red-600"}`}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function MatrixDashboardClient() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [flavors, setFlavors] = useState<Flavor[]>([]);
  const [selectedFlavor, setSelectedFlavor] = useState<Flavor | null>(null);
  const [steps, setSteps] = useState<FlavorStep[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"FLAVOR_EDITOR" | "GRID_LAB">("FLAVOR_EDITOR");
  
  const supabase = createClient();
  const router = useRouter();

  // Detect System Preference on Mount
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDarkMode(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchFlavors();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (selectedFlavor) {
      fetchSteps(selectedFlavor.id);
    }
  }, [selectedFlavor]);

  const fetchFlavors = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("humor_flavors")
      .select("*")
      .order("slug");
    
    if (data) {
      setFlavors(data);
      if (data.length > 0 && !selectedFlavor) {
        setSelectedFlavor(data[0]);
      }
    }
    setLoading(false);
  };

  const fetchSteps = async (flavorId: number) => {
    const { data, error } = await supabase
      .from("humor_flavor_steps")
      .select("*")
      .eq("humor_flavor_id", flavorId)
      .order("order_by");
    
    if (data) {
      setSteps(data);
    }
  };

  const handleMoveStep = async (stepId: number, direction: 'up' | 'down') => {
    if (!selectedFlavor) return;

    const currentIndex = steps.findIndex(s => s.id === stepId);
    if (currentIndex === -1) return;

    const neighborIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (neighborIndex < 0 || neighborIndex >= steps.length) return;

    const currentStep = steps[currentIndex];
    const neighborStep = steps[neighborIndex];

    // Optimistic UI update: Swap order_by values and sort
    const currentOrderBy = currentStep.order_by;
    const neighborOrderBy = neighborStep.order_by;

    const newSteps = [...steps];
    newSteps[currentIndex] = { ...currentStep, order_by: neighborOrderBy };
    newSteps[neighborIndex] = { ...neighborStep, order_by: currentOrderBy };
    
    // Sort to ensure the UI updates correctly
    setSteps([...newSteps].sort((a, b) => a.order_by - b.order_by));

    // Database Sync: Swap the order_by values
    const { error: error1 } = await supabase
      .from("humor_flavor_steps")
      .update({ order_by: neighborOrderBy })
      .eq("id", currentStep.id);

    const { error: error2 } = await supabase
      .from("humor_flavor_steps")
      .update({ order_by: currentOrderBy })
      .eq("id", neighborStep.id);

    if (error1 || error2) {
      console.error("REORDER_SYNC_FAILURE", error1, error2);
      // Re-fetch on failure to ensure UI consistency
      fetchSteps(selectedFlavor.id);
    }
  };

  const insertFlavor = async () => {
    const slug = prompt("Enter Flavor SLUG (e.g. SARCASM_V2):");
    if (!slug) return;

    const { data, error } = await supabase
      .from("humor_flavors")
      .insert([{ slug, description: "NEWLY_INITIALIZED_FLAVOR" }])
      .select()
      .single();

    if (data) {
      setFlavors([...flavors, data]);
      setSelectedFlavor(data);
    }
  };

  const deleteStep = async (stepId: number) => {
    if (!confirm("CONFIRM_STEP_DELETION?")) return;

    const { error } = await supabase
      .from("humor_flavor_steps")
      .delete()
      .eq("id", stepId);

    if (!error) {
      setSteps(steps.filter(s => s.id !== stepId));
    }
  };

  const insertStep = async () => {
    if (!selectedFlavor) return;

    // Use safe defaults for a new step to prevent backend crashes
    const newStep = {
      humor_flavor_id: selectedFlavor.id,
      humor_flavor_step_type_id: 1, // Default to AI_IMAGE_ANALYSIS
      llm_model_id: 1, // Default to GPT-4o
      llm_input_type_id: 1, // Default to IMAGE
      llm_output_type_id: 2, // Default to TEXT
      order_by: steps.length + 1,
      description: "NEW_ANALYSIS_STEP",
      llm_system_prompt: "You are a helpful assistant.",
      llm_user_prompt: "Describe this image."
    };

    const { data, error } = await supabase
      .from("humor_flavor_steps")
      .insert([newStep])
      .select()
      .single();

    if (data) {
      setSteps([...steps, data]);
    } else {
      console.error("FAILED_TO_INSERT_STEP", error);
      alert("FAILED_TO_CREATE_STEP: " + error.message);
    }
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  if (adminLoading || (loading && !flavors.length)) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center text-white font-mono">
        <Loader2 className="animate-spin mr-2" /> INITIALIZING_MATRIX...
      </div>
    );
  }

  return (
    <div className={`flex h-screen w-full font-mono transition-colors duration-300 ${isDarkMode ? "bg-black text-white" : "bg-white text-black"}`}>
      
      {/* SIDEBAR: Humor Flavors */}
      <aside className={`w-64 border-r-2 flex flex-col shrink-0 ${isDarkMode ? "border-white" : "border-black"}`}>
        
        <div className={`p-6 border-b-2 flex items-center gap-2 ${isDarkMode ? "border-white" : "border-black"}`}>
          <Database size={20} />
          <span className="font-bold tracking-tighter text-xl">FLAVORS</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {flavors.map((flavor) => (
            <button
              key={flavor.id}
              onClick={() => setSelectedFlavor(flavor)}
              className={`w-full text-left p-3 text-sm transition-all border-2 flex items-center gap-2 truncate
                ${selectedFlavor?.id === flavor.id 
                  ? (isDarkMode ? "bg-white text-black border-white" : "bg-black text-white border-black") 
                  : (isDarkMode ? "bg-transparent text-white border-transparent hover:border-white/30" : "bg-transparent text-black border-transparent hover:border-black/30")
                }`}
            >
              <Terminal size={14} className="shrink-0" />
              {flavor.slug}
            </button>
          ))}
          <button 
            onClick={insertFlavor}
            className={`w-full p-3 border-2 border-dashed mt-4 flex items-center justify-center gap-2 text-xs
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
            
            {/* VIEW TOGGLE (RESTORED TO HEADER) */}
            <div className={`flex border-2 ml-4 ${isDarkMode ? "border-white/20" : "border-black/20"}`}>
              <button 
                onClick={() => setView("FLAVOR_EDITOR")}
                className={`px-4 py-1 text-[10px] font-bold transition-colors 
                  ${view === "FLAVOR_EDITOR" 
                    ? (isDarkMode ? "bg-white text-black" : "bg-black text-white") 
                    : (isDarkMode ? "hover:bg-white/10" : "hover:bg-black/10")}`}
              >
                FLAVOR_EDITOR
              </button>
              <button 
                onClick={() => setView("GRID_LAB")}
                className={`px-4 py-1 text-[10px] font-bold transition-colors 
                  ${view === "GRID_LAB" 
                    ? (isDarkMode ? "bg-white text-black" : "bg-black text-white") 
                    : (isDarkMode ? "hover:bg-white/10" : "hover:bg-black/10")}`}
              >
                GRID_LAB
              </button>
            </div>

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
          {view === "FLAVOR_EDITOR" ? (
            <>
              {/* FLAVOR STEPS LIST */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold underline decoration-4 underline-offset-8">
                    STEPS_FOR: {selectedFlavor?.slug}
                  </h2>
                  <button 
                    onClick={insertStep}
                    className={`px-4 py-2 border-2 flex items-center gap-2 font-bold text-sm
                    ${isDarkMode ? "border-white hover:bg-white hover:text-black" : "border-black hover:bg-black hover:text-white"}`}>
                    <Plus size={16} /> NEW_STEP
                  </button>
                </div>

                {steps.length === 0 && (
                  <div className="opacity-40 italic">&gt; NO_STEPS_FOUND_IN_SEQUENCE</div>
                )}

                {steps.map((step) => (
                  <StepCard 
                    key={step.id} 
                    step={step} 
                    isDarkMode={isDarkMode} 
                    onMove={handleMoveStep} 
                    onDelete={deleteStep} 
                  />
                ))}
              </div>

              {/* LEGACY TEST PANEL - WE'LL LEAVE IT FOR NOW OR REMOVE IT IF GRID_LAB IS SUPERIOR */}
              <aside className={`w-96 border-l-2 p-8 flex flex-col shrink-0 ${isDarkMode ? "border-white bg-black/40" : "border-black bg-black/5"}`}>
                <div className={`flex flex-col items-center justify-center h-full text-center space-y-4 ${isDarkMode ? "text-white" : "text-black"}`}>
                  <Zap size={48} className={isDarkMode ? "text-white" : "text-black"} />
                  <p className={`text-xs font-bold tracking-[0.2em] ${isDarkMode ? "text-white" : "text-black"}`}>LEGACY_TEST_PANEL_DEPRECATED</p>
                  <button 
                    onClick={() => setView("GRID_LAB")}
                    className={`border-2 px-4 py-2 transition-colors font-bold ${isDarkMode ? "border-white text-white hover:bg-white hover:text-black" : "border-black text-black hover:bg-black hover:text-white"}`}
                  >
                    LAUNCH_GRID_LAB_v5.0
                  </button>
                </div>
              </aside>
            </>
          ) : (
            <div className="flex-1 overflow-auto">
              <ImageCaptioningDashboard 
                humorFlavorId={selectedFlavor?.id} 
                isDarkMode={isDarkMode}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
