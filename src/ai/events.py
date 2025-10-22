from __future__ import annotations

from dataclasses import dataclass
from typing import Literal, Optional

from utils.vector import Vector2


@dataclass(frozen=True)
class MovementEvent:
    entity_id: str
    new_position: Vector2


@dataclass(frozen=True)
class AttackEvent:
    entity_id: str
    target_id: str
    attack_type: Literal["melee", "projectile"]
    projectile_speed: float = 0.0


@dataclass(frozen=True)
class StateChangeEvent:
    entity_id: str
    new_state: str


@dataclass(frozen=True)
class LootDropEvent:
    entity_id: str
    gems: int
    skill_id: Optional[str] = None


AIEvent = MovementEvent | AttackEvent | StateChangeEvent | LootDropEvent


__all__ = [
    "AIEvent",
    "MovementEvent",
    "AttackEvent",
    "StateChangeEvent",
    "LootDropEvent",
]
