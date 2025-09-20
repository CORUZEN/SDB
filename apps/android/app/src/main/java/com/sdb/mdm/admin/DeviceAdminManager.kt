package com.sdb.mdm.admin

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.util.Log
import com.sdb.mdm.model.Policy

class DeviceAdminManager(private val context: Context) {
    
    companion object {
        private const val TAG = "DeviceAdminManager"
    }
    
    private val devicePolicyManager: DevicePolicyManager by lazy {
        context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
    }
    
    private val adminComponent: ComponentName by lazy {
        ComponentName(context, SDBDeviceAdminReceiver::class.java)
    }
    
    fun isAdminActive(): Boolean {
        return devicePolicyManager.isAdminActive(adminComponent)
    }
    
    fun applyPolicy(policy: Policy) {
        if (!isAdminActive()) {
            Log.w(TAG, "Device admin não está ativo. Não é possível aplicar políticas.")
            return
        }
        
        Log.d(TAG, "Aplicando política: ${policy.name}")
        
        try {
            // Aplicar configurações de PIN
            if (policy.policyJson.require_pin) {
                setPinPolicy(policy.policyJson.pin_length ?: 4, policy.policyJson.max_failed_attempts ?: 3)
            }
            
            // Aplicar criptografia obrigatória
            if (policy.policyJson.force_encrypt) {
                setEncryptionPolicy()
            }
            
            // Desabilitar câmera se necessário
            if (policy.policyJson.disable_camera) {
                setCameraDisabled(true)
            } else {
                setCameraDisabled(false)
            }
            
            // TODO: Implementar outras políticas como:
            // - Modo kiosque
            // - Apps permitidos/bloqueados
            // - Configurações de hardware (Bluetooth, WiFi)
            // - Timeout de tela
            
            Log.d(TAG, "Política aplicada com sucesso")
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao aplicar política", e)
        }
    }
    
    private fun setPinPolicy(pinLength: Int, maxFailedAttempts: Int) {
        try {
            // Usar APIs modernas para Android 9+ ou fallback para versões antigas
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P) {
                // Android 9+ - Usar políticas modernas
                devicePolicyManager.setMaximumFailedPasswordsForWipe(adminComponent, maxFailedAttempts)
                Log.d(TAG, "Política de PIN moderna configurada: máx $maxFailedAttempts tentativas")
            } else {
                // Android 8.1 e anteriores - Usar APIs legadas com supressão de warning
                @Suppress("DEPRECATION")
                devicePolicyManager.setPasswordQuality(
                    adminComponent,
                    DevicePolicyManager.PASSWORD_QUALITY_NUMERIC
                )
                
                @Suppress("DEPRECATION")
                devicePolicyManager.setPasswordMinimumLength(adminComponent, pinLength)
                
                devicePolicyManager.setMaximumFailedPasswordsForWipe(adminComponent, maxFailedAttempts)
                
                Log.d(TAG, "Política de PIN legada configurada: $pinLength dígitos, máx $maxFailedAttempts tentativas")
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao configurar política de PIN", e)
        }
    }
    
    private fun setEncryptionPolicy() {
        try {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P) {
                // Android 9+ - Criptografia é obrigatória por padrão
                Log.d(TAG, "Criptografia já é obrigatória no Android 9+")
            } else {
                // Android 8.1 e anteriores - Usar API legada
                @Suppress("DEPRECATION")
                val result = devicePolicyManager.setStorageEncryption(adminComponent, true)
                Log.d(TAG, "Criptografia legada configurada: $result")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao configurar criptografia", e)
        }
    }
    
    private fun setCameraDisabled(disabled: Boolean) {
        try {
            devicePolicyManager.setCameraDisabled(adminComponent, disabled)
            Log.d(TAG, "Câmera ${if (disabled) "desabilitada" else "habilitada"}")
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao configurar câmera", e)
        }
    }
    
    fun lockDevice() {
        if (isAdminActive()) {
            devicePolicyManager.lockNow()
            Log.d(TAG, "Dispositivo bloqueado")
        }
    }
    
    fun wipeDevice() {
        if (isAdminActive()) {
            Log.w(TAG, "ATENÇÃO: Executando wipe do dispositivo!")
            devicePolicyManager.wipeData(0)
        }
    }
    
    fun resetPassword(newPassword: String) {
        if (isAdminActive()) {
            try {
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                    // Android 8+ - resetPassword foi removido por segurança
                    Log.w(TAG, "Reset de senha não é mais suportado no Android 8+")
                } else {
                    // Android 7.1 e anteriores - Usar API legada
                    @Suppress("DEPRECATION")
                    val result = devicePolicyManager.resetPassword(newPassword, 0)
                    Log.d(TAG, "Reset de senha legado: $result")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Erro ao resetar senha", e)
            }
        }
    }
}