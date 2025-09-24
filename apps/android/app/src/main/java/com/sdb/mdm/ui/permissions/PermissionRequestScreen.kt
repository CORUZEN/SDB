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
    
    // Permission launchers
    val locationPermissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val allGranted = permissions.values.all { it }
        if (allGranted) currentStep++
    }
    
    val deviceAdminLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (isDeviceAdminEnabled(context)) {
            currentStep++
        }
    }
    
    val overlayPermissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (Settings.canDrawOverlays(context)) {
            currentStep++
        }
    }
    
    val batteryOptimizationLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
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
                locationPermissionLauncher.launch(
                    arrayOf(
                        Manifest.permission.ACCESS_FINE_LOCATION,
                        Manifest.permission.ACCESS_COARSE_LOCATION,
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                            Manifest.permission.ACCESS_BACKGROUND_LOCATION
                        } else null
                    ).filterNotNull().toTypedArray()
                )
            }
        ),
        PermissionStep(
            title = "Administrador do Dispositivo",
            description = "Permite controle administrativo completo do dispositivo",
            icon = Icons.Default.Lock,
            isGranted = { isDeviceAdminEnabled(context) },
            requestAction = {
                val intent = Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN).apply {
                    putExtra(
                        DevicePolicyManager.EXTRA_DEVICE_ADMIN,
                        ComponentName(context, com.sdb.mdm.receiver.DeviceAdminReceiver::class.java)
                    )
                    putExtra(
                        DevicePolicyManager.EXTRA_ADD_EXPLANATION,
                        "O FRIAXIS precisa de permissões administrativas para gerenciar este dispositivo"
                    )
                }
                deviceAdminLauncher.launch(intent)
            }
        ),
        PermissionStep(
            title = "Sobrepor Outras Apps",
            description = "Permite exibir notificações e alertas críticos",
            icon = Icons.Default.Phone,
            isGranted = { Settings.canDrawOverlays(context) },
            requestAction = {
                val intent = Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:${context.packageName}")
                )
                overlayPermissionLauncher.launch(intent)
            }
        ),
        PermissionStep(
            title = "Ignorar Otimização de Bateria",
            description = "Garante que o serviço funcione continuamente",
            icon = Icons.Default.Settings,
            isGranted = { isBatteryOptimizationDisabled(context) },
            requestAction = {
                val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                    data = Uri.parse("package:${context.packageName}")
                }
                batteryOptimizationLauncher.launch(intent)
            }
        )
    )
    
    // Check if all permissions are granted
    LaunchedEffect(currentStep) {
        if (currentStep >= permissionSteps.size) {
            val allGranted = permissionSteps.all { it.isGranted() }
            if (allGranted) {
                onAllPermissionsGranted()
            }
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
                PermissionStepCard(
                    step = step,
                    isActive = index == currentStep,
                    isCompleted = index < currentStep || step.isGranted()
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
                    onClick = step.requestAction
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