#!/usr/bin/env bash
# ==============================================================================
# DigiLib - History & Archaeological Digital Book Library Server
# Department of Ancient Indian History, Culture & Archaeology, RTMNU
# Concept & Design by K.S.Chandra, 2026, kavikondalaschandra@gmail.com
# ==============================================================================

echo "=============================================================================="
echo "  Department of Ancient Indian History, Culture & Archaeology"
echo "  Rashtrasant Tukadoji Maharaj Nagpur University"
echo "  Historical & Archaeological Digital Research Library"
echo "=============================================================================="

if ! command -v java &> /dev/null; then
    echo "[ERROR] Java is not installed or not in PATH."
    exit 1
fi

if [ ! -f "server/DigiLibServer.class" ]; then
    echo "[1/2] Compiling DigiLibServer.java..."
    javac -d . server/DigiLibServer.java
fi

echo "[2/2] Launching Java Server on http://localhost:8080 ..."
echo "Press Ctrl+C to terminate."

if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:8080 &
elif command -v open &> /dev/null; then
    open http://localhost:8080 &
fi

java -cp . server.DigiLibServer 8080
