"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { AlienUser, UserStats, FeedItem, ChainData, Spark } from "@/lib/types";
import { verifyIdentity, sendPayment } from "@/lib/alien-bridge";

const SESSION_KEY = "ignite_session";

interface StoredSession {
  user: AlienUser;
  stats: UserStats;
}

function saveSession(user: AlienUser, stats: UserStats) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify({ user, stats })); } catch {}
}

function loadSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch {}
}

export function useAlien() {
  const [user, setUser] = useState<AlienUser | null>(null);
  const [stats, setStats] = useState<UserStats>({ balance: 0, sparksCreated: 0, sparksBacked: 0, totalContributed: 0 });
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-restore session
  useEffect(() => {
    const session = loadSession();
    if (session?.user) {
      setUser(session.user);
      setStats(session.stats);
      fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alienId: session.user.alienId, displayName: session.user.displayName }),
      })
        .then((r) => r.json())
        .then((data) => { if (data.stats) setStats(data.stats); })
        .catch(() => {});
    }
  }, []);

  const verify = useCallback(async () => {
    setIsVerifying(true);
    setError(null);
    try {
      const identity = await verifyIdentity();
      if (!identity.success) throw new Error("Verification failed");
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alienId: identity.alienId, displayName: identity.displayName }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setUser(data.user);
      setStats(data.stats);
      saveSession(data.user, data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setIsVerifying(false);
    }
  }, []);

  const createSpark = useCallback(async (title: string, description: string, goal: number, category: string) => {
    if (!user) throw new Error("Not verified");
    const res = await fetch("/api/spark", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creatorId: user.id, displayName: user.displayName, title, description, goal, category }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    if (data.stats) { setStats(data.stats); saveSession(user, data.stats); }
    window.dispatchEvent(new CustomEvent("ignite-action"));
    return data.spark;
  }, [user]);

  const backSpark = useCallback(async (sparkId: string, amount: number, note?: string) => {
    if (!user) throw new Error("Not verified");
    const payment = await sendPayment("ignite_back", amount, `Back spark ${sparkId}`);
    if (!payment.success) throw new Error("Payment failed");
    const res = await fetch("/api/back", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sparkId, backerId: user.id, displayName: user.displayName, amount, note, txHash: payment.txHash }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    if (data.stats) { setStats(data.stats); saveSession(user, data.stats); }
    window.dispatchEvent(new CustomEvent("ignite-action"));
    return data.backing;
  }, [user]);

  const logout = useCallback(() => {
    setUser(null);
    setStats({ balance: 0, sparksCreated: 0, sparksBacked: 0, totalContributed: 0 });
    clearSession();
  }, []);

  return { user, stats, isVerifying, error, verify, createSpark, backSpark, logout };
}

export function useIgniteData() {
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [chainData, setChainData] = useState<ChainData | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [sparksRes, feedRes, chainRes] = await Promise.all([
        fetch("/api/feed?type=sparks"),
        fetch("/api/feed?type=feed"),
        fetch("/api/feed?type=chain"),
      ]);
      const [sparksData, feedData, chainDataRes] = await Promise.all([
        sparksRes.json(), feedRes.json(), chainRes.json(),
      ]);
      if (sparksData.sparks) setSparks(sparksData.sparks);
      if (feedData.feed) setFeedItems(feedData.feed);
      if (chainDataRes.chain) setChainData(chainDataRes.chain);
    } catch {}
  }, []);

  useEffect(() => {
    refresh();
    const es = new EventSource("/api/events");
    es.onmessage = () => refresh();
    const handleAction = () => setTimeout(refresh, 500);
    window.addEventListener("ignite-action", handleAction);
    const interval = setInterval(refresh, 15000);
    return () => {
      es.close();
      window.removeEventListener("ignite-action", handleAction);
      clearInterval(interval);
    };
  }, [refresh]);

  return { sparks, feedItems, chainData, refresh };
}
