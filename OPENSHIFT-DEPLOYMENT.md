# OpenShift Deployment Guide

This document provides instructions for deploying the Visual Flow Builder application on OpenShift using Express.js.

## Prerequisites

- OpenShift CLI (`oc`) installed and configured
- Access to an OpenShift cluster
- Docker installed (for local testing)

## Local Testing with Docker

Before deploying to OpenShift, you can test the containerized application locally:

```bash
cd my-app
docker-compose up --build
```

The application will be available at http://localhost:8080

## Deploying to OpenShift

### 1. Login to OpenShift

```bash
oc login <your-openshift-cluster-url>
```

### 2. Create a new project (or use an existing one)

```bash
oc new-project visual-flow-builder
```

### 3. Create ConfigMap

```bash
oc apply -f openshift-configmap.yaml
```

### 4. Set up the BuildConfig and ImageStream

```bash
oc process -f openshift-buildconfig.yaml \
  -p GIT_REPOSITORY_URL=<your-git-repo-url> \
  -p GIT_BRANCH=main | oc apply -f -
```

### 5. Start the build

```bash
oc start-build visual-flow-builder
```

### 6. Deploy the application

```bash
oc apply -f openshift-deployment.yaml
```

### 7. Verify the deployment

```bash
oc get pods
oc get routes
```

The application URL will be available in the output of `oc get routes`.

## Environment Variables

The application uses the following environment variables:

- `NODE_ENV`: The Node.js environment (default: "production")
- `PORT`: The port the Express server will listen on (default: 8080)
- `BASE_PATH`: The base path for the application (default: "/")

## Troubleshooting

### Checking logs

```bash
# Get pod name
oc get pods

# Check logs
oc logs <pod-name>
```

### Scaling the application

```bash
oc scale deployment visual-flow-builder --replicas=3
```

### Restarting the application

```bash
oc rollout restart deployment visual-flow-builder
```

## Express Server Details

The application uses Express.js to serve the static React files and handle routing. The server configuration is in `server.cjs` and includes:

- Static file serving
- SPA routing (all routes serve index.html)
- Security headers with Helmet
- Compression for better performance 