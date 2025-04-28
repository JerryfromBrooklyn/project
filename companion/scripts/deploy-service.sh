#!/bin/bash

# Load environment variables
source ../.env

# Load auto-scaling configuration
AUTO_SCALING_CONFIG=$(cat aws/ecs/auto-scaling.json)

# Extract values from auto-scaling config
MIN_CAPACITY=$(echo $AUTO_SCALING_CONFIG | jq -r '.autoScalingConfiguration.minCapacity')
MAX_CAPACITY=$(echo $AUTO_SCALING_CONFIG | jq -r '.autoScalingConfiguration.maxCapacity')
TARGET_VALUE=$(echo $AUTO_SCALING_CONFIG | jq -r '.autoScalingConfiguration.targetTrackingScalingPolicies[0].targetValue')
SCALE_IN_COOLDOWN=$(echo $AUTO_SCALING_CONFIG | jq -r '.autoScalingConfiguration.targetTrackingScalingPolicies[0].scaleInCooldown')
SCALE_OUT_COOLDOWN=$(echo $AUTO_SCALING_CONFIG | jq -r '.autoScalingConfiguration.targetTrackingScalingPolicies[0].scaleOutCooldown')

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
  --min-capacity $MIN_CAPACITY \
  --max-capacity $MAX_CAPACITY

# Create scaling policy
echo "Creating scaling policy..."
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id service/companion-cluster/companion-service \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name CPUUtilization \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration "{
    \"TargetValue\": $TARGET_VALUE,
    \"PredefinedMetricSpecification\": {
      \"PredefinedMetricType\": \"ECSServiceAverageCPUUtilization\"
    },
    \"ScaleInCooldown\": $SCALE_IN_COOLDOWN,
    \"ScaleOutCooldown\": $SCALE_OUT_COOLDOWN
  }"

echo "Deployment complete! Service will:"
echo "- Start with 0 instances"
echo "- Scale between $MIN_CAPACITY and $MAX_CAPACITY instances"
echo "- Target CPU utilization: $TARGET_VALUE%"
echo "- Scale cooldown: $SCALE_IN_COOLDOWN seconds" 