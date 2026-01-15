"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { Brain, Star, ChevronRight } from "lucide-react";
import Link from "next/link";
import { ProgressTracker } from "@/components/learn/ProgressTracker";

export default function LearnDashboard() {
  const challenges = useQuery(api.challenges.list);
  const user = useQuery(api.users.getUserDetails); // Assuming there's a current user query

  // Mock data if user is not found for demo
  const userXP = user?.xp || 1250;
  const userLevel = Math.floor(userXP / 1000) + 1;
  const userStreak = user?.streak || 5;

  const categories = ["CSS Basics", "Flexbox", "Grid", "JavaScript DOM"];

  return (
    <main className="min-h-screen bg-background p-8 max-w-6xl mx-auto space-y-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
            <Brain className="w-10 h-10 text-primary" /> Learning Engine
          </h1>
          <p className="text-muted-foreground max-w-md">
            Master the web through interactive, tactile coding exercises.
          </p>
        </div>
        <div className="w-80">
          <ProgressTracker xp={userXP} level={userLevel} streak={userStreak} />
        </div>
      </header>

      {/* Category Grid */}
      <div className="space-y-12">
        {categories.map((category) => (
          <section key={category} className="space-y-6">
            <h2 className="text-xl font-bold tracking-tight text-foreground/80 flex items-center gap-2">
              <Star className="w-5 h-5 text-primary fill-primary/20" /> {category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {challenges
                ?.filter((c) => c.category === category)
                .map((challenge) => (
                  <Link key={challenge._id} href={`/learn/${challenge.slug}`} className="group">
                    <motion.div
                      whileHover={{ y: -4 }}
                      className="p-6 glass border border-white/10 rounded-2xl hover:border-primary/50 transition-all flex flex-col h-full"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                          LEVEL {challenge.difficulty}
                        </span>
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-1 h-1 rounded-full ${
                                i < challenge.difficulty ? "bg-primary" : "bg-white/10"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">
                        {challenge.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-6">
                        {challenge.description}
                      </p>
                      <div className="mt-auto flex items-center justify-between text-xs font-mono">
                        <span className="text-muted-foreground">{challenge.xpReward} XP</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors group-hover:translate-x-1" />
                      </div>
                    </motion.div>
                  </Link>
                )) || (
                // Empty state for category
                <div className="col-span-full p-12 border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-muted-foreground">
                  <p className="text-sm">No challenges yet for this category.</p>
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
