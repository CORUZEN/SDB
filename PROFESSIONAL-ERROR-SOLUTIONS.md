# 🛠️ FRIAXIS v4.0.0 - GUIA PROFISSIONAL DE RESOLUÇÃO DE ERROS

## 📋 **PROBLEMAS IDENTIFICADOS E SOLUÇÕES**

### 1. **❌ Error: Cannot find module 'dotenv'**

**CAUSA**: Módulo não instalado no contexto correto do workspace

**SOLUÇÃO PROFISSIONAL**:
```bash
# Sempre usar pnpm em projetos com workspace
cd C:\SDB-clean-clone
pnpm install

# Para instalação isolada em subprojetos:
cd C:\SDB-clean-clone\tools
npm install dotenv postgres
```

### 2. **❌ npm error code EUNSUPPORTEDPROTOCOL**

**CAUSA**: Tentativa de usar `npm` em projeto configurado para `pnpm workspace`

**SOLUÇÃO PROFISSIONAL**:
```bash
# ✅ CORRETO - Usar pnpm consistentemente
pnpm install
pnpm add package-name
pnpm run dev

# ❌ INCORRETO - Evitar npm em workspaces pnpm
npm install  # Causa erro EUNSUPPORTEDPROTOCOL
```

### 3. **❌ Warnings de dependências depreciadas**

**CAUSA**: Packages antigos no projeto

**SOLUÇÃO PROFISSIONAL**:
```bash
# Atualizar dependências automaticamente
pnpm update

# Verificar dependências desatualizadas
pnpm outdated

# Atualizar manualmente packages específicos
pnpm add eslint@latest
```

### 4. **❌ Database connection errors (ECONNRESET)**

**CAUSA**: Problemas de conectividade ou configuração incorreta

**SOLUÇÃO PROFISSIONAL**:
```bash
# 1. Verificar arquivo .env
ls apps/web/.env

# 2. Testar conectividade
node tools/verify-database.js

# 3. Verificar credenciais Neon
# Acessar https://console.neon.tech/
```

---

## 🏗️ **ESTRUTURA PROFISSIONAL DE PROJETO**

### **Organização de Dependências**
```
📁 SDB-clean-clone/
├── 📄 pnpm-workspace.yaml    # Configuração workspace
├── 📄 pnpm-lock.yaml         # Lock file principal
├── 📁 apps/
│   ├── 📁 web/
│   │   ├── 📄 package.json   # Dependências web
│   │   ├── 📄 .env          # Variáveis ambiente
│   │   └── 📁 node_modules/ # Módulos específicos
│   └── 📁 android/
└── 📁 tools/
    ├── 📄 package.json       # Dependências ferramentas
    └── 📁 node_modules/     # Módulos isolados
```

### **Comandos Profissionais**
```bash
# Instalação limpa completa
pnpm install --frozen-lockfile

# Desenvolvimento
pnpm run dev

# Build de produção
pnpm run build

# Verificação de dependências
pnpm audit

# Limpeza completa
rm -rf node_modules apps/*/node_modules
pnpm install
```

---

## 🔧 **CONFIGURAÇÃO ENVIRONMENT PROFISSIONAL**

### **1. Arquivo .env Estruturado**
```env
# ===============================================
# FRIAXIS v4.0.0 - PRODUCTION ENVIRONMENT
# ===============================================

# 🔗 DATABASE
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# 🔥 FIREBASE
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_PROJECT_ID="friaxis-prod"

# 🌐 APPLICATION
NEXT_PUBLIC_APP_NAME="FRIAXIS"
NODE_ENV="production"
```

### **2. Múltiplos Ambientes**
```
📁 environments/
├── 📄 .env.development    # Desenvolvimento
├── 📄 .env.staging       # Homologação
├── 📄 .env.production    # Produção
└── 📄 .env.example       # Template
```

---

## 🧪 **SCRIPTS DE VERIFICAÇÃO PROFISSIONAIS**

### **1. Verificação de Banco de Dados**
```javascript
// tools/verify-database.js
import postgres from 'postgres';

async function verificarBanco() {
  const sql = postgres(process.env.DATABASE_URL);
  
  try {
    await sql`SELECT 1`;
    console.log('✅ Banco conectado');
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}
```

### **2. Verificação de Dependências**
```bash
#!/bin/bash
# scripts/check-dependencies.sh

echo "🔍 Verificando dependências..."

# Verificar pnpm
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm não instalado"
    exit 1
fi

# Verificar lockfile
if [ ! -f "pnpm-lock.yaml" ]; then
    echo "❌ pnpm-lock.yaml não encontrado"
    exit 1
fi

echo "✅ Dependências OK"
```

---

## 🎯 **BOAS PRÁTICAS PROFISSIONAIS**

### **1. Gerenciamento de Dependências**
- ✅ **Usar pnpm** consistentemente em todo projeto
- ✅ **Lockfile commitado** no repositório
- ✅ **Node version fixo** via .nvmrc
- ✅ **Dependências específicas** por workspace

### **2. Environment Configuration**
- ✅ **Múltiplos .env** por ambiente
- ✅ **Validação de variáveis** obrigatórias
- ✅ **Secrets management** seguro
- ✅ **Documentação completa** das variáveis

### **3. Error Handling**
- ✅ **Logs estruturados** com níveis
- ✅ **Retry mechanisms** para falhas temporárias
- ✅ **Graceful degradation** quando possível
- ✅ **Monitoring e alertas** em produção

### **4. Development Experience**
- ✅ **Scripts automatizados** para tarefas comuns
- ✅ **Hot reload** configurado
- ✅ **Debugging setup** para IDEs
- ✅ **Documentação atualizada** sempre

---

## 🚀 **DEPLOYMENT PROFISSIONAL**

### **1. Pipeline CI/CD**
```yaml
# .github/workflows/deploy.yml
name: Deploy FRIAXIS
on: [push]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install --frozen-lockfile
      - run: pnpm run build
      - run: pnpm run test
```

### **2. Health Checks**
```javascript
// API health check endpoint
export async function GET() {
  const sql = postgres(process.env.DATABASE_URL);
  
  try {
    await sql`SELECT 1`;
    return Response.json({ status: 'healthy' });
  } catch (error) {
    return Response.json({ status: 'unhealthy' }, { status: 503 });
  }
}
```

---

**✅ TODAS AS SOLUÇÕES IMPLEMENTADAS PROFISSIONALMENTE!**