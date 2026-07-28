package com.example.ui.screens

import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.ChatMessage
import com.example.ui.components.CoreGemVisualizer
import com.example.ui.theme.*
import com.example.ui.viewmodel.EmgCoreViewModel
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EmgCoreScreen(
    viewModel: EmgCoreViewModel,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val keyboardController = LocalSoftwareKeyboardController.current

    // Chat states
    var textInput by remember { mutableStateOf("") }
    val chatListState = rememberLazyListState()

    // Panel collapse toggles
    var isDashboardExpanded by remember { mutableStateOf(true) }
    var showBackupSettings by remember { mutableStateOf(false) }
    var showPrinciplesSettings by remember { mutableStateOf(false) }

    // Backup SAF Launchers
    val localSaveLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.CreateDocument("application/octet-stream")
    ) { uri ->
        uri?.let {
            try {
                context.contentResolver.openOutputStream(uri)?.use { outputStream ->
                    val data = viewModel.prepareBackupDataString() ?: ""
                    outputStream.bufferedWriter().use { writer -> writer.write(data) }
                }
                Toast.makeText(context, "Binary state downloaded successfully.", Toast.LENGTH_LONG).show()
            } catch (e: Exception) {
                Toast.makeText(context, "Save failed: ${e.localizedMessage}", Toast.LENGTH_LONG).show()
            }
        }
    }

    val localLoadLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenDocument()
    ) { uri ->
        uri?.let {
            try {
                context.contentResolver.openInputStream(uri)?.use { inputStream ->
                    val data = inputStream.bufferedReader().use { reader -> reader.readText() }
                    viewModel.restoreBackupData(data) { success, msg ->
                        Toast.makeText(context, msg, Toast.LENGTH_LONG).show()
                    }
                }
            } catch (e: Exception) {
                Toast.makeText(context, "Load failed: ${e.localizedMessage}", Toast.LENGTH_LONG).show()
            }
        }
    }

    // Scroll chat list to bottom whenever new messages are added
    LaunchedEffect(uiState.chatHistory.size) {
        if (uiState.chatHistory.isNotEmpty()) {
            chatListState.animateScrollToItem(uiState.chatHistory.size - 1)
        }
    }

    Scaffold(
        modifier = modifier
            .fillMaxSize()
            .background(Slate900),
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Hub,
                            contentDescription = "EMG Core",
                            tint = Sky400,
                            modifier = Modifier.padding(end = 8.dp)
                        )
                        Column {
                            Text(
                                text = "EMG CORE IDENTITY",
                                style = MaterialTheme.typography.titleMedium.copy(
                                    fontWeight = FontWeight.Bold,
                                    letterSpacing = 1.5.sp,
                                    color = Color.White
                                )
                            )
                            Text(
                                text = "Grounded Intelligence through Self-Evolution",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    color = Slate400,
                                    letterSpacing = 0.5.sp
                                )
                            )
                        }
                    }
                },
                actions = {
                    IconButton(
                        onClick = { isDashboardExpanded = !isDashboardExpanded },
                        modifier = Modifier.testTag("toggle_dashboard")
                    ) {
                        Icon(
                            imageVector = if (isDashboardExpanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                            contentDescription = "Toggle Dashboard",
                            tint = Sky400
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Slate900,
                    titleContentColor = Color.White
                )
            )
        },
        containerColor = Slate900
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .imePadding()
        ) {
            // Expanded System Dashboard Info
            AnimatedVisibility(
                visible = isDashboardExpanded,
                enter = expandVertically() + fadeIn(),
                exit = shrinkVertically() + fadeOut()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                ) {
                    // 3D Core Gem Display
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 12.dp)
                    ) {
                        CoreGemVisualizer(
                            insightCount = uiState.learningLog.size,
                            principlesCount = uiState.principles.size
                        )
                        // API Key Status Overlay
                        Box(
                            modifier = Modifier
                                .align(Alignment.TopEnd)
                                .padding(12.dp)
                                .clip(RoundedCornerShape(6.dp))
                                .background(Slate900.copy(alpha = 0.8f))
                                .border(1.dp, Slate700, RoundedCornerShape(6.dp))
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(8.dp)
                                        .clip(CircleShape)
                                        .background(if (uiState.isApiKeyConfigured) Emerald400 else Rose500)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = if (uiState.isApiKeyConfigured) "ONLINE" else "LOCAL MODE",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (uiState.isApiKeyConfigured) Emerald400 else Rose500,
                                    letterSpacing = 1.sp
                                )
                            }
                        }
                    }

                    // Stats Dashboard Grid
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 12.dp),
                        colors = CardDefaults.cardColors(containerColor = Slate800),
                        border = CardBorder()
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(
                                text = ":: SYSTEM METRICS & IDENTITY ::",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Sky400,
                                modifier = Modifier.padding(bottom = 8.dp)
                            )

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = "User ID: ",
                                    fontSize = 12.sp,
                                    color = Slate400,
                                    fontWeight = FontWeight.Medium
                                )
                                Text(
                                    text = uiState.userId,
                                    fontSize = 12.sp,
                                    fontFamily = FontFamily.Monospace,
                                    color = Sky400,
                                    fontWeight = FontWeight.Bold
                                )
                            }

                            Spacer(modifier = Modifier.height(6.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = "Core Principles: ",
                                    fontSize = 12.sp,
                                    color = Slate400,
                                    fontWeight = FontWeight.Medium
                                )
                                Text(
                                    text = "${uiState.principles.size} mapped",
                                    fontSize = 12.sp,
                                    color = Sky400,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.clickable { showPrinciplesSettings = !showPrinciplesSettings }
                                )
                            }

                            Spacer(modifier = Modifier.height(8.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                // Column 1: Reflections
                                Column(
                                    modifier = Modifier.weight(1f),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Text(text = "Insights Gained", fontSize = 10.sp, color = Slate400)
                                    Text(
                                        text = "${uiState.learningLog.size}",
                                        fontSize = 18.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Emerald400
                                    )
                                }
                                // Column 2: Evolution History
                                Column(
                                    modifier = Modifier.weight(1f),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Text(text = "Evolution Markers", fontSize = 10.sp, color = Slate400)
                                    Text(
                                        text = "${uiState.evolutionHistory.size}",
                                        fontSize = 18.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Purple400
                                    )
                                }
                                // Column 3: Connections
                                Column(
                                    modifier = Modifier.weight(1f),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Text(text = "Connections Mapped", fontSize = 10.sp, color = Slate400)
                                    Text(
                                        text = "${uiState.insightConnections.size}",
                                        fontSize = 18.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Rose500
                                    )
                                }
                            }
                        }
                    }

                    // Navigation Action row (Evolution summary, Concept generation, Backup toggling)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 8.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = { viewModel.generateEvolutionSummary() },
                            modifier = Modifier
                                .weight(1f)
                                .testTag("btn_evolution_summary"),
                            colors = ButtonDefaults.buttonColors(containerColor = Slate700),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Icon(Icons.Default.Analytics, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Evolution Report", fontSize = 11.sp, maxLines = 1)
                        }

                        Button(
                            onClick = { viewModel.suggestNextConcepts() },
                            modifier = Modifier
                                .weight(1f)
                                .testTag("btn_suggest_concepts"),
                            colors = ButtonDefaults.buttonColors(containerColor = Slate700),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Icon(Icons.Default.AutoAwesome, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Suggest Path", fontSize = 11.sp, maxLines = 1)
                        }

                        IconButton(
                            onClick = { showBackupSettings = !showBackupSettings },
                            modifier = Modifier
                                .background(Slate800, RoundedCornerShape(8.dp))
                                .border(1.dp, Slate700, RoundedCornerShape(8.dp))
                                .testTag("btn_backup_settings")
                        ) {
                            Icon(Icons.Default.CloudSync, contentDescription = "Backups", tint = Sky400)
                        }
                    }
                }
            }

            // Collapsible Core Principles Settings
            AnimatedVisibility(
                visible = showPrinciplesSettings && isDashboardExpanded,
                enter = expandVertically() + fadeIn(),
                exit = shrinkVertically() + fadeOut()
            ) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 4.dp),
                    colors = CardDefaults.cardColors(containerColor = Slate800),
                    border = CardBorder()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "Core Principles Editor",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = Sky400,
                            modifier = Modifier.padding(bottom = 8.dp)
                        )

                        // Principles list row
                        FlowRow(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            uiState.principles.forEach { principle ->
                                InputChip(
                                    selected = true,
                                    onClick = { viewModel.removePrinciple(principle) },
                                    label = { Text(principle, fontSize = 11.sp) },
                                    trailingIcon = {
                                        Icon(
                                            imageVector = Icons.Default.Cancel,
                                            contentDescription = "Remove",
                                            modifier = Modifier.size(12.dp)
                                        )
                                    }
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        // Add new principle input
                        var newPrincipleInput by remember { mutableStateOf("") }
                        Row(modifier = Modifier.fillMaxWidth()) {
                            OutlinedTextField(
                                value = newPrincipleInput,
                                onValueChange = { newPrincipleInput = it },
                                label = { Text("New Principle", fontSize = 10.sp, color = Slate400) },
                                modifier = Modifier
                                    .weight(1f)
                                    .height(52.dp)
                                    .testTag("new_principle_input"),
                                colors = TextFieldDefaults.colors(
                                    focusedContainerColor = Slate900,
                                    unfocusedContainerColor = Slate900,
                                    focusedTextColor = Color.White,
                                    unfocusedTextColor = Color.White
                                ),
                                shape = RoundedCornerShape(8.dp),
                                textStyle = LocalTextStyle.current.copy(fontSize = 12.sp),
                                singleLine = true
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Button(
                                onClick = {
                                    if (newPrincipleInput.isNotBlank()) {
                                        viewModel.addPrinciple(newPrincipleInput)
                                        newPrincipleInput = ""
                                    }
                                },
                                modifier = Modifier
                                    .height(52.dp)
                                    .testTag("add_principle_button"),
                                colors = ButtonDefaults.buttonColors(containerColor = Sky500),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text("Add", fontSize = 12.sp)
                            }
                        }
                    }
                }
            }

            // Collapsible Backups Panel (Local & GitHub Sync)
            AnimatedVisibility(
                visible = showBackupSettings && isDashboardExpanded,
                enter = expandVertically() + fadeIn(),
                exit = shrinkVertically() + fadeOut()
            ) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 4.dp),
                    colors = CardDefaults.cardColors(containerColor = Slate800),
                    border = CardBorder()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "State Backup Integration Engine",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = Sky400,
                            modifier = Modifier.padding(bottom = 10.dp)
                        )

                        // Local Backups
                        Text(
                            text = "Local Binary Backup (.bin file)",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Medium,
                            color = Slate400,
                            modifier = Modifier.padding(bottom = 6.dp)
                        )
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Button(
                                onClick = {
                                    val timestamp = SimpleDateFormat("yyyy-MM-dd_HH-mm-ss", Locale.US).format(Date())
                                    localSaveLauncher.launch("emg-core-local-$timestamp.bin")
                                },
                                modifier = Modifier
                                    .weight(1f)
                                    .testTag("btn_local_save"),
                                colors = ButtonDefaults.buttonColors(containerColor = Slate700)
                            ) {
                                Icon(Icons.Default.SaveAlt, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Download State", fontSize = 11.sp)
                            }

                            Button(
                                onClick = { localLoadLauncher.launch(arrayOf("application/octet-stream", "*/*")) },
                                modifier = Modifier
                                    .weight(1f)
                                    .testTag("btn_local_load"),
                                colors = ButtonDefaults.buttonColors(containerColor = Slate700)
                            ) {
                                Icon(Icons.Default.FileUpload, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Upload State", fontSize = 11.sp)
                            }
                        }

                        Divider(color = Slate700, modifier = Modifier.padding(vertical = 12.dp))

                        // GitHub Backups
                        Text(
                            text = "GitHub Binary Sync Module",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Medium,
                            color = Slate400,
                            modifier = Modifier.padding(bottom = 6.dp)
                        )

                        var patInput by remember { mutableStateOf(uiState.githubToken) }
                        OutlinedTextField(
                            value = patInput,
                            onValueChange = {
                                patInput = it
                                viewModel.updateGithubToken(it)
                            },
                            label = { Text("GitHub Personal Access Token (PAT)", fontSize = 10.sp, color = Slate400) },
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("github_token_input"),
                            colors = TextFieldDefaults.colors(
                                focusedContainerColor = Slate900,
                                unfocusedContainerColor = Slate900,
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.White
                            ),
                            shape = RoundedCornerShape(8.dp),
                            textStyle = LocalTextStyle.current.copy(fontSize = 12.sp, fontFamily = FontFamily.Monospace),
                            singleLine = true
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Button(
                                onClick = {
                                    viewModel.saveBackupToGitHub { success, msg ->
                                        Toast.makeText(context, msg, Toast.LENGTH_LONG).show()
                                    }
                                },
                                modifier = Modifier
                                    .weight(1f)
                                    .testTag("btn_github_save"),
                                colors = ButtonDefaults.buttonColors(containerColor = Sky500)
                            ) {
                                Text("Sync Save", fontSize = 11.sp)
                            }

                            Button(
                                onClick = {
                                    viewModel.loadBackupFromGitHub { success, msg ->
                                        Toast.makeText(context, msg, Toast.LENGTH_LONG).show()
                                    }
                                },
                                modifier = Modifier
                                    .weight(1f)
                                    .testTag("btn_github_load"),
                                colors = ButtonDefaults.buttonColors(containerColor = Purple500)
                            ) {
                                Text("Sync Load", fontSize = 11.sp)
                            }
                        }
                    }
                }
            }

            // Floating Dynamic Content Panels: Evolution Summary & Suggested Concepts
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
            ) {
                // Evolution Summary Display
                AnimatedVisibility(
                    visible = uiState.showEvolutionSummary && uiState.evolutionSummary != null,
                    enter = slideInVertically() + fadeIn(),
                    exit = slideOutVertically() + fadeOut()
                ) {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp),
                        colors = CardDefaults.cardColors(containerColor = Slate800.copy(alpha = 0.95f)),
                        border = CardBorder()
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Evolving Synthesis Report:",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Sky400
                                )
                                Icon(
                                    imageVector = Icons.Default.Close,
                                    contentDescription = "Close",
                                    modifier = Modifier
                                        .size(16.dp)
                                        .clickable { viewModel.generateEvolutionSummary() /* toggles if custom implementation allows or just ignore */ },
                                    tint = Slate400
                                )
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = uiState.evolutionSummary ?: "",
                                fontSize = 12.sp,
                                color = Color.White,
                                style = MaterialTheme.typography.bodyMedium.copy(
                                    lineHeight = 16.sp,
                                    fontStyle = androidx.compose.ui.text.font.FontStyle.Italic
                                )
                            )
                        }
                    }
                }

                // Suggested Learning Path Concepts
                AnimatedVisibility(
                    visible = uiState.showSuggestedConcepts && uiState.suggestedConcepts.isNotEmpty(),
                    enter = slideInVertically() + fadeIn(),
                    exit = slideOutVertically() + fadeOut()
                ) {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp),
                        colors = CardDefaults.cardColors(containerColor = Slate800.copy(alpha = 0.95f)),
                        border = CardBorder()
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text(
                                text = "Suggested Learning Path Concepts (Click to explore):",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Emerald400,
                                modifier = Modifier.padding(bottom = 8.dp)
                            )

                            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                uiState.suggestedConcepts.forEach { concept ->
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clip(RoundedCornerShape(6.dp))
                                            .background(Slate900)
                                            .border(1.dp, Slate700, RoundedCornerShape(6.dp))
                                            .clickable {
                                                textInput = "Synthesize and explain: $concept"
                                                viewModel.sendMessage("Synthesize and explain: $concept")
                                                textInput = ""
                                            }
                                            .padding(horizontal = 10.dp, vertical = 8.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.ArrowForward,
                                            contentDescription = null,
                                            tint = Emerald400,
                                            modifier = Modifier.size(14.dp)
                                        )
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text(
                                            text = concept,
                                            fontSize = 12.sp,
                                            color = Slate200,
                                            fontWeight = FontWeight.SemiBold
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Real-Time Processing Loading / Thinking Indicator
            AnimatedVisibility(
                visible = uiState.isThinking,
                enter = expandVertically() + fadeIn(),
                exit = shrinkVertically() + fadeOut()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 6.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(Sky400.copy(alpha = 0.1f))
                        .border(1.dp, Sky400.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                        strokeWidth = 2.dp,
                        color = Sky400
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        text = uiState.thinkingStep.ifEmpty { "Evolving intelligence processing..." },
                        fontSize = 12.sp,
                        color = Sky400,
                        fontWeight = FontWeight.Medium
                    )
                }
            }

            // Chat History Area
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 4.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(Slate800)
                    .border(1.dp, Slate700, RoundedCornerShape(16.dp))
            ) {
                if (uiState.chatHistory.isEmpty()) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Psychology,
                            contentDescription = null,
                            tint = Sky400,
                            modifier = Modifier.size(48.dp)
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = "EMG Core (Initialization)",
                            fontWeight = FontWeight.Bold,
                            color = Color.White,
                            fontSize = 16.sp
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "I am establishing my core identity. My principles are interconnectedness, growth through reflection, and contextual understanding.\n\nAsk me a question to begin my learning process.",
                            color = Slate400,
                            fontSize = 13.sp,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.padding(horizontal = 16.dp)
                        )
                    }
                } else {
                    LazyColumn(
                        state = chatListState,
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        items(uiState.chatHistory) { msg ->
                            ChatBubble(msg = msg)
                        }
                    }
                }
            }

            // Input Controls Panel
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                colors = CardDefaults.cardColors(containerColor = Slate800),
                border = CardBorder()
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    // Thinking Mode & Quick Stats line
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Switch(
                                checked = uiState.isHighThinkingEnabled,
                                onCheckedChange = { viewModel.setThinkingMode(it) },
                                modifier = Modifier
                                    .scale(0.8f)
                                    .testTag("thinking_mode_switch")
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "High Thinking Mode",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (uiState.isHighThinkingEnabled) Sky400 else Slate400
                            )
                        }

                        // Local warning overlay if API key not present
                        if (!uiState.isApiKeyConfigured) {
                            Text(
                                text = "Key Missing: Running Offline",
                                fontSize = 10.sp,
                                color = Rose500,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    // Text Input area
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        OutlinedTextField(
                            value = textInput,
                            onValueChange = { textInput = it },
                            placeholder = { Text("Type your question or concept...", fontSize = 13.sp, color = Slate400) },
                            modifier = Modifier
                                .weight(1f)
                                .testTag("chat_input"),
                            colors = TextFieldDefaults.colors(
                                focusedContainerColor = Slate900,
                                unfocusedContainerColor = Slate900,
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.White
                            ),
                            shape = RoundedCornerShape(12.dp),
                            maxLines = 4,
                            singleLine = false,
                            textStyle = LocalTextStyle.current.copy(fontSize = 14.sp)
                        )

                        Spacer(modifier = Modifier.width(10.dp))

                        FloatingActionButton(
                            onClick = {
                                if (textInput.isNotBlank()) {
                                    val query = textInput
                                    textInput = ""
                                    viewModel.sendMessage(query)
                                    keyboardController?.hide()
                                }
                            },
                            modifier = Modifier
                                .size(48.dp)
                                .testTag("send_button"),
                            containerColor = Sky400,
                            contentColor = Color.Black,
                            shape = CircleShape
                        ) {
                            Icon(
                                imageVector = Icons.Default.Send,
                                contentDescription = "Send Message",
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ChatBubble(msg: ChatMessage) {
    val isUser = msg.sender == "user"
    val align = if (isUser) Alignment.End else Alignment.Start
    val bubbleColor = if (isUser) Sky500 else Slate700
    val textColor = if (isUser) Color.Black else Color.White
    val roundShape = if (isUser) {
        RoundedCornerShape(16.dp, 16.dp, 0.dp, 16.dp)
    } else {
        RoundedCornerShape(16.dp, 16.dp, 16.dp, 0.dp)
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 2.dp),
        horizontalAlignment = align
    ) {
        Box(
            modifier = Modifier
                .widthIn(max = 280.dp)
                .clip(roundShape)
                .background(bubbleColor)
                .padding(horizontal = 14.dp, vertical = 10.dp)
        ) {
            Text(
                text = msg.text,
                fontSize = 13.sp,
                color = textColor,
                lineHeight = 18.sp,
                style = MaterialTheme.typography.bodyMedium
            )
        }
    }
}

@Composable
fun CardBorder() = androidx.compose.foundation.BorderStroke(
    width = 1.dp,
    color = Slate700
)

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun FlowRow(
    modifier: Modifier = Modifier,
    horizontalArrangement: Arrangement.Horizontal = Arrangement.Start,
    verticalArrangement: Arrangement.Vertical = Arrangement.Top,
    content: @Composable () -> Unit
) {
    androidx.compose.foundation.layout.FlowRow(
        modifier = modifier,
        horizontalArrangement = horizontalArrangement,
        verticalArrangement = verticalArrangement,
        content = { content() }
    )
}
