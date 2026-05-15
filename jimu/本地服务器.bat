@echo off
title Local No-Cache H5 Server

echo ============================================
echo 启动无缓存 H5 本地服务器
echo 地址: http://localhost:8000
echo 根目录: %cd%
echo ============================================

:: 检查 Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 未检测到 Python，请先安装 Python。
    pause
    exit /b
)

echo 启动服务器中...
python no_cache_server.py

pause
