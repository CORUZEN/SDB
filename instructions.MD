# INSTRUCTIONS — FRIAXIS (Gestão de Dispositivos) • MDM Android Corporativo

**Stack:** Next.js (Vercel) + Neon (Postgres) + Firebase (Auth + FCM) + APK (Launcher+Agente)  
**Regras:** Sem realtime contínuo • Localização sob demanda • Captura de tela assistida (com consentimento) • Multi-tenant (multi-empresa)

---

## 🚀 Guia Operacional (Comandos Essenciais)

### **💻 Desenvolvimento Web**
```powershell
# Iniciar servidor de desenvolvimento (CORRETO)
pnpm dev:web                    # A partir da raiz do monorepo

# ❌ EVITAR: cd apps/web && pnpm dev (não funciona corretamente)
# ✅ USAR: pnpm dev:web da raiz

# Build para produção
pnpm --filter @sdb/web build

# Instalar dependências
pnpm install                    # Na raiz instala tudo
```

### **📱 Compilação Android**
```powershell
# Método automatizado (RECOMENDADO)
.\build-apk-final.ps1          # Script completo com validações

# Método manual (se script falhar)
cd apps/android
.\gradlew.bat clean            # Limpar build anterior
.\gradlew.bat assembleDebug    # Compilar APK debug
Copy-Item "app/build/outputs/apk/debug/app-debug.apk" "../../SDB-Mobile-debug.apk" -Force
cd ..\..

# Verificar APK gerado
Get-ChildItem SDB-Mobile-debug.apk
```

### **🔧 Configuração Firebase**
```json
# Localização: apps/android/app/google-services.json
# Atualizar sempre após mudanças no Firebase Console
# Recompilar APK após atualizações
```

### **🌐 Deploy e Testes**
```powershell
# Testar localmente
pnpm dev:web                   # Web em http://localhost:3000

# Deploy produção (automático)
git add . && git commit -m "feat: descrição" && git push origin main

# Verificar status do sistema
curl http://localhost:3000/api/health  # Local
curl https://friaxis.coruzen.com/api/health  # Produção
```

### **🗄️ Banco de Dados**
```sql
-- Executar migrações via API
POST /api/migrate              # Criar tabelas base
POST /api/migrate/device-registrations  # Tabela de pareamento

-- Verificar conexão
GET /api/dbtest               # Teste de conectividade
```

### **⚠️ Problemas Comuns**
- **PowerShell && erro**: Usar comandos separados ou `;` 
- **pnpm dev não funciona**: Sempre usar `pnpm dev:web` da raiz
- **APK não atualiza**: Fazer clean antes do build
- **Firebase auth erro**: Verificar domínios autorizados no console
- **Build warnings**: Usar `--no-frozen-lockfile` se necessário

---

## Papel do Assistente
Atue como **arquiteto(a) e dev sênior full-stack + Android**.  
Projete, implemente e documente um MDM enxuto para Android com:

- **Painel Web + API** (Next.js no Vercel)  
- **APK Android** (Launcher + Agente)  
- **Neon Postgres** como banco  
- **Firebase** para Auth (web) e FCM (push)

Priorize **simplicidade, segurança, baixo custo e eficiência**.

---

## Visão Geral
**O que é:**  
Solução MDM corporativa para Android com **launcher kiosque**, **políticas**, **gestão de apps**, **comandos sob demanda** e **localização quando solicitada**.

**Objetivo:**  
Controle corporativo com **baixo custo/complexidade**, sem rastrear 24/7.

**Vantagens:**  
Vercel/Neon free-tier, FCM gratuito, arquitetura serverless-friendly, escalável depois.

### Funcionalidades (MVP)
- **Launcher corporativo (kiosk):** Home com apps permitidos, Lock Task Mode, bloqueios de navegação/sistema (quando suportado).  
- **Políticas de segurança:** PIN mínimo, bloquear fontes desconhecidas, depuração USB, reset manual etc.  
- **Gestão de apps:** permitir/bloquear, instalar/atualizar/remover por política.  
- **Comandos remotos sob demanda:** LOCK/UNLOCK/WIPE/OPEN_ACTIVITY/PING.  
- **Localização sob demanda:** painel → comando → push (FCM) → GPS → resposta.  
- **Telemetria leve:** app ativo, bateria, OS/SSID, inventário básico.  
- **Logs & auditoria:** histórico de comandos/eventos, export simples (CSV).  
- **Captura de tela assistida:** MediaProjection com consentimento.

---

## Regras Inegociáveis
1. Sem rastreamento contínuo (somente sob demanda).  
2. Sem realtime permanente (usar FCM + polling curto).  
3. Captura de tela exige consentimento de sessão.  
4. Eficiência de bateria (serviços só quando necessários).  
5. Segurança/LGPD (RBAC, auditoria, retenção, HTTPS, segredos em envs).  
6. Serverless-friendly (Neon driver serverless).  
7. Padronização (Conventional Commits, semver, monorepo, CI).

---

## Arquitetura (2 peças + 2 serviços)
**Você desenvolve/publica:**  
1. Painel Web + API (Next.js/TypeScript no Vercel)  
2. APK Android (Kotlin: Launcher + Agente)

**Serviços de suporte:**  
3. Neon (Postgres) — dados de devices, políticas, comandos, logs, localizações  
4. Firebase — Auth e FCM

---

## Multi-Tenant (SaaS para várias empresas)
- Cada **empresa = organização (org)**.  
- Recursos isolados por `org_id`.  
- Usuários podem pertencer a múltiplas orgs com papéis (`admin`, `operator`, `viewer`).  
- Cobrança mensal via coruzen.com → checkout (Stripe/Mercado Pago).  
- Webhook de billing cria `organization` e `subscription`.  
- Org admins geram **tokens de matrícula** (QR provisioning) para devices.  
- **RLS no Postgres** garante isolamento.

### Tabelas adicionais
- `organizations`  
- `org_members`  
- `subscriptions`  
- `enrollment_tokens`

---

## Monorepo (PNPM Workspaces)
```
pnpm-workspace.yaml
/apps
  /web         # Next.js (painel + rotas /api)
  /android     # Android (Launcher + Agent - Kotlin)
/packages
  /shared      # DTOs, tipos, contratos de API, constantes
/infra         # Migrações (Prisma/Drizzle), seeds, scripts
/docs          # Guias (QR provision, LGPD, operação)
/.github/workflows
  web-ci.yml       # build/test web; preview; checks
  android-ci.yml   # build APK; release por tag
```

Branches: `main` (produção), `dev` (preview), `feature/*`.  
Releases: tags semânticas (ex.: v0.2.0) + APK anexado.  
CI: Vercel (web) + GitHub Actions (APK).

### **📂 Arquivos Críticos do Sistema**
```
📁 Configuração Firebase
├── apps/android/app/google-services.json     # Config Android (SECRET)
├── apps/web/lib/firebase-client.ts           # Config Web Client
└── apps/web/lib/firebase-admin.ts            # Config Web Server

📁 Scripts de Automação  
├── build-apk-final.ps1                       # Build APK completo
├── fix-api-routes.ps1                        # Corrigir routes dinâmicas
└── infra/setup-db.sh                         # Setup banco PostgreSQL

📁 Dados Compartilhados
├── packages/shared/types.ts                  # Tipos TypeScript
├── packages/shared/schemas.ts                # Validação Zod
└── packages/shared/constants.ts              # Constantes do sistema

📁 Banco de Dados
├── infra/schema.sql                          # Schema principal
├── infra/seeds.sql                           # Dados de exemplo
└── infra/migrations/                         # Migrações versionadas

📁 Deploy e CI/CD
├── .github/workflows/                        # GitHub Actions
├── vercel.json                               # Config Vercel (se necessário)
└── apps/web/next.config.mjs                  # Config Next.js
```

---

## Infraestrutura & Domínios
- **Produção:** `friaxis.coruzen.com` (branch main)  
- **Preview:** `friaxis-dev.coruzen.com` (branch dev)  
- **DNS:** subdomínios em `coruzen.com`  

### Fluxo de Deploy
1. Dev em `feature/*` → PR para `dev`.  
2. `dev` → deploy automático em Preview.  
3. Validado → merge `main` → produção.

---

## Modelagem de Dados
- `organizations`, `org_members`, `subscriptions`, `enrollment_tokens`  
- `devices`, `policies`, `device_policies`, `commands`, `events`, `locations`, `users`

---

## API (contrato mínimo)
- `POST /api/commands`  
- `GET /api/commands/:id`  
- `POST /api/devices/:id/report`  
- `POST /api/devices/:id/location`  
- `GET /api/devices`  
- `GET /api/devices/:id`  
- `POST /api/devices/:id/policy/apply`

Execução: painel cria comando → envia FCM → APK executa → responde → painel exibe resultado.

---

## Painel Web (Next.js)
- **Auth:** Firebase Auth (cliente) + verificação ID Token no servidor.  
- **RBAC:** papéis por organização (admin/operator/viewer).  
- **Páginas:**  
  - Login  
  - Dispositivos (lista, filtros)  
  - Detalhe (ações rápidas, mapa Leaflet/OSM, telemetria, apps)  
  - Políticas (CRUD/aplicar)  
  - Logs/Auditoria (export CSV)  
- **Boas práticas:** Tailwind + shadcn/ui, DTOs em `/packages/shared`, validação com Zod, Neon serverless.

---

## Android (Launcher + Agente)
- **Identidade:** `com.coruzen.sdb`  
- **Launcher:** grid apps permitidos; Lock Task Mode; bloqueio de navegação.  
- **Agent Core:** FirebaseMessagingService → comandos → WorkManager (fila offline).  
- **Services:**  
  - Localização sob demanda (Foreground Service).  
  - Screenshot com MediaProjection (consentimento).  
- **Policy Enforcer:** DevicePolicyManager (PIN, apps, restrições).  
- **Permissões:** INTERNET, ACCESS_NETWORK_STATE, RECEIVE_BOOT_COMPLETED, WAKE_LOCK, ACCESS_FINE/COARSE_LOCATION, FOREGROUND_SERVICE, POST_NOTIFICATIONS.  
- **Provisionamento Device Owner:** via QR provisioning.

### Comandos suportados
- PING  
- LOCATE_NOW  
- LOCK / UNLOCK  
- WIPE  
- OPEN_ACTIVITY  
- SCREENSHOT (com sessão ativa)

---

## Segurança & LGPD
- Transparência: apenas dispositivos corporativos.  
- Auditoria completa (commands/events).  
- Retenção configurável (logs/screenshots).  
- HTTPS obrigatório, segredos em envs.  
- Proibição de espionagem oculta.

---

## CI/CD
- **Web:** Vercel (preview/prod).  
- **Android:** GitHub Actions builda APK; tag cria Release assinado.  
- Keystore em GitHub Secrets.

---

## Roadmap
- **F0 – Fundação** ✅  
- **F1 – Devices & Commands** ✅  
- **F2 – Localização** 🚧  
- **F3 – Kiosk/Launcher** 📋  
- **F4 – Ações & Logs** 📋  
- **F5 – Screenshot assistida** 📋  

---

## Break-Glass / Kill Switch (DEV)
- Gesto oculto no launcher (ex.: 5× toque sobre o nome FRIAXIS) abre painel com PIN → desativa kiosque.  
- Watchdog de boot: se launcher crashar 3×, abre modo manutenção para desativar o FRIAXIS.  
- TTL curto (15 min), auditoria em `events`.

---

## Multi-tenant SaaS
- Venda via coruzen.com → checkout.  
- Webhook cria `organization` + `subscription`.  
- Acesso via `friaxis.coruzen.com` com org switcher.  
- Tokens de matrícula geram QR para devices.  
- RLS em Postgres garante isolamento.  
- Planos com limites de dispositivos, etc. (Starter/Pro/Enterprise).

---

## 📊 Status Atual do Projeto (Setembro 2025)

### **✅ Implementado e Funcionando**
- **Web Dashboard**: 100% funcional com design moderno e profissional
- **APIs REST**: 11 endpoints implementados e testados em produção
- **Autenticação**: Firebase Auth + RBAC (admin/operator/viewer)
- **Android App**: Launcher corporativo + Device Admin + FCM
- **Banco PostgreSQL**: Schema completo + migrações + seeds
- **Deploy Automático**: GitHub → Vercel (produção) com CI/CD
- **Build Quality**: Zero warnings, código enterprise-grade
- **UI/UX Modernizada**: Interface redesenhada com Tailwind CSS e componentes profissionais

### **🎨 Design System & UX (100% Concluído)**
- **Layout Profissional**: Cards modernos, gradientes, sombras consistentes
- **Header Funcional**: Search inteligente, sistema de alertas, dropdown de perfil/configurações
- **Responsividade**: 100% responsivo mobile-first com breakpoints otimizados
- **Footer Unificado**: Implementado automaticamente em todas as páginas
- **Performance UI**: Skeleton loading, paginação, debounced search (300ms)
- **Acessibilidade**: Foco, contraste, navegação por teclado

### **🚧 Em Desenvolvimento (90%+)**
- **F2 - Localização**: GPS sob demanda implementado com mapas Leaflet
- **F3 - Launcher/Kiosk**: Modo kiosk funcional, políticas aplicadas
- **F4 - Ações & Logs**: Sistema de auditoria completo com export CSV

### **📋 Próximas Prioridades**
1. **Multi-tenant**: Implementar organizações e subscriptions
2. **Screenshot assistida**: MediaProjection com consentimento
3. **APK Release**: Versão assinada para produção
4. **Monitoramento**: Alertas em tempo real e dashboard analytics

### **🎯 Métricas de Qualidade**
- **Build Status**: ✅ Zero errors, zero warnings
- **UI Performance**: < 100ms interações, lazy loading implementado
- **Mobile Experience**: 100% funcional em dispositivos móveis
- **Code Quality**: TypeScript strict, ESLint, Prettier
- **Security**: HTTPS, RBAC, auditoria completa, inputs validados

### **🏗️ Arquitetura de Componentes (Implementada)**
```typescript
📁 UI Components (Reutilizáveis)
├── 🎨 DashboardHeader.tsx        # Header com search, alerts, profile
├── 🦶 Footer.tsx                 # Footer unificado e profissional  
├── 🔐 LoginForm.tsx              # Login redesenhado (split-screen)
├── 🛡️ ProtectedRoute.tsx         # Proteção de rotas
├── 🔄 AuthProvider.tsx           # Context de autenticação
└── 📱 ConditionalFooter.tsx      # Controle condicional do footer

📁 Pages (Redesenhadas)
├── 🏠 Dashboard (/)              # Métricas, gráficos, ações rápidas
├── 📱 Devices (/devices)         # Grid responsivo, filtros, paginação
├── 🛡️ Policies (/policies)       # CRUD policies, aplicação em lote
├── ⏳ Pending (/pending-devices) # Gestão temporal de dispositivos
├── 📍 Device Detail (/device/id) # Mapas, comandos, telemetria
└── 🔑 Login (/login)             # Interface moderna split-screen
```

### **🎨 Design System Specs**
```css
/* Paleta de Cores Profissional */
Primary: Blue (#3B82F6) → Indigo (#6366F1)
Success: Green (#10B981) 
Warning: Orange (#F59E0B)
Error: Red (#EF4444)
Neutral: Gray Scale (50-900)
Accent: Purple (#8B5CF6)

/* Typography */
Headings: Inter Bold/Semibold
Body: Inter Regular/Medium
Monospace: JetBrains Mono

/* Componentes */
Cards: rounded-xl, shadow-lg, border subtle
Buttons: gradient backgrounds, hover effects
Inputs: focus rings, transitions smooth
Spacing: Tailwind scale (4px grid)
```

### **⚡ Performance & Optimization (Implementado)**
- **Intelligent Search**: Debounced com 300ms, resultados instantâneos
- **Lazy Loading**: Componentes e imagens carregados sob demanda
- **Skeleton States**: Loading states durante fetch de dados
- **Local Storage**: Persistência de filtros e preferências do usuário
- **Responsive Images**: Otimização automática baseada no device
- **Code Splitting**: Bundles otimizados por rota

### **🔧 DevEx & Quality Assurance**
```bash
# Build System (Funcionando)
✅ pnpm dev:web              # Desenvolvimento local
✅ pnpm build                # Build produção
✅ TypeScript strict         # Type safety 100%
✅ ESLint + Prettier         # Code quality
✅ Git hooks                 # Pre-commit validation

# Deploy Pipeline (Automático)
✅ GitHub → Vercel           # Deploy instantâneo
✅ Preview deployments       # Cada PR = preview URL
✅ Environment variables     # Secrets seguros
✅ Build optimization        # Bundle size otimizado
```

---

> **Este instructions.MD é o prompt canônico do projeto FRIAXIS.**  
> **Última atualização**: 18 de Setembro de 2025  
> **Status**: 95% Production Ready 🎉