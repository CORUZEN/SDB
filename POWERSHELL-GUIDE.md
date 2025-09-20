# 🪟 PowerShell Guide - FRIAXIS Development

## 🎯 **Quick Reference for FRIAXIS Development**

Este guia contém todos os comandos PowerShell corretos para desenvolvimento, compilação e teste do FRIAXIS v4.0.0.

---

## 🚀 **Desenvolvimento Web**

### **Servidor em Janela Separada (RECOMENDADO)**
```powershell
# ✅ MÉTODO PRINCIPAL - Não bloqueia terminal
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\SDB-clean-clone\apps\web; npm run dev"

# ✅ ALTERNATIVA - Workspace command (da raiz)
cd "C:\SDB-clean-clone"
pnpm dev:web
```

### **Verificações de Status**
```powershell
# Verificar se servidor está rodando
netstat -ano | findstr :3001

# Deve retornar algo como:
# TCP    0.0.0.0:3001           0.0.0.0:0              LISTENING       12345

# Verificar processos Node.js
Get-Process | Where-Object {$_.ProcessName -eq "node"}

# Matar processo se necessário
taskkill /PID 12345 /F
```

---

## 📱 **Compilação Android**

### **Build Debug APK**
```powershell
# Sempre do diretório android
cd "C:\SDB-clean-clone\apps\android"

# Método recomendado
.\gradlew clean assembleDebug

# Verificar APK gerado
ls "app\build\outputs\apk\debug\app-debug.apk"

# Copiar para raiz com nome descritivo
Copy-Item "app\build\outputs\apk\debug\app-debug.apk" "..\..\SDB-Mobile-v4.0.0-debug.apk"
```

### **Instalação via ADB**
```powershell
# Instalar/atualizar no dispositivo
adb install -r "C:\SDB-clean-clone\SDB-Mobile-v4.0.0-debug.apk"

# Verificar dispositivos conectados
adb devices

# Logs do aplicativo (útil para debug)
adb logcat | findstr "FRIAXIS"
```

---

## 🧪 **Teste de APIs**

### **Template Base**
```powershell
# Configuração padrão
$headers = @{'Authorization' = 'Bearer dev-token-mock'}
$base = "http://localhost:3001"
```

### **Listar Dispositivos**
```powershell
$response = Invoke-WebRequest -Uri "$base/api/devices" -Headers $headers -UseBasicParsing
$data = $response.Content | ConvertFrom-Json
$data.data | Select-Object id, name, status, battery_level
```

### **Device Individual**
```powershell
$deviceId = "admin_1758335037381_cnby3021j"  # Exemplo
Invoke-WebRequest -Uri "$base/api/devices/$deviceId" -Headers $headers -UseBasicParsing | Select-Object -ExpandProperty Content
```

### **Excluir Dispositivo**
```powershell
$deviceId = "DEVICE_ID_AQUI"
$response = Invoke-WebRequest -Uri "$base/api/devices/$deviceId" -Method DELETE -Headers $headers -UseBasicParsing
$response.StatusCode  # Deve retornar 200
$response.Content     # Mensagem de sucesso
```

### **Enviar Heartbeat**
```powershell
$deviceId = "DEVICE_ID_AQUI"
$body = @{
    battery_level = 90
    battery_status = "charging"
    location_lat = -23.5505
    location_lng = -46.6333
    location_accuracy = 8.2
    network_info = @{
        type = "wifi"
        strength = 75
    }
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "$base/api/devices/$deviceId/heartbeat" -Method POST -Body $body -ContentType "application/json" -Headers $headers -UseBasicParsing
$response.StatusCode
$response.Content
```

### **Health Check**
```powershell
# Verificar se API está funcionando
Invoke-WebRequest -Uri "$base/api/health" -UseBasicParsing | Select-Object -ExpandProperty Content
```

---

## 🔧 **Sintaxe PowerShell Correta**

### **❌ Erros Comuns**
```powershell
# ERRO: Bash syntax
cd "path" && gradlew assembleDebug

# ERRO: Comando cmd no PowerShell
dir "C:\path\*.apk" /b

# ERRO: Usando npm run dev que bloqueia terminal
npm run dev  # Trava o terminal
```

### **✅ Sintaxe Correta**
```powershell
# CORRETO: Use ; para múltiplos comandos
cd "path"; gradlew assembleDebug

# CORRETO: Use cmdlets PowerShell nativos
Get-ChildItem "C:\path\*.apk" | Select-Object Name, Length

# CORRETO: Servidor em janela separada
Start-Process powershell -ArgumentList "-NoExit", "-Command", "comando"
```

---

## 📂 **Navegação de Arquivos**

### **Comandos Úteis**
```powershell
# Navegar para pasta do projeto
cd "C:\SDB-clean-clone"

# Listar arquivos com filtro
ls *.apk
ls "apps\web\app\api\**\*.ts" | Select-Object Name, Directory

# Encontrar arquivos por padrão
Get-ChildItem -Recurse -Filter "*.apk" | Select-Object FullName, Length, LastWriteTime

# Copiar com confirmação
Copy-Item "origem" "destino" -Force

# Verificar tamanho do arquivo
(Get-Item "arquivo.apk").Length / 1MB  # Tamanho em MB
```

---

## 🐛 **Troubleshooting**

### **Problemas Comuns**

#### **Servidor não inicia**
```powershell
# Verificar se porta está em uso
netstat -ano | findstr :3001

# Matar processo na porta
$processId = (netstat -ano | findstr :3001 | ForEach-Object { ($_ -split '\s+')[4] } | Select-Object -First 1)
taskkill /PID $processId /F
```

#### **Gradlew não funciona**
```powershell
# Verificar se está no diretório correto
pwd  # Deve mostrar: C:\SDB-clean-clone\apps\android

# Verificar se gradlew existe
ls gradlew*

# Executar com caminho explícito
.\gradlew.bat clean assembleDebug
```

#### **ADB não reconhece dispositivo**
```powershell
# Verificar dispositivos
adb devices

# Reiniciar servidor ADB
adb kill-server
adb start-server
adb devices
```

#### **Permissões de desenvolvedor**
```powershell
# Executar como administrador se necessário
Start-Process powershell -Verb RunAs
```

---

## 📊 **Monitoramento**

### **Performance**
```powershell
# CPU e Memória do processo Node.js
Get-Process node | Select-Object ProcessName, CPU, WS

# Espaço em disco
Get-WmiObject -Class Win32_LogicalDisk | Select-Object DeviceID, @{Name="Size(GB)";Expression={[math]::Round($_.Size/1GB,2)}}, @{Name="FreeSpace(GB)";Expression={[math]::Round($_.FreeSpace/1GB,2)}}
```

### **Network**
```powershell
# Testar conectividade com servidor
Test-NetConnection -ComputerName localhost -Port 3001

# Velocidade de resposta da API
Measure-Command { Invoke-WebRequest -Uri "http://localhost:3001/api/health" -UseBasicParsing }
```

---

## 🎯 **Scripts de Automação**

### **Build Completo**
```powershell
# Script para build completo
function Build-FRIAXIS {
    Write-Host "🚀 Iniciando build FRIAXIS v4.0.0..." -ForegroundColor Green
    
    # Web build
    cd "C:\SDB-clean-clone"
    Write-Host "📦 Building web..." -ForegroundColor Yellow
    pnpm build
    
    # Android build
    cd "apps\android"
    Write-Host "📱 Building Android..." -ForegroundColor Yellow
    .\gradlew clean assembleDebug
    
    # Copy APK
    Copy-Item "app\build\outputs\apk\debug\app-debug.apk" "..\..\SDB-Mobile-v4.0.0-debug.apk" -Force
    
    Write-Host "✅ Build completo! APK disponível na raiz do projeto." -ForegroundColor Green
    
    # Mostrar informações do APK
    $apkInfo = Get-Item "..\..\SDB-Mobile-v4.0.0-debug.apk"
    Write-Host "📱 APK: $($apkInfo.Name) ($([math]::Round($apkInfo.Length/1MB,1)) MB)" -ForegroundColor Cyan
}

# Usar: Build-FRIAXIS
```

### **Dev Environment Setup**
```powershell
function Start-FriaxisDev {
    Write-Host "🔧 Iniciando ambiente de desenvolvimento FRIAXIS..." -ForegroundColor Green
    
    # Verificar se Node.js está instalado
    if (!(Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Host "❌ Node.js não encontrado!" -ForegroundColor Red
        return
    }
    
    # Iniciar servidor em janela separada
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\SDB-clean-clone\apps\web; npm run dev"
    
    # Aguardar servidor iniciar
    Start-Sleep 5
    
    # Verificar se está rodando
    $serverRunning = netstat -ano | findstr :3001
    if ($serverRunning) {
        Write-Host "✅ Servidor rodando em http://localhost:3001" -ForegroundColor Green
        
        # Abrir browser (opcional)
        # Start-Process "http://localhost:3001"
    } else {
        Write-Host "❌ Servidor não iniciou corretamente" -ForegroundColor Red
    }
}

# Usar: Start-FriaxisDev
```

---

> **💡 Dica**: Salve este guia como favorito para referência rápida durante o desenvolvimento!
> 
> **📝 Última atualização**: 20 de Setembro de 2025  
> **🎯 Versão**: FRIAXIS v4.0.1 com Heartbeat System