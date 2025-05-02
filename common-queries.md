# Common DynamoDB Queries for Face Registration System

This document provides ready-to-use AWS CLI commands and SQL-compatible PartiQL queries for the face registration database. You can copy and paste these directly into your terminal.

> **Note**: These examples assume that `userId` is the email address, or that you're using a GSI on the email field.

## Basic User Queries

### 1. Get All Face Data for an Email Address

**AWS CLI Command:**
```bash
aws dynamodb query \
  --table-name shmong-face-data \
  --key-condition-expression "userId = :email" \
  --expression-attribute-values '{":email": {"S": "user@example.com"}}' \
  --region us-east-1
```

**PartiQL (SQL-compatible):**
```bash
aws dynamodb execute-statement \
  --statement "SELECT * FROM \"shmong-face-data\" WHERE userId = 'user@example.com'" \
  --region us-east-1
```

### 2. Get User's Full Location Address During Face Registration

**AWS CLI Command:**
```bash
aws dynamodb query \
  --table-name shmong-face-data \
  --key-condition-expression "userId = :email" \
  --projection-expression "address, country, city, latitude, longitude" \
  --expression-attribute-values '{":email": {"S": "user@example.com"}}' \
  --region us-east-1
```

**PartiQL (SQL-compatible):**
```bash
aws dynamodb execute-statement \
  --statement "SELECT address, country, city, latitude, longitude FROM \"shmong-face-data\" WHERE userId = 'user@example.com'" \
  --region us-east-1
```

### 3. Get Video Link for an Email Address

**AWS CLI Command:**
```bash
aws dynamodb query \
  --table-name shmong-face-data \
  --key-condition-expression "userId = :email" \
  --projection-expression "videoUrl" \
  --expression-attribute-values '{":email": {"S": "user@example.com"}}' \
  --region us-east-1
```

**PartiQL (SQL-compatible):**
```bash
aws dynamodb execute-statement \
  --statement "SELECT videoUrl FROM \"shmong-face-data\" WHERE userId = 'user@example.com'" \
  --region us-east-1
```

### 4. Get Face Registration Image URL for an Email Address

**AWS CLI Command:**
```bash
aws dynamodb query \
  --table-name shmong-face-data \
  --key-condition-expression "userId = :email" \
  --projection-expression "imageUrl" \
  --expression-attribute-values '{":email": {"S": "user@example.com"}}' \
  --region us-east-1
```

**PartiQL (SQL-compatible):**
```bash
aws dynamodb execute-statement \
  --statement "SELECT imageUrl FROM \"shmong-face-data\" WHERE userId = 'user@example.com'" \
  --region us-east-1
```

### 5. Get Face Registration Date and Time for an Email Address

**AWS CLI Command:**
```bash
aws dynamodb query \
  --table-name shmong-face-data \
  --key-condition-expression "userId = :email" \
  --projection-expression "createdAt" \
  --expression-attribute-values '{":email": {"S": "user@example.com"}}' \
  --region us-east-1
```

**PartiQL (SQL-compatible):**
```bash
aws dynamodb execute-statement \
  --statement "SELECT createdAt FROM \"shmong-face-data\" WHERE userId = 'user@example.com'" \
  --region us-east-1
```

### 6. Get Device Details for an Email Address

**AWS CLI Command:**
```bash
aws dynamodb query \
  --table-name shmong-face-data \
  --key-condition-expression "userId = :email" \
  --projection-expression "browser, operatingSystem, ipAddress, networkType" \
  --expression-attribute-values '{":email": {"S": "user@example.com"}}' \
  --region us-east-1
```

**PartiQL (SQL-compatible):**
```bash
aws dynamodb execute-statement \
  --statement "SELECT browser, operatingSystem, ipAddress, networkType FROM \"shmong-face-data\" WHERE userId = 'user@example.com'" \
  --region us-east-1
```

### 7. Get Demographic Information for an Email Address

**AWS CLI Command:**
```bash
aws dynamodb query \
  --table-name shmong-face-data \
  --key-condition-expression "userId = :email" \
  --projection-expression "gender, ageRangeLow, ageRangeHigh, emotion" \
  --expression-attribute-values '{":email": {"S": "user@example.com"}}' \
  --region us-east-1
```

**PartiQL (SQL-compatible):**
```bash
aws dynamodb execute-statement \
  --statement "SELECT gender, ageRangeLow, ageRangeHigh, emotion FROM \"shmong-face-data\" WHERE userId = 'user@example.com'" \
  --region us-east-1
```

## Demographic Queries

### 1. Count Males/Females in a Specific State

**AWS CLI Command for Males:**
```bash
aws dynamodb scan \
  --table-name shmong-face-data \
  --filter-expression "country = :country AND city = :city AND gender = :gender" \
  --expression-attribute-values '{
    ":country": {"S": "United States"},
    ":city": {"S": "New York"},
    ":gender": {"S": "Male"}
  }' \
  --select COUNT \
  --region us-east-1
```

**PartiQL (SQL-compatible) for Males:**
```bash
aws dynamodb execute-statement \
  --statement "SELECT COUNT(*) FROM \"shmong-face-data\" WHERE country = 'United States' AND city = 'New York' AND gender = 'Male'" \
  --region us-east-1
```

**AWS CLI Command for Females:**
```bash
aws dynamodb scan \
  --table-name shmong-face-data \
  --filter-expression "country = :country AND city = :city AND gender = :gender" \
  --expression-attribute-values '{
    ":country": {"S": "United States"},
    ":city": {"S": "New York"},
    ":gender": {"S": "Female"}
  }' \
  --select COUNT \
  --region us-east-1
```

**PartiQL (SQL-compatible) for Females:**
```bash
aws dynamodb execute-statement \
  --statement "SELECT COUNT(*) FROM \"shmong-face-data\" WHERE country = 'United States' AND city = 'New York' AND gender = 'Female'" \
  --region us-east-1
```

### 2. All Users from a Specific Browser

**AWS CLI Command:**
```bash
aws dynamodb scan \
  --table-name shmong-face-data \
  --filter-expression "browser = :browser" \
  --expression-attribute-values '{":browser": {"S": "Chrome"}}' \
  --projection-expression "userId, operatingSystem, country, city" \
  --region us-east-1
```

**PartiQL (SQL-compatible):**
```bash
aws dynamodb execute-statement \
  --statement "SELECT userId, operatingSystem, country, city FROM \"shmong-face-data\" WHERE browser = 'Chrome'" \
  --region us-east-1
```

### 3. All Users in a Specific Age Range

**AWS CLI Command:**
```bash
aws dynamodb scan \
  --table-name shmong-face-data \
  --filter-expression "ageRangeLow >= :minAge AND ageRangeHigh <= :maxAge" \
  --expression-attribute-values '{
    ":minAge": {"N": "25"},
    ":maxAge": {"N": "35"}
  }' \
  --projection-expression "userId, gender, country, city" \
  --region us-east-1
```

**PartiQL (SQL-compatible):**
```bash
aws dynamodb execute-statement \
  --statement "SELECT userId, gender, country, city FROM \"shmong-face-data\" WHERE ageRangeLow >= 25 AND ageRangeHigh <= 35" \
  --region us-east-1
```

### 4. All Users with a Specific Emotion

**AWS CLI Command:**
```bash
aws dynamodb scan \
  --table-name shmong-face-data \
  --filter-expression "emotion = :emotion" \
  --expression-attribute-values '{":emotion": {"S": "HAPPY"}}' \
  --projection-expression "userId, gender, ageRangeLow, ageRangeHigh" \
  --region us-east-1
```

**PartiQL (SQL-compatible):**
```bash
aws dynamodb execute-statement \
  --statement "SELECT userId, gender, ageRangeLow, ageRangeHigh FROM \"shmong-face-data\" WHERE emotion = 'HAPPY'" \
  --region us-east-1
```

## Network and Device Queries

### 1. Find All Registrations from a Specific IP Address (Using GSI)

**AWS CLI Command:**
```bash
aws dynamodb query \
  --table-name shmong-face-data \
  --index-name IpAddressIndex \
  --key-condition-expression "ipAddress = :ip" \
  --expression-attribute-values '{":ip": {"S": "192.168.1.1"}}' \
  --region us-east-1
```

**PartiQL (SQL-compatible):**
```bash
# Note: PartiQL currently has limited support for GSIs, so we'll use a scan with a filter
aws dynamodb execute-statement \
  --statement "SELECT * FROM \"shmong-face-data\" WHERE ipAddress = '192.168.1.1'" \
  --region us-east-1
```

### 2. Find All Mobile Device Registrations

**AWS CLI Command:**
```bash
aws dynamodb scan \
  --table-name shmong-face-data \
  --filter-expression "operatingSystem = :ios OR operatingSystem = :android" \
  --expression-attribute-values '{
    ":ios": {"S": "iOS"},
    ":android": {"S": "Android"}
  }' \
  --projection-expression "userId, operatingSystem, browser, country, city" \
  --region us-east-1
```

**PartiQL (SQL-compatible):**
```bash
aws dynamodb execute-statement \
  --statement "SELECT userId, operatingSystem, browser, country, city FROM \"shmong-face-data\" WHERE operatingSystem IN ('iOS', 'Android')" \
  --region us-east-1
```

### 3. Find All Registrations from a Specific Network Type

**AWS CLI Command:**
```bash
aws dynamodb scan \
  --table-name shmong-face-data \
  --filter-expression "networkType = :networkType" \
  --expression-attribute-values '{":networkType": {"S": "4G"}}' \
  --projection-expression "userId, operatingSystem, browser, country, city" \
  --region us-east-1
```

**PartiQL (SQL-compatible):**
```bash
aws dynamodb execute-statement \
  --statement "SELECT userId, operatingSystem, browser, country, city FROM \"shmong-face-data\" WHERE networkType = '4G'" \
  --region us-east-1
```

## Location-Based Queries

### 1. Find All Registrations from a Specific Country

**AWS CLI Command:**
```bash
aws dynamodb scan \
  --table-name shmong-face-data \
  --filter-expression "country = :country" \
  --expression-attribute-values '{":country": {"S": "United States"}}' \
  --projection-expression "userId, city, gender, ageRangeLow, ageRangeHigh" \
  --region us-east-1
```

**PartiQL (SQL-compatible):**
```bash
aws dynamodb execute-statement \
  --statement "SELECT userId, city, gender, ageRangeLow, ageRangeHigh FROM \"shmong-face-data\" WHERE country = 'United States'" \
  --region us-east-1
```

### 2. Find All Registrations from a Specific City

**AWS CLI Command:**
```bash
aws dynamodb scan \
  --table-name shmong-face-data \
  --filter-expression "city = :city" \
  --expression-attribute-values '{":city": {"S": "San Francisco"}}' \
  --projection-expression "userId, country, gender, ageRangeLow, ageRangeHigh" \
  --region us-east-1
```

**PartiQL (SQL-compatible):**
```bash
aws dynamodb execute-statement \
  --statement "SELECT userId, country, gender, ageRangeLow, ageRangeHigh FROM \"shmong-face-data\" WHERE city = 'San Francisco'" \
  --region us-east-1
```

### 3. Find All Registrations within a Radius of a Point (Basic Approximation)

**AWS CLI Command:**
```bash
aws dynamodb scan \
  --table-name shmong-face-data \
  --filter-expression "latitude BETWEEN :latMin AND :latMax AND longitude BETWEEN :lonMin AND :lonMax" \
  --expression-attribute-values '{
    ":latMin": {"N": "37.7"},
    ":latMax": {"N": "37.8"},
    ":lonMin": {"N": "-122.5"},
    ":lonMax": {"N": "-122.3"}
  }' \
  --projection-expression "userId, latitude, longitude, country, city" \
  --region us-east-1
```

**PartiQL (SQL-compatible):**
```bash
aws dynamodb execute-statement \
  --statement "SELECT userId, latitude, longitude, country, city FROM \"shmong-face-data\" WHERE latitude BETWEEN 37.7 AND 37.8 AND longitude BETWEEN -122.5 AND -122.3" \
  --region us-east-1
```

## Time-Based Queries

### 1. Find All Registrations within a Date Range

**AWS CLI Command:**
```bash
aws dynamodb scan \
  --table-name shmong-face-data \
  --filter-expression "createdAt BETWEEN :startDate AND :endDate" \
  --expression-attribute-values '{
    ":startDate": {"S": "2023-01-01T00:00:00.000Z"},
    ":endDate": {"S": "2023-12-31T23:59:59.999Z"}
  }' \
  --projection-expression "userId, createdAt, country, city" \
  --region us-east-1
```

**PartiQL (SQL-compatible):**
```bash
aws dynamodb execute-statement \
  --statement "SELECT userId, createdAt, country, city FROM \"shmong-face-data\" WHERE createdAt BETWEEN '2023-01-01T00:00:00.000Z' AND '2023-12-31T23:59:59.999Z'" \
  --region us-east-1
```

### 2. Find All Registrations from the Last 30 Days

**AWS CLI Command:**
```bash
# Use a bash date command to get the ISO date from 30 days ago
START_DATE=$(date -u -v-30d +"%Y-%m-%dT00:00:00.000Z")
NOW=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

aws dynamodb scan \
  --table-name shmong-face-data \
  --filter-expression "createdAt BETWEEN :startDate AND :now" \
  --expression-attribute-values "{
    \":startDate\": {\"S\": \"$START_DATE\"},
    \":now\": {\"S\": \"$NOW\"}
  }" \
  --projection-expression "userId, createdAt, country, city" \
  --region us-east-1
```

**PartiQL (SQL-compatible):**
```bash
# Use a bash date command to get the ISO date from 30 days ago
START_DATE=$(date -u -v-30d +"%Y-%m-%dT00:00:00.000Z")
NOW=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

aws dynamodb execute-statement \
  --statement "SELECT userId, createdAt, country, city FROM \"shmong-face-data\" WHERE createdAt BETWEEN '$START_DATE' AND '$NOW'" \
  --region us-east-1
```

## Advanced Queries

### 1. Count Registrations by Gender for Each Country

**AWS CLI Command:**
```bash
# This requires post-processing the results in a script
aws dynamodb scan \
  --table-name shmong-face-data \
  --projection-expression "country, gender" \
  --region us-east-1 \
  --output json > country_gender_data.json

# Then process with a script like:
# cat country_gender_data.json | jq '.Items | group_by(.country.S) | map({country: .[0].country.S, males: map(select(.gender.S == "Male")) | length, females: map(select(.gender.S == "Female")) | length})'
```

**PartiQL (SQL-compatible):**
```bash
# PartiQL doesn't directly support aggregate functions by group in DynamoDB
# Extract the data and process it client-side
aws dynamodb execute-statement \
  --statement "SELECT country, gender FROM \"shmong-face-data\"" \
  --region us-east-1 \
  --output json > country_gender_data_partiql.json

# Then process with the same jq script
```

### 2. Find Users who Registered Multiple Times (Using Email Pattern)

**AWS CLI Command:**
```bash
# This would be easier with a script, but here's a basic approach to find patterns
aws dynamodb scan \
  --table-name shmong-face-data \
  --projection-expression "userId, faceId, createdAt, ipAddress" \
  --region us-east-1 \
  --output json > all_registrations.json

# Then process with a script to find duplicates
```

**PartiQL (SQL-compatible):**
```bash
aws dynamodb execute-statement \
  --statement "SELECT userId, faceId, createdAt, ipAddress FROM \"shmong-face-data\"" \
  --region us-east-1 \
  --output json > all_registrations_partiql.json

# Then process with the same script
```

### 3. Find All Registrations with Video Quality Issues

**AWS CLI Command:**
```bash
aws dynamodb scan \
  --table-name shmong-face-data \
  --filter-expression "attribute_exists(videoUrl) AND (NOT contains(videoResolution, :resolution))" \
  --expression-attribute-values '{":resolution": {"S": "1920x1080"}}' \
  --projection-expression "userId, videoResolution, videoFrameRate, videoDuration" \
  --region us-east-1
```

**PartiQL (SQL-compatible):**
```bash
# PartiQL doesn't directly support the "contains" function, so this is an approximation
aws dynamodb execute-statement \
  --statement "SELECT userId, videoResolution, videoFrameRate, videoDuration FROM \"shmong-face-data\" WHERE videoUrl IS NOT NULL AND videoResolution <> '1920x1080'" \
  --region us-east-1
```

## Exporting Data

### Export All Face Registration Data to a JSON File

**AWS CLI Command:**
```bash
aws dynamodb scan \
  --table-name shmong-face-data \
  --region us-east-1 \
  --output json > all_face_data.json
```

**PartiQL (SQL-compatible):**
```bash
aws dynamodb execute-statement \
  --statement "SELECT * FROM \"shmong-face-data\"" \
  --region us-east-1 \
  --output json > all_face_data_partiql.json
```

### Export Only Demographic Data to a CSV-Compatible Format

**AWS CLI Command:**
```bash
aws dynamodb scan \
  --table-name shmong-face-data \
  --projection-expression "userId, gender, ageRangeLow, ageRangeHigh, country, city" \
  --region us-east-1 \
  --output json > demographic_data.json

# Then process with a script to convert to CSV
```

**PartiQL (SQL-compatible):**
```bash
aws dynamodb execute-statement \
  --statement "SELECT userId, gender, ageRangeLow, ageRangeHigh, country, city FROM \"shmong-face-data\"" \
  --region us-east-1 \
  --output json > demographic_data_partiql.json

# Then process with the same script to convert to CSV
```

## Performance Notes

- The queries using `scan` operations will be slower and more expensive than `query` operations as the database grows
- PartiQL queries in DynamoDB have similar performance characteristics to their equivalent API calls
- Consider creating additional GSIs for frequently used query patterns
- For large-scale analytics, consider periodically exporting data to a data warehouse or using DynamoDB Streams with Lambda to process events in real-time 