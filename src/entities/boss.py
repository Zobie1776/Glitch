from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Sequence

from ai.events import AttackEvent, LootDropEvent, StateChangeEvent
from ai.states import EnemyState
from combat.loot import generate_boss_skill
from entities.enemy import AIEvent, Enemy
from entities.enemy_variants import EnemyArchetype
from utils.vector import Vector2, ZERO_VECTOR


@dataclass(frozen=True)
class AttackPattern:
    name: str
    description: str
    attack_type: str
    cooldown: float


@dataclass(frozen=True)
class BossPhase:
    name: str
    threshold: float
    patterns: Sequence[AttackPattern]


@dataclass
class Boss(Enemy):
    level: int = 1
    phases: Sequence[BossPhase] = field(default_factory=tuple)
    enraged: bool = field(init=False, default=False)
    pattern_index: int = field(init=False, default=0)
    pattern_cooldown: float = field(init=False, default=0.0)

    def __post_init__(self) -> None:
        super().__post_init__()
        if not self.phases:
            self.phases = _default_phases(self.archetype)
        self.state_ctx.phase = 1

    def update(self, dt: float, player_position: Vector2) -> List[AIEvent]:
        events = super().update(dt, player_position)
        if self.state_ctx.state == EnemyState.DEAD:
            if events and isinstance(events[-1], StateChangeEvent) and events[-1].new_state == "dead":
                skill = generate_boss_skill(self.level)
                events.append(LootDropEvent(entity_id=self.entity_id, gems=0, skill_id=skill.skill_id))
            return events

        hp_ratio = self.hp / self.archetype.stats.max_hp
        next_phase = self._determine_phase(hp_ratio)
        if next_phase != self.state_ctx.phase:
            self.state_ctx.phase = next_phase
            events.append(StateChangeEvent(self.entity_id, f"phase_{next_phase}"))

        if hp_ratio <= 0.5 and not self.enraged:
            self.enraged = True
            self.state_ctx.state = EnemyState.ENRAGED
            events.append(StateChangeEvent(self.entity_id, "enraged"))

        if self.state_ctx.state in {EnemyState.ATTACK, EnemyState.ENRAGED}:
            events.extend(self._execute_pattern(dt))
        return events

    def _attack(self, player_position: Vector2):  # type: ignore[override]
        events: List[StateChangeEvent] = []
        if self.state_ctx.state != EnemyState.ATTACK:
            self.state_ctx.state = EnemyState.ATTACK
            events.append(StateChangeEvent(self.entity_id, "attack"))
        return events

    def _execute_pattern(self, dt: float) -> List[AIEvent]:
        if not self.phases:
            return []
        current_phase = self.phases[self.state_ctx.phase - 1]
        if self.pattern_cooldown > 0:
            self.pattern_cooldown = max(self.pattern_cooldown - dt, 0.0)
            return []
        pattern = current_phase.patterns[self.pattern_index % len(current_phase.patterns)]
        self.pattern_index += 1
        self.pattern_cooldown = pattern.cooldown * (0.6 if self.enraged else 1.0)
        attack_event = AttackEvent(
            entity_id=self.entity_id,
            target_id="player",
            attack_type=pattern.attack_type,
            projectile_speed=self.archetype.projectile_speed,
        )
        description_event = StateChangeEvent(
            entity_id=self.entity_id,
            new_state=f"pattern:{pattern.name}",
        )
        return [description_event, attack_event]

    def _determine_phase(self, hp_ratio: float) -> int:
        for index, phase in enumerate(self.phases, start=1):
            if hp_ratio <= phase.threshold:
                return min(index + 1, len(self.phases))
        return 1


def create_boss(entity_id: str, archetype: EnemyArchetype, level: int, patrol_route: Sequence[Vector2]) -> Boss:
    start = patrol_route[0] if patrol_route else ZERO_VECTOR
    return Boss(entity_id=entity_id, archetype=archetype, position=start, patrol_route=patrol_route, level=level)


def _default_phases(archetype: EnemyArchetype) -> Sequence[BossPhase]:
    melee_patterns = [
        AttackPattern(
            name="cleave",
            description="Wide melee swipe",
            attack_type="melee",
            cooldown=2.5,
        ),
        AttackPattern(
            name="charge",
            description="Lunges toward the player",
            attack_type="melee",
            cooldown=4.0,
        ),
    ]
    projectile_patterns = [
        AttackPattern(
            name="burst",
            description="Fires a burst of projectiles",
            attack_type="projectile",
            cooldown=3.0,
        ),
        AttackPattern(
            name="sniper",
            description="Aimed high-damage shot",
            attack_type="projectile",
            cooldown=4.5,
        ),
    ]
    patterns = melee_patterns if archetype.melee else projectile_patterns
    return (
        BossPhase(name="opening", threshold=0.75, patterns=patterns),
        BossPhase(name="mid", threshold=0.5, patterns=patterns),
        BossPhase(name="final", threshold=0.25, patterns=patterns),
    )
