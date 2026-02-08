// ============================================================
// KINDNESS CHAIN — In-Memory Store
// Swap for a real DB (Postgres, Redis) if you want persistence
// For the hackathon, in-memory is fast and sufficient
// ============================================================

import {
  AlienUser,
  KindnessGift,
  ChainData,
  ChainNode,
  ChainLink,
  FeedItem,
  UserStats,
} from "./types";

// Initial token balance for every verified human
const INITIAL_BALANCE = 5;

// In-memory storage
const users: Map<string, AlienUser> = new Map();
const gifts: KindnessGift[] = [];
const balances: Map<string, number> = new Map();

// SSE subscribers
type Subscriber = (event: string, data: unknown) => void;
const subscribers: Set<Subscriber> = new Set();

// ---- Seed data for demo/testing ----
function seedDemoData() {
  if (users.size > 0) return; // already seeded

  const demoUsers: Array<{ id: string; name: string }> = [
    { id: "alien_001", name: "Luna" },
    { id: "alien_002", name: "Kai" },
    { id: "alien_003", name: "Sage" },
    { id: "alien_004", name: "Nova" },
    { id: "alien_005", name: "River" },
    { id: "alien_006", name: "Ember" },
    { id: "alien_007", name: "Atlas" },
    { id: "alien_008", name: "Wren" },
  ];

  demoUsers.forEach((u) => {
    users.set(u.id, {
      id: u.id,
      alienId: u.id,
      displayName: u.name,
      verified: true,
      createdAt: Date.now() - Math.random() * 3600000,
    });
    balances.set(u.id, INITIAL_BALANCE);
  });

  const demoGifts: Array<{
    from: string;
    to: string;
    amount: number;
    note: string;
  }> = [
    {
      from: "alien_001",
      to: "alien_002",
      amount: 2,
      note: "You helped me debug my code at 2am. That's real friendship.",
    },
    {
      from: "alien_002",
      to: "alien_003",
      amount: 1,
      note: "Your talk on ZK proofs inspired me to learn more.",
    },
    {
      from: "alien_003",
      to: "alien_005",
      amount: 2,
      note: "Thank you for sharing your lunch when I forgot mine!",
    },
    {
      from: "alien_004",
      to: "alien_001",
      amount: 1,
      note: "Your smile made my day brighter. Simple but powerful.",
    },
    {
      from: "alien_005",
      to: "alien_006",
      amount: 1,
      note: "For teaching me that kindness compounds.",
    },
    {
      from: "alien_006",
      to: "alien_007",
      amount: 2,
      note: "You believed in my idea when nobody else did.",
    },
    {
      from: "alien_007",
      to: "alien_004",
      amount: 1,
      note: "For the coffee. For the conversation. For being human.",
    },
    {
      from: "alien_008",
      to: "alien_003",
      amount: 2,
      note: "You held the door open and asked how I was doing. Nobody does that.",
    },
    {
      from: "alien_001",
      to: "alien_008",
      amount: 1,
      note: "Your energy is contagious. Never stop being you.",
    },
  ];

  demoGifts.forEach((g, i) => {
    const gift: KindnessGift = {
      id: `gift_demo_${i}`,
      fromUserId: g.from,
      toUserId: g.to,
      amount: g.amount,
      note: g.note,
      createdAt: Date.now() - (demoGifts.length - i) * 300000,
      txHash: `0xdemo${i}`,
    };
    gifts.push(gift);

    // Adjust balances
    const fromBal = balances.get(g.from) || INITIAL_BALANCE;
    const toBal = balances.get(g.to) || INITIAL_BALANCE;
    balances.set(g.from, fromBal - g.amount);
    balances.set(g.to, toBal + g.amount);
  });
}

// Initialize seed data
seedDemoData();

// ---- Public API ----

export function registerUser(
  alienId: string,
  displayName: string
): AlienUser {
  const existing = users.get(alienId);
  if (existing) return existing;

  const user: AlienUser = {
    id: alienId,
    alienId,
    displayName,
    verified: true,
    createdAt: Date.now(),
  };

  users.set(alienId, user);
  balances.set(alienId, INITIAL_BALANCE);

  // Notify subscribers
  broadcast("user_joined", {
    id: alienId,
    name: displayName,
    verified: true,
  });

  return user;
}

export function getUser(userId: string): AlienUser | undefined {
  return users.get(userId);
}

export function getAllUsers(): AlienUser[] {
  return Array.from(users.values());
}

export function getUserStats(userId: string): UserStats {
  const balance = balances.get(userId) || 0;
  const given = gifts.filter((g) => g.fromUserId === userId);
  const received = gifts.filter((g) => g.toUserId === userId);

  return {
    balance,
    giftsGiven: given.length,
    giftsReceived: received.length,
    chainLength: calculateChainLength(userId),
  };
}

export function createGift(
  fromUserId: string,
  toUserId: string,
  amount: number,
  note: string,
  txHash?: string
): KindnessGift | { error: string } {
  // Validation
  if (!users.has(fromUserId)) return { error: "Sender not verified" };
  if (!users.has(toUserId)) return { error: "Recipient not verified" };
  if (fromUserId === toUserId) return { error: "Cannot gift yourself" };
  if (amount < 1 || amount > 5) return { error: "Amount must be 1-5" };

  const senderBalance = balances.get(fromUserId) || 0;
  if (senderBalance < amount) return { error: "Insufficient balance" };
  if (!note || note.trim().length < 3)
    return { error: "A note is required — tell them why!" };

  // Create gift
  const gift: KindnessGift = {
    id: `gift_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    fromUserId,
    toUserId,
    amount,
    note: note.trim(),
    createdAt: Date.now(),
    txHash,
  };

  gifts.push(gift);

  // Update balances
  balances.set(fromUserId, senderBalance - amount);
  balances.set(toUserId, (balances.get(toUserId) || 0) + amount);

  // Build feed item
  const fromUser = users.get(fromUserId)!;
  const toUser = users.get(toUserId)!;
  const feedItem: FeedItem = {
    id: gift.id,
    fromName: fromUser.displayName,
    toName: toUser.displayName,
    amount,
    note: gift.note,
    createdAt: gift.createdAt,
  };

  // Notify subscribers
  broadcast("gift", feedItem);

  return gift;
}

export function getChainData(): ChainData {
  const nodes: ChainNode[] = Array.from(users.values()).map((u) => {
    const given = gifts.filter((g) => g.fromUserId === u.id);
    const received = gifts.filter((g) => g.toUserId === u.id);
    return {
      id: u.id,
      name: u.displayName,
      kindnessGiven: given.reduce((sum, g) => sum + g.amount, 0),
      kindnessReceived: received.reduce((sum, g) => sum + g.amount, 0),
      totalGifts: given.length + received.length,
      verified: u.verified,
    };
  });

  // Aggregate links between same pairs
  const linkMap = new Map<string, ChainLink>();
  gifts.forEach((g) => {
    const key = `${g.fromUserId}->${g.toUserId}`;
    const existing = linkMap.get(key);
    if (existing) {
      existing.amount += g.amount;
      existing.note = g.note; // keep latest note
      existing.createdAt = g.createdAt;
    } else {
      linkMap.set(key, {
        source: g.fromUserId,
        target: g.toUserId,
        amount: g.amount,
        note: g.note,
        createdAt: g.createdAt,
      });
    }
  });

  return {
    nodes,
    links: Array.from(linkMap.values()),
  };
}

export function getFeed(limit: number = 20): FeedItem[] {
  return gifts
    .slice(-limit)
    .reverse()
    .map((g) => {
      const from = users.get(g.fromUserId);
      const to = users.get(g.toUserId);
      return {
        id: g.id,
        fromName: from?.displayName || "Anonymous",
        toName: to?.displayName || "Anonymous",
        amount: g.amount,
        note: g.note,
        createdAt: g.createdAt,
      };
    });
}

// ---- Helpers ----

function calculateChainLength(userId: string): number {
  // BFS to find longest chain this user is part of
  const visited = new Set<string>();
  const queue: Array<{ id: string; depth: number }> = [
    { id: userId, depth: 0 },
  ];
  let maxDepth = 0;

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    maxDepth = Math.max(maxDepth, depth);

    // Find all connections (both directions)
    gifts.forEach((g) => {
      if (g.fromUserId === id && !visited.has(g.toUserId)) {
        queue.push({ id: g.toUserId, depth: depth + 1 });
      }
      if (g.toUserId === id && !visited.has(g.fromUserId)) {
        queue.push({ id: g.fromUserId, depth: depth + 1 });
      }
    });
  }

  return maxDepth;
}

// ---- SSE Broadcasting ----

export function subscribe(callback: Subscriber) {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

function broadcast(event: string, data: unknown) {
  subscribers.forEach((cb) => {
    try {
      cb(event, data);
    } catch {
      // subscriber errored, remove it
      subscribers.delete(cb);
    }
  });
}

// ---- AI Agent Helpers ----

export function getUsers(): Array<{id: string; name: string; giftsReceived: number; giftsGiven: number}> {
  return Array.from(users.values()).map(u => ({
    id: u.alienId,
    name: u.displayName,
    giftsReceived: gifts.filter(g => g.toUserId === u.alienId).length,
    giftsGiven: gifts.filter(g => g.fromUserId === u.alienId).length,
  }));
}

export function getRecentGiftsCount(): number {
  const fiveMinAgo = Date.now() - 5 * 60 * 1000;
  return gifts.filter(g => g.createdAt > fiveMinAgo).length;
}
