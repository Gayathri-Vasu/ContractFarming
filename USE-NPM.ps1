# Run this script AFTER installing Node.js from https://nodejs.org
# It adds Node to PATH for this session so "npm" works without restarting the terminal.

$nodePath = "C:\Program Files\nodejs"
if (Test-Path "$nodePath\node.exe") {
  $env:Path = "$nodePath;$env:Path"
  Write-Host "Node added to PATH for this session." -ForegroundColor Green
  Write-Host "node: $(node -v)" -ForegroundColor Cyan
  Write-Host "npm:  $(npm -v)" -ForegroundColor Cyan
  Write-Host "`nYou can now run: npm install" -ForegroundColor Yellow
} else {
  Write-Host "Node.js not found at $nodePath" -ForegroundColor Red
  Write-Host "1. Install from https://nodejs.org (LTS)" -ForegroundColor Yellow
  Write-Host "2. Use default install path" -ForegroundColor Yellow
  Write-Host "3. Run this script again, or close and reopen the terminal" -ForegroundColor Yellow
}
