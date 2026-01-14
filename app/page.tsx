"use client";

import { motion } from "framer-motion";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center"
      >
        <h1 className="text-6xl font-bold mb-4">
          <span className="text-[#ff00ff]">&lt;</span>
          HELLO_WORLD
          <span className="text-[#ff00ff]"> /&gt;</span>
        </h1>
        <p className="text-xl text-gray-400 font-mono mb-8">
          Next.js + Tailwind v4 + Convex + Framer Motion
        </p>

        <div className="flex gap-4 justify-center">
          <button className="px-6 py-3 border border-[#ff00ff] text-[#ff00ff] hover:bg-[#ff00ff] hover:text-black transition-all duration-300 font-mono uppercase tracking-wider">
            Initiate System
          </button>
        </div>
      </motion.div>
    </main>
  );
}
