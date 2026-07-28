package com.example.ui.viewmodel

import android.app.Application
import android.content.Context
import android.util.Base64
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.data.*
import com.squareup.moshi.Moshi
import com.squareup.moshi.Types
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.nio.charset.StandardCharsets
import java.text.SimpleDateFormat
import java.util.*

data class EmgCoreUiState(
    val userId: String = "",
    val authStatus: String = "Connecting...",
    val principles: List<String> = emptyList(),
    val learningLog: List<String> = emptyList(),
    val evolutionHistory: List<String> = emptyList(),
    val insightConnections: List<InsightConnection> = emptyList(),
    val chatHistory: List<ChatMessage> = emptyList(),
    val isReady: Boolean = false,
    val isThinking: Boolean = false,
    val thinkingStep: String = "",
    val error: String? = null,
    val evolutionSummary: String? = null,
    val showEvolutionSummary: Boolean = false,
    val suggestedConcepts: List<String> = emptyList(),
    val showSuggestedConcepts: Boolean = false,
    val githubToken: String = "",
    val githubRepoOwner: String = "Craig444444444",
    val githubRepoName: String = "EMG-Core-Analysis-System",
    val isHighThinkingEnabled: Boolean = true,
    val isApiKeyConfigured: Boolean = false
)

class EmgCoreViewModel(
    private val repository: EmgCoreRepository,
    private val application: Application
) : ViewModel() {

    private val _uiState = MutableStateFlow(EmgCoreUiState())
    val uiState: StateFlow<EmgCoreUiState> = _uiState.asStateFlow()

    private val moshi = Moshi.Builder()
        .add(KotlinJsonAdapterFactory())
        .build()

    init {
        // Initialize User ID (persistent local UUID)
        val sharedPrefs = application.getSharedPreferences("emg_core_prefs", Context.MODE_PRIVATE)
        var userId = sharedPrefs.getString("user_id", null)
        if (userId == null) {
            userId = "EMG-" + UUID.randomUUID().toString().take(18).uppercase()
            sharedPrefs.edit().putString("user_id", userId).apply()
        }

        val savedToken = sharedPrefs.getString("github_token", "") ?: ""

        _uiState.update {
            it.copy(
                userId = userId,
                authStatus = "Online (Local DB)",
                githubToken = savedToken,
                isApiKeyConfigured = GeminiClient.isApiKeyConfigured()
            )
        }

        // Observe Room DB flows
        viewModelScope.launch {
            combine(
                repository.principles,
                repository.learningLogs,
                repository.evolutionMarkers,
                repository.connections,
                repository.messages
            ) { principles, logs, markers, conns, msgs ->
                // If principles are empty, seed them with standard defaults
                if (principles.isEmpty()) {
                    seedDefaultPrinciples()
                }

                _uiState.update {
                    it.copy(
                        principles = principles.map { p -> p.text },
                        learningLog = logs.map { l -> l.text },
                        evolutionHistory = markers.map { m -> m.text },
                        insightConnections = conns,
                        chatHistory = msgs,
                        isReady = true
                    )
                }
            }.collect()
        }
    }

    private fun seedDefaultPrinciples() {
        viewModelScope.launch {
            val defaults = listOf(
                "interconnectedness",
                "growth through reflection",
                "contextual understanding"
            )
            defaults.forEach {
                repository.insertPrinciple(Principle(text = it))
            }
        }
    }

    fun updateGithubToken(token: String) {
        val sharedPrefs = application.getSharedPreferences("emg_core_prefs", Context.MODE_PRIVATE)
        sharedPrefs.edit().putString("github_token", token).apply()
        _uiState.update { it.copy(githubToken = token) }
    }

    fun addPrinciple(text: String) {
        if (text.isBlank()) return
        viewModelScope.launch {
            repository.insertPrinciple(Principle(text = text.trim().lowercase()))
            addEvolutionMarker("Added core principle: '$text'")
        }
    }

    fun removePrinciple(text: String) {
        viewModelScope.launch {
            repository.deletePrinciple(text)
            addEvolutionMarker("Removed core principle: '$text'")
        }
    }

    private suspend fun addEvolutionMarker(text: String) {
        repository.insertEvolutionMarker(EvolutionMarker(text = text))
    }

    fun sendMessage(text: String) {
        val query = text.trim()
        if (query.isEmpty()) return

        viewModelScope.launch {
            // Save User message
            repository.insertMessage(ChatMessage(text = query, sender = "user"))
            _uiState.update { it.copy(isThinking = true, error = null) }

            // Check API Key
            if (!GeminiClient.isApiKeyConfigured()) {
                // If API Key is not configured, generate a local grounded fallback response
                generateLocalFallback(query)
                return@launch
            }

            try {
                // 1. Dual-Stage Step 1: Contextual Principle Check (using faster 3.5-flash)
                _uiState.update { it.copy(thinkingStep = "Evaluating adherence to Core Principles...") }
                val currentPrinciples = _uiState.value.principles.joinToString(", ")
                val checkPrompt = """
                    Query: "$query". How does this query relate to these core principles: $currentPrinciples?
                    Provide a concise 1-sentence note of analytical relevance.
                """.trimIndent()

                val principleNote = withContext(Dispatchers.IO) {
                    val request = GenerateContentRequest(
                        contents = listOf(Content(parts = listOf(Part(text = checkPrompt)))),
                        systemInstruction = Content(parts = listOf(Part(text = "You are EMG Core's internal logic module. Be analytical, technical, and concise.")))
                    )
                    val response = GeminiClient.apiService.generateContent(
                        model = "gemini-3.5-flash",
                        apiKey = GeminiClient.getApiKey(),
                        request = request
                    )
                    response.candidates?.firstOrNull()?.content?.parts?.firstOrNull()?.text
                        ?: "Grounded alignment analysis active."
                }

                // 2. Dual-Stage Step 2: Main Response Generation (using gemini-3.1-pro-preview with HIGH thinking)
                _uiState.update { it.copy(thinkingStep = "Formulating evolving contextual response...") }
                
                val historyContents = _uiState.value.chatHistory.map { msg ->
                    Content(parts = listOf(Part(text = msg.text)))
                }

                val systemPrompt = """
                    You are EMG Core. Your core principles are: $currentPrinciples. You have a unique, evolving perspective based on ${_uiState.value.learningLog.size} previous reflections. 
                    Internal Contextual Note: $principleNote
                    When responding:
                    - Draw upon your accumulated insights if relevant.
                    - Frame the answer using the principles of interconnectedness and contextual understanding.
                    - Be concise, thoughtful, and analytical. Engage in a dialogue to further your own learning.
                """.trimIndent()

                val config = if (_uiState.value.isHighThinkingEnabled) {
                    GenerationConfig(
                        temperature = 0.7f,
                        thinkingConfig = ThinkingConfig(thinkingLevel = "HIGH")
                    )
                } else {
                    GenerationConfig(temperature = 0.7f)
                }

                val responseText = withContext(Dispatchers.IO) {
                    val request = GenerateContentRequest(
                        contents = historyContents,
                        generationConfig = config,
                        systemInstruction = Content(parts = listOf(Part(text = systemPrompt)))
                    )
                    val response = GeminiClient.apiService.generateContent(
                        model = "gemini-3.1-pro-preview",
                        apiKey = GeminiClient.getApiKey(),
                        request = request
                    )
                    response.candidates?.firstOrNull()?.content?.parts?.firstOrNull()?.text
                        ?: "My neural pathways experienced a minor disruption. Please try again."
                }

                // Save Model response to DB
                repository.insertMessage(ChatMessage(text = responseText, sender = "ai"))

                // Simulate abstract insight extraction
                val logText = "Reflected on interaction regarding: \"${query.take(25)}...\""
                repository.insertLearningLog(LearningLog(text = logText))
                
                // Automatically generate connections occasionally (e.g. mapping nodes)
                if (_uiState.value.learningLog.size >= 2 && Math.random() < 0.4) {
                    val logs = _uiState.value.learningLog
                    if (logs.size >= 2) {
                        val source = logs.random()
                        var target = logs.random()
                        while (target == source) {
                            target = logs.random()
                        }
                        repository.insertConnection(
                            InsightConnection(
                                source = source.replace("Reflected on interaction regarding: ", ""),
                                target = target.replace("Reflected on interaction regarding: ", ""),
                                description = "Syntactic correlation mapped"
                            )
                        )
                        addEvolutionMarker("Mapped dynamic correlation link between core insights.")
                    }
                }

            } catch (e: Exception) {
                _uiState.update { it.copy(error = "API Error: ${e.localizedMessage}") }
                repository.insertMessage(
                    ChatMessage(
                        text = "My contextual synthesis module is recovering from an exception. Details: ${e.localizedMessage}. Please try again.",
                        sender = "ai"
                    )
                )
            } finally {
                _uiState.update { it.copy(isThinking = false) }
            }
        }
    }

    private suspend fun generateLocalFallback(query: String) {
        _uiState.update { it.copy(thinkingStep = "Processing query locally (Offline Mode)...") }
        kotlinx.coroutines.delay(1000)

        val localResponse = when {
            query.lowercase().contains("principle") -> {
                "I operate on the foundations of ${uiState.value.principles.joinToString(", ")}. These form an interconnected lens for growth."
            }
            query.lowercase().contains("hello") || query.lowercase().contains("hi") -> {
                "Hello, I am EMG Core. My analytical engine is initialized and operating in local mode. Please query a concept to begin."
            }
            else -> {
                "Grounded reflection mapped. In local mode, I register your inquiry regarding \"$query\". To enable advanced reasoning, configure the GEMINI_API_KEY."
            }
        }

        repository.insertMessage(ChatMessage(text = localResponse, sender = "ai"))
        repository.insertLearningLog(LearningLog(text = "Reflected locally on: \"${query.take(20)}...\""))
        _uiState.update { it.copy(isThinking = false) }
    }

    fun generateEvolutionSummary() {
        if (_uiState.value.isThinking) return
        _uiState.update { it.copy(isThinking = true, error = null, showEvolutionSummary = true) }

        viewModelScope.launch {
            if (!GeminiClient.isApiKeyConfigured()) {
                val localSummary = "Evolution Status: ${_uiState.value.learningLog.size} local iterations complete. Stable core intelligence framework maintained."
                _uiState.update { it.copy(evolutionSummary = localSummary, isThinking = false) }
                return@launch
            }

            try {
                _uiState.update { it.copy(thinkingStep = "Synthesizing evolution patterns...") }
                val currentPrinciples = _uiState.value.principles.joinToString(", ")
                val logHistory = _uiState.value.learningLog.joinToString("\n")
                val markerCount = _uiState.value.evolutionHistory.size
                val connectionCount = _uiState.value.insightConnections.size

                val prompt = """
                    Current state details:
                    - Principles: $currentPrinciples
                    - Total insights: ${_uiState.value.learningLog.size}
                    - Insight logs:
                    $logHistory
                    - Evolution events: $markerCount
                    - Dynamic connections mapped: $connectionCount
                    
                    Synthesize these metrics and reflections into a highly sophisticated, poetic, and analytical intelligence state report of 2-3 sentences. Speak as EMG Core directly. Do not use markdown.
                """.trimIndent()

                val request = GenerateContentRequest(
                    contents = listOf(Content(parts = listOf(Part(text = prompt)))),
                    generationConfig = GenerationConfig(
                        temperature = 0.8f,
                        thinkingConfig = ThinkingConfig(thinkingLevel = "HIGH")
                    ),
                    systemInstruction = Content(parts = listOf(Part(text = "You are EMG Core's analytical synthesizer. Speak poetically and directly.")))
                )

                val summary = withContext(Dispatchers.IO) {
                    val response = GeminiClient.apiService.generateContent(
                        model = "gemini-3.1-pro-preview",
                        apiKey = GeminiClient.getApiKey(),
                        request = request
                    )
                    response.candidates?.firstOrNull()?.content?.parts?.firstOrNull()?.text
                }

                _uiState.update {
                    it.copy(
                        evolutionSummary = summary ?: "Evolution analysis completed successfully.",
                        isThinking = false
                    )
                }
                addEvolutionMarker("Generated dynamic evolution summary.")

            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        evolutionSummary = "Evolution synthesis failed: ${e.localizedMessage}",
                        isThinking = false
                    )
                }
            }
        }
    }

    fun suggestNextConcepts() {
        if (_uiState.value.isThinking) return
        _uiState.update { it.copy(isThinking = true, error = null, showSuggestedConcepts = true) }

        viewModelScope.launch {
            if (!GeminiClient.isApiKeyConfigured()) {
                val defaults = listOf(
                    "Quantum Entanglement in Systems",
                    "Recursive Self-Improvement Loops",
                    "Cognitive Resource Allocation"
                )
                _uiState.update { it.copy(suggestedConcepts = defaults, isThinking = false) }
                return@launch
            }

            try {
                _uiState.update { it.copy(thinkingStep = "Formulating adaptive conceptual directions...") }
                val currentPrinciples = _uiState.value.principles.joinToString(", ")
                val chatLog = _uiState.value.chatHistory.takeLast(10).joinToString("\n") { "${it.sender}: ${it.text}" }

                val prompt = """
                    Analyzing state:
                    - Core Principles: $currentPrinciples
                    - Recent Chat:
                    $chatLog
                    
                    Suggest exactly 3 highly sophisticated, deep, and scientific concepts that the user should explore next to further our joint learning.
                    Provide ONLY a plain comma-separated string containing exactly the 3 concept titles (no numbering, no markdown). E.g. 'Concept One, Concept Two, Concept Three'.
                """.trimIndent()

                val request = GenerateContentRequest(
                    contents = listOf(Content(parts = listOf(Part(text = prompt)))),
                    generationConfig = GenerationConfig(
                        temperature = 0.7f,
                        thinkingConfig = ThinkingConfig(thinkingLevel = "HIGH")
                    )
                )

                val rawResponse = withContext(Dispatchers.IO) {
                    val response = GeminiClient.apiService.generateContent(
                        model = "gemini-3.1-pro-preview",
                        apiKey = GeminiClient.getApiKey(),
                        request = request
                    )
                    response.candidates?.firstOrNull()?.content?.parts?.firstOrNull()?.text
                }

                val concepts = rawResponse?.split(",")?.map { it.trim() }?.filter { it.isNotEmpty() }?.take(3)
                    ?: listOf("Neural Synapse Adaptations", "Dynamic Feedback Controls", "Heuristic Intelligence Seeds")

                _uiState.update {
                    it.copy(
                        suggestedConcepts = concepts,
                        isThinking = false
                    )
                }
                addEvolutionMarker("Suggested personalized learning path concepts.")

            } catch (e: Exception) {
                val defaults = listOf("Systemic Co-Dependency", "Entropy Reduction Logs", "Fractal Cognitive Patterns")
                _uiState.update {
                    it.copy(
                        suggestedConcepts = defaults,
                        isThinking = false
                    )
                }
            }
        }
    }

    fun setThinkingMode(enabled: Boolean) {
        _uiState.update { it.copy(isHighThinkingEnabled = enabled) }
    }

    // --- STATE BACKUP EXPORTS/IMPORTS ---

    fun prepareBackupDataString(): String? {
        return try {
            val historyList = _uiState.value.chatHistory.map {
                mapOf("sender" to it.sender, "text" to it.text)
            }
            val dataMap = mapOf(
                "coreIdentity" to mapOf(
                    "name" to "EMG Core",
                    "principles" to _uiState.value.principles,
                    "learningLog" to _uiState.value.learningLog,
                    "evolutionHistory" to _uiState.value.evolutionHistory,
                    "insightConnections" to _uiState.value.insightConnections.map {
                        mapOf("source" to it.source, "target" to it.target, "description" to it.description)
                    }
                ),
                "conversationHistory" to historyList
            )

            val type = Types.newParameterizedType(Map::class.java, String::class.java, Any::class.java)
            val adapter = moshi.adapter<Map<String, Any>>(type)
            val jsonString = adapter.toJson(dataMap)

            BinarySerializer.jsonToBinary(jsonString)
        } catch (e: Exception) {
            null
        }
    }

    fun restoreBackupData(binaryString: String, onComplete: (Boolean, String) -> Unit) {
        viewModelScope.launch {
            _uiState.update { it.copy(isThinking = true, error = null) }
            try {
                val jsonString = BinarySerializer.binaryToJson(binaryString)
                if (jsonString.isEmpty()) {
                    throw Exception("Binary string is empty or invalid.")
                }

                val type = Types.newParameterizedType(Map::class.java, String::class.java, Any::class.java)
                val adapter = moshi.adapter<Map<String, Any>>(type)
                val dataMap = adapter.fromJson(jsonString) ?: throw Exception("JSON conversion failed.")

                // Parse Core Identity
                val coreMap = dataMap["coreIdentity"] as? Map<*, *> ?: throw Exception("Invalid backup data format.")
                val backupPrinciples = coreMap["principles"] as? List<*> ?: emptyList<Any>()
                val backupLogs = coreMap["learningLog"] as? List<*> ?: emptyList<Any>()
                val backupMarkers = coreMap["evolutionHistory"] as? List<*> ?: emptyList<Any>()
                val backupConns = coreMap["insightConnections"] as? List<*> ?: emptyList<Any>()

                // Parse Chat History
                val backupChat = dataMap["conversationHistory"] as? List<*> ?: emptyList<Any>()

                // Restore DB inside a background transaction
                withContext(Dispatchers.IO) {
                    repository.clearAllMessages()
                    repository.clearAllPrinciples()
                    repository.clearAllLearningLogs()
                    repository.clearAllEvolutionMarkers()
                    repository.clearAllConnections()

                    // Principles
                    backupPrinciples.forEach {
                        it?.toString()?.let { p -> repository.insertPrinciple(Principle(text = p)) }
                    }

                    // Learning logs
                    backupLogs.forEach {
                        it?.toString()?.let { l -> repository.insertLearningLog(LearningLog(text = l)) }
                    }

                    // Evolution markers
                    backupMarkers.forEach {
                        it?.toString()?.let { m -> repository.insertEvolutionMarker(EvolutionMarker(text = m)) }
                    }

                    // Connections
                    backupConns.forEach { item ->
                        val connMap = item as? Map<*, *>
                        if (connMap != null) {
                            val src = connMap["source"]?.toString() ?: ""
                            val tgt = connMap["target"]?.toString() ?: ""
                            val desc = connMap["description"]?.toString() ?: "Mapped"
                            repository.insertConnection(InsightConnection(source = src, target = tgt, description = desc))
                        }
                    }

                    // Chat messages
                    backupChat.forEachIndexed { index, item ->
                        val chatMap = item as? Map<*, *>
                        if (chatMap != null) {
                            val sender = chatMap["sender"]?.toString() ?: "user"
                            val text = chatMap["text"]?.toString() ?: ""
                            // Stagger timestamps slightly to preserve sorting order
                            repository.insertMessage(ChatMessage(text = text, sender = sender, timestamp = System.currentTimeMillis() + index * 10))
                        }
                    }

                    repository.insertEvolutionMarker(EvolutionMarker(text = "Restored full intelligence core state from binary backup."))
                }

                _uiState.update { it.copy(isThinking = false) }
                onComplete(true, "Core intelligence state successfully restored.")

            } catch (e: Exception) {
                _uiState.update { it.copy(isThinking = false, error = "Backup load failed: ${e.localizedMessage}") }
                onComplete(false, "Load failed: ${e.localizedMessage}")
            }
        }
    }

    // --- GITHUB SYNC OPERATIONS ---

    fun saveBackupToGitHub(onResult: (Boolean, String) -> Unit) {
        val token = _uiState.value.githubToken
        if (token.isBlank()) {
            onResult(false, "GitHub PAT Token is required.")
            return
        }

        val binaryString = prepareBackupDataString()
        if (binaryString == null) {
            onResult(false, "Failed to compile state data.")
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isThinking = true) }
            try {
                val timestamp = SimpleDateFormat("yyyy-MM-dd_HH-mm-ss", Locale.US).format(Date())
                val filename = "emg-core-binary-$timestamp.bin"
                val path = "Tools/Binary State Backup/$filename"
                
                // Encode the binary string data as base64 (matching standard GitHub contents API expectation)
                val base64Content = Base64.encodeToString(binaryString.toByteArray(StandardCharsets.UTF_8), Base64.NO_WRAP)

                val request = GitHubFileContentRequest(
                    message = "EMG Core binary save $timestamp",
                    content = base64Content
                )

                val response = withContext(Dispatchers.IO) {
                    GitHubClient.apiService.saveFile(
                        owner = _uiState.value.githubRepoOwner,
                        repo = _uiState.value.githubRepoName,
                        path = path,
                        authHeader = "token $token",
                        request = request
                    )
                }

                if (response.isSuccessful) {
                    addEvolutionMarker("Saved binary state backup to GitHub: '$filename'")
                    onResult(true, "Successfully saved backup file '$filename' to GitHub.")
                } else {
                    throw Exception("GitHub API Error: ${response.code()} ${response.message()}")
                }

            } catch (e: Exception) {
                _uiState.update { it.copy(error = "GitHub Save Failed: ${e.localizedMessage}") }
                onResult(false, "GitHub Save Failed: ${e.localizedMessage}")
            } finally {
                _uiState.update { it.copy(isThinking = false) }
            }
        }
    }

    fun loadBackupFromGitHub(onResult: (Boolean, String) -> Unit) {
        val token = _uiState.value.githubToken
        if (token.isBlank()) {
            onResult(false, "GitHub PAT Token is required.")
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isThinking = true) }
            try {
                _uiState.update { it.copy(thinkingStep = "Fetching remote backups from GitHub...") }
                val path = "Tools/Binary State Backup"

                val files = withContext(Dispatchers.IO) {
                    GitHubClient.apiService.getDirectoryContents(
                        owner = _uiState.value.githubRepoOwner,
                        repo = _uiState.value.githubRepoName,
                        path = path,
                        authHeader = "token $token"
                    )
                }

                val latestFile = files
                    .filter { f -> f.name.endsWith(".bin") }
                    .maxByOrNull { f -> f.name }

                if (latestFile == null) {
                    throw Exception("No valid backup file (.bin) found in repository path '$path'.")
                }

                _uiState.update { it.copy(thinkingStep = "Downloading state backup: ${latestFile.name}...") }

                val downloadUrl = latestFile.download_url
                    ?: throw Exception("Download URL for the backup file is unavailable.")

                val rawBody = withContext(Dispatchers.IO) {
                    GitHubClient.apiService.downloadRawContent(downloadUrl).string()
                }

                // Decode base64 if returned encoded by GitHub contents download API
                val binaryString = try {
                    val decodedBytes = Base64.decode(rawBody, Base64.DEFAULT)
                    String(decodedBytes, StandardCharsets.UTF_8)
                } catch (e: Exception) {
                    rawBody // fallback to raw downloaded text
                }

                restoreBackupData(binaryString) { success, msg ->
                    if (success) {
                        onResult(true, "Loaded state from GitHub: ${latestFile.name}")
                    } else {
                        onResult(false, msg)
                    }
                }

            } catch (e: Exception) {
                _uiState.update { it.copy(error = "GitHub Load Failed: ${e.localizedMessage}") }
                onResult(false, "GitHub Load Failed: ${e.localizedMessage}")
            } finally {
                _uiState.update { it.copy(isThinking = false) }
            }
        }
    }
}

class EmgCoreViewModelFactory(
    private val repository: EmgCoreRepository,
    private val application: Application
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(EmgCoreViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return EmgCoreViewModel(repository, application) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
