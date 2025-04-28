#!/bin/bash

# Load environment variables
source ../.env

# Set AWS region
export AWS_REGION=us-east-1

# Create ECS service with auto-scaling
echo "Creating ECS service with auto-scaling..."
aws ecs create-service \
  --cluster companion-cluster \
  --service-name companion-service \
  --task-definition companion-server \
  --desired-count 0 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-0f56e62621f2dc96d,subnet-038a3341a4e66d4cb,subnet-0412648d558470e24],securityGroups=[sg-08ed6c6d8da16fd10],assignPublicIp=ENABLED}" \
  --scheduling-strategy REPLICA

# Register auto-scaling target
echo "Registering auto-scaling target..."
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/companion-cluster/companion-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 0 \
  --max-capacity 1

# Create scaling policy
echo "Creating scaling policy..."
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

echo "Deployment complete! Service will scale to 0 when not in use." 