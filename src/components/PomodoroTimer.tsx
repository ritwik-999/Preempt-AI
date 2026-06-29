import { useState, useEffect, useRef } from "react";
import { 
  Play, Pause, RotateCcw, Volume2, VolumeX, Eye, EyeOff, 
  CheckCircle2, Coffee, Hourglass, Compass, Sun, Moon, Maximize2, 
  Minimize2, Zap, Clock, Shield, Bell, Music, Check, ChevronDown, ListTodo
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Task } from "../types";

// ==========================================
// CLIENT-SIDE SYNTHESIZED FOCUS AUDIO ENGINE
// ==========================================
class FocusAudioEngine {
  private ctx: AudioContext | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private binauralNode: { leftOsc: OscillatorNode; rightOsc: OscillatorNode; mainGain: GainNode } | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public playClickBeep(freq = 650, duration = 0.08) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio feedback error:", e);
    }
  }

  public playSuccessBell() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      
      // Multi-frequency harmonic major chord (C5, E5, G5, C6) for a premium zen chord bell
      const freqs = [523.25, 659.25, 783.99, 1046.50];
      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        const delay = idx * 0.07;
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + delay + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + delay + 2.5);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + delay);
        osc.stop(this.ctx.currentTime + delay + 2.8);
      });
    } catch (e) {
      console.warn("Zen bell synthesis error:", e);
    }
  }

  public startAmbient(type: "white" | "brown" | "binaural" | "silent", volume = 0.5) {
    try {
      this.initCtx();
      this.stopAmbient();
      if (!this.ctx || type === "silent") return;

      if (type === "white" || type === "brown") {
        const bufferSize = 2 * this.ctx.sampleRate;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);

        if (type === "white") {
          for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
          }
        } else {
          // Brown noise integration
          let lastOut = 0.0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5; // Compensate gain loss
          }
        }

        const source = this.ctx.createBufferSource();
        source.buffer = noiseBuffer;
        source.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = type === "brown" ? 380 : 850;

        this.noiseGain = this.ctx.createGain();
        this.noiseGain.gain.setValueAtTime(volume * 0.05, this.ctx.currentTime);

        source.connect(filter);
        filter.connect(this.noiseGain);
        this.noiseGain.connect(this.ctx.destination);

        source.start();
        this.noiseSource = source;
      } else if (type === "binaural") {
        // Binaural focus beat: Left ear 140Hz, Right ear 144Hz (producing 4Hz Theta wave)
        const leftOsc = this.ctx.createOscillator();
        const rightOsc = this.ctx.createOscillator();
        const merger = this.ctx.createChannelMerger(2);

        leftOsc.type = "sine";
        leftOsc.frequency.setValueAtTime(140, this.ctx.currentTime);

        rightOsc.type = "sine";
        rightOsc.frequency.setValueAtTime(144, this.ctx.currentTime);

        const leftGain = this.ctx.createGain();
        const rightGain = this.ctx.createGain();

        leftGain.gain.setValueAtTime(volume * 0.08, this.ctx.currentTime);
        rightGain.gain.setValueAtTime(volume * 0.08, this.ctx.currentTime);

        leftOsc.connect(leftGain);
        rightOsc.connect(rightGain);

        leftGain.connect(merger, 0, 0);
        rightGain.connect(merger, 0, 1);

        const mainGain = this.ctx.createGain();
        mainGain.gain.setValueAtTime(volume * 0.06, this.ctx.currentTime);

        merger.connect(mainGain);
        mainGain.connect(this.ctx.destination);

        leftOsc.start();
        rightOsc.start();

        this.binauralNode = {
          leftOsc,
          rightOsc,
          mainGain
        };
      }
    } catch (e) {
      console.warn("Ambient startup failed:", e);
    }
  }

  public updateVolume(val: number) {
    try {
      if (this.ctx) {
        if (this.noiseGain) {
          this.noiseGain.gain.setValueAtTime(val * 0.05, this.ctx.currentTime);
        }
        if (this.binauralNode) {
          this.binauralNode.mainGain.gain.setValueAtTime(val * 0.06, this.ctx.currentTime);
        }
      }
    } catch (e) {}
  }

  public stopAmbient() {
    try {
      if (this.noiseSource) {
        this.noiseSource.stop();
        this.noiseSource = null;
      }
      if (this.binauralNode) {
        this.binauralNode.leftOsc.stop();
        this.binauralNode.rightOsc.stop();
        this.binauralNode = null;
      }
    } catch (e) {}
  }
}

// Global static audio engine instance
const audioEngine = new FocusAudioEngine();

// Component Props
interface PomodoroTimerProps {
  tasks: Task[];
  activeTaskId?: string | null;
  onClearActiveTask?: () => void;
  onToggleTaskComplete?: (taskId: string) => void;
  onAddActivityLog?: (action: string, details: string, category: "INFO" | "SUCCESS") => void;
}

export default function PomodoroTimer({
  tasks,
  activeTaskId,
  onClearActiveTask,
  onToggleTaskComplete,
  onAddActivityLog
}: PomodoroTimerProps) {
  // Timer States
  const [duration, setDuration] = useState(25); // in minutes
  const [timeLeft, setTimeLeft] = useState(25 * 60); // in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [currentMode, setCurrentMode] = useState<"FOCUS" | "SHORT_BREAK" | "LONG_BREAK">("FOCUS");
  const [selectedTaskId, setSelectedTaskId] = useState<string>("generic");
  const [completionBanner, setCompletionBanner] = useState<{
    show: boolean;
    mode: "FOCUS" | "SHORT_BREAK" | "LONG_BREAK";
    text: string;
  } | null>(null);
  
  // Custom slider settings
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customInput, setCustomInput] = useState<number | string>("25");

  // Focus Window & Customizations
  const [isFocusWindowOpen, setIsFocusWindowOpen] = useState(false);
  const [clockStyle, setClockStyle] = useState<"DIGITAL" | "ANALOG">("DIGITAL");
  const [clockFace, setClockFace] = useState<"SWISS_MINIMAL" | "CYBERPUNK_GLOW" | "CHRONOGRAPH_ELITE">("CYBERPUNK_GLOW");
  const [ambientSound, setAmbientSound] = useState<"white" | "brown" | "binaural" | "silent">("silent");
  const [soundVolume, setSoundVolume] = useState(0.5);

  // Live standard local clock for aesthetic analog/digital displays
  const [localTime, setLocalTime] = useState(new Date());

  // Ref for timer loop
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync activeTaskId from parent
  useEffect(() => {
    if (activeTaskId) {
      const matchedTask = tasks.find(t => t.id === activeTaskId);
      if (matchedTask) {
        setSelectedTaskId(activeTaskId);
        // Automatically start focal session for designated task
        setCurrentMode("FOCUS");
        setDuration(25);
        setTimeLeft(25 * 60);
        setIsRunning(true);
        setIsFocusWindowOpen(true);
        audioEngine.playClickBeep(700, 0.15);
        setTimeout(() => {
          if (onClearActiveTask) onClearActiveTask();
        }, 50);
      }
    }
  }, [activeTaskId, tasks, onClearActiveTask]);

  // Handle standard actual time clock ticks
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setLocalTime(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Timer Countdown loop
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            handleSessionCompleted();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, currentMode, selectedTaskId]);

  // Ambient sound play on focus window or toggle change
  useEffect(() => {
    if (isFocusWindowOpen && isRunning && ambientSound !== "silent") {
      audioEngine.startAmbient(ambientSound, soundVolume);
    } else {
      audioEngine.stopAmbient();
    }
    return () => audioEngine.stopAmbient();
  }, [isFocusWindowOpen, isRunning, ambientSound]);

  // Adjust ambient volume dynamically
  useEffect(() => {
    audioEngine.updateVolume(soundVolume);
  }, [soundVolume]);

  // Voice command timer integration
  useEffect(() => {
    const handleVoiceTimerControl = (e: Event) => {
      const customEvent = e as CustomEvent<{
        action: "START" | "PAUSE" | "RESET" | "SET";
        durationMinutes?: number;
        presetMode?: "FOCUS" | "SHORT_BREAK" | "LONG_BREAK";
      }>;
      const detail = customEvent.detail;
      if (!detail) return;

      console.log("Preempt voice control event handled successfully:", detail);

      if (detail.action === "PAUSE") {
        setIsRunning(false);
        audioEngine.playClickBeep(500, 0.1);
      } else if (detail.action === "RESET") {
        setIsRunning(false);
        if (detail.presetMode) {
          setCurrentMode(detail.presetMode);
        }
        let mins = 25;
        if (detail.presetMode === "SHORT_BREAK") mins = 5;
        else if (detail.presetMode === "LONG_BREAK") mins = 15;
        else if (detail.durationMinutes) mins = detail.durationMinutes;

        setDuration(mins);
        setTimeLeft(mins * 60);
        audioEngine.playClickBeep(450, 0.12);
      } else if (detail.action === "START" || detail.action === "SET") {
        setIsRunning(false); // Reset running ticks
        if (detail.presetMode) {
          setCurrentMode(detail.presetMode);
          setIsCustomMode(false);
        }

        let mins = duration;
        if (detail.presetMode === "SHORT_BREAK") mins = 5;
        else if (detail.presetMode === "LONG_BREAK") mins = 15;
        else if (detail.presetMode === "FOCUS") mins = 25;

        if (detail.durationMinutes) {
          mins = detail.durationMinutes;
          setIsCustomMode(true);
        }

        setDuration(mins);
        setTimeLeft(mins * 60);
        setIsRunning(true);
        setIsFocusWindowOpen(true); // Auto-expand full screen focus portal
        audioEngine.playClickBeep(700, 0.15);
      }
    };

    window.addEventListener("preempt-timer-control", handleVoiceTimerControl);
    return () => {
      window.removeEventListener("preempt-timer-control", handleVoiceTimerControl);
    };
  }, [duration, currentMode]);

  const handleSessionCompleted = () => {
    audioEngine.playSuccessBell();
    
    const taskObj = tasks.find(t => t.id === selectedTaskId);
    const taskName = taskObj ? taskObj.title : "Generic Target Focus";
    
    let completionDetails = "";
    if (currentMode === "FOCUS") {
      completionDetails = `Completed a deep focus interval of ${duration} minutes targeting: "${taskName}"`;
      if (onAddActivityLog) {
        onAddActivityLog("Deep Focus Achieved", completionDetails, "SUCCESS");
      }
      
      // Auto-trigger completion log save to DB (simulated/local proxy call)
      fetch("/api/db/tasks/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Focused Interval Achieved",
          description: completionDetails,
          priority: "LOW",
          status: "COMPLETED",
          effortScore: 2,
          impactScore: 3,
          deadline: new Date().toISOString()
        })
      }).catch((e) => console.warn("Failed automatic logging", e));

    } else {
      completionDetails = `Completed a refreshing break of ${duration} minutes. Preparing next sprint!`;
      if (onAddActivityLog) {
        onAddActivityLog("Refreshed Break Cycle", completionDetails, "INFO");
      }
    }

    setCompletionBanner({
      show: true,
      mode: currentMode,
      text: currentMode === "FOCUS" 
        ? "Excellent focus. Time to take a recovery break." 
        : "Break finished. Let's resume deep focus!"
    });
    
    // Auto transition mode safely
    if (currentMode === "FOCUS") {
      handlePresetChange("SHORT_BREAK");
    } else {
      handlePresetChange("FOCUS");
    }
  };

  const handlePresetChange = (mode: "FOCUS" | "SHORT_BREAK" | "LONG_BREAK", customMins?: number | string) => {
    audioEngine.playClickBeep(550, 0.08);
    setIsRunning(false);
    setCurrentMode(mode);
    setIsCustomMode(false);

    let mins = 25;
    if (mode === "SHORT_BREAK") mins = 5;
    else if (mode === "LONG_BREAK") mins = 15;
    else if (customMins !== undefined && customMins !== "") {
      const parsed = Number(customMins);
      if (!isNaN(parsed) && parsed > 0) {
        mins = parsed;
        setIsCustomMode(true);
      }
    }

    setDuration(mins);
    setTimeLeft(mins * 60);
  };

  const toggleTimer = () => {
    audioEngine.playClickBeep(isRunning ? 500 : 700, 0.1);
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    audioEngine.playClickBeep(450, 0.12);
    setIsRunning(false);
    setTimeLeft(duration * 60);
  };

  const activeFocusTask = tasks.find(t => t.id === selectedTaskId);

  // Standard utility formattings
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Helper mapping angles for actual clock hand draws
  const getClockHandAngles = () => {
    const hours = localTime.getHours() % 12;
    const minutes = localTime.getMinutes();
    const seconds = localTime.getSeconds();

    return {
      hoursAngle: (hours * 30) + (minutes * 0.5),
      minutesAngle: (minutes * 6) + (seconds * 0.1),
      secondsAngle: seconds * 6
    };
  };

  const { hoursAngle, minutesAngle, secondsAngle } = getClockHandAngles();

  // Percentage of Pomodoro elapsed/remaining for SVGs
  const pomodoroProgressPercent = 1 - (timeLeft / (duration * 60));
  // Hand angle for Pomodoro timer countdown remaining (relative to 12 o'clock, counts clockwise)
  const focusTimeRemainingAngle = (timeLeft / (duration * 60)) * 360;

  // Render Swiss minimal tick markers
  const renderSwissTicks = () => {
    const ticks = [];
    for (let i = 0; i < 12; i++) {
      const angle = i * 30;
      const isQuarter = i % 3 === 0;
      ticks.push(
        <line
          key={i}
          x1="100"
          y1={isQuarter ? "10" : "15"}
          x2="100"
          y2={isQuarter ? "22" : "19"}
          stroke={clockFace === "CYBERPUNK_GLOW" ? "rgba(16, 185, 129, 0.4)" : "rgba(228, 228, 231, 0.25)"}
          strokeWidth={isQuarter ? "2.5" : "1"}
          transform={`rotate(${angle} 100 100)`}
        />
      );
    }
    return ticks;
  };

  return (
    <>
      {/* 1. MINI COMPACT DASHBOARD CARD */}
      <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={`p-1.5 rounded-lg border ${
              currentMode === "FOCUS" 
                ? "bg-emerald-500/10 border-emerald-500/25" 
                : "bg-blue-500/10 border-blue-500/25"
            }`}>
              {currentMode === "FOCUS" ? (
                <Zap className="h-4.5 w-4.5 text-emerald-400" />
              ) : currentMode === "SHORT_BREAK" ? (
                <Coffee className="h-4.5 w-4.5 text-blue-400" />
              ) : (
                <Compass className="h-4.5 w-4.5 text-indigo-400" />
              )}
            </span>
            <h4 className="text-sm font-extrabold uppercase tracking-widest text-zinc-100 font-sans">
              Focus Engine
            </h4>
          </div>
          <span className="flex items-center space-x-1.5 text-[9px] font-mono uppercase bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-md text-zinc-400">
            <span className={`h-2 w-2 rounded-full ${
              isRunning 
                ? currentMode === "FOCUS" 
                  ? "bg-emerald-500 animate-pulse" 
                  : "bg-blue-500 animate-pulse" 
                : "bg-zinc-650"
            }`} />
            <span>{currentMode === "FOCUS" ? "Sprint Focus" : "Rest Mode"}</span>
          </span>
        </div>

        {/* Task dropdown selection */}
        <div className="space-y-1">
          <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">Bound Task Objective</label>
          <div className="relative">
            <select
              value={selectedTaskId}
              onChange={(e) => {
                setSelectedTaskId(e.target.value);
                audioEngine.playClickBeep(600, 0.05);
              }}
              className={`w-full bg-[#070708] border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs rounded-xl px-3.5 py-2.5 outline-none appearance-none cursor-pointer transition-colors font-sans ${
                currentMode === "FOCUS" ? "focus:border-emerald-500/50" : "focus:border-blue-500/50"
              }`}
            >
              <option value="generic">✦ Generic Project Flow Focus</option>
              {tasks.filter(t => t.status !== "COMPLETED").map((task) => (
                <option key={task.id} value={task.id}>
                  🎯 {task.title}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
          </div>
        </div>

        {/* Preset selections */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handlePresetChange("FOCUS")}
            className={`px-2.5 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider border transition-all ${
              currentMode === "FOCUS" && !isCustomMode
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-black"
                : "bg-[#060608] border-zinc-900 text-zinc-400 hover:border-zinc-800"
            }`}
          >
            Focus
          </button>
          <button
            onClick={() => handlePresetChange("SHORT_BREAK")}
            className={`px-2.5 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider border transition-all ${
              currentMode === "SHORT_BREAK"
                ? "bg-blue-500/15 border-blue-500/40 text-blue-400 font-black"
                : "bg-[#060608] border-zinc-900 text-zinc-400 hover:border-zinc-800"
            }`}
          >
            Rest
          </button>
          <button
            onClick={() => handlePresetChange("LONG_BREAK")}
            className={`px-2.5 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider border transition-all ${
              currentMode === "LONG_BREAK"
                ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-400 font-black"
                : "bg-[#060608] border-zinc-900 text-zinc-400 hover:border-zinc-800"
            }`}
          >
            Relax
          </button>
        </div>

        {/* Custom duration input toggle */}
        <div className="border-t border-zinc-900 pt-3">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase">
              ⚙ Custom Duration
            </span>
            {isCustomMode && customInput !== "" && (
              <span className={`text-xs font-mono font-bold ${
                currentMode === "FOCUS" ? "text-emerald-400" : "text-blue-400"
              }`}>{customInput}m</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="1"
              max="360"
              value={customInput}
              onChange={(e) => {
                const valStr = e.target.value;
                setCustomInput(valStr);
                if (valStr === "") {
                  let defaultMins = 25;
                  if (currentMode === "SHORT_BREAK") defaultMins = 5;
                  else if (currentMode === "LONG_BREAK") defaultMins = 15;
                  setDuration(defaultMins);
                  setTimeLeft(defaultMins * 60);
                  setIsCustomMode(false);
                }
              }}
              className={`w-24 bg-[#09090b] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 font-mono focus:outline-none transition-colors ${
                currentMode === "FOCUS" ? "focus:border-emerald-500" : "focus:border-blue-500"
              }`}
              placeholder="Min"
            />
            <button
              onClick={() => {
                audioEngine.playClickBeep(600, 0.05);
                const parsedVal = customInput === "" ? "" : Math.max(1, Math.min(360, Number(customInput) || 25));
                handlePresetChange("FOCUS", parsedVal);
              }}
              className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider font-mono transition-all cursor-pointer ${
                currentMode === "FOCUS"
                  ? "bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400"
                  : "bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/30 hover:border-blue-500/50 text-blue-400"
              }`}
            >
              {customInput === "" ? "Apply Default (25m)" : `Apply ${customInput}m`}
            </button>
          </div>
        </div>

        {/* Big Counter and Main Controls */}
        <div className="bg-[#060608] border border-zinc-900 rounded-xl p-4.5 flex flex-col items-center justify-center relative overflow-hidden">
          {/* Subtle background glow depending on active state */}
          <div className={`absolute -bottom-10 w-24 h-24 rounded-full opacity-10 blur-2xl pointer-events-none transition-colors ${
            isRunning 
              ? currentMode === "FOCUS" 
                ? "bg-emerald-500" 
                : "bg-blue-500"
              : "bg-zinc-800"
          }`} />

          <span className="text-4xl font-mono font-black text-white tracking-widest leading-none">
            {formatTime(timeLeft)}
          </span>
          <span className="text-[10px] font-mono text-zinc-550 uppercase tracking-widest mt-1.5 block">
            {activeFocusTask ? `Focusing: ${activeFocusTask.title.slice(0, 20)}...` : "Generic Objectives Focus"}
          </span>

          <div className="flex items-center space-x-3.5 mt-4.5 z-10">
            <button
              onClick={toggleTimer}
              className={`p-3 rounded-full cursor-pointer transition-all ${
                isRunning 
                  ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/35" 
                  : currentMode === "FOCUS"
                    ? "bg-emerald-500 hover:bg-emerald-450 text-zinc-950 shadow-md shadow-emerald-500/10"
                    : "bg-blue-500 hover:bg-blue-450 text-zinc-950 shadow-md shadow-blue-500/10"
              }`}
              title={isRunning ? "Pause Session" : "Start Focus Session"}
            >
              {isRunning ? <Pause className="h-4 w-4 stroke-[3]" /> : <Play className="h-4 w-4 fill-current stroke-[3]" />}
            </button>

            <button
              onClick={resetTimer}
              className="p-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 hover:border-zinc-700 rounded-full text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer"
              title="Reset timer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => {
                audioEngine.playClickBeep(750, 0.15);
                setIsFocusWindowOpen(true);
              }}
              className={`p-2.5 border rounded-full transition-all cursor-pointer ${
                currentMode === "FOCUS"
                  ? "bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/15 text-emerald-400"
                  : "bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/15 text-blue-400"
              }`}
              title="Open Aesthetic Focus Clock"
            >
              <Eye className="h-3.5 w-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. FULL SCREEN AESTHETIC FOCUS MODE WINDOW OVERLAY */}
      <AnimatePresence>
        {isFocusWindowOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#060608] text-zinc-100 flex flex-col justify-between p-6 sm:p-10 select-none overflow-y-auto"
          >
            {/* Ambient Breathing Background Grid */}
            <div className="absolute inset-0 bg-radial-at-c from-zinc-900/50 via-[#060608] to-[#040405] pointer-events-none opacity-80" />
            
            {/* Moving visual star dust backdrops or custom radial rings */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-zinc-900/40 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-zinc-900/20 pointer-events-none" />

            {/* TOP HEADER CONTROLS */}
            <div className="z-10 flex items-center justify-between border-b border-zinc-900 pb-5">
              <div className="flex items-center space-x-3">
                <span className={`p-1.5 rounded-lg border ${
                  currentMode === "FOCUS" 
                    ? "bg-emerald-500/10 border-emerald-500/25" 
                    : "bg-blue-500/10 border-blue-500/25"
                }`}>
                  <Clock className={`h-4.5 w-4.5 animate-spin-slow ${
                    currentMode === "FOCUS" ? "text-emerald-400" : "text-blue-400"
                  }`} />
                </span>
                <div>
                  <span className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">Cognitive Sanctuary</span>
                  <span className={`text-xs font-extrabold font-sans tracking-wide block ${
                    currentMode === "FOCUS" ? "text-[#5ed18f]" : "text-blue-400"
                  }`}>
                    {currentMode === "FOCUS" ? "Deep Focus Interval Active" : "Recovery Mindful Break"}
                  </span>
                </div>
              </div>

              {/* Task Title Indicator */}
              <div className="hidden md:flex items-center space-x-2.5 px-4.5 py-1.5 rounded-2xl bg-zinc-950 border border-zinc-900 max-w-sm">
                <ListTodo className={`h-3.5 w-3.5 shrink-0 ${currentMode === "FOCUS" ? "text-emerald-400" : "text-blue-400"}`} />
                <span className="text-xs font-mono font-bold text-zinc-300 truncate">
                  {activeFocusTask ? activeFocusTask.title : "Flow-state Project focus"}
                </span>
              </div>

              {/* Window Exit Control */}
              <button
                onClick={() => {
                  audioEngine.playClickBeep(500, 0.08);
                  setIsFocusWindowOpen(false);
                }}
                className="flex items-center space-x-2 px-3.5 py-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 text-xs font-mono font-bold text-zinc-400 hover:text-zinc-100 rounded-xl transition-all cursor-pointer"
              >
                <Minimize2 className="h-3.5 w-3.5 text-zinc-500" />
                <span className="hidden sm:inline">Minimize</span>
              </button>
            </div>

            {/* CENTER PIECE: THE AESTHETIC CLOCK PORTAL */}
            <div className="z-10 flex-1 flex flex-col items-center justify-center my-6 py-4 space-y-8">
              
              {/* Dynamic Theme selection and clock type selection row */}
              <div className="flex flex-wrap gap-2.5 justify-center items-center p-1 bg-zinc-950 border border-zinc-900 rounded-2xl">
                <button
                  onClick={() => {
                    audioEngine.playClickBeep(600, 0.05);
                    setClockStyle("DIGITAL");
                  }}
                  className={`px-3 py-1.5 text-[10px] font-mono font-black uppercase tracking-wider rounded-xl transition-all ${
                    clockStyle === "DIGITAL"
                      ? currentMode === "FOCUS"
                        ? "bg-zinc-900 text-emerald-400 border border-emerald-500/20 font-black"
                        : "bg-zinc-900 text-blue-400 border border-blue-500/20 font-black"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Digital Style
                </button>
                <button
                  onClick={() => {
                    audioEngine.playClickBeep(600, 0.05);
                    setClockStyle("ANALOG");
                  }}
                  className={`px-3 py-1.5 text-[10px] font-mono font-black uppercase tracking-wider rounded-xl transition-all ${
                    clockStyle === "ANALOG"
                      ? currentMode === "FOCUS"
                        ? "bg-zinc-900 text-emerald-400 border border-emerald-500/20 font-black"
                        : "bg-zinc-900 text-blue-400 border border-blue-500/20 font-black"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Swiss Analog
                </button>

                {clockStyle === "ANALOG" && (
                  <div className="h-4 w-px bg-zinc-850" />
                )}

                {clockStyle === "ANALOG" && (
                  <select
                    value={clockFace}
                    onChange={(e) => {
                      audioEngine.playClickBeep(550, 0.05);
                      setClockFace(e.target.value as any);
                    }}
                    className="bg-transparent text-[10px] font-mono text-zinc-400 hover:text-zinc-200 focus:outline-none pr-3 py-1 outline-none border-none cursor-pointer uppercase"
                  >
                    <option value="CYBERPUNK_GLOW">Cyber Glow</option>
                    <option value="SWISS_MINIMAL">Minimalist</option>
                    <option value="CHRONOGRAPH_ELITE">Chronograph</option>
                  </select>
                )}
              </div>

              {/* RENDER DYNAMIC VISUAL PORTAL */}
              <div className="relative w-72 h-72 sm:w-85 sm:h-85 flex items-center justify-center">
                
                {/* Visual state halo ring */}
                <div className={`absolute inset-0 rounded-full blur-3xl opacity-5 pointer-events-none transition-all duration-1000 ${
                  isRunning 
                    ? currentMode === "FOCUS" 
                      ? "bg-emerald-500 scale-105" 
                      : "bg-blue-500 scale-105"
                    : "bg-zinc-800 scale-100"
                }`} />

                {/* STYLE 1: FUTURISTIC DIGITAL CLOCK PORTAL */}
                {clockStyle === "DIGITAL" ? (
                  <div className="flex flex-col items-center justify-center text-center space-y-3">
                    
                    {/* Floating circular progress bar ring */}
                    <svg className="absolute w-full h-full transform -rotate-90 pointer-events-none">
                      <circle
                        cx="50%"
                        cy="50%"
                        r="45%"
                        className="stroke-zinc-900"
                        strokeWidth="2.5"
                        fill="transparent"
                      />
                      <motion.circle
                        cx="50%"
                        cy="50%"
                        r="45%"
                        className={`transition-colors duration-1000 ${
                          currentMode === "FOCUS" ? "stroke-emerald-500" : "stroke-blue-500"
                        }`}
                        strokeWidth="3.5"
                        fill="transparent"
                        strokeDasharray="282.6%"
                        strokeDashoffset={`${282.6 * pomodoroProgressPercent}%`}
                        strokeLinecap="round"
                        animate={{ strokeDashoffset: `${282.6 * pomodoroProgressPercent}%` }}
                      />
                    </svg>

                    {/* Massive beautiful typography clock readout */}
                    <div className="z-10 relative">
                      <span className="text-5xl sm:text-6.5xl font-mono font-black text-white tracking-widest leading-none drop-shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                        {formatTime(timeLeft)}
                      </span>
                      {/* Active ticking milliseconds/tenths for flow-state */}
                      {isRunning && (
                        <span className={`absolute -bottom-4 right-0 text-xs font-mono font-bold opacity-60 ${
                          currentMode === "FOCUS" ? "text-emerald-400" : "text-blue-400"
                        }`}>
                          .{Math.floor(Math.random() * 99).toString().padStart(2, "0")}
                        </span>
                      )}
                    </div>

                    <div className="z-10 pt-1 flex flex-col items-center">
                      <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase font-extrabold">
                        Time Remaining
                      </span>
                      <span className={`text-[11px] font-mono tracking-widest font-bold block mt-3 uppercase ${
                        currentMode === "FOCUS" ? "text-emerald-400/90" : "text-blue-400/90"
                      }`}>
                        | Local Time: {localTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                    </div>

                  </div>
                ) : (
                  
                  // STYLE 2: SWISS minimal/CYBER LUXURY ANALOG CHRONOGRAPH
                  <div className="w-full h-full relative">
                    <svg viewBox="0 0 200 200" className="w-full h-full z-10 relative">
                      {/* Watch Dial casing */}
                      <circle
                        cx="100"
                        cy="100"
                        r="95"
                        fill={clockFace === "CYBERPUNK_GLOW" ? "#0a0a0c" : "#060608"}
                        stroke={clockFace === "SWISS_MINIMAL" ? "rgba(228,228,231,0.06)" : currentMode === "FOCUS" ? "rgba(16, 185, 129, 0.15)" : "rgba(59, 130, 246, 0.15)"}
                        strokeWidth="3"
                      />

                      {/* Swiss Hour marks */}
                      {renderSwissTicks()}

                      {/* POMODORO COUNTDOWN REGION - Glowing elegant pie slice */}
                      <path
                        d={`
                          M 100,100
                          L 100,15
                          A 85,85 0 ${focusTimeRemainingAngle > 180 ? 1 : 0} 1 
                          ${100 + 85 * Math.sin(focusTimeRemainingAngle * Math.PI / 180)},
                          ${100 - 85 * Math.cos(focusTimeRemainingAngle * Math.PI / 180)}
                          Z
                        `}
                        fill={currentMode === "FOCUS" ? "rgba(16, 185, 129, 0.04)" : "rgba(59, 130, 246, 0.04)"}
                        stroke={currentMode === "FOCUS" ? "rgba(16, 185, 129, 0.25)" : "rgba(59, 130, 246, 0.25)"}
                        strokeWidth="1.5"
                        className="transition-all duration-1000"
                      />

                      {/* CHRONOGRAPH ELITE Nested Dial (If selected) */}
                      {clockFace === "CHRONOGRAPH_ELITE" && (
                        <g transform="translate(100, 140)">
                          {/* Inner mini dial circle */}
                          <circle cx="0" cy="0" r="22" fill="#040405" stroke="rgba(228,228,231,0.15)" strokeWidth="0.8" />
                          {/* Small countdown markers */}
                          <line x1="0" y1="-22" x2="0" y2="-17" stroke="rgba(228,228,231,0.2)" strokeWidth="0.8" />
                          <line x1="22" y1="0" x2="17" y2="0" stroke="rgba(228,228,231,0.2)" strokeWidth="0.8" />
                          <line x1="0" y1="22" x2="0" y2="17" stroke="rgba(228,228,231,0.2)" strokeWidth="0.8" />
                          <line x1="-22" y1="0" x2="-17" y2="0" stroke="rgba(228,228,231,0.2)" strokeWidth="0.8" />
                          {/* Mini sweep hand */}
                          <line 
                             x1="0" 
                             y1="0" 
                             x2={18 * Math.sin((timeLeft % 60) * 6 * Math.PI / 180)} 
                             y2={-18 * Math.cos((timeLeft % 60) * 6 * Math.PI / 180)} 
                             stroke={currentMode === "FOCUS" ? "#5ed18f" : "#60a5fa"} 
                             strokeWidth="1.2" 
                          />
                          <circle cx="0" cy="0" r="1.8" fill={currentMode === "FOCUS" ? "#5ed18f" : "#60a5fa"} />
                        </g>
                      )}

                      {/* STANDARD LOCAL CLOCK TIME HANDS (Hour, Minute, Seconds) */}
                      {/* 1. Hour Hand */}
                      <line
                        x1="100"
                        y1="100"
                        x2={100 + 44 * Math.sin(hoursAngle * Math.PI / 180)}
                        y2={100 - 44 * Math.cos(hoursAngle * Math.PI / 180)}
                        stroke={clockFace === "SWISS_MINIMAL" ? "#ffffff" : "#d4d4d8"}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />

                      {/* 2. Minute Hand */}
                      <line
                        x1="100"
                        y1="100"
                        x2={100 + 64 * Math.sin(minutesAngle * Math.PI / 180)}
                        y2={100 - 64 * Math.cos(minutesAngle * Math.PI / 180)}
                        stroke={clockFace === "SWISS_MINIMAL" ? "#e4e4e7" : "#a1a1aa"}
                        strokeWidth="2.2"
                        strokeLinecap="round"
                      />

                      {/* 3. Sweep Second Hand (Thin elegant needle) */}
                      <line
                        x1="100"
                        y1="100"
                        x2={100 + 74 * Math.sin(secondsAngle * Math.PI / 180)}
                        y2={100 - 74 * Math.cos(secondsAngle * Math.PI / 180)}
                        stroke={clockFace === "CYBERPUNK_GLOW" ? (currentMode === "FOCUS" ? "#10b981" : "#3b82f6") : "#f43f5e"}
                        strokeWidth="0.85"
                        strokeLinecap="round"
                      />

                      {/* 4. DEDICATED POMODORO FOCUS POINTER HAND - Glow needle */}
                      <line
                        x1="100"
                        y1="100"
                        x2={100 + 82 * Math.sin(focusTimeRemainingAngle * Math.PI / 180)}
                        y2={100 - 82 * Math.cos(focusTimeRemainingAngle * Math.PI / 180)}
                        stroke={currentMode === "FOCUS" ? "#5ed18f" : "#60a5fa"}
                        strokeWidth="1.5"
                        strokeDasharray="3 2"
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                      {/* Active indicator dot at focus hand end */}
                      <circle
                        cx={100 + 82 * Math.sin(focusTimeRemainingAngle * Math.PI / 180)}
                        cy={100 - 82 * Math.cos(focusTimeRemainingAngle * Math.PI / 180)}
                        r="3"
                        fill={currentMode === "FOCUS" ? "#10b981" : "#3b82f6"}
                        className="transition-all duration-1000 animate-pulse"
                      />

                      {/* Elegant Center Pin Cap */}
                      <circle cx="100" cy="100" r="4.5" fill="#18181b" stroke="#e4e4e7" strokeWidth="1.5" />
                    </svg>

                    {/* Compact digital readout nested below analog */}
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-center bg-zinc-950 px-4 py-1.5 rounded-full border border-zinc-900">
                      <span className="text-xl font-mono font-black text-white tracking-widest">{formatTime(timeLeft)}</span>
                    </div>
                  </div>
                )}

              </div>

            </div>

            {/* LOWER CONTROLS & AMBIENT SOUNDS BOARD */}
            <div className="z-10 grid grid-cols-1 md:grid-cols-12 gap-6 pt-5 border-t border-zinc-900 mt-6">
              
              {/* Left Side: Timer Controls */}
              <div className="md:col-span-5 flex flex-col justify-center space-y-4">
                <span className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase font-extrabold">Sprint Execution Controls</span>
                
                <div className="flex items-center space-x-4">
                  <button
                    onClick={toggleTimer}
                    className={`flex-1 flex items-center justify-center space-x-2 py-3 px-5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      isRunning
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30"
                        : currentMode === "FOCUS"
                          ? "bg-[#10b981] hover:bg-emerald-450 text-zinc-950 shadow-lg shadow-emerald-500/10"
                          : "bg-blue-500 hover:bg-blue-400 text-zinc-950 shadow-lg shadow-blue-500/10"
                    }`}
                  >
                    {isRunning ? (
                      <>
                        <Pause className="h-4 w-4 stroke-[3]" />
                        <span>Hold Flow</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 fill-current stroke-[3]" />
                        <span>{currentMode === "FOCUS" ? "Initiate Focus" : "Initiate Break"}</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={resetTimer}
                    className="p-3 bg-zinc-950 border border-zinc-900 hover:bg-zinc-900 hover:border-zinc-700 rounded-xl text-zinc-400 hover:text-zinc-150 transition-all cursor-pointer"
                    title="Reset Countdown"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>

                {/* Session Interval Selectors */}
                <div className="space-y-2 pt-2 border-t border-zinc-900/60">
                  <span className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase font-bold block">Configure Interval (Focus / Relax / Rest)</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      key="focus-preset-full"
                      onClick={() => handlePresetChange("FOCUS")}
                      className={`flex flex-col items-center justify-center py-2 rounded-xl text-[9px] font-extrabold uppercase tracking-wider border transition-all cursor-pointer ${
                        currentMode === "FOCUS" && !isCustomMode
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-black"
                          : "bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-350 hover:border-zinc-800"
                      }`}
                    >
                      <Zap className="h-3.5 w-3.5 mb-1 text-inherit" />
                      <span>Focus</span>
                    </button>
                    <button
                      key="short-preset-full"
                      onClick={() => handlePresetChange("SHORT_BREAK")}
                      className={`flex flex-col items-center justify-center py-2 rounded-xl text-[9px] font-extrabold uppercase tracking-wider border transition-all cursor-pointer ${
                        currentMode === "SHORT_BREAK"
                          ? "bg-blue-500/15 border-blue-500/40 text-blue-400 font-black"
                          : "bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-350 hover:border-zinc-800"
                      }`}
                    >
                      <Coffee className="h-3.5 w-3.5 mb-1 text-inherit" />
                      <span>Rest</span>
                    </button>
                    <button
                      key="long-preset-full"
                      onClick={() => handlePresetChange("LONG_BREAK")}
                      className={`flex flex-col items-center justify-center py-2 rounded-xl text-[9px] font-extrabold uppercase tracking-wider border transition-all cursor-pointer ${
                        currentMode === "LONG_BREAK"
                          ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-400 font-black"
                          : "bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-350 hover:border-zinc-800"
                      }`}
                    >
                      <Compass className="h-3.5 w-3.5 mb-1 text-inherit" />
                      <span>Relax</span>
                    </button>
                  </div>

                  {/* Custom duration numeric input */}
                  <div className="pt-2">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase">
                        ⚙ Custom Duration
                      </span>
                      {isCustomMode && customInput !== "" && (
                        <span className={`text-[10px] font-mono font-bold ${
                          currentMode === "FOCUS" ? "text-emerald-450" : "text-blue-400"
                        }`}>{customInput}m</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="1"
                        max="360"
                        value={customInput}
                        onChange={(e) => {
                          const valStr = e.target.value;
                          setCustomInput(valStr);
                          if (valStr === "") {
                            let defaultMins = 25;
                            if (currentMode === "SHORT_BREAK") defaultMins = 5;
                            else if (currentMode === "LONG_BREAK") defaultMins = 15;
                            setDuration(defaultMins);
                            setTimeLeft(defaultMins * 60);
                            setIsCustomMode(false);
                          }
                        }}
                        className={`w-20 bg-[#09090b] border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-200 font-mono focus:outline-none transition-colors ${
                          currentMode === "FOCUS" ? "focus:border-emerald-500" : "focus:border-blue-500"
                        }`}
                        placeholder="Min"
                      />
                      <button
                        onClick={() => {
                          audioEngine.playClickBeep(600, 0.05);
                          const parsedVal = customInput === "" ? "" : Math.max(1, Math.min(360, Number(customInput) || 25));
                          handlePresetChange("FOCUS", parsedVal);
                        }}
                        className={`flex-1 px-2.5 py-1.5 border rounded-lg text-[10px] font-bold uppercase tracking-wider font-mono transition-all cursor-pointer ${
                          currentMode === "FOCUS"
                            ? "bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400"
                            : "bg-blue-500/10 hover:bg-blue-500/15 border-blue-500/30 hover:border-blue-500/50 text-blue-400"
                        }`}
                      >
                        {customInput === "" ? "Apply Default (25m)" : `Apply ${customInput}m`}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Direct quick Complete button */}
                {selectedTaskId !== "generic" && (
                  <button
                    onClick={() => {
                      audioEngine.playSuccessBell();
                      if (onToggleTaskComplete && selectedTaskId) {
                        onToggleTaskComplete(selectedTaskId);
                        setIsFocusWindowOpen(false);
                      }
                    }}
                    className={`w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                      currentMode === "FOCUS"
                        ? "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/35 text-emerald-400"
                        : "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/35 text-blue-400"
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Deliver Task Roadmap as Completed</span>
                  </button>
                )}
              </div>

              {/* Middle Side: Custom Gap Column */}
              <div className="hidden md:block md:col-span-1 border-r border-zinc-900 my-2" />

              {/* Right Side: Ambient Sound Board */}
              <div className="md:col-span-6 flex flex-col justify-center space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase font-extrabold">Cognitive White & Sound Synthesizer</span>
                  <div className="flex items-center space-x-1.5 text-zinc-450">
                    <Music className={`h-3.5 w-3.5 ${currentMode === "FOCUS" ? "text-emerald-400" : "text-blue-400"}`} />
                    <span className="text-[10px] font-mono uppercase">Live Synthesis</span>
                  </div>
                </div>

                {/* Sound type buttons */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "silent", label: "Mute", icon: VolumeX },
                    { id: "binaural", label: "Theta Beats", icon: Zap },
                    { id: "brown", label: "Brownian", icon: Moon },
                    { id: "white", label: "White", icon: Sun }
                  ].map((snd) => (
                    <button
                      key={snd.id}
                      onClick={() => {
                        audioEngine.playClickBeep(650, 0.05);
                        setAmbientSound(snd.id as any);
                      }}
                      className={`flex flex-col items-center justify-center py-2.5 px-1.5 rounded-xl text-[9px] font-mono uppercase tracking-wider border transition-all cursor-pointer ${
                        ambientSound === snd.id
                          ? currentMode === "FOCUS"
                            ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-bold"
                            : "bg-blue-500/10 border-blue-500/40 text-blue-400 font-bold"
                          : "bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300 hover:border-zinc-850"
                      }`}
                    >
                      <snd.icon className="h-3.5 w-3.5 mb-1 text-inherit" />
                      <span>{snd.label}</span>
                    </button>
                  ))}
                </div>

                {/* Volume slider */}
                {ambientSound !== "silent" && (
                  <div className="flex items-center space-x-3.5 pt-1.5">
                    <VolumeX className="h-4 w-4 text-zinc-550" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={soundVolume}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setSoundVolume(val);
                      }}
                      className={`flex-1 bg-zinc-900 rounded-lg cursor-pointer h-1 ${
                        currentMode === "FOCUS" ? "accent-emerald-500" : "accent-blue-500"
                      }`}
                    />
                    <Volume2 className={`h-4 w-4 ${currentMode === "FOCUS" ? "text-emerald-400" : "text-blue-400"}`} />
                  </div>
                )}
              </div>

            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Non-Blocking Completion Banner */}
      <AnimatePresence>
        {completionBanner?.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#0c0c0e] border border-zinc-800 max-w-md w-full rounded-2xl p-6 shadow-2xl relative overflow-hidden"
            >
              {/* Decorative colored top line based on mode */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                completionBanner.mode === "FOCUS" ? "bg-emerald-500" : "bg-blue-500"
              }`} />

              <div className="flex items-center space-x-3 mb-4">
                <span className={`p-2 rounded-xl ${
                  completionBanner.mode === "FOCUS" ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"
                }`}>
                  <Bell className="h-5 w-5 animate-bounce" />
                </span>
                <h4 className="text-lg font-black uppercase tracking-wider font-sans text-zinc-100">
                  {completionBanner.mode === "FOCUS" ? "Deep Focus Achieved" : "Break Cycle Finished"}
                </h4>
              </div>

              <p className="text-zinc-300 text-sm leading-relaxed mb-6 font-sans">
                {completionBanner.text}
              </p>

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    audioEngine.playClickBeep(700, 0.1);
                    setCompletionBanner(null);
                  }}
                  className="px-5 py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-lg shadow-white/5"
                >
                  Acknowledge & Continue
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
