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

#### Graceful Shutdown Implementation

```python
import signal
import sys
import time
from contextlib import contextmanager

class GracefulShutdown:
    def __init__(self):
        self.shutdown = False
        signal.signal(signal.SIGTERM, self._handle_signal)
        signal.signal(signal.SIGINT, self._handle_signal)
    
    def _handle_signal(self, signum, frame):
        print(f"Received signal {signum}, starting graceful shutdown...")
        self.shutdown = True
    
    @contextmanager
    def lifecycle(self):
        yield
        # Cleanup code here
        print("Cleanup complete")

app = GracefulShutdown()

with app.lifecycle():
    while not app.shutdown:
        # Process work
        process_message()
        time.sleep(0.1)
```

### Best Practices

1. **Fast Startup**
    
    - Lazy loading of non-critical components
    - Pre-warmed container images
    - Readiness probes before receiving traffic
2. **Graceful Shutdown**
    
    - Stop accepting new work
    - Complete in-flight requests
    - Close connections cleanly
    - Deregister from service discovery
3. **Timeout Management**
    
    - SIGTERM grace period alignment
    - Connection draining timeouts
    - Background job completion windows

### Key Takeaways

- Design for sudden termination
- Test disposability with chaos engineering
- Fast startup enables rapid scaling
- Graceful shutdown prevents data loss
- Health checks ensure traffic safety

---

### Sources

- `https://12factor.net/disposability`
- `https://netflixtechblog.com/the-netflix-simian-army-16e57fbab116`
- `https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/`