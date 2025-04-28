#!/bin/bash

# AWS Configuration
REGION="us-east-1"
ACCOUNT_ID="774305584181"  # Replace with your actual AWS account ID
ECR_REPOSITORY="companion-server"
CLUSTER_NAME="companion-cluster"
SERVICE_NAME="companion-server"

# Login to ECR
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

# Build and tag the Docker image
docker build -t $ECR_REPOSITORY:latest .

# Tag the image for ECR
docker tag $ECR_REPOSITORY:latest $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPOSITORY:latest

# Push the image to ECR
docker push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPOSITORY:latest

# Update the ECS service to force a new deployment
aws ecs update-service --cluster $CLUSTER_NAME --service $SERVICE_NAME --force-new-deployment --region $REGION

echo "Deployment completed successfully!" 