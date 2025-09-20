package com.sdb.mdm.ui.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
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
        // TODO: Get actual device ID from preferences/storage
        val deviceId = "current_device_id"
        val organizationId = "current_organization_id"
        
        observeData(deviceId, organizationId)
        refreshData()
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
                // TODO: Get actual IDs from preferences/storage
                val deviceId = "current_device_id"
                val organizationId = "current_organization_id"
                
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