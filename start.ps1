# 小红书矩阵运营 - 一键启动脚本
# 同时启动后端 (FastAPI) 和前端 (Vite)

$BackendPort = 8000
$FrontendPort = 5173

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  小红书矩阵运营 - 启动中..." -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# 启动后端
Write-Host "[1/2] 启动后端 (FastAPI) ..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    param($port)
    Set-Location $using:PWD
    python main.py --port $port
} -ArgumentList $BackendPort

Start-Sleep -Seconds 3

# 检查后端是否启动成功
$backendCheck = curl -s http://127.0.0.1:$BackendPort/api/health 2>$null
if ($backendCheck -match "ok") {
    Write-Host "  ✅ 后端已启动: http://127.0.0.1:$BackendPort" -ForegroundColor Green
    Write-Host "  📖 Swagger 文档: http://127.0.0.1:$BackendPort/docs" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  后端启动中，请稍候..." -ForegroundColor Yellow
}

# 启动前端
Write-Host ""
Write-Host "[2/2] 启动前端 (Vite) ..." -ForegroundColor Yellow
$frontendJob = Start-Job -ScriptBlock {
    param($port)
    Set-Location (Join-Path $using:PWD "frontend")
    npx vite --host 127.0.0.1 --port $port
} -ArgumentList $FrontendPort

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  系统已启动！" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  前端: http://127.0.0.1:$FrontendPort" -ForegroundColor Green
Write-Host "  后端: http://127.0.0.1:$BackendPort/docs" -ForegroundColor Green
Write-Host "  登录: admin / admin123" -ForegroundColor Green
Write-Host ""
Write-Host "  关闭此窗口即可停止所有服务" -ForegroundColor Gray
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# 等待用户关闭
Write-Host "按 Ctrl+C 停止所有服务..." -ForegroundColor Gray
while ($true) {
    Start-Sleep -Seconds 10
    
    # 检查进程是否存活
    $beRunning = Get-Job -Id $backendJob.Id -ErrorAction SilentlyContinue
    $feRunning = Get-Job -Id $frontendJob.Id -ErrorAction SilentlyContinue
    
    if (-not $beRunning -or $beRunning.State -eq "Failed") {
        Write-Host "⚠️ 后端已停止，请重启脚本" -ForegroundColor Red
        break
    }
    if (-not $feRunning -or $feRunning.State -eq "Failed") {
        Write-Host "⚠️ 前端已停止，请重启脚本" -ForegroundColor Red
        break
    }
}
