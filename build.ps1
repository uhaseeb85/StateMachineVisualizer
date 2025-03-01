# Navigate to the my-app directory
Set-Location -Path my-app

# Install dependencies
npm install

# Build the application
npm run build

# Create dist directory in root if it doesn't exist
if (-not (Test-Path -Path "../dist")) {
    New-Item -Path "../dist" -ItemType Directory
}

# Copy the dist directory contents to the root dist directory
Copy-Item -Path "dist/*" -Destination "../dist/" -Recurse -Force

Write-Host "Build completed and files copied to root dist directory" 