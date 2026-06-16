# GLITCH//RIFT

A cyberpunk 2D action platformer built with **Phaser 3** and **Vite**. Fight through 50 levels across 5 biomes using a glitch-based combat system, survive procedural enemy waves in void arenas, and face a boss every 10 levels.

Runs in the browser, installs as a PWA on desktop and mobile, and requires no server or account to play.

---

## Project Layout

```
Glitch/
├── client/
│   ├── public/
│   │   ├── manifest.json       # PWA manifest (fullscreen, landscape)
│   │   └── sw.js               # Service worker (offline caching)
│   ├── src/
│   │   └── game/
│   │       ├── index.js        # Phaser game bootstrap
│   │       ├── constants.js    # GAME_WIDTH, GAME_HEIGHT, physics tuning
│   │       ├── data/
│   │       │   ├── glitchRegistry.js   # 65 glitch ability definitions
│   │       │   ├── enemyConfig.js      # Enemy stats + scaling formulas
│   │       │   ├── bossConfig.js       # 5 boss configs with phase patterns
│   │       │   └── levelLayouts.js     # 50 level platform/spawn layouts
│   │       ├── entities/
│   │       │   ├── Player.js           # Player sprite, movement, combat
│   │       │   └── enemies/
│   │       │       ├── BaseEnemy.js    # AI state machine (7 states)
│   │       │       ├── BasicChaser.js
│   │       │       ├── Attacker.js
│   │       │       ├── FastEnemy.js
│   │       │       ├── HeavyEnemy.js
│   │       │       └── TeleporterEnemy.js
│   │       ├── systems/
│   │       │   ├── GlitchSystem.js     # Slot management, cooldowns, evolution
│   │       │   ├── LevelSystem.js      # Platform building, portals, spawning
│   │       │   ├── BossSystem.js       # Boss AI, phases, projectile patterns
│   │       │   ├── SaveSystem.js       # localStorage save/load
│   │       │   └── AudioSystem.js      # Audio stub (ready for sounds)
│   │       ├── scenes/
│   │       │   ├── BootScene.js        # Generates all textures procedurally
│   │       │   ├── PreloadScene.js     # Loading bar
│   │       │   ├── MainMenuScene.js    # Title screen, save detection
│   │       │   ├── GameScene.js        # Main gameplay loop
│   │       │   ├── ArenaScene.js       # 30-second survival challenge
│   │       │   ├── BossIntroScene.js   # Boss name reveal cutscene
│   │       │   ├── LevelCompleteScene.js
│   │       │   ├── GameOverScene.js
│   │       │   └── PauseScene.js
│   │       └── ui/
│   │           ├── HUD.js              # Health bar, XP bar, gem count
│   │           ├── GlitchCooldownUI.js # 10 base + 5 special glitch slots
│   │           ├── BossHealthBar.js    # Phase-aware boss health bar
│   │           └── MobileControls.js  # Touch button overlay
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## Installation

### PC (Browser)

No installation required — just open the URL in any modern browser (Chrome, Firefox, Edge, Safari).

To run locally from source:

```bash
git clone https://github.com/Zobie1776/Glitch.git
cd Glitch/client
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

To build for production:

```bash
cd client
npm run build
# Output goes to client/dist/ — deploy that folder to any static host
```

---

### Android (PWA — no app store required)

1. Open the game URL in **Chrome** on Android.
2. Tap the **three-dot menu** (top right).
3. Tap **"Add to Home screen"** or **"Install app"**.
4. Tap **"Add"** on the confirmation prompt.

The game installs as a fullscreen landscape app on your home screen. No APK, no Play Store.

---

### iOS (PWA — Safari only)

1. Open the game URL in **Safari** (Chrome on iOS cannot install PWAs).
2. Tap the **Share button** — the box with an upward arrow at the bottom of the screen.
3. Scroll down and tap **"Add to Home Screen"**.
4. Tap **"Add"** in the top right corner.

The game launches fullscreen with the status bar hidden, exactly like a native app. iOS 16.4+ supports background caching so it works offline after the first visit.

> Chrome, Firefox, and other browsers on iOS cannot install PWAs due to Apple's restrictions. You must use Safari.

---

## Rebuild Guide

If you want to do a clean rebuild from the source:

```bash
# 1. Install dependencies
cd client
npm install

# 2. Development server with hot reload
npm run dev

# 3. Production build
npm run build

# 4. Preview the production build locally
npm run preview
```

The Vite build outputs to `client/dist/`. The service worker (`sw.js`) in `client/public/` is copied as-is into the dist folder and handles offline caching automatically.

No environment variables, no backend, no database — the game is entirely client-side. Progress is saved to `localStorage` under the key `glitch_rift_save`.

---

## Objective

Fight through **50 levels** spread across **5 biomes**. Each biome introduces new visual themes and tougher enemies. Every 10th level is a **boss fight** — defeat the boss to unlock the exit portal and progress.

Along the way:
- Collect **gems** dropped by enemies
- Gain **XP** to level up your player (each level adds +10 max health)
- Unlock and evolve **glitch abilities** through combat use
- Survive **void arena** challenges triggered by Teleporter enemies
- Reach **Level 50** and defeat **CORE//COLLAPSE** to complete the game

---

## Biomes

| Levels | Biome | Theme |
|--------|-------|-------|
| 1–10 | NEON SLUMS | Cyan glow, street-level intro |
| 11–20 | DATA WASTES | Purple haze, corrupted terrain |
| 21–30 | BINARY RUINS | Blue-white, structural collapse |
| 31–40 | VOID SECTOR | Dark magenta, glitch storms |
| 41–50 | CORE MATRIX | Deep red, the source of the rift |

Each biome shifts vertical complexity upward — later biomes require more precise platforming to navigate the same templates.

---

## Game Mechanics

### Movement

| Action | Keyboard | Mobile |
|--------|----------|--------|
| Move left | Arrow Left / A | Left button |
| Move right | Arrow Right / D | Right button |
| Jump | Arrow Up / W / Space | Jump button |
| Double jump | Press jump again in air | Same |
| Attack (melee) | Shift | Attack bar |
| Glitch slot 1 | Z | G1 button |
| Glitch slot 2 | C | G2 button |
| Glitch slot 3 | V | G3 button |
| Pause | Escape | — |

**Double jump:** The player has 2 available jumps reset when grounded.

**Melee:** 65px range, 20 base damage, 80ms hitstop on hit. A slash graphic briefly appears at the attack point.

**Knockback:** Taking damage pushes the player 220px horizontally and 180px upward from the damage source.

**Invincibility frames:** 0.4 seconds after taking damage — you cannot be hit again during this window.

### Combat Crits

The player accumulates `critStacks` through combat. Stacks increase `critMultiplier`, making high-aggression play reward higher burst damage.

### Player Progression

- **XP threshold:** `100 + (playerLevel - 1) × 60` XP per level.
- **Level up reward:** +10 max health per level.
- **Gems:** Used for future shop integration; displayed in HUD.

---

## Glitch System

The glitch system is the core identity of the game. Glitches are abilities rooted in corrupted game logic — they bend the rules of the simulation.

### Slots

- **10 base slots** — equipped with glitch abilities, shown in the center HUD bar.
- **5 special slots** — unlocked from boss drops, shown in a row above.

### Starter Glitches (equipped by default)

| Slot | Key | Name | Effect |
|------|-----|------|--------|
| 0 | Z | INPUT DESYNC | Teleport 120–200px forward (scales with tier). Leaves afterimage clones. |
| 1 | C | COLLISION SLIP | Phase through platforms for 1.5–3s. Tier 3 adds projectile immunity. |
| 2 | V | TIME DILATION | Slow all enemies to 25–30% speed for 2–3s. Tier 3 emits a damage pulse. |

### Evolution

Every glitch has **3 tiers**:
- **Tier 1** — Default. Unlocked on equip.
- **Tier 2** — Unlocked at **8 uses**. Enhanced effect, shorter or same cooldown.
- **Tier 3** — Unlocked at **20 uses**. Maximum power, often adds a second effect.

Evolution is per-glitch, tracked across all sessions via the save system.

### Cooldowns

Each glitch has a cooldown displayed as an overlay on its slot button. Cooldowns tick in real-time. On mobile, glitch buttons also display the remaining cooldown as a timer label.

### Special Glitches (Boss Drops)

Bosses drop unique special glitches not obtainable any other way:

`echoStep`, `gravityFlip`, `realityTear`, `timeLoop`, `glitchMastery`, `blackout`, `phaseStorm`, `fractalDash`, `staticStorm`, `riftNova`, `voidShield`, `chronoPulse`, `dataOverflow`, `mirrorWorld`, `coreCollapse`

`glitchMastery` activates all equipped glitches simultaneously at Tier 3 for a short duration.

---

## Enemies

### Standard Enemies

| Enemy | Color | Behavior |
|-------|-------|----------|
| **Basic Chaser** | Magenta | Patrols, chases on detection, no telegraph |
| **Attacker** | Purple | Telegraphs attacks with a pulsing red dot before striking |
| **Fast Enemy** | Bright purple | Dash attack every 3s at 450px/s; highly mobile |
| **Heavy Enemy** | Dark magenta | AoE shockwave attack, camera shake, slow but high damage |
| **Teleporter** | Pink | Teleports next to the player every 3.5s; after 5s of chasing triggers a void arena |

### Scaling

All enemy stats scale with level:
- **HP:** +5% per 3 levels
- **Speed:** +3% per 2 levels
- **Damage:** +5% per 5 levels

Enemy count per level: `min(2 + level × 2, 20)`.

### Enemy AI States

All enemies use a 7-state AI machine:

`IDLE → PATROL → DETECT → CHASE → TELEGRAPH → ATTACK → RECOVER → DEAD`

- **Ledge detection:** enemies stop at platform edges and reverse direction rather than falling.
- **Telegraph:** configurable pre-attack delay with visual indicator (used by Attacker and Heavy).
- **Death:** red flash → scale-to-zero tween → drops gems and XP.

---

## Boss System

A boss spawns every 10 levels. Each has multiple phases triggered by health thresholds, unique projectile patterns, and a special glitch drop on defeat.

| Level | Boss | Phases | Drop |
|-------|------|--------|------|
| 10 | NULLIFIER | 2 | Echo Step |
| 20 | VECTOR PRIME | 2 | Gravity Flip |
| 30 | FRACTAL ARCHON | 3 | Reality Tear |
| 40 | SYSTEM WRAITH | 3 | Time Loop |
| 50 | CORE//COLLAPSE | 4 | Core Collapse |

**Phase transitions:** As the boss loses health it enters new phases with higher damage, faster patterns, and more projectiles per burst.

**Projectile patterns:** Each phase fires a configurable arc of projectiles (`count` shots spread over `spread` degrees).

**Boss health bar:** Wide bar at the top of the screen shows current health and phase pips. Fades in on spawn, pulses on phase change, fades out on defeat.

**Scaling across cycles:** If the player loops past Level 50, boss stats increase by 30% per cycle.

---

## Arena System

**Void Arenas** are triggered by Teleporter enemies after they chase the player for 5 seconds. The player is transported to a sealed room and must survive **30 seconds** of escalating enemy waves.

- Waves spawn every 5 seconds, growing by 1 enemy per wave.
- The arena is a fixed-camera room with 4 mid-air platforms.
- On victory, the player returns to the exact position and level they left.
- On death, the game over screen appears.

Glitch cooldowns and player health carry over into and out of the arena.

---

## Save System

Progress is saved automatically to `localStorage`:
- Every **30 seconds** during gameplay
- On **level completion**
- On **death**

Saved data includes: current level, player health/maxHealth/XP/level/gems, and all glitch slot states including evolution tiers and use counts.

The main menu detects an existing save and shows a **CONTINUE (LEVEL N)** button. A **NEW GAME** always clears the existing save and starts fresh from Level 1.

---

## UI Overview

| Element | Location | Description |
|---------|----------|-------------|
| Health bar | Bottom left | Red bar, updates each frame |
| XP bar | Top left | Purple bar, shows XP progress to next level |
| Gem counter | Top right | Live gem count |
| Glitch slots | Bottom center | 10 base + 5 special slots with cooldown overlays |
| Boss health bar | Top center | Appears only during boss fights |
| Mobile controls | Left + right edges | Touch buttons, auto-hidden on non-touch devices |

---

## Controls Reference

### Keyboard (PC)

```
Arrow Keys / WASD   — Move + Jump
Space               — Jump
Shift               — Melee Attack
Z / C / V / B       — Activate Glitch Slots 0–3
Escape              — Pause
```

### Touch (Mobile)

All touch buttons appear only on touch-capable devices. The layout is split into two zones to avoid overlapping the glitch cooldown UI in the center:

```
LEFT ZONE (x 0–240)        RIGHT ZONE (x 720–960)
  ◄  ▲ JUMP  ►               [Z G1] [C G2] [V G3]
                              [    ⚔ ATTACK      ]
```

Up to 5 simultaneous touches are tracked independently, so you can hold movement and tap attack/glitch at the same time.
