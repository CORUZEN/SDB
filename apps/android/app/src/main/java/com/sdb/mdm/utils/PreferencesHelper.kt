package com.sdb.mdm.utils

import android.content.Context
import android.content.SharedPreferences

/**
 * Shared Preferences Helper - FRIAXIS v4.0.0
 * Centralized preferences management
 */
class PreferencesHelper(context: Context) {
    
    companion object {
        private const val PREFS_NAME = "friaxis_prefs"
        
        // Keys
        private const val KEY_API_BASE_URL = "api_base_url"
        private const val KEY_DEVICE_ID = "device_id"
        private const val KEY_DEVICE_NAME = "device_name"
        private const val KEY_DEVICE_SETUP = "device_setup"
        private const val KEY_PAIRING_CODE = "pairing_code"
        private const val KEY_ORGANIZATION_ID = "organization_id"
        private const val KEY_EMERGENCY_MODE = "emergency_mode"
        
        // Default values
        private const val DEFAULT_API_URL = "https://friaxis.coruzen.com/"
    }
    
    private val sharedPreferences: SharedPreferences = 
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    
    fun getApiBaseUrl(): String {
        return sharedPreferences.getString(KEY_API_BASE_URL, DEFAULT_API_URL) ?: DEFAULT_API_URL
    }
    
    fun setApiBaseUrl(url: String) {
        sharedPreferences.edit().putString(KEY_API_BASE_URL, url).apply()
    }
    
    fun getStoredDeviceId(): String? {
        return sharedPreferences.getString(KEY_DEVICE_ID, null)
    }
    
    fun setStoredDeviceId(deviceId: String) {
        sharedPreferences.edit().putString(KEY_DEVICE_ID, deviceId).apply()
    }
    
    fun isDeviceSetup(): Boolean {
        return sharedPreferences.getBoolean(KEY_DEVICE_SETUP, false)
    }
    
    fun setDeviceSetup(setup: Boolean) {
        sharedPreferences.edit().putBoolean(KEY_DEVICE_SETUP, setup).apply()
    }
    
    fun getDeviceName(): String? {
        return sharedPreferences.getString(KEY_DEVICE_NAME, null)
    }
    
    fun setDeviceName(name: String) {
        sharedPreferences.edit().putString(KEY_DEVICE_NAME, name).apply()
    }
    
    fun getPairingCode(): String? {
        return sharedPreferences.getString(KEY_PAIRING_CODE, null)
    }
    
    fun setPairingCode(code: String) {
        sharedPreferences.edit().putString(KEY_PAIRING_CODE, code).apply()
    }
    
    fun getOrganizationId(): String? {
        return sharedPreferences.getString(KEY_ORGANIZATION_ID, null)
    }
    
    fun setOrganizationId(orgId: String) {
        sharedPreferences.edit().putString(KEY_ORGANIZATION_ID, orgId).apply()
    }
    
    fun isEmergencyMode(): Boolean {
        return sharedPreferences.getBoolean(KEY_EMERGENCY_MODE, false)
    }
    
    fun setEmergencyMode(enabled: Boolean) {
        sharedPreferences.edit().putBoolean(KEY_EMERGENCY_MODE, enabled).apply()
    }
    
    fun resetApp() {
        sharedPreferences.edit().clear().apply()
    }
    
    fun getSharedPreferences(): SharedPreferences {
        return sharedPreferences
    }
}