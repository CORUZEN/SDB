package com.sdb.mdm.utils

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager

/**
 * Utility para obter informações de bateria do dispositivo
 */
object BatteryUtil {
    
    data class BatteryInfo(
        val level: Int,
        val status: String,
        val temperature: Float,
        val voltage: Int,
        val isCharging: Boolean,
        val chargingType: String,
        val health: String
    )
    
    fun getBatteryInfo(context: Context): BatteryInfo {
        val batteryIntent = context.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
        
        val level = batteryIntent?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: 0
        val scale = batteryIntent?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: 100
        val batteryPct = if (level >= 0 && scale > 0) {
            (level * 100 / scale)
        } else 0
        
        val status = batteryIntent?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
        val statusText = when (status) {
            BatteryManager.BATTERY_STATUS_CHARGING -> "Carregando"
            BatteryManager.BATTERY_STATUS_DISCHARGING -> "Descarregando"
            BatteryManager.BATTERY_STATUS_FULL -> "Cheia"
            BatteryManager.BATTERY_STATUS_NOT_CHARGING -> "Não carregando"
            BatteryManager.BATTERY_STATUS_UNKNOWN -> "Desconhecido"
            else -> "N/A"
        }
        
        val chargePlug = batteryIntent?.getIntExtra(BatteryManager.EXTRA_PLUGGED, -1) ?: -1
        val isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING || 
                         status == BatteryManager.BATTERY_STATUS_FULL
        
        val chargingType = when (chargePlug) {
            BatteryManager.BATTERY_PLUGGED_USB -> "USB"
            BatteryManager.BATTERY_PLUGGED_AC -> "AC"
            BatteryManager.BATTERY_PLUGGED_WIRELESS -> "Wireless"
            else -> if (isCharging) "Desconhecido" else "Não carregando"
        }
        
        val temperature = batteryIntent?.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, 0)?.div(10f) ?: 0f
        val voltage = batteryIntent?.getIntExtra(BatteryManager.EXTRA_VOLTAGE, 0) ?: 0
        
        val health = batteryIntent?.getIntExtra(BatteryManager.EXTRA_HEALTH, -1) ?: -1
        val healthText = when (health) {
            BatteryManager.BATTERY_HEALTH_GOOD -> "Boa"
            BatteryManager.BATTERY_HEALTH_OVERHEAT -> "Superaquecimento"
            BatteryManager.BATTERY_HEALTH_DEAD -> "Morta"
            BatteryManager.BATTERY_HEALTH_OVER_VOLTAGE -> "Sobretensão"
            BatteryManager.BATTERY_HEALTH_UNSPECIFIED_FAILURE -> "Falha"
            BatteryManager.BATTERY_HEALTH_COLD -> "Fria"
            else -> "N/A"
        }
        
        return BatteryInfo(
            level = batteryPct,
            status = statusText,
            temperature = temperature,
            voltage = voltage,
            isCharging = isCharging,
            chargingType = chargingType,
            health = healthText
        )
    }
    
    fun getBatteryLevel(context: Context): Int {
        return getBatteryInfo(context).level
    }
    
    fun isBatteryCharging(context: Context): Boolean {
        return getBatteryInfo(context).isCharging
    }
}