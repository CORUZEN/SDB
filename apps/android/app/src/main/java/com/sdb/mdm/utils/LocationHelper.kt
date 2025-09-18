package com.sdb.mdm.utils

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationManager
import android.util.Log
import androidx.core.app.ActivityCompat
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

class LocationHelper(private val context: Context) {
    
    companion object {
        private const val TAG = "LocationHelper"
        private const val LOCATION_TIMEOUT = 10000L // 10 segundos
    }
    
    private val locationManager by lazy {
        context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
    }
    
    suspend fun getCurrentLocation(): Location? {
        if (!hasLocationPermissions()) {
            Log.w(TAG, "Permissões de localização não concedidas")
            return null
        }
        
        return try {
            getLastKnownLocation() ?: requestNewLocation()
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao obter localização", e)
            null
        }
    }
    
    private fun hasLocationPermissions(): Boolean {
        return ActivityCompat.checkSelfPermission(
            context, Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED || 
        ActivityCompat.checkSelfPermission(
            context, Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
    }
    
    private fun getLastKnownLocation(): Location? {
        if (!hasLocationPermissions()) return null
        
        val providers = locationManager.getProviders(true)
        var bestLocation: Location? = null
        
        for (provider in providers) {
            try {
                val location = locationManager.getLastKnownLocation(provider)
                if (location != null && isBetterLocation(location, bestLocation)) {
                    bestLocation = location
                }
            } catch (e: SecurityException) {
                Log.e(TAG, "Erro de segurança ao obter localização", e)
            }
        }
        
        return bestLocation
    }
    
    private suspend fun requestNewLocation(): Location? = suspendCancellableCoroutine { continuation ->
        if (!hasLocationPermissions()) {
            continuation.resume(null)
            return@suspendCancellableCoroutine
        }
        
        val provider = when {
            locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER) -> 
                LocationManager.GPS_PROVIDER
            locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER) -> 
                LocationManager.NETWORK_PROVIDER
            else -> {
                Log.w(TAG, "Nenhum provedor de localização disponível")
                continuation.resume(null)
                return@suspendCancellableCoroutine
            }
        }
        
        val locationListener = object : android.location.LocationListener {
            override fun onLocationChanged(location: Location) {
                locationManager.removeUpdates(this)
                Log.d(TAG, "Nova localização obtida: ${location.latitude}, ${location.longitude}")
                continuation.resume(location)
            }
            
            override fun onProviderEnabled(provider: String) {}
            override fun onProviderDisabled(provider: String) {}
        }
        
        try {
            locationManager.requestLocationUpdates(
                provider,
                0L,
                0f,
                locationListener
            )
            
            // Timeout para cancelar se não obter localização
            continuation.invokeOnCancellation {
                locationManager.removeUpdates(locationListener)
            }
            
            // Configurar timeout
            android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
                if (continuation.isActive) {
                    locationManager.removeUpdates(locationListener)
                    continuation.resume(null)
                }
            }, LOCATION_TIMEOUT)
            
        } catch (e: SecurityException) {
            Log.e(TAG, "Erro de segurança ao solicitar localização", e)
            continuation.resume(null)
        }
    }
    
    private fun isBetterLocation(location: Location, currentBestLocation: Location?): Boolean {
        if (currentBestLocation == null) {
            return true
        }
        
        val timeDelta = location.time - currentBestLocation.time
        val isSignificantlyNewer = timeDelta > 2 * 60 * 1000 // 2 minutos
        val isSignificantlyOlder = timeDelta < -2 * 60 * 1000
        val isNewer = timeDelta > 0
        
        if (isSignificantlyNewer) {
            return true
        } else if (isSignificantlyOlder) {
            return false
        }
        
        val accuracyDelta = (location.accuracy - currentBestLocation.accuracy).toInt()
        val isLessAccurate = accuracyDelta > 0
        val isMoreAccurate = accuracyDelta < 0
        val isSignificantlyLessAccurate = accuracyDelta > 200
        
        val isFromSameProvider = location.provider == currentBestLocation.provider
        
        return when {
            isMoreAccurate -> true
            isNewer && !isLessAccurate -> true
            isNewer && !isSignificantlyLessAccurate && isFromSameProvider -> true
            else -> false
        }
    }
}