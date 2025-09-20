# 🚀 FRIAXIS v4.0.0 - Referência Rápida de Desenvolvimento

## 📱 Build Android (PowerShell)

### Build Completo
```powershell
.\build-friaxis-v4.ps1
```

### Build Customizado
```powershell
# Sem limpeza prévia (build rápido)
.\build-friaxis-v4.ps1 -Clean:$false

# Sem copiar APK
.\build-friaxis-v4.ps1 -CopyApk:$false

# Nome customizado do APK
.\build-friaxis-v4.ps1 -OutputName "FRIAXIS-custom.apk"
```

## 🔧 Utilitários de Desenvolvimento

### Comandos Essenciais
```powershell
# Status do projeto
.\friaxis-dev-utils.ps1 -Action check

# Análise completa
.\friaxis-dev-utils.ps1 -Action analyze

# Build completo
.\friaxis-dev-utils.ps1 -Action build

# Limpeza profunda
.\friaxis-dev-utils.ps1 -Action clean

# Backup do projeto
.\friaxis-dev-utils.ps1 -Action backup

# Copiar APK mais recente
.\friaxis-dev-utils.ps1 -Action copy-apk
```

## 🏗️ Comandos Gradle Diretos

### No diretório apps/android
```powershell
# Build debug
.\gradlew.bat assembleDebug

# Build release
.\gradlew.bat assembleRelease

# Limpeza
.\gradlew.bat clean

# Verificar dependências
.\gradlew.bat dependencies

# Executar testes
.\gradlew.bat test
```

## 📁 Estrutura de Arquivos Importantes

### Android
```
apps/android/
├── app/build.gradle          # Configurações do app
├── app/google-services.json  # Firebase config
├── gradle.properties         # Configurações Gradle
└── app/src/main/
    ├── AndroidManifest.xml   # Manifest do app
    ├── java/com/friaxis/     # Código Kotlin
    └── res/                  # Resources
```

### Build Outputs
```
apps/android/app/build/outputs/apk/debug/
└── app-debug.apk            # APK gerado

Raiz do projeto:
└── FRIAXIS-v4.0.0-debug.apk # APK copiado
```

## 🐛 Troubleshooting Comum

### PowerShell
```powershell
# Erro "execution policy"
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Verificar versão PowerShell
$PSVersionTable.PSVersion
```

### Gradle
```powershell
# Limpar cache Gradle
.\gradlew.bat clean

# Verificar wrapper
if (Test-Path ".\gradlew.bat") { "OK" } else { "FALTANDO" }

# Permissões Java
$env:JAVA_OPTS = "-Dfile.encoding=UTF-8"
```

### Android SDK
```powershell
# Verificar ANDROID_HOME
echo $env:ANDROID_HOME

# Verificar SDK Tools
adb version
```

## 🔍 Verificações de Qualidade

### Zero Warnings Checklist
- ✅ @ColumnInfo em entidades Room
- ✅ @Suppress("DEPRECATION") para APIs legadas
- ✅ Uso de variáveis declaradas
- ✅ Jetifier.ignorelist configurado
- ✅ Build.SERIAL com verificação de versão

### Performance
- ✅ Proguard habilitado para release
- ✅ Recursos otimizados
- ✅ Dependências mínimas
- ✅ APK < 25MB

## 📊 Métricas do Projeto

### Tamanhos de Referência
- **APK Debug**: ~21.8MB
- **APK Release**: ~15-18MB
- **Projeto Android**: ~45MB
- **Projeto Completo**: ~120MB

### Tecnologias
- **Kotlin**: 1.9.22
- **Gradle**: 8.5
- **Android Target**: API 34
- **Android Min**: API 24
- **Room**: 2.6.1
- **Retrofit**: 2.9.0
- **Firebase**: Última versão

## 🎯 Próximos Passos

### Fase 1: Funcionalidades Core
- [ ] Sistema de pareamento por código
- [ ] Comunicação bidirecional melhorada
- [ ] Sincronização offline/online

### Fase 2: Enterprise Features
- [ ] Relatórios avançados
- [ ] Auditoria completa
- [ ] Multi-tenancy

### Fase 3: Expansão
- [ ] iOS support
- [ ] APIs públicas
- [ ] Marketplace de plugins

---
**FRIAXIS v4.0.0** • **Desenvolvimento Enterprise** • **CORUZEN**