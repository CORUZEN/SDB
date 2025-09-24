package com.sdb.mdm.utils

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.LocationManager
import androidx.core.content.ContextCompat

/**
 * Utility para obter informações de localização do dispositivo
 */
object LocationUtil {
    
    data class LocationInfo(
        val isEnabled: Boolean,
        val hasPermission: Boolean,
        val lastKnownLocation: String?,
        val provider: String,
        val accuracy: Float?
    )
    
    fun getLocationInfo(context: Context): LocationInfo {
        val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
        
        val isGPSEnabled = locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)
        val isNetworkEnabled = locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
        val isEnabled = isGPSEnabled || isNetworkEnabled
        
        val hasPermission = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED ||
        ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        
        var lastKnownLocation: String? = null
        var provider = "Nenhum"
        var accuracy: Float? = null
        
        if (hasPermission && isEnabled) {
            try {
                val lastKnownGPS = if (isGPSEnabled) {
                    locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER)
                } else null
                
                val lastKnownNetwork = if (isNetworkEnabled) {
                    locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
                } else null
                
                val bestLocation = when {
                    lastKnownGPS != null && lastKnownNetwork != null -> {
                        if (lastKnownGPS.time > lastKnownNetwork.time) lastKnownGPS else lastKnownNetwork
                    }
                    lastKnownGPS != null -> lastKnownGPS
                    lastKnownNetwork != null -> lastKnownNetwork
                    else -> null
                }
                
                bestLocation?.let { location ->
                    lastKnownLocation = "${String.format("%.4f", location.latitude)}, ${String.format("%.4f", location.longitude)}"
                    provider = location.provider ?: "Desconhecido"
                    accuracy = location.accuracy
                }
            } catch (e: SecurityException) {
                // Permission not granted
            }
        }
        
        return LocationInfo(
            isEnabled = isEnabled,
            hasPermission = hasPermission,
            lastKnownLocation = lastKnownLocation,
            provider = provider,
            accuracy = accuracy
        )
    }
    
    fun isLocationEnabled(context: Context): Boolean {
        val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
        return locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER) ||
               locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
    }
    
    fun hasLocationPermission(context: Context): Boolean {
        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED ||
        ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
    }
}