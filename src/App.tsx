import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import DashboardView from "./components/DashboardView";
import TaskCreateView from "./components/TaskCreateView";
import ChatView from "./components/ChatView";
import AnalyticsView from "./components/AnalyticsView";
import VoiceConsole from "./components/VoiceConsole";
import LoginView from "./components/LoginView";
import { Task, Subtask, CalendarEvent, ActivityLog } from "./types";
import { Sparkles, Calendar, Settings, ShieldAlert } from "lucide-react";

export default function App() {
  // Authentication states
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    return localStorage.getItem("preempt_user_email") || null;
  });

  // Main navigation active tabs
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // DB Core States synchronized from Express REST layer
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  // Action loaders and alerts
  const [dbLoading, setDbLoading] = useState(true);
  const [optimizerLoading, setOptimizerLoading] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [alertNotification, setAlertNotification] = useState<string | null>(null);

  // Sync DB action
  const syncDBState = async () => {
    try {
      const res = await fetch("/api/db/get");
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
        setSubtasks(data.subtasks || []);
        setEvents(data.calendar_events || []);
        setLogs(data.activity_logs || []);
      }
    } catch (e) {
      console.error("Critical: Could not synchronize with backend DB:", e);
    } finally {
      setDbLoading(false);
    }
  };

  useEffect(() => {
    if (userEmail) {
      syncDBState();
    }
  }, [userEmail]);

  // Auth triggers
  const handleLogin = (email: string) => {
    setUserEmail(email);
    localStorage.setItem("preempt_user_email", email);
  };

  const handleLogout = () => {
    setUserEmail(null);
    localStorage.removeItem("preempt_user_email");
  };

  // Toggle Subtask milestone checkboxes (Phase 2)
  const handleToggleSubtask = async (subtaskId: string, completed: boolean) => {
    try {
      const res = await fetch("/api/db/subtasks/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: subtaskId, completed })
      });
      if (res.ok) {
        syncDBState();
      }
    } catch (e) {
      console.error("Could not toggle subtask checkbox:", e);
    }
  };

  // Create task with milestones (Phase 3)
  const handleAddTask = async (taskPayload: {
    title: string;
    description: string;
    deadline: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    impactScore: number;
    effortScore: number;
    subtasks: { title: string; estimatedMinutes: number }[];
  }) => {
    try {
      // 1. Save Core Task parameters
      const reqTask = {
        title: taskPayload.title,
        description: taskPayload.description,
        deadline: taskPayload.deadline,
        priority: taskPayload.priority,
        impactScore: taskPayload.impactScore,
        effortScore: taskPayload.effortScore,
        status: "PENDING"
      };

      const resTask = await fetch("/api/db/tasks/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqTask)
      });
      const dataTask = await resTask.json();

      if (dataTask && dataTask.task) {
        const savedTaskId = dataTask.task.id;

        // 2. Add individual milestone subtasks sequentially
        for (const sub of taskPayload.subtasks) {
          await fetch("/api/db/subtasks/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              taskId: savedTaskId,
              title: sub.title,
              estimatedMinutes: sub.estimatedMinutes
            })
          });
        }

        // Trigger dynamic warning banner
        triggerNotificationStatus(`Timeline deployment successful: "${taskPayload.title}" established in roadmap.`);
        syncDBState();
        setActiveTab("dashboard");
      }
    } catch (e) {
      console.error("Task baseline deployment warning:", e);
    }
  };

  // Delete Core task roadmap
  const handleDeleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/db/tasks/${taskId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        triggerNotificationStatus("Task roadmap and subtask baseline cleared successfully.");
        syncDBState();
      }
    } catch (e) {
      console.error("Warning cleaning task roadmap:", e);
    }
  };

  // Trigger Dynamic Scheduler Organizer (Phase 4)
  const handleTriggerOptimizer = async () => {
    setOptimizerLoading(true);
    triggerNotificationStatus("Coordinating open calendars... Preempt AI scheduler is auditing free pockets.");
    try {
      const res = await fetch("/api/ai/optimize-schedule", { method: "POST" });
      if (res.ok) {
        syncDBState();
        triggerNotificationStatus("Roadmap schedule optimized successfully! Secured work slots in calendar roadmap.");
      }
    } catch (e) {
      console.error("Could not run optimizer:", e);
    } finally {
      setOptimizerLoading(false);
    }
  };

  // Commit dynamic tasks to Google Calendar Sync (Phase 5)
  const handleSyncCalendar = async () => {
    setCalendarLoading(true);
    try {
      const res = await fetch("/api/calendar/sync-all", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        syncDBState();
        triggerNotificationStatus(
          data.count > 0 
            ? `Successfully committed ${data.count} optimized task slot(s) to Google Calendar feeds!` 
            : "No pending unsynced task blocks remaining. All schedules aligned."
        );
      }
    } catch (e) {
      console.error("GCal Sync mismatch:", e);
    } finally {
      setCalendarLoading(false);
    }
  };

  // Show transient alert notifications in the footer area
  const triggerNotificationStatus = (msg: string) => {
    setAlertNotification(msg);
    setTimeout(() => {
      setAlertNotification(null);
    }, 5000);
  };

  // Router dispatcher
  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardView
            tasks={tasks}
            subtasks={subtasks}
            events={events}
            logs={logs}
            onToggleSubtask={handleToggleSubtask}
            onAddTaskClick={() => setActiveTab("create")}
            onTriggerOptimizer={handleTriggerOptimizer}
            onSyncCalendar={handleSyncCalendar}
            onDeleteTask={handleDeleteTask}
            optimizerLoading={optimizerLoading}
            calendarLoading={calendarLoading}
          />
        );
      case "create":
        return (
          <TaskCreateView
            onAddTask={handleAddTask}
            onBackToDashboard={() => setActiveTab("dashboard")}
          />
        );
      case "copilot":
        return <ChatView onTaskCreatedTrigger={syncDBState} />;
      case "analytics":
        return <AnalyticsView tasks={tasks} subtasks={subtasks} />;
      default:
        return <div className="p-8 text-gray-500 font-mono text-center">Inception View Warning</div>;
    }
  };

  // If unauthorized, direct to secure Clerk portal
  if (!userEmail) {
    return <LoginView onLoginSuccess={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-emerald-500/30">
      
      {/* Top sticky navbar navigation indicators */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userEmail={userEmail}
        onLogout={handleLogout}
      />

      {/* Main Container Dashboard */}
      {dbLoading ? (
        <div className="min-h-[calc(100vh-65px)] flex flex-col items-center justify-center space-y-4">
          <div className="h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-zinc-400 font-mono tracking-widest uppercase animate-pulse">
            Connecting Preempt AI Core...
          </span>
        </div>
      ) : (
        <main className="pb-24">
          {renderTabContent()}
        </main>
      )}

      {/* Floating vocal analyzer trigger */}
      <VoiceConsole
        onVoiceTaskCreated={syncDBState}
        onVoiceTriggerOptimizer={handleTriggerOptimizer}
      />

      {/* Transient Activity Alert Feed banner */}
      <div className="fixed bottom-6 left-6 z-50 max-w-sm">
        {alertNotification && (
          <div className="bg-[#0c0c0e] border border-emerald-500/20 text-xs text-zinc-200 py-3.5 px-4 rounded-xl shadow-2xl flex items-center space-x-3 transition-all">
            <Sparkles className="h-4.5 w-4.5 text-emerald-400 animate-pulse shrink-0" />
            <span className="font-semibold font-sans">{alertNotification}</span>
          </div>
        )}
      </div>

    </div>
  );
}
