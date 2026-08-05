@echo off
REM ====================================================================
REM  Hotspot Billing — Enterprise Agent — Windows Installer
REM  Husakinisha agent kama Windows Service inayojianzisha yenyewe.
REM  Endesha kama Administrator (right-click -> Run as administrator).
REM ====================================================================

echo.
echo === Hotspot Billing Agent - Usakinishaji ===
echo.

REM 1. Hakikisha Node.js ipo
where node >nul 2>nul
if %errorlevel% neq 0 (
  echo [KOSA] Node.js haijapatikana. Sakinisha kutoka https://nodejs.org (LTS)
  pause
  exit /b 1
)

REM 2. Sakinisha dependencies
echo [1/4] Nasakinisha dependencies...
call npm install --omit=dev
call npm install node-windows

REM 3. Jenga (build)
echo [2/4] Najenga agent...
call npm run build

REM 4. Hakikisha .env ipo
if not exist ".env" (
  echo [ONYO] Faili .env haipo. Nakili .env.example -^> .env kisha weka:
  echo        SUPABASE_URL, SUPABASE_ANON_KEY, AGENT_TOKEN
  copy .env.example .env
  echo Fungua .env, weka thamani, kisha endesha tena skripti hii.
  pause
  exit /b 1
)

REM 5. Sakinisha kama service
echo [3/4] Nasakinisha Windows Service...
call npm run service:install

echo [4/4] Imekamilika!
echo Service "HotspotBillingAgent" imesakinishwa na inajianzisha yenyewe.
echo Angalia: services.msc
pause
