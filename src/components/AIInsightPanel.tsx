"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AIAgentState } from "@/lib/types";

interface Props {
  onSuggestGift?: (recipientId: string) => void;
}

export default function AIInsightPanel({ onSuggestGift }: Props) {
  const [agentState, setAgentState] = useState<AIAgentState | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const res = await fetch("/api/ai/insights");
        if (res.ok) {
          const data = await res.json();
          setAgentState(data);
        }
      } catch { /* silent */ }
    };
    fetchInsights();
    const interval = setInterval(fetchInsights, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!agentState) return null;

  const visibleInsights = agentState.insights.filter(i => !dismissed.has(i.id));
  if (visibleInsights.length === 0 && !expanded) return null;

  const scoreColor = agentState.communityKindnessScore > 70
    ? "text-emerald-400"
    : agentState.communityKindnessScore > 40
    ? "text-yellow-400"
    : "text-red-400";

  return (
    <div className="max-w-md mx-auto px-4 mb-4">
      <motion.div
        layout
        className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 overflow-hidden"
      >
        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-4 py-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
              <span className="text-xs">🤖</span>
            </div>
            <span className="text-sm font-medium text-purple-300">AI Kindness Agent</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-medium">
              AI-GENERATED
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className={`text-sm font-bold ${scoreColor}`}>
                {agentState.communityKindnessScore}
              </div>
              <div className="text-[8px] text-white/30">KINDNESS</div>
            </div>
            <motion.span
              animate={{ rotate: expanded ? 180 : 0 }}
              className="text-white/30 text-xs"
            >
              ▼
            </motion.span>
          </div>
        </button>

        {/* Insights */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pb-3"
            >
              <div className="space-y-2">
                {visibleInsights.map((insight) => (
                  <motion.div
                    key={insight.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-start gap-2 p-2 rounded-xl bg-white/[0.03]"
                  >
                    <span className="text-sm mt-0.5">
                      {insight.type === "match" ? "💡" : insight.type === "trend" ? "📊" : "✨"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/70 leading-relaxed">{insight.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-purple-400/60">
                          {Math.round(insight.confidence * 100)}% confidence
                        </span>
                        {insight.type === "match" && insight.suggestedRecipient && onSuggestGift && (
                          <button
                            onClick={() => onSuggestGift(insight.suggestedRecipient!)}
                            className="text-[9px] px-2 py-0.5 rounded-full bg-kindness-glow/20 text-kindness-glow font-medium"
                          >
                            Send Kindness →
                          </button>
                        )}
                        <button
                          onClick={() => setDismissed(prev => new Set(prev).add(insight.id))}
                          className="text-[9px] text-white/20 hover:text-white/40"
                        >
                          dismiss
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                <span className="text-[9px] text-white/20">
                  Powered by AI · All suggestions are transparent
                </span>
                <span className="text-[9px] text-purple-400/40">
                  {agentState.trendDirection === "rising" ? "↗" : agentState.trendDirection === "falling" ? "↘" : "→"} {agentState.trendDirection}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
