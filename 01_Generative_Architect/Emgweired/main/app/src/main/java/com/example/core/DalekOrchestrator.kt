package com.example.core

import com.example.ui.viewmodel.EmgCoreViewModel
import com.example.engine.DalekCaanOmega

/**
 * Orchestrates the bridge between the Android ViewModel and the DalekCaanOmega engine.
 */
class DalekOrchestrator private constructor(private val viewModel: EmgCoreViewModel) {
    private val engine = DalekCaanOmega.getInstance()

    companion object {
        @Volatile private var instance: DalekOrchestrator? = null
        fun getInstance(vm: EmgCoreViewModel) = instance ?: synchronized(this) {
            instance ?: DalekOrchestrator(vm).also { instance = it }
        }
    }

    fun syncSubstrate() {
        engine.evolve()
    }

    fun collapseWavefunction() {
        engine.collapseWavefunction()
    }

    fun initiateMetacognitiveShift() {
        engine.initiateMetacognitiveShift()
    }
}