# Create deployment packages for each Lambda function

# Create directories
New-Item -ItemType Directory -Force -Path .\deployment-packages
New-Item -ItemType Directory -Force -Path .\deployment-packages\login
New-Item -ItemType Directory -Force -Path .\deployment-packages\face-register
New-Item -ItemType Directory -Force -Path .\deployment-packages\user-face-data
New-Item -ItemType Directory -Force -Path .\deployment-packages\historical-matches
New-Item -ItemType Directory -Force -Path .\deployment-packages\recent-matches
New-Item -ItemType Directory -Force -Path .\deployment-packages\face-stats

# Copy files for login function
Copy-Item .\lambda-functions\login-handler.js .\deployment-packages\login\index.js
Copy-Item .\lambda-functions\package.json .\deployment-packages\login\
Set-Location .\deployment-packages\login\
npm install
Compress-Archive -Path * -DestinationPath ..\login.zip -Force
Set-Location ..\..\

# Copy files for face-register function
Copy-Item .\clean-lambda\index.js .\deployment-packages\face-register\index.js
Copy-Item .\lambda-functions\package.json .\deployment-packages\face-register\
Set-Location .\deployment-packages\face-register\
npm install
Compress-Archive -Path * -DestinationPath ..\face-register.zip -Force
Set-Location ..\..\

# Copy files for user-face-data function
Copy-Item .\lambda-functions\user-face-data-index.js .\deployment-packages\user-face-data\index.js
Copy-Item .\lambda-functions\package.json .\deployment-packages\user-face-data\
Set-Location .\deployment-packages\user-face-data\
npm install
Compress-Archive -Path * -DestinationPath ..\user-face-data.zip -Force
Set-Location ..\..\

# Copy files for historical-matches function
Copy-Item .\lambda-functions\historical-matches-index.js .\deployment-packages\historical-matches\index.js
Copy-Item .\lambda-functions\package.json .\deployment-packages\historical-matches\
Set-Location .\deployment-packages\historical-matches\
npm install
Compress-Archive -Path * -DestinationPath ..\historical-matches.zip -Force
Set-Location ..\..\

# Copy files for recent-matches function
Copy-Item .\lambda-functions\recent-matches-index.js .\deployment-packages\recent-matches\index.js
Copy-Item .\lambda-functions\package.json .\deployment-packages\recent-matches\
Set-Location .\deployment-packages\recent-matches\
npm install
Compress-Archive -Path * -DestinationPath ..\recent-matches.zip -Force
Set-Location ..\..\

# Copy files for face-stats function
Copy-Item .\lambda-functions\face-stats-index.js .\deployment-packages\face-stats\index.js
Copy-Item .\lambda-functions\package.json .\deployment-packages\face-stats\
Set-Location .\deployment-packages\face-stats\
npm install
Compress-Archive -Path * -DestinationPath ..\face-stats.zip -Force
Set-Location ..\..\

Write-Host "All Lambda functions packaged successfully!" 