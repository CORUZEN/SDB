package com.sdb.mdm.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

/**
 * SDB Theme - FRIAXIS v4.0.0
 * Modern Material Design 3 theme for professional MDM application
 */

// SDB Brand Colors
private val SDBPrimary = Color(0xFF1976D2)      // Professional blue
private val SDBPrimaryVariant = Color(0xFF1565C0)
private val SDBSecondary = Color(0xFF03DAC6)    // Accent teal
private val SDBSecondaryVariant = Color(0xFF018786)

// Surface Colors
private val SDBSurface = Color(0xFFFFFBFE)
private val SDBSurfaceVariant = Color(0xFFF4F4F4)
private val SDBBackground = Color(0xFFFFFBFE)

// Error Colors
private val SDBError = Color(0xFFB00020)
private val SDBErrorContainer = Color(0xFFFFC1CC)

// Dark Theme Colors
private val SDBDarkPrimary = Color(0xFF90CAF9)
private val SDBDarkSecondary = Color(0xFF4DB6AC)
private val SDBDarkSurface = Color(0xFF121212)
private val SDBDarkBackground = Color(0xFF121212)

private val LightColorScheme = lightColorScheme(
    primary = SDBPrimary,
    onPrimary = Color.White,
    primaryContainer = Color(0xFFE3F2FD),
    onPrimaryContainer = Color(0xFF0D47A1),
    
    secondary = SDBSecondary,
    onSecondary = Color.Black,
    secondaryContainer = Color(0xFFE0F2F1),
    onSecondaryContainer = Color(0xFF004D40),
    
    tertiary = Color(0xFFFFA726),
    onTertiary = Color.Black,
    tertiaryContainer = Color(0xFFFFF3E0),
    onTertiaryContainer = Color(0xFFE65100),
    
    error = SDBError,
    onError = Color.White,
    errorContainer = SDBErrorContainer,
    onErrorContainer = Color(0xFF330009),
    
    background = SDBBackground,
    onBackground = Color(0xFF1C1B1F),
    
    surface = SDBSurface,
    onSurface = Color(0xFF1C1B1F),
    surfaceVariant = SDBSurfaceVariant,
    onSurfaceVariant = Color(0xFF49454F),
    
    outline = Color(0xFF79747E),
    outlineVariant = Color(0xFFCAC4D0),
    
    scrim = Color(0xFF000000),
    inverseSurface = Color(0xFF313033),
    inverseOnSurface = Color(0xFFF4EFF4),
    inversePrimary = SDBDarkPrimary
)

private val DarkColorScheme = darkColorScheme(
    primary = SDBDarkPrimary,
    onPrimary = Color(0xFF003258),
    primaryContainer = Color(0xFF004A77),
    onPrimaryContainer = Color(0xFFCCE7FF),
    
    secondary = SDBDarkSecondary,
    onSecondary = Color(0xFF003733),
    secondaryContainer = Color(0xFF00504A),
    onSecondaryContainer = Color(0xFFB2DFDB),
    
    tertiary = Color(0xFFFFB74D),
    onTertiary = Color(0xFF4A2800),
    tertiaryContainer = Color(0xFF6A3A00),
    onTertiaryContainer = Color(0xFFFFDCC2),
    
    error = Color(0xFFFFB4AB),
    onError = Color(0xFF690005),
    errorContainer = Color(0xFF93000A),
    onErrorContainer = Color(0xFFFFDAD6),
    
    background = SDBDarkBackground,
    onBackground = Color(0xFFE6E1E5),
    
    surface = SDBDarkSurface,
    onSurface = Color(0xFFE6E1E5),
    surfaceVariant = Color(0xFF49454F),
    onSurfaceVariant = Color(0xFFCAC4D0),
    
    outline = Color(0xFF938F99),
    outlineVariant = Color(0xFF49454F),
    
    scrim = Color(0xFF000000),
    inverseSurface = Color(0xFFE6E1E5),
    inverseOnSurface = Color(0xFF313033),
    inversePrimary = SDBPrimary
)

@Composable
fun SDBTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) {
        DarkColorScheme
    } else {
        LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = SDBTypography,
        shapes = SDBShapes,
        content = content
    )
}