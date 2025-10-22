from __future__ import annotations

from dataclasses import dataclass
from enum import Enum, auto
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from utils.vector import Vector2


class EnemyState(Enum):
    PATROL = auto()
    ALERT = auto()
    ATTACK = auto()
    ENRAGED = auto()
    STUNNED = auto()
    DEAD = auto()


@dataclass
class StateContext:
    state: EnemyState
    target_position: Optional["Vector2"] = None
    cooldown: float = 0.0
    phase: int = 1


__all__ = ["EnemyState", "StateContext"]
