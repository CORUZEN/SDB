package com.sdb.mdm

import android.app.Application
import android.content.Intent
import android.content.SharedPreferences
import androidx.preference.PreferenceManager
import com.sdb.mdm.api.ApiClient
import com.sdb.mdm.service.PolicyService

class SDBApplication : Application() {
    
    companion object {
        lateinit var instance: SDBApplication
            private set
    }
    
    lateinit var sharedPreferences: SharedPreferences
    lateinit var apiClient: ApiClient
    
    override fun onCreate() {
        super.onCreate()
        instance = this
        
        // Inicializar SharedPreferences
        sharedPreferences = PreferenceManager.getDefaultSharedPreferences(this)
        
        // Inicializar API Client
        apiClient = ApiClient()
        
        // Iniciar serviço de políticas se o device estiver configurado
        if (isDeviceSetup()) {
            startService(Intent(this, PolicyService::class.java))
        }
    }
    
    fun isDeviceSetup(): Boolean {
        return sharedPreferences.getBoolean("device_approved", false) && 
               sharedPreferences.getString("device_id", null) != null
    }
    
    fun getStoredDeviceId(): String? {
        return sharedPreferences.getString("device_id", null)
    }
    
    fun getApiBaseUrl(): String {
        // Sempre retorna a URL oficial de produção
        return "https://sdb.coruzen.com/"
    }
    
    fun setEmergencyMode(enabled: Boolean) {
        sharedPreferences.edit().putBoolean("emergency_mode", enabled).apply()
    }
    
    fun isEmergencyMode(): Boolean {
        return sharedPreferences.getBoolean("emergency_mode", false)
    }
    
    fun resetApp() {
        // Limpar todas as configurações
        sharedPreferences.edit().clear().apply()
        
        // Parar todos os serviços
        stopService(Intent(this, PolicyService::class.java))
        
        // Reiniciar a aplicação
        val intent = packageManager.getLaunchIntentForPackage(packageName)
        intent?.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NEW_TASK)
        startActivity(intent)
        
        // Finalizar processo
        android.os.Process.killProcess(android.os.Process.myPid())
    }
}