"use client";

import { useAlien, useSSE } from "@/hooks/useAlien";
import OnboardingScreen from "@/components/OnboardingScreen";
import Dashboard from "@/components/Dashboard";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const { user, stats, isVerifying, error, verify, gift, refreshStats } =
    useAlien();
  const { feed, chainData } = useSSE();

  return (
    <main className="min-h-screen">
      <AnimatePresence mode="wait">
        {!user ? (
          <motion.div
            key="onboarding"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
          >
            <OnboardingScreen
              onVerify={verify}
              isVerifying={isVerifying}
              error={error}
            />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Dashboard
              user={user}
              stats={stats!}
              feed={feed}
              chainData={chainData}
              onGift={gift}
              onRefreshStats={refreshStats}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
