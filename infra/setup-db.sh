#!/usr/bin/env bash
set -euo pipefail

# =========================
# SDB Database Setup Script
# =========================
# Script para configurar o banco Neon Postgres com schemas e dados iniciais
#
# Requisitos:
# - Variável DATABASE_URL configurada
# - psql instalado (ou usar via Docker)
#
# Uso:
#   ./setup-db.sh [--reset] [--seeds]
#
# Flags:
#   --reset  : DROP e recria todas as tabelas
#   --seeds  : Insere dados de exemplo após migrations
# =========================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESET_DB=false
INSERT_SEEDS=false

# Parse argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        --reset)
            RESET_DB=true
            shift
            ;;
        --seeds)
            INSERT_SEEDS=true
            shift
            ;;
        *)
            echo "Uso: $0 [--reset] [--seeds]"
            exit 1
            ;;
    esac
done

# Cores para output
red() { echo -e "\033[31m$*\033[0m"; }
green() { echo -e "\033[32m$*\033[0m"; }
yellow() { echo -e "\033[33m$*\033[0m"; }
cyan() { echo -e "\033[36m$*\033[0m"; }

# Verificar se DATABASE_URL está configurada
if [[ -z "${DATABASE_URL:-}" ]]; then
    red "❌ Erro: DATABASE_URL não está configurada"
    echo "Configure a variável de ambiente DATABASE_URL com a connection string do Neon:"
    echo "  export DATABASE_URL='postgresql://username:password@ep-xxx.neon.tech/sdb?sslmode=require'"
    exit 1
fi

cyan "🗄️  Configurando banco de dados SDB..."
echo "DATABASE_URL: ${DATABASE_URL:0:30}...***"

# Função para executar SQL
run_sql() {
    local file="$1"
    local description="$2"
    
    if [[ ! -f "$file" ]]; then
        red "❌ Arquivo não encontrado: $file"
        return 1
    fi
    
    cyan "$description"
    if psql "$DATABASE_URL" -f "$file" -v ON_ERROR_STOP=1; then
        green "✅ $description - concluído"
    else
        red "❌ $description - falhou"
        return 1
    fi
}

# Reset database se solicitado
if [[ "$RESET_DB" == "true" ]]; then
    yellow "⚠️  Fazendo reset do banco (DROP ALL TABLES)..."
    cat << 'EOF' | psql "$DATABASE_URL" -v ON_ERROR_STOP=1
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS events CASCADE; 
DROP TABLE IF EXISTS commands CASCADE;
DROP TABLE IF EXISTS device_policies CASCADE;
DROP TABLE IF EXISTS policies CASCADE;
DROP TABLE IF EXISTS devices CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
EOF
    green "✅ Reset concluído"
fi

# Executar migrations
cyan "📋 Executando migrations..."
run_sql "$SCRIPT_DIR/schema.sql" "Criando schema principal"

# Inserir dados de exemplo se solicitado
if [[ "$INSERT_SEEDS" == "true" ]]; then
    run_sql "$SCRIPT_DIR/seeds.sql" "Inserindo dados de exemplo"
fi

# Verificar se tabelas foram criadas
cyan "🔍 Verificando estrutura do banco..."
TABLES=$(psql "$DATABASE_URL" -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;")

if [[ -n "$TABLES" ]]; then
    green "✅ Tabelas criadas com sucesso:"
    echo "$TABLES" | sed 's/^/ - /'
else
    red "❌ Nenhuma tabela encontrada"
    exit 1
fi

# Verificar dados se seeds foram inseridos
if [[ "$INSERT_SEEDS" == "true" ]]; then
    cyan "📊 Verificando dados inseridos..."
    
    DEVICE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM devices;")
    POLICY_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM policies;")
    USER_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM users;")
    
    echo "Dados inseridos:"
    echo " - Dispositivos: $DEVICE_COUNT"
    echo " - Políticas: $POLICY_COUNT"  
    echo " - Usuários: $USER_COUNT"
fi

green "🎉 Setup do banco de dados concluído com sucesso!"
echo
echo "Próximos passos:"
echo "1. Configure as variáveis do Firebase no Vercel"
echo "2. Teste a conexão via /api/dbtest"
echo "3. Implemente autenticação Firebase"