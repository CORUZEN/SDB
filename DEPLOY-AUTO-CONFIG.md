# 🚀 CONFIGURAÇÃO DEPLOY AUTOMÁTICO VERCEL

## 📋 Problema Identificado
O GitHub não está fazendo deploy automático para o Vercel porque **falta a integração** entre os dois serviços.

## 🎯 Soluções Disponíveis

### **✅ OPÇÃO 1: Integração Vercel-GitHub (RECOMENDADA)**

1. **Acesse o Dashboard do Vercel**:
   - Vá para: https://vercel.com/dashboard
   - Faça login com sua conta

2. **Importe o Repositório**:
   - Clique em "Add New..." → "Project"
   - Conecte sua conta GitHub se necessário
   - Selecione o repositório `CORUZEN/SDB`
   - Configure o projeto:
     ```
     Framework Preset: Next.js
     Build Command: cd apps/web && pnpm build
     Output Directory: apps/web/.next
     Install Command: pnpm install --no-frozen-lockfile
     ```

3. **Configurar Environment Variables**:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=sua_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=sdb-sistema-de-bloqueio.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=sdb-sistema-de-bloqueio
   DATABASE_URL=sua_neon_database_url
   FIREBASE_PRIVATE_KEY=sua_firebase_private_key
   FIREBASE_CLIENT_EMAIL=seu_firebase_client_email
   ```

4. **Deploy Inicial**:
   - Clique em "Deploy"
   - A partir daí, **TODOS os pushes para `main` farão deploy automático**

### **🔧 OPÇÃO 2: GitHub Actions (ALTERNATIVA)**

Se preferir usar GitHub Actions, você precisa configurar secrets:

1. **No GitHub**:
   - Vá para: `Settings` → `Secrets and variables` → `Actions`
   - Adicione os secrets:
     ```
     VERCEL_TOKEN: seu_vercel_token
     VERCEL_ORG_ID: seu_org_id  
     VERCEL_PROJECT_ID: seu_project_id
     ```

2. **Obter Vercel Token**:
   - Acesse: https://vercel.com/account/tokens
   - Crie um novo token
   - Copie para `VERCEL_TOKEN`

3. **Obter IDs do Projeto**:
   ```bash
   npx vercel link
   cat .vercel/project.json
   ```

## 🎯 Status Atual

✅ **Workflow criado**: `.github/workflows/deploy-vercel.yml`  
✅ **Build local**: Funcionando perfeitamente  
✅ **Push GitHub**: Funcionando  
❌ **Deploy automático**: Aguardando configuração da integração

## 🚀 Próximos Passos

1. **Configure a integração Vercel-GitHub** (Opção 1)
2. **OU** configure os secrets do GitHub Actions (Opção 2)
3. **Teste** fazendo um push para `main`

## 🔍 Verificações

Após configurar, você pode verificar:

- **Vercel Dashboard**: https://vercel.com/dashboard
- **GitHub Actions**: https://github.com/CORUZEN/SDB/actions
- **Site em produção**: https://sdb.coruzen.com

## 📝 Notas Importantes

- O **build local está funcionando perfeitamente**
- Apenas a **integração de deploy** que precisa ser configurada
- Uma vez configurada, será **100% automática** para futuros pushes