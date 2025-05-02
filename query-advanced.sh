#!/bin/bash

# AWS region
REGION="us-east-1"

# Table name
TABLE_NAME="shmong-face-data"

# Example: Find male users aged 25-35 from United States using Chrome
echo "Querying for male users aged 25-35 from United States using Chrome..."

aws dynamodb scan \
  --table-name $TABLE_NAME \
  --filter-expression "gender = :gender AND ageRangeLow >= :minAge AND ageRangeHigh <= :maxAge AND country = :country AND browser = :browser" \
  --expression-attribute-values '{
    ":gender": {"S": "Male"},
    ":minAge": {"N": "25"},
    ":maxAge": {"N": "35"},
    ":country": {"S": "United States"},
    ":browser": {"S": "Chrome"}
  }' \
  --region $REGION | cat

echo "Query complete." 