#!/bin/bash
aws dynamodb query \
  --table-name shmong-face-data \
  --key-condition-expression "userId = :email" \
  --expression-attribute-values '{":email":{"S":"clap@clap.com"}}' \
  --region us-east-1 