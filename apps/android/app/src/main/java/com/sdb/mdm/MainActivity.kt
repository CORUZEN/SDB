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
import androidx.compose.ui.platform.LocalContext
import com.sdb.mdm.SDBApplication
import com.sdb.mdm.ui.pairing.PairingScreen
import com.sdb.mdm.ui.dashboard.DashboardScreenProfessional
import com.sdb.mdm.ui.permissions.PermissionRequestScreen
import com.sdb.mdm.ui.theme.SDBTheme
import com.sdb.mdm.utils.PermissionChecker
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
    val context = LocalContext.current
    
    // Verificar se o device está realmente pareado
    val isPaired = SDBApplication.instance.isDevicePaired()
    
    // Verificar se todas as permissões necessárias foram concedidas
    val arePermissionsGranted = PermissionChecker.areAllPermissionsGranted(context)
    
    // Decisão para destino inicial baseado no status completo
    val startDestination = when {
        isPaired -> {
            android.util.Log.d("MainActivity", "Device está pareado - Starting with DASHBOARD")
            "dashboard"
        }
        arePermissionsGranted -> {
            android.util.Log.d("MainActivity", "Permissions granted but not paired - Starting with PAIRING")
            "pairing"
        }
        else -> {
            android.util.Log.d("MainActivity", "Permissions not granted - Starting with PERMISSIONS")
            "permissions"
        }
    }
    
    Scaffold(
        modifier = Modifier.fillMaxSize()
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = startDestination,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable("permissions") {
                PermissionRequestScreen(
                    onAllPermissionsGranted = {
                        android.util.Log.d("MainActivity", "All permissions granted, navigating to pairing")
                        navController.navigate("pairing") {
                            popUpTo("permissions") { inclusive = true }
                        }
                    }
                )
            }
            
            composable("pairing") {
                PairingScreen(
                    onPairingSuccess = {
                        android.util.Log.d("MainActivity", "Pairing successful, navigating to dashboard")
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