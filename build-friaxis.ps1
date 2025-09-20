# FRIAXIS Build Script
# Compila o APK do aplicativo Android

Write-Host "🚀 Compilando FRIAXIS Android APK..." -ForegroundColor Green

# Navegar para o diretório do Android
Set-Location "C:\SDB-clean-clone\apps\android"

# Verificar se estamos no diretório correto
if (Test-Path "build.gradle") {
    Write-Host "✅ Diretório correto encontrado" -ForegroundColor Green
} else {
    Write-Host "❌ Arquivo build.gradle não encontrado" -ForegroundColor Red
    exit 1
}

# Executar o build
Write-Host "📦 Iniciando compilação..." -ForegroundColor Yellow

# Definir variáveis de ambiente
$env:JAVA_OPTS = "-Xmx4096m"

# Executar gradle usando java diretamente
$gradleCommand = "java -classpath gradle\wrapper\gradle-wrapper.jar org.gradle.wrapper.GradleWrapperMain assembleDebug"
Write-Host "Executando: $gradleCommand" -ForegroundColor Yellow

Invoke-Expression $gradleCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ APK compilado com sucesso!" -ForegroundColor Green
    Write-Host "📁 APK localizado em: app\build\outputs\apk\debug\" -ForegroundColor Cyan
} else {
    Write-Host "❌ Erro na compilação (Exit Code: $LASTEXITCODE)" -ForegroundColor Red
}