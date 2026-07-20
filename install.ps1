Write-Host "=========================================" -ForegroundColor Green
Write-Host "      AbiLang Windows Auto-Installer      " -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

# Check if Node.js is installed
if (Get-Command node -ErrorAction SilentlyContinue) {
    Write-Host "Node.js detected: $(node -v)" -ForegroundColor Cyan
} else {
    Write-Host "Error: Node.js is missing! Please install Node.js (v18+) from https://nodejs.org/" -ForegroundColor Red
    Exit 1
}

# Install npm packages
Write-Host "1. Installing Node dependencies..." -ForegroundColor Cyan
npm install

# Compile the project
Write-Host "2. Compiling TypeScript compiler..." -ForegroundColor Cyan
npm run build

# Link executable globally
Write-Host "3. Registering global 'abi' command in system PATH..." -ForegroundColor Cyan
npm link

# Install syntax highlighting support for local IDEs
Write-Host "4. Configuring local IDE syntax coloring..." -ForegroundColor Cyan
node scripts/install-syntax.js

Write-Host "`nInstallation Completed Successfully!" -ForegroundColor Green
Write-Host "You can now run AbiLang scripts from any directory using: abi <script.vue>" -ForegroundColor Yellow
Write-Host "Try starting the interactive console by typing: abi" -ForegroundColor Yellow
