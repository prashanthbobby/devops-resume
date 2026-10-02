pipeline {
    agent any

    environment {
        IMAGE_NAME = 'prashanth1316/resume2026'
        IMAGE_TAG  = "${BUILD_NUMBER}"
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'test',
                    url: 'https://github.com/prashanthbobby/devops-resume.git'
            }
        }

        stage('Docker Build') {
            steps {
                sh '''
                    docker build \
                    -t ${IMAGE_NAME}:${IMAGE_TAG} .
                '''
            }
        }

        stage('Docker Push') {
            steps {
                sh '''
                    docker push ${IMAGE_NAME}:${IMAGE_TAG}
                '''
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                sh '''
                    sed "s/IMAGE_TAG/${IMAGE_TAG}/g" \
                    k8s/deployment.yml > /tmp/deployment.yml

                    kubectl apply -f /tmp/deployment.yml
                    kubectl apply -f k8s/service.yml
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                    kubectl rollout status \
                    deployment/resume2026 \
                    -n pns

                    kubectl get pods -n pns
                    kubectl get service -n pns
                '''
            }
        }
    }
}
