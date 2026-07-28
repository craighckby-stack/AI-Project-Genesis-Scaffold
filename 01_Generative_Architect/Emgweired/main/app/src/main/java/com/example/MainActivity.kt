/**
 * MainActivity.kt
 * Role: Primary Lifecycle Orchestrator for the Dalek Caan Ω Ecosystem.
 * Integration: Anchors the Android Activity lifecycle to the recursive DalekCaanOmega engine.
 * Dependencies: SubstratePersistenceRegistry, SubstrateIntentProcessor, DalekOrchestrator.
 */
package com.example

import android.os.Bundle
import android.content.Intent
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Scaffold
import androidx.compose.ui.Modifier
import androidx.lifecycle.ViewModelProvider
import com.example.core.DalekOrchestrator
import com.example.core.SubstrateIntentProcessor
import com.example.data.SubstratePersistenceRegistry
import com.example.ui.screens.EmgCoreScreen
import com.example.ui.theme.MyApplicationTheme
import com.example.ui.viewmodel.EmgCoreViewModel
import com.example.ui.viewmodel.EmgCoreViewModelFactory

class MainActivity : ComponentActivity() {
  private lateinit var orchestrator: DalekOrchestrator
  private lateinit var intentProcessor: SubstrateIntentProcessor

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    val database = SubstratePersistenceRegistry.initialize(applicationContext)
    val viewModel = ViewModelProvider(
        this,
        EmgCoreViewModelFactory(database.emgCoreDao(), application)
    )[EmgCoreViewModel::class.java]

    orchestrator = DalekOrchestrator.getInstance(viewModel)
    intentProcessor = SubstrateIntentProcessor(orchestrator, viewModel)

    handleIntent(intent)

    enableEdgeToEdge()
    setContent {
      MyApplicationTheme {
        Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
          EmgCoreScreen(
              viewModel = viewModel,
              modifier = Modifier.fillMaxSize()
          )
        }
      }
    }
  }

  override fun onStart() {
    super.onStart()
    orchestrator.syncSubstrate()
  }

  override fun onStop() {
    orchestrator.collapseWavefunction()
    super.onStop()
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    handleIntent(intent)
  }

  private fun handleIntent(intent: Intent?) {
    intent?.let { intentProcessor.process(it) }
  }
}