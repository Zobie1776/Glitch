# Enemy and Boss System Overview

This document summarizes the combat AI that powers the ten Glitch enemy variants and the recurring bosses that appear every tenth level.

## Shared AI Rules

* **Vision** – Every combatant has a sight radius defined in the `CombatStats` record. Enemies detect the player once the distance to the player position is less than or equal to this radius.
* **State Machine** – Behaviour flows through *Patrol → Alert → Attack* with `ENRAGED`, `STUNNED`, and `DEAD` supporting states. These states are represented by `EnemyState` in `src/ai/states.py` and orchestrated inside `Enemy.update`.
* **Movement** – Directional movement uses the lightweight `Vector2` helper to steer toward patrol targets or the player. The patrol system supports looping routes and pauses when the enemy reaches its current waypoint.
* **Variations** – Each archetype specifies max HP, movement speed, attack power, attack range, and sight radius. Variants differ by tier and melee/projectile role, giving 2–3 stat spreads per tier.

## Enemy Variants

Ten archetypes live in `src/entities/enemy_variants.py`. The table below highlights their roles.

| ID | Name | Tier | Role | Highlights |
| --- | --- | --- | --- | --- |
| glitchling_scout | Glitchling Scout | 1 | Melee | Fastest tier-one unit with large vision.
| glitchling_guard | Glitchling Guard | 1 | Melee | Highest HP in tier one, slower patrol.
| data_wisp | Data Wisp | 1 | Projectile | Short-range caster with high sight radius.
| bitcrusher | Bitcrusher | 2 | Melee | Heavy strike damage, slower speed.
| packet_stalker | Packet Stalker | 2 | Melee | Agile chaser tuned for ambush routes.
| signal_shade | Signal Shade | 2 | Projectile | Fires quick packets with long vision.
| malware_beast | Malware Beast | 3 | Melee | High HP brawler suited for frontline play.
| code_reaver | Code Reaver | 3 | Melee | Balanced elite with aggressive pursuit.
| logic_siphon | Logic Siphon | 3 | Projectile | Sustained beam specialist.
| kernel_hydra | Kernel Hydra | 4 | Projectile | Late-game menace with alternating salvos.

All enemies drop gems on death using tier-weighted ranges (see `generate_enemy_drop`).

## Boss Design

* **Spawn cadence** – `EnemyManager.spawn_boss` instantiates a `Boss` for every 10th level. Bosses share archetypes with enemies but add bespoke multi-phase logic.
* **Multi-phase combat** – Bosses scale through three phases (`opening`, `mid`, `final`). The helper `_determine_phase` upgrades the current phase as the boss HP ratio crosses 75%, 50%, and 25% thresholds.
* **Enraged mode** – When HP falls below 50% the boss enters the `ENRAGED` state, shortening pattern cooldowns by 40% and signalling with a `StateChangeEvent`.
* **Patterned attacks** – Each phase cycles deterministic patterns described by `AttackPattern`. The default sets include melee cleave/charge or projectile burst/sniper behaviours and can be overridden per boss.
* **Rewards** – Upon defeat the boss triggers two loot events: tiered gem drops from the base `Enemy` implementation and one guaranteed Glitch Skill via `generate_boss_skill`.
* **Presentation hooks** – `StateChangeEvent` instances broadcast state and pattern transitions. Downstream systems (animation, VFX, audio) can subscribe to these events to drive distinct color palettes and animation cues per phase.

## Extending the System

* Add new archetypes by appending to `ENEMY_VARIANTS` and optionally overriding default boss phases.
* Tune patrol behaviour or add pathfinding by swapping `_move_towards` with an engine-specific path solver.
* Inject stun or crowd-control reactions by transitioning the `state_ctx.state` to `EnemyState.STUNNED` and resuming patrol when timers expire.
