// ============================================================
// ALIEN SSO BRIDGE — Abstraction Layer
// ============================================================
//
// 🚀 HACKATHON SWAP POINT 🚀
// This file abstracts the Alien SSO integration so you can:
//   1. Use MOCK mode for local dev (works right now)
//   2. Swap to REAL mode using the Alien SSO SDK
//
// The Alien SSO SDK provides:
//   - Identity verification via OIDC + PKCE (zero-knowledge proof)
//   - Polling-based auth flow with QR code / deep link
//   - Token management and automatic refresh
//
// To switch to real mode:
//   1. npm install @alien_org/sso-sdk-core @alien_org/sso-sdk-react
//   2. Set NEXT_PUBLIC_ALIEN_PROVIDER_ADDRESS in .env.local
//   3. Set NEXT_PUBLIC_ALIEN_MODE=real in .env.local
//   4. Uncomment the real imports/implementation below
//
// See src/lib/alien-sso-integration.ts for the full integration guide.
// ============================================================

import type { AlienIdentityResult, AlienPaymentResult } from "./types";

// ============================================================
// REAL MODE: Uncomment when ready to use the Alien SSO SDK
// ============================================================
// import { AlienSsoClient } from '@alien_org/sso-sdk-core';
// type AlienSsoClient = typeof AlienSsoClient;

const IS_MOCK = process.env.NEXT_PUBLIC_ALIEN_MODE !== "real";

// SDK client instance (lazy-initialized in real mode)
let _ssoClient: any = null;

/**
 * Get or create the AlienSsoClient instance.
 * Only used in real mode after SDK is installed.
 */
// function getAlienSsoClient(): AlienSsoClient {
//   if (!_ssoClient) {
//     const { AlienSsoClient } = require('@alien_org/sso-sdk-core');
//     _ssoClient = new AlienSsoClient({
//       providerAddress: process.env.NEXT_PUBLIC_ALIEN_PROVIDER_ADDRESS || '',
//     });
//   }
//   return _ssoClient;
// }

// Generate a deterministic "avatar color" from an ID
export function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 60%)`;
}

// Generate a random human-like name for mock mode
const MOCK_NAMES = [
  "Aria", "Zephyr", "Juniper", "Caspian", "Lyric", "Phoenix",
  "Indigo", "Soleil", "Orion", "Meadow", "Jasper", "Coral",
  "Sterling", "Dahlia", "Kieran", "Briar", "Rowan", "Celeste",
];

function randomMockName(): string {
  return MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)];
}

// ============================================================
// IDENTITY VERIFICATION
// ============================================================

export async function verifyIdentity(): Promise<AlienIdentityResult> {
  if (IS_MOCK) {
    // 🧪 MOCK: Simulate Alien identity verification
    await simulateDelay(1500);
    const mockId = `alien_${Date.now().toString(36)}`;
    return {
      success: true,
      alienId: mockId,
      displayName: randomMockName(),
      proofOfHuman: true,
    };
  }

  // ============================================================
  // 🚀 REAL MODE: ALIEN SSO SDK INTEGRATION
  // ============================================================
  // Once you've:
  //   1. npm install @alien_org/sso-sdk-core
  //   2. Set NEXT_PUBLIC_ALIEN_PROVIDER_ADDRESS in .env.local
  //   3. Set NEXT_PUBLIC_ALIEN_MODE=real in .env.local
  //
  // Uncomment the code below:
  //
  // const { AlienSsoClient } = require('@alien_org/sso-sdk-core');
  // const client = new AlienSsoClient({
  //   providerAddress: process.env.NEXT_PUBLIC_ALIEN_PROVIDER_ADDRESS || '',
  // });
  //
  // // Check if already authenticated
  // const existingSub = client.getSubject();
  // if (existingSub) {
  //   return {
  //     success: true,
  //     alienId: existingSub,
  //     displayName: `Human ${existingSub.slice(0, 6)}`,
  //     proofOfHuman: true,
  //   };
  // }
  //
  // // Start new OIDC auth flow
  // const { deep_link, polling_code } = await client.generateDeeplink();
  //
  // // Open Alien app for verification
  // window.open(deep_link, '_blank');
  //
  // // Poll for authorization (max 2 minutes)
  // const MAX_POLLS = 60;
  // for (let i = 0; i < MAX_POLLS; i++) {
  //   await new Promise(r => setTimeout(r, 2000));
  //   const pollResult = await client.pollAuth(polling_code);
  //
  //   if (pollResult.status === 'authorized' && pollResult.authorization_code) {
  //     await client.exchangeToken(pollResult.authorization_code);
  //     const sub = client.getSubject();
  //     if (sub) {
  //       return {
  //         success: true,
  //         alienId: sub,
  //         displayName: `Human ${sub.slice(0, 6)}`,
  //         proofOfHuman: true,
  //       };
  //     }
  //   }
  //
  //   if (pollResult.status === 'rejected' || pollResult.status === 'expired') {
  //     return { success: false, alienId: '', displayName: '', proofOfHuman: false };
  //   }
  // }
  //
  // return { success: false, alienId: '', displayName: '', proofOfHuman: false };
  // ============================================================

  throw new Error(
    "Real Alien SSO integration not active. Make sure you've: " +
    "1) npm install @alien_org/sso-sdk-core, " +
    "2) set NEXT_PUBLIC_ALIEN_PROVIDER_ADDRESS, " +
    "3) set NEXT_PUBLIC_ALIEN_MODE=real, " +
    "4) uncommented the real mode code in alien-bridge.ts"
  );
}

// ============================================================
// PAYMENTS
// ============================================================

export async function sendPayment(
  recipientAlienId: string,
  amount: number,
  memo: string
): Promise<AlienPaymentResult> {
  if (IS_MOCK) {
    // 🧪 MOCK: Simulate Alien Wallet payment
    // Supports both Aliencoin and stablecoins (USDC, USDT, etc.)
    await simulateDelay(1000);
    return {
      success: true,
      txHash: `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`,
      amount,
      recipient: recipientAlienId,
    };
  }

  // ============================================================
  // 🚀 REAL MODE: ALIEN WALLET INTEGRATION
  // ============================================================
  // NOTE: The SSO SDK handles identity only.
  // Payments use the Alien Wallet JS Bridge (injected via WebView).
  //
  // The Wallet Bridge is a separate API from SSO.
  // It will be injected into the WebView as (window as any).AlienWallet
  //
  // Uncomment when you get the Wallet API docs:
  //
  // const wallet = (window as any).AlienWallet || (window as any).alien?.wallet;
  // if (!wallet) {
  //   return { success: false, txHash: '', amount: 0, recipient: '' };
  // }
  //
  // const result = await wallet.sendPayment({
  //   to: recipientAlienId,
  //   amount: amount,
  //   memo: memo,
  //   currency: 'ALIEN', // or 'USDC', 'USDT' for stablecoins
  // });
  //
  // return {
  //   success: result.success || false,
  //   txHash: result.transactionHash || result.txHash || '',
  //   amount: result.amount || amount,
  //   recipient: result.to || recipientAlienId,
  // };
  //
  // The Wallet handles the entire UX (confirmation dialog, signing, etc).
  // Supports both native Aliencoin and stablecoins (USDC, USDT, etc.)
  // ============================================================

  throw new Error(
    "Real Alien Wallet integration not active. Payments require a separate " +
    "Wallet JS Bridge API (different from SSO). Check the hackathon docs for the Wallet API."
  );
}

// ============================================================
// BRIDGE DETECTION
// ============================================================

export function isAlienBridgeAvailable(): boolean {
  if (typeof window === "undefined") return false;
  if (IS_MOCK) return true;

  // Check for injected bridge object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return !!(w.AlienBridge || w.alien || w.Alien);
}

// ============================================================
// HELPERS
// ============================================================

function simulateDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
