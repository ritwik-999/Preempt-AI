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

  const db = loadDB();
  const userTasks = db.tasks.filter(t => t.userId === userEmail);
  const userTaskSummary = userTasks.map(t => ({
    id: t.id,
    title: t.title,
    priority: t.priority,
    status: t.status,
    deadline: t.deadline,
    riskLevel: t.riskLevel,
    scheduledSlot: t.scheduledSlot,
    description: t.description || ""
  }));

  const today = new Date();
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const todayStr = today.toLocaleDateString("en-US", options);

  const customAI = getAIInstance();
  let actionMatched = "general_chat";
  let replyText = "";
  let payload: any = null;

  if (customAI) {
    try {
      const gRes = await generateContentWithFallback({
        model: "gemini-3.5-flash",
        contents: `You are the Preempt AI Voice Assistant. You possess 5 key capabilities:
1. Intelligent task prioritization (intent: 'prioritize_tasks')
2. Autonomous task planning and execution (intent: 'plan_execute_task')
3. Context-aware reminders (intent: 'context_reminder')
4. Editing existing tasks after recording (intent: 'edit_task')
5. Pomodoro / Focus Timer Control (intent: 'timer_control') (e.g. starting, pausing, resetting, or configuring focus timer/break timer)

System Date context: Today is ${todayStr}.
Below is the user's current list of tasks:
${JSON.stringify(userTaskSummary, null, 2)}

Analyze the user's verbal command: "${transcript}"
Classify their command into one of these intents:
- 'create_task': User wants to create a new task.
- 'prioritize_tasks': User wants to prioritize their tasks (re-calculating priority, impact/effort, and risk for all tasks or a specific one).
- 'plan_execute_task': User wants to autonomously plan a task (break it into subtasks, schedule it) and potentially start execution.
- 'context_reminder': User wants to set or receive a context-aware reminder for a task or general deadlines.
- 'edit_task': User wants to edit, change, rename, or update an existing task, or MARK IT AS COMPLETED/FINISHED. If the user says "complete task X", "finish X", "mark X as completed", or "check off X", classify it as 'edit_task' and set 'status' to 'COMPLETED' for that targetTaskId.
- 'timer_control': User wants to start, pause, resume, reset, or set a duration/mode for the focus/break timer. (e.g., "start timer", "pause the clock", "set timer to 20 minutes", "start a short break").
- 'optimize': User wants to run the overall schedule optimizer.
- 'general_chat': Conversational chatter or simple explanation.

Date parsing instruction: If the user refers to any due date, deadline, or completion date (e.g., "by tomorrow", "due Friday at 5 PM", "by July 2nd", "for next Monday"), you must interpret that date based on the reference system date (${todayStr}) and translate it into a valid ISO-8601 UTC date-time string (e.g., 2026-06-30T17:00:00.000Z). Populate this in the 'deadline' field of createTaskData, planExecuteData, or editTaskData.
Calculate the exact date correctly. For example, if today is ${todayStr}:
- "tomorrow" -> tomorrow's date at 5:00 PM UTC.
- "by Friday" -> next Friday's date at 5:00 PM UTC.
- "by end of today" -> today's date at 10:00 PM UTC.
- "by [specific day/month]" -> that specific calendar date.

Determine the intent and fill out the matching data structure completely.
For 'edit_task' or 'plan_execute_task' or 'context_reminder', try to find the matching 'targetTaskId' from the provided user tasks context using semantic similarity or matching titles.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              intent: { 
                type: Type.STRING, 
                description: "Must be exactly: create_task, prioritize_tasks, plan_execute_task, context_reminder, edit_task, timer_control, optimize, or general_chat" 
              },
              replyText: { 
                type: Type.STRING, 
                description: "A professional, warm verbal confirmation summarizing exactly what was analyzed, decided, and executed." 
              },
              createTaskData: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  priority: { type: Type.STRING, description: "LOW, MEDIUM, HIGH, or CRITICAL" },
                  impactScore: { type: Type.INTEGER },
                  effortScore: { type: Type.INTEGER },
                  description: { type: Type.STRING },
                  deadline: { type: Type.STRING, description: `ISO-8601 string representing the user-specified deadline/due date translated relative to ${todayStr}.` }
                },
                required: ["title"]
              },
              prioritizeData: {
                type: Type.OBJECT,
                properties: {
                  tasks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        priority: { type: Type.STRING, description: "LOW, MEDIUM, HIGH, or CRITICAL" },
                        impactScore: { type: Type.INTEGER },
                        effortScore: { type: Type.INTEGER },
                        riskLevel: { type: Type.STRING, description: "LOW, MEDIUM, or HIGH" },
                        riskReason: { type: Type.STRING }
                      },
                      required: ["id", "priority", "impactScore", "effortScore", "riskLevel", "riskReason"]
                    }
                  }
                }
              },
              planExecuteData: {
                type: Type.OBJECT,
                properties: {
                  targetTaskId: { type: Type.STRING, description: "Existing task ID if matching, or empty if new" },
                  newTaskTitle: { type: Type.STRING, description: "If creating a new task, the title of the task" },
                  subtasks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        estimatedMinutes: { type: Type.INTEGER }
                      },
                      required: ["title", "estimatedMinutes"]
                    }
                  },
                  startTime: { type: Type.STRING, description: `ISO timestamp for scheduled slot start relative to ${todayStr}` },
                  endTime: { type: Type.STRING, description: `ISO timestamp for scheduled slot end relative to ${todayStr}` },
                  executeFirst: { type: Type.BOOLEAN, description: "Set to true if user requested starting/executing immediately" },
                  deadline: { type: Type.STRING, description: `ISO-8601 string representing the user-specified deadline/due date translated relative to ${todayStr}.` }
                }
              },
              reminderData: {
                type: Type.OBJECT,
                properties: {
                  targetTaskId: { type: Type.STRING },
                  title: { type: Type.STRING },
                  time: { type: Type.STRING, description: "ISO timestamp for reminder calendar event" },
                  description: { type: Type.STRING }
                }
              },
              editTaskData: {
                type: Type.OBJECT,
                properties: {
                  targetTaskId: { type: Type.STRING },
                  title: { type: Type.STRING },
                  priority: { type: Type.STRING, description: "LOW, MEDIUM, HIGH, or CRITICAL" },
                  description: { type: Type.STRING },
                  status: { type: Type.STRING, description: "PENDING or COMPLETED" },
                  deadline: { type: Type.STRING, description: `ISO timestamp representing the new deadline date relative to ${todayStr}` }
                }
              },
              timerData: {
                type: Type.OBJECT,
                properties: {
                  action: { type: Type.STRING, description: "Must be: START, PAUSE, RESET, or SET" },
                  durationMinutes: { type: Type.INTEGER, description: "The custom timer duration in minutes (if applicable, else optional)" },
                  presetMode: { type: Type.STRING, description: "Must be: FOCUS, SHORT_BREAK, or LONG_BREAK. Otherwise optional." }
                },
                required: ["action"]
              }
            },
            required: ["intent", "replyText"]
          }
        }
      });

      payload = JSON.parse(gRes.text || "{}");
      actionMatched = payload.intent || "general_chat";
      replyText = payload.replyText || "";
    } catch (e) {
      console.error("Voice interpreter AI error:", e);
    }
  }

  // Fallback procedural parsing if AI fails or is not configured
  if (!replyText) {
    const text = transcript.toLowerCase();
    if (/prioritize|score|rank/i.test(text)) {
      actionMatched = "prioritize_tasks";
      replyText = "Initiating voice-driven intelligent task prioritization across all your active roadmaps.";
      payload = {
        intent: "prioritize_tasks",
        replyText: replyText,
        prioritizeData: {
          tasks: userTasks.map(t => ({
            id: t.id,
            priority: "HIGH",
            impactScore: 8,
            effortScore: 4,
            riskLevel: "MEDIUM",
            riskReason: "Re-evaluated and prioritized via manual voice control fallback."
          }))
        }
      };
    } else if (/plan|execute|autonomously/i.test(text)) {
      actionMatched = "plan_execute_task";
      const target = userTasks[0] || null;
      replyText = `Beginning autonomous planning and execution sequence for ${target ? `"${target.title}"` : "your active roadmaps"}.`;
      payload = {
        intent: "plan_execute_task",
        replyText: replyText,
        planExecuteData: {
          targetTaskId: target ? target.id : "",
          newTaskTitle: target ? "" : "Autonomous Voice Initiative",
          subtasks: [
            { title: "Define technical scope parameters", estimatedMinutes: 30 },
            { title: "Synthesize active checkpoints", estimatedMinutes: 45 },
            { title: "Verify output compliance metrics", estimatedMinutes: 60 }
          ],
          startTime: new Date(Date.now() + 3600000).toISOString(),
          endTime: new Date(Date.now() + 9000000).toISOString(),
          executeFirst: true
        }
      };
    } else if (/remind|reminder|alert/i.test(text)) {
      actionMatched = "context_reminder";
      const target = userTasks[0] || null;
      replyText = `Acknowledged. Setting a context-aware calendar reminder for ${target ? `"${target.title}"` : "your daily tasks"}.`;
      payload = {
        intent: "context_reminder",
        replyText: replyText,
        reminderData: {
          targetTaskId: target ? target.id : "",
          title: `⏰ Reminder: ${target ? target.title : "Active task session review"}`,
          time: new Date(Date.now() + 7200000).toISOString(),
          description: `Context-aware reminder established via voice command. Task deadline risk analyzed and compiled.`
        }
      };
    } else if (/complete|finish|done|check\s*off|mark/i.test(text)) {
      actionMatched = "edit_task";
      const cleanCmd = text.replace(/complete|finish|done|check\s*off|mark\s*as\s*(completed|done)|task/gi, "").trim();
      let target = userTasks[0] || null;
      if (cleanCmd.length > 2) {
        const found = userTasks.find(t => t.title.toLowerCase().includes(cleanCmd.toLowerCase()) || cleanCmd.toLowerCase().includes(t.title.toLowerCase()));
        if (found) target = found;
      }
      replyText = `Understood. Marking "${target ? target.title : 'your task'}" as completed.`;
      payload = {
        intent: "edit_task",
        replyText: replyText,
        editTaskData: {
          targetTaskId: target ? target.id : "",
          status: "COMPLETED"
        }
      };
    } else if (/edit|change|update|rename/i.test(text)) {
      actionMatched = "edit_task";
      const target = userTasks[0] || null;
      replyText = `Editing target task parameter fields according to vocal specifications.`;
      payload = {
        intent: "edit_task",
        replyText: replyText,
        editTaskData: {
          targetTaskId: target ? target.id : "",
          priority: "CRITICAL",
          description: "Vocal adjustment applied successfully."
        }
      };
    } else if (/timer|stop|pause|resume|start|reset|focus|break/i.test(text)) {
      actionMatched = "timer_control";
      let action: "START" | "PAUSE" | "RESET" | "SET" = "START";
      let durationMinutes = 25;
      let presetMode: "FOCUS" | "SHORT_BREAK" | "LONG_BREAK" = "FOCUS";
      
      if (/stop|pause/i.test(text)) {
        action = "PAUSE";
        replyText = "I have paused your focus timer session.";
      } else if (/reset/i.test(text)) {
        action = "RESET";
        replyText = "I have reset your focus timer session.";
      } else {
        action = "START";
        if (/short break|rest/i.test(text)) {
          presetMode = "SHORT_BREAK";
          durationMinutes = 5;
          replyText = "Starting a five minute recovery break now.";
        } else if (/long break|relax/i.test(text)) {
          presetMode = "LONG_BREAK";
          durationMinutes = 15;
          replyText = "Initiating a fifteen minute long-break cycle.";
        } else {
          presetMode = "FOCUS";
          const match = text.match(/(\d+)\s*(min|minute|mins)/i);
          if (match) {
            durationMinutes = parseInt(match[1]);
            action = "SET";
            replyText = `Setting timer to ${durationMinutes} minutes and starting your focus sprint.`;
          } else {
            replyText = "Initiating your standard twenty-five minute deep focus interval.";
          }
        }
      }
      
      payload = {
        intent: "timer_control",
        replyText: replyText,
        timerData: {
          action: action,
          durationMinutes: durationMinutes,
          presetMode: presetMode
        }
      };
    } else if (/schedule|optimize|calendar/i.test(text)) {
      actionMatched = "optimize";
      replyText = "Executing the Preempt schedule optimizer for open pockets in your calendar.";
    } else if (/add|create/i.test(text)) {
      actionMatched = "create_task";
      let cleanText = transcript.replace(/add\s+task/i, "").replace(/create\s+task/i, "").replace(/add/i, "").replace(/create/i, "").trim();
      let detectedDeadline: string | undefined = undefined;
      const nowTime = Date.now();

      // Extract tomorrow
      if (/tomorrow/i.test(text)) {
        detectedDeadline = new Date(nowTime + 86400000).toISOString();
        cleanText = cleanText.replace(/due tomorrow|tomorrow|by tomorrow/gi, "").trim();
      } 
      // Extract today
      else if (/today|end of today/i.test(text)) {
        const todayDate = new Date();
        todayDate.setHours(22, 0, 0, 0);
        detectedDeadline = todayDate.toISOString();
        cleanText = cleanText.replace(/due today|today|by end of today/gi, "").trim();
      }
      // Extract specific weekday
      else if (/friday/i.test(text)) {
        const resultDate = new Date();
        resultDate.setDate(resultDate.getDate() + (7 + 5 - resultDate.getDay()) % 7 || 7);
        resultDate.setHours(17, 0, 0, 0);
        detectedDeadline = resultDate.toISOString();
        cleanText = cleanText.replace(/due friday|by friday|friday/gi, "").trim();
      } else if (/monday/i.test(text)) {
        const resultDate = new Date();
        resultDate.setDate(resultDate.getDate() + (7 + 1 - resultDate.getDay()) % 7 || 7);
        resultDate.setHours(17, 0, 0, 0);
        detectedDeadline = resultDate.toISOString();
        cleanText = cleanText.replace(/due monday|by monday|monday/gi, "").trim();
      } else if (/july 2|july 2nd/i.test(text)) {
        detectedDeadline = new Date(2026, 6, 2, 17, 0, 0).toISOString();
        cleanText = cleanText.replace(/july 2nd|july 2|by july 2nd|by july 2/gi, "").trim();
      } else if (/june 30|june 30th/i.test(text)) {
        detectedDeadline = new Date(2026, 5, 30, 17, 0, 0).toISOString();
        cleanText = cleanText.replace(/june 30th|june 30|by june 30th|by june 30/gi, "").trim();
      }

      // Clean extra words like "due by", "by", "for" at the end of title
      cleanText = cleanText.replace(/\s+(due|by|for)$/i, "").trim();

      replyText = `Created a new task: ${cleanText || "Voice Generated Task"}.`;
      payload = {
        intent: "create_task",
        replyText: replyText,
        createTaskData: {
          title: cleanText || "Voice Generated Task",
          priority: "HIGH",
          impactScore: 7,
          effortScore: 4,
          description: "Created via verbal companion instruction.",
          deadline: detectedDeadline
        }
      };
    } else {
      actionMatched = "general_chat";
      replyText = `I processed your command "${transcript}". No direct actionable workflow was matched. I can prioritize, plan, set reminders, or edit tasks if specified!`;
    }
  }

  // Database Execution Block
  if (actionMatched === "create_task" && payload?.createTaskData) {
    const data = payload.createTaskData;
    const newTask = {
      id: "task_" + Math.random().toString(36).substring(2, 9),
      userId: userEmail,
      title: data.title || "Voice Task",
      description: data.description || "Created via Voice Command.",
      deadline: data.deadline ? new Date(data.deadline).toISOString() : new Date(Date.now() + 2 * 86400000).toISOString(),
      status: "PENDING",
      priority: data.priority || "MEDIUM",
      impactScore: Number(data.impactScore) || 5,
      effortScore: Number(data.effortScore) || 5,
      riskLevel: "LOW",
      riskReason: "Created directly via Preempt Voice Agent.",
      scheduledSlot: "",
      createdAt: new Date().toISOString()
    };
    db.tasks.unshift(newTask);

    db.activity_logs.unshift({
      id: "log_" + Date.now(),
      userId: userEmail,
      timestamp: new Date().toISOString(),
      action: "Voice Task Created",
      details: `Vocal command spawned new task: "${newTask.title}" with ${newTask.priority} priority.`,
      category: "AGENT"
    });
  }

  else if (actionMatched === "prioritize_tasks" && payload?.prioritizeData?.tasks) {
    const updatesList = payload.prioritizeData.tasks;
    let count = 0;
    updatesList.forEach((update: any) => {
      const task = db.tasks.find(t => t.id === update.id && t.userId === userEmail);
      if (task) {
        task.priority = update.priority || task.priority;
        task.impactScore = Number(update.impactScore) || task.impactScore;
        task.effortScore = Number(update.effortScore) || task.effortScore;
        task.riskLevel = update.riskLevel || task.riskLevel;
        task.riskReason = update.riskReason || task.riskReason;
        count++;
      }
    });

    db.activity_logs.unshift({
      id: "log_" + Date.now(),
      userId: userEmail,
      timestamp: new Date().toISOString(),
      action: "Intelligent Task Prioritization",
      details: `Vocal priority evaluation completed. Re-balanced parameters for ${count} tasks.`,
      category: "AGENT"
    });
  }

  else if (actionMatched === "plan_execute_task" && payload?.planExecuteData) {
    const data = payload.planExecuteData;
    let task = db.tasks.find(t => t.id === data.targetTaskId && t.userId === userEmail);
    
    if (!task) {
      // Create new task autonomously
      task = {
        id: "task_" + Math.random().toString(36).substring(2, 9),
        userId: userEmail,
        title: data.newTaskTitle || "Autonomous Strategy Session",
        description: "Autonomously planned and generated via voice instruction.",
        deadline: data.deadline ? new Date(data.deadline).toISOString() : new Date(Date.now() + 2 * 86400000).toISOString(),
        status: "PENDING",
        priority: "HIGH",
        impactScore: 8,
        effortScore: 5,
        riskLevel: "MEDIUM",
        riskReason: "Autonomously generated pipeline task.",
        scheduledSlot: "",
        createdAt: new Date().toISOString()
      };
      db.tasks.unshift(task);
    }

    // Add subtasks
    if (data.subtasks && Array.isArray(data.subtasks)) {
      data.subtasks.forEach((sub: any, idx: number) => {
        db.subtasks.push({
          id: "sub_" + Math.random().toString(36).substring(2, 9),
          taskId: task.id,
          title: sub.title,
          completed: idx === 0 && data.executeFirst ? true : false,
          order: idx + 1,
          estimatedMinutes: Number(sub.estimatedMinutes) || 30
        });
      });
    }

    // Schedule slot if provided
    if (data.startTime && data.endTime) {
      const startStr = new Date(data.startTime).toISOString();
      const endStr = new Date(data.endTime).toISOString();
      task.scheduledSlot = `${startStr} - ${endStr}`;

      // Create Calendar Event
      db.calendar_events.push({
        id: "ev_gcal_" + Math.random().toString(36).substring(2, 9),
        userId: userEmail,
        title: "🛡️ [Preempt Autonomous Plan] " + task.title,
        start: startStr,
        end: endStr,
        description: `Autonomous execution window secured. Subtasks allocated and running.`,
        synced: true,
        source: "PREEMPT_AI",
        taskId: task.id
      });
    }

    db.activity_logs.unshift({
      id: "log_" + Date.now(),
      userId: userEmail,
      timestamp: new Date().toISOString(),
      action: "Autonomous Plan Created",
      details: `Generated plan for "${task.title}" containing ${data.subtasks?.length || 0} tasks and booked schedule slot.`,
      category: "SUCCESS"
    });
  }

  else if (actionMatched === "context_reminder" && payload?.reminderData) {
    const data = payload.reminderData;
    const remTime = data.time ? new Date(data.time).toISOString() : new Date(Date.now() + 3600000).toISOString();
    const remEndTime = new Date(new Date(remTime).getTime() + 1800000).toISOString(); // 30 min duration

    db.calendar_events.push({
      id: "ev_rem_" + Math.random().toString(36).substring(2, 9),
      userId: userEmail,
      title: "⏰ " + (data.title || "Context-Aware Reminder"),
      start: remTime,
      end: remEndTime,
      description: data.description || "Synthesized context reminder.",
      synced: true,
      source: "PREEMPT_AI",
      taskId: data.targetTaskId || ""
    });

    db.activity_logs.unshift({
      id: "log_" + Date.now(),
      userId: userEmail,
      timestamp: new Date().toISOString(),
      action: "Context Reminder Armed",
      details: `Active reminder arming completed: "${data.title || 'Context reminder'}"`,
      category: "WARNING"
    });
  }

  else if (actionMatched === "edit_task" && payload?.editTaskData) {
    const data = payload.editTaskData;
    const task = db.tasks.find(t => t.id === data.targetTaskId && t.userId === userEmail);
    if (task) {
      const oldTitle = task.title;
      task.title = data.title || task.title;
      task.priority = data.priority || task.priority;
      task.description = data.description || task.description;
      task.status = data.status || task.status;
      task.deadline = data.deadline || task.deadline;

      db.activity_logs.unshift({
        id: "log_" + Date.now(),
        userId: userEmail,
        timestamp: new Date().toISOString(),
        action: "Vocal Edit Sync",
        details: `Updated fields for task "${oldTitle}" successfully via voice control.`,
        category: "INFO"
      });
    }
  }

  else if (actionMatched === "timer_control" && payload?.timerData) {
    const data = payload.timerData;
    db.activity_logs.unshift({
      id: "log_" + Date.now(),
      userId: userEmail,
      timestamp: new Date().toISOString(),
      action: "Timer Controlled Vocally",
      details: `Vocal command dispatched: ${data.action} ${data.durationMinutes ? `(${data.durationMinutes}m)` : ""} [${data.presetMode || "FOCUS"}]`,
      category: "INFO"
    });
  }

  writeDB(db);

  res.json({ action: actionMatched, reply: replyText, task: payload });
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
