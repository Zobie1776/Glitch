# Monetization, Login & Leaderboards Architecture

## Overview
This document outlines the systems required to support multiple authentication options, player data persistence, in-game currency purchases, advertisements, premium subscriptions, and competitive leaderboards. It assumes a casual mobile/desktop game written with a web-based client and a Node.js backend, but the concepts apply broadly to similar stacks.

## Authentication & Account Management

### Login Options
- **Email + Password** – Traditional registration handled by the backend with salted bcrypt hashing. Password reset tokens distributed via email.
- **Google OAuth** – Use OAuth 2.0 with Google Identity Services. The client obtains an ID token, which the backend verifies before creating or updating the linked user record.
- **Apple ID** – Integrate Sign In with Apple using JWT validation on the backend.
- **Facebook Login** – Implement using Facebook Login SDK. Exchange the access token for user info on the backend, then create/update the user profile.

### Account Linking
- Normalize third-party logins by linking provider-specific identifiers to a single canonical user record keyed by email. Maintain a `providers` array with entries for each linked OAuth provider.
- Offer account linking from the settings screen so players can attach multiple providers and avoid duplicate accounts.

### Session Management
- Use short-lived JWT access tokens (15 minutes) and refresh tokens (30 days) stored server-side (Redis) for revocation. For web, store refresh tokens in HTTP-only cookies; for native apps, use secure storage.
- Rate-limit login attempts per IP/user to mitigate brute-force attacks.

## Player Data Storage

### Database Choice
- **MongoDB Atlas** – Recommended for scalable cloud hosting, native JSON, and flexible schema. Alternatively use Replit DB for prototypes; abstract the repository layer to switch easily.

### Schema
Collection: `players`
```
{
  _id: ObjectId,
  email: string,
  username: string,
  providers: [
    { provider: 'email' | 'google' | 'apple' | 'facebook', providerId: string }
  ],
  gems: number,
  xp: number,
  highScore: number,
  seasonalScores: [
    { seasonId: string, score: number, achievedAt: ISODate }
  ],
  skins: [string],
  skills: [string],
  subscription: {
    status: 'none' | 'active' | 'canceled' | 'past_due',
    stripeCustomerId: string,
    stripeSubscriptionId: string,
    currentPeriodEnd: ISODate
  },
  adPreferences: {
    lastInterstitialShownAt: ISODate,
    optedOut: boolean
  },
  createdAt: ISODate,
  updatedAt: ISODate
}
```
- Use separate collections for inventory metadata (skin definitions, skill definitions) to avoid duplication.
- Implement optimistic locking via a `version` field to prevent conflicting updates when spending gems or updating XP.

## In-Game Currency & Purchases

### Gem Economy
- Gems earned from gameplay (level completions, daily quests) or purchased via Stripe.
- Backend validates that gem balances never drop below zero and logs every adjustment in a `gem_transactions` collection for auditing.

### Stripe Integration
- Create Stripe products & prices:
  - 500 gems – $0.99
  - 2,000 gems – $2.99
  - 10,000 gems – $9.99
- Use Stripe Checkout for web; Stripe Payment Intents for mobile in-app browsers.
- Webhook endpoint `POST /webhooks/stripe` verifies signatures and processes `checkout.session.completed` events to credit gems.
- Store purchase history (`stripeChargeId`, `amount`, `gems`, `status`) to support customer support and refunds.
- Prevent double-crediting by idempotently processing webhook events (use Stripe event ID as unique key).

## Ads & Premium Subscription

### Advertising Flow
- Integrate with an ad network (e.g., AdMob, Unity Ads) to show interstitial ads between levels for non-premium users.
- Store timestamps of the last ad display to enforce frequency caps.
- Provide rewarded ads for optional gem bonuses (log outcomes in `ad_rewards` collection).

### Premium Subscription
- Monthly subscription priced at $2.99 via Stripe Billing.
- Expose a purchase screen where users confirm the subscription.
- Backend listens for Stripe subscription lifecycle events to update the `subscription.status` field.
- When subscription status becomes active, disable ads and optionally grant a monthly gem stipend.
- Handle subscription cancellation by prorating benefits until `currentPeriodEnd`.

## Leaderboards

### Types of Leaderboards
1. **All-Time Leaderboard** – Top 100 high scores globally.
2. **Seasonal Leaderboard** – Top scorers within the current 3-month season.

### Storage Strategy
- Maintain a `leaderboards` collection containing embedded sorted sets or use Redis Sorted Sets for high-performance score updates.
- For MongoDB implementation, store documents:
```
{
  _id: { type: 'all_time' | 'seasonal', seasonId?: string },
  entries: [
    { playerId: ObjectId, username: string, score: number, achievedAt: ISODate }
  ]
}
```
- Enforce a maximum of 100 entries per leaderboard. When inserting a new score, push the entry, sort descending, and trim to 100.
- For seasonal leaderboards, include a `seasonId` (e.g., `2024-Q4`). Schedule a job to archive the current season every three months.

### Seasonal Reset Flow
1. Cron job triggers at season end (e.g., using AWS EventBridge or Heroku Scheduler).
2. Copy the current seasonal leaderboard to an `archived_leaderboards` collection with metadata (seasonId, startDate, endDate).
3. Clear the active seasonal leaderboard and initialize the next season with the new `seasonId`.
4. Notify players via in-game mail/notifications.

### Displaying Scores
- Leaderboard screen fetches both all-time and current seasonal data concurrently.
- Show the player's own rank even if outside the top 100 (query by playerId and compute rank using Redis `ZRANK` or MongoDB aggregation).
- Provide pagination or lazy loading for large lists; highlight new entrants with animation when they break into the top 100.

## Security & Compliance
- Protect all endpoints with HTTPS; enforce HSTS.
- Sanitize user-generated content (usernames) to prevent injection.
- Comply with COPPA/GDPR as needed: allow data deletion, parental controls, and privacy notice.
- Store Stripe secrets and OAuth credentials in secure environment variables or a secrets manager.

## Operational Considerations
- Logging & Monitoring: Use structured logs (Winston/ELK) and metrics (Prometheus) to track login failures, purchase conversions, ad impressions, and leaderboard updates.
- Analytics: Record events for gem spending, subscription churn, and leaderboard movement for balancing the economy.
- Scalability: Cache read-heavy endpoints (leaderboard fetches) via Redis or CDN. Implement rate limiting on write-heavy endpoints (score submissions).

## Roadmap Next Steps
1. Implement authentication service with OAuth providers.
2. Build player repository layer with unit tests using MongoDB memory server.
3. Integrate Stripe Checkout & Billing, including webhook handling.
4. Add ad mediation SDK into client builds with feature flags for premium users.
5. Build leaderboard microservice or module with scheduled season resets.
6. Create admin dashboard for monitoring purchases, subscriptions, and leaderboards.

