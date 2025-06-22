---
layout: factor
title: "Factor 15: Authentication & Authorization"
factor_number: 15
factor_name: "Authentication & Authorization"
description: "Secure identity and access management"
prev_factor:
  number: 14
  name: "GraphQL & gRPC"
  url: "/factor-14-graphql-grpc"
next_factor:
  number: 16
  name: "Event-Driven Architecture"
  url: "/factor-16-event-driven"
---

# Factor 15: Authentication & Authorization

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

### Anti-patterns

- Rolling your own authentication system
- Storing passwords in plain text or weak hashing
- Using long-lived tokens without refresh mechanisms
- Implementing authorization logic in the frontend only
- Not logging security events for monitoring