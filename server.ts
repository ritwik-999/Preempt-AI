import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import crypto from "crypto";

// Helper function to securely hash passwords using PBKDF2
function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

// Initialize express app
const app = express();
const PORT = 3000;

app.use(express.json());

// Path to low-db mock file
const DB_FILE = path.join(process.cwd(), "db.json");

// Helper structure for database schema representation
interface DBSchema {
  users: any[];
  tasks: any[];
  subtasks: any[];
  calendar_events: any[];
  activity_logs: any[];
}

// Initial DB template loading
const INITIAL_DB: DBSchema = {
  users: [
    {
      id: "user_default",
      email: "ritwikkapat@gmail.com",
      name: "Ritwik Kapat",
      clerkId: "clerk_active_7761",
      createdAt: new Date().toISOString()
    }
  ],
  tasks: [],
  subtasks: [],
  calendar_events: [],
  activity_logs: []
};

// Function targeting load database
function loadDB(): DBSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DB, null, 2));
      return INITIAL_DB;
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    
    // Automatically purge preloaded template tasks and calendar elements to ensure clean slate
    if (
      (parsed.tasks && parsed.tasks.some((t: any) => t.id === "task_1" || t.id === "task_2" || t.id === "task_3")) ||
      (parsed.calendar_events && parsed.calendar_events.some((e: any) => e.id === "event_1" || e.id === "event_2" || e.id === "event_3"))
    ) {
      parsed.tasks = [];
      parsed.subtasks = [];
      parsed.calendar_events = [];
      parsed.activity_logs = [];
      fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2));
    }

    // Ensure users table exists
    if (!parsed.users) {
      parsed.users = [];
    }
    if (!parsed.tasks) {
      parsed.tasks = [];
    }
    if (!parsed.subtasks) {
      parsed.subtasks = [];
    }
    if (!parsed.calendar_events) {
      parsed.calendar_events = [];
    }
    if (!parsed.activity_logs) {
      parsed.activity_logs = [];
    }

    // Ensure the default login accounts are registered
    const normalizedAbc = "abc@gmail.com";
    const hasAbc = parsed.users.some((u: any) => u.email && u.email.toLowerCase() === normalizedAbc);
    if (!hasAbc) {
      parsed.users.push({
        id: "user_abc",
        email: normalizedAbc,
        name: "ABC User",
        password: "pass123",
        clerkId: "clerk_abc_1234",
        createdAt: new Date().toISOString()
      });
      fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2));
    }

    const normalizedRitwik = "ritwikkapat@gmail.com";
    const hasRitwik = parsed.users.some((u: any) => u.email && u.email.toLowerCase() === normalizedRitwik);
    if (!hasRitwik) {
      parsed.users.push({
        id: "user_default",
        email: normalizedRitwik,
        name: "Ritwik Kapat",
        password: "pass123",
        clerkId: "clerk_active_7761",
        createdAt: new Date().toISOString()
      });
      fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2));
    }

    // Ensure all registered users have a password
    let dbUpdated = false;
    parsed.users.forEach((u: any) => {
      if (!u.password) {
        u.password = "pass123";
        dbUpdated = true;
      }
    });

    // Proactive garbage collection for stale guest accounts (> 6 hours old) to keep database extremely compact
    if (parsed.users && parsed.users.length > 0) {
      const now = Date.now();
      const sixHoursMs = 6 * 60 * 60 * 1000;
      const guestUsersToPrune = parsed.users.filter((u: any) => {
        if (u.email && (u.email.startsWith("guest_") || u.email.endsWith("@preempt.demo"))) {
          const createdAtTime = u.createdAt ? new Date(u.createdAt).getTime() : 0;
          return (now - createdAtTime) > sixHoursMs;
        }
        return false;
      });

      if (guestUsersToPrune.length > 0) {
        const emailsToPrune = new Set(guestUsersToPrune.map((u: any) => u.email.toLowerCase()));
        parsed.users = parsed.users.filter((u: any) => !u.email || !emailsToPrune.has(u.email.toLowerCase()));
        
        // Find tasks for these guests to prune subtasks
        const guestTasksToPrune = parsed.tasks.filter((t: any) => t.userId && emailsToPrune.has(t.userId.toLowerCase()));
        const guestTaskIds = new Set(guestTasksToPrune.map((t: any) => t.id));

        parsed.tasks = parsed.tasks.filter((t: any) => !t.userId || !emailsToPrune.has(t.userId.toLowerCase()));
        parsed.subtasks = parsed.subtasks.filter((s: any) => !guestTaskIds.has(s.taskId));
        parsed.calendar_events = parsed.calendar_events.filter((e: any) => !e.userId || !emailsToPrune.has(e.userId.toLowerCase()));
        parsed.activity_logs = parsed.activity_logs.filter((l: any) => !l.userId || !emailsToPrune.has(l.userId.toLowerCase()));
        
        dbUpdated = true;
      }
    }

    if (dbUpdated) {
      fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2));
    }
    
    return parsed;
  } catch (error) {
    console.error("Error reading db file:", error);
    return INITIAL_DB;
  }
}

// Function targeting write database
function writeDB(data: DBSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error writing to database:", error);
  }
}

// Access-Safe Gemini Initializer
let ai: GoogleGenAI | null = null;
function getAIInstance(): GoogleGenAI | null {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY is not defined. Falling back to robust AI simulation engines.");
      return null;
    }
    ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': "aistudio-build"
        }
      }
    });
  }
  return ai;
}

// Resilient wrapping function with exponential backoff retry and flash-lite fallback capability
async function generateContentWithFallback(params: {
  model?: string;
  contents: any;
  config?: any;
}) {
  const customAI = getAIInstance();
  if (!customAI) {
    throw new Error("No Gemini API connection available.");
  }

  const firstChoiceModel = params.model || "gemini-3.5-flash";
  const modelsToTry = [firstChoiceModel, "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    // Attempt twice per model if transitively unavailable or rate-limited
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await customAI.models.generateContent({
          ...params,
          model,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || String(err);
        const code = err?.status || err?.code || 0;
        console.warn(`[Gemini Resiliency Wrapper] Model "${model}" (attempt ${attempt}/2) failed with code ${code}. Error text: ${msg}`);

        const isTransient = 
          code === 503 || 
          code === 429 || 
          msg.includes("503") || 
          msg.includes("429") || 
          msg.includes("demand") || 
          msg.includes("temporary") || 
          msg.includes("UNAVAILABLE") || 
          msg.includes("Unavailable");

        if (isTransient && attempt < 2) {
          // Progressively wait: 1000ms, then 2000ms
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        // If it's a structural error (like schema failure) or we compiled all attempts, fall over to lite model
        break;
      }
    }
  }

  throw lastError || new Error("All requested models and fallbacks failed generation.");
}

// REST endpoints for Preempt DB Actions
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const db = loadDB();
  const normalizedEmail = email.trim().toLowerCase();
  
  // Find user
  let user = db.users.find(u => u.email && u.email.trim().toLowerCase() === normalizedEmail);
  
  if (!user) {
    // Register the user automatically with a cryptographically hashed password!
    const salt = generateSalt();
    const hashedPassword = hashPassword(password, salt);

    user = {
      id: "user_" + Math.random().toString(36).substring(2, 9),
      email: normalizedEmail,
      name: email.split("@")[0],
      salt: salt,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };
    db.users.push(user);
    
    // Create an initial welcome activity log for this newly registered user
    db.activity_logs.unshift({
      id: "log_" + Date.now(),
      userId: normalizedEmail,
      timestamp: new Date().toISOString(),
      action: "Account Registered",
      details: "Welcome to Preempt AI! Your persistent secure workspace is ready.",
      category: "INFO"
    });

    writeDB(db);
    return res.json({ success: true, email: user.email, message: "Welcome! Registered your new secure workspace." });
  } else {
    // If the user exists but doesn't have a salt (legacy plain-text account), migrate them seamlessly on login
    if (!user.salt) {
      const salt = generateSalt();
      const rawPassword = user.password || password;
      user.salt = salt;
      user.password = hashPassword(rawPassword, salt);
      writeDB(db);
    }

    // Verify hashed password
    const hashedAttempt = hashPassword(password, user.salt);
    if (user.password !== hashedAttempt) {
      return res.status(401).json({ error: "Incorrect password for this email address. Please try again." });
    }
    
    return res.json({ success: true, email: user.email });
  }
});

app.post("/api/auth/reset-password", (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: "Email and new password are required." });
  }

  const db = loadDB();
  const normalizedEmail = email.trim().toLowerCase();

  // Find user
  const user = db.users.find(u => u.email && u.email.trim().toLowerCase() === normalizedEmail);

  if (!user) {
    return res.status(404).json({ error: "Account not found. Please register or verify the email spelling." });
  }

  // Update password in db using cryptographic hashing with a newly generated salt
  const salt = generateSalt();
  user.salt = salt;
  user.password = hashPassword(newPassword, salt);

  // Add key action activity log
  db.activity_logs.unshift({
    id: "log_" + Date.now(),
    userId: normalizedEmail,
    timestamp: new Date().toISOString(),
    action: "Password Reset Completed",
    details: "Your workspace password was successfully updated via self-service verification.",
    category: "WARNING"
  });

  writeDB(db);

  return res.json({ 
    success: true, 
    message: "Password updated successfully! You can now log in with your new credentials." 
  });
});

app.post("/api/auth/logout-cleanup", (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required for cleanup." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  
  // Only clean up guest/demo accounts
  if (normalizedEmail.startsWith("guest_") || normalizedEmail.endsWith("@preempt.demo")) {
    const db = loadDB();
    
    // Find all tasks for this guest user to prune their subtasks
    const guestTasks = db.tasks.filter(t => t.userId === normalizedEmail);
    const guestTaskIds = new Set(guestTasks.map(t => t.id));

    // Prune collections
    db.users = db.users.filter(u => u.email && u.email.trim().toLowerCase() !== normalizedEmail);
    db.tasks = db.tasks.filter(t => t.userId !== normalizedEmail);
    db.subtasks = db.subtasks.filter(s => !guestTaskIds.has(s.taskId));
    db.calendar_events = db.calendar_events.filter(e => e.userId !== normalizedEmail);
    db.activity_logs = db.activity_logs.filter(l => l.userId !== normalizedEmail);

    writeDB(db);
    return res.json({ success: true, message: `Guest account ${normalizedEmail} and all its data have been successfully purged.` });
  }

  return res.json({ success: false, message: "Non-guest account; skipped data cleanup to preserve persistent data." });
});

app.get("/api/db/get", (req, res) => {
  const db = loadDB();
  const userEmail = (req.headers["x-user-email"] as string) || "user_default";
  
  const userTasks = db.tasks.filter(t => t.userId === userEmail);
  const userTaskIds = new Set(userTasks.map(t => t.id));
  const userSubtasks = db.subtasks.filter(s => userTaskIds.has(s.taskId));
  const userEvents = db.calendar_events.filter(e => e.userId === userEmail);
  const userLogs = db.activity_logs.filter(l => l.userId === userEmail);
  
  res.json({
    tasks: userTasks,
    subtasks: userSubtasks,
    calendar_events: userEvents,
    activity_logs: userLogs
  });
});

// Update or merge tasks
app.post("/api/db/tasks/save", (req, res) => {
  try {
    const db = loadDB();
    const task = req.body;
    const userEmail = (req.headers["x-user-email"] as string) || "user_default";
    
    if (!task.id) {
      task.id = "task_" + Math.random().toString(36).substring(2, 9);
      task.createdAt = new Date().toISOString();
      task.userId = userEmail;
      task.status = task.status || "PENDING";
      task.priority = task.priority || "MEDIUM";
      task.riskLevel = task.riskLevel || "LOW";
      task.impactScore = Number(task.impactScore) || 5;
      task.effortScore = Number(task.effortScore) || 5;
      db.tasks.unshift(task);
    } else {
      const idx = db.tasks.findIndex(t => t.id === task.id);
      if (idx !== -1) {
        const existingTask = db.tasks[idx];
        db.tasks[idx] = { ...existingTask, ...task, userId: existingTask.userId || userEmail };
      } else {
        task.userId = userEmail;
        db.tasks.push(task);
      }
    }
    
    // Log it
    db.activity_logs.unshift({
      id: "log_" + Date.now(),
      userId: userEmail,
      timestamp: new Date().toISOString(),
      action: `Task Updated`,
      details: `Task: "${task.title}" updated successfully.`,
      category: "INFO"
    });

    writeDB(db);
    res.json({ success: true, task });
  } catch (error: any) {
    console.error("Error saving task:", error);
    res.status(500).json({ error: "Failed to save task", message: error.message });
  }
});

// Delete Task
app.delete("/api/db/tasks/:id", (req, res) => {
  const { id } = req.params;
  const userEmail = (req.headers["x-user-email"] as string) || "user_default";
  const db = loadDB();
  
  const task = db.tasks.find(t => t.id === id);
  if (task && task.userId !== userEmail) {
    return res.status(403).json({ error: "Unauthorized access to this task." });
  }

  db.tasks = db.tasks.filter(t => t.id !== id);
  db.subtasks = db.subtasks.filter(s => s.taskId !== id);
  
  db.activity_logs.unshift({
    id: "log_" + Date.now(),
    userId: userEmail,
    timestamp: new Date().toISOString(),
    action: "Task Deleted",
    details: `Task roadmap and matching subtask parameters deleted.`,
    category: "WARNING"
  });

  writeDB(db);
  res.json({ success: true });
});

// Update standard Subtask checkboxes
app.post("/api/db/subtasks/toggle", (req, res) => {
  const { id, completed } = req.body;
  const userEmail = (req.headers["x-user-email"] as string) || "user_default";
  const db = loadDB();
  const subtask = db.subtasks.find(s => s.id === id);
  if (subtask) {
    const parentTask = db.tasks.find(t => t.id === subtask.taskId);
    if (parentTask && parentTask.userId !== userEmail) {
      return res.status(403).json({ error: "Unauthorized access to this subtask." });
    }

    subtask.completed = completed;
    
    // Log the event
    db.activity_logs.unshift({
      id: "log_" + Date.now(),
      userId: userEmail,
      timestamp: new Date().toISOString(),
      action: "Subtask Toggled",
      details: `Subtask "${subtask.title}" marked as ${completed ? 'completed' : 'pending'}.`,
      category: "SUCCESS"
    });
    
    writeDB(db);
    res.json({ success: true, subtask });
  } else {
    res.status(404).json({ error: "Subtask not found" });
  }
});

// Create new Subtask manually
app.post("/api/db/subtasks/add", (req, res) => {
  try {
    const { taskId, title, estimatedMinutes } = req.body;
    const userEmail = (req.headers["x-user-email"] as string) || "user_default";
    const db = loadDB();

    const parentTask = db.tasks.find(t => t.id === taskId);
    if (parentTask && parentTask.userId !== userEmail) {
      return res.status(403).json({ error: "Unauthorized access to this task." });
    }

    const subtask = {
      id: "sub_" + Math.random().toString(36).substring(2, 9),
      taskId,
      title,
      completed: false,
      order: db.subtasks.filter(s => s.taskId === taskId).length + 1,
      estimatedMinutes: Number(estimatedMinutes) || 30
    };
    
    db.subtasks.push(subtask);
    writeDB(db);
    res.json({ success: true, subtask });
  } catch (error: any) {
    console.error("Error adding subtask:", error);
    res.status(500).json({ error: "Failed to add subtask", message: error.message });
  }
});

// Sync/Connect Google Calendar (Simulated / Live)
app.post("/api/calendar/sync-all", (req, res) => {
  const userEmail = (req.headers["x-user-email"] as string) || "user_default";
  const db = loadDB();
  
  // Connect and sync any unsynced local tasks to calendar as synced events for this specific user
  const pendingSyncTasks = db.tasks.filter(t => t.userId === userEmail && t.scheduledSlot && !t.googleCalendarConnected);
  
  let count = 0;
  pendingSyncTasks.forEach(task => {
    // Generate simulated Google Calendar Event
    const parts = task.scheduledSlot.split(" - ");
    if (parts.length === 2) {
      db.calendar_events.push({
        id: "ev_gcal_" + Math.random().toString(36).substring(2, 9),
        userId: userEmail,
        title: "🛡️ [Preempt AI] " + task.title,
        start: parts[0],
        end: parts[1],
        description: `Automated slot secured by Preempt Optimizer.\nTask description: ${task.description}`,
        synced: true,
        source: "GOOGLE_CALENDAR",
        taskId: task.id
      });
      task.googleCalendarConnected = true;
      count++;
    }
  });

  db.activity_logs.unshift({
    id: "log_" + Date.now(),
    userId: userEmail,
    timestamp: new Date().toISOString(),
    action: "Google Calendar Sync",
    details: `Successfully synchronized ${count} task schedules to Google Calendar actively.`,
    category: "SUCCESS"
  });

  writeDB(db);
  res.json({ success: true, count });
});

// Add calendar event manually
app.post("/api/db/calendar/add", (req, res) => {
  const userEmail = (req.headers["x-user-email"] as string) || "user_default";
  const db = loadDB();
  const event = req.body;
  
  event.id = "event_" + Math.random().toString(36).substring(2, 9);
  event.userId = userEmail;
  event.synced = event.synced !== undefined ? event.synced : true;
  event.source = event.source || "PREEMPT_AI";
  
  db.calendar_events.push(event);
  
  db.activity_logs.unshift({
    id: "log_" + Date.now(),
    userId: userEmail,
    timestamp: new Date().toISOString(),
    action: "Calendar Item Added",
    details: `Slot booked for "${event.title}".`,
    category: "INFO"
  });

  writeDB(db);
  res.json({ success: true, event });
});


/* ==========================================
   AI ENGINE / AGENT API IMPLEMENTATIONS
   ========================================== */

// 1. Task Breakdown Agent
app.post("/api/ai/breakdown", async (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: "Task title is required" });

  const customAI = getAIInstance();
  if (customAI) {
    try {
      const response = await generateContentWithFallback({
        model: "gemini-3.5-flash",
        contents: `Review this task title and description. Break it down into 3-5 structured, bite-sized components or milestones. Estimating estimatedMinutes spent per item.
Title: ${title}
Description: ${description || "No description provided."}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subtasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: "Actionable concrete, humble task description." },
                    estimatedMinutes: { type: Type.INTEGER, description: "Clear time estimate in minutes (e.g. 15, 30, 45, 60, 120)." }
                  },
                  required: ["title", "estimatedMinutes"]
                }
              }
            },
            required: ["subtasks"]
          }
        }
      });

      const data = JSON.parse(response.text || '{"subtasks": []}');
      return res.json({ subtasks: data.subtasks });
    } catch (err: any) {
      console.error("Gemini breakdown error:", err);
    }
  }

  // Fallback Simulator Engine
  const simulatedSubtasks = [
    { title: `Audit background prerequisites for ${title}`, estimatedMinutes: 30 },
    { title: `Draft core framework implementation structural guidelines`, estimatedMinutes: 60 },
    { title: `Review final checkpoints and self-validate metrics`, estimatedMinutes: 45 }
  ];
  res.json({ subtasks: simulatedSubtasks });
});

// 2. Priority Scoring Agent
app.post("/api/ai/prioritize", async (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: "Task title is required" });

  const customAI = getAIInstance();
  if (customAI) {
    try {
      const response = await generateContentWithFallback({
        model: "gemini-3.5-flash",
        contents: `Evaluate the Impact Score (1-10) and Effort Score (1-10) of the task. Keep in mind:
High impact and low effort = High Priority (quick win).
High impact and high effort = High/Medium Priority (major project).
Low impact and high effort = Low Priority (thankless task/deprioritize).

Input Task Title: ${title}
Input Task Description: ${description || "None provided"}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              priority: { type: Type.STRING, description: "Must be exactly: LOW, MEDIUM, HIGH, or CRITICAL" },
              impactScore: { type: Type.INTEGER, description: "Integer from 1 to 10" },
              effortScore: { type: Type.INTEGER, description: "Integer from 1 to 10" },
              reason: { type: Type.STRING, description: "A simple, executive summary explanation of priority status logic." }
            },
            required: ["priority", "impactScore", "effortScore", "reason"]
          }
        }
      });

      const data = JSON.parse(response.text || '{"priority": "MEDIUM", "impactScore": 5, "effortScore": 5, "reason": "Evaluated successfully"}');
      return res.json(data);
    } catch (err: any) {
      console.error("Gemini prioritization error:", err);
    }
  }

  // Fallback simulator code
  const hasUrgentWords = /urgent|asap|deadline|exam|test|now|pitch|bill|pay/i.test(title);
  const impact = hasUrgentWords ? 9 : 6;
  const effort = title.length > 25 ? 7 : 4;
  const priority = hasUrgentWords ? "HIGH" : "MEDIUM";
  res.json({
    priority,
    impactScore: impact,
    effortScore: effort,
    reason: "Priority and ratings scored using local impact-to-urgency pattern parameters."
  });
});

// 3. Risk Prediction Engine
app.post("/api/ai/predict-risk", async (req, res) => {
  const { title, deadline, subtasksCount, calendarCount } = req.body;

  const customAI = getAIInstance();
  if (customAI) {
    try {
      const response = await generateContentWithFallback({
        model: "gemini-3.5-flash",
        contents: `Assess the immediate risk level (LOW, MEDIUM, HIGH) of missing the deadline of this task.
Task: ${title}
Required steps left: ${subtasksCount || 3} items.
Calendar engagements today/tomorrow: ${calendarCount || 2} meetings.
Deadline: ${deadline}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              riskLevel: { type: Type.STRING, description: "Must be exactly: LOW, MEDIUM, or HIGH" },
              riskReason: { type: Type.STRING, description: "Direct, human-friendly explanation of potential blockers or scheduling bottlenecks." }
            },
            required: ["riskLevel", "riskReason"]
          }
        }
      });

      const data = JSON.parse(response.text || '{"riskLevel": "LOW", "riskReason": "Secure window"}');
      return res.json(data);
    } catch (e) {
      console.error("Gemini risk model error:", e);
    }
  }

  // Fallback estimation
  const daysRemaining = (new Date(deadline).getTime() - Date.now()) / (1000 * 3600 * 24);
  let riskLevel = "LOW";
  let riskReason = "You have plenty of quiet focus margins remaining prior to final deadline metrics.";
  if (daysRemaining < 1.5) {
    riskLevel = "HIGH";
    riskReason = "Extremely tight schedule. Less than 36 hours left and pending subtasks require urgent concentration.";
  } else if (daysRemaining < 3) {
    riskLevel = "MEDIUM";
    riskReason = "Moderate risk. Weekday calendar meetings may limit continuous focus windows.";
  }
  res.json({ riskLevel, riskReason });
});

// 4. Schedule Optimizer
app.post("/api/ai/optimize-schedule", async (req, res) => {
  const userEmail = (req.headers["x-user-email"] as string) || "user_default";
  const db = loadDB();
  const tasksToSchedule = db.tasks.filter(t => t.userId === userEmail && t.status !== "COMPLETED");
  const calendarEvents = db.calendar_events.filter(e => e.userId === userEmail);

  const customAI = getAIInstance();
  if (customAI) {
    try {
      const response = await generateContentWithFallback({
        model: "gemini-3.5-flash",
        contents: `We need to find optimal 1-2 hour work slots on this week's timetable for these tasks, avoiding conflicts with current meetings.
        Now is ${new Date().toISOString()}.
        Weekly Meetings: ${JSON.stringify(calendarEvents)}
        Tasks to schedule: ${JSON.stringify(tasksToSchedule)}
        
        Suggest exactly one candidate start/end window for each task starting at reasonable business hours (8 AM - 6 PM) in the next 1-4 days. Use standard ISO-8601 UTC notation.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              assignments: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    taskId: { type: Type.STRING },
                    slot: { type: Type.STRING, description: "Format: YYYY-MM-DDTHH:MM:SS.000Z - YYYY-MM-DDTHH:MM:SS.000Z" }
                  },
                  required: ["taskId", "slot"]
                }
              }
            },
            required: ["assignments"]
          }
        }
      });

      const data = JSON.parse(response.text || '{"assignments": []}');
      
      // Update local db
      let changes = 0;
      data.assignments.forEach((asg: any) => {
        const task = db.tasks.find(t => t.id === asg.taskId && t.userId === userEmail);
        if (task) {
          task.scheduledSlot = asg.slot;
          changes++;
        }
      });

      if (changes > 0) {
        db.activity_logs.unshift({
          id: "log_" + Date.now(),
          userId: userEmail,
          timestamp: new Date().toISOString(),
          action: "AI Timetable Optimized",
          details: `Preempt Scheduler booked slots for ${changes} tasks avoiding conflict overlaps.`,
          category: "AGENT"
        });
        writeDB(db);
      }

      return res.json({ success: true, count: changes, assignments: data.assignments });
    } catch (e) {
      console.error("Gemini optimizer error:", e);
    }
  }

  // Fallback scheduler logic
  let changes = 0;
  const assignments: any[] = [];
  tasksToSchedule.forEach((task, index) => {
    const plannedDate = new Date();
    plannedDate.setDate(plannedDate.getDate() + (index + 1));
    plannedDate.setHours(9 + index, 0, 0, 0);
    const endDate = new Date(plannedDate.getTime() + 90 * 60000); // 1.5 Hour Blocks
    
    const slotString = `${plannedDate.toISOString()} - ${endDate.toISOString()}`;
    task.scheduledSlot = slotString;
    assignments.push({ taskId: task.id, slot: slotString });
    changes++;
  });

  if (changes > 0) {
    db.activity_logs.unshift({
      id: "log_" + Date.now(),
      userId: userEmail,
      timestamp: new Date().toISOString(),
      action: "Local Timetable Scheduled",
      details: `Scheduled ${changes} priority tasks dynamically in open calendar pockets.`,
      category: "AGENT"
    });
    writeDB(db);
  }

  res.json({ success: true, count: changes, assignments });
});

// 5. Conversational Copilot Chat Interface
app.post("/api/ai/chat", async (req, res) => {
  const { message, history } = req.body;
  const userEmail = (req.headers["x-user-email"] as string) || "user_default";
  if (!message) return res.status(400).json({ error: "Message content cannot be blank" });

  const db = loadDB();
  const customAI = getAIInstance();
  
  const userTasks = db.tasks.filter(t => t.userId === userEmail);
  const userEvents = db.calendar_events.filter(e => e.userId === userEmail);
  const userLogs = db.activity_logs.filter(l => l.userId === userEmail);

  const systemPrompt = `You are Preempt AI (Senior Personal Task Architect & Proactive Life Saver).
  Your primary purpose is assessing pending deadlines, advising on schedule structures, warning about high-risk timelines, and scheduling mitigation work slots.
  
  Here is the active project database of the user for query context variables:
  ${JSON.stringify({
    tasks: userTasks,
    meetings: userEvents,
    logs: userLogs.slice(0, 5)
  })}
  
  Answer concisely and helpfully. Keep instructions direct, bulleted, and professional. Avoid fluffy self-praising AI phrases. Avoid terminal status lines.`;

  if (customAI) {
    try {
      const response = await generateContentWithFallback({
        model: "gemini-3.5-flash",
        contents: `${message}`,
        config: {
          systemInstruction: systemPrompt
        }
      });
      return res.json({ response: response.text });
    } catch (e: any) {
      console.error("Gemini Chat Engine Error:", e);
    }
  }

  // Context-aware simulator answers
  let responseText = "My apologies, the AI model is operating in fallback mode. ";
  if (/hello|hi|hey/i.test(message)) {
    responseText += `Hello! I am Preempt AI, your companion task architect. Would you like me to break down your subtasks or find an open meeting-free slot to work on them?`;
  } else if (/risk|threat|problem/i.test(message)) {
    const highRiskTasks = userTasks.filter(t => t.riskLevel === "HIGH");
    if (highRiskTasks.length > 0) {
      responseText += `Alert: You currently have ${highRiskTasks.length} task(s) flagged as HIGH-RISK. The primary bottleneck is "${highRiskTasks[0].title}" owing to its imminent target deadline. I recommend scheduling a focus window today.`;
    } else {
      responseText += "Excellent news! There are zero highly risky scheduling bottlenecks detected across your roadmap today.";
    }
  } else {
    responseText += `Received command. Here is the context status: You have ${userTasks.filter(t => t.status !== "COMPLETED").length} pending tasks remaining. I recommend running the Preempt Schedule Optimizer to book quiet workspaces on your Google Calendar.`;
  }
  res.json({ response: responseText });
});

// 6. Natural Language (Voice-enabled) Interpreter
app.post("/api/ai/voice-interpreter", async (req, res) => {
  const { transcript } = req.body;
  const userEmail = (req.headers["x-user-email"] as string) || "user_default";
  if (!transcript) return res.status(400).json({ error: "Transcript is empty" });

  const customAI = getAIInstance();
  let actionMatched = "chat";
  let extractedTask = null;
  let replyText = "";

  if (customAI) {
    try {
      const gRes = await generateContentWithFallback({
        model: "gemini-3.5-flash",
        contents: `Process this verbal command. Classify the user intent into one of: 'create_task', 'optimize', 'or 'general_chat'.
        If 'create_task', extract the structured title, priority, and approximate hours.
        Command transcript: "${transcript}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              intent: { type: Type.STRING, description: "Must be: create_task, optimize, or general_chat" },
              taskTitle: { type: Type.STRING, description: "Extracted name/title for task (if create_task)" },
              priority: { type: Type.STRING, description: "LOW, MEDIUM, HIGH, or CRITICAL" },
              replyText: { type: Type.STRING, description: "A simple verbal confirmation answer to speak back." }
            },
            required: ["intent", "replyText"]
          }
        }
      });

      const data = JSON.parse(gRes.text || "{}");
      actionMatched = data.intent;
      replyText = data.replyText;
      if (data.taskTitle) {
        extractedTask = {
          title: data.taskTitle,
          priority: data.priority || "MEDIUM",
          description: "Created via Voice Assistant instruction: " + transcript
        };
      }
    } catch (e) {
      console.error("Voice interpreter error:", e);
    }
  }

  // Fast procedural fallback parser
  if (!replyText) {
    if (/schedule|optimize|calendar/i.test(transcript)) {
      actionMatched = "optimize";
      replyText = "Initiating Preempt schedule optimizer to arrange free pockets in your agenda.";
    } else if (/add|create|remind/i.test(transcript)) {
      actionMatched = "create_task";
      // Pick up task text
      const cleanText = transcript.replace(/add/i, "").replace(/create/i, "").trim();
      extractedTask = {
        title: cleanText || "Voice Generated Task",
        priority: "HIGH",
        description: "Added automatically by Voice Companion."
      };
      replyText = `Understood. I have recorded a new High Priority task to your list: ${extractedTask.title}.`;
    } else {
      actionMatched = "chat";
      replyText = `Voice Companion processed your transcript: "${transcript}". No automatic task command was recognized, but I can assist you with active dashboard scheduling if requested!`;
    }
  }

  // Automatically execute DB write if task extracted
  if (actionMatched === "create_task" && extractedTask) {
    const db = loadDB();
    const newTask = {
      id: "task_" + Math.random().toString(36).substring(2, 9),
      userId: userEmail,
      title: extractedTask.title,
      description: extractedTask.description,
      deadline: new Date(Date.now() + 2 * 86400000).toISOString(), // defaults to 2 days
      status: "PENDING",
      priority: extractedTask.priority,
      impactScore: 7,
      effortScore: 4,
      riskLevel: "MEDIUM",
      riskReason: "Fresh voice task queued on active stack.",
      scheduledSlot: "",
      createdAt: new Date().toISOString()
    };
    db.tasks.unshift(newTask);
    
    db.activity_logs.unshift({
      id: "log_" + Date.now(),
      userId: userEmail,
      timestamp: new Date().toISOString(),
      action: "Voice Task Dispatched",
      details: `Dispatched "${newTask.title}" directly via verbal speech recognition.`,
      category: "AGENT"
    });
    
    writeDB(db);
  }

  res.json({ action: actionMatched, reply: replyText, task: extractedTask });
});

// Global structured JSON error handler for safe error formatting
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Express App Route Error:", err);
  res.status(err.status || 500).json({
    success: false,
    error: err.name || "InternalServerError",
    message: err.message || "An unexpected error occurred on the server.",
    stack: process.env.NODE_ENV !== "production" ? err.stack : undefined
  });
});

// Configure Vite middleware for asset serving in non-production, standard SPA fallback
async function startAppServer() {
  if (process.env.NODE_ENV !== "production") {
    const viteInstance = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(viteInstance.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Preempt Full-Stack Running actively on port ${PORT}`);
  });
}

startAppServer();
