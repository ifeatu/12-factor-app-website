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

### Sources

- `https://12factor.net/dev-prod-parity`
- `https://docs.docker.com/develop/dev-best-practices/`
- `https://www.terraform.io/docs/language/modules/develop/composition.html`

---

## Factor 11: Logs

### Treat logs as event streams

### Original Principle

Logs provide visibility into the behavior of a running app. A twelve-factor app never concerns itself with routing or storage of its output stream. Instead, each running process writes its event stream, unbuffered, to stdout. The event stream can be routed to a file, watched via realtime tail, or sent to a log indexing and analysis system.

### Modern Evolution

Structured logging with JSON format and centralized aggregation through tools like Fluentd, OpenTelemetry, and cloud-native logging platforms. Modern observability requires correlation between logs, metrics, and traces for comprehensive system understanding.

#### Structured Logging Example

```javascript
// Modern structured logging
const winston = require('winston');

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// Application code
app.get('/api/users/:id', async (req, res) => {
  const correlationId = req.headers['x-correlation-id'] || generateId();
  
  logger.info('User request started', {
    correlationId,
    userId: req.params.id,
    userAgent: req.headers['user-agent']
  });
  
  try {
    const user = await getUserById(req.params.id);
    logger.info('User request completed', {
      correlationId,
      userId: req.params.id,
      responseTime: Date.now() - req.startTime
    });
    res.json(user);
  } catch (error) {
    logger.error('User request failed', {
      correlationId,
      userId: req.params.id,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

#### Kubernetes Logging Configuration

```yaml
# Fluentd DaemonSet for log collection
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluentd
  namespace: kube-system
spec:
  selector:
    matchLabels:
      name: fluentd
  template:
    metadata:
      labels:
        name: fluentd
    spec:
      containers:
      - name: fluentd
        image: fluent/fluentd-kubernetes-daemonset:v1-debian-elasticsearch
        env:
        - name: FLUENT_ELASTICSEARCH_HOST
          value: "elasticsearch.logging.svc.cluster.local"
        - name: FLUENT_ELASTICSEARCH_PORT
          value: "9200"
        volumeMounts:
        - name: varlog
          mountPath: /var/log
        - name: varlibdockercontainers
          mountPath: /var/lib/docker/containers
          readOnly: true
      volumes:
      - name: varlog
        hostPath:
          path: /var/log
      - name: varlibdockercontainers
        hostPath:
          path: /var/lib/docker/containers
```

### Best Practices

1. **Structured logging** with JSON format
2. **Correlation IDs** for request tracing
3. **Log levels** appropriate to environment
4. **No sensitive data** in logs
5. **Centralized aggregation** for analysis

### Key Takeaways

- Logs are event streams, not files
- Structure enables parsing and analysis
- Observability requires logs, metrics, and traces
- Centralization enables correlation
- Security and compliance constrain content

---

### Sources

- `https://12factor.net/logs`
- `https://opentelemetry.io/docs/specs/otel/logs/`
- `https://www.fluentd.org/architecture`

---

## Factor 12: Admin Processes

### Run admin/management tasks as one-off processes

### Original Principle

One-off admin processes should be run in an identical environment as the regular long-running processes of the app. They run against a release, using the same codebase and config as any process run against that release. Admin code must ship with application code to avoid synchronization issues.

### Modern Evolution

Kubernetes Jobs and CronJobs have standardized how we run administrative tasks. Database migrations, batch processing, and maintenance tasks now run as containerized jobs with the same security, monitoring, and configuration as application workloads.

#### Kubernetes Jobs

```yaml
# Database migration job
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migrate-v1.2.3
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: migrate
        image: myapp:1.2.3
        command: ["npm", "run", "db:migrate"]
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
---
# Scheduled maintenance
apiVersion: batch/v1
kind: CronJob
metadata:
  name: cleanup-old-data
spec:
  schedule: "0 2 * * *"  # 2 AM daily
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: cleanup
            image: myapp:1.2.3
            command: ["npm", "run", "cleanup:old-data"]
```

#### Safe Admin Process Patterns

```python
# CLI tool for admin tasks
import click
import sys
from app import create_app, db

@click.group()
def cli():
    """Admin CLI for MyApp"""
    pass

@cli.command()
@click.option('--dry-run', is_flag=True, help='Show what would be done')
def migrate_data(dry_run):
    """Migrate data to new schema"""
    app = create_app()
    with app.app_context():
        if dry_run:
            click.echo("DRY RUN: Would migrate the following:")
            # Show what would be done
        else:
            click.confirm('This will migrate production data. Continue?', abort=True)
            # Perform migration
            click.echo("Migration complete")

if __name__ == '__main__':
    cli()
```

### Best Practices

1. **Same environment** as production workloads
2. **Automated execution** via Jobs/CronJobs
3. **Audit logging** for compliance
4. **Dry-run capability** for safety
5. **No SSH access** to production

### Key Takeaways

- Admin processes are first-class workloads
- Kubernetes Jobs provide consistent execution
- Same code, config, and environment as apps
- Automation prevents human error
- Direct production access is an anti-pattern

---

### Sources

- `https://12factor.net/admin-processes`
- `https://kubernetes.io/docs/concepts/workloads/controllers/job/`
- `https://www.brunton-spall.co.uk/post/2014/05/06/database-migrations-done-right/`