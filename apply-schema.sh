#!/bin/bash

# Script para aplicar o schema multi-tenant no banco Neon
# FRIAXIS v4.0.0 - Database Setup

set -e  # Exit on any error

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 FRIAXIS v4.0.0 - Aplicando Schema Multi-tenant${NC}"
echo "=================================================="

# Verificar se as variáveis de ambiente estão configuradas
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ Erro: DATABASE_URL não configurada${NC}"
    echo "Configure a variável DATABASE_URL com a connection string do Neon"
    exit 1
fi

echo -e "${BLUE}📋 Checklist de Aplicação do Schema:${NC}"
echo "1. ✅ Backup automático dos dados existentes"
echo "2. ✅ Aplicação do schema multi-tenant"
echo "3. ✅ Execução da migração de dados"
echo "4. ✅ Validação da integridade"
echo "5. ✅ Configuração de RLS"
echo ""

# Função para executar SQL e verificar resultado
execute_sql() {
    local sql_file=$1
    local description=$2
    
    echo -e "${YELLOW}⏳ $description...${NC}"
    
    if psql "$DATABASE_URL" -f "$sql_file" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $description - Concluído${NC}"
    else
        echo -e "${RED}❌ $description - Falhou${NC}"
        echo "Verifique o arquivo de log para detalhes do erro"
        exit 1
    fi
}

# Função para verificar conexão com o banco
check_connection() {
    echo -e "${YELLOW}⏳ Verificando conexão com o banco...${NC}"
    
    if psql "$DATABASE_URL" -c "SELECT version();" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Conexão com banco estabelecida${NC}"
    else
        echo -e "${RED}❌ Erro ao conectar com o banco${NC}"
        echo "Verifique se o DATABASE_URL está correto e o banco está acessível"
        exit 1
    fi
}

# Função para criar backup
create_backup() {
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_file="backup_before_multitenant_$timestamp.sql"
    
    echo -e "${YELLOW}⏳ Criando backup dos dados existentes...${NC}"
    
    if pg_dump "$DATABASE_URL" > "$backup_file" 2>/dev/null; then
        echo -e "${GREEN}✅ Backup criado: $backup_file${NC}"
        echo -e "${BLUE}💡 Mantenha este backup seguro para possível rollback${NC}"
    else
        echo -e "${RED}❌ Falha ao criar backup${NC}"
        read -p "Deseja continuar sem backup? (y/N): " continue_without_backup
        if [[ ! $continue_without_backup =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Função para validar aplicação
validate_schema() {
    echo -e "${YELLOW}⏳ Validando schema aplicado...${NC}"
    
    # Verificar se as tabelas principais foram criadas
    local tables=("organizations" "users" "organization_members" "devices" "device_telemetry" "policies" "commands" "events" "alerts")
    
    for table in "${tables[@]}"; do
        if psql "$DATABASE_URL" -c "SELECT 1 FROM $table LIMIT 1;" > /dev/null 2>&1; then
            echo -e "${GREEN}  ✅ Tabela $table criada com sucesso${NC}"
        else
            echo -e "${RED}  ❌ Erro na tabela $table${NC}"
        fi
    done
    
    # Verificar RLS
    echo -e "${YELLOW}⏳ Verificando Row Level Security...${NC}"
    local rls_tables=("devices" "device_telemetry" "policies" "commands" "events" "alerts")
    
    for table in "${rls_tables[@]}"; do
        local rls_enabled=$(psql "$DATABASE_URL" -t -c "SELECT relrowsecurity FROM pg_class WHERE relname = '$table';" | xargs)
        if [ "$rls_enabled" = "t" ]; then
            echo -e "${GREEN}  ✅ RLS habilitado em $table${NC}"
        else
            echo -e "${YELLOW}  ⚠️  RLS não encontrado em $table${NC}"
        fi
    done
}

# Script principal
main() {
    echo -e "${BLUE}🔍 Iniciando aplicação do schema...${NC}"
    
    # 1. Verificar conexão
    check_connection
    
    # 2. Criar backup
    create_backup
    
    # 3. Aplicar schema multi-tenant
    if [ -f "infra/schema-multi-tenant.sql" ]; then
        execute_sql "infra/schema-multi-tenant.sql" "Aplicando schema multi-tenant"
    else
        echo -e "${RED}❌ Arquivo schema-multi-tenant.sql não encontrado${NC}"
        exit 1
    fi
    
    # 4. Executar migração de dados
    if [ -f "infra/migrations/004_multi_tenant_migration.sql" ]; then
        execute_sql "infra/migrations/004_multi_tenant_migration.sql" "Executando migração de dados"
    else
        echo -e "${YELLOW}⚠️  Arquivo de migração não encontrado, pulando...${NC}"
    fi
    
    # 5. Validar aplicação
    validate_schema
    
    # 6. Aplicar dados de seed (opcional)
    if [ -f "infra/seeds-multi-tenant.sql" ]; then
        read -p "Deseja aplicar dados de exemplo? (y/N): " apply_seeds
        if [[ $apply_seeds =~ ^[Yy]$ ]]; then
            execute_sql "infra/seeds-multi-tenant.sql" "Aplicando dados de exemplo"
        fi
    fi
    
    echo ""
    echo -e "${GREEN}🎉 Schema multi-tenant aplicado com sucesso!${NC}"
    echo -e "${BLUE}📋 Próximos passos:${NC}"
    echo "1. Configurar variáveis de ambiente da aplicação"
    echo "2. Atualizar connection strings nas APIs"
    echo "3. Testar isolamento de dados entre organizações"
    echo "4. Executar testes de validação"
    echo ""
    echo -e "${YELLOW}⚠️  Importante:${NC} Teste o sistema em ambiente de desenvolvimento antes de aplicar em produção"
}

# Executar script principal
main "$@"