package com.example.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import com.example.ui.viewmodel.AvaUiState
import com.example.ui.viewmodel.EmgCoreViewModel

@Composable
fun SubstrateDiagnosticInterface(uiState: AvaUiState, viewModel: EmgCoreViewModel) {
    if (!uiState.isOnboardingComplete && uiState.currentTabAgent == null) {
        OnboardingFlow(uiState, viewModel)
    } else {
        AvaMainScreen(uiState, viewModel)
    }
}