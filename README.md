# DevOps Resume – CI/CD with Jenkins, Docker & Kubernetes

This project demonstrates an end-to-end DevOps CI/CD pipeline for deploying a static resume web application using:

* GitHub
* Jenkins
* Jenkins Agent
* Docker
* Docker Hub
* Kubernetes
* Nginx
* AWS EC2

The pipeline automatically builds a Docker image, pushes it to Docker Hub, deploys the image to Kubernetes, and verifies the deployment.

---

# 1. Project Architecture

```text
                    Developer
                       |
                       | git push
                       v
              +-------------------+
              |      GitHub       |
              |    test branch    |
              +---------+---------+
                        |
                        | Jenkins SCM
                        v
              +-------------------+
              | Jenkins Controller|
              |    Instance 1     |
              +---------+---------+
                        |
                        | SSH
                        v
              +-------------------+
              |   Jenkins Agent   |
              |    k8s-agent      |
              |    Instance 3     |
              +---------+---------+
                        |
            +-----------+-----------+
            |                       |
            v                       v
      Docker Build             kubectl
            |                       |
            v                       v
       Docker Hub              Kubernetes
            |                   Cluster
            |                       |
            |                       v
            |                 Deployment
            |                       |
            |                       v
            |                     Pod
            |                       |
            |                       v
            |                    Nginx
            |                       |
            +-----------------------+
                        |
                        v
                 Resume Web App
```

---

# 2. AWS EC2 Infrastructure

Three EC2 instances were used during the setup.

## Instance 1 – Jenkins Controller

Purpose:

* Jenkins server
* Jenkins pipeline orchestration
* Connects to Jenkins Agent through SSH

Main components:

```text
Jenkins
Java 21
Git
```

Jenkins runs on:

```text
Port: 8080
```

---

## Instance 2 – DevOps Tools / Learning Server

Purpose:

* Maven
* Java
* Docker
* Git
* Future learning/testing for tools such as:

  * Maven
  * Nexus
  * SonarQube
  * Tomcat

This instance is not required for the current Docker + Kubernetes pipeline.

---

## Instance 3 – Jenkins Agent + Kubernetes

This instance performs the actual CI/CD work.

Installed tools:

```text
Git
Docker
Java 21
kubectl
Kubernetes
```

This instance is also the Kubernetes control-plane node.

Jenkins Agent:

```text
Node name: k8s-agent
User: jenkins
Remote root: /home/jenkins
```

The Kubernetes worker node is another EC2 instance.

---

# 3. GitHub Repository

Repository:

```text
https://github.com/prashanthbobby/devops-resume.git
```

The pipeline uses the:

```text
test
```

branch.

Project structure:

```text
devops-resume/
│
├── Dockerfile
├── Jenkinsfile
├── pom.xml
│
├── K8s/
│   ├── deployment.yml
│   └── service.yml
│
└── src/
    └── main/
        └── webapp/
            ├── index.html
            ├── index.jsp
            ├── WEB-INF/
            ├── css/
            ├── js/
            └── images/
```

Important:

The Kubernetes directory is named:

```text
K8s
```

with a capital `K`.

Linux is case-sensitive, so this is different from:

```text
k8s
```

The Jenkinsfile must therefore use:

```text
K8s/deployment.yml
K8s/service.yml
```

---

# 4. Application

The resume is a static web application containing:

```text
HTML
CSS
JavaScript
Images
```

The application is served using Nginx.

The application does not require Tomcat for the current Docker deployment.

Maven and `pom.xml` are retained for DevOps learning and future CI/CD demonstrations, but Maven is not required for the current static Nginx deployment.

---

# 5. Dockerfile

The Dockerfile is located at:

```text
Dockerfile
```

Contents:

```dockerfile
FROM nginx:alpine

COPY src/main/webapp/ /usr/share/nginx/html/

EXPOSE 80
```

## Explanation

### Base image

```dockerfile
FROM nginx:alpine
```

Uses the lightweight Nginx Alpine image.

### Copy application

```dockerfile
COPY src/main/webapp/ /usr/share/nginx/html/
```

Copies the resume web application into the Nginx web root.

### Port

```dockerfile
EXPOSE 80
```

Nginx listens on port 80 inside the container.

---

# 6. Docker Hub

Docker Hub username:

```text
prashanth1316
```

Docker repository:

```text
prashanth1316/resume2026
```

Images are tagged using the Jenkins build number.

For example:

```text
Build #1
    ↓
prashanth1316/resume2026:1

Build #2
    ↓
prashanth1316/resume2026:2

Build #3
    ↓
prashanth1316/resume2026:3
```

This allows each Jenkins build to produce a unique Docker image.

---

# 7. Docker Hub Authentication in Jenkins

A Docker Hub access token was created and stored in Jenkins.

The token must NOT be stored directly inside the Jenkinsfile.

Jenkins credential:

```text
ID:
dockerhub-credentials
```

Credential type:

```text
Username with password
```

Username:

```text
prashanth1316
```

Password:

```text
Docker Hub Access Token
```

The Jenkinsfile retrieves this credential securely using:

```groovy
withCredentials([
    usernamePassword(
        credentialsId: 'dockerhub-credentials',
        usernameVariable: 'DOCKER_USERNAME',
        passwordVariable: 'DOCKER_PASSWORD'
    )
])
```

---

# 8. Jenkins Controller Setup

Jenkins was installed on Instance 1.

Verify Jenkins:

```bash
systemctl status jenkins
```

Jenkins should show:

```text
active (running)
```

Jenkins is accessed through:

```text
http://<JENKINS-IP>:8080
```

---

# 9. Jenkins Agent Setup

The Jenkins controller does not perform the Docker/Kubernetes work.

Instead, it sends the job to:

```text
k8s-agent
```

The agent runs on Instance 3.

---

## 9.1 Create Jenkins User

On Instance 3:

```bash
useradd -m -s /bin/bash jenkins
```

Add Jenkins to Docker group:

```bash
usermod -aG docker jenkins
```

This allows the Jenkins user to execute Docker commands without requiring root.

---

# 10. Kubernetes Access for Jenkins

The Jenkins Agent needs access to the Kubernetes cluster.

Create the Kubernetes configuration directory:

```bash
mkdir -p /home/jenkins/.kube
```

Copy the Kubernetes configuration:

```bash
cp /root/.kube/config /home/jenkins/.kube/config
```

Change ownership:

```bash
chown -R jenkins:jenkins /home/jenkins/.kube
```

---

# 11. Verify Kubernetes Access as Jenkins

Switch to Jenkins user:

```bash
su - jenkins
```

Check Kubernetes:

```bash
kubectl get nodes
```

Both Kubernetes nodes should show:

```text
Ready
```

Check the application namespace:

```bash
kubectl get pods -n pns
```

Check services:

```bash
kubectl get services -n pns
```

---

# 12. Verify Docker Access as Jenkins

As the Jenkins user:

```bash
docker ps
```

Also:

```bash
docker info
```

Docker should work without permission errors.

If Docker gives:

```text
permission denied
```

verify:

```bash
groups jenkins
```

The output should include:

```text
docker
```

A logout/login may be required after adding the user to the Docker group.

---

# 13. SSH Connection Between Jenkins Controller and Agent

The Jenkins Controller connects to Instance 3 through SSH.

On Instance 1, an SSH key was created:

```bash
ssh-keygen -t ed25519 -f /root/.ssh/jenkins_agent_key
```

This created:

```text
/root/.ssh/jenkins_agent_key
/root/.ssh/jenkins_agent_key.pub
```

The public key was added to Instance 3:

```text
/home/jenkins/.ssh/authorized_keys
```

Permissions:

```bash
chmod 700 /home/jenkins/.ssh
chmod 600 /home/jenkins/.ssh/authorized_keys
```

---

# 14. Test SSH Manually

From Instance 1:

```bash
ssh -i /root/.ssh/jenkins_agent_key jenkins@172.31.74.244
```

If successful, the controller can connect to the agent.

---

# 15. Jenkins Known Hosts Configuration

Jenkins uses the following known-hosts file:

```text
/var/lib/jenkins/.ssh/known_hosts
```

The Kubernetes agent host key was added from the Jenkins Controller:

```bash
sudo -u jenkins mkdir -p /var/lib/jenkins/.ssh

sudo -u jenkins ssh-keyscan -H 172.31.74.244 >> /var/lib/jenkins/.ssh/known_hosts

chown -R jenkins:jenkins /var/lib/jenkins/.ssh
```

Important:

Running `ssh-keyscan` on Instance 3 does not configure the Controller's known-hosts file.

The host key must exist on the Jenkins Controller because the Controller is initiating the SSH connection.

---

# 16. Jenkins Node Configuration

In Jenkins:

```text
Manage Jenkins
    ↓
Nodes
    ↓
New Node
```

Node name:

```text
k8s-agent
```

Type:

```text
Permanent Agent
```

Executors:

```text
1
```

Remote root directory:

```text
/home/jenkins
```

Label:

```text
k8s-agent
```

Usage:

```text
Only build jobs with label expressions matching this node
```

Launch method:

```text
Launch agents via SSH
```

Host:

```text
172.31.74.244
```

Credentials:

```text
k8s-agent-ssh
```

Username:

```text
jenkins
```

Private key:

```text
/root/.ssh/jenkins_agent_key
```

Host Key Verification Strategy:

```text
Known hosts file
```

The node must show:

```text
Online
```

---

# 17. Kubernetes Namespace

The application is deployed into:

```text
pns
```

Namespace can be checked using:

```bash
kubectl get namespace
```

---

# 18. Kubernetes Deployment

File:

```text
K8s/deployment.yml
```

Example:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: resume2026
  namespace: pns
spec:
  replicas: 1
  selector:
    matchLabels:
      app: resume
  template:
    metadata:
      labels:
        app: resume
    spec:
      containers:
        - name: resume1c
          image: prashanth1316/resume2026:IMAGE_TAG
          ports:
            - containerPort: 80
```

---

# 19. Important Kubernetes Selector Configuration

The Deployment selector and Pod labels must match.

Deployment:

```yaml
selector:
  matchLabels:
    app: resume
```

Pod:

```yaml
labels:
  app: resume
```

Therefore:

```text
app=resume
```

must be present in both locations.

If these do not match, Kubernetes will reject the Deployment.

---

# 20. Image Tag Replacement

The Deployment YAML contains:

```text
IMAGE_TAG
```

Example:

```yaml
image: prashanth1316/resume2026:IMAGE_TAG
```

Jenkins replaces it with the current build number.

For Build #2:

```text
IMAGE_TAG
```

becomes:

```text
2
```

Result:

```yaml
image: prashanth1316/resume2026:2
```

This is done using:

```bash
sed "s/IMAGE_TAG/${IMAGE_TAG}/g" \
K8s/deployment.yml > /tmp/deployment.yml
```

The generated file is:

```text
/tmp/deployment.yml
```

The original GitHub YAML remains unchanged.

---

# 21. Kubernetes Service

File:

```text
K8s/service.yml
```

Contents:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: resume2026-service
  namespace: pns
spec:
  type: NodePort
  selector:
    app: resume
  ports:
    - port: 80
      targetPort: 80
      nodePort: 30080
```

---

# 22. Kubernetes Networking

The application listens inside the container on:

```text
80
```

The Kubernetes Service exposes:

```text
80:30080
```

Meaning:

```text
NodePort: 30080
    ↓
Service port: 80
    ↓
Pod/container port: 80
    ↓
Nginx
```

The application can therefore be accessed using:

```text
http://<KUBERNETES-NODE-IP>:30080
```

---

# 23. Jenkins Pipeline Job

Jenkins job name:

```text
resume2026-cicd
```

Create:

```text
New Item
    ↓
resume2026-cicd
    ↓
Pipeline
```

Pipeline definition:

```text
Pipeline script from SCM
```

SCM:

```text
Git
```

Repository:

```text
https://github.com/prashanthbobby/devops-resume.git
```

Branch:

```text
*/test
```

Script Path:

```text
Jenkinsfile
```

---

# 24. Jenkinsfile

Current Jenkinsfile:

```groovy
pipeline {
    agent {
        label 'k8s-agent'
    }

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

        stage('Docker Login & Push') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-credentials',
                        usernameVariable: 'DOCKER_USERNAME',
                        passwordVariable: 'DOCKER_PASSWORD'
                    )
                ]) {
                    sh '''
                        echo "$DOCKER_PASSWORD" | docker login \
                        -u "$DOCKER_USERNAME" \
                        --password-stdin

                        docker push ${IMAGE_NAME}:${IMAGE_TAG}

                        docker logout
                    '''
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                sh '''
                    sed "s/IMAGE_TAG/${IMAGE_TAG}/g" \
                    K8s/deployment.yml > /tmp/deployment.yml

                    kubectl apply -f /tmp/deployment.yml
                    kubectl apply -f K8s/service.yml
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
```

---

# 25. Jenkins Pipeline Stages

The pipeline contains five main stages.

## Stage 1 – Checkout

```text
Checkout
```

Jenkins gets the code from:

```text
GitHub → test branch
```

The Jenkinsfile itself is also obtained from the `test` branch.

---

## Stage 2 – Docker Build

Jenkins runs:

```bash
docker build -t prashanth1316/resume2026:${BUILD_NUMBER} .
```

For Build #1:

```text
prashanth1316/resume2026:1
```

For Build #2:

```text
prashanth1316/resume2026:2
```

---

## Stage 3 – Docker Login & Push

Jenkins retrieves the Docker Hub credentials:

```text
dockerhub-credentials
```

Then:

```bash
docker login
```

and:

```bash
docker push
```

The image is uploaded to:

```text
Docker Hub
    ↓
prashanth1316/resume2026
```

Finally:

```bash
docker logout
```

---

## Stage 4 – Deploy to Kubernetes

Jenkins replaces the image tag:

```text
IMAGE_TAG → BUILD_NUMBER
```

Then applies:

```bash
kubectl apply -f /tmp/deployment.yml
```

and:

```bash
kubectl apply -f K8s/service.yml
```

Kubernetes creates/updates:

```text
Deployment
    ↓
ReplicaSet
    ↓
Pod
```

---

## Stage 5 – Verify Deployment

Jenkins checks:

```bash
kubectl rollout status deployment/resume2026 -n pns
```

Then displays:

```bash
kubectl get pods -n pns
```

and:

```bash
kubectl get service -n pns
```

---

# 26. Complete CI/CD Flow

When a developer pushes code:

```text
Developer
   |
   | git push
   v
GitHub - test branch
   |
   v
Jenkins Controller
   |
   | SSH
   v
k8s-agent
   |
   +----------------------+
   |                      |
   v                      v
Docker Build          Kubernetes
   |                      |
   v                      |
Docker Hub                 |
   |                      |
   |                      v
   |                 Deployment
   |                      |
   |                      v
   |                     Pod
   |                      |
   |                      v
   |                    Nginx
   |                      |
   +----------------------+
              |
              v
       Resume Application
```

---

# 27. Manual Verification Commands

## Check Jenkins Agent

On Jenkins:

```text
Manage Jenkins
    ↓
Nodes
```

Confirm:

```text
k8s-agent
Online
```

---

## Check Docker

On Instance 3:

```bash
docker ps
```

Check images:

```bash
docker images
```

Check the resume image:

```bash
docker images | grep resume2026
```

---

## Check Kubernetes Nodes

```bash
kubectl get nodes
```

Expected:

```text
control-plane    Ready
worker           Ready
```

---

## Check Deployment

```bash
kubectl get deployment -n pns
```

---

## Check Pods

```bash
kubectl get pods -n pns -o wide
```

---

## Check Service

```bash
kubectl get service -n pns
```

Expected:

```text
resume2026-service   NodePort   ...   80:30080/TCP
```

---

## Check Everything

```bash
kubectl get all -n pns
```

---

# 28. Application Access

The NodePort is:

```text
30080
```

Access:

```text
http://<KUBERNETES-NODE-IP>:30080
```

For example, if the Kubernetes node's reachable IP is:

```text
172.31.x.x
```

the URL would be:

```text
http://172.31.x.x:30080
```

For access from the Internet, the EC2 Security Group must allow TCP:

```text
30080
```

Prefer restricting the source IP instead of opening it to:

```text
0.0.0.0/0
```

unless this is only a temporary lab test.

---

# 29. Cleaning Previous Kubernetes Deployment

Before starting a fresh deployment, old application resources can be removed.

Check:

```bash
kubectl get all -n pns
```

Delete the previous Deployment:

```bash
kubectl delete deployment resume2026 -n pns
```

Delete the Service:

```bash
kubectl delete service resume2026-service -n pns
```

Then verify:

```bash
kubectl get all -n pns
```

Expected:

```text
No resources found in pns namespace.
```

Deleting the Deployment also removes its ReplicaSet and Pod.

Do not delete the namespace unless intentionally required.

---

# 30. Troubleshooting

## Problem 1 – Docker daemon not running

Error:

```text
Cannot connect to the Docker daemon
```

Check:

```bash
systemctl status docker
```

Start:

```bash
systemctl start docker
```

Enable at boot:

```bash
systemctl enable docker
```

---

## Problem 2 – Jenkins cannot connect to agent

Check Jenkins node:

```text
Manage Jenkins → Nodes → k8s-agent
```

Check SSH manually from Controller:

```bash
ssh -i /root/.ssh/jenkins_agent_key jenkins@172.31.74.244
```

Check known hosts:

```bash
cat /var/lib/jenkins/.ssh/known_hosts
```

Add host key if required:

```bash
sudo -u jenkins ssh-keyscan -H 172.31.74.244 >> /var/lib/jenkins/.ssh/known_hosts
```

---

## Problem 3 – Docker push unauthorized

Check Jenkins credential:

```text
dockerhub-credentials
```

Make sure:

```text
Username = prashanth1316
Password = Docker Hub access token
```

Do not put the token directly in the Jenkinsfile.

---

## Problem 4 – Kubernetes YAML not found

Example error:

```text
sed: can't read k8s/deployment.yml:
No such file or directory
```

Check the actual directory name:

```text
K8s
```

Linux is case-sensitive.

Correct:

```bash
K8s/deployment.yml
```

Incorrect:

```bash
k8s/deployment.yml
```

---

## Problem 5 – Kubernetes selector mismatch

The Deployment selector:

```yaml
matchLabels:
  app: resume
```

must match:

```yaml
labels:
  app: resume
```

The Service selector must also match:

```yaml
selector:
  app: resume
```

---

## Problem 6 – Pod remains Pending

Run:

```bash
kubectl get pods -n pns -o wide
```

Then:

```bash
kubectl describe pod <POD_NAME> -n pns
```

Check Kubernetes nodes:

```bash
kubectl get nodes
```

A pod can remain Pending if there is no available/suitable worker node.

---

## Problem 7 – Pod is Running but website is inaccessible

Check:

```bash
kubectl get service -n pns
```

Confirm:

```text
80:30080/TCP
```

Check:

```bash
kubectl get pods -n pns -o wide
```

Check the EC2 Security Group and ensure TCP:

```text
30080
```

is allowed from the required source.

---

# 31. Useful Kubernetes Commands

List namespaces:

```bash
kubectl get namespaces
```

List nodes:

```bash
kubectl get nodes
```

List pods:

```bash
kubectl get pods -n pns
```

Detailed pod information:

```bash
kubectl describe pod <POD_NAME> -n pns
```

List deployments:

```bash
kubectl get deployments -n pns
```

List services:

```bash
kubectl get services -n pns
```

List ReplicaSets:

```bash
kubectl get replicasets -n pns
```

View deployment:

```bash
kubectl describe deployment resume2026 -n pns
```

View application logs:

```bash
kubectl logs <POD_NAME> -n pns
```

Watch pods:

```bash
kubectl get pods -n pns -w
```

Check rollout:

```bash
kubectl rollout status deployment/resume2026 -n pns
```

---

# 32. Useful Docker Commands

Check Docker:

```bash
docker --version
```

Check Docker service:

```bash
systemctl status docker
```

List images:

```bash
docker images
```

Build manually:

```bash
docker build -t prashanth1316/resume2026:test .
```

Run locally:

```bash
docker run -d --name resume2026 -p 8080:80 prashanth1316/resume2026:test
```

Check container:

```bash
docker ps
```

Stop:

```bash
docker stop resume2026
```

Remove:

```bash
docker rm resume2026
```

---

# 33. Jenkins Build Number and Docker Tags

The pipeline uses:

```groovy
IMAGE_TAG = "${BUILD_NUMBER}"
```

Therefore:

| Jenkins Build | Docker Image                 |
| ------------- | ---------------------------- |
| Build #1      | `prashanth1316/resume2026:1` |
| Build #2      | `prashanth1316/resume2026:2` |
| Build #3      | `prashanth1316/resume2026:3` |
| Build #4      | `prashanth1316/resume2026:4` |

This provides traceability between a Jenkins build and the Docker image deployed to Kubernetes.

---

# 34. Why Jenkins Agent Is Used

The Jenkins Controller is responsible for:

```text
Pipeline orchestration
Job management
Build scheduling
```

The Jenkins Agent performs:

```text
Docker build
Docker push
kubectl commands
Kubernetes deployment
```

This prevents the Jenkins Controller from needing Docker and Kubernetes tools for this pipeline.

The agent is selected using:

```groovy
agent {
    label 'k8s-agent'
}
```

---

# 35. Current Environment Summary

```text
GitHub:
    Repository: prashanthbobby/devops-resume
    Branch: test

Jenkins:
    Job: resume2026-cicd
    Controller: Instance 1
    Agent: k8s-agent
    Agent host: 172.31.74.244

Docker:
    Username: prashanth1316
    Repository: resume2026

Kubernetes:
    Namespace: pns
    Deployment: resume2026
    Container: resume1c
    Service: resume2026-service
    Service type: NodePort
    NodePort: 30080

Application:
    Server: Nginx
    Container port: 80
```

---

# 36. Final CI/CD Process to Remember

For future setup/review, remember the following sequence:

```text
1. Create/Update application
        ↓
2. Push code to GitHub test branch
        ↓
3. Jenkins gets Jenkinsfile
        ↓
4. Jenkins sends job to k8s-agent
        ↓
5. Checkout test branch
        ↓
6. Docker builds image
        ↓
7. Jenkins logs into Docker Hub
        ↓
8. Docker image pushed to Docker Hub
        ↓
9. Jenkins replaces IMAGE_TAG
        ↓
10. kubectl applies Deployment
        ↓
11. kubectl applies Service
        ↓
12. Kubernetes pulls Docker image
        ↓
13. Pod starts Nginx
        ↓
14. Jenkins checks rollout
        ↓
15. Resume available through NodePort 30080
```

---

# 37. Quick Setup Checklist

When rebuilding this environment from scratch:

```text
[ ] AWS EC2 instances available
[ ] Jenkins installed on Controller
[ ] Java installed
[ ] Git installed on Agent
[ ] Docker installed on Agent
[ ] Docker daemon running
[ ] kubectl installed on Agent
[ ] Kubernetes cluster running
[ ] Jenkins user created on Agent
[ ] Jenkins added to docker group
[ ] kubeconfig copied to /home/jenkins/.kube/
[ ] SSH key created on Controller
[ ] Public key added to Agent
[ ] SSH connection tested
[ ] Agent known_hosts configured
[ ] k8s-agent shows Online
[ ] Docker Hub repository created
[ ] Docker Hub access token created
[ ] Jenkins Docker credential created
[ ] GitHub test branch contains Jenkinsfile
[ ] GitHub test branch contains K8s/deployment.yml
[ ] GitHub test branch contains K8s/service.yml
[ ] Jenkins Pipeline job created
[ ] Branch configured as */test
[ ] Script Path configured as Jenkinsfile
[ ] Pipeline Build Now executed
[ ] Docker image pushed
[ ] Kubernetes deployment created
[ ] Pod Running
[ ] Service NodePort created
[ ] Application accessible
```

---

# 38. Important Lessons Learned

### 1. Linux is case-sensitive

```text
K8s ≠ k8s
```

Always verify directory/file names.

### 2. Jenkins Controller and Agent have different environments

A command working on the Controller does not mean it will work on the Agent.

The pipeline runs on:

```text
k8s-agent
```

so Docker, kubectl, Git and permissions must be configured there.

### 3. Docker credentials should be stored in Jenkins

Never put a Docker Hub password or access token directly in:

```text
Jenkinsfile
GitHub
Shell scripts
```

Use Jenkins Credentials.

### 4. Kubernetes Deployment and Service selectors must match Pod labels

```text
Deployment selector
        =
Pod label
        =
Service selector
```

For this project:

```text
app=resume
```

### 5. Docker image tags provide version tracking

```text
Jenkins Build #1 → image :1
Jenkins Build #2 → image :2
Jenkins Build #3 → image :3
```

This makes it easier to identify which build produced an image.

### 6. The Jenkins Agent performs the actual CI/CD work

```text
Controller = orchestration
Agent = execution
```

---

# 39. End Result

The completed setup provides an end-to-end CI/CD demonstration:

```text
GitHub
   ↓
Jenkins
   ↓
Jenkins Agent
   ↓
Docker Build
   ↓
Docker Hub
   ↓
Kubernetes
   ↓
Nginx Pod
   ↓
Resume Application
```

This setup can be used as a practical DevOps portfolio/demo project to demonstrate Git, Jenkins, Docker, Docker Hub, Kubernetes, CI/CD, SSH-based Jenkins agents, credentials management, containerization, and automated deployment.
