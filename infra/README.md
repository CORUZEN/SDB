# Infraestrutura SDB

Este diretório contém scripts e configurações para infraestrutura do banco de dados.

## 📂 Estrutura

- `schema.sql` - Schema principal com todas as tabelas
- `seeds.sql` - Dados de exemplo para desenvolvimento  
- `setup-db.sh` - Script de configuração do banco
- `migrations/` - Migrações versionadas

## 🗄️ Modelagem de Dados

### Tabelas Principais

- **devices** - Dispositivos Android gerenciados
- **policies** - Políticas de segurança corporativa
- **device_policies** - Associação devices ↔ policies
- **commands** - Comandos remotos (LOCK, LOCATE_NOW, etc.)
- **events** - Logs de eventos e auditoria
- **locations** - Localizações capturadas sob demanda
- **users** - Usuários do painel (Firebase Auth)

### Relacionamentos

```
users (1) ←→ (N) devices
devices (1) ←→ (N) commands
devices (1) ←→ (N) events  
devices (1) ←→ (N) locations
devices (N) ←→ (M) policies (via device_policies)
```

## 🚀 Configuração

### 1. Configurar DATABASE_URL

```bash
export DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/sdb?sslmode=require"
```

### 2. Executar setup

```bash
# Setup inicial
./infra/setup-db.sh

# Reset completo + dados de exemplo
./infra/setup-db.sh --reset --seeds
```

### 3. Verificar conexão

```bash
# Via psql
psql $DATABASE_URL -c "SELECT COUNT(*) FROM devices;"

# Via API (após deploy)
curl https://sdb-dev.coruzen.com/api/dbtest
```

## 📊 Schemas de Exemplo

### Device Policy JSON
```json
{
  "launcher_apps": ["com.android.chrome", "com.slack"],
  "blocked_apps": ["com.facebook.katana"],
  "kiosk_mode": true,
  "allow_unknown_sources": false,
  "require_pin": true,
  "min_pin_length": 6,
  "wipe_on_failures": 10
}
```

### Command Payload JSON
```json
{
  "type": "LOCATE_NOW",
  "timeout": 30000,
  "high_accuracy": true
}
```

## 🔐 Segurança

- Todas as conexões usam SSL/TLS obrigatório
- UUIDs como chaves primárias
- Índices otimizados para queries frequentes
- Triggers para auditoria automática (updated_at)
- Constraints para integridade dos dados