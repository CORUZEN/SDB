# FRIAXIS Mobile v4.0.0 - Guia de Instalação

## 📱 APKs Disponíveis (Atualizado)

### 🎯 **RECOMENDADO PARA INSTALAÇÃO**
- **`FRIAXIS-Mobile-v4.0.0-PRODUCTION.apk`** ✅ **MAIS RECENTE**
  - Tamanho: 20,37 MB
  - Tipo: Release build assinado + debuggable
  - Status: ✅ Corrige "pacote inválido"
  - Uso: **Instalação direta no dispositivo**

### � Alternativas Funcionais
- **`FRIAXIS-Mobile-v4.0.0-FINAL.apk`** ✅ **ESTÁVEL**
  - Tamanho: 21,09 MB
  - Tipo: Debug build completo
  - Status: Funciona perfeitamente
  - Uso: Desenvolvimento e testes

### ❌ Versões com Problemas
- **`FRIAXIS-Mobile-v4.0.0-release.apk`** ❌ **NÃO USAR**
  - Tamanho: 5,99 MB (truncado)
  - Problema: "Pacote inválido" + ProGuard agressivo

- **`FRIAXIS-Mobile-v4.0.0-release-SIGNED.apk`** ⚠️ **LIMITADO**
  - Tamanho: 16,02 MB
  - Problema: Não debuggable (dificulta troubleshooting)

## 🛠️ Solução Completa Aplicada

### ✅ Problema "Pacote Inválido" RESOLVIDO

**Causas Identificadas e Corrigidas:**

1. **❌ APK não assinado** → **✅ Adicionada assinatura debug**
2. **❌ ProGuard agressivo** → **✅ Desabilitado minify**  
3. **❌ Build não debuggable** → **✅ Habilitado debug no release**

### 🔧 Configurações Aplicadas no build.gradle
```gradle
signingConfigs {
    debug {
        storeFile file('debug.keystore')
        storePassword 'android'
        keyAlias 'androiddebugkey'
        keyPassword 'android'
    }
}

buildTypes {
    release {
        minifyEnabled false      // Evita truncamento
        debuggable true         // Permite troubleshooting  
        signingConfig signingConfigs.debug  // Assinatura válida
    }
}
```

2. **Configurações de Instalação**:
   ```
   - Ativar "Fontes desconhecidas" nas configurações
   - Permitir instalação de apps externos
   - Verificar espaço disponível (mínimo 50MB)
   ```

3. **Compatibilidade**:
   - Android 8.0+ (API 26+)
   - Suporte a todas as arquiteturas (arm64-v8a, armeabi-v7a)

## 📋 Instruções de Instalação

### Método 1: ADB (Recomendado para desenvolvimento)
```powershell
adb install "C:\SDB-clean-clone\FRIAXIS-Mobile-v4.0.0-FINAL.apk"
```

### Método 2: Instalação direta no dispositivo
1. Copiar APK para o dispositivo
2. Ativar "Fontes desconhecidas" 
3. Abrir arquivo APK no gerenciador de arquivos
4. Confirmar instalação

### Método 3: Via email/compartilhamento
1. Enviar APK por email/WhatsApp/Drive
2. Abrir no dispositivo
3. Instalar normalmente

## 🔧 Recursos Incluídos
- ✅ Novos ícones corporativos
- ✅ HeartbeatService corrigido
- ✅ WorkManager configurado
- ✅ Sistema de telemetria completo
- ✅ Integração com API FRIAXIS

## 🎯 Próximos Passos
1. **Testar instalação** com APK FINAL
2. **Assinar APK** de release para distribuição
3. **Publicar** na Play Store (se necessário)

---
**Data:** 20/09/2025  
**Versão:** FRIAXIS v4.0.0  
**Build:** Final corrigido