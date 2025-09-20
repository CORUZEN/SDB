# FRIAXIS v4.0.0 - Instalação Android (PowerShell)
# 
# Este script facilita a instalação do app FRIAXIS no dispositivo Android
# conectado via USB com debug habilitado

Write-Host "🚀 FRIAXIS v4.0.0 - Instalação Android" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""

# Verificar se ADB está disponível
$adbPath = Get-Command adb -ErrorAction SilentlyContinue
if (-not $adbPath) {
    Write-Host "❌ ADB não encontrado!" -ForegroundColor Red
    Write-Host "   Instale o Android SDK Platform Tools" -ForegroundColor Yellow
    Write-Host "   https://developer.android.com/studio/releases/platform-tools" -ForegroundColor Yellow
    exit 1
}

# Verificar dispositivos conectados
Write-Host "🔍 Verificando dispositivos conectados..." -ForegroundColor Blue
$devices = adb devices | Select-String "device$" | Measure-Object | Select-Object -ExpandProperty Count

if ($devices -eq 0) {
    Write-Host "❌ Nenhum dispositivo Android conectado!" -ForegroundColor Red
    Write-Host "   1. Conecte o dispositivo via USB" -ForegroundColor Yellow
    Write-Host "   2. Habilite 'Depuração USB' nas opções de desenvolvedor" -ForegroundColor Yellow
    Write-Host "   3. Aceite a conexão no dispositivo" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Dispositivo(s) encontrado(s): $devices" -ForegroundColor Green
Write-Host ""

# Instalar APK
$apkFile = "FRIAXIS-v4.0.0-debug.apk"

if (-not (Test-Path $apkFile)) {
    Write-Host "❌ APK não encontrado: $apkFile" -ForegroundColor Red
    Write-Host "   Execute primeiro: .\gradlew assembleDebug" -ForegroundColor Yellow
    exit 1
}

$apkSize = [math]::Round((Get-ItemProperty $apkFile).Length / 1MB, 1)
Write-Host "📱 Instalando FRIAXIS v4.0.0..." -ForegroundColor Blue
Write-Host "   APK: $apkFile ($apkSize MB)" -ForegroundColor Gray
Write-Host ""

# Executar instalação
$installResult = adb install -r $apkFile
$exitCode = $LASTEXITCODE

if ($exitCode -eq 0) {
    Write-Host ""
    Write-Host "🎉 FRIAXIS v4.0.0 instalado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Próximos passos:" -ForegroundColor Blue
    Write-Host "   1. Abra o app no dispositivo" -ForegroundColor White
    Write-Host "   2. Permita as permissões solicitadas" -ForegroundColor White
    Write-Host "   3. Configure a conexão com o servidor" -ForegroundColor White
    Write-Host "   4. Teste a sincronia com o dashboard web" -ForegroundColor White
    Write-Host ""
    Write-Host "🌐 Dashboard Web: https://friaxis.coruzen.com" -ForegroundColor Cyan
    Write-Host "🔧 Servidor Local: http://localhost:3001" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Falha na instalação!" -ForegroundColor Red
    Write-Host "   Verifique se o dispositivo permite instalação de apps desconhecidos" -ForegroundColor Yellow
}