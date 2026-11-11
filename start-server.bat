@echo off
TITLE DigiLib - History & Archaeological Digital Book Library Server
COLOR 0E

echo ==============================================================================
echo   Department of Ancient Indian History, Culture & Archaeology
echo   Rashtrasant Tukadoji Maharaj Nagpur University
echo   Historical & Archaeological Digital Research Library
echo   Built around Ubooquity application platform - Tom Vaemendis
echo   Concept & Design by K.S.Chandra, 2026, kavikondalaschandra@gmail.com
echo ==============================================================================
echo.

:: Check Java
java -version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Java is not installed or not found on PATH.
    echo Please install Java 17+ or Java 21+ from https://adoptium.net/
    pause
    exit /b 1
)

:: Compile server if class file doesn't exist
if not exist "server\DigiLibServer.class" (
    echo [1/2] Compiling DigiLibServer.java...
    javac -d . server\DigiLibServer.java
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Compilation failed.
        pause
        exit /b 1
    )
)

echo [2/2] Launching Java Server on http://localhost:8080 ...
echo.
echo Opening browser in 2 seconds...
start "" http://localhost:8080

:: Run the Java Server
java -cp . server.DigiLibServer 8080

pause
