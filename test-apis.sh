#!/bin/bash
# ===============================================
# FRIAXIS v4.0.0 - SCRIPT DE TESTE DE API
# Aguarda servidor estar pronto antes de testar
# ===============================================

echo "🚀 FRIAXIS - Teste de APIs"
echo "=========================="

# Função para testar se servidor está respondendo
test_server() {
    local url="$1"
    local max_attempts=30
    local attempt=1
    
    echo "🔄 Aguardando servidor em $url..."
    
    while [ $attempt -le $max_attempts ]; do
        echo "📡 Tentativa $attempt/$max_attempts..."
        
        # Tentar conectar (timeout 5s)
        if curl -s --connect-timeout 5 "$url" > /dev/null 2>&1; then
            echo "✅ Servidor respondendo!"
            return 0
        fi
        
        sleep 2
        ((attempt++))
    done
    
    echo "❌ Servidor não respondeu após ${max_attempts} tentativas"
    return 1
}

# Função para testar API específica
test_api() {
    local endpoint="$1"
    local description="$2"
    
    echo ""
    echo "🧪 Testando: $description"
    echo "📍 Endpoint: $endpoint"
    
    # Fazer requisição e capturar resposta
    response=$(curl -s -w "\n%{http_code}" "$endpoint" 2>/dev/null)
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "200" ]; then
        echo "✅ Status: $http_code (OK)"
        echo "📄 Response: $body" | head -c 200
        if [ ${#body} -gt 200 ]; then
            echo "... (truncated)"
        fi
    else
        echo "❌ Status: $http_code"
        echo "📄 Error: $body"
    fi
}

# URL base
BASE_URL="http://localhost:3000"

# Testar se servidor está online
if test_server "$BASE_URL"; then
    echo ""
    echo "🧪 EXECUTANDO TESTES DE API:"
    echo "============================"
    
    # Teste 1: Homepage
    test_api "$BASE_URL" "Homepage"
    
    # Teste 2: Status do banco
    test_api "$BASE_URL/api/admin/reset-database" "Status do banco de dados"
    
    # Teste 3: Dispositivos pendentes
    test_api "$BASE_URL/api/admin/pending-devices" "Dispositivos pendentes"
    
    # Teste 4: Gerar código
    echo ""
    echo "🧪 Testando: Gerar código de pareamento"
    echo "📍 Endpoint: POST $BASE_URL/api/admin/generate-code"
    
    generate_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d '{"description": "Teste automatizado", "duration": 1}' \
        -w "\n%{http_code}" \
        "$BASE_URL/api/admin/generate-code" 2>/dev/null)
    
    generate_code=$(echo "$generate_response" | tail -n1)
    generate_body=$(echo "$generate_response" | head -n -1)
    
    if [ "$generate_code" = "201" ]; then
        echo "✅ Status: $generate_code (Created)"
        echo "📄 Response: $generate_body"
    else
        echo "❌ Status: $generate_code"
        echo "📄 Error: $generate_body"
    fi
    
    echo ""
    echo "✅ TESTES CONCLUÍDOS!"
    
else
    echo ""
    echo "❌ ERRO: Servidor não está respondendo"
    echo "💡 Certifique-se de que o servidor está rodando:"
    echo "   cd apps/web && pnpm run dev"
fi