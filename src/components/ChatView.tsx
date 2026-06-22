import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Sparkles, User, ShieldAlert, Cpu, Calendar, CheckSquare } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

interface ChatViewProps {
  onTaskCreatedTrigger: () => void;
}

export default function ChatView({ onTaskCreatedTrigger }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      sender: "ai",
      text: "Greetings, Lead Architect. I am Preempt AI, your contextual scheduler companion. I've audited your pending roadmap and marked 'Chemistry Lab Report' as a high scheduling risk. How should we proceed with optimizing your open slots?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: "user_" + Date.now(),
      sender: "user",
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend })
      });
      const data = await res.json();
      
      const aiMsg: Message = {
        id: "ai_" + Date.now(),
        sender: "ai",
        text: data.response || "No response received",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      console.error("Chat Error:", e);
      setMessages(prev => [...prev, {
        id: "ai_err_" + Date.now(),
        sender: "ai",
        text: "Apologies, I encountered an internal network warning proxying to the Gemini service. Try prompting me again shortly.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickChip = (chipText: string) => {
    handleSendMessage(chipText);
  };

  const quickChips = [
    { text: "List my highest risk tasks", icon: ShieldAlert },
    { text: "Where can I fit Chemistry Lab Report?", icon: Calendar },
    { text: "How is my weekly completion score looking?", icon: CheckSquare },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 h-[calc(100vh-140px)] flex flex-col justify-between">
      
      {/* Page Header */}
      <div className="border-b border-zinc-800 pb-3 flex items-center justify-between shrink-0 mb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center font-sans">
            AI Cognitive Assistant
            <Sparkles className="h-5 w-5 text-emerald-400 ml-2 animate-pulse" />
          </h2>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">
            Interactions backed by Gemini and real-time task constraints.
          </p>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-zinc-800 max-h-[500px]">
        {messages.map((msg) => (
          <div 
            key={msg.id}
            className={`flex items-start space-x-3.5 max-w-[85%] ${
              msg.sender === "user" ? "ml-auto" : ""
            }`}
          >
            {/* Avatar block */}
            {msg.sender === "ai" && (
              <div className="h-8.5 w-8.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Cpu className="h-4.5 w-4.5 text-emerald-400" />
              </div>
            )}

            <div 
              className={`p-3.5 rounded-2xl border text-sm select-text leading-relaxed ${
                msg.sender === "user"
                  ? "bg-gradient-to-r from-emerald-950/15 via-[#0d0d0f] to-black text-zinc-100 border-emerald-500/20 font-sans"
                  : "bg-[#0c0c0e] text-zinc-300 border-zinc-800 font-sans"
              }`}
            >
              <div className="font-sans whitespace-pre-line">{msg.text}</div>
              <span className="text-[9px] text-zinc-500 font-mono block mt-1.5 text-right uppercase font-bold leading-none">
                {msg.sender === "user" ? "YOU" : "PREEMPT AI"}
              </span>
            </div>

            {msg.sender === "user" && (
              <div className="h-8.5 w-8.5 rounded-xl border border-zinc-800 bg-[#0c0c0e] flex items-center justify-center shrink-0">
                <User className="h-4.5 w-4.5 text-zinc-450" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start space-x-3.5">
            <div className="h-8.5 w-8.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Cpu className="h-4.5 w-4.5 text-emerald-400 animate-spin" />
            </div>
            <div className="p-3.5 rounded-2xl bg-[#0c0c0e] border border-zinc-800 flex space-x-1.5 items-center">
              <span className="h-1.5 w-1.5 bg-emerald-450 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 bg-emerald-450 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 bg-emerald-450 rounded-full animate-bounce" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Form & Quick Chips */}
      <div className="border-t border-zinc-800/60 pt-4 space-y-3.5 shrink-0 bg-[#09090b]/40">
        
        {/* Quick Command Chips */}
        <div className="flex flex-wrap gap-2">
          {quickChips.map((chip, idx) => {
            const Icon = chip.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickChip(chip.text)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-zinc-950 to-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-full text-[11px] text-zinc-400 hover:text-white transition-all font-mono cursor-pointer"
              >
                <Icon className="h-3.5 w-3.5 text-emerald-400" />
                <span>{chip.text}</span>
              </button>
            );
          })}
        </div>

        {/* Form Input */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputValue); }} 
          className="relative flex items-center"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Talk with Preempt AI scheduler..."
            className="w-full bg-[#0c0c0e] border border-zinc-800 rounded-2xl px-5 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 pr-14 transition-all font-sans"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="absolute right-2 p-2.5 bg-emerald-500 hover:bg-emerald-450 rounded-xl text-zinc-950 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

    </div>
  );
}
