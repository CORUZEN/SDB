package com.sdb.mdm.network.api

import retrofit2.http.*
import com.sdb.mdm.data.model.*
import java.util.Date

/**
 * SDB API Service - FRIAXIS v4.0.0
 * Retrofit interface for communication with the SDB web panel
 */
interface SDBApiService {
    
    // Device endpoints
    @GET("api/devices")
    suspend fun getDevices(@Query("organization_id") organizationId: String): List<Device>
    
    @GET("api/devices/{deviceId}")
    suspend fun getDevice(@Path("deviceId") deviceId: String): Device
    
    @PUT("api/devices/{deviceId}/status")
    suspend fun updateDeviceStatus(
        @Path("deviceId") deviceId: String,
        @Body status: String
    ): Device
    
    @PUT("api/devices/{deviceId}/last-seen")
    suspend fun updateDeviceLastSeen(
        @Path("deviceId") deviceId: String,
        @Body lastSeen: Date
    ): Device
    
    // Registration endpoints
    @POST("api/devices/validate-pairing")
    suspend fun validatePairingCode(@Body pairingCode: String): PairingValidationResponse
    
    @POST("api/devices/register")
    suspend fun registerDevice(@Body registration: DeviceRegistration): Device
    
    // Policy endpoints
    @GET("api/policies")
    suspend fun getPolicies(@Query("organization_id") organizationId: String): List<Policy>
    
    @GET("api/policies/{policyId}")
    suspend fun getPolicy(@Path("policyId") policyId: String): Policy
    
    // Command endpoints
    @GET("api/commands")
    suspend fun getCommandsForDevice(@Query("device_id") deviceId: String): List<Command>
    
    @PUT("api/commands/{commandId}/result")
    suspend fun reportCommandResult(
        @Path("commandId") commandId: String,
        @Body result: String
    ): Command
    
    @PUT("api/commands/{commandId}/status")
    suspend fun updateCommandStatus(
        @Path("commandId") commandId: String,
        @Body status: CommandStatus
    ): Command
    
    // Organization endpoints
    @GET("api/organizations/{organizationId}")
    suspend fun getOrganization(@Path("organizationId") organizationId: String): Organization
    
    // Health check
    @GET("api/health")
    suspend fun healthCheck(): HealthResponse
}

/**
 * API Response Models
 */
data class PairingValidationResponse(
    val isValid: Boolean,
    val organizationId: String,
    val organizationName: String,
    val expiresAt: Date?
)

data class HealthResponse(
    val status: String,
    val timestamp: Date,
    val version: String
)