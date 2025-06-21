---
layout: default
title: "Factor 3: Config"
---

# Factor 3: Config

## Store config in the environment

### Original Principle

The twelve-factor app stores config in environment variables. Config varies substantially across deploys, code does not. This includes database handles, credentials to external services, and per-deploy values such as the canonical hostname.

### Modern Evolution

While environment variables served simple applications well, modern distributed systems require more sophisticated configuration management. The principle of separating configuration from code remains vital, but implementation has evolved significantly.

#### Limitations of Environment Variables

- **No type safety** - Everything is a string
- **No validation** - Errors only discovered at runtime
- **No structure** - Difficult to manage complex configurations
- **No versioning** - No audit trail of changes
- **Security risks** - Visible in process listings
- **Scale challenges** - Managing hundreds of variables across services

#### Modern Configuration Services

**Kubernetes ConfigMaps and Secrets:**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  database_url: "postgres://db.example.com:5432/myapp"
  feature_flags: |
    {
      "new_ui": true,
      "beta_features": false
    }
---
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
data:
  api_key: bXlfc2VjcmV0X2tleQ==  # base64 encoded
```

**HashiCorp Vault Integration:**
```python
import hvac

# Dynamic secret retrieval
client = hvac.Client(url='https://vault.example.com')
client.token = os.environ['VAULT_TOKEN']

# Get database credentials that rotate automatically
db_creds = client.read('database/creds/myapp')
db_url = f"postgres://{db_creds['username']}:{db_creds['password']}@db.example.com/myapp"
```

#### Configuration as Code

Modern approaches treat configuration as code with:

**Helm Values:**
```yaml
# values.yaml
replicaCount: 3
image:
  repository: myapp
  tag: 1.2.3
  
database:
  host: db.example.com
  port: 5432
  name: myapp
  
features:
  newUI: true
  betaFeatures: false
```

**Kustomize Overlays:**
```yaml
# base/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  template:
    spec:
      containers:
      - name: app
        env:
        - name: DB_HOST
          valueFrom:
            configMapKeyRef:
              name: db-config
              key: host
```

### Implementation Guidelines

1. **Use Configuration Services**
   - Development: Local config files
   - Staging: ConfigMaps/Secrets
   - Production: Vault/AWS Parameter Store

2. **Implement Validation**
   ```python
   from pydantic import BaseSettings, validator
   
   class Settings(BaseSettings):
       database_url: str
       redis_url: str
       api_key: str
       max_workers: int = 10
       
       @validator('database_url')
       def validate_db_url(cls, v):
           if not v.startswith('postgres://'):
               raise ValueError('Invalid database URL')
           return v
   
   settings = Settings()  # Loads from environment
   ```

3. **Secret Rotation**
   ```yaml
   # Kubernetes Secret rotation with Sealed Secrets
   apiVersion: bitnami.com/v1alpha1
   kind: SealedSecret
   metadata:
     name: myapp-secrets
   spec:
     encryptedData:
       api_key: AgA3B4C5D6E7F8G9H0...
   ```

4. **Feature Flags**
   ```javascript
   // Using LaunchDarkly or similar
   const ld = require('launchdarkly-node-server-sdk');
   
   const client = ld.init(process.env.LD_SDK_KEY);
   
   async function checkFeature(user, flag) {
     return await client.variation(flag, user, false);
   }
   ```