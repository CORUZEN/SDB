package com.sdb.mdm.ui.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.sdb.mdm.service.HeartbeatService
import com.sdb.mdm.ui.theme.SDBTheme
import com.sdb.mdm.utils.DeviceInfoUtil
import com.sdb.mdm.utils.BatteryUtil
import com.sdb.mdm.utils.LocationUtil
import java.text.SimpleDateFormat
import java.util.*

/**
 * Dashboard Screen Profissional - FRIAXIS v4.0.5
 * Tela principal com informações completas do dispositivo
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreenProfessional(
    viewModel: DashboardViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current
    
    // Iniciar HeartbeatService quando o dashboard carrega
    LaunchedEffect(Unit) {
        HeartbeatService.start(context)
    }
    
    SDBTheme {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Lock,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary
                            )
                            Text(
                                text = "FRIAXIS MDM",
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    },
                    actions = {
                        // Status indicator
                        StatusIndicator(isOnline = uiState.isOnline)
                        
                        IconButton(onClick = { viewModel.refreshData() }) {
                            if (uiState.isLoading) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(20.dp),
                                    strokeWidth = 2.dp
                                )
                            } else {
                                Icon(
                                    imageVector = Icons.Default.Refresh,
                                    contentDescription = "Atualizar"
                                )
                            }
                        }
                    }
                )
            }
        ) { paddingValues ->
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                contentPadding = PaddingValues(vertical = 16.dp)
            ) {
                // Error handling
                uiState.error?.let { error ->
                    item {
                        ErrorCard(
                            message = error,
                            onDismiss = { viewModel.clearError() }
                        )
                    }
                }
                
                // Device Status Card Principal
                item {
                    DeviceStatusCardProfessional(
                        device = uiState.device,
                        isOnline = uiState.isOnline,
                        context = context
                    )
                }
                
                // Informações do Sistema
                item {
                    SystemInfoGrid(context = context)
                }
                
                // Bateria e Localização
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        BatteryCard(
                            modifier = Modifier.weight(1f),
                            context = context
                        )
                        LocationCard(
                            modifier = Modifier.weight(1f),
                            context = context
                        )
                    }
                }
                
                // Organization Info
                uiState.organization?.let { organization ->
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = Modifier.padding(16.dp)
                            ) {
                                Text(
                                    text = "Organização: ${organization.name}",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }
                
                // Status do Sistema
                item {
                    Card(
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.primaryContainer
                        )
                    ) {
                        Row(
                            modifier = Modifier.padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.CheckCircle,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary
                            )
                            
                            Text(
                                text = "Sistema funcionando normalmente",
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                }
                
                // Informações das Políticas
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Settings,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.primary
                                )
                                
                                Text(
                                    text = "Políticas de Segurança",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            
                            Spacer(modifier = Modifier.height(8.dp))
                            
                            Text(
                                text = "Sistema gerenciado pela organização",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
                
                // Última Atualização
                item {
                    LastUpdateCard(lastRefresh = uiState.lastRefresh)
                }
            }
        }
    }
}

@Composable
private fun StatusIndicator(isOnline: Boolean) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.padding(end = 8.dp)
    ) {
        Box(
            modifier = Modifier
                .size(8.dp)
                .clip(RoundedCornerShape(4.dp))
                .background(
                    color = if (isOnline) 
                        Color(0xFF4CAF50) 
                    else 
                        Color(0xFFF44336)
                )
        )
        Spacer(modifier = Modifier.width(4.dp))
        Text(
            text = if (isOnline) "ONLINE" else "OFFLINE",
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
private fun DeviceStatusCardProfessional(
    device: com.sdb.mdm.data.model.Device?,
    isOnline: Boolean,
    context: android.content.Context
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = if (isOnline) 
                MaterialTheme.colorScheme.primaryContainer
            else 
                MaterialTheme.colorScheme.errorContainer
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Status do Dispositivo",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    
                    val deviceName = device?.name ?: DeviceInfoUtil.getDeviceName(context)
                    Text(
                        text = deviceName,
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                
                Icon(
                    imageVector = if (isOnline) Icons.Default.CheckCircle else Icons.Default.Warning,
                    contentDescription = null,
                    modifier = Modifier.size(48.dp),
                    tint = if (isOnline) 
                        MaterialTheme.colorScheme.primary
                    else 
                        MaterialTheme.colorScheme.error
                )
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Device Info
            val deviceInfo = DeviceInfoUtil.getDeviceInfo(context)
            InfoRow("Modelo", "${deviceInfo.manufacturer} ${deviceInfo.model}")
            InfoRow("Sistema", "Android ${deviceInfo.androidVersion}")
            InfoRow("Versão do App", deviceInfo.appVersion)
            InfoRow("ID do Dispositivo", device?.id?.take(8) + "..." ?: "N/A")
            
            device?.let {
                InfoRow("Última Comunicação", formatDate(it.lastSeen))
            }
        }
    }
}

@Composable
private fun SystemInfoGrid(context: android.content.Context) {
    Card(
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "Informações do Sistema",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(bottom = 12.dp)
            )
            
            val deviceInfo = DeviceInfoUtil.getDeviceInfo(context)
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                InfoCard(
                    modifier = Modifier.weight(1f),
                    title = "RAM",
                    value = "${deviceInfo.totalMemoryGB}",
                    icon = Icons.Default.Build
                )
                
                InfoCard(
                    modifier = Modifier.weight(1f),
                    title = "Armazenamento",
                    value = "${deviceInfo.totalStorageGB}",
                    icon = Icons.Default.Home
                )
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                InfoCard(
                    modifier = Modifier.weight(1f),
                    title = "Rede",
                    value = deviceInfo.networkType,
                    icon = Icons.Default.Phone
                )
                
                InfoCard(
                    modifier = Modifier.weight(1f),
                    title = "Segurança",
                    value = if (deviceInfo.isDeviceSecure) "Ativa" else "Inativa",
                    icon = Icons.Default.Lock
                )
            }
        }
    }
}

@Composable
private fun BatteryCard(
    modifier: Modifier = Modifier,
    context: android.content.Context
) {
    val batteryInfo = BatteryUtil.getBatteryInfo(context)
    
    Card(modifier = modifier) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Star,
                    contentDescription = null,
                    tint = when {
                        batteryInfo.level >= 80 -> Color(0xFF4CAF50)
                        batteryInfo.level >= 50 -> Color(0xFFFF9800)
                        else -> Color(0xFFF44336)
                    }
                )
                
                Text(
                    text = "Bateria",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold
                )
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = "${batteryInfo.level}%",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold
            )
            
            Text(
                text = batteryInfo.status,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun LocationCard(
    modifier: Modifier = Modifier,
    context: android.content.Context
) {
    Card(modifier = modifier) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.LocationOn,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary
                )
                
                Text(
                    text = "Localização",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold
                )
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            val locationInfo = LocationUtil.getLocationInfo(context)
            
            Text(
                text = if (locationInfo.isEnabled) "Ativada" else "Desativada",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            
            Text(
                text = locationInfo.lastKnownLocation ?: "Não disponível",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun SectionHeader(
    title: String,
    icon: ImageVector,
    count: Int? = null
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.primary
        )
        
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold
        )
        
        count?.let {
            Badge {
                Text(text = it.toString())
            }
        }
    }
}

@Composable
private fun InfoRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 2.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Medium
        )
    }
}

@Composable
private fun InfoCard(
    modifier: Modifier = Modifier,
    title: String,
    value: String,
    icon: ImageVector
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary
            )
            
            Spacer(modifier = Modifier.height(4.dp))
            
            Text(
                text = title,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            
            Text(
                text = value,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
private fun ErrorCard(
    message: String,
    onDismiss: () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.errorContainer
        )
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.Warning,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.error
            )
            
            Text(
                text = message,
                modifier = Modifier
                    .weight(1f)
                    .padding(horizontal = 12.dp),
                style = MaterialTheme.typography.bodyMedium
            )
            
            IconButton(onClick = onDismiss) {
                Icon(
                    imageVector = Icons.Default.Close,
                    contentDescription = "Fechar"
                )
            }
        }
    }
}

@Composable
private fun LastUpdateCard(lastRefresh: Long) {
    Card(
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Info,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary
            )
            
            Text(
                text = "Última atualização: ${formatDate(Date(lastRefresh))}",
                style = MaterialTheme.typography.bodyMedium
            )
        }
    }
}

// Helper functions
private fun formatDate(date: Date?): String {
    if (date == null) return "N/A"
    val formatter = SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault())
    return formatter.format(date)
}