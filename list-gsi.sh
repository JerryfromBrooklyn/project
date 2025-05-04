#!/bin/bash

# Script to list all GSIs for the shmong-photos table
echo "Listing all GSIs for shmong-photos table..."

aws dynamodb describe-table \
  --table-name shmong-photos \
  --region us-east-1 \
  --query 'Table.GlobalSecondaryIndexes[*].IndexName'

echo "If no output appears above, there are no GSIs on this table." 