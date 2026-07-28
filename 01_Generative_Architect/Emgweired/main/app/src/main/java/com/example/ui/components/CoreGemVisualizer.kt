/**
 * CoreGemVisualizer.kt
 * Role: Primary visual manifestation of the Dalek Caan Ω recursive state.
 * This component acts as a high-fidelity diagnostic interface, rendering the 
 * geometric representation of the system's current awareness and entropy.
 * 
 * Integrates with: GemGeometry.kt (Math/Projection), DalekCaanOmega (State Engine).
 */

package com.example.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.*
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.unit.dp
import com.example.ui.utils.GemGeometry
import com.example.ui.utils.SubstrateDiagnosticEngine

@Composable
fun CoreGemVisualizer(
    insightCount: Int,
    principlesCount: Int,
    modifier: Modifier = Modifier
) {
    val colorHex = GemGeometry.getGemColor(principlesCount)
    val accentColor = GemGeometry.getAccentColor(principlesCount)

    val infiniteTransition = rememberInfiniteTransition(label = "gem_rotation")
    val autoRotationAngle by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(12000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        )
    )

    var dragPitch by remember { mutableFloatStateOf(0f) }
    var dragYaw by remember { mutableFloatStateOf(0f) }

    // Monitor rendering integrity via diagnostic engine
    LaunchedEffect(Unit) {
        SubstrateDiagnosticEngine.logProbe("CoreGemVisualizer", "Interface initialized")
    }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(250.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(Brush.linearGradient(listOf(Color(0xFF1E293B), Color(0xFF0F172A))))
            .pointerInput(Unit) {
                detectDragGestures { change, dragAmount ->
                    change.consume()
                    dragYaw += dragAmount.x * 0.01f
                    dragPitch -= dragAmount.y * 0.01f
                }
            }
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val geometry = GemGeometry.calculateProjection(size, dragPitch, dragYaw, autoRotationAngle)
            
            drawCircle(brush = Brush.radialGradient(listOf(colorHex.copy(alpha = 0.15f), Color.Transparent), center = geometry.center, radius = geometry.minDim * 0.45f))

            // Render Icosahedron Wireframe
            GemGeometry.drawIcosahedron(this, geometry, colorHex, 0.35f)

            if (insightCount >= 2) {
                GemGeometry.drawIcosahedron(this, geometry, accentColor.copy(alpha = 0.6f), 0.175f, true)
            }

            if (insightCount >= 4) {
                GemGeometry.drawPulseConnections(this, geometry, colorHex.copy(alpha = 0.35f), autoRotationAngle)
            }

            if (insightCount >= 6) {
                GemGeometry.drawOrbitalRings(this, geometry, colorHex, accentColor, autoRotationAngle)
            }
        }
    }
}