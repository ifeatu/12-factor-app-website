---
layout: default
title: "Factor 5: Build, Release, Run"
---

# Factor 5: Build, Release, Run

## Strictly separate build and run stages

### Original Principle

A codebase is transformed into a deploy through three stages: Build (convert code to executable bundle), Release (combine build with config), and Run (execute the release in the environment). Strict separation between stages prevents changes to code at runtime.

### Modern Evolution

The principle has proven remarkably prescient, with modern CI/CD pipelines embodying this separation. However, progressive delivery techniques, infrastructure as code, and GitOps have added sophisticated patterns that blur traditional boundaries while maintaining the core separation.

#### Modern CI/CD Pipeline

```yaml
# GitLab CI/CD Pipeline
stages:
  - build
  - test
  - security
  - release
  - deploy
  - verify

# BUILD STAGE
build:
  stage: build
  script:
    - docker build -t myapp:$CI_COMMIT_SHA .
    - docker push registry.example.com/myapp:$CI_COMMIT_SHA
  artifacts:
    reports:
      sbom: sbom.json  # Software Bill of Materials

# SECURITY SCANNING
security-scan:
  stage: security
  script:
    - trivy image registry.example.com/myapp:$CI_COMMIT_SHA
    - snyk test --severity-threshold=high

# RELEASE STAGE
release:
  stage: release
  script:
    # Combine build with environment config
    - helm package chart/
    - helm push myapp-$VERSION.tgz chartmuseum
    # Tag immutable release
    - docker tag registry.example.com/myapp:$CI_COMMIT_SHA registry.example.com/myapp:$VERSION

# PROGRESSIVE DEPLOYMENT
deploy-canary:
  stage: deploy
  script:
    - kubectl set image deployment/myapp myapp=registry.example.com/myapp:$VERSION
    - kubectl patch deployment myapp -p '{"spec":{"strategy":{"canary":{"weight":10}}}}'
  environment:
    name: production
    url: https://myapp.example.com

# VERIFICATION
verify-deployment:
  stage: verify
  script:
    - newman run tests/api-tests.json
    - artillery run tests/load-test.yml
```

#### Progressive Delivery

Modern deployments go beyond simple release/run:

1. **Canary Deployments**
   ```yaml
   # Flagger progressive delivery
   apiVersion: flagger.app/v1beta1
   kind: Canary
   metadata:
     name: myapp
   spec:
     targetRef:
       apiVersion: apps/v1
       kind: Deployment
       name: myapp
     progressDeadlineSeconds: 60
     service:
       port: 80
     analysis:
       interval: 30s
       threshold: 5
       metrics:
       - name: request-success-rate
         threshold: 99
       - name: request-duration
         threshold: 500
   ```

2. **Feature Flags**
   ```python
   # LaunchDarkly feature flag integration
   import ldclient
   
   ld_client = ldclient.get()
   
   def get_feature_state(user, feature_key):
       return ld_client.variation(
           feature_key,
           {"key": user.id},
           False  # default value
       )
   
   # In application code
   if get_feature_state(current_user, "new-checkout-flow"):
       return new_checkout_process()
   else:
       return legacy_checkout_process()
   ```

3. **Blue-Green Deployments**
   ```bash
   #!/bin/bash
   # Blue-green deployment script
   
   # Deploy to green environment
   kubectl apply -f k8s/deployment-green.yaml
   
   # Wait for health checks
   kubectl wait --for=condition=ready pod -l version=green
   
   # Run smoke tests
   ./run-smoke-tests.sh https://green.myapp.example.com
   
   # Switch traffic
   kubectl patch service myapp -p '{"spec":{"selector":{"version":"green"}}}'
   
   # Keep blue for quick rollback
   kubectl scale deployment myapp-blue --replicas=0
   ```