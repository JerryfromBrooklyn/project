#!/bin/bash

echo "🔍 Checking Companion ECS Optimization Status..."

# Check 1: Service Status and Desired Count
echo "📊 Checking Service Status and Desired Count..."
SERVICE_INFO=$(aws ecs describe-services --cluster companion-cluster --services companion-service --query 'services[0].[status,desiredCount,runningCount]' --output text)
read -r STATUS DESIRED_COUNT RUNNING_COUNT <<< "$SERVICE_INFO"

echo "Service Status: $STATUS"
echo "Desired Count: $DESIRED_COUNT"
echo "Running Count: $RUNNING_COUNT"

if [ "$DESIRED_COUNT" = "0" ]; then
    echo "✅ Desired count is set to 0 when not in use"
else
    echo "❌ Desired count is not 0 (current: $DESIRED_COUNT)"
fi

# Check 2: Auto-scaling Configuration
echo -e "\n📈 Checking Auto-scaling Configuration..."
AUTO_SCALING=$(aws application-autoscaling describe-scalable-targets --service-namespace ecs --resource-ids service/companion-cluster/companion-service --query 'ScalableTargets[0].[MinCapacity,MaxCapacity]' --output text)
read -r MIN_CAPACITY MAX_CAPACITY <<< "$AUTO_SCALING"

echo "Min Capacity: $MIN_CAPACITY"
echo "Max Capacity: $MAX_CAPACITY"

if [ "$MIN_CAPACITY" = "0" ]; then
    echo "✅ Auto-scaling can scale to 0"
else
    echo "❌ Auto-scaling cannot scale to 0 (min: $MIN_CAPACITY)"
fi

# Check 3: Instance Size
echo -e "\n💻 Checking Instance Size..."
TASK_DEF=$(aws ecs describe-task-definition --task-definition companion-server --query 'taskDefinition.[cpu,memory]' --output text)
read -r CPU MEMORY <<< "$TASK_DEF"

echo "CPU Units: $CPU"
echo "Memory (MB): $MEMORY"

if [ "$CPU" = "256" ] && [ "$MEMORY" = "512" ]; then
    echo "✅ Using minimal instance size (256 CPU units, 512MB memory)"
else
    echo "❌ Not using minimal instance size (current: $CPU CPU units, $MEMORY MB)"
fi

# Check 4: Scaling Policy
echo -e "\n⚙️ Checking Scaling Policy..."
SCALING_POLICY=$(aws application-autoscaling describe-scaling-policies --service-namespace ecs --resource-id service/companion-cluster/companion-service --query 'ScalingPolicies[0].TargetTrackingScalingPolicyConfiguration.[TargetValue,ScaleInCooldown,ScaleOutCooldown]' --output text)
read -r TARGET_VALUE SCALE_IN_COOLDOWN SCALE_OUT_COOLDOWN <<< "$SCALING_POLICY"

echo "Target CPU Utilization: $TARGET_VALUE%"
echo "Scale In Cooldown: $SCALE_IN_COOLDOWN seconds"
echo "Scale Out Cooldown: $SCALE_OUT_COOLDOWN seconds"

if [ "$TARGET_VALUE" = "30.0" ] && [ "$SCALE_IN_COOLDOWN" = "300" ] && [ "$SCALE_OUT_COOLDOWN" = "300" ]; then
    echo "✅ Proper scaling policy configured (30% CPU, 5min cooldown)"
else
    echo "❌ Scaling policy not optimally configured"
fi

echo -e "\n📝 Summary:"
if [ "$DESIRED_COUNT" = "0" ] && [ "$MIN_CAPACITY" = "0" ] && [ "$CPU" = "256" ] && [ "$MEMORY" = "512" ] && [ "$TARGET_VALUE" = "30.0" ]; then
    echo "✅ All optimization points are properly configured!"
else
    echo "⚠️ Some optimization points need attention. See details above."
fi 