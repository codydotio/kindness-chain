"use client";

import { useState } from "react";
import { useAlien, useIgniteData } from "@/hooks/useAlien";
import OnboardingScreen from "@/components/OnboardingScreen";
import Dashboard from "@/components/Dashboard";
import CreateSparkModal from "@/components/GiftModal";

export default function Home() {
  const { user, stats, isVerifying, error, verify, createSpark, backSpark } = useAlien();
  const { sparks, feedItems, chainData } = useIgniteData();
  const [showCreate, setShowCreate] = useState(false);

  if (!user) {
    return <OnboardingScreen onVerify={verify} isVerifying={isVerifying} error={error} />;
  }

  return (
    <>
      <Dashboard
        sparks={sparks}
        feedItems={feedItems}
        chainData={chainData}
        stats={stats}
        currentUserId={user.id}
        onCreateSpark={() => setShowCreate(true)}
        onBack={backSpark}
      />
      <CreateSparkModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={createSpark}
      />
    </>
  );
}
