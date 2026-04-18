#!/bin/bash
set -e

IMAGE="denidarta/revobank:latest"

echo "Building and pushing $IMAGE..."
docker buildx build --platform linux/amd64 -t $IMAGE --push .

echo "Done! Image pushed to Docker Hub."
echo "Trigger a redeploy on Railway to apply the changes."
