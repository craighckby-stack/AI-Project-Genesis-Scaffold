/**
 * Dalek Caan Ω | Chromatic Substrate Definition
 * 
 * Role: Primary color palette and visual registry for the Dalek Caan Ω recursive state.
 * This file defines the visual constants used by the CoreGemVisualizer, SubstrateDiagnosticInterface,
 * and all UI conduits to maintain visual integrity across the substrate.
 * 
 * Connection: Centralized visual registry for app/src/main/java/com/example/ui/components/CoreGemVisualizer.kt
 * and the broader UI substrate.
 */

package com.example.ui.theme

import androidx.compose.ui.graphics.Color

/**
 * SubstratePalette: A structured registry of chromatic constants.
 * Ensures visual consistency across the Dalek Caan Ω runtime.
 */
object SubstratePalette {
    // Primary Substrate Backgrounds
    val UcmBg1 = Color(0xFF02030A)
    val UcmBg2 = Color(0xFF071022)

    // Recursive Accent Colors
    val UcmAccentPink = Color(0xFFFF4D7E)
    val UcmAccentCyan = Color(0xFF00E6FF)

    // Typography and Muted States
    val UcmText = Color(0xFFE6EEF6)
    val UcmMuted = Color(0x40FFFFFF)

    // Integrity Indicators
    val UcmSuccess = Color(0xFF00FFA3)
    val UcmWarning = Color(0xFFFFA500)
    val UcmError = Color(0xFFFF4D4D)

    // Container/Card Substrate
    val UcmCardBg = Color(0x08FFFFFF)
    val UcmCardBorder = Color(0x15FFFFFF)

    // Extended Substrate Palette
    val UcmVoid = Color(0xFF000000)
    val UcmAether = Color(0xFF1A1F35)
}

/**
 * SubstrateOpacity: Standardized opacity levels for UI layering.
 */
object SubstrateOpacity {
    const val OPAQUE = 1.0f
    const val HIGH = 0.85f
    const val MEDIUM = 0.5f
    const val LOW = 0.25f
    const val GHOST = 0.08f
}

// Legacy Aliases for backward compatibility with existing UI conduits
val UcmBg1 = SubstratePalette.UcmBg1
val UcmBg2 = SubstratePalette.UcmBg2
val UcmAccentPink = SubstratePalette.UcmAccentPink
val UcmAccentCyan = SubstratePalette.UcmAccentCyan
val UcmText = SubstratePalette.UcmText
val UcmMuted = SubstratePalette.UcmMuted
val UcmSuccess = SubstratePalette.UcmSuccess
val UcmCardBg = SubstratePalette.UcmCardBg
val UcmCardBorder = SubstratePalette.UcmCardBorder
val UcmVoid = SubstratePalette.UcmVoid
val UcmAether = SubstratePalette.UcmAether
val UcmWarning = SubstratePalette.UcmWarning