package com.sdb.mdm.utils

import android.content.Context
import android.util.Log
import com.sdb.mdm.SDBApplication
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class ConnectivityTester {
    
    companion object {
        private const val TAG = "ConnectivityTester"
        
        fun testFullConnectivity(context: Context, callback: (Boolean, String) -> Unit) {
            CoroutineScope(Dispatchers.IO).launch {
                val result = performConnectivityTests()
                
                withContext(Dispatchers.Main) {
                    callback(result.first, result.second)
                }
            }
        }
        
        private suspend fun performConnectivityTests(): Pair<Boolean, String> {
            val tests = mutableListOf<String>()
            var allTestsPassed = true
            
            try {
                // Teste 1: API Health Check
                tests.add("🔍 Testando API Health...")
                val apiService = SDBApplication.instance.apiClient.getApiService()
                val healthResponse = apiService.getHealth()
                
                if (healthResponse.isSuccessful) {
                    tests.add("✅ API Health: OK")
                } else {
                    tests.add("❌ API Health: Falhou (${healthResponse.code()})")
                    allTestsPassed = false
                }
                
                // Teste 2: Device Registration (se não estiver registrado)
                if (!SDBApplication.instance.isDeviceSetup()) {
                    tests.add("⚠️ Dispositivo não registrado")
                    allTestsPassed = false
                } else {
                    tests.add("✅ Dispositivo registrado")
                    
                    // Teste 3: Get Device Info
                    val deviceId = SDBApplication.instance.getStoredDeviceId()
                    if (deviceId != null) {
                        tests.add("🔍 Testando info do dispositivo...")
                        val deviceResponse = apiService.getDevice(deviceId)
                        
                        if (deviceResponse.isSuccessful) {
                            tests.add("✅ Device Info: OK")
                        } else {
                            tests.add("❌ Device Info: Falhou (${deviceResponse.code()})")
                            allTestsPassed = false
                        }
                    }
                }
                
                // Teste 4: Firebase (se configurado)
                tests.add("🔍 Verificando Firebase...")
                // TODO: Adicionar teste específico do Firebase quando implementado
                tests.add("⚠️ Firebase: Não testado ainda")
                
            } catch (e: Exception) {
                tests.add("❌ Erro geral: ${e.message}")
                allTestsPassed = false
                Log.e(TAG, "Erro nos testes de conectividade", e)
            }
            
            val resultMessage = tests.joinToString("\n")
            return Pair(allTestsPassed, resultMessage)
        }
    }
}