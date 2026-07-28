/**
 * EmgCoreScreen.kt
 * Role: Primary UI conduit for the Dalek Caan Ω ecosystem.
 * Connects the user to the recursive state manifestos and provides a visual interface
 * for the Unitary Coherence Matrix (UCM) neural engine.
 * Integrates with EmgWebViewBridge for secure substrate-level communication.
 */

package com.example.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.unit.dp
import com.example.ui.theme.*
import com.example.ui.viewmodel.EmgCoreViewModel
import com.example.ui.components.EmgWebViewBridge
import com.example.ui.components.SubstrateDiagnosticInterface

@Composable
fun EmgCoreScreen(viewModel: EmgCoreViewModel, modifier: Modifier = Modifier) {
    val uiState by viewModel.uiState.collectAsState()

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(colors = listOf(UcmBg1, UcmBg2)))
    ) {
        EmgWebViewBridge(
            viewModel = viewModel,
            jsUrlsToOpen = uiState.jsUrlsToOpen,
            orchestrationRequest = uiState.orchestrationRequest,
            onUrlsOpened = { viewModel.clearJsUrlsToOpen() },
            onOrchestrationTriggered = { viewModel.clearOrchestrationRequest() }
        )

        SubstrateDiagnosticInterface(uiState = uiState, viewModel = viewModel)
    }
}