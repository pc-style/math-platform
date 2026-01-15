# Math Platform AI - Project Context

## Project Overview

**Math Platform AI** is a Next.js-based application designed to create personalized math learning paths and exams. It leverages **Google Gemini** for AI content generation, **Convex** for a real-time backend and database, and **WorkOS** for user authentication.

The application focuses on a premium, "cybernetic-dark" aesthetic and aims to provide an interactive learning experience with theory, guided practice, and exams.

## Tech Stack

- **Frontend Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS, Framer Motion (animations), KaTeX (math rendering)
- **Backend:** Convex (Real-time database & serverless functions)
- **Authentication:** WorkOS (AuthKit)
- **AI:** Google Gemini SDK (`@google/genai`)
- **Testing:** Vitest, React Testing Library
- **Package Manager:** Bun (Preferred)

## Key Directories & Files

- `app/`: Next.js App Router pages and API routes.
- `convex/`: Convex backend code.
  - `schema.ts`: Database schema definition (Users, Exams, SolverMessages).
  - `auth.ts`: WorkOS authentication integration.
- `components/`: React components (UI elements, Math rendering, etc.).
- `hooks/`: Custom React hooks.
- `scripts/`: Utility scripts (e.g., `make-premium.ts`).
- `public/`: Static assets.

## Database Schema (Convex)

The database, defined in `convex/schema.ts`, primarily consists of:

- **`users`**: Stores user profiles, preferences (theme, primary color), usage stats (XP, streak), and solver settings (system prompt, knowledge base).
- **`exams`**: Stores generated learning paths, including:
  - `phase1_theory`: formatted theory content.
  - `phase2_guided`: interactive problems with hints and solutions.
  - `phase3_exam`: test questions.
  - `flashcards`: study aids.
- **`solverMessages`**: specific table for syncing chat history for the "Solver" feature.

## Development Workflow

### Commands

- **Start Development Server:**

  ```bash
  npm run dev
  # Runs both Convex dev server and Next.js dev server
  ```

- **Build for Production:**

  ```bash
  npm run build
  # Generates Convex client code and builds Next.js app
  ```

- **Run Tests:**

  ```bash
  npm test
  ```

- **Linting & Formatting:**

  ```bash
  npm run lint
  npm run format
  ```

### Workflow Rules

1. **Package Manager:** Use `bun` for installing packages and running scripts where possible.
2. **Authentication:** Uses WorkOS. Ensure environment variables for WorkOS are set up in `.env.local` (or `.env`).
3. **Database:** Changes to `convex/schema.ts` require running the Convex dev server to update the schema.
4. **Styling:** Use Tailwind CSS for styling. Custom animations use Framer Motion.
5. **Math Rendering:** content is rendered using `react-markdown` with `rehype-katex` and `remark-math`.

## Current Tasks

1. [x] **Learning Engine Feature (feat/learning-engine)**
   - [x] Monaco-based Code Editor component
   - [x] Sandboxed iframe preview system
   - [x] DOM-based validation engine
   - [x] Interactive Challenge UI (Brilliant-style)
   - [x] Confetti & XP rewards system
   - [x] Learning dashboard & progress tracking
2. **Recent Changes**
   - Solver Migration: Recently consolidated "Solver" settings and chat history from `localStorage` to the specific `users` and `solverMessages` tables in Convex.
