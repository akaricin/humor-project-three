"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "../../../utils/supabase/client";
import { 
  ArrowLeft, 
  Loader2, 
  Image as ImageIcon,
  Terminal,
  Database,
  Sun,
  Moon
} from "lucide-react";

interface CaptionWithImage {
  id: string;
  content: string | null;
  created_datetime_utc: string;
  images: {
    url: string | null;
  } | null;
}

export default function FlavorCaptionsPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const themeParam = searchParams.get("theme");

  const [captions, setCaptions] = useState<CaptionWithImage[]>([]);
  const [flavorName, setFlavorName] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const supabase = createClient();

  // Sync theme from URL param on load
  useEffect(() => {
    if (themeParam) {
      setIsDarkMode(themeParam === "dark");
    } else {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      setIsDarkMode(mediaQuery.matches);
    }
  }, [themeParam]);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Flavor Name
      const { data: flavor, error: flavorError } = await supabase
        .from("humor_flavors")
        .select("slug")
        .eq("id", Number(id))
        .single();
      
      if (flavorError) throw flavorError;
      if (flavor) setFlavorName(flavor.slug);

      // Fetch Captions with Images
      const { data, error } = await supabase
        .from("captions")
        .select(`
          id,
          content,
          created_datetime_utc,
          images (
            url
          )
        `)
        .eq("humor_flavor_id", Number(id))
        .order("created_datetime_utc", { ascending: false });

      if (error) throw error;
      setCaptions(data as any);
    } catch (err: any) {
      console.error("FETCH_ERROR", {
        message: err.message,
        details: err.details,
        hint: err.hint,
        code: err.code
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    localStorage.setItem("theme", nextDark ? "dark" : "light");

    // Update URL without full navigation
    const params = new URLSearchParams(searchParams.toString());
    params.set("theme", nextDark ? "dark" : "light");
    router.replace(`/flavors/${id}/captions?${params.toString()}`, { scroll: false });
  };
  if (loading) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center text-white font-mono">
        <Loader2 className="animate-spin mr-2" /> ACCESSING_ARCHIVES...
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full font-mono px-16 md:px-24 lg:px-32 py-12 transition-colors duration-300 ${isDarkMode ? "bg-black text-white" : "bg-white text-black"}`}>
      
      {/* HEADER */}
      <header className="mb-12 space-y-6">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => router.back()}
            className={`flex items-center gap-2 px-4 py-2 border-2 font-bold text-xs transition-colors
              ${isDarkMode ? "border-white hover:bg-white hover:text-black" : "border-black hover:bg-black hover:text-white"}`}
          >
            <ArrowLeft size={14} /> RETURN_TO_MATRIX
          </button>

          <button 
            onClick={toggleTheme}
            className={`p-2 border-2 transition-colors ${isDarkMode ? "border-white hover:bg-white hover:text-black" : "border-black hover:bg-black hover:text-white"}`}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-3 opacity-60">
            <Database size={20} />
            <span className="text-sm font-bold tracking-widest uppercase">CAPTION_ARCHIVE_FOR:</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic underline decoration-8 underline-offset-4">
            {flavorName || `FLAVOR_${id}`}
          </h1>
        </div>
      </header>

      {/* GRID */}
      {captions.length === 0 ? (
        <div className={`h-64 border-2 border-dashed flex items-center justify-center opacity-40 italic
          ${isDarkMode ? "border-white" : "border-black"}`}>
          &gt; NO_CAPTIONS_RECORDED_IN_THIS_STREAM
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {captions.map((cap) => (
            <div 
              key={cap.id}
              className={`border-2 flex flex-col transition-all group hover:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)]
                ${isDarkMode ? "border-white bg-black hover:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.2)]" : "border-black bg-white hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.1)]"}`}
            >
              {/* IMAGE AREA */}
              <div className={`aspect-square relative overflow-hidden border-b-2 ${isDarkMode ? "border-white" : "border-black"}`}>
                {cap.images?.url ? (
                  <img 
                    src={cap.images.url} 
                    alt="Source" 
                    className="w-full h-full object-cover contrast-125 transition-all duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 opacity-20">
                    <ImageIcon size={48} />
                    <span className="text-[10px] font-bold">MISSING_SOURCE_IMAGE</span>
                  </div>
                )}
                <div className="absolute top-2 right-2 px-2 py-1 text-[8px] font-bold bg-black text-white border border-white/20">
                  ID_{cap.id.slice(0, 8)}
                </div>
              </div>

              {/* CONTENT AREA */}
              <div className="p-6 flex-1 flex flex-col space-y-4">
                <div className="flex items-center gap-2 opacity-50">
                  <Terminal size={12} />
                  <span className="text-[10px] font-bold tracking-widest uppercase">GENERATED_OUTPUT</span>
                </div>
                <p className="text-sm font-bold leading-relaxed flex-1 italic">
                  "{cap.content || "EMPTY_RESPONSE"}"
                </p>
                <div className="pt-4 border-t border-dashed opacity-30 flex justify-between items-center text-[8px] font-bold uppercase">
                  <span>{new Date(cap.created_datetime_utc).toLocaleDateString()}</span>
                  <span>{new Date(cap.created_datetime_utc).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
