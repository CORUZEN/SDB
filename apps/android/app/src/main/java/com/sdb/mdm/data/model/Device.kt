package com.sdb.mdm.data.model

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey
import com.google.gson.annotations.SerializedName
import java.util.Date

/**
 * Device Model - FRIAXIS v4.0.0
 * Represents a device in the multi-tenant system
 */
@Entity(tableName = "devices")
data class Device(
    @PrimaryKey
    @SerializedName("id")
    val id: String,
    
    @SerializedName("organization_id")
    @ColumnInfo(name = "organization_id")
    val organizationId: String,
    
    @SerializedName("name")
    val name: String,
    
    @SerializedName("device_identifier")
    @ColumnInfo(name = "device_identifier")
    val deviceIdentifier: String,
    
    @SerializedName("serial_number")
    @ColumnInfo(name = "serial_number")
    val serialNumber: String? = null,
    
    @SerializedName("status")
    val status: DeviceStatus = DeviceStatus.OFFLINE,
    
    @SerializedName("device_type")
    @ColumnInfo(name = "device_type")
    val deviceType: String = "smartphone",
    
    @SerializedName("manufacturer")
    val manufacturer: String? = null,
    
    @SerializedName("model")
    val model: String? = null,
    
    @SerializedName("os_type")
    @ColumnInfo(name = "os_type")
    val osType: String = "android",
    
    @SerializedName("os_version")
    @ColumnInfo(name = "os_version")
    val osVersion: String? = null,
    
    @SerializedName("app_version")
    @ColumnInfo(name = "app_version")
    val appVersion: String? = null,
    
    @SerializedName("last_seen")
    @ColumnInfo(name = "last_seen")
    val lastSeen: Date? = null,
    
    @SerializedName("battery_level")
    @ColumnInfo(name = "battery_level")
    val batteryLevel: Int? = null,
    
    @SerializedName("storage_used")
    @ColumnInfo(name = "storage_used")
    val storageUsed: Long? = null,
    
    @SerializedName("storage_total")
    @ColumnInfo(name = "storage_total")
    val storageTotal: Long? = null,
    
    @SerializedName("location_lat")
    @ColumnInfo(name = "location_lat")
    val locationLat: Double? = null,
    
    @SerializedName("location_lng")
    @ColumnInfo(name = "location_lng")
    val locationLng: Double? = null,
    
    @SerializedName("compliance_status")
    @ColumnInfo(name = "compliance_status")
    val complianceStatus: String = "unknown",
    
    @SerializedName("health_score")
    @ColumnInfo(name = "health_score")
    val healthScore: Int = 0,
    
    @SerializedName("created_at")
    @ColumnInfo(name = "created_at")
    val createdAt: Date? = null,
    
    @SerializedName("updated_at")
    @ColumnInfo(name = "updated_at")
    val updatedAt: Date? = null,
    
    // Local-only fields
    @ColumnInfo(name = "is_paired")
    val isPaired: Boolean = false,
    @ColumnInfo(name = "pairing_code")
    val pairingCode: String? = null,
    @ColumnInfo(name = "last_sync_time")
    val lastSyncTime: Date? = null,
    @ColumnInfo(name = "is_online")
    val isOnline: Boolean = false
)

/**
 * Device Status Enum
 */
enum class DeviceStatus {
    @SerializedName("online")
    ONLINE,
    
    @SerializedName("offline")
    OFFLINE,
    
    @SerializedName("maintenance")
    MAINTENANCE,
    
    @SerializedName("error")
    ERROR,
    
    @SerializedName("pending")
    PENDING
}

/**
 * Device Registration Model
 * Used for the pairing process
 */
@Entity(tableName = "device_registrations")
data class DeviceRegistration(
    @PrimaryKey
    val id: String,
    
    @SerializedName("device_id")
    @ColumnInfo(name = "device_id")
    val deviceId: String,
    
    @SerializedName("organization_id")
    @ColumnInfo(name = "organization_id")
    val organizationId: String? = null,
    
    @SerializedName("pairing_code")
    @ColumnInfo(name = "pairing_code")
    val pairingCode: String,
    
    @SerializedName("name")
    val name: String,
    
    @SerializedName("model")
    val model: String,
    
    @SerializedName("android_version")
    @ColumnInfo(name = "android_version")
    val androidVersion: String,
    
    @SerializedName("status")
    val status: RegistrationStatus = RegistrationStatus.PENDING,
    
    @SerializedName("created_at")
    @ColumnInfo(name = "created_at")
    val createdAt: Date,
    
    @SerializedName("expires_at")
    @ColumnInfo(name = "expires_at")
    val expiresAt: Date,
    
    @SerializedName("approved_at")
    @ColumnInfo(name = "approved_at")
    val approvedAt: Date? = null,
    
    @SerializedName("approved_by")
    @ColumnInfo(name = "approved_by")
    val approvedBy: String? = null
)

/**
 * Registration Status Enum
 */
enum class RegistrationStatus {
    @SerializedName("pending")
    PENDING,
    
    @SerializedName("approved")
    APPROVED,
    
    @SerializedName("rejected")
    REJECTED,
    
    @SerializedName("expired")
    EXPIRED
}