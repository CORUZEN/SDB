package com.sdb.mdm.ui.setup

import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.util.Log
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.sdb.mdm.R
import com.sdb.mdm.SDBApplication
import com.sdb.mdm.model.DeviceRegistrationRequest
import com.sdb.mdm.ui.launcher.LauncherActivity
import kotlinx.coroutines.launch

class SetupActivity : AppCompatActivity() {
    // URL do backend fixa para produção
    private val backendUrl = "https://sdb.coruzen.com/"

    private lateinit var deviceNameEditText: EditText
    private lateinit var registerButton: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_setup)

        initializeViews()
        setupClickListeners()
    }

    private fun initializeViews() {
        deviceNameEditText = findViewById(R.id.device_name_edit_text)
        registerButton = findViewById(R.id.register_button)
        deviceNameEditText.setText("Dispositivo Android ${android.os.Build.MODEL}")
    }
    
    private fun setupClickListeners() {
        registerButton.setOnClickListener {
            registerDevice()
        }
    }
    
    private fun registerDevice() {
        val deviceName = deviceNameEditText.text.toString().trim()
        if (deviceName.isEmpty()) {
            Toast.makeText(this, "Preencha o nome do dispositivo", Toast.LENGTH_SHORT).show()
            return
        }
        
        lifecycleScope.launch {
            try {
                registerButton.isEnabled = false
                registerButton.text = "Registrando..."
                
                // Salvar URL base fixa para produção
                SDBApplication.instance.sharedPreferences.edit()
                    .putString("api_base_url", backendUrl)
                    .apply()
                
                // Gerar device ID único
                val deviceId = Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID)
                
                // Salvar device ID para uso posterior
                SDBApplication.instance.setStoredDeviceId(deviceId)
                
                // Criar request de registro
                val registrationRequest = DeviceRegistrationRequest(
                    name = deviceName,
                    model = android.os.Build.MODEL,
                    imei = null, // IMEI não é mais obrigatório no Android 10+
                    androidVersion = android.os.Build.VERSION.RELEASE,
                    firebaseToken = "" // Será preenchido depois pelo FCM
                )
                
                // Tentar registrar no servidor
                val apiService = SDBApplication.instance.apiClient.getApiService()
                val response = apiService.registerDevice(registrationRequest)
                
                if (response.isSuccessful && response.body()?.success == true) {
                    val registrationData = response.body()?.data
                    
                    if (registrationData != null) {
                        // Salvar configurações básicas
                        SDBApplication.instance.sharedPreferences.edit()
                            .putString("api_base_url", backendUrl)
                            .putString("device_name", deviceName)
                            .putBoolean("device_registered", false) // Ainda não aprovado
                            .apply()
                        
                        // Ir para tela de emparelhamento
                        val intent = Intent(this@SetupActivity, PairingActivity::class.java)
                        intent.putExtra(PairingActivity.EXTRA_PAIRING_CODE, registrationData.pairingCode)
                        intent.putExtra(PairingActivity.EXTRA_DEVICE_ID, registrationData.deviceId)
                        startActivity(intent)
                        finish()
                    } else {
                        Toast.makeText(this@SetupActivity, "Erro: dados de registro inválidos", Toast.LENGTH_LONG).show()
                    }
                } else {
                    val errorMsg = response.body()?.error ?: "Erro desconhecido"
                    Toast.makeText(this@SetupActivity, "Falha no registro: $errorMsg", Toast.LENGTH_LONG).show()
                    Log.e("SetupActivity", "Falha no registro: ${response.code()} - $errorMsg")
                }
                
            } catch (e: Exception) {
                Toast.makeText(this@SetupActivity, "Erro de conexão: ${e.message}", Toast.LENGTH_LONG).show()
                Log.e("SetupActivity", "Erro ao registrar dispositivo", e)
                
                // Em produção, não permite registro offline. Apenas exibe erro.
                // Se falhar, o usuário deve tentar novamente com conexão ativa.
                
            } finally {
                registerButton.isEnabled = true
                registerButton.text = "Registrar Dispositivo"
            }
        }
    }
}