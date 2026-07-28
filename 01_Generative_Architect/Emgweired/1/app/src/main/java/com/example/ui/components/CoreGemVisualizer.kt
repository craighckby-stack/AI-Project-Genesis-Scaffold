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
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.unit.dp
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt

data class Float3(val x: Float, val y: Float, val z: Float)

@Composable
fun CoreGemVisualizer(
    insightCount: Int,
    principlesCount: Int,
    modifier: Modifier = Modifier
) {
    // Determine colors based on principles count (same hex map as original JS)
    // 0x38bdf8 (Sky), 0x10b981 (Emerald), 0x8b5cf6 (Purple), 0xf43f5e (Rose)
    val colorHex = when {
        principlesCount <= 3 -> Color(0xFF38BDF8)
        principlesCount == 4 -> Color(0xFF10B981)
        principlesCount == 5 -> Color(0xFF8B5CF6)
        else -> Color(0xFFF43F5E)
    }

    // Secondary complementary color for depth/glow
    val accentColor = when {
        principlesCount <= 3 -> Color(0xFF0EA5E9)
        principlesCount == 4 -> Color(0xFF059669)
        principlesCount == 5 -> Color(0xFF7C3AED)
        else -> Color(0xFFE11D48)
    }

    // Auto-rotation angles
    val infiniteTransition = rememberInfiniteTransition(label = "gem_rotation")
    val autoRotationAngle by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(12000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "angle"
    )

    // Interactive user drag rotation offsets
    var dragPitch by remember { mutableFloatStateOf(0f) }
    var dragYaw by remember { mutableFloatStateOf(0f) }

    // Icosahedron math: 12 vertices
    val goldenRatio = (1f + sqrt(5f)) / 2f
    val baseVertices = remember {
        listOf(
            Float3(-1f, goldenRatio, 0f),
            Float3(1f, goldenRatio, 0f),
            Float3(-1f, -goldenRatio, 0f),
            Float3(1f, -goldenRatio, 0f),

            Float3(0f, -1f, goldenRatio),
            Float3(0f, 1f, goldenRatio),
            Float3(0f, -1f, -goldenRatio),
            Float3(0f, 1f, -goldenRatio),

            Float3(goldenRatio, 0f, -1f),
            Float3(goldenRatio, 0f, 1f),
            Float3(-goldenRatio, 0f, -1f),
            Float3(-goldenRatio, 0f, 1f)
        ).map { v ->
            val len = sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
            Float3(v.x / len, v.y / len, v.z / len)
        }
    }

    // 30 unique edges
    val edges = remember {
        listOf(
            0 to 1, 0 to 5, 0 to 7, 0 to 10, 0 to 11,
            1 to 5, 1 to 7, 1 to 8, 1 to 9,
            2 to 3, 2 to 4, 2 to 6, 2 to 10, 2 to 11,
            3 to 4, 3 to 6, 3 to 8, 3 to 9,
            4 to 5, 4 to 9, 4 to 11,
            5 to 9, 5 to 11,
            6 to 7, 6 to 8, 6 to 10,
            7 to 8, 7 to 10,
            8 to 9,
            10 to 11
        )
    }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(250.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(
                Brush.linearGradient(
                    colors = listOf(Color(0xFF1E293B), Color(0xFF0F172A))
                )
            )
            .pointerInput(Unit) {
                detectDragGestures { change, dragAmount ->
                    change.consume()
                    // Map horizontal drag to Yaw and vertical drag to Pitch
                    dragYaw += dragAmount.x * 0.01f
                    dragPitch -= dragAmount.y * 0.01f
                }
            }
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val width = size.width
            val height = size.height
            val centerX = width / 2
            val centerY = height / 2
            val minDim = minOf(width, height)
            val outerScale = minDim * 0.35f

            // Total rotation including auto rotation and manual drag
            val autoRad = Math.toRadians(autoRotationAngle.toDouble()).toFloat()
            val finalPitch = dragPitch + autoRad * 0.3f
            val finalYaw = dragYaw + autoRad

            // Camera distance for perspective projection
            val cameraDist = 3.0f

            fun rotateAndProject(point: Float3, scale: Float): Offset {
                // Rotate around Y-axis (Yaw)
                val cosY = cos(finalYaw)
                val sinY = sin(finalYaw)
                val x1 = point.x * cosY - point.z * sinY
                val z1 = point.x * sinY + point.z * cosY
                val y1 = point.y

                // Rotate around X-axis (Pitch)
                val cosP = cos(finalPitch)
                val sinP = sin(finalPitch)
                val y2 = y1 * cosP + z1 * sinP
                val z2 = -y1 * sinP + z1 * cosP
                val x2 = x1

                // Perspective projection mapping 3D to 2D
                val factor = scale / (cameraDist - z2)
                val px = centerX + x2 * factor
                val py = centerY + y2 * factor
                return Offset(px, py)
            }

            // Draw concentric background glow
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(colorHex.copy(alpha = 0.15f), Color.Transparent),
                    center = Offset(centerX, centerY),
                    radius = minDim * 0.45f
                )
            )

            // Draw outer wireframe layer (Main core Icosahedron)
            val projectedOuter = baseVertices.map { rotateAndProject(it, outerScale) }

            edges.forEach { (u, v) ->
                drawLine(
                    color = colorHex.copy(alpha = 0.7f),
                    start = projectedOuter[u],
                    end = projectedOuter[v],
                    strokeWidth = 2.dp.toPx(),
                    cap = StrokeCap.Round
                )
            }

            // Draw glowing vertex nodes
            projectedOuter.forEach { offset ->
                drawCircle(
                    color = colorHex,
                    radius = 4.dp.toPx(),
                    center = offset
                )
                drawCircle(
                    color = Color.White,
                    radius = 2.dp.toPx(),
                    center = offset
                )
            }

            // Dynamic detail level 1: Concentric inner icosahedron (visible as insights grow)
            if (insightCount >= 2) {
                val innerScale = outerScale * 0.5f
                val projectedInner = baseVertices.map { rotateAndProject(it, innerScale) }
                val innerColor = accentColor.copy(alpha = 0.6f)

                edges.forEach { (u, v) ->
                    drawLine(
                        color = innerColor,
                        start = projectedInner[u],
                        end = projectedInner[v],
                        strokeWidth = 1.dp.toPx(),
                        pathEffect = PathEffect.dashPathEffect(floatArrayOf(10f, 10f), 0f),
                        cap = StrokeCap.Round
                    )
                }

                projectedInner.forEach { offset ->
                    drawCircle(
                        color = accentColor,
                        radius = 2.dp.toPx(),
                        center = offset
                    )
                }
            }

            // Dynamic detail level 2: Sparkline center connections (simulates high connectivity mapped)
            if (insightCount >= 4) {
                // Pulse effect from centers to outer vertices
                val pulseScale = 0.35f + 0.15f * sin(autoRad * 5f)
                val pulsingColor = colorHex.copy(alpha = 0.35f)

                projectedOuter.forEach { outerPt ->
                    drawLine(
                        color = pulsingColor,
                        start = Offset(centerX, centerY),
                        end = outerPt,
                        strokeWidth = 1.dp.toPx()
                    )
                }
            }

            // Dynamic detail level 3: Orbit rings rotating in opposite directions (simulates core evolution)
            if (insightCount >= 6) {
                val orbitRadius = outerScale * 1.3f
                val steps = 36
                val ringPoints = mutableListOf<Offset>()
                val ringPointsAlt = mutableListOf<Offset>()

                for (i in 0..steps) {
                    val angle = (i * 2 * Math.PI / steps).toFloat()
                    // Orbit 1: X-Z plane
                    val x = orbitRadius * cos(angle)
                    val z = orbitRadius * sin(angle)
                    val y = 0f
                    // Orbit 2: Y-Z plane
                    val xAlt = 0f
                    val zAlt = orbitRadius * cos(angle)
                    val yAlt = orbitRadius * sin(angle)

                    // Alternate reverse rotation for orbital visual interest
                    val radAlt = -autoRad * 0.5f
                    val cosAlt = cos(radAlt)
                    val sinAlt = sin(radAlt)

                    // Rotate Orbit 1
                    val x1 = x * cosAlt - z * sinAlt
                    val z1 = x * sinAlt + z * cosAlt
                    val factor1 = outerScale / (cameraDist - z1)
                    ringPoints.add(Offset(centerX + x1 * factor1, centerY + y * factor1))

                    // Rotate Orbit 2
                    val z2 = zAlt * cos(radAlt * 0.8f) - yAlt * sin(radAlt * 0.8f)
                    val y2 = zAlt * sin(radAlt * 0.8f) + yAlt * cos(radAlt * 0.8f)
                    val factor2 = outerScale / (cameraDist - z2)
                    ringPointsAlt.add(Offset(centerX + xAlt * factor2, centerY + y2 * factor2))
                }

                // Draw orbital paths
                for (i in 0 until ringPoints.size - 1) {
                    drawLine(
                        color = colorHex.copy(alpha = 0.25f),
                        start = ringPoints[i],
                        end = ringPoints[i + 1],
                        strokeWidth = 1.5.dp.toPx()
                    )
                    drawLine(
                        color = accentColor.copy(alpha = 0.2f),
                        start = ringPointsAlt[i],
                        end = ringPointsAlt[i + 1],
                        strokeWidth = 1.5.dp.toPx()
                    )
                }
            }
        }
    }
}
