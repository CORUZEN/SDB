package com.sdb.mdm.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.sdb.mdm.SDBApplication
import com.sdb.mdm.service.PolicyService
import com.sdb.mdm.service.HeartbeatService

class BootReceiver : BroadcastReceiver() {
    
    companion object {
        private const val TAG = "BootReceiver"
    }
    
    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            Intent.ACTION_BOOT_COMPLETED,
            Intent.ACTION_MY_PACKAGE_REPLACED,
            Intent.ACTION_PACKAGE_REPLACED -> {
                Log.d(TAG, "Boot/Update recebido: ${intent.action}")
                
                if (SDBApplication.instance.isDeviceSetup()) {
                    // Iniciar serviços necessários
                    startServices(context)
                }
            }
        }
    }
    
    private fun startServices(context: Context) {
        try {
            Log.d(TAG, "Dispositivo configurado - iniciando serviços...")
            
            // Iniciar HeartbeatService como foreground service
            HeartbeatService.start(context)
            
            // Iniciar serviço de políticas se disponível
            try {
                val policyIntent = Intent(context, PolicyService::class.java)
                context.startService(policyIntent)
                Log.d(TAG, "PolicyService iniciado")
            } catch (e: Exception) {
                Log.w(TAG, "PolicyService não disponível", e)
            }
            
            Log.d(TAG, "✅ Serviços iniciados automaticamente após boot")
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao iniciar serviços após boot", e)
        }
    }
}