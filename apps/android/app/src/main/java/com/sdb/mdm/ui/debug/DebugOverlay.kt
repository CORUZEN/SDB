package com.sdb.mdm.ui.debug

import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.util.Log
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import com.sdb.mdm.R
import com.sdb.mdm.SDBApplication
import com.sdb.mdm.utils.ConnectivityTester
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class DebugOverlay(private val context: Context) {
    
    companion object {
        private const val TAG = "DebugOverlay"
        private var instance: DebugOverlay? = null
        
        fun getInstance(context: Context): DebugOverlay {
            if (instance == null) {
                instance = DebugOverlay(context.applicationContext)
            }
            return instance!!
        }
        
        fun show(context: Context) {
            getInstance(context).showOverlay()
        }
        
        fun hide() {
            instance?.hideOverlay()
        }
    }
    
    private var windowManager: WindowManager? = null
    private var overlayView: View? = null
    private var isShowing = false
    
    fun showOverlay() {
        if (isShowing || !canDrawOverlays()) {
            return
        }
        
        try {
            windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
            
            // Criar o layout do overlay
            val layoutInflater = LayoutInflater.from(context)
            overlayView = createOverlayView()
            
            // Configurar parâmetros da janela
            val params = WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                } else {
                    WindowManager.LayoutParams.TYPE_PHONE
                },
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
                PixelFormat.TRANSLUCENT
            )
            
            params.gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
            params.y = 20
            
            windowManager?.addView(overlayView, params)
            isShowing = true
            
            Log.d(TAG, "Debug overlay mostrado")
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao mostrar overlay de debug", e)
        }
    }
    
    fun hideOverlay() {
        try {
            if (isShowing && overlayView != null) {
                windowManager?.removeView(overlayView)
                isShowing = false
                overlayView = null
                Log.d(TAG, "Debug overlay ocultado")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao ocultar overlay de debug", e)
        }
    }
    
    private fun createOverlayView(): View {
        val layout = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            setBackgroundColor(Color.parseColor("#CC000000"))
            setPadding(16, 8, 16, 8)
        }
        
        // Status de conectividade
        val statusText = TextView(context).apply {
            text = "SDB Debug"
            setTextColor(Color.WHITE)
            textSize = 12f
            setPadding(0, 0, 16, 0)
        }
        
        // Botão de teste de conectividade
        val testButton = Button(context).apply {
            text = "Test API"
            setTextColor(Color.WHITE)
            setBackgroundColor(Color.parseColor("#FF4444"))
            setPadding(8, 4, 8, 4)
            textSize = 10f
            setOnClickListener { testConnectivity(statusText) }
        }
        
        // Botão de emergência
        val emergencyButton = Button(context).apply {
            text = "EMERGENCY"
            setTextColor(Color.WHITE)
            setBackgroundColor(Color.parseColor("#FF0000"))
            setPadding(8, 4, 8, 4)
            textSize = 10f
            setOnClickListener { showEmergencyDialog() }
        }
        
        layout.addView(statusText)
        layout.addView(testButton)
        layout.addView(emergencyButton)
        
        return layout
    }
    
    private fun testConnectivity(statusText: TextView) {
        ConnectivityTester.testFullConnectivity(context) { success, message ->
            if (success) {
                statusText.text = "API: ✓ Conectado"
                statusText.setTextColor(Color.GREEN)
                Toast.makeText(context, "✅ Todos os testes passaram!", Toast.LENGTH_SHORT).show()
            } else {
                statusText.text = "API: ✗ Problemas"
                statusText.setTextColor(Color.RED)
                Toast.makeText(context, "❌ Verificar logs", Toast.LENGTH_SHORT).show()
            }
            
            // Mostrar resultados detalhados no log
            Log.d(TAG, "Resultados dos testes:\n$message")
        }
    }
    
    private fun showEmergencyDialog() {
        try {
            AlertDialog.Builder(context)
                .setTitle("⚠️ MODO EMERGÊNCIA")
                .setMessage("Escolha uma ação de emergência:")
                .setPositiveButton("Desativar App") { _, _ ->
                    SDBApplication.instance.setEmergencyMode(true)
                    Toast.makeText(context, "App desativado! Pode desinstalar.", Toast.LENGTH_LONG).show()
                    hideOverlay()
                }
                .setNeutralButton("Reset Completo") { _, _ ->
                    SDBApplication.instance.resetApp()
                }
                .setNegativeButton("Cancelar", null)
                .show()
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao mostrar diálogo de emergência", e)
            Toast.makeText(context, "Erro: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }
    
    private fun canDrawOverlays(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(context)
        } else {
            true
        }
    }
    
    fun requestOverlayPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(context)) {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:${context.packageName}")
            )
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
        }
    }
}