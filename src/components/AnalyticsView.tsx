import { 
  BarChart, Layers, Target, ShieldCheck, TrendingUp, AlertTriangle,
  Flame, Award, Loader2
} from "lucide-react";
import { Task, Subtask } from "../types";

interface AnalyticsViewProps {
  tasks: Task[];
  subtasks: Subtask[];
}

export default function AnalyticsView({ tasks, subtasks }: AnalyticsViewProps) {
  // Analytical processing
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "COMPLETED");
  const completedCount = completedTasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Breakdown counts by priority
  const criticalCount = tasks.filter(t => t.priority === "CRITICAL").length;
  const highCount = tasks.filter(t => t.priority === "HIGH").length;
  const mediumCount = tasks.filter(t => t.priority === "MEDIUM").length;
  const lowCount = tasks.filter(t => t.priority === "LOW").length;

  // Risk breakdown
  const riskHigh = tasks.filter(t => t.riskLevel === "HIGH").length;
  const riskMed = tasks.filter(t => t.riskLevel === "MEDIUM").length;
  const riskLow = tasks.filter(t => t.riskLevel === "LOW").length;

  // Compute stats on subtask completion index
  const totalSubtasks = subtasks.length;
  const completedSubtasks = subtasks.filter(s => s.completed).length;
  const subtaskCompletionRate = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  // Formulate custom bar percentages
  const getMaxVal = (...vals: number[]) => Math.max(1, ...vals);
  const maxPriority = getMaxVal(criticalCount, highCount, mediumCount, lowCount);
  const maxRisk = getMaxVal(riskHigh, riskMed, riskLow);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Page Header */}
      <div className="border-b border-zinc-800 pb-5">
        <h2 className="text-2xl font-bold tracking-tight text-white font-sans flex items-center">
          Productivity & Risk Analytics
          <TrendingUp className="h-5.5 w-5.5 text-emerald-400 ml-2 animate-bounce" />
        </h2>
        <p className="text-xs text-zinc-500 font-mono mt-1">
          Deep diagnostic audit reports of your roadmap deadlines, milestones, and priority spreads.
        </p>
      </div>

      {/* Bento Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Box 1: Core Performance Ratios */}
        <div className="bg-[#0c0c0e] border border-zinc-800 p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-zinc-500 font-mono font-bold block uppercase tracking-wider mb-2">Completion Efficiency</span>
            <h3 className="text-3xl font-black text-white font-sans">{completionRate}%</h3>
            <p className="text-xs text-zinc-400 mt-2 font-sans">
              You completed {completedCount} out of {totalTasks} overall roadmap targets.
            </p>
          </div>

          <div className="mt-6 pt-5 border-t border-zinc-800 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-400">Main Checklist completion</span>
              <span className="text-xs font-mono text-white font-bold">{completedCount}/{totalTasks}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-400">Milestone Checkbox completion</span>
              <span className="text-xs font-mono text-white font-bold">{completedSubtasks}/{totalSubtasks}</span>
            </div>
            
            {/* Completion Rate subtask bars */}
            <div className="w-full bg-[#09090b] h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full transition-all duration-700" 
                style={{ width: `${subtaskCompletionRate}%` }}
              />
            </div>
            <span className="text-[10px] block text-right text-zinc-500 font-mono">Milestone progress: {subtaskCompletionRate}%</span>
          </div>
        </div>

        {/* Box 2: Priority Spread Bars (Custom beautiful SVG-like styled bar widgets) */}
        <div className="bg-[#0c0c0e] border border-zinc-800 p-6 rounded-2xl space-y-4">
          <div>
            <span className="text-[10px] text-zinc-500 font-mono font-bold block uppercase tracking-wider">Priority Classification</span>
            <span className="text-xs text-zinc-455 block mt-1">Distribution of tasks categorized by impact-to-urgency.</span>
          </div>

          <div className="space-y-3.5 pt-2">
            {/* Critical */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-red-400 font-bold">CRITICAL:</span>
                <span className="text-white font-bold">{criticalCount}</span>
              </div>
              <div className="w-full bg-[#09090b] h-2.5 rounded-lg overflow-hidden border border-zinc-800">
                <div className="bg-red-500 h-full" style={{ width: `${(criticalCount / maxPriority) * 100}%` }} />
              </div>
            </div>

            {/* High */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-orange-400 font-bold font-bold">HIGH:</span>
                <span className="text-white font-bold">{highCount}</span>
              </div>
              <div className="w-full bg-[#09090b] h-2.5 rounded-lg overflow-hidden border border-zinc-800">
                <div className="bg-orange-500 h-full" style={{ width: `${(highCount / maxPriority) * 100}%` }} />
              </div>
            </div>

            {/* Medium */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-emerald-450 font-bold">MEDIUM:</span>
                <span className="text-white font-bold">{mediumCount}</span>
              </div>
              <div className="w-full bg-[#09090b] h-2.5 rounded-lg overflow-hidden border border-zinc-800">
                <div className="bg-emerald-500 h-full" style={{ width: `${(mediumCount / maxPriority) * 100}%` }} />
              </div>
            </div>

            {/* Low */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-indigo-400 font-bold">LOW:</span>
                <span className="text-white font-bold">{lowCount}</span>
              </div>
              <div className="w-full bg-[#09090b] h-2.5 rounded-lg overflow-hidden border border-zinc-800">
                <div className="bg-indigo-400 h-full" style={{ width: `${(lowCount / maxPriority) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Box 3: Threat Index Allocation Grid */}
        <div className="bg-[#0c0c0e] border border-zinc-805 p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-zinc-500 font-mono font-bold block uppercase tracking-wider mb-2">Slippage Vulnerability Index</span>
            <div className="flex items-baseline space-x-1">
              <span className={`text-2xl font-black font-sans ${riskHigh > 0 ? "text-amber-400" : "text-[#5ed18f]"}`}>
                {riskHigh > 0 ? `MODERATE WARNING (${riskHigh})` : "SECURE BASELINE"}
              </span>
            </div>
            
            <p className="text-xs text-zinc-400 mt-2.5 font-sans leading-relaxed">
              Based on deadline timings, total milestones remaining, and Google Calendar commitments, Preempt AI is predicting potential schedule compression issues.
            </p>
          </div>

          <div className="space-y-3 pt-5 border-t border-zinc-800">
            <span className="text-[10px] text-zinc-500 font-mono block uppercase">Allocated Risk Slots:</span>
            <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono font-bold">
              <div className="bg-red-500/10 border border-red-500/20 py-2.5 rounded-lg text-red-400">
                <span>HIGH:</span>
                <span className="block text-md mt-1 text-white">{riskHigh}</span>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/20 py-2.5 rounded-lg text-yellow-550">
                <span>MED:</span>
                <span className="block text-md mt-1 text-white">{riskMed}</span>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 py-2.5 rounded-lg text-emerald-400">
                <span>LOW:</span>
                <span className="block text-md mt-1 text-white">{riskLow}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Effort vs Impact Matrix Scatter-Bento Layout */}
      <div className="bg-[#0c0c0e] border border-zinc-800 p-6 rounded-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight flex items-center">
              Categorization Quadrant Explorer
              <Flame className="h-4 w-4 text-emerald-400 ml-1.5 animate-pulse" />
            </h4>
            <span className="text-[10px] text-zinc-500 font-mono block">Dynamic priority placement matrix</span>
          </div>

          <span className="text-xs font-mono text-zinc-400">Y-Axis: Impact Value | X-Axis: Effort Magnitude</span>
        </div>

        {/* Matrix Scatter Quadrants representation inside simple gorgeous grid */}
        <div className="grid grid-cols-2 gap-3.5 relative min-h-[220px]">
          
          {/* Top-Left: Quick Wins (High Impact, Low Effort) */}
          <div className="bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 rounded-xl p-4 flex flex-col justify-between transition-colors">
            <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider">🌟 Quick Wins (High Impact, Low Effort)</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {tasks.filter(t => t.impactScore >= 6 && t.effortScore <= 5 && t.status !== "COMPLETED").map(t => (
                <span key={t.id} className="text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 py-1 px-2.5 rounded-lg truncate max-w-[150px]" title={t.title}>
                  {t.title}
                </span>
              ))}
              {tasks.filter(t => t.impactScore >= 6 && t.effortScore <= 5 && t.status !== "COMPLETED").length === 0 && (
                <span className="text-xs text-zinc-600 italic font-mono">None currently active.</span>
              )}
            </div>
          </div>

          {/* Top-Right: Strategic Projects (High Impact, High Effort) */}
          <div className="bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/15 rounded-xl p-4 flex flex-col justify-between transition-colors">
            <span className="text-[10px] text-indigo-400 font-mono font-bold uppercase tracking-wider">🛡️ Strategic Projects (High Impact, High Effort)</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {tasks.filter(t => t.impactScore >= 6 && t.effortScore >= 6 && t.status !== "COMPLETED").map(t => (
                <span key={t.id} className="text-[11px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 py-1 px-2.5 rounded-lg truncate max-w-[150px]" title={t.title}>
                  {t.title}
                </span>
              ))}
              {tasks.filter(t => t.impactScore >= 6 && t.effortScore >= 6 && t.status !== "COMPLETED").length === 0 && (
                <span className="text-xs text-zinc-600 italic font-mono">None currently active.</span>
              )}
            </div>
          </div>

          {/* Bottom-Left: Fillers / Tasks (Low Impact, Low Effort) */}
          <div className="bg-zinc-850 bg-opacity-20 hover:bg-opacity-30 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between transition-colors">
            <span className="text-[10px] text-zinc-400 font-mono font-bold uppercase tracking-wider">⏳ Fillers / Tasks (Low Impact, Low Effort)</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {tasks.filter(t => t.impactScore <= 5 && t.effortScore <= 5 && t.status !== "COMPLETED").map(t => (
                <span key={t.id} className="text-[11px] bg-[#0c0c0e] text-zinc-300 border border-zinc-800 py-1 px-2.5 rounded-lg truncate max-w-[150px]" title={t.title}>
                  {t.title}
                </span>
              ))}
              {tasks.filter(t => t.impactScore <= 5 && t.effortScore <= 5 && t.status !== "COMPLETED").length === 0 && (
                <span className="text-xs text-zinc-600 italic font-mono">None currently active.</span>
              )}
            </div>
          </div>

          {/* Bottom-Right: Major Risks/Hard Slogs (Low Impact, High Effort) */}
          <div className="bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded-xl p-4 flex flex-col justify-between transition-colors">
            <span className="text-[10px] text-red-500 font-mono font-bold uppercase tracking-wider">⚠️ Major Slogs / Danger Zone (Low Impact, High Effort)</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {tasks.filter(t => t.impactScore <= 5 && t.effortScore >= 6 && t.status !== "COMPLETED").map(t => (
                <span key={t.id} className="text-[11px] bg-red-650/10 text-red-400 border border-red-500/20 py-1 px-2.5 rounded-lg truncate max-w-[150px]" title={t.title}>
                  {t.title}
                </span>
              ))}
              {tasks.filter(t => t.impactScore <= 5 && t.effortScore >= 6 && t.status !== "COMPLETED").length === 0 && (
                <span className="text-xs text-zinc-650 italic font-mono">None currently active.</span>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
