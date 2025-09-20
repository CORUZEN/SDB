# ===============================================
# FRIAXIS v4.0.0 - TESTE DE API POWERSHELL
# Script otimizado para Windows/PowerShell
# ===============================================

Write-Host "🚀 FRIAXIS - Teste de APIs" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan

# Função para aguardar servidor
function Wait-Server {
    param([string]$Url, [int]$MaxAttempts = 30)
    
    Write-Host "🔄 Aguardando servidor em $Url..." -ForegroundColor Yellow
    
    for ($i = 1; $i -le $MaxAttempts; $i++) {
        Write-Host "📡 Tentativa $i/$MaxAttempts..." -ForegroundColor Gray
        
        try {
            $response = Invoke-WebRequest -Uri $Url -TimeoutSec 5 -ErrorAction Stop
            Write-Host "✅ Servidor respondendo!" -ForegroundColor Green
            return $true
        }
        catch {
            Start-Sleep -Seconds 2
        }
    }
    
    Write-Host "❌ Servidor não respondeu após $MaxAttempts tentativas" -ForegroundColor Red
    return $false
}

# Função para testar API
function Test-API {
    param(
        [string]$Endpoint,
        [string]$Description,
        [string]$Method = "GET",
        [hashtable]$Body = @{}
    )
    
    Write-Host ""
    Write-Host "🧪 Testando: $Description" -ForegroundColor Yellow
    Write-Host "📍 Endpoint: $Method $Endpoint" -ForegroundColor Gray
    
    try {
        if ($Method -eq "POST" -and $Body.Count -gt 0) {
            $jsonBody = $Body | ConvertTo-Json
            $response = Invoke-WebRequest -Uri $Endpoint -Method $Method -Body $jsonBody -ContentType "application/json" -TimeoutSec 10
        } else {
            $response = Invoke-WebRequest -Uri $Endpoint -Method $Method -TimeoutSec 10
        }
        
        Write-Host "✅ Status: $($response.StatusCode) (OK)" -ForegroundColor Green
        
        # Tentar parsear JSON
        try {
            $jsonResponse = $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
            $truncated = if ($jsonResponse.Length -gt 300) { $jsonResponse.Substring(0, 300) + "..." } else { $jsonResponse }
            Write-Host "📄 Response: $truncated" -ForegroundColor White
        }
        catch {
            $truncated = if ($response.Content.Length -gt 200) { $response.Content.Substring(0, 200) + "..." } else { $response.Content }
            Write-Host "📄 Response: $truncated" -ForegroundColor White
        }
        
        return $true
    }
    catch {
        Write-Host "❌ Status: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# URL base
$BaseUrl = "http://127.0.0.1:3000"

# Testar conectividade primeiro com 127.0.0.1
Write-Host "🌐 Tentando conectar em 127.0.0.1:3000..." -ForegroundColor Cyan

if (Wait-Server -Url $BaseUrl) {
    Write-Host ""
    Write-Host "🧪 EXECUTANDO TESTES DE API:" -ForegroundColor Cyan
    Write-Host "============================" -ForegroundColor Cyan
    
    # Teste 1: Homepage
    Test-API -Endpoint "$BaseUrl" -Description "Homepage"
    
    # Teste 2: Status do banco (GET)
    Test-API -Endpoint "$BaseUrl/api/admin/reset-database" -Description "Status do banco de dados"
    
    # Teste 3: Dispositivos pendentes
    Test-API -Endpoint "$BaseUrl/api/admin/pending-devices" -Description "Dispositivos pendentes"
    
    # Teste 4: Gerar código (POST)
    $generateBody = @{
        description = "Teste automatizado PowerShell"
        duration = 1
    }
    Test-API -Endpoint "$BaseUrl/api/admin/generate-code" -Description "Gerar código de pareamento" -Method "POST" -Body $generateBody
    
    Write-Host ""
    Write-Host "✅ TESTES CONCLUÍDOS!" -ForegroundColor Green
    
} else {
    # Tentar localhost como fallback
    Write-Host ""
    Write-Host "🔄 Tentando localhost como fallback..." -ForegroundColor Yellow
    $BaseUrl = "http://localhost:3000"
    
    if (Wait-Server -Url $BaseUrl) {
        Write-Host "✅ Conectado via localhost!" -ForegroundColor Green
        Test-API -Endpoint "$BaseUrl/api/admin/reset-database" -Description "Status do banco via localhost"
    } else {
        Write-Host ""
        Write-Host "❌ ERRO: Servidor não está respondendo" -ForegroundColor Red
        Write-Host "💡 Certifique-se de que o servidor está rodando:" -ForegroundColor Yellow
        Write-Host "   cd apps\web" -ForegroundColor Gray
        Write-Host "   pnpm run dev" -ForegroundColor Gray
        Write-Host ""
        Write-Host "🔧 Verificações adicionais:" -ForegroundColor Yellow
        Write-Host "   - Firewall do Windows" -ForegroundColor Gray
        Write-Host "   - Antivírus bloqueando conexões" -ForegroundColor Gray
        Write-Host "   - Processo Node.js ativo" -ForegroundColor Gray
    }
}