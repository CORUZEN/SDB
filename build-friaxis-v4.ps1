# FRIAXIS v4.0.0 - Build Script Enterprise
# Script automatizado para compilação sem warnings e qualidade profissional

param(
    [switch]$Clean,
    [switch]$CopyApk,
    [string]$OutputName = "FRIAXIS-v4.0.0-debug.apk"
)

# Valores padrão para switches
if (-not $PSBoundParameters.ContainsKey('Clean')) { $Clean = $true }
if (-not $PSBoundParameters.ContainsKey('CopyApk')) { $CopyApk = $true }

# Configurações
$ErrorActionPreference = "Stop"
$ProjectRoot = "C:\SDB-clean-clone"
$AndroidDir = "$ProjectRoot\apps\android"
$ApkSource = "$AndroidDir\app\build\outputs\apk\debug\app-debug.apk"
$ApkDestination = "$ProjectRoot\$OutputName"

Write-Host "🚀 FRIAXIS v4.0.0 - Enterprise Build Script" -ForegroundColor Blue
Write-Host "===============================================" -ForegroundColor Blue

# Verificar diretório Android
if (-not (Test-Path $AndroidDir)) {
    Write-Error "❌ Diretório Android não encontrado: $AndroidDir"
    exit 1
}

# Mudar para diretório Android
Write-Host "📂 Mudando para diretório Android..." -ForegroundColor Yellow
Set-Location $AndroidDir

# Verificar Gradle Wrapper
if (-not (Test-Path ".\gradlew.bat")) {
    Write-Error "❌ Gradle wrapper não encontrado em $AndroidDir"
    exit 1
}

try {
    # Limpeza (se solicitada)
    if ($Clean) {
        Write-Host "🧹 Executando limpeza..." -ForegroundColor Yellow
        $cleanResult = cmd.exe /c "gradlew.bat clean" 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Error "❌ Falha na limpeza: $cleanResult"
            exit 1
        }
        Write-Host "✅ Limpeza concluída" -ForegroundColor Green
    }

    # Compilação
    Write-Host "🔨 Compilando FRIAXIS APK..." -ForegroundColor Yellow
    Write-Host "📝 Executando: gradlew.bat assembleDebug" -ForegroundColor Cyan
    
    $buildResult = cmd.exe /c "gradlew.bat assembleDebug" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "❌ Falha na compilação: $buildResult"
        exit 1
    }

    # Verificar APK gerado
    if (-not (Test-Path $ApkSource)) {
        Write-Error "❌ APK não foi gerado: $ApkSource"
        exit 1
    }

    # Obter informações do APK
    $apkInfo = Get-Item $ApkSource
    $apkSizeMB = [math]::Round($apkInfo.Length / 1MB, 2)
    
    Write-Host "✅ Compilação bem-sucedida!" -ForegroundColor Green
    Write-Host "📦 APK gerado: $($apkInfo.Name)" -ForegroundColor Green
    Write-Host "📊 Tamanho: $apkSizeMB MB" -ForegroundColor Green
    Write-Host "📅 Data: $($apkInfo.LastWriteTime)" -ForegroundColor Green

    # Copiar APK (se solicitado)
    if ($CopyApk) {
        Write-Host "📋 Copiando APK para raiz do projeto..." -ForegroundColor Yellow
        
        # Remover APK anterior se existir
        if (Test-Path $ApkDestination) {
            Remove-Item $ApkDestination -Force
            Write-Host "🗑️ APK anterior removido" -ForegroundColor Gray
        }
        
        Copy-Item $ApkSource $ApkDestination -Force
        
        if (Test-Path $ApkDestination) {
            $finalApk = Get-Item $ApkDestination
            Write-Host "✅ APK copiado com sucesso!" -ForegroundColor Green
            Write-Host "📂 Localização: $ApkDestination" -ForegroundColor Green
            Write-Host "📊 Tamanho final: $([math]::Round($finalApk.Length / 1MB, 2)) MB" -ForegroundColor Green
        } else {
            Write-Warning "⚠️ Falha ao copiar APK para $ApkDestination"
        }
    }

    # Verificar warnings
    $warningCount = ($buildResult | Select-String -Pattern "warning:" | Measure-Object).Count
    if ($warningCount -eq 0) {
        Write-Host "🎉 COMPILAÇÃO LIMPA - Zero warnings!" -ForegroundColor Green
    } else {
        Write-Warning "⚠️ $warningCount warnings encontrados"
    }

    Write-Host ""
    Write-Host "🎯 FRIAXIS v4.0.0 BUILD COMPLETO!" -ForegroundColor Blue
    Write-Host "✅ Status: Success" -ForegroundColor Green
    Write-Host "📱 APK: $OutputName" -ForegroundColor Green
    Write-Host "🏢 Empresa: CORUZEN" -ForegroundColor Blue
    Write-Host "🌐 Domínio: friaxis.coruzen.com" -ForegroundColor Blue

} catch {
    Write-Error "❌ Erro durante o build: $($_.Exception.Message)"
    exit 1
} finally {
    # Voltar para diretório original
    Set-Location $ProjectRoot
}