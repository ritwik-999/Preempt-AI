import { useState, useEffect } from "react";
import { 
  Calendar, CheckSquare, AlertTriangle, ShieldCheck, 
  Sparkles, Clock, RefreshCw, Layers, CheckCircle2, ChevronDown, 
  Plus, CalendarDays, ExternalLink, HelpCircle, AlertOctagon,
  Trash2, BarChart2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Task, Subtask, CalendarEvent, ActivityLog } from "../types";
import CalendarPlanner from "./CalendarPlanner";

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
  userEmail
}: DashboardViewProps) {
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  
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
      case "CRITICAL": return "bg-red-500/10 text-red-400 border-red-500/20";
      case "HIGH": return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "MEDIUM": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default: return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "HIGH": return "text-red-400";
      case "MEDIUM": return "text-yellow-500";
      default: return "text-[#5ed18f]";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-5 space-y-4 sm:space-y-0">
        <div className="flex items-center gap-2" />
        <div className="flex items-center gap-4 bg-[#0c0c0e] border border-zinc-800 px-4 py-2 rounded-xl text-right shrink-0">
          <Clock className="h-4 w-4 text-emerald-400 mr-2 animate-spin-slow" />
          <div className="text-left font-mono">
            <span className="text-[9px] text-zinc-500 block uppercase font-bold leading-none">CURRENT CLOCK (UTC)</span>
            <span className="text-xs font-bold text-[#5ed18f] tracking-widest block mt-0.5 leading-none">
              {currentTime.toUTCString().slice(17, 25)}
            </span>
          </div>
        </div>
      </header>

      {/* Bento Grid Top Row: Hero Greeting + Secondary Stats Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Bento Box: Greeting Hero Block (approx col-span-8 or col-span-12) */}
        <div className={`${tasks.length > 0 ? "lg:col-span-8" : "lg:col-span-12"} bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden min-h-[220px]`}>
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <svg className="w-44 h-44 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          
          <span className="text-[10px] text-emerald-450 font-mono font-bold tracking-widest uppercase mb-1 flex items-center">
            <span className="h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
            Cognitive Baseline Normal
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-5.5xl font-light text-zinc-100 tracking-tight leading-tight mb-2">
            Welcome back, <span className="font-extrabold text-white">{getFirstNameFromEmail(userEmail)}.</span>
          </h1>
          
          <p className="text-zinc-400 max-w-xl text-xs sm:text-sm leading-relaxed mb-5">
            Preempt AI has audited your roadmap. Currently monitoring{" "}
            <span className="text-emerald-400 font-mono font-bold">{pendingCount} pending baseline tasks</span>.{" "}
            <span 
              onClick={handleNextQuote}
              title="Click to cycle inspiration"
              className="text-emerald-400/90 italic cursor-pointer select-none border-b border-dashed border-emerald-500/20 hover:text-emerald-300 hover:border-emerald-400/40 transition-colors"
            >
              {randomQuote}
            </span>
          </p>

          <div className="flex flex-wrap gap-3">
            <button 
              onClick={onTriggerOptimizer}
              disabled={optimizerLoading}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-450 text-zinc-950 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
            >
              {optimizerLoading ? "De-conflicting..." : "Optimize Baseline"}
            </button>
            <button 
              onClick={onAddTaskClick}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Record New Task
            </button>
          </div>
        </div>

        {/* Bento Box: 4 Mini Gauge Metrics Widgets (approx col-span-4) - Rendered ONLY if there are tasks */}
        {tasks.length > 0 && (
          <div className="lg:col-span-4 grid grid-cols-2 gap-4">
            <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest mb-1.5">Roadmap Health</div>
              <div className="text-2xl font-mono text-emerald-400 font-bold">{completedPercent}%</div>
              <span className="text-[9px] text-zinc-650 font-mono mt-1">({completedCount}/{totalCount} completed)</span>
            </div>

            <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest mb-1.5">Threat Level</div>
              <div className={`text-2xl font-mono font-bold ${highRiskCount > 0 ? "text-red-400" : "text-emerald-450"}`}>
                {highRiskCount > 0 ? `${highRiskCount} Risky` : "STABLE"}
              </div>
              <span className="text-[9px] text-zinc-650 font-mono mt-1">Slippage monitored</span>
            </div>

            <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest mb-1.5">Avg Workload</div>
              <div className="text-2xl font-mono text-amber-400 font-bold">{avgEffort}</div>
              <span className="text-[9px] text-zinc-650 font-mono mt-1">Effort coeff (10 max)</span>
            </div>

            <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center relative">
              <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest mb-1">GCal Feeds</div>
              <div className="text-xl font-mono font-bold text-[#5ed18f]">
                {events.filter(e => e.source === "GOOGLE_CALENDAR").length}
              </div>
              <button
                onClick={onSyncCalendar}
                disabled={calendarLoading}
                className="text-[8px] font-bold text-blue-400 hover:text-blue-300 tracking-wider font-mono mt-1.5 uppercase leading-none transition-colors"
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
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#0c0c0e] border border-zinc-800 p-4.5 rounded-xl flex items-start space-x-3.5"
          >
            <AlertOctagon className="h-5.5 w-5.5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="text-[10px] font-bold text-red-400 font-mono uppercase tracking-wider block">
                Vulnerability warning: "{riskWarnings[0].title}"
              </span>
              <p className="text-xs text-zinc-400 mt-1">
                This project deadline is tight. Deploy Preempt de-confliction engine to secure protective blocks.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Layout Block: Split Roadmaps & Synced Timetable */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Comprehensive Roadmaps (8 blocks) */}
        <div className="lg:col-span-8 space-y-5">
          <div className="flex items-center justify-between py-2 border-b border-zinc-800 pb-3">
            <h3 className="text-lg sm:text-xl lg:text-2xl font-black uppercase tracking-wider text-zinc-100 flex items-center font-sans">
              Critical Timeline Roadmap
              <span className="ml-3 px-3 py-1 rounded-md text-xs sm:text-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-black">{pendingCount} Active</span>
            </h3>

            <button
              onClick={onAddTaskClick}
              className="flex items-center space-x-1.5 px-4 py-2 bg-[#0c0c0e] border border-zinc-800 hover:bg-zinc-800 rounded-xl text-xs sm:text-sm font-bold text-emerald-400 font-sans cursor-pointer transition-all"
            >
              <Plus className="h-4 w-4 text-emerald-400" />
              <span>Record Task</span>
            </button>
          </div>

          <div className="space-y-4">
            <AnimatePresence>
              {tasks.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-10 text-center"
                >
                  <div className="max-w-md mx-auto space-y-5">
                    <div className="mx-auto w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                      <Plus className="h-8 w-8" />
                    </div>
                    <div>
                      <h4 className="text-lg sm:text-xl font-bold text-zinc-150">No active roadmap tasks</h4>
                      <p className="text-sm sm:text-base text-zinc-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
                        Your baseline is clean. Record a new task manually or chat with Preempt AI to map out your upcoming targets.
                      </p>
                    </div>
                    <button
                      onClick={onAddTaskClick}
                      className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-450 text-zinc-950 rounded-xl text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-emerald-500/15"
                    >
                      Record Your First Task
                    </button>
                  </div>
                </motion.div>
              ) : (
                tasks.map((task) => {
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
                      className={`bg-[#0c0c0e] border rounded-xl overflow-hidden transition-all ${
                        task.status === "COMPLETED" 
                          ? "border-zinc-900 opacity-60" 
                          : isExpanded 
                            ? "border-emerald-500/30 bg-[#121215]" 
                            : "border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      {/* Header Row */}
                      <div 
                        onClick={() => toggleExpand(task.id)}
                        className="p-5 cursor-pointer flex items-start justify-between space-x-4 select-none"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className={`px-3 py-1 border text-xs sm:text-sm font-bold font-mono uppercase rounded-md ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          
                          {task.status === "COMPLETED" ? (
                            <span className="px-3 py-1 bg-emerald-500/10 text-[#5ed18f] border border-emerald-500/20 text-xs sm:text-sm font-bold font-mono uppercase rounded-md">
                              COMPLETED
                            </span>
                          ) : (
                            <span className="text-sm sm:text-base text-zinc-300 font-mono font-extrabold">
                              Due: {formatDeadline(task.deadline)}
                            </span>
                          )}
                        </div>

                        <h4 className={`text-lg sm:text-xl lg:text-2xl font-black font-sans mt-3 ${task.status === "COMPLETED" ? "line-through text-zinc-550" : "text-zinc-100"}`}>
                          {task.title}
                        </h4>

                        <p className="text-sm sm:text-base text-zinc-300 font-sans max-w-xl truncate leading-relaxed">
                          {task.description}
                        </p>
                      </div>

                      {/* Right-aligned meta badge indicators */}
                      <div className="flex items-center space-x-6 self-center text-right pr-4">
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
                          className="p-1 text-zinc-500 hover:text-zinc-300 pointer-events-none"
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
                                        <span className={`text-xs sm:text-sm ${sub.completed ? "line-through text-zinc-500" : "text-zinc-200"}`}>
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
              })
            )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Synced Calendar Timetable planner (4 blocks) */}
        <div className="lg:col-span-4">
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
