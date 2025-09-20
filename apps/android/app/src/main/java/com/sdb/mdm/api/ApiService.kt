package com.sdb.mdm.api

import com.sdb.mdm.model.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {
    
    @GET("api/health")
    suspend fun getHealth(): Response<ApiResponse<Map<String, String>>>
    
    @POST("api/devices/register")
    suspend fun registerDevice(@Body request: DeviceRegistrationRequest): Response<ApiResponse<DeviceRegistrationResponse>>
    
    @GET("api/devices/register/{code}")
    suspend fun checkRegistrationStatus(@Path("code") pairingCode: String): Response<ApiResponse<RegistrationStatusResponse>>
    
    @GET("api/devices/{id}")
    suspend fun getDevice(@Path("id") deviceId: String): Response<ApiResponse<Device>>
    
    @PUT("api/devices/{id}")
    suspend fun updateDevice(@Path("id") deviceId: String, @Body device: Device): Response<ApiResponse<Device>>
    
    @POST("api/devices/{id}/location")
    suspend fun updateLocation(@Path("id") deviceId: String, @Body location: LocationUpdateRequest): Response<ApiResponse<Unit>>
    
    @GET("api/devices/{id}/commands")
    suspend fun getPendingCommands(@Path("id") deviceId: String): Response<ApiResponse<List<Command>>>
    
    @POST("api/commands/{id}/response")
    suspend fun sendCommandResponse(@Path("id") commandId: String, @Body response: CommandResponseRequest): Response<ApiResponse<Unit>>
    
    @GET("api/devices/{id}/policy")
    suspend fun getDevicePolicy(@Path("id") deviceId: String): Response<ApiResponse<Policy>>
    
    @POST("api/devices/{id}/events")
    suspend fun sendEvent(
        @Path("id") deviceId: String,
        @Body event: Map<String, Any>
    ): Response<ApiResponse<Unit>>
    
    @POST("api/devices/{id}/heartbeat")
    suspend fun sendHeartbeat(
        @Path("id") deviceId: String,
        @Body heartbeat: HeartbeatRequest
    ): Response<ApiResponse<HeartbeatResponse>>
}