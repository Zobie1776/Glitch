# Glitch Enemy & Boss Prototype

This repository contains a lightweight Python simulation of the Glitch enemy and boss AI. It models the patrol → alert → attack flow, projectile/melee variants, gem drops, and multi-phase boss fights with enraged behaviour at 50% HP.

## Features

- 10 handcrafted enemy archetypes with tiered stats and melee/projectile roles.
- State-machine driven AI with patrol routes, chase logic, and attack triggers.
- Gem and Glitch Skill loot events represented as data objects for easy integration.
- Boss implementation featuring deterministic attack patterns and enraged phases.

## Getting Started

Create a virtual environment (optional) and install dependencies (none required besides Python 3.11+). Run the sandbox script to see the event stream:

```bash
python examples/sandbox.py
```

The script will print the movement, attack, state-change, and loot events generated as the enemies and boss react to a moving player target. Integrate the modules into your engine or gameplay prototype by swapping the vector math and movement hooks with engine-specific implementations.
