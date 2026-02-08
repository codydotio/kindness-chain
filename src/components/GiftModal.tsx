"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AlienUser } from "@/lib/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onGift: (toUserId: string, amount: number, note: string) => Promise<void>;
  currentUserId: string;
  balance: number;
}

export default function GiftModal({
  isOpen,
  onClose,
  onGift,
  currentUserId,
  balance,
}: Props) {
  const [users, setUsers] = useState<AlienUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AlienUser | null>(null);
  const [amount, setAmount] = useState(1);
  const [note, setNote] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [search, setSearch] = useState("");

  // Fetch users
  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/feed?type=users")
      .then((r) => r.json())
      .then((data) => setUsers(data.users || []))
      .catch(() => {});
  }, [isOpen]);

  const filteredUsers = users.filter(
    (u) =>
      u.id !== currentUserId &&
      u.displayName.toLowerCase().includes(search.toLowerCase())
  );

  const handleSend = async () => {
    if (!selectedUser) return;
    if (!note.trim()) {
      setError("Tell them why — that's what makes it kindness!");
      return;
    }
    if (note.trim().length < 3) {
      setError("Write a little more — they deserve it.");
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      await onGift(selectedUser.id, amount, note.trim());
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSelectedUser(null);
        setNote("");
        setAmount(1);
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send gift");
    } finally {
      setIsSending(false);
    }
  };

  const resetAndClose = () => {
    setSelectedUser(null);
    setNote("");
    setAmount(1);
    setError(null);
    setSearch("");
    setSuccess(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={resetAndClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-gradient-to-b from-[#1a1035] to-[#0f0a20] border border-white/10 shadow-2xl"
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Success state */}
            {success && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-8 text-center"
              >
                <motion.div
                  className="text-6xl mb-4"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 0.6 }}
                >
                  💛
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Kindness Sent!
                </h3>
                <p className="text-white/60 text-sm">
                  You just made {selectedUser?.displayName}&apos;s day brighter.
                </p>
              </motion.div>
            )}

            {/* Form */}
            {!success && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">
                    Share Kindness
                  </h3>
                  <button
                    onClick={resetAndClose}
                    className="text-white/40 hover:text-white/70 transition-colors text-2xl leading-none"
                  >
                    ×
                  </button>
                </div>

                {/* Step 1: Select recipient */}
                {!selectedUser && (
                  <div>
                    <label className="text-white/50 text-xs uppercase tracking-wider mb-2 block">
                      Who deserves your kindness?
                    </label>
                    <input
                      type="text"
                      placeholder="Search by name..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-kindness-aurora/50 mb-3 text-sm"
                    />
                    <div className="space-y-1 max-h-[200px] overflow-y-auto">
                      {filteredUsers.map((u) => (
                        <motion.button
                          key={u.id}
                          onClick={() => setSelectedUser(u)}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-kindness-aurora/30 transition-all text-left"
                          whileTap={{ scale: 0.98 }}
                        >
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                            style={{
                              background: `hsl(${Math.abs(u.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % 360}, 60%, 50%)`,
                            }}
                          >
                            {u.displayName[0]}
                          </div>
                          <span className="text-white text-sm font-medium">
                            {u.displayName}
                          </span>
                        </motion.button>
                      ))}
                      {filteredUsers.length === 0 && (
                        <div className="text-center py-6 text-white/30 text-sm">
                          No other verified humans found yet.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 2: Amount + Note */}
                {selectedUser && (
                  <div>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 mb-4">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
                        style={{
                          background: `hsl(${Math.abs(selectedUser.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % 360}, 60%, 50%)`,
                        }}
                      >
                        {selectedUser.displayName[0]}
                      </div>
                      <div>
                        <div className="text-white font-medium text-sm">
                          {selectedUser.displayName}
                        </div>
                        <div className="text-white/40 text-xs">
                          Verified Human
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedUser(null)}
                        className="ml-auto text-white/30 hover:text-white/60 text-xs"
                      >
                        Change
                      </button>
                    </div>

                    {/* Amount selector */}
                    <label className="text-white/50 text-xs uppercase tracking-wider mb-2 block">
                      How much kindness?
                    </label>
                    <div className="flex gap-2 mb-4">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <motion.button
                          key={n}
                          onClick={() => setAmount(n)}
                          disabled={n > balance}
                          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                            amount === n
                              ? "bg-kindness-glow text-black shadow-lg shadow-kindness-glow/30"
                              : n > balance
                                ? "bg-white/5 text-white/20 cursor-not-allowed"
                                : "bg-white/5 text-white/60 hover:bg-white/10"
                          }`}
                          whileTap={n <= balance ? { scale: 0.95 } : {}}
                        >
                          {n}
                        </motion.button>
                      ))}
                    </div>
                    <div className="text-right text-xs text-white/30 mb-4">
                      Your balance: {balance} tokens
                    </div>

                    {/* Note */}
                    <label className="text-white/50 text-xs uppercase tracking-wider mb-2 block">
                      Why this person? (Required)
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Tell them why they deserve this kindness..."
                      maxLength={280}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-kindness-glow/50 resize-none text-sm leading-relaxed"
                    />
                    <div className="text-right text-xs text-white/30 mt-1 mb-4">
                      {note.length}/280
                    </div>

                    {/* Error */}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                      >
                        {error}
                      </motion.div>
                    )}

                    {/* Send button */}
                    <motion.button
                      onClick={handleSend}
                      disabled={isSending || !note.trim()}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-kindness-glow to-kindness-warm text-black font-bold text-base shadow-lg shadow-kindness-glow/25 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-transform"
                      whileHover={!isSending ? { scale: 1.02 } : {}}
                      whileTap={!isSending ? { scale: 0.97 } : {}}
                    >
                      {isSending ? (
                        <span className="flex items-center justify-center gap-2">
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                          >
                            ⏳
                          </motion.span>
                          Sending kindness...
                        </span>
                      ) : (
                        `Gift ${amount} token${amount > 1 ? "s" : ""} to ${selectedUser.displayName}`
                      )}
                    </motion.button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
