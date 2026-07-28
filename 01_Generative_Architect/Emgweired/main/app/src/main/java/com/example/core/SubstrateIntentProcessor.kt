package com.example.core

import android.content.Intent
import com.example.ui.viewmodel.EmgCoreViewModel

class SubstrateIntentProcessor(private val orchestrator: DalekOrchestrator, private val viewModel: EmgCoreViewModel) {
    fun process(intent: Intent) {
        val uri = intent.data ?: return
        
        if (uri.getQueryParameter("trigger_metacognition") == "true") {
            orchestrator.initiateMetacognitiveShift()
        }

        val geminiKey = uri.getQueryParameter("gemini_key")
        val githubToken = uri.getQueryParameter("github_token")
        val githubRepo = uri.getQueryParameter("github_repo")

        if (!geminiKey.isNullOrBlank() || !githubToken.isNullOrBlank() || !githubRepo.isNullOrBlank()) {
            viewModel.updateCredentials(geminiKey ?: "", githubToken ?: "", githubRepo ?: "")
        }

        val agent = uri.getQueryParameter("agent")
        val query = uri.getQueryParameter("query")
        if (agent != null && query != null) {
            viewModel.handleIncomingQueryFromTab(agent, query)
        }
    }
}