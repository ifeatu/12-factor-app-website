---
layout: factor
title: "Factor 12: Admin Processes"
factor_number: 12
factor_name: "Admin Processes"
description: "Run admin/management tasks as one-off processes"
prev_factor:
  number: 11
  name: "Logs"
  url: "factor-11-logs"
next_factor:
  number: 13
  name: "API First"
  url: "factor-13-api-first"
---

# Factor 12: Admin Processes

## Run admin/management tasks as one-off processes

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