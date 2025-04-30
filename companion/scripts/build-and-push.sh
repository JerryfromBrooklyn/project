#!/bin/bash

# Load environment variables
source ../.env

# Set AWS region and account ID
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=774305584181
export ECR_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/companion-server:latest

# Create and use a builder instance with QEMU for cross-platform building
echo "Setting up buildx with QEMU..."
docker buildx create --name multiarch --driver docker-container --use
docker buildx inspect --bootstrap

# Login to ECR
echo "Logging in to ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Create ECR repository if it doesn't exist
echo "Ensuring ECR repository exists..."
aws ecr describe-repositories --repository-names companion-server || \
aws ecr create-repository --repository-name companion-server

# Build and push the image for linux/amd64
echo "Building and pushing Docker image for linux/amd64..."
docker buildx build \
  --platform linux/amd64 \
  --progress=plain \
  --no-cache \
  -t companion-server \
  -t $ECR_URI \
  --push \
  .

# Verify the image was built and pushed
echo "Verifying image..."
docker pull --platform linux/amd64 $ECR_URI

# Check image platform
echo "Checking image platform..."
docker inspect --platform linux/amd64 $ECR_URI | grep -A 5 "Architecture"

echo "Image built and pushed successfully to $ECR_URI" 