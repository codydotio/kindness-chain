/**
 * 🚀 ALIEN SSO INTEGRATION — READY FOR HACKATHON DAY
 *
 * This file contains the real Alien SSO SDK integration and step-by-step setup.
 *
 * === QUICK START ===
 * At the hackathon:
 * 1. npm install @alien_org/sso-sdk-core @alien_org/sso-sdk-react
 * 2. Register at dev.alien.org/dashboard to get your providerAddress
 * 3. Set NEXT_PUBLIC_ALIEN_PROVIDER_ADDRESS in .env.local
 * 4. Uncomment imports in src/lib/alien-bridge.ts (verifyIdentity() function)
 * 5. Set NEXT_PUBLIC_ALIEN_MODE=real in .env.local
 * 6. Test with npm run dev
 *
 * === WHAT THE SSO SDK DOES ===
 * The Alien SSO SDK provides:
 * - OIDC (OpenID Connect) + PKCE authentication flow
 * - Zero-knowledge identity proof (user proves they're human without revealing private keys)
 * - Deep link generation for opening the Alien app
 * - Polling-based auth (QR code or link click → user opens Alien app → approval → token returned)
 * - Token storage and automatic refresh
 * - Subject (sub claim) extraction = unique Alien ID for the user
 *
 * === ARCHITECTURE ===
 * Client (Kindness Chain App)
 *     ↓ (1. Generate deep link + polling code)
 * AlienSsoClient
 *     ↓ (2. User opens Alien app via deep link)
 * Alien App (on user's phone/desktop)
 *     ↓ (3. User approves → sends authorization code)
 * AlienSsoClient.pollAuth()
 *     ↓ (4. Exchange code for tokens)
 * AlienSsoClient.exchangeToken()
 *     ↓ (5. Token stored in localStorage, user is authenticated)
 * client.getSubject() → "alien_123abc..." (unique user ID)
 *
 * ============================================
 * STEP 1: CORE CLIENT SETUP
 * ============================================
 *
 * import { AlienSsoClient } from '@alien_org/sso-sdk-core';
 * import type {
 *   AuthorizeResponse,
 *   PollResponse,
 *   TokenResponse,
 *   TokenInfo,
 * } from '@alien_org/sso-sdk-core';
 *
 * const PROVIDER_ADDRESS = process.env.NEXT_PUBLIC_ALIEN_PROVIDER_ADDRESS || '';
 *
 * let clientInstance: AlienSsoClient | null = null;
 *
 * export function getAlienClient(): AlienSsoClient {
 *   if (!clientInstance) {
 *     clientInstance = new AlienSsoClient({
 *       providerAddress: PROVIDER_ADDRESS,
 *       ssoBaseUrl: 'https://sso.alien.org', // optional, has default
 *     });
 *   }
 *   return clientInstance;
 * }
 *
 * ============================================
 * STEP 2: IDENTITY VERIFICATION (OIDC + PKCE)
 * ============================================
 *
 * export async function alienVerifyIdentity(): Promise<{
 *   success: boolean;
 *   alienId: string;
 *   proofOfHuman: boolean;
 * }> {
 *   const client = getAlienClient();
 *
 *   // ─────────────────────────────────────────────────────────
 *   // Check if already authenticated
 *   // ─────────────────────────────────────────────────────────
 *   const existingSub = client.getSubject();
 *   if (existingSub) {
 *     // Token exists and is valid
 *     return { success: true, alienId: existingSub, proofOfHuman: true };
 *   }
 *
 *   // ─────────────────────────────────────────────────────────
 *   // Try refresh if we have a refresh token
 *   // ─────────────────────────────────────────────────────────
 *   if (client.hasRefreshToken()) {
 *     try {
 *       await client.refreshAccessToken();
 *       const sub = client.getSubject();
 *       if (sub) {
 *         return { success: true, alienId: sub, proofOfHuman: true };
 *       }
 *     } catch {
 *       // Refresh failed, fall through to new auth
 *     }
 *   }
 *
 *   // ─────────────────────────────────────────────────────────
 *   // Start new OIDC auth flow
 *   // ─────────────────────────────────────────────────────────
 *   const { deep_link, polling_code } = await client.generateDeeplink();
 *   console.log('Deep link generated, polling code:', polling_code);
 *
 *   // ─────────────────────────────────────────────────────────
 *   // Option A: Open deep link in new window (user clicks Alien app icon)
 *   // ─────────────────────────────────────────────────────────
 *   window.open(deep_link, '_blank');
 *
 *   // OR
 *
 *   // ─────────────────────────────────────────────────────────
 *   // Option B: Show QR code for scanning (deep_link can be encoded as QR)
 *   // ─────────────────────────────────────────────────────────
 *   // const qrCodeUrl = `https://qr.alien.org/generate?url=${encodeURIComponent(deep_link)}`;
 *   // displayQRCode(qrCodeUrl);
 *
 *   // ─────────────────────────────────────────────────────────
 *   // Poll for authorization (user opens Alien app and approves)
 *   // ─────────────────────────────────────────────────────────
 *   const MAX_POLLS = 60; // 2 minutes max (60 * 2 seconds = 120 seconds)
 *   for (let i = 0; i < MAX_POLLS; i++) {
 *     // Wait 2 seconds before each poll
 *     await new Promise(resolve => setTimeout(resolve, 2000));
 *
 *     const pollResult = await client.pollAuth(polling_code);
 *     console.log(`Poll ${i + 1}/${MAX_POLLS}: status = ${pollResult.status}`);
 *
 *     if (pollResult.status === 'authorized' && pollResult.authorization_code) {
 *       // ───────────────────────────────────────────────────────
 *       // User approved! Exchange code for tokens
 *       // ───────────────────────────────────────────────────────
 *       const tokenResponse = await client.exchangeToken(
 *         pollResult.authorization_code
 *       );
 *       console.log('Token exchange successful, user ID:', tokenResponse.id_token);
 *
 *       // Tokens are now stored in localStorage
 *       const sub = client.getSubject();
 *       if (sub) {
 *         return {
 *           success: true,
 *           alienId: sub,
 *           proofOfHuman: true,
 *         };
 *       }
 *     }
 *
 *     if (pollResult.status === 'rejected') {
 *       console.log('User rejected the auth request');
 *       return { success: false, alienId: '', proofOfHuman: false };
 *     }
 *
 *     if (pollResult.status === 'expired') {
 *       console.log('Auth flow expired (polling_code timed out)');
 *       return { success: false, alienId: '', proofOfHuman: false };
 *     }
 *
 *     // Still pending, continue polling...
 *   }
 *
 *   // Timeout: never got authorization
 *   console.log('Auth flow timed out after 2 minutes');
 *   return { success: false, alienId: '', proofOfHuman: false };
 * }
 *
 * ============================================
 * STEP 3: REACT PROVIDER WRAPPER (optional)
 * ============================================
 *
 * If you want to use the React hooks from @alien_org/sso-sdk-react:
 *
 * In src/app/layout.tsx:
 * ─────────────────────────────────────────────────────────
 *
 * import { AlienSsoProvider } from '@alien_org/sso-sdk-react';
 *
 * const PROVIDER_ADDRESS = process.env.NEXT_PUBLIC_ALIEN_PROVIDER_ADDRESS || '';
 *
 * export default function RootLayout({
 *   children,
 * }: {
 *   children: React.ReactNode;
 * }) {
 *   return (
 *     <html lang="en">
 *       <body>
 *         <AlienSsoProvider config={{ providerAddress: PROVIDER_ADDRESS }}>
 *           {children}
 *         </AlienSsoProvider>
 *       </body>
 *     </html>
 *   );
 * }
 *
 * Then in components:
 * ─────────────────────────────────────────────────────────
 *
 * import { useAuth } from '@alien_org/sso-sdk-react';
 *
 * export function MyComponent() {
 *   const { auth, openModal, logout, verifyAuth, client } = useAuth();
 *
 *   // auth.isAuthenticated — boolean
 *   // auth.token — access token
 *   // auth.tokenInfo?.sub — Alien ID (same as client.getSubject())
 *
 *   if (auth.isAuthenticated) {
 *     return (
 *       <div>
 *         <p>Authenticated as: {auth.tokenInfo?.sub}</p>
 *         <button onClick={logout}>Logout</button>
 *       </div>
 *     );
 *   }
 *
 *   return (
 *     <button onClick={openModal}>
 *       Connect Alien Identity
 *     </button>
 *   );
 * }
 *
 * ============================================
 * STEP 4: GET USER INFO FROM TOKEN
 * ============================================
 *
 * export async function getUserInfo(client: AlienSsoClient) {
 *   // Option 1: Get from client (fastest)
 *   const sub = client.getSubject(); // 'alien_123abc...'
 *   const authData = client.getAuthData(); // Full JWT payload
 *   // { iss, sub, aud, exp, iat }
 *
 *   // Option 2: Call verifyAuth to fetch from server
 *   const userInfo = await client.verifyAuth();
 *   // { sub: 'alien_123abc...' }
 * }
 *
 * ============================================
 * STEP 5: PAYMENTS (ALIEN WALLET — SEPARATE API)
 * ============================================
 *
 * NOTE: The SSO SDK only handles IDENTITY.
 * Payments use the Alien Wallet JS Bridge (a different API, injected in WebView).
 *
 * The Wallet Bridge will be available as:
 * - (window as any).AlienWallet
 * - (window as any).alien?.wallet
 *
 * When available, it will have methods like:
 *
 * const wallet = (window as any).AlienWallet;
 * const tx = await wallet.sendPayment({
 *   to: recipientAlienId,        // recipient's Alien ID
 *   amount: 10.5,                // amount in ALIEN or USDC
 *   currency: 'ALIEN',           // 'ALIEN' | 'USDC' | 'USDT' | ...
 *   memo: 'For your kindness',   // optional transaction note
 * });
 *
 * // tx = {
 * //   success: true,
 * //   transactionHash: '0x...',
 * //   amount: 10.5,
 * //   to: recipientAlienId,
 * // }
 *
 * ⚠️  GET THE EXACT API FROM THE HACKATHON SDK DOCUMENTATION ⚠️
 * The Wallet API shape might differ from the above.
 *
 * ============================================
 * STEP 6: LOGOUT
 * ============================================
 *
 * export async function alienLogout() {
 *   const client = getAlienClient();
 *   client.logout(); // Clears localStorage tokens
 * }
 *
 * ============================================
 * TYPES PROVIDED BY THE SDK
 * ============================================
 *
 * interface AuthorizeResponse {
 *   deep_link: string;      // URL to open in Alien app
 *   polling_code: string;   // Code to use with pollAuth()
 *   expired_at: number;     // Unix timestamp when polling expires
 * }
 *
 * type PollStatus = 'pending' | 'authorized' | 'rejected' | 'expired';
 *
 * interface PollResponse {
 *   status: PollStatus;
 *   authorization_code?: string; // Only present if status === 'authorized'
 * }
 *
 * interface TokenResponse {
 *   access_token: string;
 *   token_type: string;     // Usually 'Bearer'
 *   expires_in: number;     // Seconds until expiry
 *   id_token?: string;      // Optional: OIDC ID token
 *   refresh_token: string;  // For token refresh
 * }
 *
 * interface UserInfoResponse {
 *   sub: string;            // Unique Alien user ID
 * }
 *
 * interface TokenInfo {
 *   iss: string;            // Issuer (Alien)
 *   sub: string;            // Subject (user's Alien ID)
 *   aud: string | string[]; // Audience (your provider address)
 *   exp: number;            // Expiration (Unix timestamp)
 *   iat: number;            // Issued At (Unix timestamp)
 * }
 *
 * ============================================
 * DEBUGGING CHECKLIST
 * ============================================
 *
 * ✓ npm install succeeded?
 *   → npm ls @alien_org/sso-sdk-core
 *
 * ✓ NEXT_PUBLIC_ALIEN_PROVIDER_ADDRESS is set?
 *   → cat .env.local | grep PROVIDER_ADDRESS
 *   → Should NOT be "your_provider_address_here"
 *
 * ✓ NEXT_PUBLIC_ALIEN_MODE=real in .env.local?
 *   → cat .env.local | grep ALIEN_MODE
 *
 * ✓ Uncommented the real code in alien-bridge.ts?
 *   → Check src/lib/alien-bridge.ts verifyIdentity() function
 *
 * ✓ Browser console errors?
 *   → Open DevTools → Console tab
 *   → Look for "AlienSsoClient is not defined"
 *   → Check that imports are uncommented
 *
 * ✓ Deep link not opening Alien app?
 *   → Make sure you're running in Alien's WebView (not regular browser)
 *   → Or use QR code scanning instead
 *   → Test with: npm run dev → navigate to http://localhost:3000
 *
 * ✓ Polling times out?
 *   → User took too long to open Alien app (>2 minutes)
 *   → Increase MAX_POLLS if needed
 *   → Or show a timeout message and offer to retry
 *
 * ✓ Token not stored in localStorage?
 *   → Check browser DevTools → Application → Storage → Local Storage
 *   → Should see entries like "alien_sso_token", "alien_sso_refresh"
 *   → If missing, exchangeToken() may have failed
 *
 * ============================================
 * TROUBLESHOOTING ERRORS
 * ============================================
 *
 * "AlienSsoClient is not defined"
 * → SDK not installed: npm install @alien_org/sso-sdk-core
 *
 * "providerAddress is required"
 * → Env var not set: check NEXT_PUBLIC_ALIEN_PROVIDER_ADDRESS in .env.local
 * → Must match the address from dev.alien.org/dashboard
 *
 * "polling_code expired"
 * → User didn't approve within 5 minutes
 * → Restart the flow: generate new deep_link
 *
 * "Token exchange failed"
 * → authorization_code is invalid or expired
 * → Restart the auth flow
 *
 * "Cannot read property 'getSubject' of null"
 * → Token not stored yet, or exchangeToken() never completed
 * → Make sure you're calling exchangeToken() after pollAuth succeeds
 *
 * ============================================
 * NEXT STEPS AFTER SSO IS WORKING
 * ============================================
 *
 * 1. Test the full auth flow:
 *    npm run dev
 *    → Click "Verify Identity" button
 *    → Approve in Alien app
 *    → You should see your Alien ID displayed
 *
 * 2. Integrate the Wallet Bridge for payments:
 *    → Ask SDK team for Wallet JS Bridge docs
 *    → Uncomment payment code in src/lib/alien-bridge.ts
 *    → Test sending a payment
 *
 * 3. (Optional) Use React hooks instead of direct client calls:
 *    → Import AlienSsoProvider and useAuth() from @alien_org/sso-sdk-react
 *    → Wrap layout.tsx with provider
 *    → Use hooks in components (cleaner integration)
 *
 * 4. Add error boundaries and user feedback:
 *    → Show loading spinner during polling
 *    → Show error message if auth fails
 *    → Offer "Retry" button
 *
 * Good luck! 🚀
 */

export {};
