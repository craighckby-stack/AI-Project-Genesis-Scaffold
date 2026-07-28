/**
 * EmgWebViewBridge.kt
 * Role: Secure substrate-level communication bridge for the Dalek Caan Ω ecosystem.
 * Handles WebView lifecycle, JavaScript interface injection, and event routing.
 */

package com.example.ui.components

import android.webkit.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import com.example.ui.viewmodel.DebateOrchestrationRequest
import com.example.ui.viewmodel.EmgCoreViewModel
import org.json.JSONArray
import org.json.JSONObject

class WebAppInterface(private val onStreamMsg: (String, String, Boolean) -> Unit) {
    @JavascriptInterface
    fun postMessage(messageJson: String) {
        try {
            val json = JSONObject(messageJson)
            onStreamMsg(json.optString("sender", "Agent"), json.optString("text", ""), json.optBoolean("isComplete", false))
        } catch (e: Exception) {}
    }
}

@Composable
fun EmgWebViewBridge(
    viewModel: EmgCoreViewModel,
    jsUrlsToOpen: List<String>,
    orchestrationRequest: DebateOrchestrationRequest?,
    onUrlsOpened: () -> Unit,
    onOrchestrationTriggered: () -> Unit
) {
    AndroidView(
        factory = { ctx ->
            WebView(ctx).apply {
                settings.javaScriptEnabled = true
                addJavascriptInterface(WebAppInterface { s, t, c -> viewModel.handleIncomingStreamMessage(s, t, c) }, "AndroidApp")
                loadUrl("https://ais-dev-bccihmxdfqbigm76cgl2dp-483535245139.asia-southeast1.run.app")
            }
        },
        update = { webView ->
            if (jsUrlsToOpen.isNotEmpty()) {
                jsUrlsToOpen.forEach { webView.evaluateJavascript("window.open('$it', '_blank');", null) }
                onUrlsOpened()
            }
            if (orchestrationRequest != null) {
                val json = JSONArray(orchestrationRequest.debaters).toString()
                webView.evaluateJavascript("window.orchestrateAgentDebate('$json', '${orchestrationRequest.query}', '${orchestrationRequest.geminiKey}', '${orchestrationRequest.githubToken}', '${orchestrationRequest.githubRepo}');", null)
                onOrchestrationTriggered()
            }
        },
        modifier = Modifier.size(0.dp)
    )
}