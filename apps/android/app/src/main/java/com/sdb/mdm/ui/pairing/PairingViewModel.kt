package com.sdb.mdm.ui.pairing

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import com.sdb.mdm.SDBApplication
import com.sdb.mdm.data.repository.DeviceRegistrationRepository
import com.sdb.mdm.service.HeartbeatService
import com.sdb.mdm.utils.DeviceInfoCollector
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject

/**
 * Pairing ViewModel - FRIAXIS v4.0.0
 * Handles device pairing logic and state management
 */
@HiltViewModel
class PairingViewModel @Inject constructor(
    private val deviceRegistrationRepository: DeviceRegistrationRepository,
    private val deviceInfoCollector: DeviceInfoCollector
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(PairingUiState())
    val uiState: StateFlow<PairingUiState> = _uiState.asStateFlow()
    
    fun onPairingCodeChange(code: String) {
        _uiState.value = _uiState.value.copy(
            pairingCode = code.uppercase().take(6),
            error = null
        )
    }
    
    fun startPairing() {
        viewModelScope.launch {
            val currentState = _uiState.value
            
            if (currentState.pairingCode.isBlank()) {
                _uiState.value = currentState.copy(
                    error = "Por favor, insira o código de emparelhamento"
                )
                return@launch
            }
            
            _uiState.value = currentState.copy(
                isLoading = true,
                error = null
            )
            
            try {
                // Collect device information
                val deviceInfo = deviceInfoCollector.collectDeviceInfo()
                
                // Attempt pairing
                val result = deviceRegistrationRepository.registerDeviceWithCode(
                    pairingCode = currentState.pairingCode,
                    deviceInfo = deviceInfo
                )
                
                result.fold(
                    onSuccess = { device ->
                        // Salvar device ID e marcar como configurado após pareamento bem-sucedido
                        SDBApplication.instance.setStoredDeviceId(device.id)
                        SDBApplication.instance.setDeviceSetup(true)
                        Log.d("PairingViewModel", "Device ID salvo: ${device.id}")
                        Log.d("PairingViewModel", "Device setup marcado como true")
                        
                        // Verificar se foi realmente salvo
                        val savedId = SDBApplication.instance.getStoredDeviceId()
                        val setupStatus = SDBApplication.instance.isDeviceSetup()
                        Log.d("PairingViewModel", "Verificação - Device ID salvo: $savedId")
                        Log.d("PairingViewModel", "Verificação - Device setup: $setupStatus")
                        
                        // Iniciar HeartbeatService imediatamente
                        HeartbeatService.start(SDBApplication.instance.applicationContext)
                        
                        _uiState.value = currentState.copy(
                            isLoading = false,
                            isPaired = true,
                            error = null
                        )
                    },
                    onFailure = { exception ->
                        val errorMessage = when {
                            exception.message?.contains("invalid", true) == true -> 
                                "Código de emparelhamento inválido"
                            exception.message?.contains("expired", true) == true -> 
                                "Código de emparelhamento expirado"
                            exception.message?.contains("network", true) == true -> 
                                "Erro de conexão. Verifique sua internet"
                            else -> "Erro no emparelhamento. Tente novamente"
                        }
                        
                        _uiState.value = currentState.copy(
                            isLoading = false,
                            error = errorMessage
                        )
                    }
                )
            } catch (e: Exception) {
                _uiState.value = currentState.copy(
                    isLoading = false,
                    error = "Erro inesperado. Tente novamente"
                )
            }
        }
    }
}

/**
 * UI State for Pairing Screen
 */
data class PairingUiState(
    val pairingCode: String = "",
    val isLoading: Boolean = false,
    val isPaired: Boolean = false,
    val error: String? = null
)