from __future__ import annotations

from dataclasses import dataclass
import math


@dataclass(frozen=True)
class Vector2:
    """Simple 2D vector helper for AI movement."""

    x: float
    y: float

    def __add__(self, other: "Vector2") -> "Vector2":
        return Vector2(self.x + other.x, self.y + other.y)

    def __sub__(self, other: "Vector2") -> "Vector2":
        return Vector2(self.x - other.x, self.y - other.y)

    def __mul__(self, scalar: float) -> "Vector2":
        return Vector2(self.x * scalar, self.y * scalar)

    def __truediv__(self, scalar: float) -> "Vector2":
        if scalar == 0:
            raise ZeroDivisionError("Cannot divide vector by zero")
        return Vector2(self.x / scalar, self.y / scalar)

    def magnitude(self) -> float:
        return math.hypot(self.x, self.y)

    def normalized(self) -> "Vector2":
        mag = self.magnitude()
        if mag == 0:
            return Vector2(0.0, 0.0)
        return self / mag

    def distance_to(self, other: "Vector2") -> float:
        return (self - other).magnitude()

    def lerp(self, other: "Vector2", t: float) -> "Vector2":
        return Vector2(self.x + (other.x - self.x) * t, self.y + (other.y - self.y) * t)


ZERO_VECTOR = Vector2(0.0, 0.0)
