from __future__ import annotations

from dataclasses import dataclass


@dataclass
class CombatStats:
    max_hp: int
    speed: float
    attack_power: int
    attack_range: float
    sight_radius: float

    def copy(self) -> "CombatStats":
        return CombatStats(
            max_hp=self.max_hp,
            speed=self.speed,
            attack_power=self.attack_power,
            attack_range=self.attack_range,
            sight_radius=self.sight_radius,
        )
