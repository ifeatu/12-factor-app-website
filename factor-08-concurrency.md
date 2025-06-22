---
layout: factor
title: "Factor 8: Concurrency"
factor_number: 8
factor_name: "Concurrency"
description: "Scale out via the process model"
prev_factor:
  number: 7
  name: "Port Binding"
  url: "/factor-07-port-binding"
next_factor:
  number: 9
  name: "Disposability"
  url: "/factor-09-disposability"
---

# Factor 8: Concurrency

## Scale out via the process model

### Original Principle

In the twelve-factor app, processes are a first class citizen. The app handles diverse workloads by assigning each type of work to a process type. This does not exclude individual processes from handling their own internal multiplexing, but an individual VM can only grow so large (vertical scale), so the application must also be able to span multiple processes running on multiple physical machines.

### Modern Evolution

Kubernetes has redefined concurrency with the Pod abstraction, Horizontal Pod Autoscaling, and sophisticated scheduling. Functions-as-a-Service takes this further, scaling at the request level. The principle of horizontal scaling remains paramount, but implementation has become far more sophisticated.

#### Kubernetes Native Scaling

```yaml
# HPA with custom metrics
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api
  minReplicas: 3
  maxReplicas: 100
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
      - type: Pods
        value: 4
        periodSeconds: 15
      selectPolicy: Max
```

#### Process Types and Workload Distribution

```yaml
# Different process types for different workloads
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 10
  template:
    spec:
      containers:
      - name: web
        command: ["node", "server.js"]
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: worker
spec:
  replicas: 5
  template:
    spec:
      containers:
      - name: worker
        command: ["node", "worker.js"]
        resources:
          requests:
            cpu: 500m
            memory: 512Mi
---
apiVersion: batch/v1
kind: CronJob
metadata:
  name: scheduler
spec:
  schedule: "*/5 * * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: scheduler
            command: ["node", "scheduler.js"]
```

### Best Practices

1. **Stateless Process Design** enables easy scaling
2. **Resource-based autoscaling** for predictable workloads
3. **Custom metrics** for business-specific scaling
4. **Process isolation** prevents cascade failures
5. **Graceful shutdown** for zero-downtime deployments

### Key Takeaways

- Horizontal scaling beats vertical scaling
- Kubernetes provides sophisticated scaling primitives
- Different workloads need different scaling strategies
- Autoscaling should consider multiple metrics
- Process types map to Kubernetes workload types

---

### Sources

- `https://12factor.net/concurrency`
- `https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/`
- `https://research.google/pubs/pub43438/`