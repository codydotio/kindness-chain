"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Spark } from "@/lib/types";
import { CATEGORY_EMOJI, IGNITE_THRESHOLD } from "@/lib/types";

interface Props {
  spark: Spark;
  currentUserId?: string;
  onBack: (sparkId: string, amount: number, note?: string) => Promise<void>;
}

export default function SparkCard({ spark, currentUserId, onBack }: Props) {
  const [backing, setBacking] = useState(false);
  const [showBack, setShowBack] = useState(false);
  const [amount, setAmount] = useState(2);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const pct = Math.min(100, Math.round((spark.raised / spark.goal) * 100));
  const backersNeeded = Math.max(0, IGNITE_THRESHOLD - spark.backerIds.length);
  const isCreator = currentUserId === spark.creatorId;
  const alreadyBacked = currentUserId ? spark.backerIds.includes(currentUserId) : false;
  const isIgnited = spark.status === "ignited";

  const handleBack = async () => {
    setBacking(true);
    setError(null);
    try {
      await onBack(spark.id, amount, note || undefined);
      setSuccess(true);
      setShowBack(false);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBacking(false);
    }
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border overflow-hidden ${isIgnited ? "bg-gradient-to-br from-ignite-flame/10 to-ignite-gold/10 border-ignite-flame/30" : "bg-white/[0.03] border-white/[0.06]"}`}
    >
      <div className="px-4 py-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{CATEGORY_EMOJI[spark.category]}</span>
              <h3 className="text-base font-bold text-white truncate">{spark.title}</h3>
            </div>
            <p className="text-xs text-white/40">by {spark.creatorName}</p>
          </div>
          {isIgnited && <span className="text-xs px-2 py-1 rounded-full bg-ignite-flame/20 text-ignite-flame font-bold flex-shrink-0">🔥 IGNITED</span>}
        </div>

        <p className="text-sm text-white/60 leading-relaxed mb-3 line-clamp-2">{spark.description}</p>

        <div className="mb-2">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-ignite-gold font-bold">{spark.raised} / {spark.goal} tokens</span>
            <span className="text-white/40">{pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div className={`h-full rounded-full progress-bar-fill ${isIgnited ? "bg-gradient-to-r from-ignite-flame to-ignite-gold" : "bg-gradient-to-r from-ignite-cosmic to-ignite-teal"}`} style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-white/40">
            <span>👥 {spark.backerIds.length} backers</span>
            {!isIgnited && <span className="text-ignite-flame/70">{backersNeeded} more to ignite</span>}
          </div>
          {!isIgnited && !isCreator && !showBack && (
            <motion.button onClick={() => setShowBack(true)}
              className={`text-xs px-4 py-1.5 rounded-full font-bold ${alreadyBacked ? "bg-ignite-teal/20 text-ignite-teal" : "bg-gradient-to-r from-ignite-flame to-ignite-ember text-white"}`}
              whileTap={{ scale: 0.95 }}>
              {alreadyBacked ? "Back Again" : "Back This"}
            </motion.button>
          )}
          {success && <span className="text-xs text-ignite-teal font-bold">Backed!</span>}
        </div>

        {showBack && !isIgnited && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mt-3 pt-3 border-t border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-white/40">Amount:</span>
              {[1, 2, 3, 5].map((a) => (
                <button key={a} onClick={() => setAmount(a)} className={`text-xs px-3 py-1 rounded-full ${amount === a ? "bg-ignite-gold/20 text-ignite-gold font-bold" : "bg-white/5 text-white/40"}`}>{a}</button>
              ))}
            </div>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why do you believe in this? (optional)" className="w-full text-xs px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 mb-2 outline-none focus:border-ignite-gold/30" />
            {error && <div className="text-xs text-red-400 mb-2">{error}</div>}
            <div className="flex gap-2">
              <motion.button onClick={handleBack} disabled={backing} className="flex-1 text-xs py-2 rounded-xl bg-gradient-to-r from-ignite-flame to-ignite-ember text-white font-bold disabled:opacity-50" whileTap={{ scale: 0.97 }}>
                {backing ? "Backing..." : `Back with ${amount} tokens`}
              </motion.button>
              <button onClick={() => { setShowBack(false); setError(null); }} className="text-xs px-3 py-2 rounded-xl bg-white/5 text-white/40">Cancel</button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
