# Factor 9: Disposability

## Maximize robustness with fast startup and graceful shutdown

### Original Principle

The twelve-factor app's processes are disposable, meaning they can be started or stopped at a moment's notice. This facilitates fast elastic scaling, rapid deployment of code or config changes, and robustness of production deploys.

### Modern Evolution

Chaos engineering has pushed disposability to extremes. Modern applications must handle not just graceful shutdowns but also sudden terminations, network partitions, and zone failures. Disposability has evolved from a nice-to-have to a core requirement tested continuously in production.

#### Chaos Engineering

```yaml
# Litmus Chaos experiment
apiVersion: litmuschaos.io/v1alpha1
kind: ChaosEngine
metadata:
  name: pod-delete
spec:
  appinfo:
    appns: production
    applabel: 'app=myapp'
  chaosServiceAccount: litmus-admin
  experiments:
  - name: pod-delete
    spec:
      components:
        env:
        - name: TOTAL_CHAOS_DURATION
          value: '60'
        - name: CHAOS_INTERVAL
          value: '10'
        - name: FORCE
          value: 'false'
```