# Multi-Platform Deployment Guide

This document provides instructions for deploying the Visual Flow Builder application on multiple platforms:
- OpenShift
- Vercel
- Tomcat

## Prerequisites

- Node.js 18+ installed
- Docker installed (for OpenShift and local testing)
- OpenShift CLI (`oc`) installed and configured (for OpenShift deployment)
- Tomcat 9.0+ installed (for Tomcat deployment)
- Jenkins configured (for CI/CD pipelines)

## Local Development

To run the application locally for development:

```bash
cd my-app
npm install
npm run dev
```

The application will be available at http://localhost:5173

## Building for Different Platforms

The application can be built for different deployment targets:

```bash
# Default build
npm run build

# Build for Tomcat
npm run build:tomcat

# Build for Vercel
npm run build:vercel

# Build for OpenShift
npm run build:openshift
```

## Deploying to OpenShift

### Manual Deployment

1. Login to OpenShift:
   ```bash
   oc login <your-openshift-cluster-url>
   ```

2. Create a new project (or use an existing one):
   ```bash
   oc new-project visual-flow-builder
   ```

3. Create ConfigMap:
   ```bash
   oc apply -f openshift-configmap.yaml
   ```

4. Set up the BuildConfig and ImageStream:
   ```bash
   oc process -f openshift-buildconfig.yaml \
     -p GIT_REPOSITORY_URL=<your-git-repo-url> \
     -p GIT_BRANCH=main | oc apply -f -
   ```

5. Start the build:
   ```bash
   oc start-build visual-flow-builder
   ```

6. Deploy the application:
   ```bash
   oc apply -f openshift-deployment.yaml
   ```

7. Verify the deployment:
   ```bash
   oc get pods
   oc get routes
   ```

### Using Docker for Local Testing

To test the OpenShift configuration locally:

```bash
cd my-app
docker-compose up --build
```

The application will be available at http://localhost:8080

## Deploying to Vercel

### Manual Deployment

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy the application:
   ```bash
   vercel
   ```

### Automatic Deployment

Connect your GitHub repository to Vercel for automatic deployments on push.

## Deploying to Tomcat

### Manual Deployment

1. Build the application for Tomcat:
   ```bash
   cd my-app
   npm run build:tomcat
   ```

2. Create the deployment directory in Tomcat:
   ```bash
   mkdir -p <TOMCAT_HOME>/webapps/visualizer
   ```

3. Copy the build files:
   ```bash
   cp -r my-app/dist/* <TOMCAT_HOME>/webapps/visualizer/
   ```

4. Create META-INF and context.xml:
   ```bash
   mkdir -p <TOMCAT_HOME>/webapps/visualizer/META-INF
   echo '<?xml version="1.0" encoding="UTF-8"?><Context antiResourceLocking="false" privileged="true" />' > <TOMCAT_HOME>/webapps/visualizer/META-INF/context.xml
   ```

5. Create WEB-INF and web.xml:
   ```bash
   mkdir -p <TOMCAT_HOME>/webapps/visualizer/WEB-INF
   cat > <TOMCAT_HOME>/webapps/visualizer/WEB-INF/web.xml << EOF
   <?xml version="1.0" encoding="UTF-8"?>
   <web-app xmlns="http://xmlns.jcp.org/xml/ns/javaee"
            xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
            xsi:schemaLocation="http://xmlns.jcp.org/xml/ns/javaee http://xmlns.jcp.org/xml/ns/javaee/web-app_4_0.xsd"
            version="4.0">
       <display-name>Flow Diagram Application</display-name>
       <error-page>
           <error-code>404</error-code>
           <location>/visualizer/index.html</location>
       </error-page>
   </web-app>
   EOF
   ```

6. Restart Tomcat:
   ```bash
   <TOMCAT_HOME>/bin/shutdown.sh
   <TOMCAT_HOME>/bin/startup.sh
   ```

## Using Jenkins for CI/CD

The included Jenkinsfile supports deployment to both Tomcat and OpenShift:

1. Create a new Jenkins pipeline job
2. Configure it to use the Jenkinsfile from your repository
3. Run the pipeline with the desired deployment target:
   - Choose "tomcat" for Tomcat deployment
   - Choose "openshift" for OpenShift deployment

## Environment Variables

The application uses the following environment variables:

- `NODE_ENV`: The Node.js environment (default: "production")
- `PORT`: The port the Express server will listen on (default: 8080)
- `BASE_PATH`: The base path for the application (default: "/")
- `DEPLOYMENT_ENV`: The deployment environment (used by vite.config.js)
- `TZ`: Timezone (default: "UTC")

## Troubleshooting

### OpenShift

```bash
# Check pod status
oc get pods

# Check logs
oc logs <pod-name>

# Restart deployment
oc rollout restart deployment/visual-flow-builder
```

### Tomcat

Check the Tomcat logs at `<TOMCAT_HOME>/logs/catalina.out`

### Vercel

```bash
# Check deployment status
vercel list

# View logs
vercel logs <deployment-url>
``` 