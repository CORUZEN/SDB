# Test script simples para APIs
Write-Host "=== FRIAXIS API Test (Simple) ===" -ForegroundColor Green

# Aguardar servidor
Start-Sleep -Seconds 2

# Teste 1: Health check básico
Write-Host "`n🔹 Testing /api/health..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -Method GET -TimeoutSec 10
    Write-Host "✅ Health: $($response | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    Write-Host "❌ Health failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 2: Database test
Write-Host "`n🔹 Testing /api/dbtest..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/dbtest" -Method GET -TimeoutSec 10
    Write-Host "✅ DB Test: Success" -ForegroundColor Green
} catch {
    Write-Host "❌ DB Test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 3: Test usando CURL se disponível
Write-Host "`n🔹 Testing with curl..." -ForegroundColor Cyan
try {
    $curlResult = curl -s "http://localhost:3000/api/health" 2>$null
    if ($curlResult) {
        Write-Host "✅ cURL: $curlResult" -ForegroundColor Green
    } else {
        Write-Host "❌ cURL: No response" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ cURL not available or failed" -ForegroundColor Red
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Green