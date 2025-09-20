package com.sdb.mdm.utils

import android.content.Context
import android.os.Build
import android.provider.Settings
import android.telephony.TelephonyManager
import com.sdb.mdm.data.model.DeviceSpec
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Device Info Collector - FRIAXIS v4.0.0
 * Collects comprehensive device information for registration
 */
@Singleton
class DeviceInfoCollector @Inject constructor(
    @ApplicationContext private val context: Context
) {
    
    fun collectDeviceInfo(): DeviceSpec {
        return DeviceSpec(
            manufacturer = Build.MANUFACTURER,
            model = Build.MODEL,
            osVersion = Build.VERSION.RELEASE,
            apiLevel = Build.VERSION.SDK_INT,
            serialNumber = getSerialNumber(),
            imei = getImei(),
            macAddress = getMacAddress(),
            screenResolution = getScreenResolution(),
            totalStorage = getTotalStorage(),
            totalRam = getTotalRam(),
            cpuInfo = getCpuInfo(),
            batteryCapacity = getBatteryCapacity(),
            isRooted = isDeviceRooted(),
            securityPatchLevel = getSecurityPatchLevel(),
            bootloaderVersion = Build.BOOTLOADER,
            kernelVersion = getKernelVersion()
        )
    }
    
    private fun getSerialNumber(): String? {
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Build.getSerial()
            } else {
                @Suppress("DEPRECATION")
                Build.SERIAL
            }
        } catch (e: SecurityException) {
            null
        }
    }
    
    private fun getImei(): String? {
        return try {
            val telephonyManager = context.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                telephonyManager.imei
            } else {
                @Suppress("DEPRECATION")
                telephonyManager.deviceId
            }
        } catch (e: SecurityException) {
            null
        }
    }
    
    private fun getMacAddress(): String? {
        return try {
            Settings.Secure.getString(
                context.contentResolver,
                Settings.Secure.ANDROID_ID
            )
        } catch (e: Exception) {
            null
        }
    }
    
    private fun getScreenResolution(): String {
        val displayMetrics = context.resources.displayMetrics
        return "${displayMetrics.widthPixels}x${displayMetrics.heightPixels}"
    }
    
    private fun getTotalStorage(): Long {
        return try {
            val statFs = android.os.StatFs(android.os.Environment.getDataDirectory().path)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR2) {
                statFs.blockCountLong * statFs.blockSizeLong
            } else {
                @Suppress("DEPRECATION")
                statFs.blockCount.toLong() * statFs.blockSize.toLong()
            }
        } catch (e: Exception) {
            0L
        }
    }
    
    private fun getTotalRam(): Long {
        return try {
            val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as android.app.ActivityManager
            val memInfo = android.app.ActivityManager.MemoryInfo()
            activityManager.getMemoryInfo(memInfo)
            memInfo.totalMem
        } catch (e: Exception) {
            0L
        }
    }
    
    private fun getCpuInfo(): String {
        return try {
            val cpuInfo = StringBuilder()
            cpuInfo.append("ABI: ${Build.CPU_ABI}")
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                cpuInfo.append(", Supported ABIs: ${Build.SUPPORTED_ABIS.joinToString(", ")}")
            }
            cpuInfo.toString()
        } catch (e: Exception) {
            "Unknown"
        }
    }
    
    private fun getBatteryCapacity(): Int {
        return try {
            val powerProfile = Class.forName("com.android.internal.os.PowerProfile")
                .getConstructor(Context::class.java)
                .newInstance(context)
            
            val capacity = powerProfile.javaClass
                .getMethod("getBatteryCapacity")
                .invoke(powerProfile) as Double
            
            capacity.toInt()
        } catch (e: Exception) {
            0
        }
    }
    
    private fun isDeviceRooted(): Boolean {
        return try {
            val buildTags = Build.TAGS
            buildTags != null && buildTags.contains("test-keys")
        } catch (e: Exception) {
            false
        }
    }
    
    private fun getSecurityPatchLevel(): String? {
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Build.VERSION.SECURITY_PATCH
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }
    
    private fun getKernelVersion(): String {
        return try {
            val process = Runtime.getRuntime().exec("uname -r")
            val bufferedReader = java.io.BufferedReader(
                java.io.InputStreamReader(process.inputStream)
            )
            bufferedReader.readLine() ?: "Unknown"
        } catch (e: Exception) {
            "Unknown"
        }
    }
}