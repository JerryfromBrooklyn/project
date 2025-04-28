#!/bin/bash

# Exit on error
set -e

# Check if IP address is provided
if [ -z "$1" ]; then
    echo "❌ Please provide the IP address of the Companion server"
    echo "Usage: ./check-companion.sh <IP_ADDRESS>"
    exit 1
fi

IP_ADDRESS=$1
HEALTH_URL="http://$IP_ADDRESS:3020/health"

echo "🔍 Checking Companion server at $IP_ADDRESS..."
echo "🌐 Health check URL: $HEALTH_URL"

# Make GET request to health endpoint
echo "🔄 Making health check request..."
curl -v "$HEALTH_URL"

# Check if the request was successful
if [ $? -eq 0 ]; then
    echo "✅ Companion server is running and responding!"
else
    echo "❌ Companion server is not responding or there's an issue with the connection"
fi 