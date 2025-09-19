# ================================
# FRIAXIS v4.0.0 - Deployment Script
# Sistema Multi-Tenant Completo
# ================================

Write-Host "🚀 FRIAXIS v4.0.0 - Starting Multi-Tenant Deployment..." -ForegroundColor Green
Write-Host ""

# Change to web app directory
Set-Location "apps\web"

try {
    # ================================
    # 1. Install Dependencies
    # ================================
    Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
    pnpm install
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to install dependencies"
    }
    
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
    Write-Host ""

    # ================================
    # 2. Build Application
    # ================================
    Write-Host "🔨 Building Next.js application..." -ForegroundColor Cyan
    pnpm build
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to build application"
    }
    
    Write-Host "✅ Application built successfully" -ForegroundColor Green
    Write-Host ""

    # ================================
    # 3. Start Development Server
    # ================================
    Write-Host "🌐 Starting development server..." -ForegroundColor Cyan
    Write-Host "   Server will start on: http://localhost:3000" -ForegroundColor Yellow
    Write-Host "   Use Ctrl+C to stop the server" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🔐 Multi-Tenant Features Active:" -ForegroundColor Magenta
    Write-Host "   • Middleware route protection" -ForegroundColor White
    Write-Host "   • Organization context resolution" -ForegroundColor White
    Write-Host "   • Role-based access control" -ForegroundColor White
    Write-Host "   • Firebase authentication" -ForegroundColor White
    Write-Host "   • API endpoint protection" -ForegroundColor White
    Write-Host ""
    
    # Start the server
    pnpm dev
    
} catch {
    Write-Host "❌ Deployment failed: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "   1. Check if Node.js and pnpm are installed" -ForegroundColor White
    Write-Host "   2. Verify you're in the correct directory" -ForegroundColor White
    Write-Host "   3. Check Firebase configuration" -ForegroundColor White
    Write-Host "   4. Ensure all environment variables are set" -ForegroundColor White
    exit 1
} finally {
    # Return to original directory
    Set-Location "..\.."
}