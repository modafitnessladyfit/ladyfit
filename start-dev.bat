@echo off
setlocal enabledelayedexpansion

set PORT=3012
set URL=http://localhost:%PORT%/
cd /d "%~dp0"

echo Verificando se ja existe um servidor rodando na porta %PORT%...

netstat -ano | findstr ":%PORT% " | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo Servidor ja esta rodando na porta %PORT%.
    echo Abrindo %URL% no navegador...
    start "" "%URL%"
    goto :end
)

echo Nenhum servidor encontrado na porta %PORT%.

rem --- Resolve o executavel do npm (nao depende do PATH do momento) ---
set "NPM_CMD="

npm --version >nul 2>&1
if %ERRORLEVEL% == 0 (
    set "NPM_CMD=npm"
) else (
    if exist "%ProgramFiles%\nodejs\npm.cmd" (
        set "NPM_CMD=%ProgramFiles%\nodejs\npm.cmd"
    ) else if exist "%ProgramFiles(x86)%\nodejs\npm.cmd" (
        set "NPM_CMD=%ProgramFiles(x86)%\nodejs\npm.cmd"
    ) else if exist "%LocalAppData%\Programs\nodejs\npm.cmd" (
        set "NPM_CMD=%LocalAppData%\Programs\nodejs\npm.cmd"
    ) else if exist "%APPDATA%\npm\npm.cmd" (
        set "NPM_CMD=%APPDATA%\npm\npm.cmd"
    )
)

if not defined NPM_CMD (
    echo ERRO: npm nao foi encontrado no PATH nem nos locais padrao de instalacao.
    echo Instale o Node.js em https://nodejs.org e tente novamente.
    pause
    goto :end
)

echo Usando npm em: %NPM_CMD%

rem --- Instala dependencias se necessario ---
if not exist "node_modules" (
    echo Dependencias nao instaladas. Rodando "npm install"...
    call "%NPM_CMD%" install
    if !ERRORLEVEL! NEQ 0 (
        echo ERRO: falha ao instalar dependencias.
        pause
        goto :end
    )
)

echo Iniciando servidor de desenvolvimento na porta %PORT%...
start "Ladyfit Dev Server" cmd /k ""%NPM_CMD%" run dev -- --port %PORT%"

echo Aguardando o servidor inicializar...
:wait_loop
timeout /t 2 /nobreak >nul
netstat -ano | findstr ":%PORT% " | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    goto :wait_loop
)

echo Servidor pronto! Abrindo %URL% no navegador...
start "" "%URL%"

:end
endlocal
