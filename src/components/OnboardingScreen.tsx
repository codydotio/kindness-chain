"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  onVerify: () => void;
  isVerifying: boolean;
  error: string | null;
}

export default function OnboardingScreen({ onVerify, isVerifying, error }: Props) {
  const [started, setStarted] = useState(false);

  return (
    <div className="fixed inset-0 bg-[#0a0a1a] flex flex-col items-center justify-center px-6">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full opacity-10"
            style={{
              width: 300 + i * 100, height: 300 + i * 100,
              background: `radial-gradient(circle, ${["#FF8C42", "#FF4B6E", "#FFD700"][i]}40, transparent)`,
              left: `${20 + i * 20}%`, top: `${30 + i * 10}%`,
            }}
            animate={{ x: [0, 30, -20, 0], y: [0, -20, 30, 0], scale: [1, 1.1, 0.9, 1] }}
            transition={{ duration: 8 + i * 2, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {!started ? (
          <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="relative z-10 text-center max-w-sm">
            <motion.div className="text-7xl mb-5" animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity }}>
              🔥
            </motion.div>
            <h1 className="text-4xl font-bold mb-3 gradient-text">Ignite</h1>
            <p className="text-white/50 text-base leading-relaxed mb-8">
              Fund ideas that matter.
              <br /><br />
              Verified humans propose sparks — causes, art, tech projects.
              Back the ones you believe in. When <span className="text-ignite-gold font-bold">3 unique humans</span> back a spark,
              the community <span className="text-ignite-flame font-bold">ignites it</span>.
            </p>
            <motion.button onClick={() => setStarted(true)} className="w-full py-4 rounded-2xl bg-gradient-to-r from-ignite-flame to-ignite-ember text-white font-bold text-lg shadow-lg" whileTap={{ scale: 0.97 }}>
              Start Funding
            </motion.button>
          </motion.div>
        ) : (
          <motion.div key="verify" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="relative z-10 text-center max-w-sm">
            <div className="text-7xl mb-5">👽</div>
            <h2 className="text-2xl font-bold mb-3">Verify to Fund</h2>
            <p className="text-white/50 text-sm mb-8">Only verified humans can create and back sparks. No bots. No fake accounts. Real trust.</p>
            {error && <div className="mb-4 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
            <motion.button onClick={onVerify} disabled={isVerifying} className="w-full py-4 rounded-2xl bg-gradient-to-r from-ignite-gold to-ignite-flame text-black font-bold text-lg disabled:opacity-50" whileTap={{ scale: 0.97 }}>
              {isVerifying ? "Verifying..." : "Verify with Alien ID"}
            </motion.button>
            <button onClick={() => setStarted(false)} className="mt-4 text-white/30 text-sm">← Back</button>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="absolute bottom-6 text-white/15 text-xs">Built on <span className="text-white/25">Alien Protocol</span></div>
    </div>
  );
}
