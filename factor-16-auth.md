---
layout: factor
title: "Factor 16: Auth"
factor_number: 16
factor_name: "Auth"
description: "Authentication and authorization as a service"
prev_factor:
  number: 15
  name: "GraphQL & gRPC"
  url: "factor-15-graphql-grpc"
next_factor:
  number: 17
  name: "Failure Isolation"
  url: "factor-17-failure-isolation"
---

# Factor 16: Auth

## Secure identity and access management

### Modern Principle

Security is not optional in modern applications. Proper authentication (who you are) and authorization (what you can do) must be built into the application architecture from day one, not bolted on later.

#### Key Components

- **Identity Providers**: Centralized authentication services
- **Token-based Authentication**: JWT, OAuth 2.0, OpenID Connect
- **Role-based Access Control (RBAC)**: Permissions based on roles
- **Attribute-based Access Control (ABAC)**: Fine-grained permissions
- **Zero Trust Architecture**: Never trust, always verify

### Implementation Guidelines

1. **Use established protocols** like OAuth 2.0 and OpenID Connect
2. **Implement JWT tokens** with proper expiration and refresh
3. **Centralize authentication** using identity providers
4. **Apply principle of least privilege** for all access controls
5. **Audit all access attempts** for security monitoring
6. **Use HTTPS everywhere** for all communications
7. **Implement proper session management** with secure cookies

### Modern Tools

- **Identity Providers**: Auth0, Okta, AWS Cognito, Azure AD
- **API Security**: Kong, Ambassador, Istio Service Mesh
- **Secret Management**: HashiCorp Vault, AWS Secrets Manager
- **Certificate Management**: Let's Encrypt, cert-manager

### Security Best Practices

- **Multi-factor Authentication (MFA)** for sensitive operations
- **Rate limiting** to prevent abuse
- **Input validation** and sanitization
- **Security headers** (HSTS, CSP, etc.)
- **Regular security audits** and penetration testing

### Code Examples

#### JWT with Scopes (Python/FastAPI)

```python
from fastapi import FastAPI, Depends, HTTPException, Security
from fastapi.security import OAuth2PasswordBearer, SecurityScopes
from jose import JWTError, jwt
import httpx
from pydantic import BaseModel, ValidationError

app = FastAPI()

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="token",
    scopes={
        "users:read": "Read user information",
        "users:write": "Modify user information",
        "admin": "Administrative access"
    }
)

# JWKS endpoint for token validation
JWKS_URL = "https://auth.example.com/.well-known/jwks.json"
ALGORITHM = "RS256"

async def get_current_user(
    security_scopes: SecurityScopes,
    token: str = Depends(oauth2_scheme)
):
    if security_scopes.scopes:
        authenticate_value = f'Bearer scope="{security_scopes.scope_str}"'
    else:
        authenticate_value = "Bearer"
    
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": authenticate_value},
    )
    
    try:
        # Validate token with JWKS
        async with httpx.AsyncClient() as client:
            jwks = await client.get(JWKS_URL)
            key = get_signing_key(token, jwks.json())
        
        payload = jwt.decode(token, key, algorithms=[ALGORITHM])
        token_scopes = payload.get("scope", "").split()
        
        # Validate required scopes
        for scope in security_scopes.scopes:
            if scope not in token_scopes:
                raise HTTPException(
                    status_code=403,
                    detail="Not enough permissions",
                    headers={"WWW-Authenticate": authenticate_value},
                )
        
        return User(**payload)
    except (JWTError, ValidationError):
        raise credentials_exception

@app.get("/api/users/{user_id}")
async def read_user(
    user_id: str,
    current_user: User = Security(get_current_user, scopes=["users:read"])
):
    # Check if user can access this resource
    if user_id != current_user.id and "admin" not in current_user.scopes:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return get_user(user_id)
```

#### Policy-Based Authorization

```yaml
# Open Policy Agent (OPA) policy
package authz

default allow = false

# Allow users to read their own data
allow {
    input.method == "GET"
    input.path == ["api", "users", user_id]
    input.user.id == user_id
}

# Allow admins full access
allow {
    input.user.roles[_] == "admin"
}

# Allow service-to-service communication
allow {
    input.source.service_account != ""
    input.source.namespace == input.destination.namespace
    allowed_service_communication[input.source.service_account][input.destination.service_account]
}

allowed_service_communication = {
    "frontend": {"api", "auth"},
    "api": {"database", "cache"},
    "worker": {"database", "queue"}
}
```

#### mTLS for Service-to-Service

```go
// Go service with mTLS
import (
    "crypto/tls"
    "crypto/x509"
    "net/http"
)

func createTLSConfig() (*tls.Config, error) {
    // Load client certificates
    cert, err := tls.LoadX509KeyPair("client.crt", "client.key")
    if err != nil {
        return nil, err
    }
    
    // Load CA cert
    caCert, err := ioutil.ReadFile("ca.crt")
    if err != nil {
        return nil, err
    }
    
    caCertPool := x509.NewCertPool()
    caCertPool.AppendCertsFromPEM(caCert)
    
    return &tls.Config{
        Certificates: []tls.Certificate{cert},
        RootCAs:      caCertPool,
        ClientAuth:   tls.RequireAndVerifyClientCert,
        ClientCAs:    caCertPool,
    }, nil
}

func main() {
    tlsConfig, err := createTLSConfig()
    if err != nil {
        log.Fatal(err)
    }
    
    server := &http.Server{
        Addr:      ":8443",
        TLSConfig: tlsConfig,
        Handler:   http.HandlerFunc(handler),
    }
    
    log.Fatal(server.ListenAndServeTLS("", ""))
}
```

### Implementation Guidelines

1. **API Gateway Pattern**
    
    ```yaml
    # Kong API Gateway with OIDC
    plugins:
    - name: oidc
      config:
        issuer: https://auth.example.com/
        client_id: api-gateway
        client_secret: ${OIDC_CLIENT_SECRET}
        redirect_uri: https://api.example.com/callback
        scope: openid profile email
        session_secret: ${SESSION_SECRET}
    ```
    
2. **Token Lifecycle**
    
    ```python
    # Token refresh mechanism
    async def refresh_access_token(refresh_token: str):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://auth.example.com/token",
                data={
                    "grant_type": "refresh_token",
                    "refresh_token": refresh_token,
                    "client_id": CLIENT_ID,
                    "client_secret": CLIENT_SECRET
                }
            )
        
        if response.status_code == 200:
            return response.json()
        
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    ```
    

### Best Practices

1. **Never roll your own crypto** - Use established libraries
2. **Principle of least privilege** - Minimal required permissions
3. **Defense in depth** - Multiple security layers
4. **Regular rotation** - Keys, certificates, and secrets
5. **Audit everything** - Log all auth decisions

### Key Takeaways

1. Security cannot be an afterthought
2. Zero-trust means authenticate everything
3. Use standard protocols (OAuth2, OIDC)
4. Service mesh provides mTLS transparently
5. Policy engines enable complex authorization

---

### Sources

- `https://www.nist.gov/publications/zero-trust-architecture`
- `https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics`
- `https://istio.io/latest/docs/concepts/security/`
- `https://www.openpolicyagent.org/docs/latest/`

### Anti-patterns

- Rolling your own authentication system
- Storing passwords in plain text or weak hashing
- Using long-lived tokens without refresh mechanisms
- Implementing authorization logic in the frontend only
- Not logging security events for monitoring