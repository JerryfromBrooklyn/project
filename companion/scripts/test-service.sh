#!/bin/bash

# Exit on error
set -e

echo "🧪 Testing Companion Service..."

# Step 0: Verify task definition
echo "🔍 Verifying task definition..."
aws ecs describe-task-definition --task-definition companion-server

# Step 1: Scale up the service
echo "📈 Scaling up service..."
aws ecs update-service \
  --cluster companion-cluster \
  --service companion-service \
  --desired-count 1

# Wait for service to scale up
echo "⏳ Waiting for service to scale up..."
MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  SERVICE_STATUS=$(aws ecs describe-services --cluster companion-cluster --services companion-service --query 'services[0]')
  TASK_COUNT=$(echo $SERVICE_STATUS | jq -r '.runningCount')
  PENDING_COUNT=$(echo $SERVICE_STATUS | jq -r '.pendingCount')
  echo "Running tasks: $TASK_COUNT, Pending tasks: $PENDING_COUNT"
  
  if [ "$TASK_COUNT" -gt 0 ]; then
    break
  fi

  # Check for any errors in the last 5 events
  echo "Recent service events:"
  aws ecs describe-services --cluster companion-cluster --services companion-service --query 'services[0].events[0:5]' --output text

  if [ $RETRY_COUNT -eq $((MAX_RETRIES - 1)) ]; then
    echo "❌ Service failed to start after $MAX_RETRIES attempts"
    echo "Checking task failures..."
    aws ecs list-tasks --cluster companion-cluster --service-name companion-service --desired-status STOPPED --query 'taskArns[]' --output text | while read task_arn; do
      echo "Task $task_arn stopped reason:"
      aws ecs describe-tasks --cluster companion-cluster --tasks $task_arn --query 'tasks[0].stoppedReason' --output text
    done
    exit 1
  fi

  sleep 10
  RETRY_COUNT=$((RETRY_COUNT + 1))
done

# Get task details
echo "🔍 Getting task details..."
TASK_ARN=$(aws ecs list-tasks --cluster companion-cluster --service-name companion-service --query 'taskArns[0]' --output text)
if [ -z "$TASK_ARN" ]; then
  echo "❌ No tasks found"
  exit 1
fi

NETWORK_INTERFACE=$(aws ecs describe-tasks --cluster companion-cluster --tasks $TASK_ARN --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' --output text)
PUBLIC_IP=$(aws ec2 describe-network-interfaces --network-interface-ids $NETWORK_INTERFACE --query 'NetworkInterfaces[0].Association.PublicIp' --output text)

echo "🌐 Public IP: $PUBLIC_IP"
echo "🔗 Health check URL: http://$PUBLIC_IP:3020/health"

# Step 2: Test health endpoint
echo "🔄 Testing health endpoint..."
curl -v "http://$PUBLIC_IP:3020/health"

# Step 3: Test file upload
echo "📤 Testing file upload..."
curl -X POST \
  -F "file=@test.txt" \
  -F "metadata={\"name\":\"test.txt\"}" \
  "http://$PUBLIC_IP:3020/upload"

# Step 4: Monitor scaling
echo "📊 Monitoring service scaling..."
echo "Service will automatically scale down after 5 minutes of inactivity"
echo "You can check CloudWatch metrics for CPU utilization"

# Step 5: Clean up (optional)
read -p "Do you want to scale down the service now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "📉 Scaling down service..."
  aws ecs update-service \
    --cluster companion-cluster \
    --service companion-service \
    --desired-count 0
fi

echo "✅ Test complete!" 