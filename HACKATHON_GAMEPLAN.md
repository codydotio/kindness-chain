# Kindness Chain — Hackathon Game Plan
## Alien.org vs. OpenClaw @ Frontier Tower, Feb 8 2026

---

## Quick Start (on your machine)

```bash
cd kindness-chain
npm install
npm run dev
# Opens at http://localhost:3000
```

## Deploy to Vercel (needed by 4:00 PM)

```bash
npx vercel          # First time: follow prompts
npx vercel --prod   # Production deploy
```

Your production URL is your submission URL.

---

## What This App Does

**Kindness Chain** is a pay-it-forward micro-economy for verified humans.

1. Every verified human gets **5 kindness tokens**
2. You **MUST gift them** to other verified humans with a **note explaining why**
3. The chain grows as a beautiful **interactive force-directed graph**
4. Real-time feed shows kindness flowing through the community

**Why it wins "Most Human App":**
- Kindness is the most fundamentally human act
- The required note forces genuine human connection
- The visualization makes the invisible (human kindness) visible
- Uses BOTH Identity (Sybil-resistant — one human, one chain) AND Payments (tokens flow through the Alien Wallet)

---

## Architecture

```
src/
├── app/
│   ├── page.tsx            ← Main page (onboarding → dashboard)
│   ├── layout.tsx          ← Root layout + metadata
│   ├── globals.css         ← Tailwind + custom styles
│   └── api/
│       ├── verify/route.ts ← Register verified user
│       ├── gift/route.ts   ← Create a kindness gift
│       ├── chain/route.ts  ← Get chain graph data
│       ├── feed/route.ts   ← Get recent gifts feed
│       └── events/route.ts ← SSE for real-time updates
├── components/
│   ├── OnboardingScreen.tsx ← Identity verification flow
│   ├── Dashboard.tsx        ← Main app with stats + tabs
│   ├── KindnessGraph.tsx    ← D3.js force graph (THE HERO)
│   ├── GiftModal.tsx        ← Gift sending modal
│   └── Feed.tsx             ← Recent kindness feed
├── hooks/
│   └── useAlien.ts          ← React hooks for Alien bridge + SSE
└── lib/
    ├── types.ts             ← TypeScript types
    ├── store.ts             ← In-memory data store + seed data
    └── alien-bridge.ts      ← 🚨 ALIEN SDK SWAP POINT 🚨
```

---

## 🚨 HACKATHON DAY: Alien SDK Integration

### Step 1: Get the SDK docs at 10:30 AM keynote

### Step 2: Open `src/lib/alien-bridge.ts`

This file has two clearly marked sections:
- `verifyIdentity()` — swap mock for real Alien JS Bridge identity call
- `sendPayment()` — swap mock for real Alien Wallet payment call

### Step 3: Set env var
```bash
# In .env.local, change:
NEXT_PUBLIC_ALIEN_MODE=real
```

### Step 4: The JS Bridge pattern will likely be:
```typescript
// Identity
const bridge = window.AlienBridge || window.alien;
const result = await bridge.verifyIdentity();

// Payments
const tx = await bridge.sendPayment({
  to: recipientAlienId,
  amount: amount,
  memo: note,
});
```

Check what they actually expose in the WebView at the keynote.

---

## Timeline Strategy

| Time | Action |
|------|--------|
| **10:00** | Arrive, set up, `npm run dev`, verify it works |
| **10:30** | Keynote: GET THE SDK DOCS. Note exact bridge API. |
| **10:50** | Wire real Alien bridge (should take 15-30 min) |
| **11:30** | Test identity + payments end-to-end in Alien app |
| **12:00** | Polish: add your Alien ID, tweak copy, test on mobile |
| **1:00** | Lunch. Demo to neighbors. Get feedback. |
| **1:30** | Mid-day checkpoint with judges. Show the graph. |
| **2:00** | Iterate based on feedback. Add any missing features. |
| **4:00** | Deploy to Vercel: `npx vercel --prod` |
| **5:30** | Submit manifest + URL. Final testing. |
| **6:00** | Code freeze. Prep 2-min demo pitch. |
| **6:45** | LIVE DEMO. Show the chain on everyone's phones. |

---

## Demo Script (2 minutes)

**Opening (15 sec):**
"In an age of bots and fake accounts, what's the most human thing we can do? Be kind to each other. Kindness Chain makes that real."

**Show (60 sec):**
1. Open app → Verify with Alien ID (Proof-of-Human)
2. Show the chain visualization — "Every dot is a real human. Every line is an act of kindness."
3. Gift tokens to someone → Show the note requirement
4. Watch the chain update in real-time
5. Zoom into a connection → Read the note

**Close (15 sec):**
"One identity per human. Five tokens to share. The only rule: tell them WHY. Kindness Chain — the most human app."

---

## If You Have Extra Time

- [ ] Add notifications when you receive kindness
- [ ] Add a "longest chain" leaderboard
- [ ] Add ability to "amplify" someone's note (reshare)
- [ ] Add stats: total kindness given across the network
- [ ] Sound effects / haptic feedback on mobile
- [ ] "Kindness streak" — consecutive days of giving
