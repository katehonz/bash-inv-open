#!/bin/bash
# SP-INV Update Script
# Usage: ./update.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  SP-INV Update Script${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "${YELLOW}[1/5] Pulling latest changes from GitLab...${NC}"
git pull origin master

echo -e "${YELLOW}[2/5] Building backend...${NC}"
cd backend
mvn clean package -DskipTests -q
cd ..

echo -e "${YELLOW}[3/5] Building frontend...${NC}"
cd frontend
npm ci --silent
npm run build 2>/dev/null
cd ..

echo -e "${YELLOW}[4/5] Restarting backend service...${NC}"
if systemctl is-active --quiet sp-inv-backend; then
    sudo systemctl restart sp-inv-backend
    echo -e "${GREEN}Backend restarted${NC}"
else
    echo -e "${YELLOW}Backend service not running, starting...${NC}"
    sudo systemctl start sp-inv-backend
fi

echo -e "${YELLOW}[5/5] Checking health...${NC}"
sleep 5
for i in {1..20}; do
    if curl -s http://localhost:8080/actuator/health | grep -q '"status":"UP"'; then
        echo -e "${GREEN}Backend is healthy!${NC}"
        break
    fi
    if [ $i -eq 20 ]; then
        echo -e "${RED}Health check failed!${NC}"
        sudo journalctl -u sp-inv-backend --no-pager -n 30
        exit 1
    fi
    echo "Waiting... ($i/20)"
    sleep 2
done

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Update Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Application: ${YELLOW}https://inv.cyberbuch.org${NC}"
