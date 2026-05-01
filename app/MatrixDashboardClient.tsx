"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Zap,
  Copy
} from "lucide-react";
import { createClient } from "../lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
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
  const { isAdmin, loading: adminLoading, user } = useAdmin();
  const [flavors, setFlavors] = useState<Flavor[]>([]);
  const [selectedFlavor, setSelectedFlavor] = useState<Flavor | null>(null);
  const [steps, setSteps] = useState<FlavorStep[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"FLAVOR_EDITOR" | "GRID_LAB">("FLAVOR_EDITOR");
  const [duplicationModal, setDuplicationModal] = useState<{ isOpen: boolean; originalFlavor: Flavor | null; newSlug: string; newDescription: string }>({
    isOpen: false,
    originalFlavor: null,
    newSlug: "",
    newDescription: ""
  });
  const [newFlavorModal, setNewFlavorModal] = useState<{ isOpen: boolean; slug: string }>({
    isOpen: false,
    slug: ""
  });
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: "SUCCESS" | "ERROR" }[]>([]);
  
  const sidebarRef = useRef<HTMLElement>(null);
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const flavorIdParam = searchParams.get("flavor");
  const viewParam = searchParams.get("view");
  const themeParam = searchParams.get("theme");

  const updateUrl = (updates: { flavor?: number; view?: string; theme?: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    if (updates.flavor !== undefined) params.set("flavor", updates.flavor.toString());
    if (updates.view !== undefined) params.set("view", updates.view);
    if (updates.theme !== undefined) params.set("theme", updates.theme);
    router.replace(`/?${params.toString()}`, { scroll: false });
  };

  const showToast = (message: string, type: "SUCCESS" | "ERROR" = "SUCCESS") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Restore sidebar scroll position on mount
  useEffect(() => {
    if (sidebarRef.current && flavors.length > 0) {
      const savedScroll = sessionStorage.getItem("sidebar-scroll");
      if (savedScroll) {
        sidebarRef.current.scrollTop = parseInt(savedScroll, 10);
      }
    }
  }, [flavors.length]);

  const handleSidebarScroll = (e: React.UIEvent<HTMLElement>) => {
    sessionStorage.setItem("sidebar-scroll", e.currentTarget.scrollTop.toString());
  };

  // Detect System Preference or Local Storage on Mount
  useEffect(() => {
    const updateThemeFromStorage = () => {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme) {
        setIsDarkMode(savedTheme === "dark");
      }
    };

    updateThemeFromStorage();
    window.addEventListener("storage", updateThemeFromStorage);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("theme")) {
        setIsDarkMode(e.matches);
      }
    };
    mediaQuery.addEventListener("change", handler);
    
    return () => {
      window.removeEventListener("storage", updateThemeFromStorage);
      mediaQuery.removeEventListener("change", handler);
    };
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
  };

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

  // Consolidated Initialization and URL Sync
  useEffect(() => {
    if (!flavors.length) return;

    const flavorFromParam = flavorIdParam ? flavors.find(f => f.id === Number(flavorIdParam)) : null;
    const initialFlavor = flavorFromParam || flavors[0];
    const initialView = (viewParam === "FLAVOR_EDITOR" || viewParam === "GRID_LAB") ? viewParam : "FLAVOR_EDITOR";
    const initialDark = themeParam ? themeParam === "dark" : isDarkMode;

    let needsUpdate = false;
    const params = new URLSearchParams(searchParams.toString());

    if (!flavorIdParam || selectedFlavor?.id !== initialFlavor.id) {
      setSelectedFlavor(initialFlavor);
      params.set("flavor", initialFlavor.id.toString());
      needsUpdate = true;
    }
    
    if (view !== initialView) {
      setView(initialView);
      params.set("view", initialView);
      needsUpdate = true;
    }

    if (isDarkMode !== initialDark) {
      setIsDarkMode(initialDark);
      params.set("theme", initialDark ? "dark" : "light");
      needsUpdate = true;
    }

    if (needsUpdate) {
      router.replace(`/?${params.toString()}`, { scroll: false });
    }
  }, [flavors, flavorIdParam, viewParam, themeParam]);

  const fetchFlavors = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("humor_flavors")
      .select("*")
      .order("slug");
    
    if (data) {
      setFlavors(data);
      if (data.length > 0) {
        const flavorFromParam = flavorIdParam ? data.find(f => f.id === Number(flavorIdParam)) : null;
        const initialFlavor = flavorFromParam || data[0];
        setSelectedFlavor(initialFlavor);
        
        // Ensure URL has initial state if missing
        if (!flavorIdParam || !viewParam) {
          const params = new URLSearchParams(searchParams.toString());
          if (!flavorIdParam) params.set("flavor", initialFlavor.id.toString());
          if (!viewParam) params.set("view", view);
          router.replace(`/?${params.toString()}`, { scroll: false });
        }
      }
    }
    setLoading(false);
  };

  const fetchSteps = async (flavorId: number) => {
    const { data } = await supabase
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
      .update({ 
        order_by: neighborOrderBy,
        modified_by_user_id: user?.id 
      })
      .eq("id", currentStep.id);

    const { error: error2 } = await supabase
      .from("humor_flavor_steps")
      .update({ 
        order_by: currentOrderBy,
        modified_by_user_id: user?.id 
      })
      .eq("id", neighborStep.id);

    if (error1 || error2) {
      console.error("REORDER_SYNC_FAILURE", error1, error2);
      // Re-fetch on failure to ensure UI consistency
      fetchSteps(selectedFlavor.id);
    }
  };

  const insertFlavor = async () => {
    setNewFlavorModal({ isOpen: true, slug: "" });
  };

  const confirmInsertFlavor = async () => {
    const { slug } = newFlavorModal;
    if (!slug) return;

    const { data, error } = await supabase
      .from("humor_flavors")
      .insert([{ 
        slug, 
        description: "NEWLY_INITIALIZED_FLAVOR",
        created_by_user_id: user?.id,
        modified_by_user_id: user?.id
      }])
      .select()
      .single();

    if (data) {
      setFlavors([...flavors, data]);
      setSelectedFlavor(data);
      setNewFlavorModal({ isOpen: false, slug: "" });
      showToast("Flavor Created Successfully!");
    } else {
      showToast("Failed to Create Flavor: " + error.message, "ERROR");
    }
  };

  const duplicateFlavor = async (originalFlavor: Flavor) => {
    setDuplicationModal({
      isOpen: true,
      originalFlavor,
      newSlug: `${originalFlavor.slug}-copy`,
      newDescription: originalFlavor.description || "DUPLICATED_FLAVOR"
    });
  };

  const confirmDuplication = async () => {
    const { originalFlavor, newSlug, newDescription } = duplicationModal;
    if (!originalFlavor || !newSlug) return;

    try {
      setLoading(true);
      // Step 1: Fetch steps from the original flavor
      const { data: originalSteps, error: fetchError } = await supabase
        .from("humor_flavor_steps")
        .select("*")
        .eq("humor_flavor_id", originalFlavor.id)
        .order("order_by");

      if (fetchError) throw fetchError;

      // Step 2: Insert new flavor
      const { data: newFlavor, error: flavorError } = await supabase
        .from("humor_flavors")
        .insert([{ 
          slug: newSlug, 
          description: newDescription,
          created_by_user_id: user?.id,
          modified_by_user_id: user?.id
        }])
        .select()
        .single();

      if (flavorError) throw flavorError;
      if (!newFlavor) throw new Error("FAILED_TO_CREATE_NEW_FLAVOR");

      // Step 3: Insert steps for the new flavor
      if (originalSteps && originalSteps.length > 0) {
        const newSteps = originalSteps.map(step => ({
          humor_flavor_id: newFlavor.id,
          humor_flavor_step_type_id: step.humor_flavor_step_type_id,
          llm_input_type_id: step.llm_input_type_id,
          llm_model_id: step.llm_model_id,
          llm_output_type_id: step.llm_output_type_id,
          llm_system_prompt: step.llm_system_prompt,
          llm_user_prompt: step.llm_user_prompt,
          llm_temperature: step.llm_temperature,
          order_by: step.order_by,
          description: step.description,
          created_by_user_id: user?.id,
          modified_by_user_id: user?.id
        }));

        const { error: stepsError } = await supabase
          .from("humor_flavor_steps")
          .insert(newSteps);

        if (stepsError) throw stepsError;
      }

      // Success!
      showToast("Flavor Duplicated Successfully!");
      setDuplicationModal({ ...duplicationModal, isOpen: false });
      
      // Navigate to the new flavor
      await fetchFlavors();
      setSelectedFlavor(newFlavor);
      
    } catch (error: unknown) {
      console.error("DUPLICATION_FAILURE", error);
      showToast("Duplication Failed: " + (error instanceof Error ? error.message : "UNKNOWN_ERROR"), "ERROR");
    } finally {
      setLoading(false);
    }
  };

  const deleteStep = async (stepId: number) => {
    setConfirmModal({
      isOpen: true,
      title: "INIT_DELETION_PROTOCOL",
      message: "ARE_YOU_SURE_YOU_WANT_TO_TERMINATE_THIS_STEP_SEQUENCE?",
      onConfirm: async () => {
        const { error } = await supabase
          .from("humor_flavor_steps")
          .delete()
          .eq("id", stepId);

        if (!error) {
          setSteps(steps.filter(s => s.id !== stepId));
          showToast("Step Terminated Successfully!");
        } else {
          showToast("Termination Failed: " + error.message, "ERROR");
        }
        setConfirmModal(null);
      }
    });
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
      llm_user_prompt: "Describe this image.",
      created_by_user_id: user?.id,
      modified_by_user_id: user?.id
    };

    const { data, error } = await supabase
      .from("humor_flavor_steps")
      .insert([newStep])
      .select()
      .single();

    if (data) {
      setSteps([...steps, data]);
      showToast("Step Initialized Successfully!");
    } else {
      console.error("FAILED_TO_INSERT_STEP", error);
      showToast("Failed to Create Step: " + error.message, "ERROR");
    }
  };

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
        
        <div className={`p-6 border-b-2 flex flex-col gap-4 ${isDarkMode ? "border-white" : "border-black"}`}>
          <div className="flex items-center gap-2">
            <Database size={20} />
            <span className="font-bold tracking-tighter text-xl">FLAVORS</span>
          </div>
          <div className="relative">
            <input 
              type="text"
              placeholder="SEARCH_FLAVORS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full bg-transparent border-2 p-2 text-[10px] font-bold focus:outline-none transition-colors
                ${isDarkMode ? "border-white/20 focus:border-white placeholder:text-white/30" : "border-black/20 focus:border-black placeholder:text-black/30"}`}
            />
          </div>
        </div>
        <nav 
          ref={sidebarRef}
          onScroll={handleSidebarScroll}
          className="flex-1 overflow-y-auto p-4 space-y-2"
        >
          {flavors
            .filter(f => f.slug.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((flavor) => (
            <div key={flavor.id} className="group relative">
              <button
                onClick={() => {
                  setSelectedFlavor(flavor);
                  updateUrl({ flavor: flavor.id });
                }}
                className={`w-full text-left p-3 text-sm transition-all border-2 flex items-center gap-2 truncate
                  ${selectedFlavor?.id === flavor.id 
                    ? (isDarkMode ? "bg-white text-black border-white" : "bg-black text-white border-black") 
                    : (isDarkMode ? "bg-transparent text-white border-transparent hover:border-white/30" : "bg-transparent text-black border-transparent hover:border-black/30")
                  }`}
              >
                <Terminal size={14} className="shrink-0" />
                <span className="truncate flex-1">{flavor.slug}</span>
              </button>
            </div>
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
                onClick={() => {
                  setView("FLAVOR_EDITOR");
                  updateUrl({ view: "FLAVOR_EDITOR" });
                }}
                className={`px-4 py-1 text-[10px] font-bold transition-colors 
                  ${view === "FLAVOR_EDITOR" 
                    ? (isDarkMode ? "bg-white text-black" : "bg-black text-white") 
                    : (isDarkMode ? "hover:bg-white/10" : "hover:bg-black/10")}`}
              >
                FLAVOR_EDITOR
              </button>
              <button 
                onClick={() => {
                  setView("GRID_LAB");
                  updateUrl({ view: "GRID_LAB" });
                }}
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
                <div className="mb-12 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold underline decoration-4 underline-offset-8">
                      STEPS_FOR:
                    </h2>
                    <div className="flex gap-2">
                      <button 
                        onClick={insertStep}
                        className={`px-3 py-1 border-2 flex items-center gap-2 font-bold text-[10px] tracking-widest
                        ${isDarkMode ? "border-white hover:bg-white hover:text-black" : "border-black hover:bg-black hover:text-white"}`}>
                        <Plus size={12} /> ADD_STEP
                      </button>
                      <button 
                        onClick={() => selectedFlavor && duplicateFlavor(selectedFlavor)}
                        className={`px-3 py-1 border-2 flex items-center gap-2 font-bold text-[10px] tracking-widest
                        ${isDarkMode ? "border-white hover:bg-white hover:text-black" : "border-black hover:bg-black hover:text-white"}`}>
                        <Copy size={12} /> DUPLICATE
                      </button>
                      <button 
                        onClick={() => selectedFlavor && router.push(`/flavors/${selectedFlavor.id}/captions?theme=${isDarkMode ? "dark" : "light"}`)}
                        className={`px-3 py-1 border-2 flex items-center gap-2 font-bold text-[10px] tracking-widest
                        ${isDarkMode ? "border-white hover:bg-white hover:text-black" : "border-black hover:bg-black hover:text-white"}`}>
                        <Database size={12} /> CAPTIONS
                      </button>
                    </div>
                  </div>
                  <div className="text-4xl font-black tracking-tighter opacity-80">
                    {selectedFlavor?.slug}
                  </div>
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
                showToast={showToast}
              />
            </div>
          )}
        </main>
      </div>

      {/* NEW FLAVOR MODAL */}
      {newFlavorModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setNewFlavorModal({ ...newFlavorModal, isOpen: false })}
          />
          <div className={`relative w-full max-w-sm border-4 p-8 space-y-8 animate-in fade-in zoom-in duration-200
            ${isDarkMode ? "bg-black border-white shadow-[16px_16px_0px_0px_rgba(255,255,255,0.2)]" : "bg-white border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,0.1)]"}`}>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 opacity-60">
                <Plus size={16} />
                <span className="text-[10px] font-bold tracking-[0.2em]">INITIALIZE_NEW_FLAVOR</span>
              </div>
              <h3 className="text-2xl font-black italic uppercase">NEW_MATRIX_ENTRY</h3>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold block tracking-widest uppercase opacity-70">
                FLAVOR_SLUG
              </label>
              <input 
                type="text"
                autoFocus
                value={newFlavorModal.slug}
                onChange={(e) => setNewFlavorModal({ ...newFlavorModal, slug: e.target.value })}
                placeholder="ENTER_SLUG (E.G._SARCASM_V3)..."
                className={`w-full bg-transparent border-2 p-3 text-xs font-bold focus:outline-none
                  ${isDarkMode ? "border-white/20 focus:border-white" : "border-black/20 focus:border-black"}`}
              />
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setNewFlavorModal({ ...newFlavorModal, isOpen: false })}
                className={`flex-1 border-2 py-3 text-xs font-bold transition-colors
                  ${isDarkMode ? "border-white/20 hover:border-white" : "border-black/20 hover:border-black"}`}
              >
                ABORT
              </button>
              <button 
                onClick={confirmInsertFlavor}
                className={`flex-1 border-2 py-3 text-xs font-bold flex items-center justify-center gap-2 transition-all
                  ${isDarkMode 
                    ? "bg-white text-black border-white hover:bg-white/90" 
                    : "bg-black text-white border-black hover:bg-black/90"}`}
              >
                CREATE_FLAVOR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {confirmModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setConfirmModal(null)}
          />
          <div className={`relative w-full max-w-sm border-4 p-8 space-y-6 animate-in fade-in zoom-in duration-200
            ${isDarkMode ? "bg-black border-white shadow-[16px_16px_0px_0px_rgba(255,255,255,0.2)]" : "bg-white border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,0.1)]"}`}>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-red-500">
                <ShieldAlert size={16} />
                <span className="text-[10px] font-bold tracking-[0.2em]">{confirmModal.title}</span>
              </div>
              <p className="text-sm font-bold uppercase leading-relaxed">
                {confirmModal.message}
              </p>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setConfirmModal(null)}
                className={`flex-1 border-2 py-3 text-xs font-bold transition-colors
                  ${isDarkMode ? "border-white/20 hover:border-white" : "border-black/20 hover:border-black"}`}
              >
                CANCEL
              </button>
              <button 
                onClick={confirmModal.onConfirm}
                className={`flex-1 border-2 py-3 text-xs font-bold transition-all
                  ${isDarkMode 
                    ? "bg-red-500 text-white border-red-500 hover:bg-red-600" 
                    : "bg-red-600 text-white border-red-600 hover:bg-red-700"}`}
              >
                TERMINATE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATIONS */}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-4">
        {toasts.map((toast) => (
          <div 
            key={toast.id}
            className={`min-w-[300px] border-4 p-4 font-bold text-xs tracking-widest uppercase flex items-center gap-3 animate-in slide-in-from-right duration-300
              ${toast.type === "SUCCESS" 
                ? (isDarkMode ? "bg-white text-black border-white" : "bg-black text-white border-black")
                : "bg-red-500 text-white border-red-500"}`}
          >
            {toast.type === "SUCCESS" ? <Zap size={14} /> : <ShieldAlert size={14} />}
            {toast.message}
          </div>
        ))}
      </div>

      {/* DUPLICATION MODAL */}
      {duplicationModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setDuplicationModal({ ...duplicationModal, isOpen: false })}
          />
          <div className={`relative w-full max-w-md border-4 p-8 space-y-8 animate-in fade-in zoom-in duration-200
            ${isDarkMode ? "bg-black border-white shadow-[16px_16px_0px_0px_rgba(255,255,255,0.2)]" : "bg-white border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,0.1)]"}`}>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 opacity-60">
                <Copy size={16} />
                <span className="text-[10px] font-bold tracking-[0.2em]">DUPLICATE_FLAVOR_PROTOCOL</span>
              </div>
              <h3 className="text-2xl font-black italic uppercase">INIT_CLONE_SEQUENCE</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold block tracking-widest uppercase opacity-70">
                  NEW_FLAVOR_SLUG
                </label>
                <input 
                  type="text"
                  value={duplicationModal.newSlug}
                  onChange={(e) => setDuplicationModal({ ...duplicationModal, newSlug: e.target.value })}
                  placeholder="ENTER_NEW_SLUG..."
                  className={`w-full bg-transparent border-2 p-3 text-xs font-bold focus:outline-none
                    ${isDarkMode ? "border-white/20 focus:border-white" : "border-black/20 focus:border-black"}`}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold block tracking-widest uppercase opacity-70">
                  NEW_DESCRIPTION
                </label>
                <textarea 
                  value={duplicationModal.newDescription}
                  onChange={(e) => setDuplicationModal({ ...duplicationModal, newDescription: e.target.value })}
                  placeholder="ENTER_DESCRIPTION..."
                  className={`w-full bg-transparent border-2 p-3 text-xs focus:outline-none min-h-[100px] resize-none
                    ${isDarkMode ? "border-white/20 focus:border-white" : "border-black/20 focus:border-black"}`}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setDuplicationModal({ ...duplicationModal, isOpen: false })}
                className={`flex-1 border-2 py-3 text-xs font-bold transition-colors
                  ${isDarkMode ? "border-white/20 hover:border-white" : "border-black/20 hover:border-black"}`}
              >
                ABORT_SEQUENCE
              </button>
              <button 
                onClick={confirmDuplication}
                disabled={loading}
                className={`flex-1 border-2 py-3 text-xs font-bold flex items-center justify-center gap-2 transition-all
                  ${isDarkMode 
                    ? "bg-white text-black border-white hover:bg-white/90 disabled:opacity-50" 
                    : "bg-black text-white border-black hover:bg-black/90 disabled:opacity-50"}`}
              >
                {loading ? <Loader2 className="animate-spin" size={14} /> : <Zap size={14} />}
                CONFIRM_DUPLICATION
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

