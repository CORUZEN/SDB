package com.sdb.mdm.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.sdb.mdm.SDBApplication
import com.sdb.mdm.service.PolicyService

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
            // Iniciar serviço de políticas
            val policyIntent = Intent(context, PolicyService::class.java)
            context.startService(policyIntent)
            
            Log.d(TAG, "Serviços iniciados após boot")
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao iniciar serviços após boot", e)
        }
    }
}