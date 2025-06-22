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

### Implementation Guidelines

1. **Immutable Builds**
   ```dockerfile
   # Multi-stage build for security and size
   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   
   FROM gcr.io/distroless/nodejs18
   COPY --from=builder /app/node_modules ./node_modules
   COPY . .
   
   # No package managers in final image
   USER nonroot
   EXPOSE 8080
   CMD ["server.js"]
   ```

2. **Release Manifests**
   ```yaml
   # release-manifest.yaml
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: release-info
   data:
     version: "1.2.3"
     git_commit: "abc123def"
     build_time: "2025-06-21T10:00:00Z"
     release_notes: |
       - Feature: New checkout flow
       - Fix: Memory leak in worker process
       - Security: Updated dependencies
   ```

3. **GitOps Release Process**
   ```yaml
   # Kustomization for environment promotion
   # environments/staging/kustomization.yaml
   apiVersion: kustomize.config.k8s.io/v1beta1
   kind: Kustomization
   
   resources:
   - ../../base
   
   images:
   - name: myapp
     newTag: 1.2.3-staging
   
   patchesStrategicMerge:
   - replica-count.yaml
   - resource-limits.yaml
   ```

### Best Practices

1. **Semantic Versioning**
   ```bash
   # Automated version bumping
   npm version patch -m "Release %s"
   git push --follow-tags
   ```

2. **Build Reproducibility**
   ```dockerfile
   # Lock base image versions
   FROM node:18.16.0-alpine3.17@sha256:abc123...
   
   # Use specific package versions
   RUN npm ci --production
   ```

3. **Release Automation**
   ```python
   # release.py
   import subprocess
   import json
   from datetime import datetime
   
   def create_release(version, commit_sha):
       # Build container
       subprocess.run([
           "docker", "build",
           "-t", f"myapp:{version}",
           "--build-arg", f"VERSION={version}",
           "--build-arg", f"COMMIT={commit_sha}",
           "."
       ])
       
       # Generate release metadata
       metadata = {
           "version": version,
           "commit": commit_sha,
           "timestamp": datetime.utcnow().isoformat(),
           "artifacts": {
               "container": f"myapp:{version}",
               "helm_chart": f"myapp-{version}.tgz"
           }
       }
       
       with open(f"release-{version}.json", "w") as f:
           json.dump(metadata, f)
   ```

4. **Rollback Strategy**
   ```bash
   # Quick rollback with Kubernetes
   kubectl rollout undo deployment/myapp
   
   # Specific version rollback
   kubectl set image deployment/myapp myapp=myapp:1.2.2
   
   # GitOps rollback
   git revert HEAD
   git push
   ```

### Anti-Patterns to Avoid

- **Mutable deployments** - Never modify running code
- **Manual releases** - Automate everything
- **Missing version tracking** - Tag everything
- **Configuration in builds** - Keep config separate
- **Long-running branches** - Merge frequently

### Modern Tools and Services

- **CI/CD**: GitHub Actions, GitLab CI, CircleCI, Jenkins
- **Progressive Delivery**: Flagger, Argo Rollouts, Spinnaker
- **Feature Flags**: LaunchDarkly, Split.io, Unleash
- **GitOps**: ArgoCD, Flux, Jenkins X
- **Release Management**: Helm, Kustomize, Jsonnet

### Key Takeaways

1. Strict separation enables reliable deployments
2. Immutable builds prevent runtime surprises
3. Progressive delivery reduces deployment risk
4. GitOps provides auditability and rollback
5. Automation is essential for consistency
6. Version everything for traceability

---

### Sources

- https://12factor.net/build-release-run
- https://sre.google/sre-book/release-engineering/
- https://www.weave.works/technologies/gitops/
- https://www.split.io/glossary/progressive-delivery/
- https://www.cncf.io/blog/2023/03/28/ci-cd-best-practices/