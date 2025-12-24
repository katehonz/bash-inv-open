#!/bin/bash
# Скрипт за стартиране на sp-inv-master приложението

set -e

echo "==================================="
echo "Starting Invoice Application (sp-inv-master)"
echo "==================================="

# Проверка дали rs-ac-bg мрежата съществува
if ! docker network inspect rs-ac-bg_accounting_network >/dev/null 2>&1; then
    echo "ERROR: rs-ac-bg_accounting_network не съществува!"
    echo "Моля, първо стартирайте rs-ac-bg приложението:"
    echo "  cd /home/rshet/hetz-rs/rs-ac-bg"
    echo "  docker compose up -d"
    exit 1
fi

# Проверка дали accounting_db контейнерът работи
if ! docker ps | grep -q accounting_db; then
    echo "ERROR: accounting_db контейнерът не е стартиран!"
    echo "Моля, първо стартирайте rs-ac-bg приложението."
    exit 1
fi

echo "✓ rs-ac-bg мрежата е налична"
echo "✓ PostgreSQL контейнерът работи"
echo ""

# Проверка за .env файл
if [ ! -f .env ]; then
    echo "⚠ WARNING: .env файлът не съществува!"
    echo "Копирам .env.example като .env..."
    cp .env.example .env
    echo "✓ Моля, редактирайте .env файла с вашите настройки"
fi

echo "Building and starting containers..."
docker compose up -d --build

echo ""
echo "==================================="
echo "Waiting for services to be healthy..."
echo "==================================="

# Изчакване за backend
echo -n "Waiting for invoicing_backend"
for i in {1..60}; do
    if docker ps | grep -q invoicing_backend; then
        if docker exec invoicing_backend curl -f http://localhost:8080/actuator/health >/dev/null 2>&1; then
            echo " ✓"
            break
        fi
    fi
    echo -n "."
    sleep 2
done

# Изчакване за frontend
echo -n "Waiting for invoicing_frontend"
for i in {1..30}; do
    if docker ps | grep -q invoicing_frontend; then
        if docker exec invoicing_frontend wget --quiet --tries=1 --spider http://localhost:80/ >/dev/null 2>&1; then
            echo " ✓"
            break
        fi
    fi
    echo -n "."
    sleep 2
done

echo ""
echo "==================================="
echo "✓ Invoice Application Started!"
echo "==================================="
echo ""
echo "Services:"
echo "  Backend:  http://localhost:8080"
echo "  Frontend: http://localhost:80 (via nginx)"
echo "  GraphQL:  http://localhost:8080/graphql"
echo ""
echo "Domain (via Caddy):"
echo "  https://your-domain.com"
echo ""
echo "Logs:"
echo "  docker compose logs -f"
echo ""
echo "Stop:"
echo "  docker compose down"
echo ""
