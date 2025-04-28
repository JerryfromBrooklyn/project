# Companion Server Full Deployment Guide (AWS ECS Fargate)

This guide covers every step to deploy the Companion server on AWS ECS Fargate, including IAM, SSM, Docker, ECS, networking, and cost optimization.

---

## 1. Prerequisites
- AWS account with admin or sufficient permissions
- AWS CLI installed and configured (`aws configure` or SSO)
- Docker installed
- Node.js and npm installed
- Your `.env` file is in the **project root** and filled out

---

## 2. Quick Start Deployment

### Step 1: Build and Push Docker Image
```bash
cd companion
# Build image
docker buildx build --platform linux/amd64 -t companion-server .
# Tag for ECR
export AWS_ACCOUNT_ID=<your-account-id>
export AWS_REGION=us-east-1
export ECR_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/companion-server:latest
docker tag companion-server:latest $ECR_URI
# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
# Push
docker push $ECR_URI
```

### Step 2: Deploy Service with Auto-scaling
```bash
# Make the deployment script executable
chmod +x scripts/deploy-service.sh
# Run the deployment script
./scripts/deploy-service.sh
```

This will:
- Create an ECS service that scales to 0 when not in use
- Set up auto-scaling based on CPU utilization
- Use minimal Fargate resources (256 CPU units, 512MB memory)
- Configure proper networking and security

---

## 3. Detailed Setup (if needed)

### a. IAM Setup

#### Create Task Execution Role (`ecsTaskExecutionRole`)
- Go to IAM > Roles > Create role
- Trusted entity: **AWS service**
- Use case: **Elastic Container Service > Elastic Container Service Task**
- Attach policy: `AmazonECSTaskExecutionRolePolicy`
- Name: `ecsTaskExecutionRole`
- Trust relationship:
  ```json
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": { "Service": "ecs-tasks.amazonaws.com" },
        "Action": "sts:AssumeRole"
      }
    ]
  }
  ```

#### Create Task Role (`companionTaskRole`)
- Go to IAM > Roles > Create role
- Trusted entity: **AWS service**
- Use case: **Elastic Container Service > Elastic Container Service Task**
- Attach policies:
  - `AmazonS3FullAccess` (or custom S3 policy)
  - `CloudWatchLogsFullAccess`
  - Any other needed (e.g., DynamoDB, Rekognition)
- Name: `companionTaskRole`
- Trust relationship: (same as above)

### b. Store AWS Secrets in SSM
```bash
aws ssm put-parameter --name "/companion/aws-access-key-id" --value "<YOUR_AWS_ACCESS_KEY_ID>" --type "SecureString"
aws ssm put-parameter --name "/companion/aws-secret-access-key" --value "<YOUR_AWS_SECRET_ACCESS_KEY>" --type "SecureString"
```

### c. ECS Setup

#### Create ECS Cluster
```bash
aws ecs create-cluster --cluster-name companion-cluster
```

#### Update Task Definition
- Edit `companion/aws/ecs/task-definition.json`:
  - Set `executionRoleArn` and `taskRoleArn` to your role ARNs
  - Set `image` to your ECR URI
  - Set environment variables and secrets
- Register the task definition:
```bash
aws ecs register-task-definition --cli-input-json file://companion/aws/ecs/task-definition.json
```

---

## 4. Cost Optimization Features

The deployment includes several cost optimization features:

1. **Scale to Zero**: Service automatically scales to 0 tasks when idle
2. **Minimal Resources**: Uses minimal Fargate resources (256 CPU units, 512MB memory)
3. **Auto-scaling**: Scales based on CPU utilization (30% threshold)
4. **Cooldown Periods**: 5-minute cooldown prevents rapid scaling

### Auto-scaling Configuration
- Minimum capacity: 0 tasks
- Maximum capacity: 1 task
- Scale up when CPU > 30%
- Scale down when CPU < 30%
- 5-minute cooldown between scaling actions

---

## 5. Monitoring and Maintenance

### Monitor Service
- ECS Console > Clusters > companion-cluster > companion-service
- CloudWatch Metrics > ECS > Service Metrics
- CloudWatch Logs > /ecs/companion-server

### Common Operations

#### Scale Service Manually
```bash
# Scale to 1 task
aws ecs update-service --cluster companion-cluster --service companion-service --desired-count 1

# Scale to 0 tasks
aws ecs update-service --cluster companion-cluster --service companion-service --desired-count 0
```

#### Update Service
```bash
# Force new deployment
aws ecs update-service --cluster companion-cluster --service companion-service --force-new-deployment
```

#### Get Service Status
```bash
# Check service status
aws ecs describe-services --cluster companion-cluster --services companion-service

# Get running tasks
aws ecs list-tasks --cluster companion-cluster --service-name companion-service
```

---

## 6. Troubleshooting

### Common Issues
1. **Service not scaling**
   - Check CloudWatch alarms
   - Verify auto-scaling configuration
   - Check IAM permissions

2. **Tasks failing to start**
   - Check task definition
   - Verify container logs
   - Check security group and subnet configuration

3. **High costs**
   - Verify service is scaling to 0
   - Check for stuck tasks
   - Monitor CloudWatch metrics

### Logs and Debugging
```bash
# Get task logs
aws logs get-log-events --log-group-name /ecs/companion-server --log-stream-name <stream-name>

# Describe failed tasks
aws ecs describe-tasks --cluster companion-cluster --tasks <task-arn>
```

---

## 7. Cleanup

To remove all resources:
```bash
# Delete service
aws ecs delete-service --cluster companion-cluster --service companion-service --force

# Delete cluster
aws ecs delete-cluster --cluster companion-cluster

# Deregister task definition
aws ecs deregister-task-definition --task-definition companion-server:1
```

---

**This guide provides a complete, cost-optimized deployment of the Companion server on AWS ECS Fargate!**

---

## 8. When to Deploy or Redeploy the Companion Server

You should deploy or redeploy the Companion server in the following scenarios:

- **Code changes:**
  - You have made changes to the Companion server codebase (bug fixes, new features, refactoring, etc.).
  - You have updated dependencies in `package.json`.
- **Configuration changes:**
  - You have changed environment variables in your `.env` file (e.g., S3 bucket, AWS region, secrets).
  - You have updated the ECS task definition (e.g., new environment variables, new secrets, new image URI).
- **Security updates:**
  - You need to rotate AWS credentials or secrets (e.g., new SSM parameters).
  - You have updated IAM roles or permissions.
- **Infrastructure changes:**
  - You have changed networking (subnets, security groups, VPC).
  - You have updated the ECS cluster or service configuration (e.g., desired count, scaling policies).
- **Docker image updates:**
  - You have built a new Docker image (after code/config changes).
  - You want to roll back to a previous image or deploy a new version.
- **AWS resource updates:**
  - You have updated S3 bucket policies, CloudWatch log groups, or other AWS resources used by Companion.
- **Bug fixes or hotfixes:**
  - You need to quickly patch a bug or security issue in production.
- **Routine maintenance:**
  - Regularly updating dependencies, base Docker images, or applying security patches.

> **In short:** Any time you change the code, configuration, secrets, or infrastructure that Companion depends on, you should redeploy.
