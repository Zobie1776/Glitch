from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List

from entities.stats import CombatStats


@dataclass(frozen=True)
class EnemyArchetype:
    name: str
    tier: int
    melee: bool
    stats: CombatStats
    projectile_speed: float = 0.0
    description: str = ""


ENEMY_VARIANTS: Dict[str, EnemyArchetype] = {
    "glitchling_scout": EnemyArchetype(
        name="Glitchling Scout",
        tier=1,
        melee=True,
        stats=CombatStats(max_hp=30, speed=2.5, attack_power=6, attack_range=1.2, sight_radius=6.0),
        description="Fast melee unit that scouts the area.",
    ),
    "glitchling_guard": EnemyArchetype(
        name="Glitchling Guard",
        tier=1,
        melee=True,
        stats=CombatStats(max_hp=40, speed=2.0, attack_power=8, attack_range=1.3, sight_radius=5.5),
        description="Durable melee defender.",
    ),
    "data_wisp": EnemyArchetype(
        name="Data Wisp",
        tier=1,
        melee=False,
        stats=CombatStats(max_hp=25, speed=2.2, attack_power=5, attack_range=6.0, sight_radius=7.0),
        projectile_speed=7.5,
        description="Short-range projectile caster.",
    ),
    "bitcrusher": EnemyArchetype(
        name="Bitcrusher",
        tier=2,
        melee=True,
        stats=CombatStats(max_hp=55, speed=1.8, attack_power=12, attack_range=1.4, sight_radius=6.5),
        description="Heavy hitter that crushes foes up close.",
    ),
    "packet_stalker": EnemyArchetype(
        name="Packet Stalker",
        tier=2,
        melee=True,
        stats=CombatStats(max_hp=45, speed=3.0, attack_power=9, attack_range=1.1, sight_radius=8.0),
        description="Ambusher with high speed.",
    ),
    "signal_shade": EnemyArchetype(
        name="Signal Shade",
        tier=2,
        melee=False,
        stats=CombatStats(max_hp=38, speed=2.4, attack_power=10, attack_range=6.5, sight_radius=7.5),
        projectile_speed=8.5,
        description="Casts erratic packets of corrupted data.",
    ),
    "malware_beast": EnemyArchetype(
        name="Malware Beast",
        tier=3,
        melee=True,
        stats=CombatStats(max_hp=75, speed=2.1, attack_power=15, attack_range=1.6, sight_radius=8.5),
        description="Ferocious corrupted beast.",
    ),
    "code_reaver": EnemyArchetype(
        name="Code Reaver",
        tier=3,
        melee=True,
        stats=CombatStats(max_hp=65, speed=2.8, attack_power=13, attack_range=1.4, sight_radius=9.0),
        description="Balanced elite fighter with high awareness.",
    ),
    "logic_siphon": EnemyArchetype(
        name="Logic Siphon",
        tier=3,
        melee=False,
        stats=CombatStats(max_hp=60, speed=2.3, attack_power=14, attack_range=7.0, sight_radius=9.5),
        projectile_speed=9.0,
        description="Channels beams of siphoned logic energy.",
    ),
    "kernel_hydra": EnemyArchetype(
        name="Kernel Hydra",
        tier=4,
        melee=False,
        stats=CombatStats(max_hp=90, speed=2.0, attack_power=18, attack_range=7.5, sight_radius=10.0),
        projectile_speed=9.5,
        description="Multi-headed foe with alternating projectile patterns.",
    ),
}


def list_variants() -> List[EnemyArchetype]:
    return list(ENEMY_VARIANTS.values())
