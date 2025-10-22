from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Iterable, List, Sequence

from ai.events import AIEvent
from ai.states import EnemyState
from entities.boss import Boss, create_boss
from entities.enemy import Enemy, spawn_enemy
from entities.enemy_variants import ENEMY_VARIANTS, EnemyArchetype
from utils.vector import Vector2


@dataclass
class EnemyDefinition:
    archetype_id: str
    patrol_route: Sequence[Vector2]


@dataclass
class BossDefinition:
    archetype_id: str
    level: int
    patrol_route: Sequence[Vector2]


@dataclass
class EnemyManager:
    enemies: Dict[str, Enemy] = field(default_factory=dict)
    bosses: Dict[str, Boss] = field(default_factory=dict)

    def spawn_enemies(self, definitions: Iterable[EnemyDefinition]) -> None:
        for index, definition in enumerate(definitions, start=1):
            archetype = self._resolve_archetype(definition.archetype_id)
            entity_id = f"enemy_{index}_{definition.archetype_id}"
            self.enemies[entity_id] = spawn_enemy(entity_id, archetype, definition.patrol_route)

    def spawn_boss(self, boss_id: str, definition: BossDefinition) -> None:
        archetype = self._resolve_archetype(definition.archetype_id)
        self.bosses[boss_id] = create_boss(boss_id, archetype, definition.level, definition.patrol_route)

    def update(self, dt: float, player_position: Vector2) -> List[AIEvent]:
        events: List[AIEvent] = []
        for enemy in list(self.enemies.values()):
            events.extend(enemy.update(dt, player_position))
            if enemy.state_ctx.state == EnemyState.DEAD:
                del self.enemies[enemy.entity_id]
        for boss in list(self.bosses.values()):
            events.extend(boss.update(dt, player_position))
            if boss.state_ctx.state == EnemyState.DEAD:
                del self.bosses[boss.entity_id]
        return events

    def _resolve_archetype(self, archetype_id: str) -> EnemyArchetype:
        try:
            return ENEMY_VARIANTS[archetype_id]
        except KeyError as exc:
            raise ValueError(f"Unknown archetype id: {archetype_id}") from exc
