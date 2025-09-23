package com.sdb.mdm.data.repository

import android.util.Log
import androidx.lifecycle.LiveData
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import com.sdb.mdm.data.dao.*
import com.sdb.mdm.data.model.*
import com.sdb.mdm.network.api.SDBApiService
import javax.inject.Inject
import javax.inject.Singleton
import java.util.Date

/**
 * Device Repository - FRIAXIS v4.0.0
 * Central repository for device-related data operations
 */
@Singleton
class DeviceRepository @Inject constructor(
    private val deviceDao: DeviceDao,
    private val apiService: SDBApiService
) {
    
    fun getDevicesByOrganization(organizationId: String): Flow<List<Device>> {
        return deviceDao.getDevicesByOrganization(organizationId)
    }
    
    fun getDeviceById(deviceId: String): Flow<Device?> {
        return deviceDao.getDeviceByIdFlow(deviceId)
    }
    
    suspend fun refreshDevices(organizationId: String) {
        try {
            val devices = apiService.getDevices(organizationId)
            devices.forEach { device ->
                deviceDao.insertDevice(device)
            }
        } catch (e: Exception) {
            // Handle network error - data will come from local cache
        }
    }
    
    suspend fun updateDeviceStatus(deviceId: String, status: String) {
        deviceDao.updateDeviceStatus(deviceId, status)
        try {
            apiService.updateDeviceStatus(deviceId, status)
        } catch (e: Exception) {
            // Handle network error - will sync later
        }
    }
    
    suspend fun updateLastSeen(deviceId: String) {
        val now = Date()
        deviceDao.updateLastSeen(deviceId, now)
        try {
            apiService.updateDeviceLastSeen(deviceId, now)
        } catch (e: Exception) {
            // Handle network error - will sync later
        }
    }
}

/**
 * Device Registration Repository
 */
@Singleton
class DeviceRegistrationRepository @Inject constructor(
    private val registrationDao: DeviceRegistrationDao,
    private val apiService: SDBApiService
) {
    
    suspend fun registerDeviceWithCode(pairingCode: String, deviceInfo: DeviceSpec): Result<com.sdb.mdm.data.model.Device> {
        return try {
            Log.d("DeviceRegistration", "Iniciando registro com código: $pairingCode")
            Log.d("DeviceRegistration", "Device specs: ${deviceInfo.manufacturer} ${deviceInfo.model}")
            
            // Primeiro, validar o código de pareamento
            try {
                val validationRequest = mapOf("pairing_code" to pairingCode)
                apiService.validatePairingCode(validationRequest)
                Log.d("DeviceRegistration", "Código validado com sucesso")
            } catch (e: Exception) {
                Log.e("DeviceRegistration", "Erro na validação do código: ${e.message}")
                return Result.failure(Exception("Código de pareamento inválido ou expirado"))
            }
            
            // Gerar ID único para o dispositivo
            val deviceId = generateId()
            
            // Registrar no backend via API
            val registrationRequest = mapOf(
                "name" to "${deviceInfo.manufacturer} ${deviceInfo.model}",
                "model" to android.os.Build.MODEL,
                "android_version" to android.os.Build.VERSION.RELEASE,
                "firebase_token" to "", // TODO: Get from FirebaseMessaging
                "pairing_code" to pairingCode,
                "device_identifier" to deviceId
            )
            
            val registeredDevice = apiService.registerDevice(registrationRequest)
            Log.d("DeviceRegistration", "Dispositivo registrado no backend: ${registeredDevice.id}")
            
            // Criar device registration para salvar localmente
            val deviceRegistration = DeviceRegistration(
                id = generateId(),
                deviceId = registeredDevice.id,
                pairingCode = pairingCode,
                name = registeredDevice.name,
                model = registeredDevice.model ?: android.os.Build.MODEL,
                androidVersion = registeredDevice.osVersion ?: android.os.Build.VERSION.RELEASE,
                status = RegistrationStatus.PENDING,
                createdAt = Date(),
                expiresAt = Date(System.currentTimeMillis() + 24 * 60 * 60 * 1000)
            )
            
            // Salvar localmente
            registrationDao.insertRegistration(deviceRegistration)
            
            // Criar device model
            val device = com.sdb.mdm.data.model.Device(
                id = registeredDevice.id,
                organizationId = registeredDevice.organizationId ?: "1",
                name = registeredDevice.name,
                deviceIdentifier = registeredDevice.deviceIdentifier ?: deviceId,
                model = registeredDevice.model ?: android.os.Build.MODEL,
                osVersion = registeredDevice.osVersion ?: android.os.Build.VERSION.RELEASE,
                status = com.sdb.mdm.data.model.DeviceStatus.PENDING
            )
            
            Result.success(device)
            
        } catch (e: Exception) {
            Log.e("DeviceRegistration", "Erro no registro: ${e.message}", e)
            Result.failure(e)
        }
    }
    
    suspend fun getRegistrationByPairingCode(pairingCode: String): DeviceRegistration? {
        return registrationDao.getRegistrationByPairingCode(pairingCode)
    }
    
    private fun generateId(): String {
        return java.util.UUID.randomUUID().toString()
    }
}

/**
 * Policy Repository
 */
@Singleton
class PolicyRepository @Inject constructor(
    private val policyDao: PolicyDao,
    private val apiService: SDBApiService
) {
    
    fun getActivePoliciesByOrganization(organizationId: String): Flow<List<Policy>> {
        return policyDao.getActivePoliciesByOrganization(organizationId)
    }
    
    suspend fun syncPolicies(organizationId: String) {
        try {
            val policies = apiService.getPolicies(organizationId)
            policyDao.deletePoliciesByOrganization(organizationId)
            policyDao.insertPolicies(policies)
        } catch (e: Exception) {
            // Handle network error - use cached policies
        }
    }
}

/**
 * Command Repository
 */
@Singleton
class CommandRepository @Inject constructor(
    private val commandDao: CommandDao,
    private val apiService: SDBApiService
) {
    
    fun getPendingCommandsForDevice(deviceId: String): Flow<List<Command>> {
        return commandDao.getPendingCommandsForDevice(deviceId)
    }
    
    fun getRecentCommandsForDevice(deviceId: String): Flow<List<Command>> {
        return commandDao.getRecentCommandsForDevice(deviceId)
    }
    
    suspend fun syncCommands(deviceId: String) {
        try {
            val commands = apiService.getCommandsForDevice(deviceId)
            commandDao.insertCommands(commands)
        } catch (e: Exception) {
            // Handle network error
        }
    }
    
    suspend fun executeCommand(command: Command): Result<String> {
        return try {
            // Update command status to executing
            commandDao.updateCommandStatus(command.id, CommandStatus.EXECUTING)
            
            // Execute command based on type
            val result = when (command.type) {
                CommandType.SYNC_POLICIES -> executeSyncPolicies(command)
                CommandType.GET_DEVICE_INFO -> executeGetDeviceInfo(command)
                CommandType.GET_LOCATION -> executeGetLocation(command)
                CommandType.LOCK_DEVICE -> executeLockDevice(command)
                CommandType.UNLOCK_DEVICE -> executeUnlockDevice(command)
                CommandType.RESTART_DEVICE -> executeRestartDevice(command)
                else -> "Command type not implemented"
            }
            
            // Update command with result
            commandDao.updateCommandResult(
                command.id,
                CommandStatus.COMPLETED,
                result,
                Date()
            )
            
            // Report result to server
            try {
                apiService.reportCommandResult(command.id, result)
            } catch (e: Exception) {
                // Handle network error - will sync later
            }
            
            Result.success(result)
        } catch (e: Exception) {
            // Update command with error
            commandDao.updateCommandError(
                command.id,
                CommandStatus.FAILED,
                e.message,
                Date()
            )
            
            Result.failure(e)
        }
    }
    
    private suspend fun executeSyncPolicies(command: Command): String {
        // Implement policy sync logic
        return "Policies synced successfully"
    }
    
    private suspend fun executeGetDeviceInfo(command: Command): String {
        // Implement device info collection
        return "Device info collected"
    }
    
    private suspend fun executeGetLocation(command: Command): String {
        // Implement location collection
        return "Location collected"
    }
    
    private suspend fun executeLockDevice(command: Command): String {
        // Implement device lock
        return "Device locked"
    }
    
    private suspend fun executeUnlockDevice(command: Command): String {
        // Implement device unlock
        return "Device unlocked"
    }
    
    private suspend fun executeRestartDevice(command: Command): String {
        // Implement device restart
        return "Device restart initiated"
    }
    
    suspend fun cleanupOldCommands(deviceId: String) {
        commandDao.cleanupCompletedCommands(deviceId)
        commandDao.expireOldCommands(Date())
    }
}