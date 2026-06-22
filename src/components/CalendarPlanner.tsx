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
    <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-5 space-y-5">
      {/* Calendar Planner Title & Control Header */}
      <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
        <div className="space-y-0.5">
          <span className="text-[10px] text-emerald-450 font-mono font-bold uppercase tracking-wider">Plan & Schedule</span>
          <h3 className="text-sm font-extrabold uppercase tracking-widest text-zinc-100 flex items-center">
            Vibe Planner
            <Calendar className="h-4 w-4 text-emerald-400 ml-2" />
          </h3>
        </div>
        <button
          onClick={handleToday}
          className="px-2.5 py-1 text-[10px] font-mono font-bold bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-md text-zinc-300 transition-colors"
        >
          2026 System Day
        </button>
      </div>

      {/* Calendar Grid Controller */}
      <div className="flex items-center justify-between bg-zinc-950/40 p-2 rounded-xl border border-zinc-850">
        <button
          onClick={handlePrevMonth}
          className="p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="font-sans text-xs font-bold uppercase tracking-wider text-zinc-200">
          {monthNames[month]} {year}
        </span>

        <button
          onClick={handleNextMonth}
          className="p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Days of the Week headers */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {daysOfWeek.map((day) => (
          <span key={day} className="text-[9px] font-bold font-mono text-zinc-550">
            {day}
          </span>
        ))}
      </div>

      {/* Grid of days */}
      <div className="grid grid-cols-7 gap-1">
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
              className={`aspect-square p-1 rounded-lg flex flex-col justify-between items-center relative transition-all group ${
                cell.isCurrentMonth ? "text-zinc-200" : "text-zinc-600 hover:text-zinc-400"
              } ${
                isSelected 
                  ? "bg-emerald-500/10 border-2 border-emerald-500 text-emerald-300 font-bold z-10" 
                  : "bg-zinc-950/20 border border-zinc-900/40 hover:bg-zinc-900/60 hover:border-zinc-800"
              } ${
                isTodaySimulated && !isSelected ? "ring-1 ring-emerald-400/50" : ""
              }`}
            >
              {/* Day Number */}
              <span className={`text-[11px] font-mono leading-none ${
                isSelected ? "text-emerald-300 font-bold" : "text-zinc-300"
              }`}>
                {cell.date.getDate()}
              </span>

              {/* Dots representation */}
              <div className="flex items-center justify-center gap-0.5 mt-auto pb-0.5">
                {highRiskTasks.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" title={`${highRiskTasks.length} High Risk Task(s)`} />
                )}
                {pendingTasks.length > highRiskTasks.length && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Pending Tasks" />
                )}
                {completedTasks.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Completed Tasks" />
                )}
                {hasEvent && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" title="Calendar events" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Day Agenda Header */}
      <div className="pt-3 border-t border-zinc-850 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <h4 className="text-xs font-mono font-bold uppercase text-zinc-300 tracking-wider">
              {selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" })}
            </h4>
          </div>
          <span className="text-[10px] font-mono bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 text-zinc-400">
            {totalAgendasOnSelected} Agenda{totalAgendasOnSelected !== 1 && "s"}
          </span>
        </div>

        {/* Selected Day Items Stream */}
        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
          {totalAgendasOnSelected === 0 ? (
            <div className="p-4 bg-zinc-950/20 border border-zinc-900 border-dashed rounded-xl text-center">
              <p className="text-xs text-zinc-500 italic">Clear baseline. No tasks due or scheduled events found on this date.</p>
              <button
                onClick={onAddTaskClick}
                className="mt-2 text-[10px] font-mono font-bold text-emerald-400 hover:text-emerald-350 uppercase tracking-widest inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3 w-3" /> Plan Task Here
              </button>
            </div>
          ) : (
            <>
              {/* Due Tasks list */}
              {selectedTasks.map((task) => (
                <div 
                  key={task.id}
                  className={`p-3 bg-[#08080a] border rounded-xl flex items-start justify-between space-x-3 hover:border-zinc-750 transition-colors ${
                    task.status === "COMPLETED" ? "border-zinc-850 opacity-60" : "border-zinc-800"
                  }`}
                >
                  <div className="space-y-1 select-none flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[9px] font-mono font-black uppercase px-2 py-0.2 rounded border ${
                        task.priority === "CRITICAL" || task.priority === "HIGH"
                          ? "bg-red-500/10 text-red-400 border-red-500/20"
                          : "bg-zinc-800 text-zinc-400 border-zinc-700"
                      }`}>
                        {task.priority}
                      </span>
                      {task.status === "COMPLETED" && (
                        <span className="text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 rounded flex items-center">
                          <Check className="h-2.5 w-2.5 mr-0.5" /> DONE
                        </span>
                      )}
                    </div>
                    <p className={`text-xs font-bold leading-tight truncate text-zinc-150 ${task.status === "COMPLETED" ? "line-through text-zinc-550" : ""}`}>
                      {task.title}
                    </p>
                    <span className="text-[10px] font-mono text-zinc-500 block">Task Due Timeline</span>
                  </div>
                </div>
              ))}

              {/* Day Scheduled Events list */}
              {selectedEvents.map((event) => {
                const isPreemptBlock = event.title.includes("[Preempt AI]");
                return (
                  <div 
                    key={event.id}
                    className={`p-3 border rounded-xl flex flex-col justify-between ${
                      isPreemptBlock 
                        ? "bg-emerald-950/15 border-emerald-500/20 text-emerald-400" 
                        : "bg-zinc-950/40 border-zinc-850 text-zinc-300"
                    }`}
                  >
                    <div className="flex items-start justify-between space-x-2">
                      <span className="text-xs font-bold truncate text-zinc-200" title={event.title}>
                        {event.title}
                      </span>
                      <span className="text-[8px] font-mono font-black uppercase px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 shrink-0">
                        {event.source}
                      </span>
                    </div>

                    <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-zinc-450">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 text-emerald-400 mr-1 shrink-0" />
                        <span>
                          {new Date(event.start).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        </span>
                      </div>
                      <span>
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
