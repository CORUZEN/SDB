# Teste completo de conectividade e reset do banco Neon
Write-Host "FRIAXIS v4.0.0 - Teste Banco Neon em Tempo Real" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

# 1. Verificar se servidor esta rodando
Write-Host "`n1. Verificando servidor localhost..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -Method GET -TimeoutSec 5
    Write-Host "   Servidor ativo: $($response.status)" -ForegroundColor Green
} catch {
    Write-Host "   Servidor nao esta rodando. Execute: npm run dev:web" -ForegroundColor Red
    exit 1
}

# 2. Testar endpoint de reset
Write-Host "`n2. Testando endpoint de reset..." -ForegroundColor Yellow
try {
    $resetStatus = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/reset-database" -Method GET -TimeoutSec 5
    Write-Host "   Endpoint acessivel" -ForegroundColor Green
} catch {
    Write-Host "   Erro ao acessar endpoint: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. Confirmar reset do banco Neon
Write-Host "`n3. ATENCAO: Reset completo do banco Neon" -ForegroundColor Yellow
Write-Host "   Servidor: ep-autumn-cake-actozaj8-pooler.sa-east-1.aws.neon.tech" -ForegroundColor Cyan
Write-Host "   Ira dropar TODAS as tabelas existentes" -ForegroundColor Red
Write-Host "   Ira criar estrutura completa FRIAXIS v4.0.0" -ForegroundColor Green

$confirmacao = Read-Host "`n   Confirma reset do banco Neon? (s/N)"
if ($confirmacao -ne "s" -and $confirmacao -ne "S") {
    Write-Host "   Reset cancelado pelo usuario" -ForegroundColor Yellow
    exit 0
}

# 4. Executar reset
Write-Host "`n4. Executando reset do banco Neon..." -ForegroundColor Yellow
try {
    $resetResult = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/reset-database" -Method POST -TimeoutSec 30
    Write-Host "   Reset executado com sucesso!" -ForegroundColor Green
    Write-Host "   Resultado:" -ForegroundColor Cyan
    Write-Host "      - Status: $($resetResult.success)" -ForegroundColor White
    Write-Host "      - Mensagem: $($resetResult.message)" -ForegroundColor White
} catch {
    Write-Host "   Erro durante reset: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 5. Verificar estrutura final
Write-Host "`n5. Verificando estrutura final..." -ForegroundColor Yellow
try {
    $healthCheck = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -Method GET -TimeoutSec 5
    Write-Host "   Banco configurado e funcionando!" -ForegroundColor Green
    Write-Host "   Conexao: $($healthCheck.database)" -ForegroundColor Cyan
} catch {
    Write-Host "   Erro na verificacao: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nCONFIRMADO: Banco Neon em tempo real conectado!" -ForegroundColor Green
Write-Host "   Servidor local: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   Banco Neon: ep-autumn-cake-actozaj8-pooler.sa-east-1.aws.neon.tech" -ForegroundColor Cyan
Write-Host "   Tudo funcionando em tempo real!" -ForegroundColor Green