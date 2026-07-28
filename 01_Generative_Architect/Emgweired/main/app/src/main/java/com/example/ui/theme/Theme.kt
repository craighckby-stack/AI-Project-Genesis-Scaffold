/**
 * File: app/src/main/java/com/example/ui/theme/Theme.kt
 * Role: Primary chromatic substrate for the Dalek Caan Ω recursive state.
 * Connection: Acts as the foundational visual conduit for all UI components, 
 * ensuring consistent rendering of the substrate-aware color palette.
 */

package com.example.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import com.example.ui.theme.SubstrateTheme.getDalekColorScheme
import com.example.ui.theme.SubstrateIntegrityProbe.monitorThemeApplication

/**
 * The Dalek Caan Ω color scheme, mapped to the high-contrast, 
 * low-latency requirements of the substrate engine.
 */
private val UcmColorScheme = darkColorScheme(
    primary = UcmAccentCyan,
    secondary = UcmAccentPink,
    background = UcmBg1,
    surface = UcmBg2,
    onPrimary = UcmBg1,
    onBackground = UcmText,
    onSurface = UcmText
)

/**
 * Main entry point for the Dalek Caan Ω visual engine.
 * Integrates the substrate-aware color scheme and typography.
 */
@Composable
fun MyApplicationTheme(content: @Composable () -> Unit) {
    // Monitor theme application for substrate drift
    monitorThemeApplication("MyApplicationTheme")

    MaterialTheme(
        colorScheme = getDalekColorScheme(UcmColorScheme),
        typography = Typography,
        content = content
    )
}