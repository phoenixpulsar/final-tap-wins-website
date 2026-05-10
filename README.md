# Final Tap Wins — Website

Landing page for the Final Tap Wins Telegram mini-app game.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview   # preview the production build
```

## CTA Configuration

All call-to-action buttons are driven by a single global variable in `js/main.js`:

```js
window.CTA_LABEL = 'Coming Soon';
```

Change this value to update every CTA across the site. Each button carries a `data-cta` attribute for targeted styling or future per-button labels.

---

# Pre-Launch Roadmap

> **Purpose:** This roadmap serves as a launch-readiness checklist for the Final Tap Wins project across all three repositories (`final-tap-wins-website`, `final-tap-wins-miniapp`, `final-tap-wins-bot`). Each phase must be completed and verified before moving to the next.

> **Last updated:** 2025-05-09

---

## Current Project Status

### What's Built
- [x] Static marketing landing page (website repo)
- [x] Telegram Mini App with TON Connect wallet integration (miniapp repo)
- [x] Auth flow linking Telegram identity to TON wallet (miniapp + bot)
- [x] Credit purchase flow with on-chain verification and retry logic (miniapp + bot)
- [x] Purchase history page (miniapp)
- [x] Telegram bot with `/start`, `/mini`, `/status`, `/clear`, `/stop` commands (bot)
- [x] PostgreSQL schema for users, rooms, room_players, taps, payouts, payments, referrals (bot)
- [x] Rate limiting on both bot commands and payment API (bot)
- [x] Idempotent payment processing with replay protection (bot)
- [x] Dev-only `/api/payments/direct` endpoint gated behind `RACK_ENV` (bot)

### What's Missing (Blockers)
- [ ] Game UI — mini app landing page says "Coming Soon"; no room/tap/results screens
- [ ] Game API endpoints — no HTTP routes for room creation, joining, tapping, or finishing
- [ ] Room timer background job — no process to detect expired rooms and trigger completion
- [ ] Payout execution — `payouts` table exists but no code to sign/send TON transactions
- [ ] Automated TON signing — no private key handling, transaction building, or broadcast logic
- [ ] Two-wallet architecture — single hardcoded wallet, no hot/cold separation
- [ ] Test suite — zero test files across all three repos
- [ ] Production access barrier — anyone can discover the app during testing
- [ ] Payout state machine — statuses defined in schema but no transition logic
- [ ] Production reset plan — no documented process for wiping test data

### Known Issues
- `MINI_APP_URL` default in `config/environment.rb` points to `bot-one-miniapp` instead of `final-tap-wins-miniapp`
- `paymentService.ts` sends `telegram_chat_id` in some interfaces but the backend expects `telegram_user_id` — verify field mapping
- `payouts` table status enum is `('pending','processing','sent','failed')` — needs `confirmed` and `manual_review` states for the state machine

---

## Phase 0: Pre-Testing Infrastructure

### 0.1 Production Testing Access Barrier
> Prevent random users from discovering the app during production testing.

- [ ] Implement a passcode gate screen in the miniapp that appears before the wallet connect / landing page
- [ ] The gate should display:
  ```
  ⚠️ Private Test Environment
  Access is limited to approved testers only.
  Do not use real funds unless explicitly instructed.
  Enter access code to continue:
  ```
- [ ] Store the passcode in an environment variable (`VITE_TEST_ACCESS_CODE`) so it can be rotated without code changes
- [ ] On correct passcode entry, set a `sessionStorage` flag so the user doesn't have to re-enter it during the same session
- [ ] The gate component should be removable by:
  1. Deleting the gate component from the route
  2. Or setting `VITE_TEST_ACCESS_CODE` to an empty string to disable it
- [ ] Document the passcode location and rotation process in the miniapp repo README
- [ ] **Where to configure:** `final-tap-wins-miniapp/.env.production` → `VITE_TEST_ACCESS_CODE=<your-code>`

### 0.2 Production Reset / Wipe Plan
> Ensure clean production state before real testing begins.

**Pre-Wipe Checklist:**
- [ ] Back up the production PostgreSQL database (full `pg_dump`)
- [ ] Export and archive the following tables separately:
  - `users` — all user records and credit balances
  - `payments` — all TON transaction records
  - `rooms` / `room_players` / `taps` — all game history
  - `payouts` — all payout records
  - `referrals` — all referral relationships
- [ ] Confirm the production wallet (`UQDtOHs...`) balance and record it
- [ ] Document which Railway environment and database instance is being wiped
- [ ] Confirm no real user funds are at risk (all current data is dev/test data)

**Wipe Procedure:**
- [ ] Run `DROP TABLE` statements in dependency order: `taps`, `room_players`, `payouts`, `rooms`, `referrals`, `payments`, `usage`, `users`
- [ ] Restart the bot service to trigger `Database.setup_schema!` which recreates all tables
- [ ] Verify all tables are recreated with correct schema
- [ ] Run a smoke test: `/start` command, wallet connect, login

**Post-Wipe Verification:**
- [ ] Confirm all tables exist and are empty
- [ ] Confirm the bot responds to `/start`
- [ ] Confirm the miniapp can connect a wallet and login
- [ ] Record the wipe date and who approved it

> ⚠️ **DO NOT wipe production without explicit approval. This checklist must be reviewed and signed off before execution.**

---

## Phase 1: Wallet & Credit Purchase Testing

### 1.1 Wallet Testing
> Verify wallet connection, state management, and user-facing flows.

- [ ] Open the miniapp via Telegram bot `/mini` command
- [ ] Connect a TON wallet using the TonConnectButton
- [ ] Verify the wallet address appears correctly on the landing page (truncated format)
- [ ] Verify `loginWithWallet()` succeeds and returns user data with `credits_balance`
- [ ] Verify the user record is created/updated in the `users` table with correct `wallet_address`
- [ ] Disconnect the wallet and verify:
  - `logout()` is called
  - UI resets to the "Connect your wallet to play" state
  - No stale user data is displayed
- [ ] Reconnect the wallet and verify the same user record is loaded (not duplicated)
- [ ] Test with multiple wallet apps (Tonkeeper, OpenMask, MyTonWallet) if possible
- [ ] Test the `/status` bot command and verify it shows the correct credit balance
- [ ] **Bug to verify:** Confirm `telegram_chat_id` vs `telegram_user_id` field naming is consistent between miniapp `paymentService.ts` and bot `payment_handler.rb`

### 1.2 Credit Purchase Flow
> Test buying credits in production with real TON.

**Happy Path:**
- [ ] Navigate to the Purchase page
- [ ] Select each credit pack and verify the correct TON amount is shown:
  - 1 TON → 30 credits
  - 5 TON → 200 credits
  - 10 TON → 500 credits
  - 20 TON → 1,500 credits
- [ ] Complete a purchase with the smallest pack (1 TON)
- [ ] Verify the TON transaction appears on-chain (check via tonviewer.com)
- [ ] Verify the backend confirms the payment (status 200, `credits_granted: 30`)
- [ ] Verify the user's `credits_balance` is updated in the database
- [ ] Verify the payment appears in Purchase History page with correct status

**Retry / Pending Path:**
- [ ] Simulate a slow blockchain confirmation (if possible) and verify:
  - Initial response is 202 with `retry: true`
  - Client retries via `/api/payments/retry`
  - Credits are eventually granted after confirmation
- [ ] Verify that retrying an already-confirmed payment returns `already_completed: true` without double-granting credits

**Failure Paths:**
- [ ] Submit a duplicate `tx_hash` and verify 409 response
- [ ] Submit an invalid amount and verify 400 response
- [ ] Trigger rate limiting (>10 requests in 60s) and verify 429 response
- [ ] Verify that a failed payment does not grant credits
- [ ] Verify that a pending payment that never confirms does not grant credits

### 1.3 Credit Purchase Monitoring
- [ ] Check the Railway logs for `PAYMENT:` log lines during each test
- [ ] Verify no unhandled exceptions appear in logs
- [ ] Confirm the `payments` table has correct records for all test transactions

---

## Phase 2: Game Implementation & Testing

### 2.1 Game API Endpoints (TO BUILD)
> The database schema exists but no API endpoints serve game functionality.

**Required endpoints in `final-tap-wins-bot`:**
- [ ] `POST /api/rooms` — Create a new game room
- [ ] `POST /api/rooms/:code/join` — Join a room (deduct entry credits)
- [ ] `POST /api/rooms/:code/tap` — Record a tap (deduct tap credits, reset timer)
- [ ] `GET /api/rooms/:code` — Get room state (without exposing `timer_expires_at`)
- [ ] `GET /api/rooms/active` — List active/waiting rooms
- [ ] Background timer checker — periodically query `idx_rooms_active` for expired rooms and trigger completion

### 2.2 Game UI (TO BUILD)
> The miniapp has no game screens.

**Required pages in `final-tap-wins-miniapp`:**
- [ ] Room lobby / list of active rooms
- [ ] Room detail page with tap button, player count, pot size
- [ ] Tension level indicator (Calm → Warming → Hot → Critical) without revealing exact timer
- [ ] Game result screen showing winner, pot, and payout breakdown
- [ ] Navigation from landing page to game screens

### 2.3 Game UI Testing (Single User)
> After game UI is built, test one full game manually.

- [ ] Create a new room with default settings
- [ ] Join the room as a single player (verify entry credits deducted)
- [ ] Tap multiple times (verify tap credits deducted, `total_taps` incremented)
- [ ] Wait for the timer to expire
- [ ] Verify the room transitions to `finished` status
- [ ] Verify the winner is correctly identified as `last_tapper_telegram_user_id`
- [ ] Verify `winner_payout_credits` is calculated correctly (pot minus house and referrer cuts)
- [ ] Verify the user's `credits_balance` is updated with winnings
- [ ] Verify the payout record is created in the `payouts` table
- [ ] Verify the game result screen displays correctly

### 2.4 Logic and Rules Testing
> Core game mechanics must be tested for edge cases.

**Automated tests to write (recommended: RSpec for bot, Vitest for miniapp):**

**Bot (`final-tap-wins-bot`):**
- [ ] `PaymentVerificationService` — duplicate tx_hash rejection, amount validation, replay protection, concurrent payment races
- [ ] `UserStore` — credit deduction never goes below zero, atomic updates, upsert behavior
- [ ] Room lifecycle — status transitions (`waiting` → `active` → `finished`), invalid transitions rejected
- [ ] Tap logic — credits deducted per tap, `last_tapper_telegram_user_id` updated, `total_taps` incremented
- [ ] Payout calculation — house cut (10%), referrer cut (5%), winner gets remainder
- [ ] Edge cases:
  - [ ] Player tries to tap with 0 credits
  - [ ] Player tries to join a finished room
  - [ ] Two players tap at the exact same millisecond
  - [ ] Room expires with no taps after activation
  - [ ] Referrer cut when winner has no referrer

**Miniapp (`final-tap-wins-miniapp`):**
- [ ] `paymentService.ts` — retry logic, error classification, 202/409/429 handling
- [ ] `userService.ts` — login/logout flow, error handling
- [ ] Component tests for wallet connect/disconnect state transitions

---

## Phase 3: Payout System

### 3.1 Two-Wallet Architecture for Blast-Radius Prevention
> Separate operational funds from treasury to limit exposure.

**Architecture:**
```
┌─────────────────┐         ┌─────────────────┐
│   Main Wallet   │         │   Hot Wallet     │
│   (Treasury)    │────────▶│   (Operations)   │
│                 │  Manual  │                 │
│ Receives all    │  top-up  │ Sends automated │
│ player payments │         │ payouts only     │
│                 │         │                 │
│ Higher balance  │         │ Capped balance   │
│ Cold storage    │         │ e.g., max 50 TON │
└─────────────────┘         └─────────────────┘
```

**Implementation plan:**
- [ ] Create a new TON wallet for hot wallet operations
- [ ] Update `PaymentConfig` to support two wallet addresses:
  - `BOT_WALLET_ADDRESS` — treasury wallet (receives player payments, unchanged)
  - `HOT_WALLET_ADDRESS` — operational wallet (sends payouts)
- [ ] Fund the hot wallet with a small initial balance (e.g., 10-50 TON)
- [ ] Implement a manual top-up process: treasury → hot wallet (human-initiated, not automated)
- [ ] Set a maximum hot wallet balance threshold; alert if exceeded
- [ ] **Private key handling:**
  - Hot wallet private key stored as an environment variable (`HOT_WALLET_PRIVATE_KEY`)
  - NEVER commit private keys to the repository
  - NEVER log private keys
  - Use Railway's encrypted environment variables
  - Rotate the hot wallet key periodically or if compromise is suspected
- [ ] Document the fund flow in the bot repo README

### 3.2 Automated TON Payout Signing
> Build the system to prepare, sign, broadcast, and track payout transactions.

**Implementation plan:**
- [ ] Add the `ton-sdk-ruby` gem (or equivalent) for transaction building and signing
- [ ] Create a `PayoutService` class in `app/services/payout_service.rb` with methods:
  - `prepare_payout(payout_id)` — load payout record, calculate TON amount, build unsigned transaction
  - `sign_and_broadcast(payout_id)` — sign with hot wallet key, broadcast to TON network
  - `check_confirmation(payout_id)` — query blockchain for transaction confirmation
  - `process_pending_payouts` — batch process all `pending` payouts
- [ ] Transaction building:
  - Convert credits to TON using the inverse of `CREDIT_PACKS` ratio (100 credits = 1 TON based on website)
  - Build a transfer message to the user's `wallet_address` from the `users` table
  - Include a memo/comment identifying the payout (e.g., `"FTW-payout-{payout_id}"`)
- [ ] Broadcasting:
  - Submit the signed transaction to the TON network
  - Record the `tx_hash` in the `payouts` table
  - Update status to `processing`
- [ ] Confirmation tracking:
  - Poll `tonapi.io` for transaction confirmation
  - On confirmation: update status to `confirmed`, record `tx_hash`
  - On failure after max retries: update status to `failed`, record `failure_reason`
- [ ] Handle network delays, failures, and retries (see Payout State Machine below)
- [ ] Add a background thread or scheduled job to process pending payouts periodically

### 3.3 Payout Flow Testing
> Test the payout process end-to-end.

- [ ] Complete a game where a user wins
- [ ] Verify a `pending` payout record is created in the `payouts` table
- [ ] Verify the payout service picks up the pending payout
- [ ] Verify the TON transaction is signed and broadcast from the hot wallet
- [ ] Verify the transaction appears on-chain
- [ ] Verify the payout status transitions: `pending` → `processing` → `confirmed`
- [ ] Verify the user receives TON in their wallet
- [ ] Test failure scenarios:
  - [ ] Hot wallet has insufficient balance
  - [ ] Network timeout during broadcast
  - [ ] Transaction fails on-chain
  - [ ] Duplicate payout prevention

### 3.4 Payout Verification State Machine
> A robust state machine for tracking payout lifecycle on the blockchain.

**State Diagram:**
```
                    ┌──────────┐
                    │ pending  │ ◀── Payout record created after game ends
                    └────┬─────┘
                         │ PayoutService picks up
                         ▼
                    ┌──────────┐
            ┌──────│processing │ ◀── Transaction signed & broadcast
            │      └────┬─────┘
            │           │ Poll for confirmation
            │           ▼
            │    ┌─────────────────┐
            │    │ confirming      │ ◀── Tx broadcast, waiting for on-chain confirmation
            │    └───┬────────┬───┘
            │        │        │
            │   Confirmed   Timeout/Failure
            │        │        │
            │        ▼        ▼
            │  ┌──────────┐  ┌────────────┐
            │  │confirmed │  │  retrying   │──── attempt_count < MAX_RETRIES
            │  └──────────┘  └──────┬─────┘
            │                       │
            │                  attempt_count >= MAX_RETRIES
            │                       │
            │                       ▼
            │               ┌───────────────┐
            └──────────────▶│    failed      │
                            └───────┬───────┘
                                    │ Manual intervention
                                    ▼
                            ┌───────────────┐
                            │ manual_review  │
                            └───────────────┘
```

**Required schema changes to `payouts` table:**
- [ ] Add `confirmed` and `manual_review` to the status CHECK constraint:
  ```sql
  CHECK (status IN ('pending','processing','confirming','confirmed','retrying','failed','manual_review'))
  ```
- [ ] Add columns:
  ```sql
  attempt_count       INTEGER NOT NULL DEFAULT 0,
  max_attempts        INTEGER NOT NULL DEFAULT 5,
  last_attempted_at   TIMESTAMP,
  confirmed_at        TIMESTAMP,
  next_retry_at       TIMESTAMP
  ```

**State transition rules:**
| From | To | Trigger |
|------|----|---------|
| `pending` | `processing` | PayoutService picks up the payout |
| `processing` | `confirming` | Transaction broadcast succeeds |
| `confirming` | `confirmed` | On-chain confirmation received |
| `confirming` | `retrying` | Timeout (no confirmation within 5 min) or network error |
| `retrying` | `processing` | `next_retry_at` reached AND `attempt_count < max_attempts` |
| `retrying` | `failed` | `attempt_count >= max_attempts` |
| `failed` | `manual_review` | Admin flags for manual investigation |
| `manual_review` | `pending` | Admin resets for retry after investigation |

**Retry strategy:**
- Exponential backoff: `next_retry_at = NOW() + (2^attempt_count * 30 seconds)`
- Max 5 attempts before marking as `failed`
- Each retry increments `attempt_count` and updates `last_attempted_at`
- Log every state transition with payout ID, old status, new status, and reason

**Safeguards:**
- [ ] All state transitions must be atomic (SQL transaction)
- [ ] Only transition from expected states (e.g., can't go from `confirmed` to `processing`)
- [ ] Idempotency: if a payout is already `confirmed`, do not re-process
- [ ] Alert/log when any payout enters `failed` state
- [ ] Daily report of all payouts in non-terminal states (`pending`, `processing`, `confirming`, `retrying`)

---

## Phase 4: Friends-Only Production Test

### 4.1 Test Plan
> Limited production testing with trusted friends before public launch.

**Access Control:**
- [ ] Enable the passcode gate (Phase 0.1)
- [ ] Share the access code only with approved testers (max 5-10 people)
- [ ] Testers must be briefed: this is a test, bugs are expected

**Who Can Access:**
- Only friends/testers who receive the access code directly from the developer
- Each tester should use their own Telegram account and TON wallet

**What to Test:**
| Flow | Instructions | Real Funds? |
|------|-------------|-------------|
| Wallet connect | Connect and disconnect wallet multiple times | No |
| Credit purchase | Buy the 1 TON pack | Yes (1 TON per tester) |
| Credit balance | Verify credits appear after purchase | N/A |
| Purchase history | Check history page shows the transaction | N/A |
| Game play | Create a room, invite another tester, play a full game | Uses credits |
| Payout | Winner should receive TON payout | Yes (verify receipt) |
| Bot commands | Test `/start`, `/mini`, `/status` in Telegram | No |

**Bug Reporting:**
- Testers report bugs via a dedicated Telegram group or DM
- Include: what they did, what they expected, what happened, screenshots
- Developer triages and fixes before next test round

**Monitoring During Test:**
- [ ] Watch Railway logs in real-time during test sessions
- [ ] Monitor the `payments` table for stuck `pending` records
- [ ] Monitor the `payouts` table for stuck `pending`/`failed` records
- [ ] Monitor hot wallet balance
- [ ] Check for any unhandled exceptions in logs
- [ ] After each test session, review:
  - All `payments` records and their statuses
  - All `payouts` records and their statuses
  - All `users` records and their credit balances
  - Hot wallet balance vs expected balance

### 4.2 Test Success Criteria
- [ ] All testers can connect wallet and login without errors
- [ ] All credit purchases are confirmed and balances are correct
- [ ] At least 3 full games are played to completion
- [ ] At least 1 payout is successfully sent and confirmed on-chain
- [ ] No unhandled exceptions in production logs
- [ ] No stuck payments or payouts after 24 hours

---

## Phase 5: Blockchain Game History (Future)

### 5.1 On-Chain Game History
> User-verifiable game history and payout legitimacy.

**Purpose:**
- Allow users to independently verify that payouts are legitimate and tied to recorded game outcomes
- Build trust by making game results transparent and auditable

**What to Store On-Chain:**
| Data | Storage | Reason |
|------|---------|--------|
| Game result hash (room_id, winner, pot, timestamp) | On-chain | Proof of outcome |
| Payout transaction | On-chain (already there) | Proof of payment |
| Payout-to-game linkage | On-chain (tx memo) | Links payout to specific game |
| Full game replay (all taps, timestamps) | Off-chain (database) | Too large/expensive for chain |
| Player identities | Off-chain (database) | Privacy concerns |

**Implementation approach:**
- [ ] After each game finishes, compute a SHA-256 hash of the game result (room code, winner ID, pot amount, finished_at timestamp)
- [ ] Store this hash on-chain as a comment/memo in the winner's payout transaction
- [ ] Provide a verification page where users can:
  1. Enter a game/room code
  2. See the game result details from the database
  3. See the on-chain transaction with the matching hash
  4. Independently verify the hash matches
- [ ] Consider using a TON smart contract for batch game result storage if volume justifies it

**Recommended Phase 2 timeline:** After successful friends-only testing and initial public launch stabilization.

---

## Phase 6: Hardening & Launch Prep

### 6.1 Fix Known Issues
- [ ] Update `MINI_APP_URL` default in `config/environment.rb` from `bot-one-miniapp` to `final-tap-wins-miniapp`
- [ ] Audit and fix `telegram_chat_id` vs `telegram_user_id` field naming across miniapp and bot
- [ ] Add README files to `final-tap-wins-miniapp` and `final-tap-wins-bot` repos

### 6.2 Security Checklist
- [ ] Verify no private keys or secrets are committed to any repository
- [ ] Verify all environment variables are set via Railway's encrypted config
- [ ] Verify CORS `ALLOWED_ORIGINS` only includes production domains
- [ ] Verify the `/api/payments/direct` dev endpoint does NOT exist in production (`RACK_ENV != "development"`)
- [ ] Verify rate limiting is active on all payment endpoints
- [ ] Verify `host_authorization` is configured correctly
- [ ] Add request authentication (e.g., validate Telegram `initData` signature on the backend)

### 6.3 Monitoring & Alerting
- [ ] Set up Railway log alerts for `ERROR` level messages
- [ ] Set up a daily cron job or manual check for:
  - Payments stuck in `pending` for >1 hour
  - Payouts stuck in `pending`/`processing` for >1 hour
  - Hot wallet balance below threshold
- [ ] Add a `/health` endpoint check (already exists) to an uptime monitor

### 6.4 Remove Access Barrier
- [ ] Set `VITE_TEST_ACCESS_CODE` to empty string or remove the gate component
- [ ] Redeploy the miniapp
- [ ] Update website CTAs from "Coming Soon" to the actual launch link (change `window.CTA_LABEL` in `js/main.js`)

---

## Summary: Launch Readiness Checklist

| # | Item | Phase | Status |
|---|------|-------|--------|
| 1 | Production access barrier | 0.1 | ⬜ |
| 2 | Production reset plan executed | 0.2 | ⬜ |
| 3 | Wallet testing complete | 1.1 | ⬜ |
| 4 | Credit purchase testing complete | 1.2 | ⬜ |
| 5 | Game API endpoints built | 2.1 | ⬜ |
| 6 | Game UI built | 2.2 | ⬜ |
| 7 | Single-user game test complete | 2.3 | ⬜ |
| 8 | Automated tests written | 2.4 | ⬜ |
| 9 | Two-wallet architecture implemented | 3.1 | ⬜ |
| 10 | Automated payout signing implemented | 3.2 | ⬜ |
| 11 | Payout flow tested end-to-end | 3.3 | ⬜ |
| 12 | Payout state machine implemented | 3.4 | ⬜ |
| 13 | Friends-only production test complete | 4.1 | ⬜ |
| 14 | Test success criteria met | 4.2 | ⬜ |
| 15 | Known issues fixed | 6.1 | ⬜ |
| 16 | Security checklist passed | 6.2 | ⬜ |
| 17 | Monitoring set up | 6.3 | ⬜ |
| 18 | Access barrier removed, CTAs updated | 6.4 | ⬜ |
| 19 | **GO LIVE** | — | ⬜ |
