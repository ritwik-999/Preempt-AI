<div align="center">
<img width="1920" height="720" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# 🚀 Preempt AI

### The Last-Minute Life Saver

Preempt AI is an AI-powered productivity companion that helps users **plan, prioritize, and complete tasks before deadlines are missed**.

Unlike traditional task managers that simply store tasks and send reminders, Preempt AI actively analyzes workloads, predicts risks, optimizes schedules, and provides intelligent nudges that help users take action.

---

## 🌟 Problem

Students, professionals, freelancers, and entrepreneurs often struggle with:

* Procrastination
* Missed deadlines
* Overwhelming task lists
* Poor prioritization
* Notification fatigue

Most productivity tools are passive. They remind users about tasks but do not help them actually complete them.

---

## 💡 Solution

Preempt AI acts as an **Autonomous Chief of Staff**.

It continuously monitors tasks, deadlines, calendar events, and productivity patterns to help users stay ahead of their commitments.

Instead of asking:

> "What should I do next?"

Preempt AI tells you:

> "Here's the highest-impact task, the best time to do it, and the fastest way to get started."

---

## ✨ Key Features

### 🧠 AI Task Breakdown

Transform large goals into actionable subtasks.

Example:

"Finish Marketing Report"

↓

* Research competitors
* Draft outline
* Write executive summary
* Create presentation slides

---

### 📊 Deadline Risk Prediction

Predicts tasks likely to miss deadlines before they become urgent.

* Risk scoring
* Completion probability
* Priority recommendations

---

### 📅 Smart Scheduling

Automatically identifies available calendar slots and schedules work sessions.

* Calendar integration
* Dynamic rescheduling
* Deep work time blocks

---

### 🎯 Intelligent Prioritization

Combines:

* Task urgency
* Task importance
* Estimated effort
* User productivity patterns

to recommend what should be done next.

---

### 🔔 Context-Aware Nudges

Instead of generic notifications:

❌ "Task due tomorrow"

Preempt AI says:

✅ "You have 30 free minutes right now. Completing Section 1 will reduce deadline risk by 45%."

---

### 📈 Productivity Analytics

Track:

* Focus hours
* Task completion rates
* Weekly productivity trends
* Deep work sessions

---

## 🏗️ Architecture

```text
┌───────────────┐
│    Frontend   │
│ Next.js + TS  │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│   FastAPI     │
│   Backend     │
└───────┬───────┘
        │
 ┌──────┼──────┐
 ▼      ▼      ▼

Gemini  PostgreSQL  Calendar APIs
 AI       DB      Google/Outlook
```

## 🛠 Tech Stack

### Frontend

* Next.js
* TypeScript
* TailwindCSS
* Shadcn UI

### Backend

* FastAPI
* Python

### Database

* PostgreSQL

### AI Layer

* Google Gemini API

### Integrations

* Google Calendar
* Firebase Notifications

---

## 🚀 Getting Started

### Prerequisites

* Node.js 18+
* Python 3.10+
* Gemini API Key

### Installation

```bash
npm install
```

Create `.env.local`

```env
GEMINI_API_KEY=your_api_key_here
DATABASE_URL=your_database_url
```

Run the application:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 🎥 Demo Flow

1. User creates a task
2. AI analyzes complexity
3. Task is broken into subtasks
4. Risk score is calculated
5. Schedule is optimized
6. User receives contextual nudges
7. Task gets completed before deadline

---

## 🎯 Hackathon Vision

Preempt AI is more than a task manager.

It is an AI-powered execution engine that bridges the gap between planning and doing, helping users eliminate procrastination and consistently achieve their goals.

---

## 👥 Team

Built for innovation, productivity, and the future of AI-assisted work.

### "Don't just manage tasks. Finish them."
