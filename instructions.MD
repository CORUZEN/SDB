# INSTRUCTIONS — FRIAXIS (Gestão de Dispositivos) • MDM Android Corporativo

**Stack:** Next.js (Vercel) + Neon (Postgres) + Firebase (Auth + FCM) + APK (Launcher+Agente)  
**Regras:** Sem realtime contínuo • Localização sob demanda • Captura de tela assistida (com consentimento) • Multi-tenant (multi-empresa)

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

> **Este instructions.MD é o prompt canônico do projeto FRIAXIS.**  