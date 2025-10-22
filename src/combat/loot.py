from __future__ import annotations

from dataclasses import dataclass
from random import randint
from typing import Tuple


@dataclass
class GemDrop:
    min_amount: int
    max_amount: int

    def roll(self) -> int:
        return randint(self.min_amount, self.max_amount)


@dataclass
class SkillDrop:
    skill_id: str
    description: str


def generate_enemy_drop(tier: int) -> GemDrop:
    base = 5 + tier * 3
    return GemDrop(min_amount=base, max_amount=base + tier * 2)


def generate_boss_skill(level: int) -> SkillDrop:
    return SkillDrop(
        skill_id=f"glitch_skill_{level}",
        description=f"Unlocks Glitch Skill tier {level}",
    )
