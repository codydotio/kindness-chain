// ============================================================
// IGNITE — Type Definitions
// Alien.org Hackathon @ Frontier Tower, Feb 8 2026
// ============================================================

export interface AlienUser {
  id: string;
  alienId: string;
  displayName: string;
  avatar?: string;
  verified: boolean;
  createdAt: number;
}

export type SparkCategory = "cause" | "art" | "tech" | "community" | "other";

export interface Spark {
  id: string;
  creatorId: string;
  creatorName: string;
  title: string;
  description: string;
  category: SparkCategory;
  goal: number;
  raised: number;
  backerIds: string[];
  status: "active" | "ignited" | "completed";
  createdAt: number;
  ignitedAt?: number;
}

export interface Backing {
  id: string;
  sparkId: string;
  sparkTitle: string;
  backerId: string;
  backerName: string;
  amount: number;
  note?: string;
  createdAt: number;
  txHash?: string;
}

export interface FeedItem {
  id: string;
  type: "backing" | "spark_created" | "spark_ignited";
  sparkId: string;
  sparkTitle: string;
  actorName: string;
  amount?: number;
  note?: string;
  createdAt: number;
}

export interface UserStats {
  balance: number;
  sparksCreated: number;
  sparksBacked: number;
  totalContributed: number;
}

export interface ChainNode {
  id: string;
  name: string;
  type: "user" | "spark";
  totalActivity: number;
  raised?: number;
  goal?: number;
  status?: string;
  verified?: boolean;
}

export interface ChainLink {
  source: string;
  target: string;
  amount: number;
  createdAt: number;
}

export interface ChainData {
  nodes: ChainNode[];
  links: ChainLink[];
}

// SSE
export type SSEEventType = "backing" | "spark_created" | "spark_ignited" | "user_joined";

export interface SSEEvent {
  type: SSEEventType;
  data: unknown;
  timestamp: number;
}

// Alien Bridge types
export interface AlienIdentityResult {
  success: boolean;
  alienId: string;
  displayName: string;
  proofOfHuman: boolean;
}

export interface AlienPaymentResult {
  success: boolean;
  txHash: string;
  amount?: number;
  recipient?: string;
}

// AI Agent
export interface AIInsight {
  id: string;
  type: "trending" | "almost_ignited" | "new_spark";
  message: string;
  confidence: number;
  sparkId?: string;
  createdAt: number;
  isAI: true;
}

export interface AIAgentState {
  insights: AIInsight[];
  lastAnalysis: number;
  communityScore: number;
  trendDirection: "rising" | "falling" | "stable";
}

export const IGNITE_THRESHOLD = 3; // unique backers needed to ignite
export const INITIAL_BALANCE = 10;
export const CATEGORY_EMOJI: Record<SparkCategory, string> = {
  cause: "🌍",
  art: "🎨",
  tech: "⚡",
  community: "🤝",
  other: "✨",
};
