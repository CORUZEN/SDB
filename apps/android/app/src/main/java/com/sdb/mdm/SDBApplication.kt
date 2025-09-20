package com.sdb.mdm

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.hilt.work.HiltWorkerFactory
import androidx.work.Configuration
import com.sdb.mdm.api.ApiClient
import com.sdb.mdm.utils.PreferencesHelper
import dagger.hilt.android.HiltAndroidApp
import javax.inject.Inject

/**
 * FRIAXIS v4.0.0 - Main Application Class
 * 
 * Professional MDM Application with:
 * - Dependency Injection (Hilt)
 * - Modern Architecture (MVVM + Clean)
 * - Multi-tenant Support
 * - Real-time Communication
 */
@HiltAndroidApp
class SDBApplication : Application(), Configuration.Provider {

    @Inject
    lateinit var workerFactory: HiltWorkerFactory

    // Lazy initialization
    private val preferencesHelper: PreferencesHelper by lazy { PreferencesHelper(this) }
    val apiClient: ApiClient by lazy { ApiClient() }

    companion object {
        // Notification Channels
        const val CHANNEL_GENERAL = "friaxis_general"
        const val CHANNEL_POLICIES = "friaxis_policies"
        const val CHANNEL_ALERTS = "friaxis_alerts"
        const val CHANNEL_SYNC = "friaxis_sync"
        
        // App Constants
        const val APP_VERSION = "4.0.0"
        const val APP_NAME = "FRIAXIS MDM"
        
        lateinit var instance: SDBApplication
            private set
    }

    override fun onCreate() {
        super.onCreate()
        instance = this
        
        // Initialize notification channels
        createNotificationChannels()
        
        // Initialize app components
        initializeApp()
    }

    // ==========================================
    // Public API Methods (used by other components)
    // ==========================================
    
    fun getApiBaseUrl(): String = preferencesHelper.getApiBaseUrl()
    fun setApiBaseUrl(url: String) = preferencesHelper.setApiBaseUrl(url)
    
    fun getStoredDeviceId(): String? = preferencesHelper.getStoredDeviceId()
    fun setStoredDeviceId(deviceId: String) = preferencesHelper.setStoredDeviceId(deviceId)
    
    fun isDeviceSetup(): Boolean = preferencesHelper.isDeviceSetup()
    fun setDeviceSetup(setup: Boolean) = preferencesHelper.setDeviceSetup(setup)
    
    fun getDeviceName(): String? = preferencesHelper.getDeviceName()
    fun setDeviceName(name: String) = preferencesHelper.setDeviceName(name)
    
    fun isEmergencyMode(): Boolean = preferencesHelper.isEmergencyMode()
    fun setEmergencyMode(enabled: Boolean) = preferencesHelper.setEmergencyMode(enabled)
    
    fun resetApp() = preferencesHelper.resetApp()
    
    val sharedPreferences get() = preferencesHelper.getSharedPreferences()

    /**
     * Create notification channels for different types of notifications
     */
    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            
            // General notifications
            val generalChannel = NotificationChannel(
                CHANNEL_GENERAL,
                "General Notifications",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "General app notifications"
            }
            
            // Policy notifications
            val policyChannel = NotificationChannel(
                CHANNEL_POLICIES,
                "Policy Updates",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Security policy and compliance notifications"
            }
            
            // Alert notifications
            val alertChannel = NotificationChannel(
                CHANNEL_ALERTS,
                "Security Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Critical security alerts and warnings"
            }
            
            // Sync notifications
            val syncChannel = NotificationChannel(
                CHANNEL_SYNC,
                "Synchronization",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Device synchronization status"
            }
            
            notificationManager.createNotificationChannels(listOf(
                generalChannel, policyChannel, alertChannel, syncChannel
            ))
        }
    }

    /**
     * Initialize app components
     */
    private fun initializeApp() {
        // Any additional initialization can be done here
        // Database migrations, initial setup, etc.
    }

    /**
     * Work Manager configuration with Hilt
     */
    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder()
            .setWorkerFactory(workerFactory)
            .setMinimumLoggingLevel(if (BuildConfig.DEBUG) android.util.Log.DEBUG else android.util.Log.INFO)
            .build()
}