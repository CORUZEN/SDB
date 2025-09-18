package com.sdb.mdm.model

import com.google.gson.annotations.SerializedName

data class Device(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("model") val model: String,
    @SerializedName("owner") val owner: String?,
    @SerializedName("imei") val imei: String?,
    @SerializedName("status") val status: String,
    @SerializedName("location") val location: Location?,
    @SerializedName("tags") val tags: List<String>?,
    @SerializedName("created_at") val createdAt: String,
    @SerializedName("updated_at") val updatedAt: String
)

data class Location(
    @SerializedName("latitude") val latitude: Double,
    @SerializedName("longitude") val longitude: Double,
    @SerializedName("accuracy") val accuracy: Float?,
    @SerializedName("timestamp") val timestamp: String
)

data class Policy(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("description") val description: String?,
    @SerializedName("policy_json") val policyJson: PolicyConfig,
    @SerializedName("is_active") val isActive: Boolean,
    @SerializedName("created_at") val createdAt: String,
    @SerializedName("updated_at") val updatedAt: String
)

data class PolicyConfig(
    @SerializedName("kiosk_mode") val kiosk_mode: Boolean = false,
    @SerializedName("require_pin") val require_pin: Boolean = false,
    @SerializedName("pin_length") val pin_length: Int? = null,
    @SerializedName("force_encrypt") val force_encrypt: Boolean = false,
    @SerializedName("disable_camera") val disable_camera: Boolean = false,
    @SerializedName("disable_bluetooth") val disable_bluetooth: Boolean = false,
    @SerializedName("disable_wifi") val disable_wifi: Boolean = false,
    @SerializedName("launcher_apps") val launcher_apps: List<String>? = null,
    @SerializedName("blocked_apps") val blocked_apps: List<String>? = null,
    @SerializedName("max_failed_attempts") val max_failed_attempts: Int? = null,
    @SerializedName("screen_timeout") val screen_timeout: Int? = null
)

data class Command(
    @SerializedName("id") val id: String,
    @SerializedName("device_id") val deviceId: String,
    @SerializedName("command_type") val commandType: String,
    @SerializedName("parameters") val parameters: Map<String, Any>?,
    @SerializedName("status") val status: String,
    @SerializedName("response") val response: Map<String, Any>?,
    @SerializedName("created_at") val createdAt: String,
    @SerializedName("executed_at") val executedAt: String?
)

data class AppInfo(
    val packageName: String,
    val appName: String,
    val iconDrawable: android.graphics.drawable.Drawable?,
    val isSystemApp: Boolean
)

// Requests para API
data class DeviceRegistrationRequest(
    @SerializedName("name") val name: String,
    @SerializedName("model") val model: String,
    @SerializedName("imei") val imei: String?,
    @SerializedName("android_version") val androidVersion: String,
    @SerializedName("firebase_token") val firebaseToken: String
)

data class LocationUpdateRequest(
    @SerializedName("latitude") val latitude: Double,
    @SerializedName("longitude") val longitude: Double,
    @SerializedName("accuracy") val accuracy: Float,
    @SerializedName("timestamp") val timestamp: String
)

data class CommandResponseRequest(
    @SerializedName("command_id") val commandId: String,
    @SerializedName("status") val status: String,
    @SerializedName("response") val response: Map<String, Any>,
    @SerializedName("executed_at") val executedAt: String
)

// Responses da API
data class ApiResponse<T>(
    @SerializedName("success") val success: Boolean,
    @SerializedName("data") val data: T?,
    @SerializedName("error") val error: String?
)

data class DeviceRegistrationResponse(
    @SerializedName("device_id") val deviceId: String,
    @SerializedName("pairing_code") val pairingCode: String,
    @SerializedName("status") val status: String,
    @SerializedName("message") val message: String
)

data class RegistrationStatusResponse(
    @SerializedName("device_id") val deviceId: String,
    @SerializedName("status") val status: String,
    @SerializedName("approved") val approved: Boolean
)