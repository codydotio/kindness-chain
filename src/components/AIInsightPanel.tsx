"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AIAgentState } from "@/lib/types";

export default function AIInsightPanel() {
  const [agentState, setAgentState] = useState<AIAgentState | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const res = await fetch("/api/ai/insights");
        if (res.ok) setAgentState(await res.json());
      } catch {}
    };
    fetchInsights();
    const interval = setInterval(fetchInsights, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!agentState || agentState.insights.length === 0) return null;

  const scoreColor = agentState.communityScore > 60 ? "text-emerald-400" : agentState.communityScore > 30 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="max-w-md mx-auto px-4 mb-2">
      <motion.div layout className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 overflow-hidden">
        <button onClick={() => setExpanded(!expanded)} className="w-full px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center"><span className="text-xs">🤖</span></div>
            <span className="text-sm font-medium text-purple-300">AI Scout</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-medium">AI</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className={`text-sm font-bold ${scoreColor}`}>{agentState.communityScore}</div>
              <div className="text-[8px] text-white/30">MOMENTUM</div>
            </div>
            <motion.span animate={{ rotate: expanded ? 180 : 0 }} className="text-white/30 text-xs">▼</motion.span>
          </div>
        </button>
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-4 pb-3">
              <div className="space-y-2">
                {agentState.insights.map((insight) => (
                  <div key={insight.id} className="flex items-start gap-2 p-2 rounded-xl bg-white/[0.03]">
                    <span className="text-sm mt-0.5">
                      {insight.type === "almost_ignited" ? "🔥" : insight.type === "trending" ? "📈" : "✨"}
                    </span>
                    <div className="flex-1">
                      <p className="text-xs text-white/70 leading-relaxed">{insight.message}</p>
                      <span className="text-[9px] text-purple-400/60">{Math.round(insight.confidence * 100)}% confidence</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-white/5">
                <span className="text-[9px] text-white/20">AI-powered insights · Transparent · Community-first</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
