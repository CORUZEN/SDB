# 🔐 SDB — Sistema de Dispositivos Biométricos

> **MDM Empresarial Completo** • Next.js 14 + Neon PostgreSQL + Firebase + Android

## 🚀 **Deploy Status: PRODUÇÃO**
- **Web App**: Vercel (deploy automático ativado)
- **Database**: Neon PostgreSQL (serverless)
- **Auth**: Firebase Authentication + RBAC
- **Mobile**: Android App (95% implementado)

## 📁 **Estrutura do Monorepo**
```
apps/
├── web/                    # 🌐 Painel Web (Next.js 14)
│   ├── app/               # App Router + API Routes
│   ├── components/        # Componentes React
│   └── lib/              # Firebase, API service, utils
├── android/               # 📱 App Android (Kotlin)
│   ├── launcher/         # Launcher corporativo
│   ├── admin/            # Device Admin APIs
│   └── fcm/              # Firebase Cloud Messaging
packages/
└── shared/                # 📦 Código Compartilhado
    ├── types.ts          # TypeScript types
    ├── schemas.ts        # Zod validation
    └── constants.ts      # Constantes do sistema
```

## ⚙️ **Configuração de Deploy**
- **Root Directory**: `apps/web`
- **Framework**: Next.js (auto-detectado)
- **Build Command**: `npm run build`
- **Environment Variables**: Configuradas no Vercel

### 🔑 **Variáveis Essenciais**
- `DATABASE_URL` (Neon PostgreSQL)
- `JWT_SECRET` (Autenticação)
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- `NEXT_PUBLIC_FIREBASE_*` (Client-side Firebase)

## 🎯 **Funcionalidades Implementadas**
- ✅ Dashboard elegante com mapas interativos
- ✅ CRUD completo de dispositivos e políticas
- ✅ Sistema de comandos remotos (PING, LOCATE, LOCK)
- ✅ Autenticação Firebase + RBAC (admin/operator/viewer)
- ✅ APIs REST completas (11 endpoints)
- ✅ Launcher Android corporativo
- ✅ Deploy automático GitHub → Vercel

---
**Última atualização**: 17/09/2025 • **Status**: Produção Ready 🎉Deploy test 09/18/2025 13:36:46
Test deploy after removing conflicting workflow - 09/18/2025 19:51:46
 DEPLOY TEST - 2025-09-18 20:38:16 - Vercel integration reconnected and ready!
