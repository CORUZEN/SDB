package com.sdb.mdm.service

import android.app.Service
import android.content.Intent
import android.location.Location
import android.os.IBinder
import android.util.Log
import androidx.lifecycle.lifecycleScope
import com.sdb.mdm.SDBApplication
import com.sdb.mdm.admin.DeviceAdminManager
import com.sdb.mdm.api.ApiClient
import com.sdb.mdm.model.CommandResponseRequest
import com.sdb.mdm.utils.LocationHelper
import kotlinx.coroutines.*
import java.text.SimpleDateFormat
import java.util.*

class CommandExecutorService : Service() {
    
    companion object {
        private const val TAG = "CommandExecutor"
    }
    
    private val apiClient by lazy { SDBApplication.instance.apiClient }
    private val deviceAdminManager by lazy { DeviceAdminManager(this) }
    private val locationHelper by lazy { LocationHelper(this) }
    
    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    
    override fun onBind(intent: Intent?): IBinder? = null
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val commandId = intent?.getStringExtra("command_id")
        val commandType = intent?.getStringExtra("command_type")
        
        if (commandId != null && commandType != null) {
            executeCommand(commandId, commandType)
        }
        
        return START_NOT_STICKY
    }
    
    private fun executeCommand(commandId: String, commandType: String) {
        serviceScope.launch {
            try {
                Log.d(TAG, "Executando comando: $commandType")
                
                val result = when (commandType) {
                    "PING" -> executePing()
                    "LOCATE_NOW" -> executeLocate()
                    "LOCK_DEVICE" -> executeLock()
                    "WIPE_DATA" -> executeWipe()
                    "SCREENSHOT" -> executeScreenshot()
                    "GET_APPS" -> executeGetApps()
                    "APPLY_POLICY" -> executeApplyPolicy()
                    "GET_DEVICE_INFO" -> executeGetDeviceInfo()
                    else -> {
                        Log.w(TAG, "Comando desconhecido: $commandType")
                        mapOf("error" to "Comando não suportado")
                    }
                }
                
                // Enviar resposta para o servidor
                sendCommandResponse(commandId, "completed", result)
                
            } catch (e: Exception) {
                Log.e(TAG, "Erro ao executar comando", e)
                sendCommandResponse(commandId, "failed", mapOf("error" to (e.message ?: "Erro desconhecido")))
            } finally {
                stopSelf()
            }
        }
    }
    
    private suspend fun executePing(): Map<String, Any> {
        return mapOf(
            "status" to "online",
            "timestamp" to getCurrentTimestamp(),
            "battery_level" to getBatteryLevel()
        )
    }
    
    private suspend fun executeLocate(): Map<String, Any> {
        return try {
            val location = locationHelper.getCurrentLocation()
            if (location != null) {
                // Enviar localização para o servidor
                updateLocationOnServer(location)
                
                mapOf(
                    "latitude" to location.latitude,
                    "longitude" to location.longitude,
                    "accuracy" to location.accuracy,
                    "timestamp" to getCurrentTimestamp()
                )
            } else {
                mapOf("error" to "Não foi possível obter localização")
            }
        } catch (e: Exception) {
            mapOf("error" to "Erro ao obter localização: ${e.message}")
        }
    }
    
    private suspend fun executeLock(): Map<String, Any> {
        return try {
            deviceAdminManager.lockDevice()
            mapOf("status" to "locked", "timestamp" to getCurrentTimestamp())
        } catch (e: Exception) {
            mapOf("error" to "Erro ao bloquear dispositivo: ${e.message}")
        }
    }
    
    private suspend fun executeWipe(): Map<String, Any> {
        return try {
            Log.w(TAG, "EXECUTANDO WIPE DO DISPOSITIVO!")
            deviceAdminManager.wipeDevice()
            mapOf("status" to "wiped", "timestamp" to getCurrentTimestamp())
        } catch (e: Exception) {
            mapOf("error" to "Erro ao limpar dispositivo: ${e.message}")
        }
    }
    
    private suspend fun executeScreenshot(): Map<String, Any> {
        // TODO: Implementar captura de tela (requer permissões especiais)
        return mapOf("error" to "Captura de tela não implementada ainda")
    }
    
    private suspend fun executeGetApps(): Map<String, Any> {
        // TODO: Implementar listagem de apps instalados
        return mapOf("apps" to emptyList<String>())
    }
    
    private suspend fun executeApplyPolicy(): Map<String, Any> {
        return try {
            // Buscar política atual do dispositivo
            val deviceId = SDBApplication.instance.getStoredDeviceId()
            if (deviceId != null) {
                val response = apiClient.getApiService().getDevicePolicy(deviceId)
                if (response.isSuccessful && response.body()?.success == true) {
                    val policy = response.body()?.data
                    if (policy != null) {
                        deviceAdminManager.applyPolicy(policy)
                        mapOf("status" to "policy_applied", "policy_name" to policy.name)
                    } else {
                        mapOf("error" to "Nenhuma política encontrada")
                    }
                } else {
                    mapOf("error" to "Erro ao buscar política no servidor")
                }
            } else {
                mapOf("error" to "Device ID não encontrado")
            }
        } catch (e: Exception) {
            mapOf("error" to "Erro ao aplicar política: ${e.message}")
        }
    }
    
    private suspend fun executeGetDeviceInfo(): Map<String, Any> {
        return mapOf(
            "model" to android.os.Build.MODEL,
            "manufacturer" to android.os.Build.MANUFACTURER,
            "android_version" to android.os.Build.VERSION.RELEASE,
            "api_level" to android.os.Build.VERSION.SDK_INT,
            "serial" to android.os.Build.SERIAL,
            "battery_level" to getBatteryLevel(),
            "storage_free" to getAvailableStorage(),
            "timestamp" to getCurrentTimestamp()
        )
    }
    
    private suspend fun sendCommandResponse(commandId: String, status: String, response: Map<String, Any>) {
        try {
            val request = CommandResponseRequest(
                commandId = commandId,
                status = status,
                response = response,
                executedAt = getCurrentTimestamp()
            )
            
            val apiResponse = apiClient.getApiService().sendCommandResponse(commandId, request)
            if (apiResponse.isSuccessful) {
                Log.d(TAG, "Resposta do comando enviada com sucesso")
            } else {
                Log.e(TAG, "Erro ao enviar resposta do comando: ${apiResponse.code()}")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao enviar resposta do comando", e)
        }
    }
    
    private suspend fun updateLocationOnServer(location: Location) {
        try {
            val deviceId = SDBApplication.instance.getStoredDeviceId() ?: return
            
            val locationRequest = com.sdb.mdm.model.LocationUpdateRequest(
                latitude = location.latitude,
                longitude = location.longitude,
                accuracy = location.accuracy,
                timestamp = getCurrentTimestamp()
            )
            
            apiClient.getApiService().updateLocation(deviceId, locationRequest)
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao atualizar localização no servidor", e)
        }
    }
    
    private fun getCurrentTimestamp(): String {
        return SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).format(Date())
    }
    
    private fun getBatteryLevel(): Int {
        // TODO: Implementar leitura do nível da bateria
        return 100
    }
    
    private fun getAvailableStorage(): Long {
        // TODO: Implementar leitura do armazenamento disponível
        return 0L
    }
    
    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
    }
}