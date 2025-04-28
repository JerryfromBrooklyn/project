#!/bin/bash

echo "🔍 Monitoring Companion Service Tasks..."

# Function to get current time in ISO format
get_time() {
  date -u +%Y-%m-%dT%H:%M:%SZ
}

# Function to get time 1 hour ago
get_time_1h_ago() {
  date -v-1H -u +%Y-%m-%dT%H:%M:%SZ
}

# 1. Check Current Task Status
echo -e "\n📊 Current Task Status:"
SERVICE_INFO=$(aws ecs describe-services \
  --cluster companion-cluster \
  --services companion-service \
  --query 'services[0].[desiredCount,runningCount,status]' \
  --output text)
read -r DESIRED_COUNT RUNNING_COUNT STATUS <<< "$SERVICE_INFO"

echo "Desired Tasks: $DESIRED_COUNT"
echo "Running Tasks: $RUNNING_COUNT"
echo "Service Status: $STATUS"

if [ "$RUNNING_COUNT" -gt 0 ]; then
  echo "✅ Tasks are currently running"
else
  echo "⏳ No tasks running"
fi

# 2. Check Recent Scaling Activities
echo -e "\n📈 Recent Scaling Activities:"
aws application-autoscaling describe-scaling-activities \
  --service-namespace ecs \
  --resource-id service/companion-cluster/companion-service \
  --query 'ScalingActivities[*].[StartTime,StatusCode,Description]' \
  --output text | while read -r time status desc; do
  echo "$time - $status: $desc"
done

# 3. Check CPU Utilization
echo -e "\n💻 CPU Utilization (last hour):"
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ClusterName,Value=companion-cluster Name=ServiceName,Value=companion-service \
  --start-time $(get_time_1h_ago) \
  --end-time $(get_time) \
  --period 300 \
  --statistics Average \
  --query 'Datapoints[*].[Timestamp,Average]' \
  --output text | while read -r timestamp avg; do
  echo "$timestamp - CPU: $avg%"
done

# 4. Check Task Events
echo -e "\n📝 Recent Task Events:"
aws ecs describe-services \
  --cluster companion-cluster \
  --services companion-service \
  --query 'services[0].events[0:5].[createdAt,message]' \
  --output text | while read -r time msg; do
  echo "$time - $msg"
done

# 5. Check if tasks are running and get their details
if [ "$RUNNING_COUNT" -gt 0 ]; then
  echo -e "\n🔍 Running Task Details:"
  TASK_ARN=$(aws ecs list-tasks \
    --cluster companion-cluster \
    --service-name companion-service \
    --query 'taskArns[0]' \
    --output text)
  
  if [ "$TASK_ARN" != "None" ]; then
    aws ecs describe-tasks \
      --cluster companion-cluster \
      --tasks $TASK_ARN \
      --query 'tasks[0].[taskArn,lastStatus,startedAt,cpu,memory]' \
      --output text | while read -r arn status started cpu memory; do
      echo "Task ARN: $arn"
      echo "Status: $status"
      echo "Started: $started"
      echo "CPU: $cpu"
      echo "Memory: $memory"
    done
  fi
fi

echo -e "\n📊 Summary:"
if [ "$RUNNING_COUNT" -gt 0 ]; then
  echo "✅ Tasks are running"
  echo "Number of running tasks: $RUNNING_COUNT"
else
  echo "⏳ No tasks running"
  echo "Service is ready to scale when needed"
fi 