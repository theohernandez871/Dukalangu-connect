@echo off
REM ============================================================
REM   SAKINISHA AGENT KAMA SERVICE YA 24/7
REM   Endesha hii BAADA ya kumaliza Setup Wizard (install.bat).
REM   MUHIMU: Bonyeza kulia -> "Run as administrator"
REM ============================================================
setlocal

echo.
echo ============================================
echo   SAKINISHA AGENT SERVICE (24/7)
echo ============================================
echo.

REM Hakikisha inaendeshwa kama Administrator
net session >nul 2>nul
if %errorlevel% neq 0 (
  echo [!] Tafadhali endesha faili hii kama Administrator:
  echo     Bonyeza kulia -^> "Run as administrator"
  echo.
  pause
  exit /b 1
)

echo Inasakinisha Agent kama Windows Service...
call npm run service:install
if %errorlevel% neq 0 (
  echo [!] Imeshindwa. Angalia kama Setup Wizard ilikamilika.
  pause
  exit /b 1
)

echo.
echo ============================================
echo   IMEKAMILIKA!
echo   Agent sasa inaendesha 24/7 na itajianzisha
echo   kila kompyuta inapowashwa.
echo   Angalia dashboard - router itakuwa ONLINE.
echo ============================================
echo.
pause
