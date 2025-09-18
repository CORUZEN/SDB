package com.sdb.mdm.ui.launcher

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.GridView
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.sdb.mdm.R
import com.sdb.mdm.SDBApplication
import com.sdb.mdm.admin.DeviceAdminManager
import com.sdb.mdm.admin.SDBDeviceAdminReceiver
import com.sdb.mdm.model.AppInfo
import com.sdb.mdm.ui.setup.SetupActivity
import com.sdb.mdm.ui.debug.DebugOverlay
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class LauncherActivity : AppCompatActivity() {
    
    companion object {
        private const val TAG = "LauncherActivity"
        private const val REQUEST_ENABLE_ADMIN = 1001
    }
    
    private lateinit var appsGridView: GridView
    private lateinit var welcomeTextView: TextView
    private lateinit var statusTextView: TextView
    
    private lateinit var appAdapter: LauncherAppAdapter
    private lateinit var deviceAdminManager: DeviceAdminManager
    
    private val allowedApps = mutableListOf<AppInfo>()
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Verificar modo de emergência
        if (SDBApplication.instance.isEmergencyMode()) {
            Toast.makeText(this, "⚠️ MODO EMERGÊNCIA ATIVO - App desativado", Toast.LENGTH_LONG).show()
            finish()
            return
        }
        
        // Forçar configuração inicial se o dispositivo não estiver aprovado
        if (!SDBApplication.instance.sharedPreferences.getBoolean("device_approved", false)) {
            startActivity(Intent(this, SetupActivity::class.java))
            finish()
            return
        }
        
        setContentView(R.layout.activity_launcher)
        initializeViews()
        initializeServices()
        loadAllowedApps()
        
        // Debug overlay apenas se habilitado nas configurações
        if (SDBApplication.instance.sharedPreferences.getBoolean("debug_mode", false)) {
            showDebugOverlay()
        }
    }
    
    private fun showDebugOverlay() {
        try {
            val debugOverlay = DebugOverlay.getInstance(this)
            debugOverlay.requestOverlayPermission()
            debugOverlay.showOverlay()
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao mostrar debug overlay", e)
        }
    }
    
    private fun initializeViews() {
        appsGridView = findViewById(R.id.apps_grid_view)
        welcomeTextView = findViewById(R.id.welcome_text_view)
        statusTextView = findViewById(R.id.status_text_view)
        
        // Configurar adapter
        appAdapter = LauncherAppAdapter(this, allowedApps) { appInfo ->
            launchApp(appInfo.packageName)
        }
        appsGridView.adapter = appAdapter
        
        // Configurar texto de boas-vindas
        welcomeTextView.text = "Bem-vindo ao SDB Launcher"
        // Status será atualizado após inicializar os serviços
    }
    
    private fun initializeServices() {
        deviceAdminManager = DeviceAdminManager(this)
        
        // Verificar se device admin está ativo
        if (!deviceAdminManager.isAdminActive()) {
            requestDeviceAdmin()
        }
        
        // Atualizar status depois da inicialização
        updateStatusText()
    }
    
    private fun requestDeviceAdmin() {
        val intent = Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN).apply {
            putExtra(
                DevicePolicyManager.EXTRA_DEVICE_ADMIN,
                ComponentName(this@LauncherActivity, SDBDeviceAdminReceiver::class.java)
            )
            putExtra(
                DevicePolicyManager.EXTRA_ADD_EXPLANATION,
                "O SDB precisa de permissões de administrador para aplicar políticas de segurança corporativas."
            )
        }
        startActivityForResult(intent, REQUEST_ENABLE_ADMIN)
    }
    
    private fun loadAllowedApps() {
        lifecycleScope.launch {
            try {
                val apps = withContext(Dispatchers.IO) {
                    getInstalledApps()
                }
                
                allowedApps.clear()
                allowedApps.addAll(apps)
                appAdapter.notifyDataSetChanged()
                
                updateStatusText()
                
            } catch (e: Exception) {
                Log.e(TAG, "Erro ao carregar apps", e)
                Toast.makeText(this@LauncherActivity, "Erro ao carregar aplicativos", Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    private fun getInstalledApps(): List<AppInfo> {
        val packageManager = packageManager
        val installedApps = mutableListOf<AppInfo>()
        
        // Por enquanto, mostrar todos os apps instalados
        // TODO: Filtrar baseado na política aplicada
        val packages = packageManager.getInstalledApplications(PackageManager.GET_META_DATA)
        
        for (packageInfo in packages) {
            try {
                // Filtrar apps do sistema básicos
                if (shouldShowApp(packageInfo.packageName)) {
                    val appName = packageManager.getApplicationLabel(packageInfo).toString()
                    val icon = packageManager.getApplicationIcon(packageInfo)
                    val isSystemApp = (packageInfo.flags and android.content.pm.ApplicationInfo.FLAG_SYSTEM) != 0
                    
                    installedApps.add(
                        AppInfo(
                            packageName = packageInfo.packageName,
                            appName = appName,
                            iconDrawable = icon,
                            isSystemApp = isSystemApp
                        )
                    )
                }
            } catch (e: Exception) {
                Log.w(TAG, "Erro ao obter informações do app: ${packageInfo.packageName}", e)
            }
        }
        
        return installedApps.sortedBy { it.appName }
    }
    
    private fun shouldShowApp(packageName: String): Boolean {
        // TODO: Implementar filtro baseado em políticas
        // Por enquanto, filtrar apenas alguns apps do sistema
        val blockedSystemApps = setOf(
            "com.android.settings",
            "com.android.vending", // Play Store
            "com.google.android.packageinstaller",
            packageName // Não mostrar o próprio launcher na lista
        )
        
        return !blockedSystemApps.contains(packageName)
    }
    
    private fun launchApp(packageName: String) {
        try {
            val intent = packageManager.getLaunchIntentForPackage(packageName)
            if (intent != null) {
                Log.d(TAG, "Iniciando app: $packageName")
                startActivity(intent)
            } else {
                Toast.makeText(this, "Não foi possível iniciar o aplicativo", Toast.LENGTH_SHORT).show()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao iniciar app: $packageName", e)
            Toast.makeText(this, "Erro ao iniciar aplicativo", Toast.LENGTH_SHORT).show()
        }
    }
    
    private fun updateStatusText() {
        val deviceId = SDBApplication.instance.getStoredDeviceId()
        val adminActive = if (::deviceAdminManager.isInitialized) {
            deviceAdminManager.isAdminActive()
        } else {
            false
        }
        
        statusTextView.text = buildString {
            append("Device ID: ${deviceId?.take(8)}...")
            append("\n")
            append("Admin: ${if (adminActive) "Ativo" else "Inativo"}")
            append("\n")
            append("Apps: ${allowedApps.size}")
        }
    }
    
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        
        when (requestCode) {
            REQUEST_ENABLE_ADMIN -> {
                if (resultCode == RESULT_OK) {
                    Log.d(TAG, "Device admin ativado")
                    Toast.makeText(this, "Permissões de administrador concedidas", Toast.LENGTH_SHORT).show()
                    updateStatusText()
                } else {
                    Log.w(TAG, "Device admin rejeitado pelo usuário")
                    Toast.makeText(this, "Permissões de administrador são necessárias", Toast.LENGTH_LONG).show()
                }
            }
        }
    }
    
    override fun onBackPressed() {
        // Não permitir voltar do launcher
        // TODO: Implementar opção de sair com senha administrativa
    }
    
    override fun onResume() {
        super.onResume()
        updateStatusText()
        
        // Verificar se há novas políticas para aplicar
        // TODO: Implementar verificação periódica de políticas
    }
}