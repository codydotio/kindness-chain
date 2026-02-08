"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  onVerify: () => Promise<unknown>;
  isVerifying: boolean;
  error: string | null;
}

export default function OnboardingScreen({
  onVerify,
  isVerifying,
  error,
}: Props) {
  const [step, setStep] = useState(0);

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#0a0a1a] via-[#1a1035] to-[#0a0a1a] flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full opacity-20"
            style={{
              background: [
                "radial-gradient(circle, #7B61FF 0%, transparent 70%)",
                "radial-gradient(circle, #FFD700 0%, transparent 70%)",
                "radial-gradient(circle, #00D4AA 0%, transparent 70%)",
                "radial-gradient(circle, #FF4B6E 0%, transparent 70%)",
                "radial-gradient(circle, #FF8C42 0%, transparent 70%)",
                "radial-gradient(circle, #7B61FF 0%, transparent 70%)",
              ][i],
              width: `${120 + i * 40}px`,
              height: `${120 + i * 40}px`,
            }}
            animate={{
              x: [
                Math.random() * 300 - 150,
                Math.random() * 300 - 150,
                Math.random() * 300 - 150,
              ],
              y: [
                Math.random() * 400 - 200,
                Math.random() * 400 - 200,
                Math.random() * 400 - 200,
              ],
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
            initial={{
              left: `${20 + i * 12}%`,
              top: `${15 + i * 10}%`,
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 text-center max-w-sm"
          >
            {/* Logo / Icon */}
            <motion.div
              className="text-7xl mb-6"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              🔗
            </motion.div>

            <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
              Kindness Chain
            </h1>

            <p className="text-white/60 text-base leading-relaxed mb-8">
              A pay-it-forward economy powered by{" "}
              <span className="text-kindness-glow">verified humans</span>.
              <br />
              <br />
              Receive kindness tokens. Gift them forward with a note explaining{" "}
              <span className="italic text-white/80">why</span>.
              <br />
              Watch the chain grow.
            </p>

            <motion.button
              onClick={() => setStep(1)}
              className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-kindness-aurora to-kindness-cosmic text-white font-semibold text-lg shadow-lg shadow-kindness-aurora/25 active:scale-95 transition-transform"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              Get Started
            </motion.button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="verify"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 text-center max-w-sm"
          >
            <motion.div
              className="text-7xl mb-6"
              animate={{
                rotate: isVerifying ? [0, 360] : 0,
              }}
              transition={
                isVerifying
                  ? { duration: 2, repeat: Infinity, ease: "linear" }
                  : {}
              }
            >
              👽
            </motion.div>

            <h2 className="text-2xl font-bold text-white mb-3">
              Verify Your Humanity
            </h2>

            <p className="text-white/60 text-sm leading-relaxed mb-8">
              Kindness Chain uses{" "}
              <span className="text-kindness-cosmic">Alien ID</span> to ensure
              every participant is a unique, verified human.
              <br />
              <br />
              One person. One chain. Real kindness only.
            </p>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            <motion.button
              onClick={onVerify}
              disabled={isVerifying}
              className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-kindness-glow to-kindness-warm text-black font-semibold text-lg shadow-lg shadow-kindness-glow/25 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
              whileHover={!isVerifying ? { scale: 1.02 } : {}}
              whileTap={!isVerifying ? { scale: 0.97 } : {}}
            >
              {isVerifying ? (
                <span className="flex items-center justify-center gap-3">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="inline-block"
                  >
                    ⏳
                  </motion.span>
                  Verifying...
                </span>
              ) : (
                "Verify with Alien ID"
              )}
            </motion.button>

            <button
              onClick={() => setStep(0)}
              className="mt-4 text-white/30 text-sm hover:text-white/50 transition-colors"
            >
              ← Back
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom branding */}
      <div className="absolute bottom-6 text-center">
        <div className="text-white/20 text-xs">
          Built on{" "}
          <span className="text-white/30 font-medium">Alien Protocol</span>
        </div>
      </div>
    </div>
  );
}
