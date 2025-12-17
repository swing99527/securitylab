#!/bin/bash

# IoT Security Platform - Quick Start Script
# This script helps you get the development environment up and running

set -e

echo "🚀 IoT Security Platform - Development Environment Setup"
echo "========================================================"

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file and update passwords/secrets before production use!"
fi

# Start infrastructure services first
echo ""
echo "🐳 Starting infrastructure services (PostgreSQL, Redis, MinIO)..."
docker-compose up -d postgres redis minio

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check health
echo "🏥 Checking service health..."
docker-compose ps

# Start application services
echo ""
echo "📦 Starting application services..."
docker-compose up -d auth-service core-service task-service file-service

echo ""
echo "✅ All services started!"
echo ""
echo "📋 Service URLs:"
echo "  - Auth Service:  http://localhost:8001/api/docs"
echo "  - Core Service:  http://localhost:8002/api/docs"
echo "  - Task Service:  http://localhost:8003/api/docs"  
echo "  - File Service:  http://localhost:8004/api/docs"
echo "  - MinIO Console: http://localhost:9001"
echo ""
echo "🔍 View logs:"
echo "  docker-compose logs -f [service-name]"
echo ""
echo "🛑 Stop all services:"
echo "  docker-compose down"
echo ""
