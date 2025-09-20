package com.sdb.mdm.service

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.util.Log
import androidx.lifecycle.lifecycleScope
import com.sdb.mdm.SDBApplication
import com.sdb.mdm.admin.DeviceAdminManager
import kotlinx.coroutines.*

class PolicyService : Service() {
    
    companion object {
        private const val TAG = "PolicyService"
        private const val POLICY_CHECK_INTERVAL = 60000L // 1 minuto
    }
    
    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var policyCheckJob: Job? = null
    
    override fun onBind(intent: Intent?): IBinder? = null
    
    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "PolicyService iniciado")
        startPolicyMonitoring()
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY // Reiniciar automaticamente se o serviço for morto
    }
    
    private fun startPolicyMonitoring() {
        policyCheckJob?.cancel()
        policyCheckJob = serviceScope.launch {
            while (isActive) {
                try {
                    checkAndApplyPolicies()
                    sendDeviceTelemetry()
                    delay(POLICY_CHECK_INTERVAL)
                } catch (e: Exception) {
                    Log.e(TAG, "Erro ao verificar políticas/telemetria", e)
                    delay(POLICY_CHECK_INTERVAL)
                }
            }
        }
    }

    private suspend fun sendDeviceTelemetry() {
        if (!SDBApplication.instance.isDeviceSetup()) return
        try {
            val deviceId = SDBApplication.instance.getStoredDeviceId() ?: return
            val apiService = SDBApplication.instance.apiClient.getApiService()

            // Coletar dados do dispositivo
            val batteryLevel = getBatteryLevel()
            val androidVersion = android.os.Build.VERSION.RELEASE
            val model = android.os.Build.MODEL
            val deviceName = SDBApplication.instance.sharedPreferences.getString("device_name", model) ?: model
            val lastActivity = System.currentTimeMillis().toString()

            // Usar os dados coletados no device
            Log.d(TAG, "Telemetria: Battery $batteryLevel%, Android $androidVersion, Model: $model")

            // Localização (opcional)
            var location: com.sdb.mdm.model.Location? = null
            try {
                val locationHelper = com.sdb.mdm.utils.LocationHelper(this@PolicyService)
                val loc = locationHelper.getCurrentLocation()
                if (loc != null) {
                    location = com.sdb.mdm.model.Location(
                        latitude = loc.latitude,
                        longitude = loc.longitude,
                        accuracy = loc.accuracy,
                        timestamp = java.time.Instant.now().toString()
                    )
                }
            } catch (_: Exception) {}

            val device = com.sdb.mdm.model.Device(
                id = deviceId,
                name = deviceName,
                model = model,
                owner = null,
                imei = null,
                status = "online",
                location = location,
                tags = null,
                createdAt = "",
                updatedAt = lastActivity
            )
            apiService.updateDevice(deviceId, device)
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao enviar telemetria", e)
        }
    }

    private fun getBatteryLevel(): Int {
        return try {
            val bm = getSystemService(android.content.Context.BATTERY_SERVICE) as android.os.BatteryManager
            bm.getIntProperty(android.os.BatteryManager.BATTERY_PROPERTY_CAPACITY)
        } catch (_: Exception) { -1 }
    }
    
    private suspend fun checkAndApplyPolicies() {
        if (!SDBApplication.instance.isDeviceSetup()) {
            return
        }
        
        try {
            val deviceId = SDBApplication.instance.getStoredDeviceId() ?: return
            val apiService = SDBApplication.instance.apiClient.getApiService()
            
            // Buscar política atual do dispositivo
            val response = apiService.getDevicePolicy(deviceId)
            
            if (response.isSuccessful && response.body()?.success == true) {
                val policy = response.body()?.data
                if (policy != null) {
                    Log.d(TAG, "Aplicando política: ${policy.name}")
                    
                    val deviceAdminManager = DeviceAdminManager(this@PolicyService)
                    deviceAdminManager.applyPolicy(policy)
                }
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao buscar e aplicar políticas", e)
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "PolicyService destruído")
        policyCheckJob?.cancel()
        serviceScope.cancel()
    }
}