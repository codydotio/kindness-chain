"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { FeedItem } from "@/lib/types";

interface Props {
  items: FeedItem[];
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function avatarHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash % 360);
}

export default function Feed({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-white/30">
        <div className="text-3xl mb-2">🔥</div>
        <div className="text-sm">No activity yet. Create the first spark!</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.03, duration: 0.3 }}
            className="px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                style={{ background: `hsl(${avatarHue(item.actorName)}, 60%, 45%)` }}
              >
                {item.actorName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-white/80 text-sm font-medium">{item.actorName}</span>
                <span className="text-white/40 text-sm">
                  {item.type === "spark_created" && " created a spark"}
                  {item.type === "backing" && ` backed with ${item.amount} tokens`}
                  {item.type === "spark_ignited" && ""}
                </span>
              </div>
              <span className="text-white/20 text-[10px] flex-shrink-0">{timeAgo(item.createdAt)}</span>
            </div>
            <div className="mt-1.5 pl-8">
              {item.type === "spark_ignited" ? (
                <div className="text-ignite-flame font-bold text-sm">🔥 {item.sparkTitle} — IGNITED!</div>
              ) : (
                <div className="text-white/50 text-sm truncate">{item.sparkTitle}</div>
              )}
              {item.note && <div className="text-white/35 text-xs italic mt-1">&ldquo;{item.note}&rdquo;</div>}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
