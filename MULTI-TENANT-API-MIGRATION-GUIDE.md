# Guia de Migração: APIs Multi-tenant
## FRIAXIS v4.0.0 - Sistema Multi-tenant

Este documento descreve como migrar as APIs existentes para suportar multi-tenancy com Row Level Security (RLS).

## 📋 Checklist de Migração

### 1. Estrutura Básica da API Multi-tenant

Cada API route deve seguir este padrão:

```typescript
import { NextRequest } from 'next/server';
import { 
  getOrganizationFromHeaders, 
  createAPIResponse,
  hasPermission,
  checkOrganizationLimits 
} from '../../../lib/organization-middleware';

export async function GET(request: NextRequest) {
  try {
    // 1. Obter contexto da organização
    const orgData = await getOrganizationFromHeaders(request);
    if (!orgData) {
      return new Response(JSON.stringify({ error: 'Organization context required' }), 
        { status: 401 });
    }

    // 2. Verificar permissões
    if (!hasPermission(context, 'resource', 'read')) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), 
        { status: 403 });
    }

    // 3. Executar query com RLS automático
    const data = await db.query(`
      SELECT * FROM table_name 
      WHERE organization_id = $1
    `, [orgData.organizationId]);

    // 4. Retornar resposta padronizada
    return createAPIResponse({ data }, context);

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), 
      { status: 500 });
  }
}
```

### 2. APIs que Precisam ser Migradas

#### 📱 Devices APIs
- [x] `GET /api/devices` - Listar dispositivos
- [x] `POST /api/devices` - Criar dispositivo
- [x] `PUT /api/devices/[id]` - Atualizar dispositivo
- [x] `DELETE /api/devices/[id]` - Deletar dispositivo
- [x] `GET /api/devices/[id]` - Obter dispositivo específico
- [x] `POST /api/devices/[id]/commands` - Enviar comando

#### 🛡️ Policies APIs
- [ ] `GET /api/policies` - Listar políticas
- [ ] `POST /api/policies` - Criar política
- [ ] `PUT /api/policies/[id]` - Atualizar política
- [ ] `DELETE /api/policies/[id]` - Deletar política
- [ ] `POST /api/policies/[id]/apply` - Aplicar política

#### 📍 Locations APIs
- [ ] `GET /api/devices/[id]/locations` - Histórico de localização
- [ ] `GET /api/devices/[id]/locations/current` - Localização atual
- [ ] `POST /api/devices/[id]/locations/track` - Iniciar rastreamento

#### 🚨 Events & Alerts APIs
- [ ] `GET /api/events` - Listar eventos
- [ ] `GET /api/alerts` - Listar alertas
- [ ] `PUT /api/alerts/[id]` - Atualizar status do alerta
- [ ] `POST /api/alerts/[id]/resolve` - Resolver alerta

#### 👥 Users APIs
- [ ] `GET /api/users` - Listar usuários da organização
- [ ] `POST /api/users/invite` - Convidar usuário
- [ ] `PUT /api/users/[id]/role` - Alterar role do usuário
- [ ] `DELETE /api/users/[id]` - Remover usuário

#### 📊 Analytics APIs
- [ ] `GET /api/analytics/dashboard` - Dados do dashboard
- [ ] `GET /api/analytics/devices` - Métricas de dispositivos
- [ ] `GET /api/analytics/compliance` - Relatório de compliance
- [ ] `GET /api/analytics/usage` - Estatísticas de uso

### 3. Padrões de Implementação

#### A. Verificação de Permissões

```typescript
// Para operações de leitura
if (!hasPermission(context, 'devices', 'read')) {
  return new Response(JSON.stringify({ error: 'Read permission required' }), 
    { status: 403 });
}

// Para operações de escrita
if (!hasPermission(context, 'devices', 'write')) {
  return new Response(JSON.stringify({ error: 'Write permission required' }), 
    { status: 403 });
}

// Para operações de exclusão
if (!hasPermission(context, 'devices', 'delete')) {
  return new Response(JSON.stringify({ error: 'Delete permission required' }), 
    { status: 403 });
}
```

#### B. Verificação de Limites da Organização

```typescript
// Antes de criar novos recursos
const currentCount = await db.count('devices', orgData.organizationId);
const limitsCheck = await checkOrganizationLimits(context, 'devices', currentCount);

if (!limitsCheck.allowed) {
  return new Response(JSON.stringify({ 
    error: 'Resource limit exceeded',
    limit: limitsCheck.limit,
    current: currentCount,
    plan: context.organization.plan_type
  }), { status: 403 });
}
```

#### C. Queries com RLS Automático

```typescript
// Com o schema multi-tenant, todas as queries automaticamente
// filtram por organization_id devido às políticas RLS

// ✅ Correto - RLS aplicado automaticamente
const devices = await db.query(`
  SELECT * FROM devices 
  WHERE status = $1
`, ['online']);

// ❌ Incorreto - não precisa mais especificar organization_id
const devices = await db.query(`
  SELECT * FROM devices 
  WHERE organization_id = $1 AND status = $2
`, [orgId, 'online']);
```

#### D. Tratamento de Erros Padronizado

```typescript
catch (error) {
  console.error(`Error in ${request.method} ${pathname}:`, error);
  
  // Log detalhado para debugging
  if (process.env.NODE_ENV === 'development') {
    console.error('Stack trace:', error.stack);
    console.error('Organization context:', context);
  }
  
  return new Response(JSON.stringify({ 
    error: 'Internal server error',
    message: error instanceof Error ? error.message : 'Unknown error',
    timestamp: new Date().toISOString()
  }), { status: 500 });
}
```

### 4. Validação de Dados de Entrada

#### A. Schema de Validação

```typescript
import { z } from 'zod';

const CreateDeviceSchema = z.object({
  name: z.string().min(1).max(100),
  device_identifier: z.string().min(1),
  device_type: z.enum(['smartphone', 'tablet', 'laptop', 'desktop', 'other']),
  owner_email: z.string().email().optional(),
  department: z.string().max(50).optional(),
  tags: z.array(z.string()).max(10).optional(),
});

// Uso na API
const validation = CreateDeviceSchema.safeParse(body);
if (!validation.success) {
  return new Response(JSON.stringify({ 
    error: 'Validation failed',
    details: validation.error.errors
  }), { status: 400 });
}
```

### 5. Middleware Configuration

#### A. Next.js Middleware Setup

Criar `middleware.ts` na raiz do projeto:

```typescript
import { NextRequest } from 'next/server';
import organizationMiddleware from './apps/web/lib/organization-middleware';

export async function middleware(request: NextRequest) {
  // Aplicar middleware de organização apenas para rotas da API
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return await organizationMiddleware(request);
  }
  
  // Para páginas, aplicar baseado na URL
  if (request.nextUrl.pathname.startsWith('/dashboard/')) {
    const orgSlug = request.nextUrl.pathname.split('/')[2];
    return await organizationMiddleware(request, orgSlug);
  }
}

export const config = {
  matcher: [
    '/api/(.*)',
    '/dashboard/:path*',
    '/policies/:path*',
    '/devices/:path*'
  ]
};
```

### 6. Database Integration

#### A. Connection com RLS

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function executeQuery(sql: string, params: any[], context: OrganizationContext) {
  const client = await pool.connect();
  
  try {
    // Configurar contexto RLS
    await client.query('SET LOCAL app.current_organization_id = $1', [context.organization.id]);
    await client.query('SET LOCAL app.current_user_id = $1', [context.user.id]);
    
    // Executar query
    const result = await client.query(sql, params);
    return result.rows;
    
  } finally {
    client.release();
  }
}
```

### 7. Testing Strategy

#### A. Unit Tests

```typescript
import { organizationMiddleware, hasPermission } from '../organization-middleware';

describe('Organization Middleware', () => {
  test('should deny access without valid session', async () => {
    const request = new NextRequest('http://localhost/api/devices');
    const response = await organizationMiddleware(request);
    
    expect(response?.status).toBe(302); // Redirect to login
  });
  
  test('should allow access with valid permissions', () => {
    const context = mockOrganizationContext();
    const hasAccess = hasPermission(context, 'devices', 'read');
    
    expect(hasAccess).toBe(true);
  });
});
```

#### B. Integration Tests

```typescript
describe('Devices API Multi-tenant', () => {
  test('should only return devices from user organization', async () => {
    const response = await fetch('/api/devices', {
      headers: {
        'x-organization-id': 'org_1',
        'x-user-id': 'user_1',
        'x-member-role': 'admin'
      }
    });
    
    const data = await response.json();
    
    // Verificar que todos os dispositivos pertencem à organização
    data.devices.forEach(device => {
      expect(device.organization_id).toBe('org_1');
    });
  });
});
```

### 8. Performance Considerations

#### A. Caching Strategy

```typescript
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Cache de contexto de organização
export async function getCachedOrganizationContext(userId: string) {
  const cached = await redis.get(`org_context:${userId}`);
  return cached ? JSON.parse(cached) : null;
}

// Cache de dados com TTL
export async function cacheDeviceList(orgId: string, devices: Device[]) {
  await redis.setex(`devices:${orgId}`, 300, JSON.stringify(devices)); // 5 min TTL
}
```

#### B. Database Indexes

```sql
-- Indexes essenciais para performance multi-tenant
CREATE INDEX CONCURRENTLY idx_devices_org_status ON devices(organization_id, status);
CREATE INDEX CONCURRENTLY idx_events_org_created ON events(organization_id, created_at);
CREATE INDEX CONCURRENTLY idx_policies_org_active ON policies(organization_id, is_active);
```

### 9. Deployment Checklist

#### Antes do Deploy

- [ ] Aplicar migração do schema multi-tenant
- [ ] Configurar variáveis de ambiente do Neon
- [ ] Testar RLS policies em ambiente de staging
- [ ] Verificar performance das queries com novos indexes
- [ ] Validar middleware em todas as rotas
- [ ] Configurar monitoramento e alertas
- [ ] Preparar scripts de rollback

#### Pós Deploy

- [ ] Monitorar logs de erro
- [ ] Verificar métricas de performance
- [ ] Testar funcionalidades críticas
- [ ] Validar isolamento de dados entre organizações
- [ ] Documentar configurações finais

---

## 🚀 Próximos Passos

1. **Implementar APIs uma por vez** seguindo este guia
2. **Testar isolamento de dados** em cada implementação
3. **Monitorar performance** e ajustar indexes conforme necessário
4. **Documentar mudanças** e atualizar documentação da API
5. **Treinar equipe** nos novos padrões multi-tenant

---

**⚠️ Importante**: Sempre testar o isolamento de dados entre organizações antes de fazer deploy em produção!