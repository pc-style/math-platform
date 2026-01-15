#!/bin/bash
mkdir -p .gemini/tmp/codex_logs

echo "🚀 Launching MASSIVE Codex Swarm..."

# Agent 1: Ultimate Gamification
echo "Starting Agent 1: Serotogenic UI..."
codex --yolo exec "You are a World-Class UX Designer. 
Your Goal: Make the '/learn' experience feel like a game.
1. Add a 'Streak' fire animation to the dashboard.
2. Implement a 'Daily Quest' system in 'components/learn/DailyQuests.tsx'.
3. Add sound effects (using 'use-sound' or Audio API) for: Correct Answer, Wrong Answer, Level Up.
4. Polish 'ValidationFeedback.tsx' to be extremely satisfying (bouncy animations, particles).
" > .gemini/tmp/codex_logs/agent_gamification.log 2>&1 &

# Agent 2: Math Content Expansion
echo "Starting Agent 2: Math Content..."
codex --yolo exec "You are a Mathematics Professor.
1. Create 'scripts/gen-math.ts'.
2. Generate comprehensive courses for: 'Linear Algebra', 'Calculus I', 'Probability'.
3. Use 'react-markdown' and 'katex' heavily.
4. Each course must have 10 interactive modules.
" > .gemini/tmp/codex_logs/agent_math.log 2>&1 &

# Agent 3: CS Content Expansion
echo "Starting Agent 3: CS Content..."
codex --yolo exec "You are a Senior Staff Engineer.
1. Create 'scripts/gen-cs.ts'.
2. Generate courses for: 'System Design', 'Distributed Systems', 'Rust Programming'.
3. Include ASCII architecture diagrams in the description.
4. Create challenges that ask users to design schemas or fix race conditions.
" > .gemini/tmp/codex_logs/agent_cs.log 2>&1 &

# Agent 4: Interactive Visualizers
echo "Starting Agent 4: Interactive Visualizers..."
codex --yolo exec "You are a Creative Technologist.
1. Create 'components/visualizers/'.
2. Build 'GraphTraverser.tsx' (interactive BFS/DFS).
3. Build 'MatrixTransform.tsx' (interactive linear algebra visualizer).
4. Integrate these into the 'MathContent' component so they can be rendered via MDX/slug matching.
" > .gemini/tmp/codex_logs/agent_visualizers.log 2>&1 &

echo "✅ Swarm Deployed. Agents are working in parallel."
wait
