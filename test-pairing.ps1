#!/usr/bin/env pwsh
# Teste do Sistema de Pareamento FRIAXIS v4.0.0

param(
    [string]$PairingCode = "",
    [string]$DeviceName = "Smartphone Teste",
    [string]$DeviceModel = "FRIAXIS Android Device",
    [string]$AndroidVersion = "14"
)

$ErrorActionPreference = "Stop"
$BaseUrl = "http://localhost:3000"

Write-Host "📱 FRIAXIS v4.0.0 - Teste de Pareamento" -ForegroundColor Blue
Write-Host "=======================================" -ForegroundColor Blue

# Se não foi fornecido código, simular registro inicial do dispositivo
if (-not $PairingCode) {
    Write-Host "🔄 Simulando registro inicial do dispositivo..." -ForegroundColor Yellow
    
    $deviceData = @{
        name = $DeviceName
        model = $DeviceModel
        android_version = $AndroidVersion
        firebase_token = "test_firebase_token_$(Get-Date -Format 'yyyyMMddHHmmss')"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/devices/register" -Method POST -Body ($deviceData | ConvertTo-Json) -ContentType "application/json"
        
        if ($response.success) {
            $PairingCode = $response.data.pairing_code
            Write-Host "✅ Dispositivo registrado com sucesso!" -ForegroundColor Green
            Write-Host "📋 Código de pareamento: $PairingCode" -ForegroundColor Cyan
            Write-Host "🆔 Device ID: $($response.data.device_id)" -ForegroundColor Cyan
            Write-Host "📱 Status: $($response.data.status)" -ForegroundColor Yellow
        } else {
            Write-Error "❌ Falha no registro: $($response.error)"
            exit 1
        }
    } catch {
        Write-Error "❌ Erro de comunicação: $($_.Exception.Message)"
        exit 1
    }

Write-Host ""
Write-Host "⏳ Aguardando aprovação no painel web..." -ForegroundColor Yellow
Write-Host "👉 Acesse: $BaseUrl/pending-devices" -ForegroundColor Blue
Write-Host "📝 Instruções:" -ForegroundColor White
Write-Host "   1. Abra o painel FRIAXIS no navegador" -ForegroundColor Gray
Write-Host "   2. Vá para 'Dispositivos Pendentes'" -ForegroundColor Gray
Write-Host "   3. Encontre o código $PairingCode" -ForegroundColor Gray
Write-Host "   4. Clique em 'Aprovar'" -ForegroundColor Gray

# Polling para verificar aprovação
$maxAttempts = 30
$attempt = 0

while ($attempt -lt $maxAttempts) {
    Start-Sleep -Seconds 2
    $attempt++
    
    try {
        $statusResponse = Invoke-RestMethod -Uri "$BaseUrl/api/devices/register/$PairingCode" -Method GET
        
        if ($statusResponse.success) {
            $status = $statusResponse.data.status
            $approved = $statusResponse.data.approved
            
            Write-Host "🔍 Verificação $attempt/$maxAttempts - Status: $status" -ForegroundColor Gray
            
            if ($approved) {
                Write-Host ""
                Write-Host "🎉 DISPOSITIVO APROVADO!" -ForegroundColor Green
                Write-Host "✅ Status: Aprovado" -ForegroundColor Green
                Write-Host "🆔 Device ID: $($statusResponse.data.device_id)" -ForegroundColor Cyan
                Write-Host ""
                Write-Host "📱 O dispositivo agora está conectado ao FRIAXIS!" -ForegroundColor Blue
                break
            }
        } else {
            Write-Host "⚠️ Código inválido ou expirado" -ForegroundColor Red
            break
        }
    } catch {
        Write-Host "❌ Erro na verificação: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    if ($attempt -eq $maxAttempts) {
        Write-Host ""
        Write-Host "⏰ Timeout: Dispositivo não foi aprovado em $($maxAttempts * 2) segundos" -ForegroundColor Yellow
        Write-Host "💡 Verifique se o código foi aprovado no painel web" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "📊 Teste concluído!" -ForegroundColor Blue