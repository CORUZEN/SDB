#!/bin/bash

# FRIAXIS v4.0.0 - Instalação no Android
# 
# Este script facilita a instalação do app FRIAXIS no dispositivo Android
# conectado via USB com debug habilitado

echo "🚀 FRIAXIS v4.0.0 - Instalação Android"
echo "======================================"
echo ""

# Verificar se ADB está disponível
if ! command -v adb &> /dev/null; then
    echo "❌ ADB não encontrado!"
    echo "   Instale o Android SDK Platform Tools"
    echo "   https://developer.android.com/studio/releases/platform-tools"
    exit 1
fi

# Verificar dispositivos conectados
echo "🔍 Verificando dispositivos conectados..."
DEVICES=$(adb devices | grep -v "List of devices attached" | grep "device" | wc -l)

if [ $DEVICES -eq 0 ]; then
    echo "❌ Nenhum dispositivo Android conectado!"
    echo "   1. Conecte o dispositivo via USB"
    echo "   2. Habilite 'Depuração USB' nas opções de desenvolvedor"
    echo "   3. Aceite a conexão no dispositivo"
    exit 1
fi

echo "✅ Dispositivo(s) encontrado(s): $DEVICES"
echo ""

# Instalar APK
APK_FILE="FRIAXIS-v4.0.0-debug.apk"

if [ ! -f "$APK_FILE" ]; then
    echo "❌ APK não encontrado: $APK_FILE"
    echo "   Execute primeiro: ./gradlew assembleDebug"
    exit 1
fi

echo "📱 Instalando FRIAXIS v4.0.0..."
echo "   APK: $APK_FILE ($(du -h $APK_FILE | cut -f1))"
echo ""

# Executar instalação
adb install -r "$APK_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 FRIAXIS v4.0.0 instalado com sucesso!"
    echo ""
    echo "📋 Próximos passos:"
    echo "   1. Abra o app no dispositivo"
    echo "   2. Permita as permissões solicitadas"
    echo "   3. Configure a conexão com o servidor"
    echo "   4. Teste a sincronia com o dashboard web"
    echo ""
    echo "🌐 Dashboard Web: https://friaxis.coruzen.com"
    echo "🔧 Servidor Local: http://localhost:3001"
else
    echo ""
    echo "❌ Falha na instalação!"
    echo "   Verifique se o dispositivo permite instalação de apps desconhecidos"
fi