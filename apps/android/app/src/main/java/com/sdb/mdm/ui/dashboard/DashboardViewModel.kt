package com.sdb.mdm.ui.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import com.sdb.mdm.SDBApplication
import com.sdb.mdm.data.model.*
import com.sdb.mdm.data.repository.*
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject

/**
 * Dashboard ViewModel - FRIAXIS v4.0.0
 * Manages dashboard state and operations
 */
@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val deviceRepository: DeviceRepository,
    private val commandRepository: CommandRepository,
    private val policyRepository: PolicyRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()
    
    init {
        // Obter deviceId e organizationId reais do storage
        val deviceId = SDBApplication.instance.getStoredDeviceId() ?: ""
        val organizationId = "1" // Default organization ID
        
        if (deviceId.isNotEmpty()) {
            observeData(deviceId, organizationId)
            refreshData()
        } else {
            // Se não há deviceId, mostrar erro
            _uiState.value = _uiState.value.copy(
                isLoading = false,
                error = "Dispositivo não encontrado. Faça o emparelhamento novamente."
            )
        }
    }
    
    private fun observeData(deviceId: String, organizationId: String) {
        viewModelScope.launch {
            // Combine all data streams
            combine(
                deviceRepository.getDeviceById(deviceId),
                commandRepository.getPendingCommandsForDevice(deviceId),
                commandRepository.getRecentCommandsForDevice(deviceId),
                policyRepository.getActivePoliciesByOrganization(organizationId)
            ) { device, pendingCommands, recentCommands, policies ->
                _uiState.value = _uiState.value.copy(
                    device = device,
                    pendingCommands = pendingCommands,
                    recentCommands = recentCommands,
                    activePolicies = policies,
                    isLoading = false
                )
            }.collect()
        }
    }
    
    fun refreshData() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            
            try {
                // Usar deviceId real do storage
                val deviceId = SDBApplication.instance.getStoredDeviceId() ?: ""
                val organizationId = "1" // Default organization
                
                if (deviceId.isNotEmpty()) {
                    // Refresh data from server
                    deviceRepository.refreshDevices(organizationId)
                    commandRepository.syncCommands(deviceId)
                    policyRepository.syncPolicies(organizationId)
                    
                    // Update last seen
                    deviceRepository.updateLastSeen(deviceId)
                    
                    _uiState.value = _uiState.value.copy(
                        isOnline = true,
                        lastRefresh = System.currentTimeMillis()
                    )
                } else {
                    _uiState.value = _uiState.value.copy(
                        error = "Dispositivo não encontrado. Faça o emparelhamento."
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isOnline = false,
                    error = "Erro ao sincronizar dados: ${e.message}"
                )
            } finally {
                _uiState.value = _uiState.value.copy(isLoading = false)
            }
        }
    }
    
    fun executeCommand(commandId: String) {
        viewModelScope.launch {
            try {
                val command = _uiState.value.pendingCommands.find { it.id == commandId }
                if (command != null) {
                    commandRepository.executeCommand(command)
                        .onSuccess { result ->
                            // Command executed successfully
                        }
                        .onFailure { error ->
                            _uiState.value = _uiState.value.copy(
                                error = "Erro ao executar comando: ${error.message}"
                            )
                        }
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    error = "Erro inesperado: ${e.message}"
                )
            }
        }
    }
    
    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}

/**
 * UI State for Dashboard Screen
 */
data class DashboardUiState(
    val device: Device? = null,
    val organization: Organization? = null,
    val pendingCommands: List<Command> = emptyList(),
    val recentCommands: List<Command> = emptyList(),
    val activePolicies: List<Policy> = emptyList(),
    val isLoading: Boolean = false,
    val isOnline: Boolean = true,
    val lastRefresh: Long = 0L,
    val error: String? = null
)