# Project Guidelines

## Visual Style: Cybernetic Minimalism
- **Primary Color:** Neon Pink (`#ff00ff`)
- **Background:** Black (`#000000`)
- **Typography:** Monospaced (e.g., JetBrains Mono) for a raw, terminal-like aesthetic.
- **Effects:**
  - Glassmorphism (blur, translucency).
  - CRT scanlines (optional but recommended for retro feel).
  - Matrix rain or digital noise backgrounds (use `MatrixBackground` component).
- **Interactions:** snappy, "glitch" effects on hover, high contrast.

## Tech Stack
- **Framework:** Next.js (App Router).
- **Styling:** Tailwind CSS v4.
- **Animation:** Framer Motion (for complex animations) or CSS keyframes.
- **Database:** Convex (if persistence is needed).
- **Icons:** Lucide React.
- **Package Manager:** Bun.

## AI Instructions
1.  **Documentation:** ALWAYS use the **Context 7 MCP** (`context7`) to fetch library documentation when coding. Do not guess API signatures.
2.  **Database:** Use **Convex** for all backend requirements. It provides real-time updates and simple function-based API.
3.  **Performance:**
    -   Use `usePerformanceMode` hook to detect low-end devices/reduced motion preferences.
    -   Disable heavy canvas effects or animations when `isLowPerformance` is true.
4.  **Tailwind v4:** Use the latest Tailwind features (CSS variables, `@theme`).

## Components
- **`MatrixBackground`**: Use this for the main background. It handles performance scaling automatically.
- **`NeuralCursor`**: Use for custom cursor effects (desktop only).
