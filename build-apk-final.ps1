# SDB Android APK Build Script
# Compilação do aplicativo Android SDB Mobile

Write-Host "🤖 COMPILANDO SDB MOBILE APK" -ForegroundColor Green
Write-Host "============================" -ForegroundColor Green

# Verificar estrutura do projeto
if (-not (Test-Path "apps/android")) {
    Write-Error "❌ Diretório apps/android não encontrado"
    exit 1
}

Write-Host "✅ Estrutura do projeto verificada" -ForegroundColor Cyan

# Navegar para Android
Set-Location "apps/android"

# Limpar builds anteriores
Write-Host "`n🧹 Limpeza de builds anteriores..." -ForegroundColor Yellow
.\gradlew.bat clean | Out-Host

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Limpeza concluída" -ForegroundColor Cyan
} else {
    Write-Error "❌ Falha na limpeza"
    Set-Location "../.."
    exit 1
}

# Compilar APK Debug
Write-Host "`n🔨 Compilando APK Debug..." -ForegroundColor Yellow
.\gradlew.bat assembleDebug | Out-Host

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Compilação concluída com sucesso" -ForegroundColor Green
} else {
    Write-Error "❌ Falha na compilação"
    Set-Location "../.."
    exit 1
}

# Verificar APK gerado
$apkPath = "app/build/outputs/apk/debug/app-debug.apk"
if (Test-Path $apkPath) {
    $apkSize = [math]::Round((Get-Item $apkPath).Length / 1MB, 2)
    Write-Host "`n📦 APK Debug gerado:" -ForegroundColor Green
    Write-Host "   Arquivo: app-debug.apk" -ForegroundColor Cyan
    Write-Host "   Tamanho: $apkSize MB" -ForegroundColor Cyan
    
    # Copiar para diretório raiz
    Copy-Item $apkPath "../../SDB-Mobile-debug.apk" -Force
    Write-Host "   Copiado: SDB-Mobile-debug.apk" -ForegroundColor Cyan
} else {
    Write-Error "❌ APK não foi gerado"
    Set-Location "../.."
    exit 1
}

# Voltar ao diretório raiz
Set-Location "../.."

# Informações do build
Write-Host "`n📋 Informações do Build:" -ForegroundColor Yellow
Write-Host "   ID da Aplicação: com.coruzen.sdb" -ForegroundColor Gray
Write-Host "   Versão: 1.0 (Code: 1)" -ForegroundColor Gray
Write-Host "   SDK Mínimo: 26 (Android 8.0)" -ForegroundColor Gray
Write-Host "   SDK Alvo: 34 (Android 14)" -ForegroundColor Gray

Write-Host "`n🎉 COMPILAÇÃO CONCLUÍDA!" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green
Write-Host "✅ APK disponível: SDB-Mobile-debug.apk" -ForegroundColor Cyan
Write-Host "✅ Pronto para instalação" -ForegroundColor Cyan

Write-Host "`n📱 Para instalar no dispositivo:" -ForegroundColor White
Write-Host "   adb install -r SDB-Mobile-debug.apk" -ForegroundColor Gray