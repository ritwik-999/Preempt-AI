import { useState, useEffect } from "react";
import { 
  Calendar, CheckSquare, AlertTriangle, ShieldCheck, 
  Sparkles, Clock, RefreshCw, Layers, CheckCircle2, ChevronDown, 
  Plus, CalendarDays, ExternalLink, HelpCircle, AlertOctagon,
  Trash2, BarChart2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Task, Subtask, CalendarEvent, ActivityLog } from "../types";

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
}

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
  calendarLoading
}: DashboardViewProps) {
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  
  // Real-time UTC status clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

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
        <div className="flex items-center gap-2">
          <div className="text-xs text-zinc-400 font-mono">
            System / <span className="text-zinc-100 font-bold uppercase tracking-wider">Main Dashboard</span>
          </div>
        </div>
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
        
        {/* Bento Box: Greeting Hero Block (approx col-span-8) */}
        <div className="lg:col-span-8 bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden min-h-[220px]">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <svg className="w-44 h-44 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          
          <span className="text-[10px] text-emerald-450 font-mono font-bold tracking-widest uppercase mb-1 flex items-center">
            <span className="h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
            Cogntive Baseline Normal
          </span>
          <h1 className="text-3xl font-light text-zinc-150 mb-2">
            Welcome back, <span className="font-bold text-white">Architect.</span>
          </h1>
          
          <p className="text-zinc-400 max-w-xl text-xs sm:text-sm leading-relaxed mb-5">
            Preempt AI has audited your roadmap. Currently monitoring{" "}
            <span className="text-emerald-400 font-mono font-bold">{pendingCount} pending baseline tasks</span>.{" "}
            {highRiskCount > 0 ? (
              <span className="text-yellow-405 font-semibold">
                Warning: {highRiskCount} tasks have drifted into risk zones. Please deploy schedule optimization.
              </span>
            ) : (
              <span className="text-emerald-400/90 italic">
                All deadlines are steady. No major slippages or drift detected on your synchronized calendars.
              </span>
            )}
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

        {/* Bento Box: 4 Mini Gauge Metrics Widgets (approx col-span-4) */}
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
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-zinc-800 pb-2.5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center font-sans">
              Critical Timeline Roadmap
              <span className="ml-2.5 px-2 py-0.5 rounded-md text-[10px] bg-emerald-505/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold">{pendingCount} Active</span>
            </h3>

            <button
              onClick={onAddTaskClick}
              className="flex items-center space-x-1 px-3 py-1.5 bg-[#0c0c0e] border border-zinc-800 hover:bg-zinc-800 rounded-xl text-xs font-semibold text-emerald-400 font-sans cursor-pointer transition-all"
            >
              <Plus className="h-3.5 w-3.5 text-emerald-400" />
              <span>Record Task</span>
            </button>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {tasks.map((task) => {
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
                      className="p-4 cursor-pointer flex items-start justify-between space-x-4 select-none"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 border text-[9px] font-bold font-mono uppercase rounded-md ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          
                          {task.status === "COMPLETED" ? (
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-[#5ed18f] border border-emerald-500/20 text-[9px] font-bold font-mono uppercase rounded-md">
                              COMPLETED
                            </span>
                          ) : (
                            <span className="text-[10px] text-zinc-550 font-mono font-medium">
                              Due: {formatDeadline(task.deadline)}
                            </span>
                          )}
                        </div>

                        <h4 className={`text-sm sm:text-md font-semibold font-sans mt-2.5 ${task.status === "COMPLETED" ? "line-through text-zinc-500" : "text-zinc-100"}`}>
                          {task.title}
                        </h4>

                        <p className="text-xs text-zinc-400 font-sans max-w-xl truncate">
                          {task.description}
                        </p>
                      </div>

                      {/* Right-aligned meta badge indicators */}
                      <div className="flex items-center space-x-3 self-center text-right">
                        <div className="text-right hidden sm:block">
                          <span className="text-[9px] block text-zinc-500 font-mono tracking-wider">RISK LEVEL</span>
                          <span className={`text-[11px] font-black font-mono leading-none ${getRiskColor(task.riskLevel)}`}>
                            {task.riskLevel}
                          </span>
                        </div>

                        <div className="text-right hidden sm:block">
                          <span className="text-[9px] block text-zinc-500 font-mono tracking-wider">SUBTASKS</span>
                          <span className="text-xs font-bold text-zinc-100 font-mono leading-none">
                            {completedSubCount}/{totalSubCount}
                          </span>
                        </div>

                        <motion.button
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="p-1 text-zinc-500 hover:text-zinc-300 pointer-events-none"
                        >
                          <ChevronDown className="h-4 w-4" />
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
                          <div className="p-4 space-y-4">
                            {/* AI Risk Reason explanation if available */}
                            {task.riskReason && (
                              <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl">
                                <span className="text-[10px] text-amber-400 font-mono block font-bold mb-1 uppercase tracking-tight">AI Diagnostic Assessment</span>
                                <p className="text-xs text-zinc-350 font-sans leading-relaxed">{task.riskReason}</p>
                              </div>
                            )}

                            {/* Scheduled block notification */}
                            <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center justify-between">
                              <div>
                                <span className="text-[10px] text-emerald-450 font-mono block font-bold uppercase">Secured Calendar Lock</span>
                                <span className="text-xs text-zinc-100 font-semibold font-mono block mt-1">
                                  {task.scheduledSlot ? formatDeadline(task.scheduledSlot.split(" - ")[0]) + " - " + formatDeadline(task.scheduledSlot.split(" - ")[1]) : "NOT SCHEDULED YET"}
                                </span>
                              </div>
                              {task.scheduledSlot ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-semibold font-mono uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                  {task.googleCalendarConnected ? "Synced to GCal" : "Awaiting Sync Commit"}
                                </span>
                              ) : (
                                <button
                                  onClick={(e) => { e.stopPropagation(); onTriggerOptimizer(); }}
                                  className="text-xs text-emerald-400 hover:text-emerald-300 font-mono font-bold uppercase tracking-wider"
                                >
                                  Book Slot
                                </button>
                              )}
                            </div>

                            {/* Subtask milestones Checklist */}
                            <div>
                              <span className="text-[10px] text-zinc-500 font-mono block font-bold mb-3 uppercase tracking-wider">Subtask Milestones</span>
                              
                              {taskSubtasks.length === 0 ? (
                                <div className="text-xs text-zinc-500 italic py-2">
                                  No milestones are currently generated. Run AI breakdown in New Task creator or chat below.
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {taskSubtasks.map((sub) => (
                                    <div 
                                      key={sub.id} 
                                      className="flex items-center justify-between p-2.5 bg-[#0c0c0e] border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors"
                                    >
                                      <div className="flex items-center space-x-3 flex-1">
                                        <input
                                          type="checkbox"
                                          checked={sub.completed}
                                          onChange={(e) => onToggleSubtask(sub.id, e.target.checked)}
                                          className="h-4 w-4 bg-[#09090b] border-zinc-805 rounded focus:ring-emerald-500 focus:text-emerald-500 transition-all text-emerald-500 cursor-pointer"
                                        />
                                        <span className={`text-xs ${sub.completed ? "line-through text-zinc-500" : "text-zinc-200"}`}>
                                          {sub.title}
                                        </span>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase">{sub.estimatedMinutes} Mins</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Delete Task */}
                            <div className="pt-3 border-t border-zinc-800 flex justify-end">
                              <button
                                onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-red-950/40 hover:bg-red-950/10 text-xs text-red-400 font-mono transition-colors font-bold uppercase"
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
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Synced Calendar Timetable planner (4 blocks) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-zinc-800 pb-2.5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center font-sans">
              Merged Agenda
              <CalendarDays className="h-4 w-4 text-emerald-400 ml-2" />
            </h3>
            
            <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
              GCal Active
            </span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {events.length === 0 ? (
              <div className="bg-[#0c0c0e] border border-zinc-800 p-6 rounded-xl text-center text-xs text-zinc-500 italic">
                No scheduled calendar blocks detected. Use the Optimizer above to secure candidate blocks.
              </div>
            ) : (
              events
                .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                .map((event) => {
                  const isPreemptBlock = event.title.includes("[Preempt AI]");
                  return (
                    <div 
                      key={event.id}
                      className={`p-3.5 border rounded-xl flex flex-col justify-between ${
                        isPreemptBlock 
                          ? "bg-gradient-to-r from-emerald-950/30 via-zinc-900/10 to-[#0c0c0e] border-emerald-500/25" 
                          : "bg-[#0c0c0e] border-zinc-800"
                      }`}
                    >
                      <div className="flex items-start justify-between space-x-2">
                        <span className="text-xs font-semibold text-zinc-100 truncate max-w-[200px]" title={event.title}>
                          {event.title}
                        </span>
                        
                        <span className={`text-[8px] font-black font-mono uppercase px-1.5 py-0.2 rounded shrink-0 ${
                          isPreemptBlock 
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" 
                            : "bg-zinc-800/20 text-zinc-400 border border-zinc-700/20"
                        }`}>
                          {event.source}
                        </span>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-[10px] text-zinc-450 font-mono">
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 text-emerald-400 mr-1" />
                          <span>
                            {new Date(event.start).toLocaleDateString("en-US", { month: "short", day: "numeric" })}{" "}
                            {new Date(event.start).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                          </span>
                        </div>
                        <span className="text-zinc-550 font-normal">
                          {Math.round((new Date(event.end).getTime() - new Date(event.start).getTime()) / 60000)} mins
                        </span>
                      </div>
                    </div>
                  );
                })
            )}
          </div>

          {/* Activity Logs Console Tracker */}
          <div className="p-4 bg-[#0c0c0e] border border-zinc-800 rounded-2xl">
            <span className="text-[10px] text-zinc-500 font-bold block mb-3 uppercase tracking-wider font-mono flex items-center">
              <BarChart2 className="h-3.5 w-3.5 text-emerald-400 mr-1.5" />
              Live System Logs
            </span>
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {logs.slice(0, 5).map((log) => (
                <div key={log.id} className="text-[10px] leading-relaxed border-l-2 border-zinc-800 pl-2.5 py-0.5 font-mono">
                  <div className="flex items-center justify-between text-zinc-500">
                    <span className="text-[9px] uppercase tracking-tight font-extrabold text-emerald-500/80">{log.action}</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                  </div>
                  <p className="text-zinc-300 font-sans mt-0.5">{log.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
