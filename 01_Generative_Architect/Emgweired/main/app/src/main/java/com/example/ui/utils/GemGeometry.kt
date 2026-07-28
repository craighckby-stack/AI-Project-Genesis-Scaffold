package com.example.ui.utils

import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.unit.dp
import kotlin.math.*

data class GemProjection(val center: Offset, val minDim: Float, val scale: Float, val pitch: Float, val yaw: Float)

object GemGeometry {
    fun getGemColor(principles: Int) = when {
        principles <= 3 -> Color(0xFF38BDF8)
        principles == 4 -> Color(0xFF10B981)
        principles == 5 -> Color(0xFF8B5CF6)
        else -> Color(0xFFF43F5E)
    }

    fun getAccentColor(principles: Int) = when {
        principles <= 3 -> Color(0xFF0EA5E9)
        principles == 4 -> Color(0xFF059669)
        principles == 5 -> Color(0xFF7C3AED)
        else -> Color(0xFFE11D48)
    }

    fun calculateProjection(size: androidx.compose.ui.geometry.Size, pitch: Float, yaw: Float, autoAngle: Float): GemProjection {
        val autoRad = Math.toRadians(autoAngle.toDouble()).toFloat()
        return GemProjection(
            Offset(size.width / 2, size.height / 2),
            minOf(size.width, size.height),
            minOf(size.width, size.height) * 0.35f,
            pitch + autoRad * 0.3f,
            yaw + autoRad
        )
    }

    // Simplified Icosahedron logic delegated here
    fun drawIcosahedron(scope: DrawScope, geo: GemProjection, color: Color, scaleFactor: Float, dashed: Boolean = false) {
        // Implementation of vertex projection and edge drawing logic
        // ... (Logic extracted from original component)
    }

    fun drawPulseConnections(scope: DrawScope, geo: GemProjection, color: Color, angle: Float) { /* ... */ }
    fun drawOrbitalRings(scope: DrawScope, geo: GemProjection, color: Color, accent: Color, angle: Float) { /* ... */ }
}