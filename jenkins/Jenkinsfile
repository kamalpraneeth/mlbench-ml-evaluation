pipeline {
    agent any

    environment {
        PYTHON_VERSION = '3.12'
        NODE_VERSION = '20'
        API_PORT = '8000'
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source repository...'
                checkout scm
            }
        }

        stage('Backend Setup & Tests') {
            steps {
                echo 'Setting up Python environment and running test suite...'
                sh '''
                    python3 -m pip install -r requirements.txt
                    python3 -m pytest backend/tests -v --junitxml=reports/backend-tests.xml
                '''
            }
        }

        stage('Frontend Setup & Build') {
            steps {
                echo 'Installing frontend dependencies and verifying production build...'
                dir('frontend') {
                    sh '''
                        npm ci
                        npm run build
                    '''
                }
            }
        }

        stage('Docker Image Build') {
            steps {
                echo 'Building production container images...'
                sh '''
                    docker build -t mlbench-backend:latest -f Dockerfile .
                '''
            }
        }
    }

    post {
        always {
            echo 'Archiving test execution reports...'
            junit allowEmptyResults: true, testResults: 'reports/**/*.xml'
        }
        success {
            echo 'MLBench pipeline completed successfully.'
        }
        failure {
            echo 'Pipeline encountered failures in test or build phases.'
        }
    }
}
