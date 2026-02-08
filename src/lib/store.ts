// IGNITE — In-Memory Store

import type { AlienUser, Spark, Backing, FeedItem, UserStats, ChainData, ChainNode, ChainLink, AIAgentState, AIInsight } from "./types";
import { IGNITE_THRESHOLD, INITIAL_BALANCE } from "./types";

const users = new Map<string, AlienUser>();
const sparks = new Map<string, Spark>();
const backings: Backing[] = [];
const balances = new Map<string, number>();
const feed: FeedItem[] = [];

type Subscriber = (event: string, data: unknown) => void;
const subscribers = new Set<Subscriber>();

// ---- Seed Data ----
function seed() {
  if (users.size > 0) return;

  const seedUsers = [
    { id: "alien_s01", name: "Nova" },
    { id: "alien_s02", name: "Kai" },
    { id: "alien_s03", name: "Sage" },
    { id: "alien_s04", name: "River" },
    { id: "alien_s05", name: "Ember" },
    { id: "alien_s06", name: "Atlas" },
  ];

  seedUsers.forEach((u) => {
    users.set(u.id, { id: u.id, alienId: u.id, displayName: u.name, verified: true, createdAt: Date.now() - 600000 });
    balances.set(u.id, INITIAL_BALANCE);
  });

  const seedSparks: Omit<Spark, "id">[] = [
    {
      creatorId: "alien_s01", creatorName: "Nova",
      title: "AI Music Video for Indie Artists",
      description: "Fund AI-generated music videos for 3 independent musicians who can't afford traditional production. Verified humans vote on which artists get selected.",
      category: "art", goal: 25, raised: 18, backerIds: ["alien_s02", "alien_s03"],
      status: "active", createdAt: Date.now() - 500000,
    },
    {
      creatorId: "alien_s03", creatorName: "Sage",
      title: "Community Garden Drone Mapping",
      description: "Use AI + drone footage to map and optimize 5 community gardens in SF. All participants verified — no corporate astroturfing.",
      category: "cause", goal: 15, raised: 15, backerIds: ["alien_s01", "alien_s02", "alien_s04"],
      status: "ignited", createdAt: Date.now() - 400000, ignitedAt: Date.now() - 100000,
    },
    {
      creatorId: "alien_s05", creatorName: "Ember",
      title: "Open-Source AI Tutor for Kids",
      description: "Build a free AI tutoring app for underserved schools. Needs funding for API costs. Every backer is a verified human who believes in education equity.",
      category: "tech", goal: 30, raised: 8, backerIds: ["alien_s06"],
      status: "active", createdAt: Date.now() - 300000,
    },
    {
      creatorId: "alien_s04", creatorName: "River",
      title: "Neighborhood Skill-Share Platform",
      description: "Create a hyper-local platform where verified neighbors teach each other skills — cooking, coding, carpentry. Trust starts with real identity.",
      category: "community", goal: 20, raised: 5, backerIds: ["alien_s01"],
      status: "active", createdAt: Date.now() - 200000,
    },
  ];

  seedSparks.forEach((s, i) => {
    const id = `spark_${i + 1}`;
    sparks.set(id, { ...s, id });
  });

  const seedFeed: FeedItem[] = [
    { id: "f1", type: "spark_created", sparkId: "spark_1", sparkTitle: "AI Music Video for Indie Artists", actorName: "Nova", createdAt: Date.now() - 500000 },
    { id: "f2", type: "backing", sparkId: "spark_1", sparkTitle: "AI Music Video for Indie Artists", actorName: "Kai", amount: 10, note: "Art needs to be accessible", createdAt: Date.now() - 450000 },
    { id: "f3", type: "backing", sparkId: "spark_1", sparkTitle: "AI Music Video for Indie Artists", actorName: "Sage", amount: 8, note: "Love this idea!", createdAt: Date.now() - 420000 },
    { id: "f4", type: "spark_created", sparkId: "spark_2", sparkTitle: "Community Garden Drone Mapping", actorName: "Sage", createdAt: Date.now() - 400000 },
    { id: "f5", type: "spark_ignited", sparkId: "spark_2", sparkTitle: "Community Garden Drone Mapping", actorName: "Community", createdAt: Date.now() - 100000 },
    { id: "f6", type: "spark_created", sparkId: "spark_3", sparkTitle: "Open-Source AI Tutor for Kids", actorName: "Ember", createdAt: Date.now() - 300000 },
    { id: "f7", type: "backing", sparkId: "spark_3", sparkTitle: "Open-Source AI Tutor for Kids", actorName: "Atlas", amount: 8, note: "Education is everything", createdAt: Date.now() - 250000 },
    { id: "f8", type: "spark_created", sparkId: "spark_4", sparkTitle: "Neighborhood Skill-Share Platform", actorName: "River", createdAt: Date.now() - 200000 },
  ];
  feed.push(...seedFeed);
}

seed();

// ---- API ----

export function getUser(userId: string): AlienUser | undefined {
  return users.get(userId);
}

export function registerUser(alienId: string, displayName: string): AlienUser {
  const existing = users.get(alienId);
  if (existing) return existing;
  const user: AlienUser = { id: alienId, alienId, displayName, verified: true, createdAt: Date.now() };
  users.set(alienId, user);
  balances.set(alienId, INITIAL_BALANCE);
  broadcast("user_joined", { id: alienId, name: displayName });
  return user;
}

export function getUserStats(userId: string): UserStats {
  const userBackings = backings.filter((b) => b.backerId === userId);
  const userSparks = Array.from(sparks.values()).filter((s) => s.creatorId === userId);
  return {
    balance: balances.get(userId) || 0,
    sparksCreated: userSparks.length,
    sparksBacked: new Set(userBackings.map((b) => b.sparkId)).size,
    totalContributed: userBackings.reduce((sum, b) => sum + b.amount, 0),
  };
}

export function createSpark(
  creatorId: string, title: string, description: string, goal: number, category: string
): Spark | { error: string } {
  if (!users.has(creatorId)) return { error: "Not verified" };
  if (!title || title.length < 3) return { error: "Title too short" };
  if (!description || description.length < 10) return { error: "Description too short" };
  if (goal < 5 || goal > 100) return { error: "Goal must be 5-100 tokens" };

  const id = `spark_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const creator = users.get(creatorId)!;
  const spark: Spark = {
    id, creatorId, creatorName: creator.displayName,
    title, description,
    category: (["cause", "art", "tech", "community", "other"].includes(category) ? category : "other") as Spark["category"],
    goal, raised: 0, backerIds: [], status: "active",
    createdAt: Date.now(),
  };

  sparks.set(id, spark);

  const item: FeedItem = {
    id: `f_${Date.now()}`, type: "spark_created",
    sparkId: id, sparkTitle: title, actorName: creator.displayName,
    createdAt: Date.now(),
  };
  feed.unshift(item);
  broadcast("spark_created", spark);
  return spark;
}

export function backSpark(
  sparkId: string, backerId: string, amount: number, note?: string, txHash?: string
): Backing | { error: string } {
  if (!users.has(backerId)) return { error: "Not verified" };
  const spark = sparks.get(sparkId);
  if (!spark) return { error: "Spark not found" };
  if (spark.status !== "active") return { error: "Spark already ignited" };
  if (spark.creatorId === backerId) return { error: "Can't back your own spark" };
  if (amount < 1 || amount > 10) return { error: "Amount must be 1-10" };

  const balance = balances.get(backerId) || 0;
  if (balance < amount) return { error: "Insufficient balance" };

  balances.set(backerId, balance - amount);
  spark.raised += amount;
  if (!spark.backerIds.includes(backerId)) {
    spark.backerIds.push(backerId);
  }

  const backer = users.get(backerId)!;
  const backing: Backing = {
    id: `b_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    sparkId, sparkTitle: spark.title,
    backerId, backerName: backer.displayName,
    amount, note, createdAt: Date.now(), txHash,
  };
  backings.push(backing);

  const item: FeedItem = {
    id: `f_${Date.now()}`, type: "backing",
    sparkId, sparkTitle: spark.title, actorName: backer.displayName,
    amount, note, createdAt: Date.now(),
  };
  feed.unshift(item);
  broadcast("backing", backing);

  // Check ignite threshold
  if (spark.backerIds.length >= IGNITE_THRESHOLD && spark.status === "active") {
    spark.status = "ignited";
    spark.ignitedAt = Date.now();
    spark.raised = spark.goal;
    const igniteItem: FeedItem = {
      id: `f_ign_${Date.now()}`, type: "spark_ignited",
      sparkId, sparkTitle: spark.title, actorName: "Community",
      createdAt: Date.now(),
    };
    feed.unshift(igniteItem);
    broadcast("spark_ignited", spark);
  }

  return backing;
}

export function getSparks(filter?: "active" | "ignited" | "all"): Spark[] {
  const all = Array.from(sparks.values());
  if (!filter || filter === "all") return all.sort((a, b) => b.createdAt - a.createdAt);
  return all.filter((s) => s.status === filter).sort((a, b) => b.createdAt - a.createdAt);
}

export function getFeed(limit = 20): FeedItem[] {
  return feed.slice(0, limit);
}

export function getChainData(): ChainData {
  const nodes: ChainNode[] = [];
  const links: ChainLink[] = [];
  const nodeIds = new Set<string>();

  sparks.forEach((s) => {
    nodes.push({
      id: s.id, name: s.title.length > 18 ? s.title.slice(0, 18) + "…" : s.title, type: "spark",
      totalActivity: s.backerIds.length + s.raised,
      raised: s.raised, goal: s.goal, status: s.status,
    });
    nodeIds.add(s.id);
  });

  users.forEach((u) => {
    const ct = backings.filter((b) => b.backerId === u.id).length;
    const sc = Array.from(sparks.values()).filter((s) => s.creatorId === u.id).length;
    if (ct > 0 || sc > 0) {
      nodes.push({ id: u.id, name: u.displayName, type: "user", totalActivity: ct + sc, verified: true });
      nodeIds.add(u.id);
    }
  });

  sparks.forEach((s) => {
    if (nodeIds.has(s.creatorId)) links.push({ source: s.creatorId, target: s.id, amount: 2, createdAt: s.createdAt });
  });

  backings.forEach((b) => {
    if (nodeIds.has(b.backerId) && nodeIds.has(b.sparkId)) {
      links.push({ source: b.backerId, target: b.sparkId, amount: b.amount, createdAt: b.createdAt });
    }
  });

  return { nodes, links };
}

export function getAIInsights(): AIAgentState {
  const allSparks = Array.from(sparks.values());
  const active = allSparks.filter((s) => s.status === "active");
  const insights: AIInsight[] = [];

  active.forEach((s) => {
    const remaining = IGNITE_THRESHOLD - s.backerIds.length;
    if (remaining === 1) {
      insights.push({
        id: `ai_${s.id}`, type: "almost_ignited",
        message: `"${s.title}" needs just 1 more backer to ignite! ${Math.round((s.raised / s.goal) * 100)}% funded.`,
        confidence: 0.95, sparkId: s.id, createdAt: Date.now(), isAI: true,
      });
    }
  });

  active.filter((s) => s.backerIds.length === 0).forEach((s) => {
    insights.push({
      id: `ai_new_${s.id}`, type: "new_spark",
      message: `"${s.title}" just launched — be the first to back it!`,
      confidence: 0.7, sparkId: s.id, createdAt: Date.now(), isAI: true,
    });
  });

  const ignitedCount = allSparks.filter((s) => s.status === "ignited").length;
  const score = Math.min(100, Math.round((ignitedCount / Math.max(allSparks.length, 1)) * 100 + active.length * 10));

  return {
    insights: insights.slice(0, 5), lastAnalysis: Date.now(),
    communityScore: score,
    trendDirection: backings.length > 5 ? "rising" : backings.length > 2 ? "stable" : "falling",
  };
}

export function subscribe(callback: Subscriber) {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

function broadcast(event: string, data: unknown) {
  subscribers.forEach((cb) => { try { cb(event, data); } catch { subscribers.delete(cb); } });
}
