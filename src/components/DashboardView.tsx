import { useState, useEffect } from "react";
import { 
  Calendar, CheckSquare, AlertTriangle, ShieldCheck, 
  Sparkles, Clock, RefreshCw, Layers, CheckCircle2, ChevronDown, 
  Plus, CalendarDays, ExternalLink, HelpCircle, AlertOctagon,
  Trash2, BarChart2, Play, Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Task, Subtask, CalendarEvent, ActivityLog } from "../types";
import CalendarPlanner from "./CalendarPlanner";
import PomodoroTimer from "./PomodoroTimer";

interface DashboardViewProps {
  tasks: Task[];
  subtasks: Subtask[];
  events: CalendarEvent[];
  logs: ActivityLog[];
  onToggleSubtask: (subtaskId: string, completed: boolean) => void;
  onAddTaskClick: () => void;
  onTriggerOptimizer: () => void;
  onSyncCalendar: () => void;
  onDeleteTask: (taskId: string) => void;
  optimizerLoading: boolean;
  calendarLoading: boolean;
  userEmail?: string | null;
  activeFocusTaskId?: string | null;
  onClearActiveTask?: () => void;
  onStartFocusSession?: (taskId: string) => void;
  onToggleTaskComplete?: (taskId: string) => void;
  onAddActivityLog?: (action: string, details: string, category: "INFO" | "SUCCESS") => void;
}

function getFirstNameFromEmail(email: string | null | undefined): string {
  if (!email) return "User";
  const username = email.split("@")[0].toLowerCase();
  
  if (username.startsWith("ritwik")) {
    return "Ritwik";
  }
  
  const parts = username.split(/[\._\-0-9]+/);
  let firstPart = parts[0] || username;
  
  if (firstPart.length > 0) {
    return firstPart.charAt(0).toUpperCase() + firstPart.slice(1);
  }
  return "User";
}

const MOTIVATIONAL_WISDOM = [
  "Fact: Writing down your micro-milestones reduces cognitive load by up to 40%, freeing up vital focus.",
  "Quote: 'The secret of getting ahead is getting started.' — Mark Twain",
  "Fact: The 'flow state' can increase brain productivity and creative problem-solving by up to 500%.",
  "Quote: 'Focus is a muscle, and you build it by choosing what to ignore.'",
  "Fact: Deep focus is more effective in structured, single-tasking intervals than multi-tasking marathons.",
  "Quote: 'You do not rise to the level of your goals. You fall to the level of your systems.' — James Clear",
  "Fact: Taking deliberate breaks every 50-90 minutes aligns with ultradian rhythms to maximize cognitive output.",
  "Quote: 'It is not that we have a short time to live, but that we waste a lot of it.' — Seneca",
  "Fact: Just 20 minutes of complete focus can produce more than 3 hours of distracted multi-tasking.",
  "Quote: 'The best way to predict your future is to create it.' — Abraham Lincoln",
  "Fact: Small daily wins release dopamine, fueling continuous motivation and momentum.",
  "Quote: 'Simplicity is the ultimate sophistication.' — Leonardo da Vinci",
  "Fact: Decluttering your workspace lowers visual distractions, directly boosting active attention span.",
  "Quote: 'Action is the foundational key to all success.' — Pablo Picasso",
  "Fact: Your brain processes micro-rewards when completing bullet points – check your subtasks to stay energized."
];

export default function DashboardView({
  tasks,
  subtasks,
  events,
  logs,
  onToggleSubtask,
  onAddTaskClick,
  onTriggerOptimizer,
  onSyncCalendar,
  onDeleteTask,
  optimizerLoading,
  calendarLoading,
  userEmail,
  activeFocusTaskId,
  onClearActiveTask,
  onStartFocusSession,
  onToggleTaskComplete,
  onAddActivityLog
}: DashboardViewProps) {
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [isCompletedSectionOpen, setIsCompletedSectionOpen] = useState(false);
  
  // Real-time UTC status clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const [randomQuote, setRandomQuote] = useState(() => {
    return MOTIVATIONAL_WISDOM[Math.floor(Math.random() * MOTIVATIONAL_WISDOM.length)];
  });

  const handleNextQuote = () => {
    let next;
    do {
      next = MOTIVATIONAL_WISDOM[Math.floor(Math.random() * MOTIVATIONAL_WISDOM.length)];
    } while (next === randomQuote && MOTIVATIONAL_WISDOM.length > 1);
    setRandomQuote(next);
  };

  // Compute stats
  const totalCount = tasks.length;
  const completedCount = tasks.filter(t => t.status === "COMPLETED").length;
  const completedPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  const highRiskCount = tasks.filter(t => t.riskLevel === "HIGH" && t.status !== "COMPLETED").length;
  const pendingCount = tasks.filter(t => t.status !== "COMPLETED").length;

  // Average effort of pending tasks
  const pendingTasks = tasks.filter(t => t.status !== "COMPLETED");
  const avgEffort = pendingTasks.length > 0
    ? (pendingTasks.reduce((sum, t) => sum + (t.effortScore || 0), 0) / pendingTasks.length).toFixed(1)
    : "0.0";

  // Context-aware proactive warnings/notifications
  const riskWarnings = pendingTasks.filter(t => t.riskLevel === "HIGH" || t.riskLevel === "MEDIUM");

  const toggleExpand = (id: string) => {
    setExpandedTask(expandedTask === id ? null : id);
  };

  // Helper formatting dates beautifully
  const formatDeadline = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityColor = (level: string) => {
    switch (level) {
      case "CRITICAL": return "bg-red-500/10 text-red-400 border-red-500/25 shadow-[0_0_8px_rgba(239,68,68,0.1)]";
      case "HIGH": return "bg-orange-500/10 text-orange-400 border-orange-500/25 shadow-[0_0_8px_rgba(249,115,22,0.1)]";
      case "MEDIUM": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/25 shadow-[0_0_8px_rgba(234,179,8,0.1)]";
      default: return "bg-blue-500/10 text-blue-400 border-blue-500/25 shadow-[0_0_8px_rgba(59,130,246,0.1)]";
    }
  };

  const getPriorityIcon = (level: string) => {
    switch (level) {
      case "CRITICAL": return <AlertOctagon className="h-3.5 w-3.5 mr-1.5 text-red-400 inline" />;
      case "HIGH": return <AlertTriangle className="h-3.5 w-3.5 mr-1.5 text-orange-400 inline" />;
      case "MEDIUM": return <Sparkles className="h-3.5 w-3.5 mr-1.5 text-yellow-500 inline" />;
      default: return null;
    }
  };

  const getPriorityCardStyles = (task: Task, isExpanded: boolean) => {
    if (task.status === "COMPLETED") {
      return "border-zinc-900/60 opacity-55 saturate-50 hover:opacity-85";
    }
    
    switch (task.priority) {
      case "CRITICAL":
        return `border-l-[4px] border-l-red-500/80 ${
          isExpanded 
            ? "border-red-500/30 bg-red-950/[0.08] shadow-[0_0_25px_rgba(239,68,68,0.04)]" 
            : "border-zinc-800 hover:border-red-500/30 hover:bg-red-950/[0.02]"
        }`;
      case "HIGH":
        return `border-l-[4px] border-l-orange-500/80 ${
          isExpanded 
            ? "border-orange-500/30 bg-orange-950/[0.08] shadow-[0_0_25px_rgba(249,115,22,0.04)]" 
            : "border-zinc-800 hover:border-orange-500/30 hover:bg-orange-950/[0.02]"
        }`;
      case "MEDIUM":
        return `border-l-[4px] border-l-yellow-500/80 ${
          isExpanded 
            ? "border-yellow-500/30 bg-yellow-950/[0.08] shadow-[0_0_25px_rgba(234,179,8,0.04)]" 
            : "border-zinc-800 hover:border-yellow-500/30 hover:bg-yellow-950/[0.02]"
        }`;
      case "LOW":
      default:
        return `border-l-[4px] border-l-blue-500/80 ${
          isExpanded 
            ? "border-blue-500/30 bg-blue-950/[0.08] shadow-[0_0_25px_rgba(59,130,246,0.04)]" 
            : "border-zinc-800 hover:border-blue-500/30 hover:bg-blue-950/[0.02]"
        }`;
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "HIGH": return "text-red-400";
      case "MEDIUM": return "text-yellow-500";
      default: return "text-[#5ed18f]";
    }
  };

  const renderTaskCard = (task: Task) => {
    const isExpanded = expandedTask === task.id;
    const taskSubtasks = subtasks.filter(s => s.taskId === task.id);
    const completedSubCount = taskSubtasks.filter(s => s.completed).length;
    const totalSubCount = taskSubtasks.length;
    
    return (
      <motion.div
        key={task.id}
        layout="position"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`bg-[#0c0c0e] border rounded-xl overflow-hidden transition-all ${getPriorityCardStyles(task, isExpanded)}`}
      >
        {/* Header Row */}
        <div 
          onClick={() => toggleExpand(task.id)}
          className="p-5 cursor-pointer flex items-start space-x-4 select-none"
        >
          {/* Checkbox for Parent Task completion */}
          <div className="pt-3.5 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onToggleTaskComplete) {
                  onToggleTaskComplete(task.id);
                }
              }}
              className={`h-6 w-6 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                task.status === "COMPLETED"
                  ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                  : "border-zinc-700 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-transparent hover:text-emerald-500/40"
              }`}
              title={task.status === "COMPLETED" ? "Mark as Pending" : "Mark as Completed"}
            >
              <Check className="h-3.5 w-3.5 stroke-[3]" />
            </button>
          </div>

          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={`flex items-center px-3 py-1 border text-xs sm:text-sm font-bold font-mono uppercase rounded-md ${getPriorityColor(task.priority)}`}>
                {getPriorityIcon(task.priority)}
                <span>{task.priority}</span>
              </span>
            
              {task.status === "COMPLETED" ? (
                <span className="px-3 py-1 bg-emerald-500/10 text-[#5ed18f] border border-emerald-500/20 text-xs sm:text-sm font-bold font-mono uppercase rounded-md">
                  COMPLETED
                </span>
              ) : (
                <span className="text-xs sm:text-sm text-zinc-350 font-mono font-extrabold">
                  Due: {formatDeadline(task.deadline)}
                </span>
              )}
            </div>

            <h4 className={`text-lg sm:text-xl lg:text-2xl font-black font-sans mt-3 transition-all duration-300 ${task.status === "COMPLETED" ? "line-through decoration-emerald-500/40 decoration-[2.5px] text-zinc-500 opacity-60" : "text-zinc-100"}`}>
              {task.title}
            </h4>

            <p className="text-sm sm:text-base text-zinc-350 font-sans max-w-xl truncate leading-relaxed">
              {task.description}
            </p>
          </div>

          {/* Right-aligned meta badge indicators */}
          <div className="flex items-center space-x-6 self-center text-right pr-4 shrink-0">
            {task.status !== "COMPLETED" && onStartFocusSession && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStartFocusSession(task.id);
                }}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 font-mono uppercase tracking-wider transition-colors cursor-pointer"
                title="Launch Focus Mode"
              >
                <Play className="h-3 w-3 fill-current text-emerald-400" />
                <span>Focus</span>
              </button>
            )}

            <div className="text-right hidden sm:block">
              <span className="text-[11px] block text-zinc-500 font-mono font-bold tracking-wider">RISK LEVEL</span>
              <span className={`text-sm sm:text-base font-black font-mono leading-none mt-1 block ${getRiskColor(task.riskLevel)}`}>
                {task.riskLevel}
              </span>
            </div>

            <div className="text-right hidden sm:block font-mono">
              <span className="text-[11px] block text-zinc-500 font-mono font-bold tracking-wider">SUBTASKS</span>
              <span className="text-sm sm:text-base font-black text-zinc-100 leading-none mt-1 block">
                {completedSubCount}/{totalSubCount}
              </span>
            </div>

            <motion.button
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="p-1 text-zinc-500 hover:text-zinc-300"
            >
              <ChevronDown className="h-5 w-5" />
            </motion.button>
          </div>
        </div>

        {/* Expandable Subtask Checklists, Custom Estimates, Scheduled slots */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              className="border-t border-zinc-800 bg-[#09090b] overflow-hidden"
            >
              <div className="p-5 space-y-4">
                {/* AI Risk Reason explanation if available */}
                {task.riskReason && (
                  <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl">
                    <span className="text-[10px] sm:text-xs text-amber-400 font-mono block font-bold mb-1.5 uppercase tracking-wider">AI Diagnostic Assessment</span>
                    <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">{task.riskReason}</p>
                  </div>
                )}

                {/* Scheduled block notification */}
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] sm:text-xs text-emerald-450 font-mono block font-bold uppercase tracking-wider">Secured Calendar Lock</span>
                    <span className="text-xs sm:text-sm text-zinc-100 font-bold font-mono block mt-1">
                      {task.scheduledSlot ? formatDeadline(task.scheduledSlot.split(" - ")[0]) + " - " + formatDeadline(task.scheduledSlot.split(" - ")[1]) : "NOT SCHEDULED YET"}
                    </span>
                  </div>
                  {task.scheduledSlot ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] sm:text-xs font-bold font-mono uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      {task.googleCalendarConnected ? "Synced to GCal" : "Awaiting Sync Commit"}
                    </span>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); onTriggerOptimizer(); }}
                      className="text-xs sm:text-sm text-emerald-450 hover:text-emerald-350 font-mono font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Book Slot
                    </button>
                  )}
                </div>

                {/* Subtask milestones Checklist */}
                <div>
                  <span className="text-[10px] sm:text-xs text-zinc-500 font-mono block font-bold mb-3.5 uppercase tracking-wider">Subtask Milestones</span>
                  
                  {taskSubtasks.length === 0 ? (
                    <div className="text-xs sm:text-sm text-zinc-550 italic py-2">
                      No milestones are currently generated. Run AI breakdown in New Task creator or chat below.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {taskSubtasks.map((sub) => (
                        <div 
                          key={sub.id} 
                          className="flex items-center justify-between p-3.5 bg-[#0c0c0e] border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors"
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            <input
                              type="checkbox"
                              checked={sub.completed}
                              onChange={(e) => onToggleSubtask(sub.id, e.target.checked)}
                              className="h-4.5 w-4.5 bg-[#09090b] border-zinc-800 rounded focus:ring-emerald-500 focus:text-emerald-500 transition-all text-emerald-500 cursor-pointer"
                            />
                            <span className={`text-xs sm:text-sm transition-all duration-300 ${sub.completed ? "line-through decoration-emerald-500/40 decoration-[1.5px] text-zinc-500 opacity-60" : "text-zinc-200"}`}>
                              {sub.title}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs text-zinc-450 font-mono font-bold uppercase">{sub.estimatedMinutes} Mins</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Delete Task */}
                <div className="pt-3 border-t border-zinc-850 flex justify-end">
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                    className="flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-red-950/40 hover:bg-red-950/10 text-xs text-red-400 font-mono transition-colors font-bold uppercase cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Timeline</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-900/60 pb-4 space-y-4 sm:space-y-0">
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] bg-emerald-500/10 text-[#5ed18f] border border-emerald-500/25 px-2.5 py-0.5 rounded-md font-mono font-black uppercase tracking-widest">SYSTEM v2.6.4</span>
          <span className="text-zinc-600 text-xs font-mono font-bold">/ baseline-monitoring-active</span>
        </div>
      </header>

      {/* Bento Grid Top Row: Hero Greeting + Secondary Stats Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Bento Box: Greeting Hero Block (approx col-span-8 or col-span-12) */}
        <div className={`${tasks.length > 0 ? "lg:col-span-8" : "lg:col-span-12"} bg-gradient-to-br from-[#0c0c0e]/80 to-[#070709]/90 backdrop-blur-xl border border-white/[0.05] rounded-2xl p-8 flex flex-col justify-center relative overflow-hidden min-h-[240px] shadow-2xl shadow-black/40`}>
          
          {/* Clock Widget (IST) */}
          <div 
            style={{ marginBottom: '0px', height: '77px' }}
            className="sm:absolute sm:top-8 sm:right-8 sm:mb-0 flex items-center gap-3 bg-[#050507]/60 backdrop-blur-md border-2 border-dashed border-white/[0.05] hover:border-emerald-550/20 px-4 py-2.5 rounded-xl text-right z-10 self-start sm:self-auto transition-all duration-300 text-[20px] leading-[28px] text-justify"
          >
            <Clock style={{ width: '29px', height: '26px' }} className="text-emerald-450 animate-spin-slow shrink-0" />
            <div className="text-left font-mono">
              <span className="text-[15px] text-zinc-500 border-[#34d0ce] block uppercase font-black tracking-widest leading-none">CURRENT TIME (IST)</span>
              <span className="h-[15px] text-[40px] leading-[22px] font-extrabold text-[#5ed18f] tracking-widest block mt-1.5">
                {currentTime.toLocaleTimeString('en-US', {
                  timeZone: 'Asia/Kolkata',
                  hour12: false,
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </span>
            </div>
          </div>

          <div className="absolute -top-10 -right-10 p-8 opacity-[0.03] pointer-events-none select-none">
            <svg className="w-64 h-64 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          
          <span className="text-[10px] text-[#5ed18f] font-mono font-black tracking-widest uppercase mb-2 flex items-center">
            <span className="h-2 w-2 rounded-full bg-emerald-500 mr-2.5 animate-pulse" />
            AI COGNITIVE BASELINE NORMAL
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extralight text-zinc-150 tracking-tight leading-tight mb-2">
            Welcome back, <span className="font-black text-white bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">{getFirstNameFromEmail(userEmail)}.</span>
          </h1>
          
          <div className="space-y-2 mb-6">
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              Preempt AI has audited your roadmap. Currently monitoring{" "}
              <span className="text-emerald-450 font-mono font-black">{pendingCount} pending baseline tasks</span>.
            </p>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              <span 
                onClick={handleNextQuote}
                title="Click to cycle inspiration"
                className="text-emerald-400/95 italic cursor-pointer select-none border-b border-dashed border-emerald-500/30 hover:text-emerald-300 hover:border-emerald-400/50 transition-colors inline-block"
              >
                "{randomQuote}"
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button 
              onClick={onAddTaskClick}
              className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 hover:scale-105 active:scale-[0.98] text-zinc-950 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/40 cursor-pointer animate-float"
            >
              Record New Task
            </button>
          </div>
        </div>

        {/* Bento Box: 4 Mini Gauge Metrics Widgets (approx col-span-4) - Rendered ONLY if there are tasks */}
        {tasks.length > 0 && (
          <div className="lg:col-span-4 grid grid-cols-2 gap-4">
            <div className="bg-[#0a0a0c]/60 backdrop-blur-xl border border-white/[0.04] rounded-2xl p-5 flex flex-col items-center justify-center text-center transition-all duration-300 hover:border-white/[0.08] hover:-translate-y-0.5 shadow-xl hover:shadow-black/60">
              <div className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-2">Roadmap Health</div>
              <div className="text-3xl font-mono text-emerald-400 font-extrabold tracking-tight">{completedPercent}%</div>
              <span className="text-[10px] text-zinc-500 font-mono mt-1.5">({completedCount}/{totalCount} done)</span>
            </div>

            <div className="bg-[#0a0a0c]/60 backdrop-blur-xl border border-white/[0.04] rounded-2xl p-5 flex flex-col items-center justify-center text-center transition-all duration-300 hover:border-white/[0.08] hover:-translate-y-0.5 shadow-xl hover:shadow-black/60">
              <div className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-2">Threat Level</div>
              <div className={`text-3xl font-mono font-extrabold tracking-tight ${highRiskCount > 0 ? "text-red-400" : "text-emerald-450"}`}>
                {highRiskCount > 0 ? `${highRiskCount} Risky` : "STABLE"}
              </div>
              <span className="text-[10px] text-zinc-500 font-mono mt-1.5">Slippage monitored</span>
            </div>

            <div className="bg-[#0a0a0c]/60 backdrop-blur-xl border border-white/[0.04] rounded-2xl p-5 flex flex-col items-center justify-center text-center transition-all duration-300 hover:border-white/[0.08] hover:-translate-y-0.5 shadow-xl hover:shadow-black/60">
              <div className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-2">Avg Workload</div>
              <div className="text-3xl font-mono text-amber-400 font-extrabold tracking-tight">{avgEffort}</div>
              <span className="text-[10px] text-zinc-500 font-mono mt-1.5">Effort coeff (10 max)</span>
            </div>

            <div className="bg-[#0a0a0c]/60 backdrop-blur-xl border border-white/[0.04] rounded-2xl p-5 flex flex-col items-center justify-center text-center relative transition-all duration-300 hover:border-white/[0.08] hover:-translate-y-0.5 shadow-xl hover:shadow-black/60">
              <div className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1.5">GCal Feeds</div>
              <div className="text-3xl font-mono font-extrabold text-[#5ed18f] tracking-tight">
                {events.filter(e => e.source === "GOOGLE_CALENDAR").length}
              </div>
              <button
                onClick={onSyncCalendar}
                disabled={calendarLoading}
                className="text-[9px] font-black text-blue-400 hover:text-blue-300 tracking-widest font-mono mt-2 uppercase leading-none transition-colors cursor-pointer"
              >
                {calendarLoading ? "Syncing..." : "Commit Feed"}
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Proactive warnings if drift imminent */}
      <AnimatePresence>
        {riskWarnings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-500/[0.02] border border-red-500/15 p-5 rounded-2xl flex items-start space-x-4 shadow-lg shadow-red-500/[0.02]"
          >
            <AlertOctagon className="h-5.5 w-5.5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="text-[10px] font-black text-red-400 font-mono uppercase tracking-widest block">
                VULNERABILITY WARNING: "{riskWarnings[0].title}"
              </span>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 max-w-3xl leading-relaxed">
                This project deadline is tight. Deploy Preempt de-confliction engine to secure protective blocks.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Layout Block: Split Roadmaps & Synced Timetable */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Comprehensive Roadmaps (6 blocks on xl, 12 on lg) */}
        <div className="lg:col-span-12 xl:col-span-6 space-y-6">
          <div className="flex items-center justify-between py-2.5 border-b border-zinc-900 pb-4">
            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-zinc-100 flex items-center gap-4 sm:gap-6 font-sans">
              Critical Timeline Roadmap
              <span className="px-3.5 py-1 rounded-lg text-xs bg-emerald-500/10 text-[#5ed18f] border border-emerald-500/20 font-mono font-black">{pendingCount} Active</span>
            </h3>

            <button
              onClick={onAddTaskClick}
              className="flex items-center space-x-2 px-4.5 py-2.5 bg-[#0a0a0c]/80 border border-emerald-550/20 hover:border-emerald-500/40 hover:bg-emerald-500/[0.08] hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/20 active:scale-95 rounded-xl text-xs sm:text-sm font-extrabold text-emerald-400 font-sans cursor-pointer transition-all duration-300 shadow-lg shadow-black/50 animate-float"
            >
              <Plus className="h-4.5 w-4.5 text-emerald-400" />
              <span>Record Task</span>
            </button>
          </div>

          <div className="space-y-6">
            <AnimatePresence>
              {tasks.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[#0a0a0c]/40 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-12 text-center shadow-xl"
                >
                  <div className="max-w-md mx-auto space-y-6">
                    <div className="mx-auto w-16 h-16 rounded-full bg-zinc-950 border border-zinc-850 flex items-center justify-center text-zinc-400">
                      <Plus className="h-8 w-8 text-emerald-450" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-zinc-100">No active roadmap tasks</h4>
                      <p className="text-xs sm:text-sm text-zinc-450 mt-2 max-w-sm mx-auto leading-relaxed">
                        Your baseline is clean. Record a new task manually or chat with Preempt AI to map out your upcoming targets.
                      </p>
                    </div>
                    <button
                      onClick={onAddTaskClick}
                      className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 hover:scale-105 active:scale-95 text-zinc-950 rounded-xl text-xs sm:text-sm font-black uppercase tracking-widest transition-all duration-300 cursor-pointer shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/40 animate-float"
                    >
                      Record Your First Task
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  {/* Pending Tasks Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-1">
                      <span className="text-[10px] font-black font-mono text-zinc-500 uppercase tracking-widest">
                        PENDING TIMELINE ({pendingCount})
                      </span>
                    </div>
                    {pendingCount === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-10 border border-zinc-800 border-dashed rounded-2xl text-center bg-[#0a0a0c]/20"
                      >
                        <p className="text-zinc-400 text-xs sm:text-sm font-medium">🎉 All roadmap tasks completed! High cognitive baseline achieved.</p>
                      </motion.div>
                    ) : (
                      tasks.filter(t => t.status !== "COMPLETED").map((task) => renderTaskCard(task))
                    )}
                  </div>

                  {/* Completed Tasks Accordion */}
                  {completedCount > 0 && (
                    <div className="border border-zinc-850/80 bg-[#0a0a0c]/20 backdrop-blur-sm rounded-xl overflow-hidden mt-8 shadow-xl">
                      <button
                        onClick={() => setIsCompletedSectionOpen(!isCompletedSectionOpen)}
                        className="w-full flex items-center justify-between p-4.5 bg-zinc-950/[0.15] hover:bg-zinc-950/[0.3] transition-colors text-left cursor-pointer select-none"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="h-4.5 w-4.5" />
                          </span>
                          <span className="text-[11px] font-black font-mono uppercase tracking-widest text-zinc-300">
                            Completed Roadmap Archives ({completedCount})
                          </span>
                        </div>
                        <motion.div
                           animate={{ rotate: isCompletedSectionOpen ? 180 : 0 }}
                           transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="h-5 w-5 text-zinc-400" />
                        </motion.div>
                      </button>

                      <AnimatePresence>
                        {isCompletedSectionOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-zinc-900/60 overflow-hidden"
                          >
                            <div className="p-5 space-y-4 bg-[#050507]/60">
                              {tasks.filter(t => t.status === "COMPLETED").map((task) => renderTaskCard(task))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Center Column: Pomodoro Focus Engine */}
        <div className="lg:col-span-6 xl:col-span-3 space-y-6">
          <PomodoroTimer
            tasks={tasks}
            activeTaskId={activeFocusTaskId}
            onClearActiveTask={onClearActiveTask}
            onToggleTaskComplete={onToggleTaskComplete}
            onAddActivityLog={onAddActivityLog}
          />
        </div>

        {/* Right Column: Synced Calendar Timetable planner */}
        <div className="lg:col-span-6 xl:col-span-3 space-y-6">
          <CalendarPlanner
            tasks={tasks}
            events={events}
            onAddTaskClick={onAddTaskClick}
            onTriggerOptimizer={onTriggerOptimizer}
          />
        </div>

      </div>

    </div>
  );
}
