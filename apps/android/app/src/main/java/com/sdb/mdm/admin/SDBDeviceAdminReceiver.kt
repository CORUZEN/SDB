package com.sdb.mdm.admin

import android.app.admin.DeviceAdminReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import android.widget.Toast

class SDBDeviceAdminReceiver : DeviceAdminReceiver() {
    
    companion object {
        private const val TAG = "SDBDeviceAdmin"
    }

    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        Log.d(TAG, "Device admin enabled")
        Toast.makeText(context, "SDB Device Admin ativado", Toast.LENGTH_SHORT).show()
        
        // Notificar o servidor que o device admin foi ativado
        // TODO: Implementar notificação para o servidor
    }

    override fun onDisabled(context: Context, intent: Intent) {
        super.onDisabled(context, intent)
        Log.d(TAG, "Device admin disabled")
        Toast.makeText(context, "SDB Device Admin desativado", Toast.LENGTH_SHORT).show()
        
        // Notificar o servidor que o device admin foi desativado
        // TODO: Implementar notificação para o servidor
    }

    override fun onPasswordChanged(context: Context, intent: Intent, user: android.os.UserHandle) {
        super.onPasswordChanged(context, intent, user)
        Log.d(TAG, "Password changed")
        
        // Notificar mudança de senha se necessário
        // TODO: Verificar políticas de senha
    }

    override fun onPasswordFailed(context: Context, intent: Intent, user: android.os.UserHandle) {
        super.onPasswordFailed(context, intent, user)
        Log.d(TAG, "Password failed")
        
        // Incrementar contador de tentativas falhadas
        // TODO: Implementar lógica de tentativas falhadas
    }

    override fun onPasswordSucceeded(context: Context, intent: Intent, user: android.os.UserHandle) {
        super.onPasswordSucceeded(context, intent, user)
        Log.d(TAG, "Password succeeded")
        
        // Reset contador de tentativas falhadas
        // TODO: Resetar contador
    }
}