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