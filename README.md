## Preempt AI

Preempt AI is a full-stack productivity and scheduling assistant built with React, Vite, Express, and Gemini. It helps users capture tasks, break them into milestones, estimate priority and risk, schedule protected work blocks, and review productivity analytics from a local project dashboard.

## Features

- Email-based local login with per-user task separation.
- Task roadmap dashboard with deadlines, priority badges, risk levels, subtasks, and activity logs.
- AI-assisted task creation for priority scoring, impact/effort scoring, and milestone breakdowns.
- Schedule optimizer that assigns pending work into calendar-style time blocks.
- Simulated Google Calendar sync for optimized task slots.
- Chat copilot backed by current task, calendar, and activity context.
- Floating voice console using browser speech recognition and speech synthesis when available.
- Analytics view for completion rate, priority distribution, risk distribution, and impact vs effort quadrants.
- Local JSON persistence through `db.json`, created automatically at runtime.

## Tech Stack

- React 19
- TypeScript
- Vite 6
- Express
- Tailwind CSS 4
- Motion
- Lucide React
- Google Gemini via `@google/genai`

## Project Structure

```text
.
|-- server.ts                    # Express API, Vite middleware, local JSON database, Gemini calls
|-- src/
|   |-- App.tsx                  # App shell, auth state, tab routing, API orchestration
|   |-- main.tsx                 # React entry point
|   |-- index.css                # Global styles and Tailwind setup
|   |-- types.ts                 # Shared frontend data types
|   `-- components/
|       |-- DashboardView.tsx    # Main task roadmap and calendar status
|       |-- TaskCreateView.tsx   # Manual and AI-assisted task creation
|       |-- ChatView.tsx         # Contextual AI assistant
|       |-- AnalyticsView.tsx    # Productivity and risk analytics
|       |-- CalendarPlanner.tsx  # Calendar-style task/event planner
|       |-- VoiceConsole.tsx     # Voice command drawer
|       |-- LoginView.tsx        # Local email login
|       |-- Navbar.tsx           # Top navigation
|       |-- LoadingScreen.tsx    # Startup animation
|       `-- CustomCursor.tsx     # Custom cursor effect
|-- .env.example                 # Environment variable template
|-- vite.config.ts               # Vite, React, Tailwind configuration
`-- package.json                 # Scripts and dependencies
```

## Live Demo
Try Preempt AI

🔗 Deployed Application:
https://preempt-ai-293715441413.asia-southeast1.run.app

## Prerequisites

- Node.js 20 or newer is recommended.
- A Gemini API key is optional but recommended. Without `GEMINI_API_KEY`, the server falls back to deterministic simulation logic for AI features.

## Environment Variables

Create a `.env.local` file in the project root:

```env
GEMINI_API_KEY="your_gemini_api_key"
APP_URL="http://localhost:3000"
```

`GEMINI_API_KEY` enables live Gemini responses for task breakdowns, prioritization, risk prediction, schedule optimization, chat, and voice interpretation.

`APP_URL` is used for hosted/self-referential URLs and can stay as `http://localhost:3000` during local development.

## Run Locally

Install dependencies:

```bash
npm install
```

Start the full-stack development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

The development command runs `server.ts` with `tsx`. In development, Express mounts Vite middleware so the API and frontend are served from the same port.

## Available Scripts

```bash
npm run dev
```

Runs the Express + Vite development server on port `3000`.

```bash
npm run build
```

Builds the Vite frontend and bundles the Express server to `dist/server.cjs`.

```bash
npm start
```

Runs the production build from `dist/server.cjs`.

```bash
npm run lint
```

Runs TypeScript type checking with `tsc --noEmit`.

```bash
npm run clean
```

Removes generated build output. This command uses Unix-style `rm -rf`, so on Windows use Git Bash, WSL, or remove `dist` manually if needed.

## Data Storage

The app stores local data in `db.json` at the project root. The file is created automatically the first time the server reads or writes data.

Stored data includes:

- users
- tasks
- subtasks
- calendar events
- activity logs

This is suitable for local demos and prototypes. For production use, replace the JSON file store in `server.ts` with a real database and authentication provider.

## Calendar Behavior

The current Google Calendar flow is simulated. Running the optimizer assigns scheduled slots to tasks, and "Commit Feed" creates synced calendar event records in `db.json`. No external Google Calendar OAuth flow is currently required.

## Notes

- Login is local and email-based. The email is saved in browser `localStorage` as `preempt_user_email`.
- Voice commands depend on browser support for `SpeechRecognition` or `webkitSpeechRecognition`. If unavailable, the app prompts for typed command text.
- The server listens on port `3000` and binds to `0.0.0.0`.
- AI routes are resilient: if Gemini is unavailable or no API key is configured, the app returns fallback generated responses.
