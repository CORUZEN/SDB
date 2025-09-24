package com.sdb.mdm.ui.permissions

import android.Manifest
import android.app.Activity
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.util.Log
import androidx.activity.compose.ManagedActivityResultLauncher
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.ActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.sdb.mdm.receiver.DeviceAdminReceiver
import com.sdb.mdm.utils.PermissionChecker

/**
 * Permission Request Screen - FRIAXIS v4.0.7
 * Handles all critical permission requests for MDM functionality
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PermissionRequestScreen(
    onAllPermissionsGranted: () -> Unit
) {
    val context = LocalContext.current
    var currentStep by remember { mutableStateOf(0) }
    var forceRefresh by remember { mutableStateOf(0) } // Para forçar recomposição
    
    // Verificação inicial ao carregar a tela
    LaunchedEffect(Unit) {
        Log.d("PermissionScreen", "Initial permission check on screen load")
        if (PermissionChecker.areAllPermissionsGranted(context)) {
            Log.d("PermissionScreen", "All permissions already granted on initial load")
            onAllPermissionsGranted()
            return@LaunchedEffect
        }
    }
    
    // Permission launchers com logs de debug
    val locationPermissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        Log.d("PermissionScreen", "Location permissions result: $permissions")
        val allGranted = permissions.values.all { it }
        if (allGranted) {
            Log.d("PermissionScreen", "Location permissions granted, advancing step")
            currentStep++
        } else {
            Log.w("PermissionScreen", "Some location permissions denied")
        }
    }
    
    val deviceAdminLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        Log.d("PermissionScreen", "Device admin result: ${result.resultCode}")
        if (isDeviceAdminEnabled(context)) {
            Log.d("PermissionScreen", "Device admin enabled, advancing step")
            currentStep++
        } else {
            Log.w("PermissionScreen", "Device admin not enabled")
        }
    }
    
    val overlayPermissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        Log.d("PermissionScreen", "Overlay permission result: ${result.resultCode}")
        if (Settings.canDrawOverlays(context)) {
            Log.d("PermissionScreen", "Overlay permission granted, advancing step")
            currentStep++
        } else {
            Log.w("PermissionScreen", "Overlay permission not granted")
        }
    }
    
    val batteryOptimizationLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        Log.d("PermissionScreen", "Battery optimization result: ${result.resultCode}")
        // Always advance for battery optimization (it's optional)
        currentStep++
    }
    
    // Permission steps
    val permissionSteps = listOf(
        PermissionStep(
            title = "Localização",
            description = "Necessário para rastreamento e gerenciamento de dispositivos",
            icon = Icons.Default.LocationOn,
            isGranted = { isLocationPermissionGranted(context) },
            requestAction = {
                Log.d("PermissionScreen", "Requesting location permissions")
                try {
                    val permissions = arrayOf(
                        Manifest.permission.ACCESS_FINE_LOCATION,
                        Manifest.permission.ACCESS_COARSE_LOCATION
                    )
                    locationPermissionLauncher.launch(permissions)
                } catch (e: Exception) {
                    Log.e("PermissionScreen", "Error requesting location permissions", e)
                }
            }
        ),
        PermissionStep(
            title = "Administrador do Dispositivo",
            description = "Permite controle administrativo completo do dispositivo",
            icon = Icons.Default.Lock,
            isGranted = { isDeviceAdminEnabled(context) },
            requestAction = {
                Log.d("PermissionScreen", "Requesting device admin permissions")
                try {
                    val intent = Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN).apply {
                        putExtra(
                            DevicePolicyManager.EXTRA_DEVICE_ADMIN,
                            ComponentName(context, DeviceAdminReceiver::class.java)
                        )
                        putExtra(
                            DevicePolicyManager.EXTRA_ADD_EXPLANATION,
                            "O FRIAXIS precisa de permissões administrativas para gerenciar este dispositivo"
                        )
                    }
                    deviceAdminLauncher.launch(intent)
                } catch (e: Exception) {
                    Log.e("PermissionScreen", "Error requesting device admin", e)
                }
            }
        ),
        PermissionStep(
            title = "Sobrepor Outras Apps",
            description = "Permite exibir notificações e alertas críticos",
            icon = Icons.Default.Phone,
            isGranted = { Settings.canDrawOverlays(context) },
            requestAction = {
                Log.d("PermissionScreen", "Requesting overlay permission")
                try {
                    val intent = Intent(
                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:${context.packageName}")
                    )
                    overlayPermissionLauncher.launch(intent)
                } catch (e: Exception) {
                    Log.e("PermissionScreen", "Error requesting overlay permission", e)
                }
            }
        ),
        PermissionStep(
            title = "Ignorar Otimização de Bateria",
            description = "Garante que o serviço funcione continuamente",
            icon = Icons.Default.Settings,
            isGranted = { isBatteryOptimizationDisabled(context) },
            requestAction = {
                Log.d("PermissionScreen", "Requesting battery optimization exemption")
                try {
                    val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                        data = Uri.parse("package:${context.packageName}")
                    }
                    batteryOptimizationLauncher.launch(intent)
                } catch (e: Exception) {
                    Log.e("PermissionScreen", "Error requesting battery optimization", e)
                }
            }
        )
    )
    
    // Check if all permissions are granted
    LaunchedEffect(currentStep, forceRefresh) {
        Log.d("PermissionScreen", "Checking permissions - currentStep: $currentStep, totalSteps: ${permissionSteps.size}")
        
        // Check if all mandatory permissions are granted
        val allPermissionsGranted = PermissionChecker.areAllPermissionsGranted(context)
        
        if (allPermissionsGranted) {
            Log.d("PermissionScreen", "All permissions granted, calling onAllPermissionsGranted")
            onAllPermissionsGranted()
        } else if (currentStep >= permissionSteps.size) {
            Log.d("PermissionScreen", "Reached end of steps but permissions not granted")
            // Reset to first step if we somehow got to the end without all permissions
            currentStep = 0
        }
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "Permissões Necessárias",
                        fontWeight = FontWeight.Bold
                    )
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                )
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        Icons.Default.Lock,
                        contentDescription = null,
                        modifier = Modifier.size(48.dp),
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        "FRIAXIS MDM requer algumas permissões para funcionar corretamente.",
                        style = MaterialTheme.typography.bodyLarge,
                        textAlign = TextAlign.Center
                    )
                }
            }
            
            // Progress
            LinearProgressIndicator(
                progress = currentStep.toFloat() / permissionSteps.size,
                modifier = Modifier.fillMaxWidth()
            )
            
            Text(
                "Passo ${minOf(currentStep + 1, permissionSteps.size)} de ${permissionSteps.size}",
                style = MaterialTheme.typography.bodyMedium,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )
            
            // Permission steps
            permissionSteps.forEachIndexed { index, step ->
                // Use forceRefresh to trigger recomposition
                val isCompleted = remember(forceRefresh) { step.isGranted() }
                PermissionStepCard(
                    step = step,
                    isActive = index == currentStep,
                    isCompleted = index < currentStep || isCompleted
                )
            }
            
            // Skip button (for development)
            if (currentStep < permissionSteps.size) {
                OutlinedButton(
                    onClick = { onAllPermissionsGranted() },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Pular (Desenvolvimento)")
                }
                
                // Refresh button for debugging
                OutlinedButton(
                    onClick = { 
                        Log.d("PermissionScreen", "Manual refresh triggered")
                        forceRefresh++ 
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Verificar Permissões Novamente")
                }
            }
        }
    }
}

@Composable
private fun PermissionStepCard(
    step: PermissionStep,
    isActive: Boolean,
    isCompleted: Boolean
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = when {
                isCompleted -> MaterialTheme.colorScheme.secondaryContainer
                isActive -> MaterialTheme.colorScheme.primaryContainer
                else -> MaterialTheme.colorScheme.surface
            }
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = if (isCompleted) Icons.Default.CheckCircle else step.icon,
                contentDescription = null,
                tint = when {
                    isCompleted -> MaterialTheme.colorScheme.secondary
                    isActive -> MaterialTheme.colorScheme.primary
                    else -> MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                },
                modifier = Modifier.size(40.dp)
            )
            
            Spacer(modifier = Modifier.width(16.dp))
            
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = step.title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Medium
                )
                Text(
                    text = step.description,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                )
            }
            
            if (isActive && !isCompleted) {
                Button(
                    onClick = {
                        Log.d("PermissionScreen", "Button clicked for: ${step.title}")
                        try {
                            step.requestAction()
                        } catch (e: Exception) {
                            Log.e("PermissionScreen", "Error executing permission request", e)
                        }
                    }
                ) {
                    Text("Permitir")
                }
            }
        }
    }
}

private data class PermissionStep(
    val title: String,
    val description: String,
    val icon: ImageVector,
    val isGranted: () -> Boolean,
    val requestAction: () -> Unit
)

private fun isLocationPermissionGranted(context: Context): Boolean {
    val fineLocation = ContextCompat.checkSelfPermission(
        context, Manifest.permission.ACCESS_FINE_LOCATION
    ) == PackageManager.PERMISSION_GRANTED
    
    val coarseLocation = ContextCompat.checkSelfPermission(
        context, Manifest.permission.ACCESS_COARSE_LOCATION
    ) == PackageManager.PERMISSION_GRANTED
    
    return fineLocation && coarseLocation
}

private fun isDeviceAdminEnabled(context: Context): Boolean {
    val devicePolicyManager = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
    val componentName = ComponentName(context, com.sdb.mdm.receiver.DeviceAdminReceiver::class.java)
    return devicePolicyManager.isAdminActive(componentName)
}

private fun isBatteryOptimizationDisabled(context: Context): Boolean {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        val powerManager = context.getSystemService(Context.POWER_SERVICE) as android.os.PowerManager
        powerManager.isIgnoringBatteryOptimizations(context.packageName)
    } else {
        true // Not applicable for older versions
    }
}