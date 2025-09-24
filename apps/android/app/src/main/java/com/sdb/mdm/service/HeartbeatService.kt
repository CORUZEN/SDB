package com.sdb.mdm.service

import android.app.*
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.BatteryManager
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.annotation.RequiresApi
import androidx.core.app.NotificationCompat
import com.sdb.mdm.MainActivity
import com.sdb.mdm.R
import com.sdb.mdm.SDBApplication
import com.sdb.mdm.api.ApiService
import com.sdb.mdm.model.*
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
        private const val HEARTBEAT_INTERVAL = 60 * 1000L // 1 minuto para melhor monitoramento
        private const val HEARTBEAT_INITIAL_DELAY = 10 * 1000L // 10 segundos inicial
        
        // Notification constants
        private const val NOTIFICATION_ID = 1001
        private const val CHANNEL_ID = "heartbeat_service"
        private const val CHANNEL_NAME = "FRIAXIS Heartbeat Service"
        
        fun start(context: Context) {
            val intent = Intent(context, HeartbeatService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
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
        
        // Criar notification channel
        createNotificationChannel()
        
        // Iniciar como foreground service
        startForeground(NOTIFICATION_ID, createNotification("Inicializando..."))
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "HeartbeatService iniciado")
        
        // Verificar se o dispositivo está configurado
        if (!SDBApplication.instance.isDeviceSetup()) {
            Log.w(TAG, "Dispositivo não configurado, parando serviço")
            stopSelf()
            return START_NOT_STICKY
        }
        
        // Atualizar notification
        updateNotification("Conectado ao sistema FRIAXIS")
        
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
            
            val deviceId = SDBApplication.instance.getStoredDeviceId()
            val isDeviceSetup = SDBApplication.instance.isDeviceSetup()
            
            Log.d(TAG, "Device ID: $deviceId")
            Log.d(TAG, "Device Setup: $isDeviceSetup")
            
            if (deviceId.isNullOrEmpty() || !isDeviceSetup) {
                Log.w(TAG, "Device não está pareado corretamente - ID: $deviceId, Setup: $isDeviceSetup")
                Log.w(TAG, "Parando HeartbeatService - device precisa ser pareado novamente")
                
                // Parar o serviço se não estiver pareado
                stopSelf()
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
                    val heartbeatResponse = body.data
                    Log.d(TAG, "✅ Heartbeat enviado com sucesso")
                    Log.d(TAG, "   Status: ${heartbeatResponse?.device?.status}")
                    Log.d(TAG, "   Bateria: ${heartbeatData.batteryLevel}%")
                    
                    // Atualizar notificação com sucesso
                    val currentTime = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date())
                    updateNotification("Online - Última sync: $currentTime | Bateria: ${heartbeatData.batteryLevel}%")
                    
                    // Processar comandos pendentes após heartbeat bem-sucedido
                    processPendingCommands(deviceId, apiService)
                } else {
                    Log.w(TAG, "⚠️ Heartbeat falhou: ${body?.error}")
                    updateNotification("Erro de sincronização - ${body?.error}")
                }
            } else {
                Log.w(TAG, "❌ Erro HTTP ${response.code()}: ${response.message()}")
                updateNotification("Erro de conexão - HTTP ${response.code()}")
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
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Canal para o serviço de heartbeat do FRIAXIS"
                setShowBadge(false)
            }
            
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager?.createNotificationChannel(channel)
        }
    }
    
    private fun createNotification(status: String): Notification {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("FRIAXIS MDM")
            .setContentText(status)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setAutoCancel(false)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
            .build()
    }
    
    private fun updateNotification(status: String) {
        val notification = createNotification(status)
        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager?.notify(NOTIFICATION_ID, notification)
    }
    
    private suspend fun processPendingCommands(deviceId: String, apiService: ApiService) {
        try {
            Log.d(TAG, "🔄 PROCESSANDO COMANDOS PENDENTES - Device: $deviceId")
            
            // Buscar todos os comandos da API
            val commandsResponse = apiService.getAllCommands()
            
            if (commandsResponse.isSuccessful) {
                val commandsBody = commandsResponse.body()
                if (commandsBody?.success == true) {
                    val allCommands = commandsBody.data ?: emptyList()
                    
                    // Filtrar comandos pendentes para este device
                    val pendingCommands = allCommands.filter { command ->
                        command.deviceId == deviceId && 
                        command.status.equals("pendente", ignoreCase = true)
                    }
                    
                    Log.d(TAG, "📋 Encontrados ${pendingCommands.size} comandos pendentes")
                    
                    // Processar cada comando
                    for (command in pendingCommands) {
                        executeCommand(command, apiService)
                    }
                } else {
                    Log.w(TAG, "⚠️ Falha ao buscar comandos: ${commandsBody?.error}")
                }
            } else {
                Log.w(TAG, "❌ Erro HTTP ao buscar comandos: ${commandsResponse.code()}")
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "❌ Erro ao processar comandos pendentes", e)
        }
    }
    
    private suspend fun executeCommand(command: Command, apiService: ApiService) {
        try {
            Log.d(TAG, "⚡ Executando comando: ${command.commandType} (ID: ${command.id})")
            
            when (command.commandType.uppercase()) {
                "PING" -> {
                    Log.d(TAG, "🏓 Processando comando PING")
                    sendCommandResponse(command.id, apiService, "success", "Pong! Device está online")
                }
                
                "LOCATE_NOW" -> {
                    Log.d(TAG, "📍 Processando comando LOCATE_NOW")
                    val location = locationHelper.getCurrentLocation()
                    if (location != null) {
                        val locationData = mapOf(
                            "latitude" to location.latitude,
                            "longitude" to location.longitude,
                            "accuracy" to location.accuracy,
                            "timestamp" to System.currentTimeMillis()
                        )
                        sendCommandResponse(command.id, apiService, "success", "Localização obtida", locationData)
                    } else {
                        sendCommandResponse(command.id, apiService, "error", "Falha ao obter localização")
                    }
                }
                
                else -> {
                    Log.w(TAG, "⚠️ Comando não suportado: ${command.commandType}")
                    sendCommandResponse(command.id, apiService, "error", "Comando não suportado")
                }
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "❌ Erro ao executar comando ${command.id}", e)
            sendCommandResponse(command.id, apiService, "error", "Erro interno: ${e.message}")
        }
    }
    
    private suspend fun sendCommandResponse(
        commandId: String, 
        apiService: ApiService, 
        status: String, 
        message: String, 
        data: Map<String, Any>? = null
    ) {
        try {
            val responseData = mutableMapOf<String, Any>(
                "status" to status,
                "message" to message
            )
            
            data?.let { responseData.putAll(it) }
            
            val response = CommandResponseRequest(
                commandId = commandId,
                status = status,
                response = responseData,
                executedAt = System.currentTimeMillis().toString()
            )
            
            val apiResponse = apiService.sendCommandResponse(commandId, response)
            
            if (apiResponse.isSuccessful) {
                Log.d(TAG, "✅ Resposta do comando enviada: $commandId")
            } else {
                Log.w(TAG, "⚠️ Falha ao enviar resposta do comando: ${apiResponse.code()}")
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "❌ Erro ao enviar resposta do comando $commandId", e)
        }
    }
}