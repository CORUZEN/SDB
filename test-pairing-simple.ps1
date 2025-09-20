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

Write-Host "FRIAXIS v4.0.0 - Teste de Pareamento" -ForegroundColor Blue
Write-Host "=====================================" -ForegroundColor Blue

# Se nao foi fornecido codigo, simular registro inicial
if (-not $PairingCode) {
    Write-Host "Simulando registro inicial do dispositivo..." -ForegroundColor Yellow
    
    $deviceData = @{
        name = $DeviceName
        model = $DeviceModel
        android_version = $AndroidVersion
        firebase_token = "test_firebase_token_$(Get-Date -Format 'yyyyMMddHHmmss')"
    }
    
    try {
        $jsonBody = $deviceData | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/devices/register" -Method POST -Body $jsonBody -ContentType "application/json"
        
        if ($response.success) {
            $PairingCode = $response.data.pairing_code
            Write-Host "Dispositivo registrado com sucesso!" -ForegroundColor Green
            Write-Host "Codigo de pareamento: $PairingCode" -ForegroundColor Cyan
            Write-Host "Device ID: $($response.data.device_id)" -ForegroundColor Cyan
            Write-Host "Status: $($response.data.status)" -ForegroundColor Yellow
        }
        else {
            Write-Host "Falha no registro: $($response.error)" -ForegroundColor Red
            exit 1
        }
    }
    catch {
        Write-Host "Erro de comunicacao: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}
else {
    Write-Host "Usando codigo fornecido: $PairingCode" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Aguardando aprovacao no painel web..." -ForegroundColor Yellow
Write-Host "Acesse: $BaseUrl/pending-devices" -ForegroundColor Blue
Write-Host "Instrucoes:" -ForegroundColor White
Write-Host "  1. Abra o painel FRIAXIS no navegador" -ForegroundColor Gray
Write-Host "  2. Va para 'Dispositivos Pendentes'" -ForegroundColor Gray
Write-Host "  3. Encontre o codigo $PairingCode" -ForegroundColor Gray
Write-Host "  4. Clique em 'Aprovar'" -ForegroundColor Gray

# Polling para verificar aprovacao
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
            
            Write-Host "Verificacao $attempt/$maxAttempts - Status: $status" -ForegroundColor Gray
            
            if ($approved) {
                Write-Host ""
                Write-Host "DISPOSITIVO APROVADO!" -ForegroundColor Green
                Write-Host "Status: Aprovado" -ForegroundColor Green
                Write-Host "Device ID: $($statusResponse.data.device_id)" -ForegroundColor Cyan
                Write-Host ""
                Write-Host "O dispositivo agora esta conectado ao FRIAXIS!" -ForegroundColor Blue
                break
            }
        }
        else {
            Write-Host "Codigo invalido ou expirado" -ForegroundColor Red
            break
        }
    }
    catch {
        Write-Host "Erro na verificacao: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    if ($attempt -eq $maxAttempts) {
        Write-Host ""
        Write-Host "Timeout: Dispositivo nao foi aprovado em $($maxAttempts * 2) segundos" -ForegroundColor Yellow
        Write-Host "Verifique se o codigo foi aprovado no painel web" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Teste concluido!" -ForegroundColor Blue