# GLITCH//RIFT: The Neon Ascension

A cyberpunk-inspired 2D pixel platformer built with Phaser 3 and a Node.js/Express backend. Players battle through 50 procedurally-styled stages, collecting gems, defeating minions, and facing glitch-powered bosses every tenth level. The backend provides authentication, leaderboard submissions, and simulated in-game purchases with MongoDB (or a fallback in-memory store) support.

## Features

- **Phaser 3 platformer** with double jumps, enemy encounters, and gem collection across 50 levels.
- **Responsive canvas** that scales to desktop and mobile browsers, including on-screen touch controls.
- **Neon glitch aesthetic** generated at runtime for lightweight assets.
- **8-bit inspired soundtrack** with an in-game mute toggle.
- **User accounts** with registration/login endpoints backed by MongoDB or an in-memory fallback.
- **Leaderboards & purchases** endpoints to submit scores, list top players, and simulate consumable purchases.

## Project Structure

```
frontend/              # Phaser scenes, assets, and UI overlay
  index.html
  styles.css
  js/
    main.js
    assets/
      audioData.js
    scenes/
      BootScene.js
      MenuScene.js
      GameScene.js
      UIScene.js
      CreditsScene.js
    services/
      api.js
    world/
      levels.js
server/                # Express application
  index.js
  controllers/
  models/
  routes/
  utils/
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- MongoDB connection string (optional — falls back to an in-memory store if absent)

### Installation

```bash
npm install
```

### Running the Development Server

1. Create a `.env` file (optional) in the project root:

   ```env
   PORT=3000
   MONGO_URI=mongodb://localhost:27017
   MONGO_DB=glitch_rift
   JWT_SECRET=super-secret-string
   ```

2. Start the backend + static frontend:

   ```bash
   npm start
   ```

3. Visit [http://localhost:3000](http://localhost:3000) in your browser. Log in or register to begin climbing the Neon Ascension.

The Express server automatically serves the Phaser frontend and exposes JSON APIs under `/api`.

### API Overview

- `POST /api/auth/register` — Create an account (username/password).
- `POST /api/auth/login` — Authenticate and receive a JWT.
- `GET /api/leaderboard` — Retrieve the top 50 scores.
- `POST /api/leaderboard` — Submit a score (requires `Authorization: Bearer <token>`).
- `GET /api/purchase` — List available glitch packs.
- `POST /api/purchase` — Simulate a purchase (requires authentication).
- `GET /api/health` — Service heartbeat and database mode.

### Frontend Controls

- **Keyboard:** Arrow keys to move and jump; double-tap jump for a double jump. Press `M` to mute/unmute audio.
- **Touch:** Virtual buttons for movement and jumping render automatically on touch devices.

## Notes

- When `MONGO_URI` is not provided, the backend stores accounts and scores in-memory for demo purposes. Data will reset between server restarts.
- `frontend/js/world/levels.js` programmatically shapes all 50 levels, introducing tougher enemies and boss patrols every 10th stage.
- Replace the procedurally generated textures/audio in `BootScene` and `audioData.js` with bespoke art and sound when production assets are ready.

Enjoy exploring the neon fractures of GLITCH//RIFT!
