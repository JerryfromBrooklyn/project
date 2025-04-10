# Photo Matching System Infrastructure Resources
# This defines the AWS resources needed for the match processing system

# SQS Queue for match processing
resource "aws_sqs_queue" "photo_match_queue" {
  name                       = "photo-match-queue"
  visibility_timeout_seconds = 300
  message_retention_seconds  = 86400 # 1 day
  receive_wait_time_seconds  = 10    # Enable long polling
  
  tags = {
    Name        = "Photo Match Processing Queue"
    Environment = var.environment
  }
}

# Dead Letter Queue for failed match processing
resource "aws_sqs_queue" "photo_match_dlq" {
  name                       = "photo-match-dlq"
  message_retention_seconds  = 1209600 # 14 days
  
  tags = {
    Name        = "Photo Match Processing DLQ"
    Environment = var.environment
  }
}

# Set the DLQ redrive policy
resource "aws_sqs_queue_redrive_policy" "photo_match_redrive" {
  queue_url    = aws_sqs_queue.photo_match_queue.id
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.photo_match_dlq.arn
    maxReceiveCount     = 5
  })
}

# Lambda for user sign-in checks
resource "aws_lambda_function" "user_signin_checker" {
  function_name    = "user-signin-checker"
  filename         = "../lambda-package/user-signin-service.zip"
  handler          = "user-signin-service.handler"
  runtime          = "nodejs14.x"
  timeout          = 10
  memory_size      = 128
  
  environment {
    variables = {
      MATCH_UPDATE_QUEUE_URL = aws_sqs_queue.photo_match_queue.url
    }
  }
  
  role = aws_iam_role.lambda_execution_role.arn
  
  tags = {
    Name        = "User Sign-in Checker Lambda"
    Environment = var.environment
  }
}

# Lambda for match processing
resource "aws_lambda_function" "match_processor" {
  function_name    = "match-processor"
  filename         = "../lambda-package/match-processor.zip"
  handler          = "match-processor.handler"
  runtime          = "nodejs14.x"
  timeout          = 300  # 5 minutes
  memory_size      = 512
  
  role = aws_iam_role.lambda_execution_role.arn
  
  tags = {
    Name        = "Match Processor Lambda"
    Environment = var.environment
  }
}

# SQS trigger for match processor Lambda
resource "aws_lambda_event_source_mapping" "match_queue_trigger" {
  event_source_arn = aws_sqs_queue.photo_match_queue.arn
  function_name    = aws_lambda_function.match_processor.function_name
  batch_size       = 10
  maximum_batching_window_in_seconds = 30
}

# IAM role for Lambda functions
resource "aws_iam_role" "lambda_execution_role" {
  name = "photo-match-lambda-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# IAM policy for Lambda functions
resource "aws_iam_policy" "lambda_policy" {
  name = "photo-match-lambda-policy"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:SendMessage"
        ]
        Resource = [
          aws_sqs_queue.photo_match_queue.arn,
          aws_sqs_queue.photo_match_dlq.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:UpdateItem",
          "dynamodb:PutItem"
        ]
        Resource = [
          "arn:aws:dynamodb:*:*:table/shmong-face-data",
          "arn:aws:dynamodb:*:*:table/shmong-user-profiles",
          "arn:aws:dynamodb:*:*:table/shmong-photos",
          "arn:aws:dynamodb:*:*:table/shmong-user-photos"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "rekognition:SearchFaces",
          "rekognition:SearchFacesByImage"
        ]
        Resource = "*"
      }
    ]
  })
}

# Attach IAM policy to role
resource "aws_iam_role_policy_attachment" "lambda_policy_attachment" {
  role       = aws_iam_role.lambda_execution_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

# CloudWatch Alarm for queue depth
resource "aws_cloudwatch_metric_alarm" "queue_depth_alarm" {
  alarm_name          = "photo-match-queue-depth"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Average"
  threshold           = 100
  alarm_description   = "This alarm monitors photo match queue depth"
  
  dimensions = {
    QueueName = aws_sqs_queue.photo_match_queue.name
  }
  
  alarm_actions = [var.sns_alert_topic_arn]
}

# Add LastMatchUpdate GSI to user profiles table
resource "aws_dynamodb_table_gsi" "last_match_update_index" {
  name            = "LastMatchUpdateIndex"
  table_name      = "shmong-user-profiles"
  hash_key        = "userId"
  projection_type = "ALL"
} 