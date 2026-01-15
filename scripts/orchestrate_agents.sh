#!/bin/bash

# Ensure log directory exists
mkdir -p .gemini/tmp/codex_logs

echo "🚀 Launching Codex Swarm..."

# Agent 1: Gamification & UX
echo "Starting Agent 1: Gamification Upgrade..."
codex --yolo exec "You are a UX expert. Make the learning experience 'serotogenic'. 
1. Modify 'components/learn/ValidationFeedback.tsx' to use 'canvas-confetti' on success. 
2. Add a 'SoundManager' hook for success/failure sounds.
3. Make the progress bars in 'components/learn/ProgressTracker.tsx' glow and animate smoothly.
4. Update 'app/learn/[slug]/page.tsx' to trigger these effects." > .gemini/tmp/codex_logs/gamification.log 2>&1 &

# Agent 2: Python Content
echo "Starting Agent 2: Python Course Generator..."
codex --yolo exec "You are a Python curriculum expert. 
1. Read 'scripts/generate-brilliant-courses.ts' to understand the pattern.
2. Create 'scripts/gen-python.ts' to generate a 'Python Mastery' course.
3. Include 5 modules: Basics, Data Structures, OOP, Functional Programming, Async.
4. Ensure it uses the 'GoogleGenAI' class correctly as seen in the existing script." > .gemini/tmp/codex_logs/python_content.log 2>&1 &

# Agent 3: Algorithms Content
echo "Starting Agent 3: Algorithms Course Generator..."
codex --yolo exec "You are a CS Professor.
1. Read 'scripts/generate-brilliant-courses.ts'.
2. Create 'scripts/gen-algo.ts' for 'Algorithms & Data Structures'.
3. Topics: Big O (Time/Space), Sorting (Bubble/Merge/Quick), Trees (BST), Graphs (BFS/DFS).
4. Use extensive KaTeX math in the theory sections." > .gemini/tmp/codex_logs/algo_content.log 2>&1 &

# Agent 4: Interactive Visualizers
echo "Starting Agent 4: Interactive Visualizers..."
codex --yolo exec "You are a React Graphics expert.
1. Create a folder 'components/learn/interactive'.
2. Build a 'SortingVisualizer.tsx' that visualizes bubble sort step-by-step.
3. Build a 'BoxModelPlayground.tsx' that lets users drag sliders to change padding/margin.
4. Modify 'app/learn/[slug]/page.tsx' to conditionally render these components if the challenge slug matches (e.g. 'sorting-visualizer')." > .gemini/tmp/codex_logs/visualizers.log 2>&1 &

echo "✅ Swarm Deployed. Monitoring logs..."
wait
