# FRIAXIS - Teste Simples de API
Write-Host "🚀 Testando APIs do FRIAXIS..." -ForegroundColor Cyan

$baseUrl = "http://127.0.0.1:3000"

# Teste simples
try {
    Write-Host "📡 Testando conexão com $baseUrl..." -ForegroundColor Yellow
    $response = Invoke-WebRequest -Uri "$baseUrl/api/admin/reset-database" -TimeoutSec 10
    Write-Host "✅ API funcionando! Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "📄 Response:" -ForegroundColor White
    $response.Content | ConvertFrom-Json | ConvertTo-Json
}
catch {
    Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
    
    # Tentar localhost
    try {
        Write-Host "🔄 Tentando localhost..." -ForegroundColor Yellow
        $response2 = Invoke-WebRequest -Uri "http://localhost:3000/api/admin/reset-database" -TimeoutSec 10
        Write-Host "✅ Localhost funcionando! Status: $($response2.StatusCode)" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Localhost também falhou: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "💡 Servidor pode não estar rodando ou firewall bloqueando" -ForegroundColor Yellow
    }
}