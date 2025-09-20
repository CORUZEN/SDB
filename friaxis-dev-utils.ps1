# FRIAXIS v4.0.0 - Utilitários de Desenvolvimento
# Scripts auxiliares para desenvolvimento eficiente

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("build", "clean", "check", "copy-apk", "analyze", "backup")]
    [string]$Action,
    
    [string]$ApkName = "FRIAXIS-v4.0.0-debug.apk"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = "C:\SDB-clean-clone"
$AndroidDir = "$ProjectRoot\apps\android"

Write-Host "🔧 FRIAXIS Dev Utils v4.0.0" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

switch ($Action) {
    "build" {
        Write-Host "🚀 Executando build completo..." -ForegroundColor Yellow
        & "$ProjectRoot\build-friaxis-v4.ps1" -Clean -CopyApk -OutputName $ApkName
    }
    
    "clean" {
        Write-Host "🧹 Limpando arquivos de build..." -ForegroundColor Yellow
        Set-Location $AndroidDir
        cmd.exe /c "gradlew.bat clean"
        
        # Limpar APKs antigos
        $oldApks = Get-ChildItem "$ProjectRoot\*.apk" -ErrorAction SilentlyContinue
        if ($oldApks) {
            Write-Host "🗑️ Removendo APKs antigos:" -ForegroundColor Gray
            foreach ($apk in $oldApks) {
                Write-Host "  - $($apk.Name)" -ForegroundColor Gray
                Remove-Item $apk.FullName -Force
            }
        }
        Set-Location $ProjectRoot
        Write-Host "✅ Limpeza concluída" -ForegroundColor Green
    }
    
    "check" {
        Write-Host "🔍 Verificando status do projeto..." -ForegroundColor Yellow
        
        # Verificar estrutura do projeto
        $checks = @(
            @{ Path = $AndroidDir; Name = "Diretório Android" },
            @{ Path = "$AndroidDir\gradlew.bat"; Name = "Gradle Wrapper" },
            @{ Path = "$AndroidDir\app\build.gradle"; Name = "Build.gradle" },
            @{ Path = "$AndroidDir\app\google-services.json"; Name = "Google Services" }
        )
        
        foreach ($check in $checks) {
            if (Test-Path $check.Path) {
                Write-Host "✅ $($check.Name): OK" -ForegroundColor Green
            } else {
                Write-Host "❌ $($check.Name): FALTANDO" -ForegroundColor Red
            }
        }
        
        # Verificar APKs existentes
        $apks = Get-ChildItem "$ProjectRoot\*.apk" -ErrorAction SilentlyContinue
        if ($apks) {
            Write-Host "📦 APKs encontrados:" -ForegroundColor Blue
            foreach ($apk in $apks) {
                $sizeMB = [math]::Round($apk.Length / 1MB, 2)
                Write-Host "  - $($apk.Name) ($sizeMB MB)" -ForegroundColor Cyan
            }
        } else {
            Write-Host "📦 Nenhum APK encontrado na raiz" -ForegroundColor Yellow
        }
    }
    
    "copy-apk" {
        Write-Host "📋 Copiando APK mais recente..." -ForegroundColor Yellow
        $apkSource = "$AndroidDir\app\build\outputs\apk\debug\app-debug.apk"
        
        if (Test-Path $apkSource) {
            $destination = "$ProjectRoot\$ApkName"
            Copy-Item $apkSource $destination -Force
            
            $apkInfo = Get-Item $destination
            $sizeMB = [math]::Round($apkInfo.Length / 1MB, 2)
            
            Write-Host "✅ APK copiado:" -ForegroundColor Green
            Write-Host "  📂 Para: $destination" -ForegroundColor Cyan
            Write-Host "  📊 Tamanho: $sizeMB MB" -ForegroundColor Cyan
        } else {
            Write-Error "❌ APK não encontrado. Execute build primeiro."
        }
    }
    
    "analyze" {
        Write-Host "📊 Analisando projeto FRIAXIS..." -ForegroundColor Yellow
        
        # Contagem de arquivos
        $kotlinFiles = (Get-ChildItem "$AndroidDir\app\src" -Filter "*.kt" -Recurse).Count
        $javaFiles = (Get-ChildItem "$AndroidDir\app\src" -Filter "*.java" -Recurse).Count
        $xmlFiles = (Get-ChildItem "$AndroidDir\app\src" -Filter "*.xml" -Recurse).Count
        
        Write-Host "📁 Estrutura do código:" -ForegroundColor Blue
        Write-Host "  🔹 Arquivos Kotlin: $kotlinFiles" -ForegroundColor Cyan
        Write-Host "  🔹 Arquivos Java: $javaFiles" -ForegroundColor Cyan
        Write-Host "  🔹 Arquivos XML: $xmlFiles" -ForegroundColor Cyan
        
        # Verificar dependências críticas
        $buildGradle = Get-Content "$AndroidDir\app\build.gradle" -Raw
        $hasRoom = $buildGradle -match "androidx.room"
        $hasRetrofit = $buildGradle -match "retrofit"
        $hasFirebase = $buildGradle -match "firebase"
        
        Write-Host "📚 Dependências principais:" -ForegroundColor Blue
        Write-Host "  🔹 Room Database: $(if($hasRoom){'✅'}else{'❌'})" -ForegroundColor Cyan
        Write-Host "  🔹 Retrofit HTTP: $(if($hasRetrofit){'✅'}else{'❌'})" -ForegroundColor Cyan
        Write-Host "  🔹 Firebase: $(if($hasFirebase){'✅'}else{'❌'})" -ForegroundColor Cyan
        
        # Tamanho do projeto
        $projectSize = (Get-ChildItem $AndroidDir -Recurse | Measure-Object -Property Length -Sum).Sum
        $projectSizeMB = [math]::Round($projectSize / 1MB, 2)
        Write-Host "📏 Tamanho total: $projectSizeMB MB" -ForegroundColor Blue
    }
    
    "backup" {
        Write-Host "💾 Criando backup do projeto..." -ForegroundColor Yellow
        $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        $backupName = "FRIAXIS-backup-$timestamp"
        $backupPath = "C:\$backupName"
        
        # Criar backup excluindo node_modules e build
        $excludePatterns = @(
            "node_modules",
            "build",
            "*.apk",
            ".gradle",
            "gradle-8.5-bin"
        )
        
        Write-Host "📁 Criando backup em: $backupPath" -ForegroundColor Cyan
        
        # Usar robocopy para backup eficiente
        $robocopyArgs = @(
            $ProjectRoot,
            $backupPath,
            "/E",  # Incluir subdiretórios vazios
            "/XD"  # Excluir diretórios
        ) + $excludePatterns
        
        & robocopy @robocopyArgs > $null
        
        if (Test-Path $backupPath) {
            $backupSize = (Get-ChildItem $backupPath -Recurse | Measure-Object -Property Length -Sum).Sum
            $backupSizeMB = [math]::Round($backupSize / 1MB, 2)
            
            Write-Host "✅ Backup criado com sucesso!" -ForegroundColor Green
            Write-Host "  📂 Local: $backupPath" -ForegroundColor Cyan
            Write-Host "  📊 Tamanho: $backupSizeMB MB" -ForegroundColor Cyan
        } else {
            Write-Error "❌ Falha ao criar backup"
        }
    }
}

Write-Host ""
Write-Host "🎯 Operação '$Action' concluída!" -ForegroundColor Green