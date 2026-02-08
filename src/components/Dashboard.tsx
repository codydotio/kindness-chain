"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { AlienUser, UserStats, FeedItem, ChainData } from "@/lib/types";
import KindnessGraph from "./KindnessGraph";
import GiftModal from "./GiftModal";
import Feed from "./Feed";
import AIInsightPanel from "./AIInsightPanel";

interface Props {
  user: AlienUser;
  stats: UserStats;
  feed: FeedItem[];
  chainData: ChainData | null;
  onGift: (toUserId: string, amount: number, note: string) => Promise<void>;
  onRefreshStats: () => void;
}

type Tab = "chain" | "feed";

export default function Dashboard({
  user,
  stats,
  feed,
  chainData,
  onGift,
  onRefreshStats,
}: Props) {
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("chain");

  const handleGift = async (
    toUserId: string,
    amount: number,
    note: string
  ) => {
    await onGift(toUserId, amount, note);
    onRefreshStats();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#1a1035] to-[#0a0a1a] text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0a0a1a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🔗</div>
              <div>
                <h1 className="text-base font-bold tracking-tight">
                  Kindness Chain
                </h1>
                <div className="text-[10px] text-white/40 uppercase tracking-wider">
                  Verified Human Network
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/40">Balance</div>
              <div className="text-lg font-bold text-kindness-glow">
                {stats.balance}
                <span className="text-xs text-white/30 ml-1">tokens</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="max-w-md mx-auto px-4 py-4">
        <div className="grid grid-cols-3 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center px-3 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]"
          >
            <div className="text-2xl font-bold text-kindness-cosmic">
              {stats.giftsGiven}
            </div>
            <div className="text-[10px] text-white/40 uppercase tracking-wider mt-1">
              Given
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center px-3 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]"
          >
            <div className="text-2xl font-bold text-kindness-heart">
              {stats.giftsReceived}
            </div>
            <div className="text-[10px] text-white/40 uppercase tracking-wider mt-1">
              Received
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center px-3 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]"
          >
            <div className="text-2xl font-bold text-kindness-aurora">
              {stats.chainLength}
            </div>
            <div className="text-[10px] text-white/40 uppercase tracking-wider mt-1">
              Chain
            </div>
          </motion.div>
        </div>

        {/* Welcome message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-4 px-4 py-3 rounded-2xl bg-kindness-glow/5 border border-kindness-glow/10 text-center"
        >
          <span className="text-kindness-glow/70 text-sm">
            Welcome, <strong className="text-kindness-glow">{user.displayName}</strong>.
            You have{" "}
            <strong className="text-kindness-glow">{stats.balance} tokens</strong>{" "}
            to share.
          </span>
        </motion.div>
      </div>

      {/* AI Insight Panel */}
      <AIInsightPanel />

      {/* Tab Navigation */}
      <div className="max-w-md mx-auto px-4 mb-2">
        <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1">
          <button
            onClick={() => setActiveTab("chain")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "chain"
                ? "bg-white/10 text-white shadow-sm"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            🌌 Chain
          </button>
          <button
            onClick={() => setActiveTab("feed")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "feed"
                ? "bg-white/10 text-white shadow-sm"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            💬 Feed
            {feed.length > 0 && (
              <span className="ml-1.5 text-[10px] bg-kindness-heart/20 text-kindness-heart px-1.5 py-0.5 rounded-full">
                {feed.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 pb-28">
        {activeTab === "chain" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl overflow-hidden border border-white/[0.06]"
            style={{ height: "45vh", minHeight: "300px" }}
          >
            <KindnessGraph data={chainData} currentUserId={user.id} />
          </motion.div>
        )}

        {activeTab === "feed" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Feed items={feed} />
          </motion.div>
        )}
      </div>

      {/* Floating Action Button — Share Kindness */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center z-30">
        <motion.button
          onClick={() => setIsGiftModalOpen(true)}
          disabled={stats.balance <= 0}
          className="px-8 py-4 rounded-full bg-gradient-to-r from-kindness-glow via-kindness-warm to-kindness-heart text-black font-bold text-base shadow-2xl shadow-kindness-glow/30 disabled:opacity-40 disabled:cursor-not-allowed"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, type: "spring", damping: 20 }}
        >
          {stats.balance > 0 ? "💛 Share Kindness" : "All tokens shared!"}
        </motion.button>
      </div>

      {/* Gift Modal */}
      <GiftModal
        isOpen={isGiftModalOpen}
        onClose={() => setIsGiftModalOpen(false)}
        onGift={handleGift}
        currentUserId={user.id}
        balance={stats.balance}
      />
    </div>
  );
}
