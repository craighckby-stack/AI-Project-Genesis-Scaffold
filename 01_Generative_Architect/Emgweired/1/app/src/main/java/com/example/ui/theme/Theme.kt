package com.example.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext

private val DarkColorScheme =
  darkColorScheme(
    primary = Sky400,
    secondary = Purple500,
    tertiary = Emerald500,
    background = Slate900,
    surface = Slate800,
    onPrimary = Color.Black,
    onSecondary = Color.White,
    onTertiary = Color.White,
    onBackground = Slate200,
    onSurface = Color.White
  )

private val LightColorScheme = DarkColorScheme // Always use dark theme for the futuristic terminal aesthetic

@Composable
fun MyApplicationTheme(
  darkTheme: Boolean = true, // Force dark theme for the core console theme
  dynamicColor: Boolean = false, // Disable dynamic colors to preserve custom neon theme branding
  content: @Composable () -> Unit,
) {
  val colorScheme = DarkColorScheme

  MaterialTheme(colorScheme = colorScheme, typography = Typography, content = content)
}
