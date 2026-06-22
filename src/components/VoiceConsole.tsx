import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, Sparkles, X, Play, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface VoiceConsoleProps {
  onVoiceTaskCreated: () => void;
  onVoiceTriggerOptimizer: () => void;
}

export default function VoiceConsole({ onVoiceTaskCreated, onVoiceTriggerOptimizer }: VoiceConsoleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [assistantReply, setAssistantReply] = useState("");
  
  // Custom Speech recognition references
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Synthesis and Recognition hook bindings
  useEffect(() => {
    // Check for web Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsRecording(true);
        setTranscript("Listening for clear verbal command parameters...");
      };

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        processVoiceCommand(text);
      };

      rec.onerror = (err: any) => {
        console.error("Speech Recognition error:", err);
        setIsRecording(false);
        setTranscript("Vocal capture failed. Please type command manually below.");
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const startListening = () => {
    setAssistantReply("");
    setTranscript("");
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Start recognition e:", e);
      }
    } else {
      // Manual prompt fallback
      const mockText = prompt("No speech recognition in this setup. Enter voice command manually:", "Create task study chemistry dynamics");
      if (mockText) {
        setTranscript(mockText);
        processVoiceCommand(mockText);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const processVoiceCommand = async (textCommand: string) => {
    if (!textCommand.trim()) return;
    setIsProcessing(true);
    setAssistantReply("");
    try {
      const userEmail = localStorage.getItem("preempt_user_email") || "user_default";
      const res = await fetch("/api/ai/voice-interpreter", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-email": userEmail
        },
        body: JSON.stringify({ transcript: textCommand })
      });
      const data = await res.json();
      
      setAssistantReply(data.reply);

      // Programmatically speak the reply back via client-side SpeechSynthesis
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(data.reply);
        utterance.rate = 1.05;
        window.speechSynthesis.speak(utterance);
      }

      // Handle triggers in the UI
      if (data.action === "create_task") {
        onVoiceTaskCreated();
      } else if (data.action === "optimize") {
        onVoiceTriggerOptimizer();
      }
    } catch (e) {
      console.error("Voice dispatch error:", e);
      setAssistantReply("Apologies, I encountered an issue forwarding your transcript to the voice server agent.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Floating Record Orb Trigger on bottom right */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="h-14 w-14 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center cursor-pointer shadow-lg shadow-emerald-500/20 border border-emerald-400/20 active:scale-95 transition-all"
          whileHover={{ scale: 1.05 }}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Mic className="h-6 w-6 animate-pulse" />}
        </motion.button>
      </div>

      {/* Slide-out Voice Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 max-w-sm w-full bg-[#0c0c0e] border border-zinc-800 rounded-2xl shadow-2xl p-5 overflow-hidden"
          >
            {/* Ambient visual gradient */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4.5 w-4.5 text-emerald-400 rotate-12" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">Voice Link Control</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Simulated bouncing Audio Wave Animation when recording or speaking */}
            <div className="h-20 bg-[#09090b] border border-zinc-800 rounded-xl flex items-center justify-center space-x-1.5 overflow-hidden px-4 mb-4">
              {isRecording ? (
                <>
                  <span className="h-8 w-1 bg-gradient-to-t from-emerald-500 to-teal-550 rounded-full animate-bar-pulse" />
                  <span className="h-12 w-1 bg-gradient-to-t from-emerald-500 to-teal-550 rounded-full animate-bar-pulse [animation-delay:0.15s]" />
                  <span className="h-16 w-1 bg-gradient-to-t from-emerald-500 to-teal-550 rounded-full animate-bar-pulse [animation-delay:0.3s]" />
                  <span className="h-10 w-1 bg-gradient-to-t from-emerald-500 to-teal-550 rounded-full animate-bar-pulse [animation-delay:0.45s]" />
                  <span className="h-4 w-1 bg-gradient-to-t from-emerald-500 to-teal-550 rounded-full animate-bar-pulse [animation-delay:0.6s]" />
                </>
              ) : isProcessing ? (
                <div className="flex flex-col items-center space-y-2">
                  <Loader2 className="h-5 w-5 text-emerald-400 animate-spin" />
                  <span className="text-[9px] text-zinc-500 font-mono font-bold tracking-widest uppercase">INTERPRETING COMMAND</span>
                </div>
              ) : assistantReply ? (
                <Volume2 className="h-10 w-10 text-emerald-400 animate-pulse" />
              ) : (
                <span className="text-xs font-mono text-zinc-550 text-center uppercase leading-tight font-bold">Consor Status: Idle</span>
              )}
            </div>

            {/* Render Transcript */}
            {transcript && (
              <div className="p-3 bg-[#09090b] rounded-xl border border-zinc-800 text-xs text-zinc-300 font-sans mb-3 select-text max-h-[80px] overflow-y-auto">
                <span className="text-[9px] text-zinc-550 block font-mono font-bold uppercase leading-none mb-1">Transcript:</span>
                "{transcript}"
              </div>
            )}

            {/* Assistant Spoken Reply */}
            {assistantReply && (
              <div className="p-3 bg-emerald-950/10 rounded-xl border border-emerald-500/10 text-xs text-zinc-200 font-sans mb-4 select-text">
                <span className="text-[9px] text-emerald-450 block font-mono font-bold uppercase leading-none mb-1 flex items-center">
                  <Volume2 className="h-3 w-3 mr-1" />
                  Systems Reply:
                </span>
                "{assistantReply}"
              </div>
            )}

            {/* Main Record Trigger actions */}
            <div className="flex items-center space-x-2.5">
              {isRecording ? (
                <button
                  type="button"
                  onClick={stopListening}
                  className="flex-1 py-3 bg-zinc-800 border border-zinc-700 hover:bg-zinc-750 rounded-xl text-xs font-semibold font-mono text-emerald-400 text-center cursor-pointer transition-colors"
                >
                  Stop Recording
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startListening}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-450 rounded-xl text-xs font-extrabold font-sans text-zinc-950 text-center cursor-pointer flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/10"
                >
                  <Mic className="h-4.5 w-4.5" />
                  <span>Transmit Voice</span>
                </button>
              )}
            </div>

            <div className="text-[9px] text-zinc-500 font-mono text-center block mt-3 uppercase tracking-wider">
              "Create task chemistry research" or "optimize today"
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
