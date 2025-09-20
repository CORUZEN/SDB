package com.sdb.mdm.data.model

import com.google.gson.annotations.SerializedName

/**
 * Device Specification Model - FRIAXIS v4.0.0
 * Represents device hardware and software specifications
 */
data class DeviceSpec(
    @SerializedName("manufacturer")
    val manufacturer: String = "",
    
    @SerializedName("model")
    val model: String = "",
    
    @SerializedName("brand")
    val brand: String = "",
    
    @SerializedName("android_version")
    val androidVersion: String = "",
    
    @SerializedName("os_version")
    val osVersion: String = "",
    
    @SerializedName("api_level")
    val apiLevel: Int = 0,
    
    @SerializedName("cpu_architecture")
    val cpuArchitecture: String = "",
    
    @SerializedName("cpu_info")
    val cpuInfo: String = "",
    
    @SerializedName("total_ram")
    val totalRam: Long = 0L,
    
    @SerializedName("available_ram")
    val availableRam: Long = 0L,
    
    @SerializedName("total_storage")
    val totalStorage: Long = 0L,
    
    @SerializedName("available_storage")
    val availableStorage: Long = 0L,
    
    @SerializedName("screen_resolution")
    val screenResolution: String = "",
    
    @SerializedName("screen_density")
    val screenDensity: Float = 0f,
    
    @SerializedName("battery_capacity")
    val batteryCapacity: Int = 0,
    
    @SerializedName("serial_number")
    val serialNumber: String? = null,
    
    @SerializedName("imei")
    val imei: String? = null,
    
    @SerializedName("mac_address")
    val macAddress: String? = null,
    
    @SerializedName("has_fingerprint")
    val hasFingerprint: Boolean = false,
    
    @SerializedName("has_face_unlock")
    val hasFaceUnlock: Boolean = false,
    
    @SerializedName("has_nfc")
    val hasNfc: Boolean = false,
    
    @SerializedName("has_bluetooth")
    val hasBluetooth: Boolean = false,
    
    @SerializedName("has_wifi")
    val hasWifi: Boolean = false,
    
    @SerializedName("has_cellular")
    val hasCellular: Boolean = false,
    
    @SerializedName("is_rooted")
    val isRooted: Boolean = false,
    
    @SerializedName("security_patch_level")
    val securityPatchLevel: String? = null,
    
    @SerializedName("bootloader_version")
    val bootloaderVersion: String = "",
    
    @SerializedName("kernel_version")
    val kernelVersion: String = "",
    
    @SerializedName("hardware")
    val hardware: String = "",
    
    @SerializedName("device_type")
    val deviceType: String = "smartphone"
)