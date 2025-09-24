package com.sdb.mdm

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.sdb.mdm.SDBApplication
import com.sdb.mdm.ui.pairing.PairingScreen
import com.sdb.mdm.ui.dashboard.DashboardScreenProfessional
import com.sdb.mdm.ui.theme.SDBTheme
import dagger.hilt.android.AndroidEntryPoint

/**
 * Main Activity - FRIAXIS v4.0.0
 * Professional entry point for the FRIAXIS MDM Android application
 */
@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        
        setContent {
            SDBTheme {
                SDBApp()
            }
        }
    }
}

@Composable
fun SDBApp() {
    val navController = rememberNavController()
    
    // Verificar se já está emparelhado
    val deviceId = SDBApplication.instance.getStoredDeviceId()
    val startDestination = if (deviceId?.isNotEmpty() == true) "dashboard" else "pairing"
    
    Scaffold(
        modifier = Modifier.fillMaxSize()
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = startDestination,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable("pairing") {
                PairingScreen(
                    onPairingSuccess = {
                        navController.navigate("dashboard") {
                            popUpTo("pairing") { inclusive = true }
                        }
                    }
                )
            }
            
            composable("dashboard") {
                com.sdb.mdm.ui.dashboard.DashboardScreenProfessional()
            }
        }
    }
}