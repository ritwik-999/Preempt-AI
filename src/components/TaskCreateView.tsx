import React, { useState, FormEvent } from "react";
import { 
  Calendar, Layers, Sparkles, PlusCircle, Check, Play, AlertCircle, HelpCircle,
  Clock, Flame, HelpCircle as InfoCircle, Award
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SubtaskProposal {
  title: string;
  estimatedMinutes: number;
  selected: boolean;
}

interface TaskCreateViewProps {
  onAddTask: (task: {
    title: string;
    description: string;
    deadline: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    impactScore: number;
    effortScore: number;
    subtasks: { title: string; estimatedMinutes: number }[];
  }) => void;
  onBackToDashboard: () => void;
}

export default function TaskCreateView({ onAddTask, onBackToDashboard }: TaskCreateViewProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState(() => {
    // Default to tomorrow at 5:00 PM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(17, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  });
  
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>("MEDIUM");
  const [impactScore, setImpactScore] = useState(5);
  const [effortScore, setEffortScore] = useState(5);

  // AI-Assisted states
  const [predictingPriority, setPredictingPriority] = useState(false);
  const [breakingDownTask, setBreakingDownTask] = useState(false);
  const [predictedExplanation, setPredictedExplanation] = useState("");
  
  const [proposals, setProposals] = useState<SubtaskProposal[]>([]);

  // Function targeting AI Priority scoring agent
  const runAIPriorityScouters = async () => {
    if (!title) return alert("Please specify a task title before running priority scoring, Senior Lead!");
    setPredictingPriority(true);
    setPredictedExplanation("");
    try {
      const userEmail = localStorage.getItem("preempt_user_email") || "user_default";
      const res = await fetch("/api/ai/prioritize", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-email": userEmail
        },
        body: JSON.stringify({ title, description })
      });
      const data = await res.json();
      if (data && !data.error) {
        setPriority(data.priority);
        setImpactScore(data.impactScore);
        setEffortScore(data.effortScore);
        setPredictedExplanation(data.reason);
      }
    } catch (e) {
      console.error("Error predicting ratings:", e);
    } finally {
      setPredictingPriority(false);
    }
  };

  // Function targeting AI subtask breakdown agent
  const runAITaskBreakdown = async () => {
    if (!title) return alert("Please specify a task title before generating a milestone breakdown, Architect!");
    setBreakingDownTask(true);
    try {
      const userEmail = localStorage.getItem("preempt_user_email") || "user_default";
      const res = await fetch("/api/ai/breakdown", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-email": userEmail
        },
        body: JSON.stringify({ title, description })
      });
      const data = await res.json();
      if (data && data.subtasks) {
        setProposals(data.subtasks.map((st: any) => ({
          title: st.title,
          estimatedMinutes: st.estimatedMinutes,
          selected: true
        })));
      }
    } catch (e) {
      console.error("Error breaking down task:", e);
    } finally {
      setBreakingDownTask(false);
    }
  };

  const handleToggleProposal = (index: number) => {
    const updated = [...proposals];
    updated[index].selected = !updated[index].selected;
    setProposals(updated);
  };

  const handleCommitTask = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Collate selected subtasks
    const finalSubtasks = proposals
      .filter(p => p.selected)
      .map(p => ({ title: p.title, estimatedMinutes: p.estimatedMinutes }));

    onAddTask({
      title,
      description,
      deadline: new Date(deadline).toISOString(),
      priority,
      impactScore,
      effortScore,
      subtasks: finalSubtasks
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
            Create Companion Baseline Task
          </h2>
          <p className="text-xs text-zinc-500 font-mono mt-1">
            Establish roadmaps and let Gemini agents analyze workloads before commitment.
          </p>
        </div>
        
        <button
          onClick={onBackToDashboard}
          className="text-xs text-zinc-400 hover:text-white font-mono uppercase tracking-wider px-3 py-1.5 border border-zinc-800 rounded-lg hover:bg-zinc-850 transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Core Task Info Form (7 sections) */}
        <form onSubmit={handleCommitTask} className="lg:col-span-7 space-y-5 bg-[#0c0c0e] border border-zinc-800 p-6 rounded-2xl">
          <div className="space-y-1.5">
            <label className="block text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
              Task Title / Goal
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500/45 focus:border-emerald-500 transition-all text-zinc-100"
              placeholder="e.g., Chemistry Lab Report Draft"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
              Target Deadline
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/44 focus:border-emerald-500 transition-all text-zinc-100"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
              Context & Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500/45 focus:border-emerald-500 transition-all resize-none text-zinc-100"
              placeholder="Detail thermodynamics parameters or background expectations..."
            />
          </div>

          {/* Impact & Effort Scoring sliders (Phase 4: Scoring Agency) */}
          <div className="p-4 bg-[#09090b] border border-zinc-800 rounded-xl space-y-4">
            <div className="flex justify-between items-center pb-2.5 border-b border-zinc-800">
              <span className="text-xs font-sans font-bold text-zinc-100 flex items-center">
                <Flame className="h-4 w-4 text-emerald-400 mr-2 animate-pulse" />
                Impact vs Effort Metrics
              </span>
              
              <button
                type="button"
                onClick={runAIPriorityScouters}
                disabled={predictingPriority}
                className="px-3 py-1 bg-emerald-550 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 rounded-lg text-[9px] font-bold font-mono tracking-widest uppercase cursor-pointer transition-all"
              >
                {predictingPriority ? "ANALYZING..." : "COGNITIVE SCORING"}
              </button>
            </div>

            {/* Explanation card */}
            {predictedExplanation && (
              <div className="text-xs text-[#ebd58d] bg-yellow-550/5 p-2.5 border border-yellow-500/10 rounded-lg font-sans">
                {predictedExplanation}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-zinc-500 font-bold">IMPACT:</span>
                  <span className="text-white font-bold">{impactScore}/10</span>
                </div>
                <input
                  type="range" min="1" max="10"
                  value={impactScore}
                  onChange={(e) => setImpactScore(Number(e.target.value))}
                  className="w-full accent-emerald-505"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-zinc-500 font-bold font-bold">EFFORT:</span>
                  <span className="text-white font-bold">{effortScore}/10</span>
                </div>
                <input
                  type="range" min="1" max="10"
                  value={effortScore}
                  onChange={(e) => setEffortScore(Number(e.target.value))}
                  className="w-full accent-teal-505"
                />
              </div>
            </div>

            {/* Manual Priority Selector */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-zinc-505 font-mono font-bold block uppercase">Priority level:</span>
              <div className="grid grid-cols-4 gap-2">
                {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((p) => (
                  <button
                    key={p} type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2 text-[10px] font-mono font-bold border rounded-lg transition-all cursor-pointer ${
                      priority === p 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500" 
                        : "bg-[#09090b] text-zinc-500 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-12 flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-450 text-zinc-950 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer font-sans shadow-lg shadow-emerald-500/10"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Secure Baseline & Deploy Task</span>
          </button>
        </form>

        {/* Right Column: AI Task Breakdown agent (5 sections) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#0c0c0e] border border-zinc-800 p-5 rounded-2xl space-y-4 relative">
            
            <div className="flex justify-between items-center border-b border-zinc-880 pb-3">
              <div>
                <span className="text-xs font-sans font-bold text-white block">AI Task Breakdown Agent</span>
                <span className="text-[9px] text-zinc-500 font-mono tracking-tight block">Phase 4 Automation</span>
              </div>
              <button
                type="button"
                onClick={runAITaskBreakdown}
                disabled={breakingDownTask}
                className="px-2.5 py-1 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-mono tracking-widest uppercase cursor-pointer transition-all"
              >
                {breakingDownTask ? "COLLATING..." : "DEPLOY BREAKDOWN"}
              </button>
            </div>

            {proposals.length > 0 ? (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                <span className="text-[10px] text-zinc-500 font-mono block uppercase">Candidate Milestones:</span>
                
                {proposals.map((prop, i) => (
                  <div 
                    key={i}
                    onClick={() => handleToggleProposal(i)}
                    className={`p-2.5 border rounded-xl flex items-center justify-between space-x-3 cursor-pointer select-none transition-all ${
                      prop.selected 
                        ? "bg-emerald-500/5 border-emerald-500/30 text-white" 
                        : "bg-[#09090b] border-zinc-800 text-zinc-500"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className={`h-4 w-4 border rounded flex items-center justify-center shrink-0 ${prop.selected ? "border-emerald-500 bg-emerald-500" : "border-zinc-700"}`}>
                        {prop.selected && <Check className="h-3 w-3 text-zinc-950" />}
                      </div>
                      <span className="text-xs">{prop.title}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold shrink-0">{prop.estimatedMinutes} Mins</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 border border-dashed border-zinc-800 rounded-xl text-center text-xs text-zinc-500 italic">
                Enter a task title above and click "DEPLOY BREAKDOWN" to have Gemini draft actionable subtasks with time estimates automatically.
              </div>
            )}

            <div className="pt-2 flex items-start space-x-2 text-[10px] text-zinc-500 font-mono leading-relaxed">
              <Award className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>Checking these milestones ensures they are saved straight on task creation, avoiding manual logging overhead.</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
