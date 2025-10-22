# Glitch

A blueprint for the Glitch action roguelite, featuring a Phaser-powered front end and a Node.js back end with persistent cloud saves and Stripe monetisation hooks.

## Project Layout

```
.
├── client/   # Phaser + React + Tailwind front end (Vite)
├── server/   # Express API, OAuth, Stripe checkout, Mongo/Replit persistence
├── public/   # Static web assets (served by hosting/CDN)
└── config/   # Environment configuration and service helpers
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance (local or cloud) or a Replit DB URL
- Stripe account (for checkout sessions)
- OAuth credentials (Google/Facebook/Apple as desired)

### Environment Variables

Copy `config/.env.example` into `.env` and populate the secrets:

```bash
cp config/.env.example .env
```

At minimum, configure `MONGODB_URI` or `REPLIT_DB_URL`, a `JWT_SECRET`, and Stripe/OAuth keys when enabling those features.

### Install Dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### Running Locally

Start the API:

```bash
cd server
npm run dev
```

In a separate terminal, start the front end:

```bash
cd client
npm run dev
```

The Vite dev server proxies `/api/*` requests to the Express API listening on `http://localhost:4000`.

## Gameplay & Flow

1. **Login** via email/password or OAuth.
2. **Main Menu** (Start, Continue, Leaderboards, Shop, Settings).
3. **Game Scene** renders the glitch arena using Phaser.
4. **Level Clear** triggers auto-save and gem payout.
5. **Death** offers retry via the UI.
6. **Leaderboard submission** occurs at the end of a session using the `/leaderboards` endpoint.

## Save System

- Auto-save after every level or purchase through `/api/game/progress`.
- Cloud-sync keyed by player ID (MongoDB or Replit DB fallback).
- Client loads cached progress on login and caches locally for offline resilience.

## Payments

Stripe checkout sessions are created server-side with `/api/shop/checkout` and finalised via a webhook listener on `/api/webhooks/stripe`. Map the webhook URL in the Stripe dashboard and provide the `STRIPE_WEBHOOK_SECRET` in the environment.

## OAuth

`config/oauth.js` wires Passport strategies for Google and Facebook. Provide credentials to enable flows, and extend the file for Apple sign-in.
