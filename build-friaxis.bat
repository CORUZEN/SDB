@echo off
echo 🚀 Compilando FRIAXIS Android APK...

cd /d "C:\SDB-clean-clone\apps\android"

if not exist "build.gradle" (
    echo ❌ Arquivo build.gradle não encontrado
    pause
    exit /b 1
)

echo ✅ Diretório correto encontrado
echo 📦 Iniciando compilação...

set JAVA_OPTS=-Xmx4096m
java -classpath "gradle\wrapper\gradle-wrapper.jar" org.gradle.wrapper.GradleWrapperMain assembleDebug

if %ERRORLEVEL% EQU 0 (
    echo ✅ APK compilado com sucesso!
    echo 📁 APK localizado em: app\build\outputs\apk\debug\
) else (
    echo ❌ Erro na compilação (Exit Code: %ERRORLEVEL%)
)

pause