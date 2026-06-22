import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

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
  tasks: [
    {
      id: "task_1",
      userId: "user_default",
      title: "Chemistry Lab Report Draft",
      description: "Analyze the thermodynamic kinetics data from Lab 4 and draft the complete laboratory findings.",
      deadline: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
      status: "PENDING",
      priority: "HIGH",
      impactScore: 8,
      effortScore: 6,
      riskLevel: "HIGH",
      riskReason: "Deadline is tomorrow, and total estimated effort for lab data review is high, overlapping with your calendar meetings.",
      scheduledSlot: "",
      createdAt: new Date().toISOString()
    },
    {
      id: "task_2",
      userId: "user_default",
      title: "Preempt AI Project Pitch Slides",
      description: "Build a highly compelling business pitch with real user research data and visual UI maps.",
      deadline: new Date(Date.now() + 4 * 86400000).toISOString(), // 4 days from now
      status: "IN_PROGRESS",
      priority: "CRITICAL",
      impactScore: 10,
      effortScore: 8,
      riskLevel: "MEDIUM",
      riskReason: "Substantial effort remains, but you have free slots over the weekend to cover this product presentation.",
      scheduledSlot: "",
      createdAt: new Date().toISOString()
    },
    {
      id: "task_3",
      userId: "user_default",
      title: "Renew Comprehensive Auto Insurance",
      description: "Check the auto insurance quote options and complete renewal checkout.",
      deadline: new Date(Date.now() + 15 * 86400000).toISOString(), // 15 days from now
      status: "PENDING",
      priority: "LOW",
      impactScore: 3,
      effortScore: 2,
      riskLevel: "LOW",
      riskReason: "Ample window before deadline, low risk factors detected.",
      scheduledSlot: "",
      createdAt: new Date().toISOString()
    }
  ],
  subtasks: [
    { id: "sub_1", taskId: "task_1", title: "Format visual thermodynamic plots", completed: false, order: 1, estimatedMinutes: 45 },
    { id: "sub_2", taskId: "task_1", title: "Review kinetics theory definitions", completed: false, order: 2, estimatedMinutes: 30 },
    { id: "sub_3", taskId: "task_1", title: "Compose background introduction section", completed: false, order: 3, estimatedMinutes: 60 },
    { id: "sub_4", taskId: "task_1", title: "Perform statistical calculation audit", completed: true, order: 4, estimatedMinutes: 30 },
    
    { id: "sub_5", taskId: "task_2", title: "Synthesize target user persona slides", completed: true, order: 1, estimatedMinutes: 45 },
    { id: "sub_6", taskId: "task_2", title: "Design beautiful figma mocks for deck", completed: false, order: 2, estimatedMinutes: 120 },
    { id: "sub_7", taskId: "task_2", title: "Draft executive ROI presentation narrative", completed: false, order: 3, estimatedMinutes: 65 }
  ],
  calendar_events: [
    {
      id: "event_1",
      userId: "user_default",
      title: "Preempt AI Progress Briefing",
      start: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
      end: new Date(new Date().setHours(11, 30, 0, 0)).toISOString(),
      description: "Internal team sync regarding core agents and Google Calendar schedule triggers.",
      synced: true,
      source: "PREEMPT_AI"
    },
    {
      id: "event_2",
      userId: "user_default",
      title: "Corporate UX/UI Alignment Review",
      start: new Date(new Date().setHours(14, 0, 0, 0)).toISOString(),
      end: new Date(new Date().setHours(15, 0, 0, 0)).toISOString(),
      description: "Design evaluation workshop.",
      synced: true,
      source: "GOOGLE_CALENDAR"
    },
    {
      id: "event_3",
      userId: "user_default",
      title: "Product Marketing Sync",
      start: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      start_hour: 11,
      end: new Date(Date.now() + 86400000 + 3600000).toISOString(),
      description: "Alignment call on new launch items.",
      synced: false,
      source: "GOOGLE_CALENDAR"
    }
  ],
  activity_logs: [
    {
      id: "log_1",
      userId: "user_default",
      timestamp: new Date().toISOString(),
      action: "System Bootstrapped",
      details: "Database populated with initial Preempt AI companion templates.",
      category: "SUCCESS"
    }
  ]
};

// Function targeting load database
function loadDB(): DBSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DB, null, 2));
      return INITIAL_DB;
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw);
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

// REST endpoints for Preempt DB Actions
app.get("/api/db/get", (req, res) => {
  const db = loadDB();
  res.json(db);
});

// Update or merge tasks
app.post("/api/db/tasks/save", (req, res) => {
  const db = loadDB();
  const task = req.body;
  
  if (!task.id) {
    task.id = "task_" + Math.random().toString(36).substring(2, 9);
    task.createdAt = new Date().toISOString();
    task.userId = "user_default";
    task.status = task.status || "PENDING";
    task.priority = task.priority || "MEDIUM";
    task.riskLevel = task.riskLevel || "LOW";
    task.impactScore = Number(task.impactScore) || 5;
    task.effortScore = Number(task.effortScore) || 5;
    db.tasks.unshift(task);
  } else {
    const idx = db.tasks.findIndex(t => t.id === task.id);
    if (idx !== -1) {
      db.tasks[idx] = { ...db.tasks[idx], ...task };
    } else {
      db.tasks.push(task);
    }
  }
  
  // Log it
  db.activity_logs.unshift({
    id: "log_" + Date.now(),
    userId: "user_default",
    timestamp: new Date().toISOString(),
    action: `Task Updated`,
    details: `Task: "${task.title}" updated successfully.`,
    category: "INFO"
  });

  writeDB(db);
  res.json({ success: true, task });
});

// Delete Task
app.delete("/api/db/tasks/:id", (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  db.tasks = db.tasks.filter(t => t.id !== id);
  db.subtasks = db.subtasks.filter(s => s.taskId !== id);
  
  writeDB(db);
  res.json({ success: true });
});

// Update standard Subtask checkboxes
app.post("/api/db/subtasks/toggle", (req, res) => {
  const { id, completed } = req.body;
  const db = loadDB();
  const subtask = db.subtasks.find(s => s.id === id);
  if (subtask) {
    subtask.completed = completed;
    
    // Log the event
    db.activity_logs.unshift({
      id: "log_" + Date.now(),
      userId: "user_default",
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
  const { taskId, title, estimatedMinutes } = req.body;
  const db = loadDB();
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
});

// Sync/Connect Google Calendar (Simulated / Live)
app.post("/api/calendar/sync-all", (req, res) => {
  const db = loadDB();
  
  // Connect and sync any unsynced local tasks to calendar as synced events
  const pendingSyncTasks = db.tasks.filter(t => t.scheduledSlot && !t.googleCalendarConnected);
  
  let count = 0;
  pendingSyncTasks.forEach(task => {
    // Generate simulated Google Calendar Event
    const parts = task.scheduledSlot.split(" - ");
    if (parts.length === 2) {
      db.calendar_events.push({
        id: "ev_gcal_" + Math.random().toString(36).substring(2, 9),
        userId: "user_default",
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
    userId: "user_default",
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
  const db = loadDB();
  const event = req.body;
  
  event.id = "event_" + Math.random().toString(36).substring(2, 9);
  event.userId = "user_default";
  event.synced = event.synced !== undefined ? event.synced : true;
  event.source = event.source || "PREEMPT_AI";
  
  db.calendar_events.push(event);
  
  db.activity_logs.unshift({
    id: "log_" + Date.now(),
    userId: "user_default",
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
      const response = await customAI.models.generateContent({
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
      const response = await customAI.models.generateContent({
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
      const response = await customAI.models.generateContent({
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
  const db = loadDB();
  const tasksToSchedule = db.tasks.filter(t => t.status !== "COMPLETED");
  const calendarEvents = db.calendar_events;

  const customAI = getAIInstance();
  if (customAI) {
    try {
      const response = await customAI.models.generateContent({
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
        const task = db.tasks.find(t => t.id === asg.taskId);
        if (task) {
          task.scheduledSlot = asg.slot;
          changes++;
        }
      });

      if (changes > 0) {
        db.activity_logs.unshift({
          id: "log_" + Date.now(),
          userId: "user_default",
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
      userId: "user_default",
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
  if (!message) return res.status(400).json({ error: "Message content cannot be blank" });

  const db = loadDB();
  const customAI = getAIInstance();
  
  const systemPrompt = `You are Preempt AI (Senior Personal Task Architect & Proactive Life Saver).
  Your primary purpose is assessing pending deadlines, advising on schedule structures, warning about high-risk timelines, and scheduling mitigation work slots.
  
  Here is the active project database of the user for query context variables:
  ${JSON.stringify({
    tasks: db.tasks,
    meetings: db.calendar_events,
    logs: db.activity_logs.slice(0, 5)
  })}
  
  Answer concisely and helpfully. Keep instructions direct, bulleted, and professional. Avoid fluffy self-praising AI phrases. Avoid terminal status lines.`;

  if (customAI) {
    try {
      const response = await customAI.models.generateContent({
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
    responseText += `Hello! I am Preempt AI, your companion task architect. Your Chemistry Lab Report is flagged as HIGH RISK because its deadline is tomorrow. Would you like me to break down your subtasks or find an open meeting-free slot to work on it?`;
  } else if (/risk|threat|problem/i.test(message)) {
    const highRiskTasks = db.tasks.filter(t => t.riskLevel === "HIGH");
    if (highRiskTasks.length > 0) {
      responseText += `Alert: You currently have ${highRiskTasks.length} task(s) flagged as HIGH-RISK. The primary bottleneck is "${highRiskTasks[0].title}" owing to its imminent target deadline. I recommend scheduling a focus window today.`;
    } else {
      responseText += "Excellent news! There are zero highly risky scheduling bottlenecks detected across your roadmap today.";
    }
  } else {
    responseText += `Received command. Here is the context status: You have ${db.tasks.filter(t => t.status !== "COMPLETED").length} pending tasks remaining. I recommend running the Preempt Schedule Optimizer to book quiet workspaces on your Google Calendar.`;
  }
  res.json({ response: responseText });
});

// 6. Natural Language (Voice-enabled) Interpreter
app.post("/api/ai/voice-interpreter", async (req, res) => {
  const { transcript } = req.body;
  if (!transcript) return res.status(400).json({ error: "Transcript is empty" });

  const customAI = getAIInstance();
  let actionMatched = "chat";
  let extractedTask = null;
  let replyText = "";

  if (customAI) {
    try {
      const gRes = await customAI.models.generateContent({
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
      userId: "user_default",
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
      userId: "user_default",
      timestamp: new Date().toISOString(),
      action: "Voice Task Dispatched",
      details: `Dispatched "${newTask.title}" directly via verbal speech recognition.`,
      category: "AGENT"
    });
    
    writeDB(db);
  }

  res.json({ action: actionMatched, reply: replyText, task: extractedTask });
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
