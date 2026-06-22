/**
 * Shared Type Definitions for Preempt AI
 */

export interface User {
  id: string;
  email: string;
  name: string;
  clerkId: string;
  createdAt: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  deadline: string; // ISO string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  impactScore: number; // 1-10
  effortScore: number; // 1-10
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  riskReason?: string;
  scheduledSlot?: string; // e.g., "2026-06-22T10:00:00.000Z - 2026-06-22T11:30:00.000Z"
  googleCalendarConnected?: boolean;
  createdAt: string;
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  order: number;
  estimatedMinutes: number;
}

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  start: string; // ISO string
  end: string; // ISO string
  description?: string;
  synced: boolean;
  source: 'GOOGLE_CALENDAR' | 'PREEMPT_AI';
  taskId?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  timestamp: string; // ISO string
  action: string;
  details: string;
  category: 'INFO' | 'WARNING' | 'SUCCESS' | 'AGENT';
}

export interface DashboardStats {
  completionRate: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  riskTasksCount: number;
  avgEffortScore: number;
  googleCalendarConnected: boolean;
  recentActivity: ActivityLog[];
}
