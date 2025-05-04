#!/bin/bash

# Script to delete the problematic GSI that's causing ValidationException
echo "Starting GSI fix for shmong-photos table..."

# Delete the problematic GSI
aws dynamodb update-table \
  --table-name shmong-photos \
  --global-secondary-index-updates '[{"Delete":{"IndexName":"MatchedUsersCreatedAtIndex"}}]' \
  --region us-east-1

echo "Command sent. GSI deletion will happen asynchronously."
echo "Check the AWS Console to monitor progress."
echo "Photo uploads should work correctly once the update is complete." 