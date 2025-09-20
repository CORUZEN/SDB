package com.sdb.mdm.service

import android.app.Service
import android.content.BatteryManager
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.annotation.RequiresApi
import com.sdb.mdm.SDBApplication
import com.sdb.mdm.model.HeartbeatRequest
import com.sdb.mdm.model.NetworkInfo
import com.sdb.mdm.utils.LocationHelper
import kotlinx.coroutines.*
import java.text.SimpleDateFormat
import java.util.*

/**
 * HeartbeatService - FRIAXIS v4.0.0
 * Serviço responsável por enviar heartbeats periódicos para o servidor
 * mantendo o dispositivo com status "online" no sistema web
 */
class HeartbeatService : Service() {
    
    companion object {
        private const val TAG = "HeartbeatService"
        private const val HEARTBEAT_INTERVAL = 2 * 60 * 1000L // 2 minutos
        private const val HEARTBEAT_INITIAL_DELAY = 30 * 1000L // 30 segundos inicial
        
        fun start(context: Context) {
            val intent = Intent(context, HeartbeatService::class.java)
            context.startService(intent)
        }
        
        fun stop(context: Context) {
            val intent = Intent(context, HeartbeatService::class.java)
            context.stopService(intent)
        }
    }
    
    private var heartbeatJob: Job? = null
    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private lateinit var locationHelper: LocationHelper
    
    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "HeartbeatService criado")
        locationHelper = LocationHelper(this)
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "HeartbeatService iniciado")
        
        // Verificar se o dispositivo está configurado
        if (!SDBApplication.instance.isDeviceSetup()) {
            Log.w(TAG, "Dispositivo não configurado, parando serviço")
            stopSelf()
            return START_NOT_STICKY
        }
        
        startHeartbeatTimer()
        
        return START_STICKY // Reiniciar se o sistema matar o serviço
    }
    
    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "HeartbeatService destruído")
        heartbeatJob?.cancel()
        serviceScope.cancel()
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
    
    private fun startHeartbeatTimer() {
        // Cancelar job anterior se existir
        heartbeatJob?.cancel()
        
        heartbeatJob = serviceScope.launch {
            // Delay inicial para não sobrecarregar no boot
            delay(HEARTBEAT_INITIAL_DELAY)
            
            while (isActive) {
                try {
                    sendHeartbeat()
                } catch (e: Exception) {
                    Log.e(TAG, "Erro ao enviar heartbeat", e)
                }
                
                // Aguardar próximo heartbeat
                delay(HEARTBEAT_INTERVAL)
            }
        }
    }
    
    private suspend fun sendHeartbeat() {
        try {
            Log.d(TAG, "💓 Enviando heartbeat...")
            
            val deviceId = SDBApplication.instance.getDeviceId()
            if (deviceId.isEmpty()) {
                Log.w(TAG, "Device ID não encontrado")
                return
            }
            
            // Coletar dados do dispositivo
            val heartbeatData = collectDeviceData()
            
            // Enviar para o servidor
            val apiService = SDBApplication.instance.apiClient.getApiService()
            val response = apiService.sendHeartbeat(deviceId, heartbeatData)
            
            if (response.isSuccessful) {
                val body = response.body()
                if (body?.success == true) {
                    Log.d(TAG, "✅ Heartbeat enviado com sucesso")
                    Log.d(TAG, "   Status: ${body.device?.status}")
                    Log.d(TAG, "   Bateria: ${heartbeatData.batteryLevel}%")
                } else {
                    Log.w(TAG, "⚠️ Heartbeat falhou: ${body?.error}")
                }
            } else {
                Log.w(TAG, "❌ Erro HTTP ${response.code()}: ${response.message()}")
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "❌ Erro ao enviar heartbeat", e)
        }
    }
    
    private suspend fun collectDeviceData(): HeartbeatRequest {
        return HeartbeatRequest(
            batteryLevel = getBatteryLevel(),
            batteryStatus = getBatteryStatus(),
            locationLat = getLocationLatitude(),
            locationLng = getLocationLongitude(),
            locationAccuracy = getLocationAccuracy(),
            networkInfo = getNetworkInfo(),
            appVersion = getAppVersion(),
            osVersion = Build.VERSION.RELEASE
        )
    }
    
    private fun getBatteryLevel(): Int? {
        return try {
            val batteryManager = getSystemService(Context.BATTERY_SERVICE) as BatteryManager
            batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
        } catch (e: Exception) {
            Log.w(TAG, "Erro ao obter nível da bateria", e)
            null
        }
    }
    
    private fun getBatteryStatus(): String {
        return try {
            val batteryFilter = IntentFilter(Intent.ACTION_BATTERY_CHANGED)
            val batteryStatus = registerReceiver(null, batteryFilter)
            
            val status = batteryStatus?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
            when (status) {
                BatteryManager.BATTERY_STATUS_CHARGING -> "charging"
                BatteryManager.BATTERY_STATUS_DISCHARGING -> "discharging"
                BatteryManager.BATTERY_STATUS_FULL -> "full"
                BatteryManager.BATTERY_STATUS_NOT_CHARGING -> "not_charging"
                else -> "unknown"
            }
        } catch (e: Exception) {
            Log.w(TAG, "Erro ao obter status da bateria", e)
            "unknown"
        }
    }
    
    private suspend fun getLocationLatitude(): Double? {
        return try {
            locationHelper.getCurrentLocation()?.latitude
        } catch (e: Exception) {
            Log.w(TAG, "Erro ao obter latitude", e)
            null
        }
    }
    
    private suspend fun getLocationLongitude(): Double? {
        return try {
            locationHelper.getCurrentLocation()?.longitude
        } catch (e: Exception) {
            Log.w(TAG, "Erro ao obter longitude", e)
            null
        }
    }
    
    private suspend fun getLocationAccuracy(): Float? {
        return try {
            locationHelper.getCurrentLocation()?.accuracy
        } catch (e: Exception) {
            Log.w(TAG, "Erro ao obter precisão da localização", e)
            null
        }
    }
    
    private fun getNetworkInfo(): NetworkInfo {
        return try {
            val connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                getNetworkInfoAPI23(connectivityManager)
            } else {
                getNetworkInfoLegacy(connectivityManager)
            }
        } catch (e: Exception) {
            Log.w(TAG, "Erro ao obter informações de rede", e)
            NetworkInfo("unknown", null)
        }
    }
    
    @RequiresApi(Build.VERSION_CODES.M)
    private fun getNetworkInfoAPI23(connectivityManager: ConnectivityManager): NetworkInfo {
        val activeNetwork = connectivityManager.activeNetwork
        val networkCapabilities = connectivityManager.getNetworkCapabilities(activeNetwork)
        
        return when {
            networkCapabilities?.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) == true -> {
                NetworkInfo("wifi", null)
            }
            networkCapabilities?.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) == true -> {
                NetworkInfo("cellular", null)
            }
            networkCapabilities?.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) == true -> {
                NetworkInfo("ethernet", null)
            }
            else -> NetworkInfo("unknown", null)
        }
    }
    
    @Suppress("DEPRECATION")
    private fun getNetworkInfoLegacy(connectivityManager: ConnectivityManager): NetworkInfo {
        val activeNetworkInfo = connectivityManager.activeNetworkInfo
        
        return when (activeNetworkInfo?.type) {
            ConnectivityManager.TYPE_WIFI -> NetworkInfo("wifi", null)
            ConnectivityManager.TYPE_MOBILE -> NetworkInfo("cellular", null)
            ConnectivityManager.TYPE_ETHERNET -> NetworkInfo("ethernet", null)
            else -> NetworkInfo("unknown", null)
        }
    }
    
    private fun getAppVersion(): String {
        return try {
            val packageInfo = packageManager.getPackageInfo(packageName, 0)
            packageInfo.versionName ?: "unknown"
        } catch (e: Exception) {
            Log.w(TAG, "Erro ao obter versão do app", e)
            "unknown"
        }
    }
}