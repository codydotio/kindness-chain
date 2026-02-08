"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { AlienUser, UserStats, FeedItem, ChainData } from "@/lib/types";
import {
  verifyIdentity,
  sendPayment,
  isAlienBridgeAvailable,
} from "@/lib/alien-bridge";

const SESSION_KEY = "kindness_chain_session";

interface StoredSession {
  user: AlienUser;
  stats: UserStats;
}

function saveSession(user: AlienUser, stats: UserStats) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user, stats }));
  } catch {}
}

function loadSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {}
}

export function useAlien() {
  const [user, setUser] = useState<AlienUser | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bridgeReady, setBridgeReady] = useState(false);

  // Auto-restore session on mount
  useEffect(() => {
    setBridgeReady(isAlienBridgeAvailable());

    const session = loadSession();
    if (session?.user) {
      setUser(session.user);
      setStats(session.stats);

      // Re-register with backend (ensures user exists in this serverless instance)
      fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alienId: session.user.alienId,
          displayName: session.user.displayName,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.stats) setStats(data.stats);
        })
        .catch(() => {});
    }
  }, []);

  const verify = useCallback(async () => {
    setIsVerifying(true);
    setError(null);
    try {
      const identity = await verifyIdentity();
      if (!identity.success) {
        throw new Error("Identity verification failed");
      }

      // Register with our backend
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alienId: identity.alienId,
          displayName: identity.displayName,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setUser(data.user);
      setStats(data.stats);

      // Persist session so page refresh keeps you logged in
      saveSession(data.user, data.stats);

      return data.user;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Verification failed";
      setError(message);
      return null;
    } finally {
      setIsVerifying(false);
    }
  }, []);

  const gift = useCallback(
    async (toUserId: string, amount: number, note: string) => {
      if (!user) throw new Error("Not verified");
      setError(null);

      try {
        // First, initiate payment through Alien bridge
        const payment = await sendPayment(toUserId, amount, note);

        if (!payment.success) {
          throw new Error("Payment failed");
        }

        // Then record the gift in our backend
        // Include displayName so the API can auto-register sender on cold starts
        const res = await fetch("/api/gift", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fromUserId: user.id,
            fromDisplayName: user.displayName,
            toUserId,
            amount,
            note,
            txHash: payment.txHash,
          }),
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error);

        setStats(data.stats);
        if (data.stats) saveSession(user, data.stats);

        // Signal useSSE to refetch (SSE pub/sub doesn't work on Vercel serverless)
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("kindness-gift-sent"));
        }

        return data.gift;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Gift failed";
        setError(message);
        throw err;
      }
    },
    [user]
  );

  const refreshStats = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alienId: user.alienId,
          displayName: user.displayName,
        }),
      });
      const data = await res.json();
      if (data.stats) {
        setStats(data.stats);
        saveSession(user, data.stats);
      }
    } catch {
      // silently fail
    }
  }, [user]);

  const logout = useCallback(() => {
    setUser(null);
    setStats(null);
    clearSession();
    localStorage.removeItem("alien_mock_identity");
  }, []);

  return {
    user,
    stats,
    isVerifying,
    error,
    bridgeReady,
    verify,
    gift,
    refreshStats,
    logout,
  };
}

// Hook for real-time feed via SSE + client-side refetch
export function useSSE() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [chainData, setChainData] = useState<ChainData | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Refetch helper — works on serverless where SSE pub/sub breaks
  const refetchData = useCallback(() => {
    fetch("/api/feed")
      .then((r) => r.json())
      .then((data) => setFeed(data.feed || []))
      .catch(() => {});

    fetch("/api/chain")
      .then((r) => r.json())
      .then((data) => setChainData(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Fetch initial data
    refetchData();

    // Connect to SSE for real-time updates (works locally, may not on serverless)
    const es = new EventSource("/api/events");
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);

        if (parsed.type === "gift") {
          setFeed((prev) => [parsed.data, ...prev].slice(0, 50));
          // Refresh chain data
          fetch("/api/chain")
            .then((r) => r.json())
            .then((data) => setChainData(data))
            .catch(() => {});
        }
      } catch {
        // ignore parse errors
      }
    };

    // Listen for gift events from useAlien hook (serverless fallback)
    const handleGiftSent = () => {
      // Small delay to let the server process
      setTimeout(refetchData, 500);
    };
    window.addEventListener("kindness-gift-sent", handleGiftSent);

    // Also poll every 15s as extra fallback for multi-user scenarios
    const pollInterval = setInterval(refetchData, 15000);

    return () => {
      es.close();
      window.removeEventListener("kindness-gift-sent", handleGiftSent);
      clearInterval(pollInterval);
    };
  }, [refetchData]);

  return { feed, chainData, refetchData };
}
