@echo off
cd /d "%~dp0"
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do if not defined IP set "IP=%%a"
for /f "tokens=* delims= " %%b in ("%IP%") do set "IP=%%b"
echo.
echo   回家种苞米 · 局域网预览服务
echo   ------------------------------------------------
echo   电脑打开:  http://localhost:8080/
echo   手机打开:  http://%IP%:8080/
echo   ------------------------------------------------
echo   手机和电脑要在同一个 Wi-Fi 下；关掉本窗口即停止服务。
echo   代码不缓存 —— 改完存盘，刷新页面就能看到。
echo.
if exist "%~dp0serve.py" (
  python "%~dp0serve.py" 8080
) else (
  python -m http.server 8080 --bind 0.0.0.0
)
pause