package com.sdb.mdm.utils

import android.content.Context
import android.os.Build
import android.app.ActivityManager
import android.os.StatFs
import android.os.Environment
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.app.KeyguardManager
import com.sdb.mdm.BuildConfig

/**
 * Utility para obter informações reais do dispositivo Android
 */
object DeviceInfoUtil {
    
    data class DeviceInfo(
        val manufacturer: String,
        val model: String,
        val androidVersion: String,
        val apiLevel: Int,
        val appVersion: String,
        val totalMemoryGB: String,
        val totalStorageGB: String,
        val networkType: String,
        val isDeviceSecure: Boolean,
        val serialNumber: String,
        val imei: String? = null
    )
    
    fun getDeviceInfo(context: Context): DeviceInfo {
        return DeviceInfo(
            manufacturer = Build.MANUFACTURER.capitalize(),
            model = Build.MODEL,
            androidVersion = Build.VERSION.RELEASE,
            apiLevel = Build.VERSION.SDK_INT,
            appVersion = BuildConfig.VERSION_NAME,
            totalMemoryGB = getTotalMemoryGB(context),
            totalStorageGB = getTotalStorageGB(),
            networkType = getNetworkType(context),
            isDeviceSecure = isDeviceSecure(context),
            serialNumber = getSerialNumber(),
            imei = null // Requires special permissions
        )
    }
    
    fun getDeviceName(context: Context): String {
        val manufacturer = Build.MANUFACTURER.capitalize()
        val model = Build.MODEL
        return "$manufacturer $model"
    }
    
    private fun getTotalMemoryGB(context: Context): String {
        return try {
            val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
            val memInfo = ActivityManager.MemoryInfo()
            activityManager.getMemoryInfo(memInfo)
            val totalMemoryBytes = memInfo.totalMem
            val totalMemoryGB = totalMemoryBytes / (1024 * 1024 * 1024)
            "${totalMemoryGB} GB"
        } catch (e: Exception) {
            "N/A"
        }
    }
    
    private fun getTotalStorageGB(): String {
        return try {
            val path = Environment.getDataDirectory()
            val stat = StatFs(path.path)
            val totalBytes = stat.blockSizeLong * stat.blockCountLong
            val totalGB = totalBytes / (1024 * 1024 * 1024)
            "${totalGB} GB"
        } catch (e: Exception) {
            "N/A"
        }
    }
    
    private fun getNetworkType(context: Context): String {
        return try {
            val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
            val network = connectivityManager.activeNetwork
            val networkCapabilities = connectivityManager.getNetworkCapabilities(network)
            
            when {
                networkCapabilities?.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) == true -> "WiFi"
                networkCapabilities?.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) == true -> "Móvel"
                networkCapabilities?.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) == true -> "Ethernet"
                else -> "Desconectado"
            }
        } catch (e: Exception) {
            "N/A"
        }
    }
    
    private fun isDeviceSecure(context: Context): Boolean {
        return try {
            val keyguardManager = context.getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
            keyguardManager.isDeviceSecure
        } catch (e: Exception) {
            false
        }
    }
    
    private fun getSerialNumber(): String {
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Build.getSerial()
            } else {
                @Suppress("DEPRECATION")
                Build.SERIAL
            }
        } catch (e: Exception) {
            "N/A"
        }
    }
}