/**
 * @file SubstrateVisualIntegrityProbe.kt
 * @description High-fidelity visual verification engine for the Dalek Caan Ω ecosystem.
 * This probe validates the rendering integrity of the UI substrate against the SubstrateVerificationRegistry.
 * It acts as a diagnostic anchor for the system's visual manifestos, ensuring that UI states 
 * are preserved across evolutionary epochs and are not lost to entropy.
 * 
 * @connection SubstrateVerificationRegistry.kt
 */

package com.example

import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onRoot
import com.example.ui.theme.MyApplicationTheme
import com.example.registry.SubstrateVerificationRegistry
import com.github.takahirom.roborazzi.RobolectricDeviceQualifiers
import com.github.takahirom.roborazzi.captureRoboImage
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = RobolectricDeviceQualifiers.Pixel8, sdk = [36])
class GreetingScreenshotTest {

  @get:Rule val composeTestRule = createComposeRule()

  @Test
  fun greeting_screenshot() {
    // Initialize the visual substrate context
    val registry = SubstrateVerificationRegistry.getInstance()
    
    composeTestRule.setContent { 
        MyApplicationTheme { 
            Greeting("Robolectric") 
        } 
    }

    // Capture the visual state for integrity verification
    composeTestRule.onRoot().captureRoboImage(filePath = "src/test/screenshots/greeting.png")
    
    // Verify the visual manifest against the registry
    registry.verifyVisualIntegrity("GREETING_SCREEN_PRIME")
  }
}