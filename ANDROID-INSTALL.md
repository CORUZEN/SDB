# 📱 FRIAXIS v4.0.0 - Instalação Android

## APK Compilado com Sucesso! 🎉

O aplicativo Android FRIAXIS v4.0.0 foi compilado e está pronto para instalação.

### 📄 Informações do APK

- **Arquivo**: `FRIAXIS-v4.0.0-debug.apk`
- **Tamanho**: 21.9 MB
- **Versão**: 4.0.0
- **Build Type**: Debug
- **Package ID**: `com.coruzen.sdb`
- **API Target**: `https://friaxis.coruzen.com/`

### 🔧 Como Instalar

#### Opção 1: Via ADB (Recomendado)
```bash
# Execute o script de instalação automática
.\install-android.ps1
```

#### Opção 2: Instalação Manual
1. **Habilite a Depuração USB** no seu Android:
   - Vá em `Configurações > Sobre o telefone`
   - Toque 7 vezes em "Número da versão"
   - Volte e acesse `Configurações > Opções do desenvolvedor`
   - Ative `Depuração USB`

2. **Conecte o dispositivo** via USB ao computador

3. **Instale via ADB**:
   ```bash
   adb install -r FRIAXIS-v4.0.0-debug.apk
   ```

#### Opção 3: Transferir e Instalar Diretamente
1. Copie o arquivo `FRIAXIS-v4.0.0-debug.apk` para o celular
2. No Android, vá em `Configurações > Segurança`
3. Ative `Fontes desconhecidas` ou `Instalar apps desconhecidos`
4. Use um gerenciador de arquivos para abrir o APK
5. Toque em "Instalar"

### 🚀 Configuração Inicial

Após instalar o app:

1. **Abra o FRIAXIS** no seu dispositivo
2. **Permita as permissões** solicitadas:
   - Localização (para rastreamento GPS)
   - Notificações (para comandos remotos)
   - Armazenamento (para logs)
   - Telefone (para informações do dispositivo)

3. **Faça login** ou cadastre-se
4. **Configure a conexão** com o servidor
5. **Teste os recursos**:
   - Recebimento de comandos remotos
   - Envio de localização
   - Sincronização com dashboard

### 🌐 Testando a Sincronia

#### Dashboard Web
- **Produção**: https://friaxis.coruzen.com
- **Local**: http://localhost:3001

#### Recursos para Testar
1. **Visualizar dispositivo** no dashboard após login no app
2. **Enviar comando PING** do dashboard
3. **Verificar localização** em tempo real
4. **Aplicar políticas** de segurança
5. **Monitorar telemetria** do dispositivo

### 🔍 Troubleshooting

#### App não instala
- Verifique se "Fontes desconhecidas" está habilitado
- Tente desinstalar versão anterior primeiro: `adb uninstall com.coruzen.sdb`

#### App não conecta
- Verifique conectividade com internet
- Teste acesso a `https://friaxis.coruzen.com` no navegador do celular
- Verifique se o Firebase está configurado

#### Comandos não chegam
- Verifique se notificações estão habilitadas
- Confirme que o token FCM foi registrado
- Teste conexão WebSocket

### 📊 Logs e Debug

Para visualizar logs do app:
```bash
# Logs gerais
adb logcat | grep -i friaxis

# Logs específicos da aplicação
adb logcat | grep com.coruzen.sdb

# Limpar logs e monitorar em tempo real
adb logcat -c && adb logcat | grep -E "(FRIAXIS|SDB|Firebase)"
```

### ✅ Checklist de Testes

- [ ] App instala sem erros
- [ ] Login/cadastro funciona
- [ ] Dispositivo aparece no dashboard
- [ ] Comando PING é recebido
- [ ] Localização é enviada
- [ ] Notificações funcionam
- [ ] Políticas são aplicadas
- [ ] Telemetria é coletada
- [ ] Sincronia em tempo real

### 🎯 Next Steps

Após confirmar que tudo funciona:
1. Compile versão de release: `.\gradlew assembleRelease`
2. Configure assinatura de código
3. Publique na Google Play Store
4. Configure CI/CD para builds automáticos

---

🚀 **FRIAXIS v4.0.0 está pronto para uso!**