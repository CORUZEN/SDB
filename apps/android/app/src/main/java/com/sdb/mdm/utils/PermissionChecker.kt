package com.sdb.mdm.utils

import android.Manifest
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Settings
import androidx.core.content.ContextCompat
import com.sdb.mdm.receiver.DeviceAdminReceiver

/**
 * Permission Checker - FRIAXIS v4.0.7
 * Utility class to check if all required permissions are granted
 */
object PermissionChecker {
    
    fun areAllPermissionsGranted(context: Context): Boolean {
        val locationGranted = isLocationPermissionGranted(context)
        val deviceAdminGranted = isDeviceAdminEnabled(context)
        val overlayGranted = Settings.canDrawOverlays(context)
        val batteryOptimizationGranted = isBatteryOptimizationDisabled(context)
        
        android.util.Log.d("PermissionChecker", "=== PERMISSION CHECK ===")
        android.util.Log.d("PermissionChecker", "Location: $locationGranted")
        android.util.Log.d("PermissionChecker", "Device Admin: $deviceAdminGranted")
        android.util.Log.d("PermissionChecker", "Overlay: $overlayGranted")
        android.util.Log.d("PermissionChecker", "Battery Optimization: $batteryOptimizationGranted")
        
        // For now, we'll only require location and device admin as mandatory
        // Overlay and battery optimization are nice to have but not critical
        val allMandatoryGranted = locationGranted && deviceAdminGranted
        
        android.util.Log.d("PermissionChecker", "All mandatory permissions granted: $allMandatoryGranted")
        
        return allMandatoryGranted
    }
    
    private fun isLocationPermissionGranted(context: Context): Boolean {
        val fineLocation = ContextCompat.checkSelfPermission(
            context, Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        
        val coarseLocation = ContextCompat.checkSelfPermission(
            context, Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        
        return fineLocation && coarseLocation
    }
    
    private fun isDeviceAdminEnabled(context: Context): Boolean {
        val devicePolicyManager = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        val componentName = ComponentName(context, DeviceAdminReceiver::class.java)
        return devicePolicyManager.isAdminActive(componentName)
    }
    
    private fun isBatteryOptimizationDisabled(context: Context): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val powerManager = context.getSystemService(Context.POWER_SERVICE) as android.os.PowerManager
            powerManager.isIgnoringBatteryOptimizations(context.packageName)
        } else {
            true // Not applicable for older versions
        }
    }
}