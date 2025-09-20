package com.sdb.mdm.ui.dashboard

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.sdb.mdm.data.model.Command
import com.sdb.mdm.data.model.CommandStatus
import com.sdb.mdm.data.model.CommandType
import com.sdb.mdm.ui.theme.SDBTheme
import java.text.SimpleDateFormat
import java.util.*

/**
 * Dashboard Screen - FRIAXIS v4.0.0
 * Main dashboard for device management and status
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    viewModel: DashboardViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    
    SDBTheme {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = {
                        Text(
                            text = "FRIAXIS",
                            fontWeight = FontWeight.Bold
                        )
                    },
                    actions = {
                        IconButton(
                            onClick = { viewModel.refreshData() }
                        ) {
                            Icon(
                                imageVector = Icons.Default.Refresh,
                                contentDescription = "Atualizar"
                            )
                        }
                        
                        IconButton(
                            onClick = { /* TODO: Settings */ }
                        ) {
                            Icon(
                                imageVector = Icons.Default.Settings,
                                contentDescription = "Configurações"
                            )
                        }
                    }
                )
            }
        ) { paddingValues ->
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Device Status Card
                item {
                    DeviceStatusCard(
                        device = uiState.device,
                        isOnline = uiState.isOnline
                    )
                }
                
                // Organization Info Card
                item {
                    OrganizationCard(
                        organization = uiState.organization
                    )
                }
                
                // Pending Commands Section
                if (uiState.pendingCommands.isNotEmpty()) {
                    item {
                        Text(
                            text = "Comandos Pendentes",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    
                    items(uiState.pendingCommands) { command ->
                        CommandCard(
                            command = command,
                            onExecute = { viewModel.executeCommand(command.id) }
                        )
                    }
                }
                
                // Recent Commands Section
                if (uiState.recentCommands.isNotEmpty()) {
                    item {
                        Text(
                            text = "Comandos Recentes",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    
                    items(uiState.recentCommands.take(5)) { command ->
                        CommandHistoryCard(command = command)
                    }
                }
                
                // Policies Section
                if (uiState.activePolicies.isNotEmpty()) {
                    item {
                        Text(
                            text = "Políticas Ativas",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    
                    items(uiState.activePolicies) { policy ->
                        PolicyCard(policy = policy)
                    }
                }
            }
        }
    }
}

@Composable
private fun DeviceStatusCard(
    device: com.sdb.mdm.data.model.Device?,
    isOnline: Boolean
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = if (isOnline) 
                MaterialTheme.colorScheme.primaryContainer 
            else 
                MaterialTheme.colorScheme.errorContainer
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Status do Dispositivo",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                
                Badge(
                    containerColor = if (isOnline) 
                        MaterialTheme.colorScheme.primary 
                    else 
                        MaterialTheme.colorScheme.error
                ) {
                    Text(
                        text = if (isOnline) "ONLINE" else "OFFLINE",
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            device?.let {
                Text(
                    text = "${it.manufacturer} ${it.model}",
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Medium
                )
                
                Text(
                    text = "Android ${it.osVersion}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                
                Text(
                    text = "Última comunicação: ${formatDate(it.lastSeen)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun OrganizationCard(
    organization: com.sdb.mdm.data.model.Organization?
) {
    organization?.let {
        Card(
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(
                    text = "Organização",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                Text(
                    text = it.name,
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Medium
                )
                
                Text(
                    text = "Plano: ${it.subscriptionTier}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun CommandCard(
    command: Command,
    onExecute: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(
                    modifier = Modifier.weight(1f)
                ) {
                    Text(
                        text = getCommandDisplayName(command.type),
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold
                    )
                    
                    Text(
                        text = "Prioridade: ${command.priority}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                
                Button(
                    onClick = onExecute,
                    modifier = Modifier.height(36.dp)
                ) {
                    Text("Executar")
                }
            }
        }
    }
}

@Composable
private fun CommandHistoryCard(
    command: Command
) {
    Card(
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(
                    modifier = Modifier.weight(1f)
                ) {
                    Text(
                        text = getCommandDisplayName(command.type),
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold
                    )
                    
                    Text(
                        text = formatDate(command.createdAt),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                
                Badge(
                    containerColor = getStatusColor(command.status)
                ) {
                    Text(
                        text = getStatusDisplayName(command.status),
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                }
            }
        }
    }
}

@Composable
private fun PolicyCard(
    policy: com.sdb.mdm.data.model.Policy
) {
    Card(
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = policy.name,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold
            )
            
            policy.description?.let {
                Text(
                    text = it,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            Spacer(modifier = Modifier.height(4.dp))
            
            Text(
                text = "Categoria: ${policy.category}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

// Helper functions
private fun getCommandDisplayName(type: CommandType): String {
    return when (type) {
        CommandType.SYNC_POLICIES -> "Sincronizar Políticas"
        CommandType.UPDATE_APP -> "Atualizar Aplicativo"
        CommandType.RESTART_DEVICE -> "Reiniciar Dispositivo"
        CommandType.LOCK_DEVICE -> "Bloquear Dispositivo"
        CommandType.UNLOCK_DEVICE -> "Desbloquear Dispositivo"
        CommandType.WIPE_DEVICE -> "Limpar Dispositivo"
        CommandType.GET_LOCATION -> "Obter Localização"
        CommandType.GET_DEVICE_INFO -> "Obter Informações"
        CommandType.INSTALL_APP -> "Instalar App"
        CommandType.UNINSTALL_APP -> "Desinstalar App"
        CommandType.ENABLE_WIFI -> "Habilitar WiFi"
        CommandType.DISABLE_WIFI -> "Desabilitar WiFi"
        CommandType.CUSTOM -> "Comando Personalizado"
    }
}

private fun getStatusDisplayName(status: CommandStatus): String {
    return when (status) {
        CommandStatus.PENDING -> "PENDENTE"
        CommandStatus.EXECUTING -> "EXECUTANDO"
        CommandStatus.COMPLETED -> "CONCLUÍDO"
        CommandStatus.FAILED -> "FALHOU"
        CommandStatus.EXPIRED -> "EXPIRADO"
        CommandStatus.CANCELLED -> "CANCELADO"
    }
}

@Composable
private fun getStatusColor(status: CommandStatus): androidx.compose.ui.graphics.Color {
    return when (status) {
        CommandStatus.PENDING -> MaterialTheme.colorScheme.tertiary
        CommandStatus.EXECUTING -> MaterialTheme.colorScheme.primary
        CommandStatus.COMPLETED -> MaterialTheme.colorScheme.primary
        CommandStatus.FAILED -> MaterialTheme.colorScheme.error
        CommandStatus.EXPIRED -> MaterialTheme.colorScheme.outline
        CommandStatus.CANCELLED -> MaterialTheme.colorScheme.outline
    }
}

private fun formatDate(date: Date?): String {
    if (date == null) return "N/A"
    val formatter = SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault())
    return formatter.format(date)
}

@Preview(showBackground = true)
@Composable
fun DashboardScreenPreview() {
    SDBTheme {
        DashboardScreen()
    }
}