#!/bin/bash

# Script to stop both backend and frontend services
# Usage: ./stop.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_DIR="$SCRIPT_DIR/.pids"

echo "========================================="
echo "Stopping Invoice Application"
echo "========================================="

# Function to kill processes on a specific port
kill_port() {
    local port=$1
    local service_name=$2

    echo ""
    echo "Checking for processes on port $port ($service_name)..."

    # Find PIDs using the port
    PIDS=$(lsof -ti:$port 2>/dev/null)

    if [ -z "$PIDS" ]; then
        echo "No processes found on port $port"
        return 0
    fi

    echo "Found processes on port $port: $PIDS"

    # Kill each process
    for PID in $PIDS; do
        echo "Killing process $PID..."
        kill $PID 2>/dev/null || true

        # Wait a bit and check if it's still running
        sleep 2

        # Force kill if still running
        if ps -p $PID > /dev/null 2>&1; then
            echo "Process $PID still running, force killing..."
            kill -9 $PID 2>/dev/null || true
        fi
    done

    echo "Stopped $service_name on port $port"
}

# Function to kill process by PID file
kill_by_pidfile() {
    local pidfile=$1
    local service_name=$2

    if [ -f "$pidfile" ]; then
        PID=$(cat "$pidfile")
        if [ ! -z "$PID" ] && ps -p $PID > /dev/null 2>&1; then
            echo "Killing $service_name (PID: $PID) from pidfile..."
            kill $PID 2>/dev/null || true
            sleep 2

            # Force kill if still running
            if ps -p $PID > /dev/null 2>&1; then
                echo "Force killing $service_name (PID: $PID)..."
                kill -9 $PID 2>/dev/null || true
            fi
        fi
        rm -f "$pidfile"
    fi
}

# Stop backend
echo ""
echo "Stopping backend..."
kill_by_pidfile "$PID_DIR/backend.pid" "backend"
kill_port 8080 "backend"

# Also kill any remaining mvn processes
echo ""
echo "Checking for remaining Maven processes..."
MVN_PIDS=$(pgrep -f "mvn spring-boot:run" 2>/dev/null)
if [ ! -z "$MVN_PIDS" ]; then
    echo "Found Maven processes: $MVN_PIDS"
    for PID in $MVN_PIDS; do
        echo "Killing Maven process $PID..."
        kill $PID 2>/dev/null || true
        sleep 1
        if ps -p $PID > /dev/null 2>&1; then
            kill -9 $PID 2>/dev/null || true
        fi
    done
fi

# Also kill any remaining Java processes from the backend
echo ""
echo "Checking for remaining Java backend processes..."
JAVA_PIDS=$(pgrep -f "invoiceapp.backend.BackendApplication" 2>/dev/null)
if [ ! -z "$JAVA_PIDS" ]; then
    echo "Found Java backend processes: $JAVA_PIDS"
    for PID in $JAVA_PIDS; do
        echo "Killing Java process $PID..."
        kill $PID 2>/dev/null || true
        sleep 1
        if ps -p $PID > /dev/null 2>&1; then
            kill -9 $PID 2>/dev/null || true
        fi
    done
fi

# Stop frontend
echo ""
echo "Stopping frontend..."
kill_by_pidfile "$PID_DIR/frontend.pid" "frontend"

# Check both possible frontend ports
kill_port 3000 "frontend"
kill_port 3001 "frontend"

# Also kill any remaining node processes for react-scripts
echo ""
echo "Checking for remaining React processes..."
NODE_PIDS=$(pgrep -f "react-scripts start" 2>/dev/null)
if [ ! -z "$NODE_PIDS" ]; then
    echo "Found React processes: $NODE_PIDS"
    for PID in $NODE_PIDS; do
        echo "Killing React process $PID..."
        kill $PID 2>/dev/null || true
        sleep 1
        if ps -p $PID > /dev/null 2>&1; then
            kill -9 $PID 2>/dev/null || true
        fi
    done
fi

# Clean up PID directory
if [ -d "$PID_DIR" ]; then
    rm -rf "$PID_DIR"
    echo ""
    echo "Cleaned up PID directory"
fi

echo ""
echo "========================================="
echo "Application stopped successfully!"
echo "========================================="
echo ""
echo "All processes on ports 3000, 3001, and 8080 have been terminated."
echo ""
echo "To start the application again, run: ./start.sh"
echo "========================================="
