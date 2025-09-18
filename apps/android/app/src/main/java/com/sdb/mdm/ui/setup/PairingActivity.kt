package com.sdb.mdm.ui.setup

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.Button
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.sdb.mdm.R
import com.sdb.mdm.SDBApplication
import com.sdb.mdm.ui.launcher.LauncherActivity
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class PairingActivity : AppCompatActivity() {
    
    companion object {
        private const val TAG = "PairingActivity"
        const val EXTRA_PAIRING_CODE = "pairing_code"
        const val EXTRA_DEVICE_ID = "device_id"
        private const val CHECK_INTERVAL_MS = 5000L // 5 segundos
    }
    
    private lateinit var pairingCodeText: TextView
    private lateinit var progressBar: ProgressBar
    private lateinit var checkStatusButton: Button
    private lateinit var cancelButton: Button
    
    private var pairingCode: String = ""
    private var deviceId: String = ""
    private var isChecking = false
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_pairing)
        
        // Receber dados do Intent
        pairingCode = intent.getStringExtra(EXTRA_PAIRING_CODE) ?: ""
        deviceId = intent.getStringExtra(EXTRA_DEVICE_ID) ?: ""
        
        if (pairingCode.isEmpty() || deviceId.isEmpty()) {
            Toast.makeText(this, "Erro: dados de emparelhamento inválidos", Toast.LENGTH_LONG).show()
            finish()
            return
        }
        
        initializeViews()
        setupClickListeners()
        startAutomaticChecking()
    }
    
    private fun initializeViews() {
        pairingCodeText = findViewById(R.id.pairing_code_text)
        progressBar = findViewById(R.id.progress_bar)
        checkStatusButton = findViewById(R.id.check_status_button)
        cancelButton = findViewById(R.id.cancel_button)
        
        pairingCodeText.text = pairingCode
    }
    
    private fun setupClickListeners() {
        checkStatusButton.setOnClickListener {
            checkApprovalStatus()
        }
        
        cancelButton.setOnClickListener {
            // Voltar para tela inicial
            finish()
        }
    }
    
    private fun startAutomaticChecking() {
        lifecycleScope.launch {
            while (!isFinishing && !isChecking) {
                delay(CHECK_INTERVAL_MS)
                checkApprovalStatus()
            }
        }
    }
    
    private fun checkApprovalStatus() {
        if (isChecking) return
        
        lifecycleScope.launch {
            try {
                isChecking = true
                checkStatusButton.isEnabled = false
                checkStatusButton.text = "Verificando..."
                
                val apiService = SDBApplication.instance.apiClient.getApiService()
                val response = apiService.checkRegistrationStatus(pairingCode)
                
                if (response.isSuccessful && response.body()?.success == true) {
                    val data = response.body()?.data
                    
                    when (data?.status) {
                        "approved" -> {
                            // Dispositivo foi aprovado!
                            saveDeviceData()
                            showSuccessAndProceed()
                        }
                        "rejected" -> {
                            // Dispositivo foi rejeitado
                            Toast.makeText(this@PairingActivity, "Dispositivo rejeitado pelo administrador", Toast.LENGTH_LONG).show()
                            finish()
                        }
                        "pending" -> {
                            // Ainda aguardando aprovação
                            Log.d(TAG, "Ainda aguardando aprovação...")
                        }
                        else -> {
                            Toast.makeText(this@PairingActivity, "Status desconhecido: ${data?.status}", Toast.LENGTH_LONG).show()
                        }
                    }
                } else {
                    val errorMsg = response.body()?.error ?: "Erro ao verificar status"
                    Log.e(TAG, "Erro na verificação: $errorMsg")
                }
                
            } catch (e: Exception) {
                Log.e(TAG, "Erro ao verificar status", e)
                Toast.makeText(this@PairingActivity, "Erro de conexão: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                isChecking = false
                checkStatusButton.isEnabled = true
                checkStatusButton.text = "Verificar Status"
            }
        }
    }
    
    private fun saveDeviceData() {
        // Salvar dados do dispositivo aprovado
        SDBApplication.instance.sharedPreferences.edit()
            .putString("device_id", deviceId)
            .putString("pairing_code", pairingCode)
            .putBoolean("device_registered", true)
            .putBoolean("device_approved", true)
            .apply()
    }
    
    private fun showSuccessAndProceed() {
        Toast.makeText(this, "🎉 Dispositivo aprovado com sucesso!", Toast.LENGTH_LONG).show()
        
        // Ir para o launcher
        val intent = Intent(this, LauncherActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }
}