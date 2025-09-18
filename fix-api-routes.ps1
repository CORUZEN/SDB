# Script para corrigir todas as API routes
# Adiciona export const dynamic = 'force-dynamic' em routes que podem usar headers

$apiRoutes = @(
    "app/api/admin/pending-devices/route.ts",
    "app/api/commands/route.ts", 
    "app/api/devices/route.ts",
    "app/api/devices/register/route.ts",
    "app/api/devices/register/[code]/route.ts",
    "app/api/devices/[id]/route.ts",
    "app/api/devices/[id]/location/route.ts",
    "app/api/devices/[id]/policy/apply/route.ts",
    "app/api/devices/[id]/report/route.ts",
    "app/api/events/route.ts",
    "app/api/locations/route.ts",
    "app/api/migrate/route.ts",
    "app/api/migrate/device-registrations/route.ts",
    "app/api/policies/route.ts",
    "app/api/policies/[id]/route.ts"
)

foreach ($route in $apiRoutes) {
    $filePath = $route
    if (Test-Path $filePath) {
        $content = Get-Content $filePath -Raw
        if ($content -notmatch "export const dynamic") {
            $lines = Get-Content $filePath
            $newContent = @()
            $importSectionEnded = $false
            
            foreach ($line in $lines) {
                $newContent += $line
                if ($line -match "^import.*from" -and !$importSectionEnded) {
                    # Continue
                } elseif ($line.Trim() -eq "" -and !$importSectionEnded) {
                    $newContent += "// Marcar como dinâmica para evitar problemas de build estático"
                    $newContent += "export const dynamic = 'force-dynamic';"
                    $newContent += ""
                    $importSectionEnded = $true
                } elseif (!$importSectionEnded) {
                    $newContent += "// Marcar como dinâmica para evitar problemas de build estático"
                    $newContent += "export const dynamic = 'force-dynamic';"
                    $newContent += ""
                    $importSectionEnded = $true
                }
            }
            
            $newContent | Set-Content $filePath -Encoding UTF8
            Write-Host "✅ Fixed: $filePath"
        } else {
            Write-Host "⏭️ Skip: $filePath (already has dynamic export)"
        }
    } else {
        Write-Host "❌ Not found: $filePath"
    }
}

Write-Host "🎉 API routes fixed!"