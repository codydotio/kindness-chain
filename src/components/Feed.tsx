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
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash % 360);
}

export default function Feed({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-white/30">
        <div className="text-3xl mb-2">🌟</div>
        <div className="text-sm">No gifts yet. Be the first!</div>
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
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className="px-4 py-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors"
          >
            {/* From → To */}
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{
                  background: `hsl(${avatarHue(item.fromName)}, 60%, 45%)`,
                }}
              >
                {item.fromName[0]}
              </div>
              <span className="text-white/80 text-sm font-medium">
                {item.fromName}
              </span>
              <span className="text-kindness-glow text-xs">→</span>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{
                  background: `hsl(${avatarHue(item.toName)}, 60%, 45%)`,
                }}
              >
                {item.toName[0]}
              </div>
              <span className="text-white/80 text-sm font-medium">
                {item.toName}
              </span>
              <span className="ml-auto text-kindness-glow/60 text-xs font-semibold">
                +{item.amount}
              </span>
            </div>

            {/* Note */}
            <div className="text-white/50 text-sm italic leading-relaxed pl-8">
              &ldquo;{item.note}&rdquo;
            </div>

            {/* Time */}
            <div className="text-white/20 text-[10px] mt-2 pl-8">
              {timeAgo(item.createdAt)}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
