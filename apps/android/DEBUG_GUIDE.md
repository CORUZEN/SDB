# Sistema de Debug e Conectividade Android

## 🚨 Sistema de Emergência

### Funcionalidades Implementadas

1. **Debug Overlay Permanente**
   - Aparece no topo da tela durante desenvolvimento
   - Botão "Test API" para verificar conectividade
   - Botão "EMERGENCY" para ações de emergência

2. **Modo de Emergência**
   - Desativa completamente o app
   - Permite desinstalação segura
   - Reset completo das configurações

### Como Usar

#### Debug Overlay
- Aparece automaticamente quando o launcher inicia
- **Test API**: Executa testes completos de conectividade
- **EMERGENCY**: Abre menu com opções de emergência

#### Ações de Emergência
1. **Desativar App**: 
   - Coloca o app em modo emergência
   - App para de funcionar completamente
   - Pode ser desinstalado sem problemas

2. **Reset Completo**:
   - Limpa todas as configurações
   - Para todos os serviços
   - Reinicia o app

## 🔗 Sistema de Conectividade

### Configuração da API
- **URL Padrão**: `http://10.0.2.2:3000` (para emulador Android)
- **Autenticação**: Header `X-Device-ID` com Android ID
- **Timeout**: 30 segundos

### Testes de Conectividade
1. **Health Check**: `/api/health`
2. **Device Registration**: `/api/devices`
3. **Device Info**: `/api/devices/{id}`
4. **Firebase**: Verificação futura

### Configuração no Setup
- URL do servidor configurável
- Registro automático do dispositivo
- Fallback para modo offline em caso de erro

## ⚙️ Permissões Implementadas

```xml
<!-- Debug e Overlay -->
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
<uses-permission android:name="android.permission.SYSTEM_OVERLAY_WINDOW" />

<!-- Conectividade -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<!-- Device Admin -->
<uses-permission android:name="android.permission.BIND_DEVICE_ADMIN" />
```

## 🛠️ Desenvolvimento

### URLs de Teste
- **Emulador**: `http://10.0.2.2:3000`
- **Device Físico**: `http://[IP-DO-DEV-CONTAINER]:3000`

### Logs Importantes
- Tag: `DebugOverlay` - Informações do overlay
- Tag: `ConnectivityTester` - Testes de conectividade
- Tag: `SetupActivity` - Registro do dispositivo
- Tag: `ApiClient` - Requisições HTTP

### Estrutura de Arquivos
```
app/src/main/java/com/sdb/mdm/
├── ui/debug/
│   └── DebugOverlay.kt          # Sistema de debug visual
├── utils/
│   └── ConnectivityTester.kt    # Testes de conectividade
├── ui/setup/
│   └── SetupActivity.kt         # Configuração inicial
└── SDBApplication.kt            # Configurações globais
```

## 🚀 Status Atual

### ✅ Implementado
- [x] Debug overlay com botões permanentes
- [x] Sistema de emergência para desenvolvimento
- [x] Conectividade com API web (health check)
- [x] Registro de dispositivo via API
- [x] Modo offline para desenvolvimento
- [x] Testes automatizados de conectividade

### 🔄 Próximos Passos
- [ ] Compilar e testar no emulador
- [ ] Integração Firebase Cloud Messaging
- [ ] Testes de políticas em tempo real
- [ ] Comandos remotos (localizar, bloquear, etc.)

## 🔧 Comandos Úteis

```bash
# Compilar o app
cd apps/android
./gradlew assembleDebug

# Instalar no emulador
adb install app/build/outputs/apk/debug/app-debug.apk

# Ver logs em tempo real
adb logcat | grep -E "(SDB|DebugOverlay|ConnectivityTester)"

# Desinstalar em caso de problemas
adb uninstall com.sdb.mdm
```