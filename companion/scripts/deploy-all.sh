#!/bin/bash

# Exit on error
set -e

# Set AWS region and account ID
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=774305584181
export ECR_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/companion-server:latest

echo "🚀 Starting Companion Server Deployment..."

# Step 1: Setup Docker buildx for cross-platform building
echo "📦 Setting up Docker buildx..."
# Remove existing buildx instance if it exists
docker buildx rm multiarch || true
# Create new buildx instance
docker buildx create --name multiarch --driver docker-container --use
docker buildx inspect --bootstrap

# Step 2: Login to ECR
echo "🔑 Logging in to ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Step 3: Create ECR repository if it doesn't exist
echo "📁 Creating/Verifying ECR repository..."
aws ecr describe-repositories --repository-names companion-server || \
aws ecr create-repository --repository-name companion-server

# Step 4: Build and push Docker image
echo "🏗️ Building and pushing Docker image..."
# Change to the companion directory where Dockerfile is located
cd "$(dirname "$0")/.."
# Build with explicit context
docker buildx build \
  --platform linux/amd64 \
  --progress=plain \
  --no-cache \
  --build-arg BUILDPLATFORM=linux/amd64 \
  --build-arg TARGETPLATFORM=linux/amd64 \
  -t $ECR_URI \
  --push \
  -f Dockerfile \
  .

# Step 5: Create ECS cluster if it doesn't exist
echo "🏢 Creating/Verifying ECS cluster..."
aws ecs describe-clusters --clusters companion-cluster || \
aws ecs create-cluster --cluster-name companion-cluster

# Step 6: Ensure IAM roles exist
echo "🔐 Ensuring IAM roles exist..."

# Create or update ECS task execution role
aws iam create-role --role-name ecsTaskExecutionRole --assume-role-policy-document '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}' || true

# Attach necessary policies to ECS task execution role
aws iam attach-role-policy --role-name ecsTaskExecutionRole --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy || true
aws iam attach-role-policy --role-name ecsTaskExecutionRole --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly || true

# Create or update companion task role
aws iam create-role --role-name companionTaskRole --assume-role-policy-document '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}' || true

# Attach necessary policies to companion task role
aws iam attach-role-policy --role-name companionTaskRole --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess || true
aws iam attach-role-policy --role-name companionTaskRole --policy-arn arn:aws:iam::aws:policy/AmazonSSMReadOnlyAccess || true

# Step 7: Create/Update ECS service
echo "⚙️ Creating/Updating ECS service..."
aws ecs describe-services --cluster companion-cluster --services companion-service || \
aws ecs create-service \
  --cluster companion-cluster \
  --service-name companion-service \
  --task-definition companion-server \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-0f56e62621f2dc96d,subnet-038a3341a4e66d4cb,subnet-0412648d558470e24],securityGroups=[sg-08ed6c6d8da16fd10],assignPublicIp=ENABLED}" \
  --scheduling-strategy REPLICA

# Wait for service to become active
echo "⏳ Waiting for service to become active..."
MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  SERVICE_STATUS=$(aws ecs describe-services --cluster companion-cluster --services companion-service --query 'services[0].status' --output text)
  if [ "$SERVICE_STATUS" = "ACTIVE" ]; then
    break
  fi
  echo "Service status: $SERVICE_STATUS, waiting... (Attempt $((RETRY_COUNT + 1)) of $MAX_RETRIES)"
  sleep 10
  RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "❌ Service failed to become active after $MAX_RETRIES attempts"
  echo "Checking service events for more information..."
  aws ecs describe-services --cluster companion-cluster --services companion-service --query 'services[0].events[0:5]' --output text
  exit 1
fi

# Step 8: Setup auto-scaling
echo "📈 Setting up auto-scaling..."
# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/companion-cluster/companion-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 0 \
  --max-capacity 1

# Create scaling policy
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id service/companion-cluster/companion-service \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name CPUUtilization \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 30.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleInCooldown": 300,
    "ScaleOutCooldown": 300
  }'

# Step 9: Force new deployment
echo "🔄 Forcing new deployment..."
aws ecs update-service \
  --cluster companion-cluster \
  --service companion-service \
  --force-new-deployment

# Step 10: Verify deployment
echo "✅ Verifying deployment..."
echo "Waiting for service to stabilize..."
sleep 30

# Get service status
SERVICE_STATUS=$(aws ecs describe-services --cluster companion-cluster --services companion-service --query 'services[0].status' --output text)
echo "Service status: $SERVICE_STATUS"

# Get task status
TASK_COUNT=$(aws ecs describe-services --cluster companion-cluster --services companion-service --query 'services[0].runningCount' --output text)
echo "Running tasks: $TASK_COUNT"

echo "🎉 Deployment complete!"
echo "Companion server is now deployed and will:"
echo "- Scale to 0 when idle"
echo "- Scale up when CPU > 30%"
echo "- Use minimal resources"
echo "- Auto-scale based on demand"

# Get public IP if service is running
if [ "$TASK_COUNT" -gt 0 ]; then
  TASK_ARN=$(aws ecs list-tasks --cluster companion-cluster --service-name companion-service --query 'taskArns[0]' --output text)
  NETWORK_INTERFACE=$(aws ecs describe-tasks --cluster companion-cluster --tasks $TASK_ARN --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' --output text)
  PUBLIC_IP=$(aws ec2 describe-network-interfaces --network-interface-ids $NETWORK_INTERFACE --query 'NetworkInterfaces[0].Association.PublicIp' --output text)
  echo "🌐 Public IP: $PUBLIC_IP"
  echo "🔗 Health check URL: http://$PUBLIC_IP:3020/health"
fi 