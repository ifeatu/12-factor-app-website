---
layout: factor
title: "Factor 10: Dev/Prod Parity"
factor_number: 10
factor_name: "Dev/Prod Parity"
description: "Keep development, staging, and production as similar as possible"
prev_factor:
  number: 9
  name: "Disposability"
  url: "/factor-09-disposability"
next_factor:
  number: 11
  name: "Logs"
  url: "/factor-11-logs"
---

# Factor 10: Dev/Prod Parity

## Keep development, staging, and production as similar as possible

### Original Principle

The twelve-factor app is designed for continuous deployment by keeping the gap between development and production small. This includes the time gap (developer writes code and deploys hours or even minutes later), the personnel gap (developers who wrote code are closely involved in deploying it), and the tools gap (keep development and production as similar as possible).

### Modern Evolution

Containers have largely solved the tools gap, providing identical runtime environments across all stages. Infrastructure as Code ensures environment configuration parity. However, challenges remain with data volumes, external services, and network topologies.

#### Container-Based Parity

```dockerfile
# Single Dockerfile for all environments
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --production

FROM base AS dev
RUN npm ci
COPY . .
CMD ["npm", "run", "dev"]

FROM base AS production
COPY . .
USER node
CMD ["node", "server.js"]
```

#### Infrastructure as Code

```yaml
# Terraform for environment parity
module "environment" {
  source = "./modules/app-environment"
  
  environment = var.environment
  instance_type = var.environment == "production" ? "t3.large" : "t3.small"
  replica_count = var.environment == "production" ? 3 : 1
  
  # Same configuration structure
  database_engine = "postgres"
  database_version = "14.7"
  cache_engine = "redis"
  cache_version = "7.0"
}
```

### Best Practices

1. **Use the same backing services** (PostgreSQL in dev and prod, not SQLite in dev)
2. **Containerize everything** for consistent runtime
3. **Version lock all dependencies** including base images
4. **Synthetic data generation** for realistic testing
5. **Service virtualization** for unavailable dependencies

### Key Takeaways

- Containers provide runtime parity
- IaC ensures configuration consistency
- Data and scale remain challenging
- Continuous deployment requires minimal gaps
- Developer ownership improves quality

---

### Sources

- `https://12factor.net/dev-prod-parity`
- `https://docs.docker.com/develop/dev-best-practices/`
- `https://www.hashicorp.com/resources/what-is-infrastructure-as-code`