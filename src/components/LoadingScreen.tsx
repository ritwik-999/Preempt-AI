import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ListTodo, Terminal } from "lucide-react";

interface LoadingScreenProps {
  onComplete: () => void;
}

const BOOT_LOGS = [
  { percent: 0, text: "Initializing Preempt Core System Initialization..." },
  { percent: 15, text: "Syncing REST architecture with secure local storage cache..." },
  { percent: 35, text: "Bootstrapping neural calendar predictive risk matrices..." },
  { percent: 55, text: "Scanning imminent deadline schedules and milestones..." },
  { percent: 75, text: "Authorizing end-user encryption keypairs..." },
  { percent: 90, text: "Preempt engine fully synchronized and ready." },
];

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [currentLog, setCurrentLog] = useState(BOOT_LOGS[0].text);
  const [isFinishing, setIsFinishing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const speedMultiplierRef = useRef(1.0);

  // HTML5 Matrix digital rain background generator
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Matrix characters: mix of binary, hex, and task symbols
    const matrixChars = "0101100101XYZΩΔΦΨ⏰⚡✓⚙✔✖✈☁⚙🔋".split("");
    const fontSize = 14;
    let columns = Math.floor(canvas.width / fontSize) + 1;
    
    // Array to hold vertical coordinate positions of rain drops
    let drops: number[] = Array(columns).fill(1).map(() => Math.floor(Math.random() * -30));

    const drawMatrix = () => {
      // Semi-transparent background creates trailing fade effect
      ctx.fillStyle = `rgba(9, 9, 11, ${0.06 / speedMultiplierRef.current})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        // Pick a random symbol
        const symbol = matrixChars[Math.floor(Math.random() * matrixChars.length)];
        
        // As speed multipliers surge, colors become brighter & more neon teal
        const isSpike = speedMultiplierRef.current > 1.8;
        if (isSpike) {
          ctx.fillStyle = Math.random() > 0.8 ? "#34d399" : "#10b981";
        } else {
          ctx.fillStyle = Math.random() > 0.95 ? "#a7f3d0" : "#059669"; // head highlight vs regular stream
        }

        const x = i * fontSize;
        const y = drops[i] * fontSize;

        ctx.fillText(symbol, x, y);

        // Reset drop back to top after reaching bottom with staggered chances
        if (y > canvas.height && Math.random() * 100 > 97.5) {
          drops[i] = 0;
        }

        // Drop increment speed scaled by our transition trigger multiplier
        drops[i] += 1 * speedMultiplierRef.current;
      }

      animationFrameId = requestAnimationFrame(drawMatrix);
    };

    drawMatrix();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  useEffect(() => {
    let currentProgress = 0;
    
    // Simulate smart progressive loading ticker
    const interval = setInterval(() => {
      // Add random load jump increments to look organic and progress a bit slower
      const increment = Math.max(1, Math.floor(Math.random() * 3) + 2); // 2 to 4 percent per step
      currentProgress = Math.min(currentProgress + increment, 100);
      setProgress(currentProgress);

      // Surge matrix raining speed as progress reaches completion to create exit blur excitement!
      if (currentProgress > 60) {
        speedMultiplierRef.current = 1.0 + (currentProgress - 60) * 0.05; // scales up to 3.0x speed!
      }

      // Dynamically select matching technical audit message
      const matchingLog = [...BOOT_LOGS]
        .reverse()
        .find((log) => currentProgress >= log.percent);
      if (matchingLog) {
        setCurrentLog(matchingLog.text);
      }

      if (currentProgress >= 100) {
        clearInterval(interval);
        // Add a satisfying terminal completion pause before exiting
        setTimeout(() => {
          setIsFinishing(true);
          setTimeout(() => {
            onComplete();
          }, 800); // match motion exit card transition duration
        }, 800);
      }
    }, 110);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!isFinishing && (
        <motion.div
          id="preempt-global-loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.75, ease: "easeInOut" }}
          className="fixed inset-0 bg-[#09090b] z-[99999] flex flex-col items-center justify-center p-6 text-zinc-100 font-mono select-none overflow-hidden"
        >
          {/* HTML5 Matrix Rain Animation Layer */}
          <canvas 
            ref={canvasRef} 
            className="absolute inset-0 w-full h-full opacity-[0.25] pointer-events-none z-0" 
          />

          {/* Dashboard Ambient Star/Dust backing */}
          <div className="absolute inset-x-0 bottom-0 top-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.04)_0%,transparent_70%)] pointer-events-none z-10" />

          {/* Central content housing */}
          <div className="w-full max-w-lg space-y-8 relative z-20">
            
            {/* Master Application Logo Emblem */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 relative">
                <ListTodo className="h-8 w-8 animate-pulse text-emerald-400" />
                <div className="absolute inset-0 rounded-2xl bg-emerald-400/10 blur-xl animate-pulse" />
              </div>
              <div className="space-y-1">
                <h1 className="text-xl font-sans tracking-tight font-semibold text-zinc-100">
                  PREEMPT <span className="text-emerald-400 font-mono tracking-widest text-xs font-bold bg-emerald-500/10 px-2 py-0.5 rounded ml-1">AI</span>
                </h1>
                <p className="text-[10px] text-zinc-500 tracking-wider uppercase">
                  Personal Task Architect & Timeline Safehouse
                </p>
              </div>
            </div>

            {/* Glowing HUD Numeric Percentage */}
            <div className="text-center">
              <span className="text-7xl font-sans font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-zinc-100 to-zinc-400">
                {String(progress).padStart(3, "0")}
              </span>
              <span className="text-emerald-400 text-lg font-bold ml-1">%</span>
            </div>

            {/* Digital Progress tracks */}
            <div className="space-y-2">
              <div className="h-1.5 w-full bg-zinc-900 rounded-full border border-zinc-800 overflow-hidden relative p-[1px]">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-zinc-500 tracking-wider">
                <span>SYSTEM CORE_OFFLINE</span>
                <span>DESIRED_RECONCILIATION: 100%</span>
              </div>
            </div>

            {/* Simulated Live Terminal Node logs */}
            <div className="bg-[#0e0e11] border border-zinc-800 rounded-xl p-4 min-h-[90px] flex flex-col justify-between shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 h-40 w-40 bg-emerald-500/5 blur-3xl rounded-full" />
              
              <div className="flex items-center space-x-2 text-zinc-400 border-b border-zinc-950 pb-2 mb-2 text-xs">
                <Terminal className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="font-semibold text-[10px] tracking-wider uppercase text-zinc-400">Preempt_Diagnostic.sh</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse ml-auto" />
              </div>

              <div className="text-xs text-zinc-300 leading-relaxed font-mono flex items-start space-x-2">
                <span className="text-emerald-500/70 shrink-0 select-none">&gt;</span>
                <span className="animate-pulse">{currentLog}</span>
              </div>
              
              <div className="text-[9px] text-zinc-600 mt-2 text-right">
                BLOCK_ID: PREEMPT_X90_SECURE
              </div>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
