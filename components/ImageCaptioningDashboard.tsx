"use client";

import React, { useState, useCallback } from "react";
import { createClient } from "../lib/supabase";
import { 
  Upload, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  Image as ImageIcon,
  Terminal,
  ShieldCheck,
  Zap
} from "lucide-react";

type Status = "IDLE" | "GETTING PERMISSION" | "UPLOADING BYTES" | "REGISTERING" | "GENERATING CAPTIONS" | "ERROR" | "SUCCESS";

interface ImageCaptioningDashboardProps {
  humorFlavorId?: number;
  isDarkMode?: boolean;
}

export default function ImageCaptioningDashboard({ humorFlavorId, isDarkMode = true }: ImageCaptioningDashboardProps) {
  const [status, setStatus] = useState<Status>("IDLE");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stepNumber, setStepNumber] = useState<number>(0);
  const [captions, setCaptions] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const supabase = createClient();

  const handleProcessFile = async (file: File) => {
    try {
      if (!file || !file.type) {
        alert("CRITICAL_ERROR: FILE_TYPE_UNDEFINED");
        return;
      }

      if (!file.type.startsWith("image/")) {
        alert("FILE_TYPE_REJECTED: ONLY_IMAGES_ALLOWED");
        return;
      }

      if (!humorFlavorId) {
        alert("Please select a humor flavor first.");
        return;
      }

      // Reset state
      setCaptions([]);
      setErrorMessage(null);
      setPreviewUrl(URL.createObjectURL(file));
      
      // Step 0: Auth Check
      setStatus("GETTING PERMISSION");
      setStepNumber(0);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("User not logged in!");
        setStatus("IDLE");
        return;
      }
      const token = session.access_token;

      // Step 0.5: PRE-VERIFICATION SCRIPT
      const { data: flavorSteps, error: fetchError } = await supabase
        .from("humor_flavor_steps")
        .select("id")
        .eq("humor_flavor_id", humorFlavorId);
      
      if (fetchError) throw new Error(`SUPABASE_FETCH_ERROR: ${fetchError.message}`);
      
      if (!flavorSteps || flavorSteps.length === 0) {
        alert("Flavor has no instructions!");
        setStatus("IDLE");
        return;
      }

      // Step 1: Generate Presigned URL
      setStatus("GETTING PERMISSION");
      setStepNumber(1);
      const res1 = await fetch("https://api.almostcrackd.ai/pipeline/generate-presigned-url", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ contentType: file.type }),
      });
      if (!res1.ok) throw new Error(`STEP_1_FAILURE: ${await res1.text()}`);
      const { presignedUrl, cdnUrl } = await res1.json();

      // Step 2: Upload Bytes
      setStatus("UPLOADING BYTES");
      setStepNumber(2);
      const res2 = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res2.ok) throw new Error(`STEP_2_FAILURE: UPLOAD_FAILED`);

      // Step 3: Register Image
      setStatus("REGISTERING");
      setStepNumber(3);
      const res3 = await fetch("https://api.almostcrackd.ai/pipeline/upload-image-from-url", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ imageUrl: cdnUrl, isCommonUse: false }),
      });
      if (!res3.ok) throw new Error(`STEP_3_FAILURE: ${await res3.text()}`);
      const { imageId } = await res3.json();

      // Step 4: Generate Captions
      setStatus("GENERATING CAPTIONS");
      setStepNumber(4);
      const res4 = await fetch("https://api.almostcrackd.ai/pipeline/generate-captions", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ imageId, humorFlavorId }),
      });

      const rawText = await res4.text();
      let data4;
      
      try {
        data4 = JSON.parse(rawText);
      } catch (e) {
        // If parsing fails, the AI likely returned unescaped quotes or bad formatting
        throw new Error(`MALFORMED_JSON_RESPONSE: AI_OUTPUT_IS_NOT_VALID_JSON. RAW_TEXT: "${rawText.substring(0, 150)}..."`);
      }

      if (!res4.ok) {
        const serverMessage = data4.message || data4.statusMessage || "UNKNOWN_SERVER_ERROR";
        let promptHint = "";
        
        // Specific hint for "Bad control character" (newlines/tabs in AI output)
        if (serverMessage.toLowerCase().includes("control character")) {
          promptHint = "\n\nPROMPT_ADVICE: The AI included an illegal character (like a newline). Update your prompt in the Editor to say: 'Output a single-line JSON array with no literal newlines inside strings.'";
        }

        throw new Error(`STEP_4_SERVER_ERROR: ${serverMessage}${promptHint}\n\n[RAW_DEBUG_DATA]: ${rawText.substring(0, 300)}`);
      }
      
      // Expected response shape: { captions: string[] } or directly the array
      const results = Array.isArray(data4) ? data4 : data4.captions || [];
      setCaptions(results);
      setStatus("SUCCESS");
      
    } catch (err: any) {
      setStatus("ERROR");
      setErrorMessage(err.message || "UNKNOWN_PIPELINE_ERROR");
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleProcessFile(file);
  };

  return (
    <div className={`font-mono p-8 min-h-screen border-4 transition-colors duration-300 ${isDarkMode ? "bg-black text-white border-white" : "bg-white text-black border-black"}`}>
      {/* HEADER */}
      <div className={`flex items-center justify-between border-b-4 pb-6 mb-8 ${isDarkMode ? "border-white" : "border-black"}`}>
        <div className="flex items-center gap-4">
          <Terminal size={32} className="text-green-500" />
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter">GRID_LAB_v.5.0</h1>
            <p className="text-[10px] text-green-500 font-bold tracking-[0.3em]">PIPELINE_READY_FOR_INPUT</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 border-2 px-4 py-2 ${isDarkMode ? "border-white" : "border-black"}`}>
          <ShieldCheck size={16} className="text-green-500" />
          <span className="text-xs font-bold">AUTH_TOKEN_ENCRYPTED</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* LEFT: DROP ZONE & PREVIEW */}
        <div className="space-y-8">
          <div 
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`
              aspect-video border-4 border-dashed transition-all flex flex-col items-center justify-center p-8 relative
              ${isDragging ? "border-green-500 bg-green-500/10" : isDarkMode ? "border-white/40 hover:border-white" : "border-black/40 hover:border-black"}
              ${status !== "IDLE" && status !== "SUCCESS" && status !== "ERROR" ? "opacity-50 pointer-events-none" : "cursor-pointer"}
            `}
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) handleProcessFile(file);
              };
              input.click();
            }}
          >
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-contain p-4" />
            ) : (
              <>
                <Upload size={48} className="mb-4" />
                <p className="font-bold text-center">DRAG_AND_DROP_IMAGE_HERE</p>
                <p className="text-[10px] opacity-50 mt-2 italic">OR_CLICK_TO_BROWSE_LOCAL_FILES</p>
              </>
            )}
            
            {/* Corners */}
            <div className={`absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 ${isDarkMode ? "border-white" : "border-black"}`} />
            <div className={`absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 ${isDarkMode ? "border-white" : "border-black"}`} />
            <div className={`absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 ${isDarkMode ? "border-white" : "border-black"}`} />
            <div className={`absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 ${isDarkMode ? "border-white" : "border-black"}`} />
          </div>

          {/* STATUS INDICATOR */}
          <div className={`border-2 p-6 space-y-4 ${isDarkMode ? "border-white" : "border-black"}`}>
            <h3 className="text-xs font-bold tracking-widest flex items-center gap-2">
              <Zap size={14} fill="currentColor" /> PIPELINE_STATUS
            </h3>
            
            <div className="grid grid-cols-5 gap-1">
              {["GETTING PERMISSION", "UPLOADING BYTES", "REGISTERING", "GENERATING CAPTIONS", "SUCCESS"].map((s, i) => {
                const isActive = status === s;
                const isPast = ["SUCCESS"].includes(status) || (stepNumber > i + 1);
                
                return (
                  <div key={s} className="space-y-2">
                    <div className={`h-2 transition-colors ${isActive ? "bg-green-500 animate-pulse" : isPast ? (isDarkMode ? "bg-white" : "bg-black") : (isDarkMode ? "bg-white/10" : "bg-black/10")}`} />
                    <p className={`text-[8px] font-bold text-center break-words ${isActive ? "text-green-500" : "opacity-30"}`}>
                      {s.replace(" ", "_")}
                    </p>
                  </div>
                );
              })}
            </div>

            {status === "ERROR" && (
              <div className="bg-red-500/20 border-2 border-red-500 p-4 flex items-start gap-4">
                <AlertTriangle className="text-red-500 shrink-0" size={20} />
                <div>
                  <p className="text-xs font-bold text-red-500 uppercase">PIPELINE_FAILURE_AT_STEP_{stepNumber}</p>
                  <p className="text-[10px] mt-1 break-all">{errorMessage}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: RESULTS */}
        <div className={`flex flex-col border-4 ${isDarkMode ? "border-white" : "border-black"}`}>
          <div className={`p-4 font-black text-xs tracking-widest flex justify-between ${isDarkMode ? "bg-white text-black" : "bg-black text-white"}`}>
            <span>GRID_OUTPUT_LOG</span>
            <span>V_5.0_STABLE</span>
          </div>
          
          <div className={`flex-1 p-6 overflow-y-auto space-y-4 ${isDarkMode ? "bg-white/5" : "bg-black/5"}`}>
            {status === "IDLE" && (
              <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                <ImageIcon size={64} className="mb-4" />
                <p className="italic font-bold tracking-widest">WAITING_FOR_DATA_STREAM...</p>
              </div>
            )}

            {(status === "GETTING PERMISSION" || status === "UPLOADING BYTES" || status === "REGISTERING" || status === "GENERATING CAPTIONS") && (
              <div className="h-full flex flex-col items-center justify-center space-y-4">
                <Loader2 size={48} className="animate-spin text-green-500" />
                <p className="text-xl font-black italic animate-pulse tracking-widest">{status}...</p>
              </div>
            )}

            {status === "ERROR" && (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-6 animate-in fade-in zoom-in duration-300">
                <div className="bg-red-600 p-4 border-4 border-white shadow-[8px_8px_0px_0px_rgba(220,38,38,0.3)]">
                  <AlertTriangle size={48} className="text-white mx-auto mb-2" />
                  <h3 className="text-white font-black text-xl italic tracking-tighter">PIPELINE_CRITICAL_FAILURE</h3>
                </div>
                
                <div className="w-full text-left space-y-4">
                  <div className="border-l-4 border-red-600 pl-4 py-2 bg-red-600/10">
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Error_Context:</p>
                    <p className="text-sm font-bold text-red-400">STEP_{stepNumber}_EXECUTION_HALTED</p>
                  </div>

                  <div className="bg-black/40 border-2 border-red-600/30 p-4 font-mono text-[10px] leading-relaxed max-h-[300px] overflow-y-auto">
                    <p className="text-red-500 font-bold mb-2">&gt; SYSTEM_MESSAGE:</p>
                    <p className="text-red-200/80 whitespace-pre-wrap">{errorMessage}</p>
                  </div>

                  <button 
                    onClick={() => {
                      setStatus("IDLE");
                      setErrorMessage(null);
                    }}
                    className="w-full border-2 border-red-600 py-2 text-[10px] font-black hover:bg-red-600 hover:text-white transition-all uppercase tracking-[0.2em]"
                  >
                    RESET_PIPELINE_KERNEL
                  </button>
                </div>
              </div>
            )}

            {status === "SUCCESS" && captions.length > 0 ? (
              <div className="space-y-4">
                {captions.map((caption, i) => {
                  // Safe extraction: API might return string[] or object[] with .content
                  const displayContent = typeof caption === "string" 
                    ? caption 
                    : (caption as any)?.content || JSON.stringify(caption);

                  return (
                    <div key={i} className={`border-2 p-4 hover:border-green-500 transition-colors group flex gap-4 ${isDarkMode ? "border-white/20" : "border-black/20"}`}>
                      <span className="font-black text-green-500 opacity-50 text-2xl">{(i + 1).toString().padStart(2, '0')}</span>
                      <p className="text-sm font-bold leading-relaxed">{displayContent}</p>
                    </div>
                  );
                })}
                <div className="flex items-center gap-2 pt-8 text-green-500 font-bold text-xs uppercase italic">
                  <CheckCircle2 size={16} />
                  ALL_CAPTIONS_GENERATED_SUCCESSFULLY
                </div>
              </div>
            ) : status === "SUCCESS" && (
              <div className={`text-center p-8 border-2 border-dashed ${isDarkMode ? "border-white/20" : "border-black/20"}`}>
                <p className="italic opacity-50">PIPELINE_RETURNED_EMPTY_SET</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER LOGS */}
      <div className={`mt-12 text-[8px] opacity-30 font-mono flex justify-between items-end border-t pt-4 ${isDarkMode ? "border-white/20" : "border-black/20"}`}>
        <div>
          <p>&gt; KERNEL_INITIALIZED: 0x8291</p>
          <p>&gt; SECURE_SHELL_ACTIVE: TRUE</p>
          <p>&gt; WAITING_FOR_INPUT_BYTE_STREAM...</p>
        </div>
        <div className="text-right">
          <p>ALMOSTCRACKD_AI_PROTOCOL_v.1.2.9</p>
          <p>©_MATRIX_SYSTEMS_2026</p>
        </div>
      </div>
    </div>
  );
}
