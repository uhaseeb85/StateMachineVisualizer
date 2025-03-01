#!/bin/bash

# This script updates the base path in the index.html file
# to match the OpenShift route path if needed

# Get the base path from environment variable or use default
BASE_PATH=${BASE_PATH:-"/"}

# If running in OpenShift, we might need to adjust paths
if [ "$OPENSHIFT_DEPLOYMENT" = "true" ]; then
  echo "Updating base path for OpenShift deployment to: $BASE_PATH"
  
  # Update base href in index.html
  sed -i "s|<base href=\"/\">|<base href=\"$BASE_PATH\">|g" /usr/share/nginx/html/index.html
  
  # Update paths in JavaScript files if needed
  find /usr/share/nginx/html -name "*.js" -exec sed -i "s|\"\/assets\/|\"$BASE_PATH\/assets\/|g" {} \;
fi

# Execute the CMD from the Dockerfile
exec "$@" 