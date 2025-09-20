# 📊 FRIAXIS v4.0.0 - Análise Completa do Banco de Dados

## 🔍 **PROBLEMAS IDENTIFICADOS**

### 1. **Inconsistências na Estrutura**

#### **Tabela `device_registrations`** - CRÍTICO
- ❌ **Campo `device_info`**: Usado no código mas não existe na estrutura atual
- ❌ **Campos individuais**: `name`, `model`, `android_version` existem na estrutura mas código espera JSON
- ❌ **Campo `firebase_token`**: Inconsistência entre `firebase_token` e `fcm_token`

#### **Tabela `devices`** - CRÍTICO  
- ❌ **Campo `fcm_token`**: Usado no código Android mas não existe na estrutura
- ❌ **Campo `device_identifier`**: Usado mas não está na estrutura atual
- ❌ **Campos de especificação**: Tipos esperados pelo Android não estão mapeados

### 2. **Dados Android Não Mapeados**

#### **DeviceSpec (Android) → Banco de Dados**
```kotlin
// Dados coletados pelo Android mas não salvos:
- manufacturer, brand, cpuArchitecture, cpuInfo
- totalRam, availableRam, totalStorage, availableStorage
- screenResolution, screenDensity, batteryCapacity
- serialNumber, imei, macAddress
- hasFingerprint, hasFaceUnlock, hasNfc, hasBluetooth
- hasWifi, hasCellular, isRooted
- securityPatchLevel, bootloaderVersion, kernelVersion
```

### 3. **Tabelas Faltantes**

#### **Multi-tenant Support** 
- ❌ **`organization_members`**: Relacionamento usuário-organização
- ❌ **`device_policies`**: Aplicação de políticas em dispositivos  
- ❌ **`events`**: Logs de eventos do sistema
- ❌ **`locations`**: Histórico de localizações
- ❌ **`notifications`**: Sistema de notificações
- ❌ **`alerts`**: Sistema de alertas

### 4. **Campos JSONB Não Estruturados**
- ❌ **`device_info`**: Precisa estrutura definida
- ❌ **`metadata`**: Sem schema definido
- ❌ **`settings`**: Estrutura inconsistente

## 🎯 **ESTRUTURA CORRIGIDA NECESSÁRIA**

### **1. Organizations** - ✅ OK
```sql
- id, name, slug, subscription_tier
- created_at, updated_at
```

### **2. Users** - ✅ OK  
```sql
- id, organization_id, firebase_uid, email, name, role
- is_active, created_at, updated_at
```

### **3. Devices** - ❌ PRECISA CORREÇÃO
```sql
-- ADICIONAR:
+ fcm_token TEXT
+ device_identifier VARCHAR(255) 
+ hardware_info JSONB -- Para DeviceSpec
+ capabilities JSONB -- Features do dispositivo
+ security_info JSONB -- Root, patch level, etc
```

### **4. Device_registrations** - ❌ PRECISA CORREÇÃO TOTAL
```sql
-- MANTER CAMPOS ATUAIS MAS ADICIONAR:
+ device_info JSONB NOT NULL -- DeviceSpec completo
-- OU CONVERTER PARA ESTRUTURA HÍBRIDA
```

### **5. Tabelas Faltantes** - ❌ CRÍTICO
```sql
-- ADICIONAR:
+ device_policies (device_id, policy_id, status, applied_at)
+ events (id, device_id, type, data, created_at)  
+ locations (id, device_id, lat, lng, accuracy, captured_at)
+ organization_members (id, org_id, user_id, role, permissions)
+ alerts (id, org_id, type, severity, message, resolved)
+ notifications (id, user_id, type, message, read_at)
```

## 📋 **PLANO DE CORREÇÃO**

### **Fase 1: Estrutura Crítica** 
1. ✅ Corrigir `device_registrations` com `device_info JSONB`
2. ✅ Adicionar campos faltantes em `devices`
3. ✅ Criar tabelas de relacionamento essenciais

### **Fase 2: Recursos Avançados**
1. ✅ Sistema de eventos e logs
2. ✅ Localizações e telemetria expandida  
3. ✅ Alertas e notificações

### **Fase 3: Otimização**
1. ✅ Índices de performance
2. ✅ Constraints e validações
3. ✅ Triggers para auditoria

## 🚨 **URGÊNCIA: ALTA**
O sistema não funciona completamente até essas correções serem aplicadas.