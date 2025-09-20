# 🏢 FRIAXIS v4.0.0 — Sistema de Gestão de Dispositivos Móveis

> **MDM Empresarial Completo por CORUZEN** • Next.js 14 + Neon PostgreSQL + Firebase + Android

## 🚀 **Status de Produção**
- **🌐 Web App**: [friaxis.coruzen.com](https://friaxis.coruzen.com)
- **📊 Database**: Neon PostgreSQL (serverless)
- **🔐 Auth**: Firebase Authentication + RBAC
- **📱 Mobile**: Android App FRIAXIS v4.0.0

## 🏗️ **Arquitetura do Projeto**
```
apps/
├── web/                    # 🌐 Painel Web (Next.js 14)
│   ├── app/               # App Router + API Routes
│   ├── components/        # Componentes React
│   └── lib/              # Firebase, API service, utils
├── android/               # 📱 App Android FRIAXIS (Kotlin)
│   ├── launcher/         # Launcher corporativo
│   ├── admin/            # Device Admin APIs
│   └── fcm/              # Firebase Cloud Messaging
packages/
└── shared/                # 📦 Código Compartilhado
    ├── types.ts          # TypeScript types
    ├── schemas.ts        # Zod validation
    └── constants.ts      # Constantes do sistema
```

## 🛠️ **Scripts de Build Automatizados**

### 📱 Build Android FRIAXIS
```powershell
# Build completo com zero warnings
.\build-friaxis-v4.ps1

# Build rápido sem limpeza
.\build-friaxis-v4.ps1 -Clean:$false

# Build sem copiar APK
.\build-friaxis-v4.ps1 -CopyApk:$false
```

### 🔧 Utilitários de Desenvolvimento
```powershell
# Build completo
.\friaxis-dev-utils.ps1 -Action build

# Verificar status do projeto
.\friaxis-dev-utils.ps1 -Action check

# Analisar código e dependências
.\friaxis-dev-utils.ps1 -Action analyze

# Backup do projeto
.\friaxis-dev-utils.ps1 -Action backup

# Limpeza profunda
.\friaxis-dev-utils.ps1 -Action clean
```

## 🔑 **Configuração de Deploy**
- **Root Directory**: `apps/web`
- **Framework**: Next.js (auto-detectado)
- **Build Command**: `npm run build`
- **Environment Variables**: Configuradas no Vercel

### � **Variáveis Essenciais**
- `DATABASE_URL` (Neon PostgreSQL)
- `JWT_SECRET` (Autenticação)
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- `NEXT_PUBLIC_FIREBASE_*` (Client-side Firebase)

## 🎯 **Funcionalidades v4.0.0**
- ✅ **Branding CORUZEN completo** (logo, domínio, identidade)
- ✅ **Dashboard elegante** com mapas interativos
- ✅ **CRUD completo** de dispositivos e políticas
- ✅ **Sistema de comandos remotos** (PING, LOCATE, LOCK)
- ✅ **Autenticação Firebase + RBAC** (admin/operator/viewer)
- ✅ **APIs REST completas** (11 endpoints)
- ✅ **Launcher Android corporativo**
- ✅ **Deploy automático** GitHub → Vercel
- ✅ **Compilação zero warnings** (qualidade enterprise)
- ✅ **PowerShell otimizado** para Windows
- ✅ **Room Database** com anotações corretas
- ✅ **Android APIs** com verificação de versão

## 📦 **Outputs de Build**
- **APK Debug**: `FRIAXIS-v4.0.0-debug.apk` (~21.8MB)
- **Target SDK**: Android 34 (API Level 34)
- **Min SDK**: Android 24 (API Level 24)
- **Linguagem**: Kotlin 1.9.22

## 🏢 **Informações Corporativas**
- **Empresa**: CORUZEN
- **Produto**: FRIAXIS v4.0.0
- **Domínio**: friaxis.coruzen.com
- **Tipo**: Sistema de Gestão de Dispositivos Móveis
- **Licença**: Proprietária CORUZEN

---
**FRIAXIS v4.0.0** • **CORUZEN** • **Produção Ready** 🎉
