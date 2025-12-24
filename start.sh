#!/bin/bash

# Script to start both backend and frontend services
# Usage: ./start.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
PID_DIR="$SCRIPT_DIR/.pids"

# Create PID directory if it doesn't exist
mkdir -p "$PID_DIR"

echo "========================================="
echo "Starting Invoice Application"
echo "========================================="

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo "Port $port is already in use!"
        return 1
    fi
    return 0
}

# Check if backend port is available
if ! check_port 8080; then
    echo "Backend port 8080 is already in use. Please stop existing services first."
    echo "Run: ./stop.sh"
    exit 1
fi

# Check if frontend ports are available
if ! check_port 3000 && ! check_port 3001; then
    echo "Frontend ports 3000 and 3001 are both in use. Please stop existing services first."
    echo "Run: ./stop.sh"
    exit 1
fi

# Start backend
echo ""
echo "Starting backend on port 8080..."
cd "$BACKEND_DIR"
nohup mvn spring-boot:run > "$PID_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$PID_DIR/backend.pid"
echo "Backend started with PID: $BACKEND_PID"
echo "Backend logs: $PID_DIR/backend.log"

# Wait a bit for backend to initialize
echo "Waiting for backend to initialize..."
sleep 10

# Start frontend
echo ""
echo "Starting frontend..."
cd "$FRONTEND_DIR"

# Try port 3000 first, then 3001 if 3000 is taken
if check_port 3000; then
    echo "Starting frontend on port 3000..."
    nohup npm start > "$PID_DIR/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    FRONTEND_PORT=3000
else
    echo "Port 3000 is taken, starting frontend on port 3001..."
    nohup PORT=3001 npm start > "$PID_DIR/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    FRONTEND_PORT=3001
fi

echo $FRONTEND_PID > "$PID_DIR/frontend.pid"
echo $FRONTEND_PORT > "$PID_DIR/frontend.port"
echo "Frontend started with PID: $FRONTEND_PID"
echo "Frontend logs: $PID_DIR/frontend.log"

echo ""
echo "========================================="
echo "Application started successfully!"
echo "========================================="
echo "Backend:  http://localhost:8080"
echo "Frontend: http://localhost:$FRONTEND_PORT"
echo "GraphiQL: http://localhost:8080/graphiql"
echo ""
echo "To stop the application, run: ./stop.sh"
echo "To view logs:"
echo "  Backend:  tail -f $PID_DIR/backend.log"
echo "  Frontend: tail -f $PID_DIR/frontend.log"
echo "========================================="
