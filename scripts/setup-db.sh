#!/bin/bash

echo "🚀 Setting up Data Nexus database..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install docker-compose first."
    exit 1
fi

# Start PostgreSQL container
echo "📦 Starting PostgreSQL container..."
if docker compose version &> /dev/null; then
    docker compose up -d || sudo docker compose up -d
else
    docker-compose up -d || sudo docker-compose up -d
fi

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Check if container is running
if ! docker ps 2>/dev/null | grep -q data-nexus-db && ! sudo docker ps 2>/dev/null | grep -q data-nexus-db; then
    echo "❌ Failed to start database container"
    echo "💡 Tip: You may need to run: sudo usermod -aG docker $USER"
    echo "   Then log out and back in, or use: sudo docker compose up -d"
    exit 1
fi

echo "✅ Database container is running!"
echo ""
echo "📊 Setting up database schema..."

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push --accept-data-loss

# Seed test user
echo ""
echo "👤 Creating test user..."
npm run db:seed

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Test user credentials:"
echo "  Email: test@example.com"
echo "  Password: testpassword123"
echo ""
echo "To stop the database: docker compose down"
echo "To view database: npx prisma studio"

