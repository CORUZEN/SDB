package com.sdb.mdm.data.database

import androidx.room.TypeConverter
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.sdb.mdm.data.model.*
import java.util.Date

/**
 * Room Type Converters - FRIAXIS v4.0.0
 * Handles conversion of complex types for Room database storage
 */
class Converters {
    
    private val gson = Gson()
    
    // Date converters
    @TypeConverter
    fun fromTimestamp(value: Long?): Date? {
        return value?.let { Date(it) }
    }
    
    @TypeConverter
    fun dateToTimestamp(date: Date?): Long? {
        return date?.time
    }
    
    // List<String> converters
    @TypeConverter
    fun fromStringList(value: List<String>): String {
        return gson.toJson(value)
    }
    
    @TypeConverter
    fun toStringList(value: String): List<String> {
        val listType = object : TypeToken<List<String>>() {}.type
        return gson.fromJson(value, listType) ?: emptyList()
    }
    
    // Map<String, Any> converters
    @TypeConverter
    fun fromStringAnyMap(value: Map<String, Any>): String {
        return gson.toJson(value)
    }
    
    @TypeConverter
    fun toStringAnyMap(value: String): Map<String, Any> {
        val mapType = object : TypeToken<Map<String, Any>>() {}.type
        return gson.fromJson(value, mapType) ?: emptyMap()
    }
    
    // Map<String, Boolean> converters
    @TypeConverter
    fun fromStringBooleanMap(value: Map<String, Boolean>): String {
        return gson.toJson(value)
    }
    
    @TypeConverter
    fun toStringBooleanMap(value: String): Map<String, Boolean> {
        val mapType = object : TypeToken<Map<String, Boolean>>() {}.type
        return gson.fromJson(value, mapType) ?: emptyMap()
    }
    
    // PolicyConfig converter
    @TypeConverter
    fun fromPolicyConfig(value: PolicyConfig): String {
        return gson.toJson(value)
    }
    
    @TypeConverter
    fun toPolicyConfig(value: String): PolicyConfig {
        return gson.fromJson(value, PolicyConfig::class.java) ?: PolicyConfig()
    }
    
    // List<ComplianceRule> converter
    @TypeConverter
    fun fromComplianceRuleList(value: List<ComplianceRule>): String {
        return gson.toJson(value)
    }
    
    @TypeConverter
    fun toComplianceRuleList(value: String): List<ComplianceRule> {
        val listType = object : TypeToken<List<ComplianceRule>>() {}.type
        return gson.fromJson(value, listType) ?: emptyList()
    }
    
    // CommandType converter
    @TypeConverter
    fun fromCommandType(value: CommandType): String {
        return value.name
    }
    
    @TypeConverter
    fun toCommandType(value: String): CommandType {
        return try {
            CommandType.valueOf(value)
        } catch (e: IllegalArgumentException) {
            CommandType.CUSTOM
        }
    }
    
    // CommandStatus converter
    @TypeConverter
    fun fromCommandStatus(value: CommandStatus): String {
        return value.name
    }
    
    @TypeConverter
    fun toCommandStatus(value: String): CommandStatus {
        return try {
            CommandStatus.valueOf(value)
        } catch (e: IllegalArgumentException) {
            CommandStatus.PENDING
        }
    }
    
    // DeviceStatus converter
    @TypeConverter
    fun fromDeviceStatus(value: DeviceStatus): String {
        return value.name
    }
    
    @TypeConverter
    fun toDeviceStatus(value: String): DeviceStatus {
        return try {
            DeviceStatus.valueOf(value)
        } catch (e: IllegalArgumentException) {
            DeviceStatus.OFFLINE
        }
    }
    
    // RegistrationStatus converter
    @TypeConverter
    fun fromRegistrationStatus(value: RegistrationStatus): String {
        return value.name
    }
    
    @TypeConverter
    fun toRegistrationStatus(value: String): RegistrationStatus {
        return try {
            RegistrationStatus.valueOf(value)
        } catch (e: IllegalArgumentException) {
            RegistrationStatus.PENDING
        }
    }
}