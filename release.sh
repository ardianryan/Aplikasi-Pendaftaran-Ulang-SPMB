#!/bin/bash

# Release script for SPMB-WA
VERSION="0.2.0"
IMAGE_NAME="ardianryan/registrasi-spmb"

echo "📦 Starting release for version $VERSION..."

# Build the image
echo "🔨 Building Docker image..."
docker build -t $IMAGE_NAME:$VERSION .

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# Tag as latest
echo "🏷️  Tagging as latest..."
docker tag $IMAGE_NAME:$VERSION $IMAGE_NAME:latest

# Push to Docker Hub
echo "🚀 Pushing to Docker Hub..."
docker push $IMAGE_NAME:$VERSION
docker push $IMAGE_NAME:latest

echo "✅ Release $VERSION pushed successfully!"
