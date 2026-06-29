import { useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Calendar, CheckSquare, Plus, Check } from "lucide-react";
import { Task, CalendarEvent } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface CalendarPlannerProps {
  tasks: Task[];
  events: CalendarEvent[];
  onAddTaskClick: () => void;
  onTriggerOptimizer: () => void;
}

export default function CalendarPlanner({
  tasks,
  events,
  onAddTaskClick,
  onTriggerOptimizer
}: CalendarPlannerProps) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 22)); // Initialize matching system state time: June 2026
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 5, 22));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Month navigation helpers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date(2026, 5, 22); // Use simulated system date
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Generate calendar days
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const calendarCells: { date: Date; isCurrentMonth: boolean; key: string }[] = [];

  // Padding days from previous month
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayVal = prevMonthTotalDays - i;
    const padDate = new Date(year, month - 1, dayVal);
    calendarCells.push({
      date: padDate,
      isCurrentMonth: false,
      key: `prev-${dayVal}`
    });
  }

  // Current month days
  for (let i = 1; i <= totalDays; i++) {
    const activeDate = new Date(year, month, i);
    calendarCells.push({
      date: activeDate,
      isCurrentMonth: true,
      key: `curr-${i}`
    });
  }

  // Padding days from next month
  const remainingCells = 42 - calendarCells.length;
  for (let i = 1; i <= remainingCells; i++) {
    const padDate = new Date(year, month + 1, i);
    calendarCells.push({
      date: padDate,
      isCurrentMonth: false,
      key: `next-${i}`
    });
  }

  // Get items due or active on a specific date
  const getItemsForDate = (date: Date) => {
    const dStr = date.toDateString();
    
    const dayTasks = tasks.filter(t => {
      if (!t.deadline) return false;
      return new Date(t.deadline).toDateString() === dStr;
    });

    const dayEvents = events.filter(e => {
      if (!e.start) return false;
      return new Date(e.start).toDateString() === dStr;
    });

    return { dayTasks, dayEvents };
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  // Selected date elements
  const { dayTasks: selectedTasks, dayEvents: selectedEvents } = getItemsForDate(selectedDate);
  const totalAgendasOnSelected = selectedTasks.length + selectedEvents.length;

  return (
    <div className="bg-[#0a0a0c]/60 backdrop-blur-xl border border-white/[0.04] rounded-2xl p-6 space-y-6 shadow-2xl shadow-black/40">
      {/* Calendar Planner Title & Control Header */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-3.5">
        <div className="space-y-0.5">
          <span className="text-[10px] text-emerald-450 font-mono font-black uppercase tracking-widest block">PLAN & SCHEDULE</span>
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-zinc-150 flex items-center">
            <span>Vibe Planner</span>
          </h3>
        </div>
        <div className="px-3 py-1.5 text-[10px] font-mono font-black uppercase tracking-wider bg-[#0a0a0c]/80 border border-zinc-850/80 rounded-lg text-zinc-400 select-none">
          2026 System Day
        </div>
      </div>

      {/* Calendar Grid Controller */}
      <div className="flex items-center justify-between bg-zinc-950/50 p-2.5 rounded-xl border border-zinc-900 shadow-inner">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-zinc-900 active:scale-95 rounded-lg text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer"
        >
          <ChevronLeft className="h-4.5 w-4.5" />
        </button>

        <span className="font-sans text-xs font-black uppercase tracking-widest text-zinc-200">
          {monthNames[month]} {year}
        </span>

        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-zinc-900 active:scale-95 rounded-lg text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer"
        >
          <ChevronRight className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Days of the Week headers */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {daysOfWeek.map((day) => (
          <span key={day} className="text-[10px] font-black font-mono text-zinc-600 tracking-wider">
            {day}
          </span>
        ))}
      </div>

      {/* Grid of days */}
      <div className="grid grid-cols-7 gap-1.5">
        {calendarCells.map((cell) => {
          const { dayTasks, dayEvents } = getItemsForDate(cell.date);
          const hasTask = dayTasks.length > 0;
          const hasEvent = dayEvents.length > 0;
          const isSelected = cell.date.toDateString() === selectedDate.toDateString();
          const isTodaySimulated = cell.date.toDateString() === new Date(2026, 5, 22).toDateString();
 
          // Indicators colors
          const pendingTasks = dayTasks.filter(t => t.status !== "COMPLETED");
          const completedTasks = dayTasks.filter(t => t.status === "COMPLETED");
          const highRiskTasks = pendingTasks.filter(t => t.riskLevel === "HIGH" || t.priority === "CRITICAL" || t.priority === "HIGH");

          return (
            <button
              key={cell.key}
              onClick={() => setSelectedDate(cell.date)}
              className={`aspect-square p-1 rounded-xl flex flex-col justify-between items-center relative transition-all group cursor-pointer ${
                cell.isCurrentMonth ? "text-zinc-200" : "text-zinc-600 hover:text-zinc-400 opacity-40"
              } ${
                isSelected 
                  ? "bg-emerald-500/10 border border-emerald-500/50 text-emerald-300 font-extrabold shadow-lg shadow-emerald-500/[0.03] z-10 scale-[1.03]" 
                  : "bg-zinc-950/30 border border-zinc-900/40 hover:bg-zinc-900/40 hover:border-zinc-800"
              } ${
                isTodaySimulated && !isSelected ? "ring-1 ring-emerald-500/30" : ""
              }`}
            >
              {/* Day Number */}
              <span className={`text-[11px] font-mono leading-none ${
                isSelected ? "text-emerald-300 font-bold" : "text-zinc-300 group-hover:text-white"
              }`}>
                {cell.date.getDate()}
              </span>

              {/* Dots representation */}
              <div className="flex items-center justify-center gap-0.5 mt-auto pb-0.5">
                {highRiskTasks.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50" title={`${highRiskTasks.length} High Risk Task(s)`} />
                )}
                {pendingTasks.length > highRiskTasks.length && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" title="Pending Tasks" />
                )}
                {completedTasks.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" title="Completed Tasks" />
                )}
                {hasEvent && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-sm shadow-blue-400/50" title="Calendar events" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Day Agenda Header */}
      <div className="pt-4 border-t border-zinc-900 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <h4 className="text-xs font-mono font-black uppercase text-zinc-300 tracking-widest">
              {selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" })}
            </h4>
          </div>
          <span className="text-[10px] font-mono font-bold bg-zinc-950 px-2.5 py-0.5 rounded-lg border border-zinc-850 text-zinc-400">
            {totalAgendasOnSelected} Agenda{totalAgendasOnSelected !== 1 && "s"}
          </span>
        </div>

        {/* Selected Day Items Stream */}
        <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
          {totalAgendasOnSelected === 0 ? (
            <div className="p-5 bg-zinc-950/25 border border-zinc-900 border-dashed rounded-2xl text-center shadow-inner">
              <p className="text-xs text-zinc-500 italic leading-relaxed">Clear baseline. No tasks due or scheduled events found on this date.</p>
              <button
                onClick={onAddTaskClick}
                className="mt-2.5 text-[10px] font-mono font-black text-[#5ed18f] hover:text-emerald-400 uppercase tracking-widest inline-flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="h-3 w-3" /> Plan Task Here
              </button>
            </div>
          ) : (
            <>
              {/* Due Tasks list */}
              {selectedTasks.map((task) => {
                const getPriorityBorderClass = (p: string, isCompleted: boolean) => {
                  if (isCompleted) return "border-zinc-900/60 opacity-60";
                  switch (p) {
                    case "CRITICAL": return "border-zinc-850/80 border-l-[3px] border-l-red-500/80 bg-red-950/[0.02] hover:border-red-500/20";
                    case "HIGH": return "border-zinc-850/80 border-l-[3px] border-l-orange-500/80 bg-orange-950/[0.02] hover:border-orange-500/20";
                    case "MEDIUM": return "border-zinc-850/80 border-l-[3px] border-l-yellow-500/80 bg-yellow-950/[0.02] hover:border-yellow-500/20";
                    default: return "border-zinc-850/80 border-l-[3px] border-l-blue-500/80 bg-blue-950/[0.02] hover:border-blue-500/20";
                  }
                };

                const getPriorityBadgeClass = (p: string) => {
                  switch (p) {
                    case "CRITICAL": return "bg-red-500/10 text-red-400 border-red-500/20";
                    case "HIGH": return "bg-orange-500/10 text-orange-400 border-orange-500/20";
                    case "MEDIUM": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
                    default: return "bg-blue-500/10 text-blue-400 border-blue-500/20";
                  }
                };

                return (
                  <div 
                    key={task.id}
                    className={`p-3.5 bg-zinc-950/20 border rounded-xl flex items-start justify-between space-x-3.5 transition-all ${getPriorityBorderClass(task.priority, task.status === "COMPLETED")}`}
                  >
                    <div className="space-y-1.5 select-none flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded border ${getPriorityBadgeClass(task.priority)}`}>
                          {task.priority}
                        </span>
                        {task.status === "COMPLETED" && (
                          <span className="text-[9px] font-mono font-black bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center">
                            <Check className="h-2.5 w-2.5 mr-1 stroke-[3]" /> DONE
                          </span>
                        )}
                      </div>
                      <p className={`text-xs font-bold leading-snug truncate transition-all duration-300 ${task.status === "COMPLETED" ? "line-through decoration-emerald-500/40 decoration-[1.5px] text-zinc-500 opacity-60" : "text-zinc-200"}`}>
                        {task.title}
                      </p>
                      <span className="text-[9px] font-mono text-zinc-500 block uppercase font-black tracking-wider">Task Due Timeline</span>
                    </div>
                  </div>
                );
              })}

              {/* Day Scheduled Events list */}
              {selectedEvents.map((event) => {
                const isPreemptBlock = event.title.includes("[Preempt AI]");
                return (
                  <div 
                    key={event.id}
                    className={`p-3.5 border rounded-xl flex flex-col justify-between transition-all ${
                      isPreemptBlock 
                        ? "bg-emerald-950/[0.08] border-emerald-500/15 text-emerald-400 hover:border-emerald-500/25" 
                        : "bg-zinc-950/35 border-zinc-900 text-zinc-300 hover:border-zinc-800"
                    }`}
                  >
                    <div className="flex items-start justify-between space-x-3.5">
                      <span className="text-xs font-bold truncate text-zinc-200" title={event.title}>
                        {event.title}
                      </span>
                      <span className="text-[8px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 shrink-0 tracking-wider">
                        {event.source}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                      <div className="flex items-center">
                        <Clock className="h-3.5 w-3.5 text-emerald-400 mr-1 shrink-0" />
                        <span>
                          {new Date(event.start).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        </span>
                      </div>
                      <span className="font-bold">
                        {Math.round((new Date(event.end).getTime() - new Date(event.start).getTime()) / 60000)} mins
                      </span>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
