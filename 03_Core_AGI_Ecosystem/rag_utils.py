"""
Utility helpers for EvoRagEngine.
Provides vector-space transformations and graph-traversal logic.
"""

class VectorSpaceTransformer:
    @staticmethod
    def normalize(vector: List[float]) -> List[float]:
        # Standard normalization for RAG similarity search
        magnitude = sum(x**2 for x in vector)**0.5
        if magnitude == 0: return vector
        return [x / magnitude for x in vector]