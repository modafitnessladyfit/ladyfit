@echo off
setlocal

set "APP_DIR=C:\Codex\Games\ladyfit-collection"
set "PORT=8080"
set "URL=http://127.0.0.1:%PORT%/"

title Skill360 - Inicializador

cd /d "%APP_DIR%"

if errorlevel 1 (
    echo.
    echo ERRO: Nao foi possivel acessar:
    echo %APP_DIR%
    echo.
    pause
    exit /b 1
)

where node.exe >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERRO: Node.js nao foi encontrado.
    echo Instale o Node.js e tente novamente.
    echo.
    pause
    exit /b 1
)

where npm.cmd >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERRO: npm nao foi encontrado.
    echo Reinstale o Node.js e tente novamente.
    echo.
    pause
    exit /b 1
)

echo.
echo Verificando dependencias...
echo.

call npm.cmd ls --depth=0 >nul 2>&1

if errorlevel 1 (
    echo Dependencias ausentes ou desatualizadas.
    echo Instalando versoes definidas no package-lock.json...
    echo.

    call npm.cmd ci

    if errorlevel 1 (
        echo.
        echo ERRO: Nao foi possivel instalar as dependencias.
        echo Verifique a conexao com a internet e as mensagens acima.
        echo.
        pause
        exit /b 1
    )
)

curl.exe --silent --fail "%URL%" >nul 2>&1
if not errorlevel 1 (
    echo O Skill360 ja esta respondendo na porta %PORT%.
    goto :abrir
)

echo.
echo Iniciando o Skill360...
echo.

start "ladyfit Local Server" cmd /k "cd /d ""%APP_DIR%"" && npm.cmd run dev -- --host 127.0.0.1 --port %PORT%"

echo Aguardando o servidor ficar disponivel...

for /l %%I in (1,1,60) do (
    curl.exe --silent --fail "%URL%" >nul 2>&1
    if not errorlevel 1 goto :abrir
    timeout /t 1 /nobreak >nul
)

echo.
echo ERRO: O servidor nao respondeu em 60 segundos.
echo Consulte a janela "Ladifit Local Server".
echo.
pause
exit /b 1

:abrir
echo Servidor disponivel em %URL%
start "" "%URL%"

endlocal
exit /b 0