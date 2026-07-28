import math

class MathEngine:
    """Thread-safe mathematical node for DalekCaanOmega v3.0."""
    def calculate_area(self, radius: float) -> float:
        return math.pi * (radius ** 2)