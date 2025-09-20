package com.sdb.mdm.data.dao

import androidx.room.*
import androidx.lifecycle.LiveData
import kotlinx.coroutines.flow.Flow
import com.sdb.mdm.data.model.*

/**
 * Device DAO - FRIAXIS v4.0.0
 * Database access object for device operations
 */
@Dao
interface DeviceDao {
    
    @Query("SELECT * FROM devices WHERE organization_id = :organizationId ORDER BY last_seen DESC")
    fun getDevicesByOrganization(organizationId: String): Flow<List<Device>>
    
    @Query("SELECT * FROM devices WHERE id = :deviceId")
    suspend fun getDeviceById(deviceId: String): Device?
    
    @Query("SELECT * FROM devices WHERE id = :deviceId")
    fun getDeviceByIdFlow(deviceId: String): Flow<Device?>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDevice(device: Device)
    
    @Update
    suspend fun updateDevice(device: Device)
    
    @Delete
    suspend fun deleteDevice(device: Device)
    
    @Query("DELETE FROM devices WHERE id = :deviceId")
    suspend fun deleteDeviceById(deviceId: String)
    
    @Query("UPDATE devices SET status = :status WHERE id = :deviceId")
    suspend fun updateDeviceStatus(deviceId: String, status: String)
    
    @Query("UPDATE devices SET last_seen = :lastSeen WHERE id = :deviceId")
    suspend fun updateLastSeen(deviceId: String, lastSeen: java.util.Date)
}

/**
 * Device Registration DAO
 */
@Dao
interface DeviceRegistrationDao {
    
    @Query("SELECT * FROM device_registrations WHERE pairing_code = :pairingCode")
    suspend fun getRegistrationByPairingCode(pairingCode: String): DeviceRegistration?
    
    @Query("SELECT * FROM device_registrations WHERE device_id = :deviceId")
    suspend fun getRegistrationByDeviceId(deviceId: String): DeviceRegistration?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRegistration(registration: DeviceRegistration)
    
    @Update
    suspend fun updateRegistration(registration: DeviceRegistration)
    
    @Delete
    suspend fun deleteRegistration(registration: DeviceRegistration)
    
    @Query("DELETE FROM device_registrations WHERE pairing_code = :pairingCode")
    suspend fun deleteRegistrationByPairingCode(pairingCode: String)
    
    @Query("UPDATE device_registrations SET status = :status WHERE pairing_code = :pairingCode")
    suspend fun updateRegistrationStatus(pairingCode: String, status: String)
}

/**
 * Organization DAO
 */
@Dao
interface OrganizationDao {
    
    @Query("SELECT * FROM organizations WHERE id = :organizationId")
    suspend fun getOrganizationById(organizationId: String): Organization?
    
    @Query("SELECT * FROM organizations WHERE id = :organizationId")
    fun getOrganizationByIdFlow(organizationId: String): Flow<Organization?>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrganization(organization: Organization)
    
    @Update
    suspend fun updateOrganization(organization: Organization)
}

/**
 * User DAO
 */
@Dao
interface UserDao {
    
    @Query("SELECT * FROM users WHERE id = :userId")
    suspend fun getUserById(userId: String): User?
    
    @Query("SELECT * FROM users WHERE firebase_uid = :firebaseUid")
    suspend fun getUserByFirebaseUid(firebaseUid: String): User?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUser(user: User)
    
    @Update
    suspend fun updateUser(user: User)
}

/**
 * Policy DAO
 */
@Dao
interface PolicyDao {
    
    @Query("SELECT * FROM policies WHERE organization_id = :organizationId AND is_active = 1 ORDER BY priority DESC")
    fun getActivePoliciesByOrganization(organizationId: String): Flow<List<Policy>>
    
    @Query("SELECT * FROM policies WHERE id = :policyId")
    suspend fun getPolicyById(policyId: String): Policy?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPolicy(policy: Policy)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPolicies(policies: List<Policy>)
    
    @Update
    suspend fun updatePolicy(policy: Policy)
    
    @Delete
    suspend fun deletePolicy(policy: Policy)
    
    @Query("DELETE FROM policies WHERE organization_id = :organizationId")
    suspend fun deletePoliciesByOrganization(organizationId: String)
}

/**
 * Command DAO
 */
@Dao
interface CommandDao {
    
    @Query("SELECT * FROM commands WHERE device_id = :deviceId AND status IN ('pending', 'executing') ORDER BY priority DESC, created_at ASC")
    fun getPendingCommandsForDevice(deviceId: String): Flow<List<Command>>
    
    @Query("SELECT * FROM commands WHERE id = :commandId")
    suspend fun getCommandById(commandId: String): Command?
    
    @Query("SELECT * FROM commands WHERE device_id = :deviceId ORDER BY created_at DESC LIMIT 50")
    fun getRecentCommandsForDevice(deviceId: String): Flow<List<Command>>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCommand(command: Command)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCommands(commands: List<Command>)
    
    @Update
    suspend fun updateCommand(command: Command)
    
    @Query("UPDATE commands SET status = :status WHERE id = :commandId")
    suspend fun updateCommandStatus(commandId: String, status: CommandStatus)
    
    @Query("UPDATE commands SET status = :status, result = :result, executed_at = :executedAt WHERE id = :commandId")
    suspend fun updateCommandResult(
        commandId: String, 
        status: CommandStatus, 
        result: String?, 
        executedAt: java.util.Date
    )
    
    @Query("UPDATE commands SET status = :status, error_message = :errorMessage, executed_at = :executedAt WHERE id = :commandId")
    suspend fun updateCommandError(
        commandId: String, 
        status: CommandStatus, 
        errorMessage: String?, 
        executedAt: java.util.Date
    )
    
    @Query("DELETE FROM commands WHERE device_id = :deviceId AND status IN ('completed', 'failed', 'expired', 'cancelled')")
    suspend fun cleanupCompletedCommands(deviceId: String)
    
    @Query("UPDATE commands SET status = 'expired' WHERE expires_at < :currentTime AND status IN ('pending', 'executing')")
    suspend fun expireOldCommands(currentTime: java.util.Date)
}