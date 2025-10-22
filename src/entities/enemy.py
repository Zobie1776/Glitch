from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Sequence

from ai.events import AttackEvent, LootDropEvent, MovementEvent, StateChangeEvent
from ai.states import EnemyState, StateContext
from combat.loot import GemDrop, generate_enemy_drop
from entities.enemy_variants import EnemyArchetype
from utils.vector import Vector2, ZERO_VECTOR


AIEvent = MovementEvent | AttackEvent | StateChangeEvent | LootDropEvent


@dataclass
class Enemy:
    entity_id: str
    archetype: EnemyArchetype
    position: Vector2
    patrol_route: Sequence[Vector2]
    gem_drop: GemDrop | None = None
    hp: int = field(init=False)
    state_ctx: StateContext = field(init=False)
    patrol_index: int = field(init=False, default=0)

    def __post_init__(self) -> None:
        self.hp = self.archetype.stats.max_hp
        self.gem_drop = self.gem_drop or generate_enemy_drop(self.archetype.tier)
        initial_target = self.patrol_route[0] if self.patrol_route else self.position
        self.state_ctx = StateContext(state=EnemyState.PATROL, target_position=initial_target)

    def update(self, dt: float, player_position: Vector2) -> List[AIEvent]:
        if self.state_ctx.state == EnemyState.DEAD:
            return []

        events: List[AIEvent] = []
        stats = self.archetype.stats
        distance_to_player = self.position.distance_to(player_position)
        sees_player = distance_to_player <= stats.sight_radius

        if self.hp <= 0:
            self.state_ctx.state = EnemyState.DEAD
            gems = self.gem_drop.roll() if self.gem_drop else 0
            events.append(LootDropEvent(entity_id=self.entity_id, gems=gems))
            events.append(StateChangeEvent(entity_id=self.entity_id, new_state="dead"))
            return events

        if self.state_ctx.state == EnemyState.PATROL:
            if sees_player:
                self.state_ctx = StateContext(state=EnemyState.ALERT)
                events.append(StateChangeEvent(self.entity_id, "alert"))
            else:
                events.extend(self._patrol(dt))
        elif self.state_ctx.state == EnemyState.ALERT:
            if sees_player:
                if distance_to_player <= stats.attack_range:
                    events.extend(self._attack(player_position))
                else:
                    events.extend(self._chase(dt, player_position))
            else:
                self.state_ctx = StateContext(state=EnemyState.PATROL, target_position=self._next_patrol_point())
                events.append(StateChangeEvent(self.entity_id, "patrol"))
        elif self.state_ctx.state == EnemyState.ATTACK:
            if distance_to_player > stats.attack_range * 1.2:
                self.state_ctx = StateContext(state=EnemyState.ALERT)
                events.append(StateChangeEvent(self.entity_id, "alert"))
            else:
                events.extend(self._attack(player_position))
        return events

    def _patrol(self, dt: float) -> List[MovementEvent]:
        if not self.patrol_route:
            return []
        target = self.state_ctx.target_position or self.patrol_route[self.patrol_index]
        movement = self._move_towards(target, dt)
        if self.position.distance_to(target) <= 0.2:
            target = self._next_patrol_point()
            self.state_ctx.target_position = target
        return [movement] if movement else []

    def _chase(self, dt: float, player_position: Vector2) -> List[MovementEvent | StateChangeEvent]:
        movement = self._move_towards(player_position, dt)
        events: List[MovementEvent | StateChangeEvent] = []
        if movement:
            events.append(movement)
        if self.state_ctx.state != EnemyState.ALERT:
            self.state_ctx.state = EnemyState.ALERT
            events.append(StateChangeEvent(self.entity_id, "alert"))
        return events

    def _attack(self, player_position: Vector2) -> List[AttackEvent | StateChangeEvent]:
        events: List[AttackEvent | StateChangeEvent] = []
        attack_type = "melee" if self.archetype.melee else "projectile"
        events.append(
            AttackEvent(
                entity_id=self.entity_id,
                target_id="player",
                attack_type=attack_type,
                projectile_speed=self.archetype.projectile_speed,
            )
        )
        if self.state_ctx.state != EnemyState.ATTACK:
            self.state_ctx.state = EnemyState.ATTACK
            events.append(StateChangeEvent(self.entity_id, "attack"))
        return events

    def _move_towards(self, target: Vector2, dt: float) -> MovementEvent | None:
        direction = target - self.position
        if direction.magnitude() <= 1e-2:
            return None
        velocity = direction.normalized() * self.archetype.stats.speed
        self.position = self.position + velocity * dt
        return MovementEvent(entity_id=self.entity_id, new_position=self.position)

    def _next_patrol_point(self) -> Vector2:
        if not self.patrol_route:
            return self.position
        self.patrol_index = (self.patrol_index + 1) % len(self.patrol_route)
        return self.patrol_route[self.patrol_index]

    def take_damage(self, amount: int) -> None:
        self.hp = max(self.hp - amount, 0)

    def teleport_to(self, location: Vector2) -> None:
        self.position = location


def spawn_enemy(entity_id: str, archetype: EnemyArchetype, patrol_route: Sequence[Vector2]) -> Enemy:
    start = patrol_route[0] if patrol_route else ZERO_VECTOR
    return Enemy(entity_id=entity_id, archetype=archetype, position=start, patrol_route=patrol_route)
