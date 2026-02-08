"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Spark, FeedItem, ChainData, UserStats } from "@/lib/types";
import SparkCard from "./SparkCard";
import Feed from "./Feed";
import IgniteGraph from "./KindnessGraph";
import AIInsightPanel from "./AIInsightPanel";

interface Props {
  sparks: Spark[];
  feedItems: FeedItem[];
  chainData: ChainData | null;
  stats: UserStats;
  currentUserId: string;
  onCreateSpark: () => void;
  onBack: (sparkId: string, amount: number, note?: string) => Promise<void>;
}

type Tab = "sparks" | "feed" | "graph";

export default function Dashboard({ sparks, feedItems, chainData, stats, currentUserId, onCreateSpark, onBack }: Props) {
  const [tab, setTab] = useState<Tab>("sparks");
  const [filter, setFilter] = useState<"all" | "active" | "ignited">("all");

  const filteredSparks = filter === "all" ? sparks : sparks.filter((s) => s.status === filter);

  return (
    <div className="min-h-screen bg-[#0a0a1a]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0a0a1a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔥</span>
            <h1 className="text-lg font-bold gradient-text">Ignite</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-bold text-ignite-gold">{stats.balance}</div>
              <div className="text-[9px] text-white/30">TOKENS</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-ignite-teal">{stats.sparksBacked}</div>
              <div className="text-[9px] text-white/30">BACKED</div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="pt-3">
        <AIInsightPanel />
      </div>

      {/* Tabs */}
      <div className="max-w-md mx-auto px-4 py-3">
        <div className="flex gap-1 p-1 rounded-xl bg-white/5">
          {(["sparks", "feed", "graph"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                tab === t ? "bg-ignite-flame/20 text-ignite-flame" : "text-white/40"
              }`}
            >
              {t === "sparks" ? "🔥 Sparks" : t === "feed" ? "📡 Feed" : "🌐 Graph"}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 pb-24">
        {tab === "sparks" && (
          <>
            {/* Filter chips */}
            <div className="flex gap-2 mb-4">
              {(["all", "active", "ignited"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-[11px] px-3 py-1 rounded-full ${
                    filter === f ? "bg-white/10 text-white font-medium" : "text-white/30"
                  }`}
                >
                  {f === "all" ? "All" : f === "active" ? "Active" : "🔥 Ignited"}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {filteredSparks.map((spark) => (
                <SparkCard key={spark.id} spark={spark} currentUserId={currentUserId} onBack={onBack} />
              ))}
            </div>

            {filteredSparks.length === 0 && (
              <div className="text-center py-12 text-white/30">
                <div className="text-3xl mb-2">✨</div>
                <div className="text-sm">No sparks here yet.</div>
              </div>
            )}
          </>
        )}

        {tab === "feed" && <Feed items={feedItems} />}

        {tab === "graph" && (
          <div className="h-[400px] rounded-2xl overflow-hidden border border-white/5">
            <IgniteGraph data={chainData} currentUserId={currentUserId} />
          </div>
        )}
      </div>

      {/* FAB — Create Spark */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center z-30">
        <motion.button
          onClick={onCreateSpark}
          className="px-6 py-3 rounded-full bg-gradient-to-r from-ignite-flame to-ignite-ember text-white font-bold text-sm shadow-lg shadow-ignite-flame/30"
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.03 }}
        >
          + Create Spark
        </motion.button>
      </div>
    </div>
  );
}
