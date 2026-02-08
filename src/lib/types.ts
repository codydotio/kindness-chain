// ============================================================
// KINDNESS CHAIN — Type Definitions
// Alien.org Hackathon @ Frontier Tower, Feb 8 2026
// ============================================================

export interface AlienUser {
  id: string;
  alienId: string; // Alien verified identity
  displayName: string;
  avatar?: string; // Generated from alienId hash
  verified: boolean;
  createdAt: number;
}

export interface KindnessGift {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number; // tokens
  note: string; // required — the "why"
  createdAt: number;
  txHash?: string; // Alien Wallet transaction hash
}

export interface ChainNode {
  id: string;
  name: string;
  avatar?: string;
  kindnessGiven: number;
  kindnessReceived: number;
  totalGifts: number;
  verified: boolean;
}

export interface ChainLink {
  source: string;
  target: string;
  amount: number;
  note: string;
  createdAt: number;
}

export interface ChainData {
  nodes: ChainNode[];
  links: ChainLink[];
}

export interface FeedItem {
  id: string;
  fromName: string;
  toName: string;
  fromAvatar?: string;
  toAvatar?: string;
  amount: number;
  note: string;
  createdAt: number;
}

export interface UserStats {
  balance: number;
  giftsGiven: number;
  giftsReceived: number;
  chainLength: number; // longest chain this user is part of
}

// SSE event types
export type SSEEventType = "gift" | "user_joined" | "chain_update";

export interface SSEEvent {
  type: SSEEventType;
  data: FeedItem | ChainNode | ChainData;
  timestamp: number;
}

// Alien Bridge types — these map to the Alien JS Bridge API
// HACKATHON NOTE: Replace mock implementations with real Alien SDK calls
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

// ============================================================
// AI AGENT TYPES — AI Kindness Matchmaker
// ============================================================

export interface AIInsight {
  id: string;
  type: "match" | "prompt" | "trend";
  message: string;
  confidence: number; // 0-1
  suggestedRecipient?: string;
  suggestedNote?: string;
  createdAt: number;
  isAI: true; // always true - trust marker
}

export interface AIAgentState {
  insights: AIInsight[];
  lastAnalysis: number;
  communityKindnessScore: number; // 0-100
  trendDirection: "rising" | "falling" | "stable";
}
