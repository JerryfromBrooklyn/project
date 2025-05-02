#!/bin/bash

# IP address to query
IP_ADDRESS="192.168.1.1"

# AWS region
REGION="us-east-1"

# Table name
TABLE_NAME="shmong-face-data"

# Index name
INDEX_NAME="IpAddressIndex"

echo "Querying users with IP address: $IP_ADDRESS"

# Query the table using the IP address index
aws dynamodb query \
  --table-name $TABLE_NAME \
  --index-name $INDEX_NAME \
  --key-condition-expression "ipAddress = :ip" \
  --expression-attribute-values '{":ip": {"S": "'$IP_ADDRESS'"}}' \
  --region $REGION

echo "Query complete." 