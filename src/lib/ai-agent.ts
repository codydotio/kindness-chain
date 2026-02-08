import type { AIInsight, AIAgentState } from "./types";

const KINDNESS_PROMPTS = [
  "Someone new just joined — a warm welcome can change their whole day",
  "It's been quiet in the chain lately. Start a ripple!",
  "Three people haven't received kindness yet today. Be their first!",
  "Your last gift inspired 2 others. Keep the momentum going!",
  "Try sending kindness to someone you haven't connected with before",
  "A small note of appreciation goes further than you think",
  "The chain is 12 gifts long today. Help it reach 20!",
  "Someone just sent you kindness. Pay it forward?",
];

const MATCH_REASONS = [
  "hasn't received a gift in a while",
  "just joined the community",
  "has been very generous lately — show them appreciation",
  "started a chain that reached 5 people",
  "is having their first day on the canvas",
];

export function generateInsights(users: Array<{id: string; name: string; giftsReceived: number; giftsGiven: number}>, recentGifts: number): AIAgentState {
  const insights: AIInsight[] = [];
  const now = Date.now();

  // Generate match suggestion
  if (users.length > 0) {
    const needyUsers = [...users].sort((a, b) => a.giftsReceived - b.giftsReceived);
    const suggested = needyUsers[0];
    if (suggested) {
      insights.push({
        id: `ai_match_${now}`,
        type: "match",
        message: `${suggested.name} ${MATCH_REASONS[Math.floor(Math.random() * MATCH_REASONS.length)]}`,
        confidence: 0.7 + Math.random() * 0.25,
        suggestedRecipient: suggested.id,
        suggestedNote: undefined,
        createdAt: now,
        isAI: true,
      });
    }
  }

  // Generate kindness prompt
  insights.push({
    id: `ai_prompt_${now}`,
    type: "prompt",
    message: KINDNESS_PROMPTS[Math.floor(Math.random() * KINDNESS_PROMPTS.length)],
    confidence: 0.85,
    createdAt: now,
    isAI: true,
  });

  // Generate trend insight
  const trendDirection = recentGifts > 5 ? "rising" : recentGifts > 2 ? "stable" : "falling";
  const trendMessages: Record<string, string> = {
    rising: `Kindness is spreading! ${recentGifts} gifts in the last round. The community is on fire 🔥`,
    stable: `Steady kindness flow — ${recentGifts} gifts recently. Every one matters.`,
    falling: `The chain could use a spark. Only ${recentGifts} gifts recently. Be the change!`,
  };

  insights.push({
    id: `ai_trend_${now}`,
    type: "trend",
    message: trendMessages[trendDirection],
    confidence: 0.9,
    createdAt: now,
    isAI: true,
  });

  return {
    insights,
    lastAnalysis: now,
    communityKindnessScore: Math.min(100, Math.floor(recentGifts * 8 + users.length * 3)),
    trendDirection,
  };
}

// 🚨 HACKATHON SWAP POINT — OpenClaw Integration 🚨
// At the hackathon, replace this mock with real OpenClaw WebSocket connection:
//
// import WebSocket from 'ws';
// const claw = new WebSocket('ws://127.0.0.1:18789');
// claw.send(JSON.stringify({
//   type: 'tool.invoke',
//   tool: 'kindness-matchmaker',
//   params: { users, recentGifts }
// }));
//
// The OpenClaw agent can use its persistent memory to track
// kindness patterns over time and provide deeper insights.
