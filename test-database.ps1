#!/usr/bin/env pwsh
# FRIAXIS v4.0.0 - Teste de Conexão com Banco Neon

$ErrorActionPreference = "Stop"
$BaseUrl = "http://localhost:3000"

Write-Host "FRIAXIS v4.0.0 - Teste de Banco de Dados Neon" -ForegroundColor Blue
Write-Host "=============================================" -ForegroundColor Blue

# Função para fazer requisições HTTP
function Invoke-ApiRequest {
    param(
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{"Content-Type" = "application/json"}
    )
    
    try {
        if ($Method -eq "GET") {
            return Invoke-RestMethod -Uri $Url -Method $Method -Headers $Headers -TimeoutSec 30
        } else {
            return Invoke-RestMethod -Uri $Url -Method $Method -Headers $Headers -Body "{}" -TimeoutSec 30
        }
    } catch {
        throw $_.Exception.Message
    }
}

Write-Host ""
Write-Host "1. Verificando status atual do banco..." -ForegroundColor Yellow

try {
    $statusResponse = Invoke-ApiRequest -Url "$BaseUrl/api/admin/reset-database" -Method "GET"
    
    if ($statusResponse.success) {
        Write-Host "Conexao com banco: OK" -ForegroundColor Green
        Write-Host "Provedor: $($statusResponse.database.provider)" -ForegroundColor Cyan
        Write-Host "Versao: $($statusResponse.database.version)" -ForegroundColor Cyan
        Write-Host "Tempo atual: $($statusResponse.database.current_time)" -ForegroundColor Cyan
        
        Write-Host ""
        Write-Host "Tabelas existentes:" -ForegroundColor Blue
        foreach ($table in $statusResponse.tables) {
            Write-Host "  - $table" -ForegroundColor Gray
        }
        
        Write-Host ""
        Write-Host "Contagem de registros:" -ForegroundColor Blue
        foreach ($key in $statusResponse.record_counts.PSObject.Properties.Name) {
            $count = $statusResponse.record_counts.$key
            Write-Host "  - $key : $count" -ForegroundColor Cyan
        }
    } else {
        Write-Host "Banco nao conectado ou com problemas" -ForegroundColor Red
        Write-Host "Erro: $($statusResponse.database.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "Erro ao verificar status: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Banco provavelmente precisa ser configurado" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "2. Executando reset completo do banco..." -ForegroundColor Yellow
Write-Host "   Isso vai remover TODAS as tabelas e dados existentes!" -ForegroundColor Red
Write-Host "   E criar uma estrutura completamente nova" -ForegroundColor Yellow

$confirmation = Read-Host "Deseja continuar? (digite 'SIM' para confirmar)"

if ($confirmation -eq "SIM") {
    try {
        Write-Host "Iniciando reset do banco de dados..." -ForegroundColor Yellow
        
        $resetResponse = Invoke-ApiRequest -Url "$BaseUrl/api/admin/reset-database" -Method "POST"
        
        if ($resetResponse.success) {
            Write-Host ""
            Write-Host "BANCO DE DADOS RESETADO COM SUCESSO!" -ForegroundColor Green
            Write-Host "====================================" -ForegroundColor Green
            
            Write-Host "Versao: $($resetResponse.version)" -ForegroundColor Cyan
            Write-Host "Banco: $($resetResponse.database)" -ForegroundColor Cyan
            Write-Host "Organization ID: $($resetResponse.organization_id)" -ForegroundColor Cyan
            Write-Host "Timestamp: $($resetResponse.timestamp)" -ForegroundColor Cyan
            
            Write-Host ""
            Write-Host "Estatisticas:" -ForegroundColor Blue
            Write-Host "  - Tabelas criadas: $($resetResponse.statistics.tables)" -ForegroundColor Cyan
            Write-Host "  - Indices criados: $($resetResponse.statistics.indexes)" -ForegroundColor Cyan
            Write-Host "  - Organizacoes: $($resetResponse.statistics.organizations)" -ForegroundColor Cyan
            Write-Host "  - Usuarios: $($resetResponse.statistics.users)" -ForegroundColor Cyan
            Write-Host "  - Politicas: $($resetResponse.statistics.policies)" -ForegroundColor Cyan
            Write-Host "  - Dispositivos demo: $($resetResponse.statistics.demo_devices)" -ForegroundColor Cyan
            
        } else {
            Write-Host "ERRO no reset do banco!" -ForegroundColor Red
            Write-Host "Detalhes: $($resetResponse.details)" -ForegroundColor Red
            Write-Host "Estagio: $($resetResponse.stage)" -ForegroundColor Red
        }
        
    } catch {
        Write-Host "ERRO na comunicacao com API:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
} else {
    Write-Host "Reset cancelado pelo usuario" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "3. Verificando status final..." -ForegroundColor Yellow

try {
    $finalResponse = Invoke-ApiRequest -Url "$BaseUrl/api/admin/reset-database" -Method "GET"
    
    if ($finalResponse.success) {
        Write-Host "Status final: $($finalResponse.status)" -ForegroundColor Green
        Write-Host "Conexao: OK" -ForegroundColor Green
        Write-Host "Ultima verificacao: $($finalResponse.last_check)" -ForegroundColor Cyan
        
        Write-Host ""
        Write-Host "Contagem final de registros:" -ForegroundColor Blue
        foreach ($key in $finalResponse.record_counts.PSObject.Properties.Name) {
            $count = $finalResponse.record_counts.$key
            if ($count -match "N/A") {
                Write-Host "  - $key : $count" -ForegroundColor Red
            } else {
                Write-Host "  - $key : $count" -ForegroundColor Green
            }
        }
    } else {
        Write-Host "Problema na verificacao final" -ForegroundColor Red
    }
} catch {
    Write-Host "Erro na verificacao final: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "TESTE DE BANCO DE DADOS CONCLUIDO!" -ForegroundColor Blue
Write-Host "==================================" -ForegroundColor Blue
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor White
Write-Host "1. Acesse: $BaseUrl/pending-devices" -ForegroundColor Gray
Write-Host "2. Teste a geracao de codigos" -ForegroundColor Gray
Write-Host "3. Verifique a lista de dispositivos" -ForegroundColor Gray
Write-Host "4. Teste o sistema de pareamento" -ForegroundColor Gray