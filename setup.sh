#!/bin/bash

echo "🛡️  Tenant Deposit Shield - Setup Script"
echo "======================================="
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi

# Check for pnpm
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Installing pnpm..."
    npm install -g pnpm
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Check if Docker is running
if docker info > /dev/null 2>&1; then
    echo "🐳 Docker is running. Starting services..."
    docker-compose up -d

    # Wait for PostgreSQL to be ready
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 5

    # Run migrations
    echo "🔄 Running database migrations..."
    pnpm -F api db:generate
    pnpm -F api db:migrate

    # Seed database
    echo "🌱 Seeding database..."
    pnpm -F api db:seed
else
    echo "⚠️  Docker is not running. You'll need to:"
    echo "   1. Install PostgreSQL 16+ locally"
    echo "   2. Install Redis 7+ locally"
    echo "   3. Update DATABASE_URL in .env.local"
    echo "   4. Run: pnpm -F api db:migrate"
    echo "   5. Run: pnpm -F api db:seed"
    echo ""
    echo "Or start Docker Desktop and run this script again."
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the development servers:"
echo "  pnpm dev"
echo ""
echo "Or start individually:"
echo "  pnpm -F api dev    # Backend API (http://localhost:4000)"
echo "  pnpm -F web dev    # Frontend Web (http://localhost:3000)"
echo ""
echo "Test accounts are available in the README.md file."