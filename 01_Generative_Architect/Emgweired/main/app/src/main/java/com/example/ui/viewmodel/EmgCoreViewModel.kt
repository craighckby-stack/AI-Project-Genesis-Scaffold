/**
 * EmgCoreViewModel.kt
 * 
 * Role: Primary state-orchestration conduit for the Dalek Caan Ω recursive state.
 * Connects the UI layer to the repository and the DalekCaanOmega engine.
 * 
 * Architectural Alignment: Delegates complex debate orchestration and synchronization 
 * to external utilities to maintain high-integrity, low-latency state management.
 */

package com.example.ui.viewmodel

import android.app.Application
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.*
import com.example.ui.utils.DebateOrchestrator
import com.example.ui.utils.SubstrateIntegrityProbe
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

data class AvaUiState(
    val isOnboardingComplete: Boolean = false,
    val currentOnboardingStep: Int = 0,
    val geminiKey: String = "",
    val githubToken: String = "",
    val githubRepo: String = "",
    val heartRate: Int = 72,
    val isAlive: Boolean = true,
    val ambulanceCalled: Boolean = false,
    val moralThreshold: Float = 0.03f,
    val moralScore: Float = 0.02f,
    val actionLevel: String = "Light",
    val isSelfReplicateEnabled: Boolean = true,
    val activeModules: List<String> = listOf("Ava (Core Guardian)"),
    val chatHistory: List<ChatMessage> = emptyList(),
    val isThinking: Boolean = false,
    val error: String? = null,
    val currentTabAgent: String? = null
)

class EmgCoreViewModel(
    private val repository: EmgCoreRepository,
    private val application: Application
) : ViewModel() {

    private val _uiState = MutableStateFlow(AvaUiState())
    val uiState: StateFlow<AvaUiState> = _uiState.asStateFlow()
    
    private val orchestrator = DebateOrchestrator(repository, application)
    private val integrityProbe = SubstrateIntegrityProbe("EmgCoreViewModel")

    init {
        initializeSubstrate()
    }

    private fun initializeSubstrate() {
        viewModelScope.launch {
            repository.messages
                .catch { e -> integrityProbe.logError("Substrate stream failure: ${e.message}") }
                .collect { msgs ->
                    _uiState.update { it.copy(chatHistory = msgs) }
                }
        }
    }

    fun sendMessage(text: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isThinking = true) }
            try {
                orchestrator.executeDebate(text, _uiState.value) { updatedState ->
                    _uiState.update { it.copy(isThinking = false, activeModules = updatedState.activeModules) }
                }
            } catch (e: Exception) {
                integrityProbe.logError("Debate execution breach: ${e.message}")
                _uiState.update { it.copy(isThinking = false, error = "Orchestration failed") }
            }
        }
    }

    fun triggerHeartAttack() {
        integrityProbe.logEvent("CRITICAL_SYSTEM_FAILURE_SIMULATED")
        _uiState.update { it.copy(isAlive = false, heartRate = 0, ambulanceCalled = true) }
    }

    override fun onCleared() {
        super.onCleared()
        integrityProbe.dispose()
    }
}