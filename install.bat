@echo off
REM ============================================================
REM   HOTSPOT BILLING AGENT - MSAKINISHAJI (INSTALLER)
REM   Bonyeza mara mbili faili hii kusakinisha Agent.
REM ============================================================
setlocal

echo.
echo ============================================
echo   USAKINISHAJI WA HOTSPOT BILLING AGENT
echo ============================================
echo.

REM --- 1. Hakikisha Node.js ipo ---
where node >nul 2>nul
if %errorlevel% neq 0 (
  echo [!] Node.js haijapatikana.
  echo     Tafadhali sakinisha Node.js kutoka https://nodejs.org ^(toleo 18 au zaidi^)
  echo     kisha endesha faili hii tena.
  echo.
  pause
  exit /b 1
)
echo [1/4] Node.js imepatikana.

REM --- 2. Sakinisha dependencies (mara ya kwanza tu) ---
if not exist "node_modules" (
  echo [2/4] Inasakinisha vifaa vinavyohitajika... ^(subiri kidogo^)
  call npm install --omit=dev >install-log.txt 2>&1
  if %errorlevel% neq 0 (
    echo [!] Imeshindwa kusakinisha vifaa. Angalia install-log.txt
    pause
    exit /b 1
  )
) else (
  echo [2/4] Vifaa tayari vimesakinishwa.
)

REM --- 3. Jenga (kama dist haipo) ---
if not exist "dist\index.js" (
  echo [3/4] Inaandaa Agent...
  call npm run build >>install-log.txt 2>&1
) else (
  echo [3/4] Agent tayari imeandaliwa.
)

REM --- 4. Fungua Setup Wizard ---
echo [4/4] Inafungua Setup Wizard kwenye browser...
echo.
echo   Jaza taarifa kwenye browser:
echo     - Agent Token ^(kutoka dashboard^)
echo     - Taarifa za MikroTik
echo   Kisha bonyeza "Hifadhi".
echo.
echo   BAADA YA KUHIFADHI, funga dirisha hili na endesha:
echo     install-service.bat  ^(kusakinisha Agent kama service ya 24/7^)
echo.

node dist\index.js --setup

pause
