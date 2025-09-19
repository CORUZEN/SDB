# Script PowerShell para aplicar o schema multi-tenant no banco Neon
# FRIAXIS v4.0.0 - Database Setup

param(
    [switch]$Force,
    [switch]$SkipBackup,
    [string]$DatabaseUrl = $env:DATABASE_URL
)

# Configurações
$ErrorActionPreference = "Stop"

# Cores para output
$Colors = @{
    Red = "Red"
    Green = "Green"
    Blue = "Cyan"
    Yellow = "Yellow"
    White = "White"
}

function Write-ColorText {
    param($Text, $Color = "White")
    Write-Host $Text -ForegroundColor $Colors[$Color]
}

function Write-Header {
    Write-ColorText "🚀 FRIAXIS v4.0.0 - Aplicando Schema Multi-tenant" "Blue"
    Write-ColorText "==================================================" "Blue"
    Write-Host ""
}

function Test-DatabaseConnection {
    Write-ColorText "⏳ Verificando conexão com o banco..." "Yellow"
    
    if (-not $DatabaseUrl) {
        Write-ColorText "❌ Erro: DATABASE_URL não configurada" "Red"
        Write-ColorText "Configure a variável DATABASE_URL com a connection string do Neon" "White"
        exit 1
    }
    
    try {
        # Testar conexão usando psql
        $testQuery = "SELECT version();"
        $result = & psql $DatabaseUrl -c $testQuery 2>$null
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorText "✅ Conexão com banco estabelecida" "Green"
            return $true
        }
    }
    catch {
        Write-ColorText "❌ Erro ao conectar com o banco" "Red"
        Write-ColorText "Verifique se o DATABASE_URL está correto e o banco está acessível" "White"
        Write-ColorText "Erro: $($_.Exception.Message)" "Red"
        exit 1
    }
}

function New-DatabaseBackup {
    if ($SkipBackup) {
        Write-ColorText "⚠️ Pulando backup (SkipBackup especificado)" "Yellow"
        return
    }
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = "backup_before_multitenant_$timestamp.sql"
    
    Write-ColorText "⏳ Criando backup dos dados existentes..." "Yellow"
    
    try {
        & pg_dump $DatabaseUrl > $backupFile
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorText "✅ Backup criado: $backupFile" "Green"
            Write-ColorText "💡 Mantenha este backup seguro para possível rollback" "Blue"
        }
        else {
            Write-ColorText "❌ Falha ao criar backup" "Red"
            
            if (-not $Force) {
                $continue = Read-Host "Deseja continuar sem backup? (y/N)"
                if ($continue -notmatch "^[Yy]$") {
                    exit 1
                }
            }
        }
    }
    catch {
        Write-ColorText "❌ Erro ao criar backup: $($_.Exception.Message)" "Red"
        if (-not $Force) {
            exit 1
        }
    }
}

function Invoke-SqlFile {
    param($FilePath, $Description)
    
    Write-ColorText "⏳ $Description..." "Yellow"
    
    if (-not (Test-Path $FilePath)) {
        Write-ColorText "❌ Arquivo não encontrado: $FilePath" "Red"
        return $false
    }
    
    try {
        & psql $DatabaseUrl -f $FilePath > $null 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorText "✅ $Description - Concluído" "Green"
            return $true
        }
        else {
            Write-ColorText "❌ $Description - Falhou" "Red"
            return $false
        }
    }
    catch {
        Write-ColorText "❌ $Description - Erro: $($_.Exception.Message)" "Red"
        return $false
    }
}

function Test-SchemaValidation {
    Write-ColorText "⏳ Validando schema aplicado..." "Yellow"
    
    # Verificar tabelas principais
    $tables = @("organizations", "users", "organization_members", "devices", "device_telemetry", "policies", "commands", "events", "alerts")
    
    foreach ($table in $tables) {
        try {
            & psql $DatabaseUrl -c "SELECT 1 FROM $table LIMIT 1;" > $null 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-ColorText "  ✅ Tabela $table criada com sucesso" "Green"
            }
            else {
                Write-ColorText "  ❌ Erro na tabela $table" "Red"
            }
        }
        catch {
            Write-ColorText "  ❌ Erro ao verificar tabela $table" "Red"
        }
    }
    
    # Verificar RLS
    Write-ColorText "⏳ Verificando Row Level Security..." "Yellow"
    $rlsTables = @("devices", "device_telemetry", "policies", "commands", "events", "alerts")
    
    foreach ($table in $rlsTables) {
        try {
            $query = "SELECT relrowsecurity FROM pg_class WHERE relname = '$table';"
            $result = & psql $DatabaseUrl -t -c $query | ForEach-Object { $_.Trim() }
            
            if ($result -eq "t") {
                Write-ColorText "  ✅ RLS habilitado em $table" "Green"
            }
            else {
                Write-ColorText "  ⚠️ RLS não encontrado em $table" "Yellow"
            }
        }
        catch {
            Write-ColorText "  ❌ Erro ao verificar RLS em $table" "Red"
        }
    }
}

function Show-PostInstallInfo {
    Write-Host ""
    Write-ColorText "🎉 Schema multi-tenant aplicado com sucesso!" "Green"
    Write-ColorText "📋 Próximos passos:" "Blue"
    Write-Host "1. Configurar variáveis de ambiente da aplicação"
    Write-Host "2. Atualizar connection strings nas APIs"
    Write-Host "3. Testar isolamento de dados entre organizações"
    Write-Host "4. Executar testes de validação"
    Write-Host ""
    Write-ColorText "⚠️ Importante: Teste o sistema em ambiente de desenvolvimento antes de aplicar em produção" "Yellow"
}

# Script principal
function Main {
    Write-Header
    
    Write-ColorText "📋 Checklist de Aplicação do Schema:" "Blue"
    Write-Host "1. ✅ Backup automático dos dados existentes"
    Write-Host "2. ✅ Aplicação do schema multi-tenant"
    Write-Host "3. ✅ Execução da migração de dados"
    Write-Host "4. ✅ Validação da integridade"
    Write-Host "5. ✅ Configuração de RLS"
    Write-Host ""
    
    # 1. Verificar conexão
    Test-DatabaseConnection
    
    # 2. Criar backup
    New-DatabaseBackup
    
    # 3. Aplicar schema multi-tenant
    $schemaApplied = Invoke-SqlFile "infra/schema-multi-tenant.sql" "Aplicando schema multi-tenant"
    if (-not $schemaApplied) {
        Write-ColorText "❌ Falha ao aplicar schema. Abortando." "Red"
        exit 1
    }
    
    # 4. Executar migração de dados
    if (Test-Path "infra/migrations/004_multi_tenant_migration.sql") {
        $migrationApplied = Invoke-SqlFile "infra/migrations/004_multi_tenant_migration.sql" "Executando migração de dados"
        if (-not $migrationApplied) {
            Write-ColorText "⚠️ Migração de dados falhou, mas schema foi aplicado" "Yellow"
        }
    }
    else {
        Write-ColorText "⚠️ Arquivo de migração não encontrado, pulando..." "Yellow"
    }
    
    # 5. Validar aplicação
    Test-SchemaValidation
    
    # 6. Aplicar dados de seed (opcional)
    if (Test-Path "infra/seeds-multi-tenant.sql") {
        $applySeeds = Read-Host "Deseja aplicar dados de exemplo? (y/N)"
        if ($applySeeds -match "^[Yy]$") {
            Invoke-SqlFile "infra/seeds-multi-tenant.sql" "Aplicando dados de exemplo"
        }
    }
    
    # 7. Mostrar informações finais
    Show-PostInstallInfo
}

# Verificar se psql está disponível
if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
    Write-ColorText "❌ psql não encontrado. Instale o PostgreSQL client." "Red"
    Write-ColorText "Download: https://www.postgresql.org/download/windows/" "White"
    exit 1
}

if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
    Write-ColorText "❌ pg_dump não encontrado. Instale o PostgreSQL client." "Red"
    exit 1
}

# Executar script principal
Main