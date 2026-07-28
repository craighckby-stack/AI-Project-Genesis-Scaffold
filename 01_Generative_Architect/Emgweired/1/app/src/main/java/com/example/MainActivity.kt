package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Scaffold
import androidx.compose.ui.Modifier
import androidx.lifecycle.ViewModelProvider
import androidx.room.Room
import com.example.data.AppDatabase
import com.example.data.EmgCoreRepository
import com.example.ui.screens.EmgCoreScreen
import com.example.ui.theme.MyApplicationTheme
import com.example.ui.viewmodel.EmgCoreViewModel
import com.example.ui.viewmodel.EmgCoreViewModelFactory

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    // Initialize Room Local Persistence Database
    val database = Room.databaseBuilder(
        applicationContext,
        AppDatabase::class.java, "emg_core_identity_db"
    )
    .fallbackToDestructiveMigration()
    .build()

    val repository = EmgCoreRepository(database.emgCoreDao())

    // Initialize ViewModel
    val viewModel = ViewModelProvider(
        this,
        EmgCoreViewModelFactory(repository, application)
    )[EmgCoreViewModel::class.java]

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
}
