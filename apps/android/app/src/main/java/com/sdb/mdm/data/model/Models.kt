package com.sdb.mdm.data.model

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey
import com.google.gson.annotations.SerializedName
import java.util.Date

/**
 * Organization Model - FRIAXIS v4.0.0
 * Represents an organization in the multi-tenant system
 */
@Entity(tableName = "organizations")
data class Organization(
    @PrimaryKey
    @SerializedName("id")
    val id: String,
    
    @SerializedName("name")
    val name: String,
    
    @SerializedName("slug")
    val slug: String,
    
    @SerializedName("logo_url")
    val logoUrl: String? = null,
    
    @SerializedName("subscription_tier")
    val subscriptionTier: String = "basic",
    
    @SerializedName("status")
    val status: String = "active",
    
    @SerializedName("created_at")
    val createdAt: Date? = null
)

/**
 * User Model - FRIAXIS v4.0.0
 */
@Entity(tableName = "users")
data class User(
    @PrimaryKey
    @SerializedName("id")
    val id: String,
    
    @SerializedName("firebase_uid")
    @ColumnInfo(name = "firebase_uid")
    val firebaseUid: String,
    
    @SerializedName("email")
    val email: String,
    
    @SerializedName("name")
    val name: String,
    
    @SerializedName("avatar_url")
    @ColumnInfo(name = "avatar_url")
    val avatarUrl: String? = null,
    
    @SerializedName("role")
    val role: String = "viewer",
    
    @SerializedName("permissions")
    val permissions: List<String> = emptyList(),
    
    @SerializedName("created_at")
    @ColumnInfo(name = "created_at")
    val createdAt: Date? = null
)

/**
 * Policy Model - FRIAXIS v4.0.0
 */
@Entity(tableName = "policies")
data class Policy(
    @PrimaryKey
    @SerializedName("id")
    val id: String,
    
    @SerializedName("organization_id")
    @ColumnInfo(name = "organization_id")
    val organizationId: String,
    
    @SerializedName("name")
    val name: String,
    
    @SerializedName("description")
    val description: String? = null,
    
    @SerializedName("category")
    val category: String,
    
    @SerializedName("config")
    val config: PolicyConfig,
    
    @SerializedName("is_active")
    @ColumnInfo(name = "is_active")
    val isActive: Boolean = true,
    
    @SerializedName("priority")
    val priority: Int = 1,
    
    @SerializedName("created_at")
    @ColumnInfo(name = "created_at")
    val createdAt: Date? = null,
    
    @SerializedName("updated_at")
    @ColumnInfo(name = "updated_at")
    val updatedAt: Date? = null
)

/**
 * Policy Configuration
 */
data class PolicyConfig(
    @SerializedName("restrictions")
    val restrictions: Map<String, Any> = emptyMap(),
    
    @SerializedName("permissions")
    val permissions: Map<String, Boolean> = emptyMap(),
    
    @SerializedName("settings")
    val settings: Map<String, Any> = emptyMap(),
    
    @SerializedName("compliance_rules")
    val complianceRules: List<ComplianceRule> = emptyList()
)

/**
 * Compliance Rule
 */
data class ComplianceRule(
    @SerializedName("rule_type")
    val ruleType: String,
    
    @SerializedName("parameters")
    val parameters: Map<String, Any> = emptyMap(),
    
    @SerializedName("enforcement_level")
    val enforcementLevel: String = "warning"
)

/**
 * Command Model - FRIAXIS v4.0.0
 * Represents commands sent from the web panel to the device
 */
@Entity(tableName = "commands")
data class Command(
    @PrimaryKey
    @SerializedName("id")
    val id: String,
    
    @SerializedName("device_id")
    @ColumnInfo(name = "device_id")
    val deviceId: String,
    
    @SerializedName("organization_id")
    @ColumnInfo(name = "organization_id")
    val organizationId: String,
    
    @SerializedName("type")
    val type: CommandType,
    
    @SerializedName("payload")
    val payload: Map<String, Any> = emptyMap(),
    
    @SerializedName("status")
    val status: CommandStatus = CommandStatus.PENDING,
    
    @SerializedName("priority")
    val priority: Int = 1,
    
    @SerializedName("created_at")
    @ColumnInfo(name = "created_at")
    val createdAt: Date,
    
    @SerializedName("executed_at")
    @ColumnInfo(name = "executed_at")
    val executedAt: Date? = null,
    
    @SerializedName("expires_at")
    @ColumnInfo(name = "expires_at")
    val expiresAt: Date? = null,
    
    // Local fields
    val result: String? = null,
    @ColumnInfo(name = "error_message")
    val errorMessage: String? = null
)

/**
 * Command Types
 */
enum class CommandType {
    @SerializedName("sync_policies")
    SYNC_POLICIES,
    
    @SerializedName("update_app")
    UPDATE_APP,
    
    @SerializedName("restart_device")
    RESTART_DEVICE,
    
    @SerializedName("lock_device")
    LOCK_DEVICE,
    
    @SerializedName("unlock_device")
    UNLOCK_DEVICE,
    
    @SerializedName("wipe_device")
    WIPE_DEVICE,
    
    @SerializedName("get_location")
    GET_LOCATION,
    
    @SerializedName("get_device_info")
    GET_DEVICE_INFO,
    
    @SerializedName("install_app")
    INSTALL_APP,
    
    @SerializedName("uninstall_app")
    UNINSTALL_APP,
    
    @SerializedName("enable_wifi")
    ENABLE_WIFI,
    
    @SerializedName("disable_wifi")
    DISABLE_WIFI,
    
    @SerializedName("custom")
    CUSTOM
}

/**
 * Command Status
 */
enum class CommandStatus {
    @SerializedName("pending")
    PENDING,
    
    @SerializedName("executing")
    EXECUTING,
    
    @SerializedName("completed")
    COMPLETED,
    
    @SerializedName("failed")
    FAILED,
    
    @SerializedName("expired")
    EXPIRED,
    
    @SerializedName("cancelled")
    CANCELLED
}