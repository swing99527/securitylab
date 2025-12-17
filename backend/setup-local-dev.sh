#!/bin/bash

# IoT Security Platform - Local Development Setup
# Use Poetry virtual environments for local development

set -e

echo "🚀 IoT Security Platform - Local Development Setup"
echo "===================================================="
echo ""

# Check if poetry is installed
if ! command -v poetry &> /dev/null; then
    echo "❌ Poetry is not installed!"
    echo ""
    echo "Please install Poetry first:"
    echo "  curl -sSL https://install.python-poetry.org | python3 -"
    echo "  or: brew install poetry"
    exit 1
fi

echo "✅ Poetry found: $(poetry --version)"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    
    # Update connection strings for local development
    sed -i '' 's|@postgres|@localhost|g' .env 2>/dev/null || sed -i 's|@postgres|@localhost|g' .env
    sed -i '' 's|@redis|@localhost|g' .env 2>/dev/null || sed -i 's|@redis|@localhost|g' .env
    sed -i '' 's|minio:9000|localhost:9000|g' .env 2>/dev/null || sed -i 's|minio:9000|localhost:9000|g' .env
    
    echo "✅ .env file created and updated for local development"
fi

# Start infrastructure services
echo ""
echo "🐳 Starting infrastructure (PostgreSQL, Redis, MinIO)..."
docker-compose up -d postgres redis minio gotenberg

echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service health
echo ""
echo "🏥 Checking infrastructure health..."
docker-compose ps postgres redis minio

# Install dependencies for all services
echo ""
echo "📦 Installing dependencies for all services..."

services=("auth" "core" "task" "file")

for service in "${services[@]}"; do
    echo ""
    echo "Installing dependencies for ${service}-service..."
    cd "services/${service}"
    poetry install
    cd ../..
done

echo ""
echo "✅ All dependencies installed!"
echo ""
echo "======================================================================"
echo "🎉 Local development environment is ready!"
echo "======================================================================"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Start each service in a separate terminal:"
echo ""
echo "   Terminal 1 - Auth Service:"
echo "   $ cd services/auth && poetry run uvicorn app.main:app --reload --port 8001"
echo ""
echo "   Terminal 2 - Core Service:"
echo "   $ cd services/core && poetry run uvicorn app.main:app --reload --port 8002"
echo ""
echo "   Terminal 3 - Task Service:"
echo "   $ cd services/task && poetry run uvicorn app.main:app --reload --port 8003"
echo ""
echo "   Terminal 4 - File Service:"
echo "   $ cd services/file && poetry run uvicorn app.main:app --reload --port 8004"
echo ""
echo "2. Or use tmux/screen to run all in one terminal"
echo ""
echo "3. Access API docs:"
echo "   - Auth:  http://localhost:8001/api/docs"
echo "   - Core:  http://localhost:8002/api/docs"
echo "   - Task:  http://localhost:8003/api/docs"
echo "   - File:  http://localhost:8004/api/docs"
echo ""
echo "4. MinIO Console: http://localhost:9001"
echo "   Username: minioadmin"
echo "   Password: minioadmin123"
echo ""
echo "💡 Tip: Use 'poetry shell' to activate virtual environment"
echo ""
