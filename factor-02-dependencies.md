---
layout: default
title: "Factor 2: Dependencies"
---

# Factor 2: Dependencies

## Explicitly declare and isolate dependencies

### Original Principle

A twelve-factor app never relies on implicit existence of system-wide packages. It declares all dependencies, completely and exactly, via a dependency declaration manifest. It uses a dependency isolation tool during execution to ensure that no implicit dependencies "leak in" from the surrounding system.

### Modern Evolution

Dependency management has evolved from a development convenience to a critical security concern. Modern applications face sophisticated supply chain attacks that exploit transitive dependencies and compromised packages.

#### Supply Chain Security

The evolution of dependency management now includes:

- **Software Bills of Materials (SBOMs)** - Complete inventory of all components
- **Dependency scanning** - Continuous vulnerability assessment
- **License compliance** - Automated license compatibility checks
- **Provenance tracking** - Verifying the source and integrity of dependencies

#### Container-Based Isolation

Containers have revolutionized dependency isolation:

```dockerfile
# Modern dependency declaration
FROM node:18-alpine AS base

# Install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Multi-stage build for security
FROM base AS dev
RUN npm ci --only=development

FROM gcr.io/distroless/nodejs18
COPY --from=base /app/node_modules ./node_modules
COPY . .
```

#### Language-Specific Evolution

Each ecosystem has matured its dependency management:

**JavaScript/Node.js:**
- `package-lock.json` for deterministic installs
- `npm audit` for vulnerability scanning
- Workspaces for monorepo management

**Python:**
- `requirements.txt` → `Pipfile` → `pyproject.toml`
- Virtual environments → Docker containers
- Poetry for modern dependency management

**Java:**
- Maven Central security scanning
- Gradle dependency verification
- OWASP Dependency Check integration

**Go:**
- Go modules with cryptographic checksums
- Proxy servers for availability
- Minimal version selection

### Implementation Guidelines

1. **Declare Everything Explicitly**
   ```json
   {
     "dependencies": {
       "express": "4.18.2",
       "postgres": "3.3.5"
     },
     "devDependencies": {
       "jest": "29.5.0",
       "eslint": "8.42.0"
     }
   }
   ```

2. **Lock Dependencies**
   - Use lock files (`package-lock.json`, `Gemfile.lock`, `go.sum`)
   - Commit lock files to version control
   - Automated updates with security patches

3. **Scan Continuously**
   ```yaml
   # GitHub dependency scanning
   name: Dependency Scan
   on: [push, pull_request]
   jobs:
     security:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - name: Run Snyk scan
           uses: snyk/actions/node@master
           env:
             SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
   ```

4. **Generate SBOMs**
   ```bash
   # Generate SBOM in SPDX format
   syft packages dir:. -o spdx-json > sbom.json
   
   # Scan SBOM for vulnerabilities
   grype sbom:./sbom.json
   ```

### Security Best Practices

1. **Minimize Dependencies**
   - Audit every new dependency
   - Prefer standard library when possible
   - Regular dependency pruning

2. **Use Private Registries**
   - Mirror public packages internally
   - Scan before allowing usage
   - Control approved package list

3. **Implement Security Policies**
   ```yaml
   # OPA policy for dependencies
   package dependencies
   
   deny[msg] {
     input.vulnerability.severity == "CRITICAL"
     msg := sprintf("Critical vulnerability in %v", [input.package])
   }
   ```

4. **Container Scanning**
   ```bash
   # Scan container layers
   trivy image myapp:latest
   
   # Fail on high severity
   docker scan --severity high myapp:latest
   ```

### Anti-Patterns to Avoid

- **Floating versions** (`"express": "*"`)
- **Git dependencies** without commit hashes
- **System-wide package installation**
- **Ignoring transitive dependencies**
- **Skipping vulnerability scans**

### Modern Tools and Services

- **Scanning**: Snyk, OWASP Dependency Check, GitHub Dependabot
- **SBOM Generation**: Syft, SPDX, CycloneDX
- **Container Scanning**: Trivy, Clair, Twistlock
- **Policy Enforcement**: Open Policy Agent, Falco

### Key Takeaways

1. Dependencies are a critical attack vector
2. Explicit declaration enables reproducible builds
3. Container isolation provides strong boundaries
4. Continuous scanning is non-negotiable
5. SBOMs provide transparency and compliance

---

### Sources

- `https://12factor.net/dependencies`
- `https://owasp.org/www-project-dependency-check/`
- `https://security.googleblog.com/2021/06/introducing-slsa-end-to-end-framework.html`
- `https://www.nist.gov/itl/executive-order-14028-improving-nations-cybersecurity`
- `https://cyclonedx.org/`