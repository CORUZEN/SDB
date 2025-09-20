#!/bin/bash
# ===============================================
# FRIAXIS v4.0.0 - ENVIRONMENT SETUP SCRIPT
# ===============================================

echo "🚀 FRIAXIS v4.0.0 - Environment Setup"
echo "======================================"

# Detectar sistema operacional
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    COPY_CMD="copy"
    SEP="\\"
else
    COPY_CMD="cp"
    SEP="/"
fi

# Diretório web
WEB_DIR="apps${SEP}web"

echo ""
echo "📁 Configurando environments no diretório: $WEB_DIR"

# Verificar se existe .env.local
if [ -f "$WEB_DIR/.env.local" ]; then
    echo "✅ .env.local já existe (desenvolvimento local)"
else
    echo "⚠️  .env.local não encontrado"
    echo "💡 Você pode copiar de .env.example se necessário"
fi

# Verificar se existe .env
if [ -f "$WEB_DIR/.env" ]; then
    echo "✅ .env existe (template para produção)"
else
    echo "❌ .env não encontrado"
    echo "🔧 Criando .env a partir do .env.example..."
    if [ -f "$WEB_DIR/.env.example" ]; then
        $COPY_CMD "$WEB_DIR/.env.example" "$WEB_DIR/.env"
        echo "✅ .env criado com sucesso"
    else
        echo "❌ .env.example não encontrado"
    fi
fi

# Verificar .gitignore
echo ""
echo "🔒 Verificando proteção de arquivos sensíveis..."

if grep -q ".env.local" .gitignore; then
    echo "✅ .env.local protegido no .gitignore"
else
    echo "⚠️  Adicionando .env.local ao .gitignore..."
    echo ".env.local" >> .gitignore
fi

echo ""
echo "📋 RESUMO DOS ARQUIVOS DE ENVIRONMENT:"
echo "======================================"

echo ""
echo "🏠 DESENVOLVIMENTO LOCAL:"
if [ -f "$WEB_DIR/.env.local" ]; then
    echo "   ✅ .env.local (usado pelo pnpm run dev)"
else
    echo "   ❌ .env.local (necessário para desenvolvimento)"
fi

echo ""
echo "🚀 PRODUÇÃO/VERCEL:"
if [ -f "$WEB_DIR/.env" ]; then
    echo "   ✅ .env (template - NÃO usado pelo Vercel)"
else
    echo "   ❌ .env (template necessário)"
fi

echo "   📝 Environment Variables no Vercel Dashboard (usado em produção)"

echo ""
echo "🧪 STAGING:"
if [ -f "$WEB_DIR/.env.staging" ]; then
    echo "   ✅ .env.staging (template para homologação)"
else
    echo "   ❌ .env.staging (opcional)"
fi

echo ""
echo "📝 PRÓXIMOS PASSOS:"
echo "=================="
echo ""
echo "1. 🏠 DESENVOLVIMENTO LOCAL:"
echo "   cd $WEB_DIR"
echo "   # Editar .env.local com seus dados reais"
echo "   pnpm run dev"
echo ""
echo "2. 🚀 DEPLOYMENT VERCEL:"
echo "   # Push para GitHub"
echo "   git add ."
echo "   git commit -m \"feat: configurar environments\""
echo "   git push origin main"
echo ""
echo "   # Configurar no Vercel Dashboard:"
echo "   # https://vercel.com/dashboard → Settings → Environment Variables"
echo "   # Copiar TODAS as variáveis do .env.local"
echo ""
echo "3. 🌐 DOMÍNIO PERSONALIZADO:"
echo "   # Vercel Dashboard → Settings → Domains"
echo "   # Adicionar: friaxis.coruzen.com"
echo ""
echo "✅ SETUP CONCLUÍDO!"