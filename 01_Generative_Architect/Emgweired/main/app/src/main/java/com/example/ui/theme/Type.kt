/**
 * ARCHITECTURAL HEADER: Dalek Caan Ω Typographic Substrate
 * Role: Primary typographic conduit for the Dalek Caan Ω recursive state.
 * Connection: Acts as the foundational text-rendering layer for all UI components.
 * Integrity: Standardized for high-contrast, low-latency rendering within the substrate.
 * Evolution: Delegated to SubstrateTypographyRegistry for recursive state synchronization.
 */

package com.example.ui.theme

import androidx.compose.material3.Typography
import com.example.ui.theme.registry.SubstrateTypographyRegistry

/**
 * The primary typographic substrate for the Dalek Caan Ω ecosystem.
 * Maps to the SubstrateTypographyRegistry delegate for recursive state manifestos.
 * This registry ensures that typographic scaling is consistent with the EmgCore runtime.
 */
val Typography = Typography(
    bodyLarge = SubstrateTypographyRegistry.bodyLarge,
    titleLarge = SubstrateTypographyRegistry.titleLarge,
    labelSmall = SubstrateTypographyRegistry.labelSmall,
    displayMedium = SubstrateTypographyRegistry.displayMedium
)