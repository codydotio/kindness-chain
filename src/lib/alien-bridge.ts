/**
 * Alien Mini App Bridge — Real SDK Integration
 *
 * Uses @alien_org/bridge for low-level communication with the Alien host app.
 * The host app injects a JWT token that identifies the verified human user.
 *
 * Mock mode: Works standalone in any browser for development
 * Real mode: Runs inside the Alien App WebView with real identity + payments
 */

import type { AlienIdentityResult, AlienPaymentResult } from "./types";

const IS_MOCK = process.env.NEXT_PUBLIC_ALIEN_MODE !== "real";

// ============= MOCK HELPERS =============

const MOCK_NAMES = [
  "Starlight", "Moonbeam", "Sunflower", "Raindrop", "Snowflake",
  "Firefly", "Breeze", "Coral", "Willow", "Clover",
];

function getOrCreateMockIdentity(): { id: string; name: string } {
  if (typeof window === "undefined") {
    return { id: `alien_server`, name: "ServerUser" };
  }
  const stored = localStorage.getItem("alien_mock_identity");
  if (stored) {
    try { return JSON.parse(stored); } catch { /* fall through */ }
  }
  const id = `alien_${Math.random().toString(36).slice(2, 10)}`;
  const name = MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)];
  const identity = { id, name };
  localStorage.setItem("alien_mock_identity", JSON.stringify(identity));
  return identity;
}

function simulateDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Generate a deterministic "avatar color" from an ID
export function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 60%)`;
}

// ============= IDENTITY =============

export async function verifyIdentity(): Promise<AlienIdentityResult> {
  if (IS_MOCK) {
    await simulateDelay(1500);
    const mock = getOrCreateMockIdentity();
    return {
      success: true,
      alienId: mock.id,
      displayName: mock.name,
      proofOfHuman: true,
    };
  }

  // 🚀 REAL ALIEN MINI APP — Identity via Bridge
  // The host app injects JWT via window.__ALIEN_AUTH_TOKEN__
  // AlienProvider reads it automatically via useAlien() hook
  // On the backend, verify with @alien_org/auth-client
  try {
    // Dynamic import — Module available at runtime inside Alien App
    const bridge = await (Function('return import("@alien_org/bridge")')());
    const { isBridgeAvailable, getLaunchParams } = bridge;

    if (!isBridgeAvailable()) {
      return { success: false, alienId: "", displayName: "", proofOfHuman: false };
    }

    const params = getLaunchParams();
    if (!params?.authToken) {
      return { success: false, alienId: "", displayName: "", proofOfHuman: false };
    }

    // Decode the JWT to get the user's Alien ID (sub claim)
    const payload = JSON.parse(atob(params.authToken.split(".")[1]));
    const alienId = payload.sub;

    return {
      success: true,
      alienId,
      displayName: `Human ${alienId.slice(0, 6)}`,
      proofOfHuman: true,
    };
  } catch (err) {
    console.error("Alien bridge identity error:", err);
    return { success: false, alienId: "", displayName: "", proofOfHuman: false };
  }
}

// ============= PAYMENTS =============

export async function sendPayment(
  recipientAlienId: string,
  amount: number,
  memo: string
): Promise<AlienPaymentResult> {
  if (IS_MOCK) {
    await simulateDelay(2000);
    return {
      success: true,
      txHash: `tx_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      amount,
      recipient: recipientAlienId,
    };
  }

  // 🚀 REAL ALIEN MINI APP — Payments via Bridge
  // Uses the usePayment() hook in React components (preferred)
  // Or request() from @alien_org/bridge directly:
  try {
    // Dynamic import — Module available at runtime inside Alien App
    const bridge = await (Function('return import("@alien_org/bridge")')());
    const { request } = bridge;

    const invoice = `kc-gift-${Date.now().toString(36)}`;

    const response = await request(
      "payment:request",
      {
        recipient: recipientAlienId,
        amount: String(amount * 1000000), // Convert to smallest unit (microUSDC)
        token: "ALIEN",
        network: "alien",
        invoice,
        item: {
          title: `Kindness Gift: ${memo.slice(0, 30)}`,
          iconUrl: "https://kindness-chain.vercel.app/icon.png",
          quantity: 1,
        },
      },
      "payment:response",
      { timeout: 120000 }
    );

    if (response.status === "paid") {
      return {
        success: true,
        txHash: response.txHash || invoice,
        amount,
        recipient: recipientAlienId,
      };
    }
    return {
      success: false,
      txHash: "",
      amount: 0,
      recipient: recipientAlienId,
    };
  } catch (err) {
    console.error("Alien bridge payment error:", err);
    return {
      success: false,
      txHash: "",
      amount: 0,
      recipient: recipientAlienId,
    };
  }
}

// ============= BRIDGE STATUS =============

export function isAlienBridgeAvailable(): boolean {
  if (typeof window === "undefined") return false;
  if (IS_MOCK) return true;

  try {
    // Check for the bridge by looking for injected globals
    const w = window as any;
    return !!(w.__ALIEN_AUTH_TOKEN__ || w.__ALIEN_BRIDGE__);
  } catch {
    return false;
  }
}
