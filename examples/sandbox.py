from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT / "src"))

from ai.controller import BossDefinition, EnemyDefinition, EnemyManager
from utils.vector import Vector2


def main() -> None:
    manager = EnemyManager()
    patrol_line = [Vector2(0, 0), Vector2(5, 0), Vector2(5, 5)]
    manager.spawn_enemies(
        [
            EnemyDefinition("glitchling_scout", patrol_line),
            EnemyDefinition("data_wisp", patrol_line),
        ]
    )

    manager.spawn_boss(
        "boss_level_10",
        BossDefinition(
            archetype_id="kernel_hydra",
            level=1,
            patrol_route=[Vector2(10, 10), Vector2(12, 10)],
        ),
    )

    player_position = Vector2(3, 3)
    timeline = []
    for frame in range(10):
        events = manager.update(0.16, player_position)
        timeline.append((frame, events))
        player_position = player_position + Vector2(0.5, 0)

    for frame, events in timeline:
        print(f"Frame {frame} events:")
        for event in events:
            print(f"  {event}")
        print()


if __name__ == "__main__":
    main()
