pipeline {
    agent any

    environment {
        NODE_VERSION = '18.17.0'
        NPM_CONFIG_CACHE = "${WORKSPACE}\\.npm"
        // Tomcat settings
        TOMCAT_HOME = 'C:\\Program Files\\Apache Software Foundation\\Tomcat 9.0'
        TOMCAT_HOST = 'localhost'
        TOMCAT_PORT = '8080'
    }

    stages {
        stage('Setup Node.js') {
            steps {
                script {
                    def nodeHome = tool name: 'NodeJS', type: 'jenkins.plugins.nodejs.tools.NodeJSInstallation'
                    env.PATH = "${nodeHome};${env.PATH}"
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                // Clean npm cache and node_modules
                bat 'if exist node_modules rmdir /s /q node_modules'
                bat 'if exist package-lock.json del package-lock.json'
                bat 'npm cache clean --force'
                
                // Install dependencies
                bat 'npm install'
            }
        }

        stage('Build') {
            steps {
                // Build for Tomcat
                bat 'npm run build:tomcat'
            }
        }

        stage('Deploy to Tomcat') {
            steps {
                script {
                    // Stop Tomcat
                    bat '''
                        net stop Tomcat9 || exit /b 0
                        timeout /t 5
                    '''
                    
                    // Clean existing deployment
                    bat '''
                        if exist "%TOMCAT_HOME%\\webapps\\visualizer" rmdir /s /q "%TOMCAT_HOME%\\webapps\\visualizer"
                        mkdir "%TOMCAT_HOME%\\webapps\\visualizer"
                    '''
                    
                    // Copy build files
                    bat '''
                        xcopy /E /I dist\\* "%TOMCAT_HOME%\\webapps\\visualizer\\"
                    '''
                    
                    // Create META-INF and context.xml
                    bat '''
                        mkdir "%TOMCAT_HOME%\\webapps\\visualizer\\META-INF"
                        echo ^<?xml version="1.0" encoding="UTF-8"?^>^<Context antiResourceLocking="false" privileged="true" /^> > "%TOMCAT_HOME%\\webapps\\visualizer\\META-INF\\context.xml"
                    '''
                    
                    // Create WEB-INF and web.xml
                    bat '''
                        mkdir "%TOMCAT_HOME%\\webapps\\visualizer\\WEB-INF"
                        echo ^<?xml version="1.0" encoding="UTF-8"?^> > "%TOMCAT_HOME%\\webapps\\visualizer\\WEB-INF\\web.xml"
                        echo ^<web-app xmlns="http://xmlns.jcp.org/xml/ns/javaee" >> "%TOMCAT_HOME%\\webapps\\visualizer\\WEB-INF\\web.xml"
                        echo         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >> "%TOMCAT_HOME%\\webapps\\visualizer\\WEB-INF\\web.xml"
                        echo         xsi:schemaLocation="http://xmlns.jcp.org/xml/ns/javaee http://xmlns.jcp.org/xml/ns/javaee/web-app_4_0.xsd" >> "%TOMCAT_HOME%\\webapps\\visualizer\\WEB-INF\\web.xml"
                        echo         version="4.0"^> >> "%TOMCAT_HOME%\\webapps\\visualizer\\WEB-INF\\web.xml"
                        echo     ^<display-name^>Flow Diagram Application^</display-name^> >> "%TOMCAT_HOME%\\webapps\\visualizer\\WEB-INF\\web.xml"
                        echo     ^<error-page^> >> "%TOMCAT_HOME%\\webapps\\visualizer\\WEB-INF\\web.xml"
                        echo         ^<error-code^>404^</error-code^> >> "%TOMCAT_HOME%\\webapps\\visualizer\\WEB-INF\\web.xml"
                        echo         ^<location^>/visualizer/index.html^</location^> >> "%TOMCAT_HOME%\\webapps\\visualizer\\WEB-INF\\web.xml"
                        echo     ^</error-page^> >> "%TOMCAT_HOME%\\webapps\\visualizer\\WEB-INF\\web.xml"
                        echo ^</web-app^> >> "%TOMCAT_HOME%\\webapps\\visualizer\\WEB-INF\\web.xml"
                    '''
                    
                    // Start Tomcat
                    bat '''
                        net start Tomcat9
                        timeout /t 30
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "Deployment successful! Access the application at: http://${TOMCAT_HOST}:${TOMCAT_PORT}/visualizer/"
        }
        failure {
            echo "Deployment failed! Check the logs for details"
        }
        always {
            cleanWs()
        }
    }
} 