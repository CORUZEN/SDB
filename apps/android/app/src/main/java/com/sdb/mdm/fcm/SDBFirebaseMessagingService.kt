package com.sdb.mdm.fcm

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.sdb.mdm.R
import com.sdb.mdm.SDBApplication
import com.sdb.mdm.service.CommandExecutorService
import com.sdb.mdm.ui.launcher.LauncherActivity

class SDBFirebaseMessagingService : FirebaseMessagingService() {
    
    companion object {
        private const val TAG = "SDBFirebaseMessaging"
        private const val CHANNEL_ID = "sdb_commands"
        private const val NOTIFICATION_ID = 1001
    }
    
    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }
    
    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "Novo Firebase token: $token")
        
        // Salvar token localmente
        SDBApplication.instance.sharedPreferences
            .edit()
            .putString("firebase_token", token)
            .apply()
        
        // Enviar token para o servidor se o dispositivo estiver registrado
        if (SDBApplication.instance.isDeviceSetup()) {
            // TODO: Implementar atualização do token no servidor
        }
    }
    
    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        
        Log.d(TAG, "Mensagem recebida de: ${remoteMessage.from}")
        
        // Verificar se há dados na mensagem
        if (remoteMessage.data.isNotEmpty()) {
            Log.d(TAG, "Dados da mensagem: ${remoteMessage.data}")
            handleDataMessage(remoteMessage.data)
        }
        
        // Verificar se há notificação
        remoteMessage.notification?.let { notification ->
            Log.d(TAG, "Título da notificação: ${notification.title}")
            Log.d(TAG, "Corpo da notificação: ${notification.body}")
            showNotification(notification.title, notification.body)
        }
    }
    
    private fun handleDataMessage(data: Map<String, String>) {
        val messageType = data["type"]
        
        when (messageType) {
            "command" -> {
                val commandId = data["command_id"]
                val commandType = data["command_type"]
                
                if (commandId != null && commandType != null) {
                    Log.d(TAG, "Comando recebido: $commandType (ID: $commandId)")
                    executeCommand(commandId, commandType, data)
                }
            }
            
            "policy_update" -> {
                Log.d(TAG, "Atualização de política recebida")
                // TODO: Buscar nova política e aplicar
            }
            
            "config_update" -> {
                Log.d(TAG, "Atualização de configuração recebida")
                // TODO: Buscar novas configurações
            }
            
            else -> {
                Log.w(TAG, "Tipo de mensagem desconhecido: $messageType")
            }
        }
    }
    
    private fun executeCommand(commandId: String, commandType: String, data: Map<String, String>) {
        val intent = Intent(this, CommandExecutorService::class.java).apply {
            putExtra("command_id", commandId)
            putExtra("command_type", commandType)
            putExtra("command_data", data.toString())
        }
        
        startService(intent)
    }
    
    private fun showNotification(title: String?, body: String?) {
        val intent = Intent(this, LauncherActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent, 
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        
        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title ?: "SDB Notification")
            .setContentText(body ?: "Nova mensagem do sistema")
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
        
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(NOTIFICATION_ID, builder.build())
    }
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "SDB Commands"
            val descriptionText = "Notificações de comandos do sistema SDB"
            val importance = NotificationManager.IMPORTANCE_DEFAULT
            val channel = NotificationChannel(CHANNEL_ID, name, importance).apply {
                description = descriptionText
            }
            
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }
}