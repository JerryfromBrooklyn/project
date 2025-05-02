#!/bin/bash
aws dynamodb scan \
  --table-name shmong-face-data \
  --filter-expression "userId = :email" \
  --expression-attribute-values '{":email":{"S":"clap@clap.com"}}' \
  --region us-east-1 