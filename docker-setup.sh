#!/bin/bash

# Simple setup script for SPMB-WA Docker

echo "🚀 Starting SPMB-WA Docker Setup..."

# Check if .env exists, if not copy from .env.example
if [ ! -f .env ]; then
    echo "📝 .env file not found, creating from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update the .env file with your specific credentials (R2, SSO, Google OAuth) if needed."
else
    echo "✅ .env file already exists."
fi

# Build and start the containers
echo "Building and starting Docker containers..."
docker-compose up -d --build

echo "⏳ Waiting for MongoDB to be ready (5s)..."
sleep 5

# Ask if the user wants to seed the database
read -p "❓ Do you want to seed the database with default admin? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Seeding database..."
    docker-compose exec app bun run seed
fi

echo ""
echo "✨ Setup complete!"
echo "📱 App is running at: http://localhost:3000"
echo "🗄️  Mongo Express is running at: http://localhost:8081 (user: root, pass: password)"
echo ""
echo "To view logs, run: docker-compose logs -f"
echo "To stop the app, run: docker-compose down"
