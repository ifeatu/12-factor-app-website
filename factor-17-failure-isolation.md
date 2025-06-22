---
layout: factor
title: "Factor 17: Failure Isolation"
factor_number: 17
factor_name: "Failure Isolation"
description: "Contain failures and maintain system resilience"
prev_factor:
  number: 16
  name: "Auth"
  url: "factor-16-auth"
next_factor: null
---

# Factor 17: Failure Isolation

## Design for partial failure with circuit breakers and bulkheads

### Modern Principle

Distributed systems experience partial failures constantly. Applications must isolate failures to prevent cascade effects that bring down entire systems. This factor mandates patterns like circuit breakers, bulkheads, timeouts, and graceful degradation as first-class architectural concerns.

#### Circuit Breaker Pattern

```python
# Python implementation with py-breaker
from pybreaker import CircuitBreaker
import requests
from functools import wraps
import time

class ServiceCircuitBreaker:
    def __init__(self, failure_threshold=5, recovery_timeout=60, expected_exception=Exception):
        self.breaker = CircuitBreaker(
            fail_max=failure_threshold,
            reset_timeout=recovery_timeout,
            exclude=[expected_exception]
        )
        self.fallback_data = {}
    
    def with_fallback(self, fallback_func):
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                try:
                    # Wrap the original function with circuit breaker
                    protected_func = self.breaker(func)
                    return protected_func(*args, **kwargs)
                except Exception as e:
                    # Circuit is open or function failed
                    logger.warning(f"Circuit breaker triggered: {e}")
                    return fallback_func(*args, **kwargs)
            return wrapper
        return decorator

# Usage example
user_service_breaker = ServiceCircuitBreaker(
    failure_threshold=5,
    recovery_timeout=30
)

@user_service_breaker.with_fallback(lambda user_id: {"id": user_id, "name": "Unknown", "cached": True})
def get_user_profile(user_id):
    response = requests.get(
        f"http://user-service/users/{user_id}",
        timeout=5
    )
    response.raise_for_status()
    return response.json()

# Hystrix-style command pattern
class GetUserCommand:
    def __init__(self, user_id):
        self.user_id = user_id
        self.timeout = 5
        self.fallback_response = {
            "id": user_id,
            "name": "Guest User",
            "source": "fallback"
        }
    
    @CircuitBreaker(fail_max=5, reset_timeout=60)
    def execute(self):
        start_time = time.time()
        
        try:
            response = requests.get(
                f"http://user-service/users/{self.user_id}",
                timeout=self.timeout
            )
            
            # Track metrics
            latency = time.time() - start_time
            metrics.histogram('user_service.latency', latency)
            
            if response.status_code == 200:
                return response.json()
            else:
                raise Exception(f"User service returned {response.status_code}")
                
        except requests.Timeout:
            metrics.counter('user_service.timeout', 1)
            raise
        except Exception as e:
            metrics.counter('user_service.error', 1)
            raise
    
    def fallback(self):
        metrics.counter('user_service.fallback', 1)
        return self.fallback_response
```

#### Bulkhead Pattern

```go
// Go implementation with semaphores
package main

import (
    "context"
    "fmt"
    "sync"
    "time"
)

type Bulkhead struct {
    semaphore chan struct{}
    name      string
}

func NewBulkhead(name string, size int) *Bulkhead {
    return &Bulkhead{
        semaphore: make(chan struct{}, size),
        name:      name,
    }
}

func (b *Bulkhead) Execute(ctx context.Context, fn func() error) error {
    select {
    case b.semaphore <- struct{}{}:
        // Acquired semaphore
        defer func() { <-b.semaphore }()
        
        // Execute with timeout
        done := make(chan error, 1)
        go func() {
            done <- fn()
        }()
        
        select {
        case err := <-done:
            return err
        case <-ctx.Done():
            return fmt.Errorf("bulkhead %s: context cancelled", b.name)
        }
        
    case <-ctx.Done():
        return fmt.Errorf("bulkhead %s: timeout acquiring semaphore", b.name)
    }
}

// Resource pools for different workload types
var (
    dbBulkhead    = NewBulkhead("database", 10)
    apiBulkhead   = NewBulkhead("external-api", 5)
    cacheBulkhead = NewBulkhead("cache", 20)
)

func HandleRequest(ctx context.Context, userID string) (*User, error) {
    // Isolate database calls
    var user *User
    err := dbBulkhead.Execute(ctx, func() error {
        var err error
        user, err = fetchUserFromDB(userID)
        return err
    })
    
    if err != nil {
        return nil, fmt.Errorf("database error: %w", err)
    }
    
    // Isolate external API calls with separate pool
    var enrichment *UserEnrichment
    err = apiBulkhead.Execute(ctx, func() error {
        var err error
        enrichment, err = fetchEnrichmentData(userID)
        return err
    })
    
    // Graceful degradation - continue without enrichment
    if err != nil {
        log.Printf("Failed to fetch enrichment: %v", err)
        enrichment = &UserEnrichment{} // Empty enrichment
    }
    
    user.Enrichment = enrichment
     return user, nil
 }
 ```

#### Retry with Backoff

```javascript
// Node.js implementation
class RetryWithBackoff {
    constructor(options = {}) {
        this.maxRetries = options.maxRetries || 3;
        this.initialDelay = options.initialDelay || 100;
        this.maxDelay = options.maxDelay || 10000;
        this.factor = options.factor || 2;
        this.jitter = options.jitter || true;
    }
    
    async execute(fn, context = {}) {
        let lastError;
        
        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            try {
                const result = await fn();
                
                // Success - record metrics
                if (attempt > 0) {
                    console.log(`Success after ${attempt} retries`);
                }
                
                return result;
            } catch (error) {
                lastError = error;
                
                // Check if error is retryable
                if (!this.isRetryable(error) || attempt === this.maxRetries) {
                    throw error;
                }
                
                // Calculate delay with exponential backoff
                const delay = this.calculateDelay(attempt);
                console.log(`Retry ${attempt + 1}/${this.maxRetries} after ${delay}ms`);
                
                await this.sleep(delay);
            }
        }
        
        throw lastError;
    }
    
    isRetryable(error) {
        // Don't retry client errors
        if (error.response && error.response.status >= 400 && error.response.status < 500) {
            return false;
        }
        
        // Retry network and server errors
        return true;
    }
    
    calculateDelay(attempt) {
        let delay = Math.min(
            this.initialDelay * Math.pow(this.factor, attempt),
            this.maxDelay
        );
        
        // Add jitter to prevent thundering herd
        if (this.jitter) {
            delay = delay * (0.5 + Math.random() * 0.5);
        }
        
        return Math.floor(delay);
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Usage with timeout
const retry = new RetryWithBackoff({
    maxRetries: 3,
    initialDelay: 100,
    factor: 2
});

async function callExternalService(data) {
    return retry.execute(async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        
        try {
            const response = await fetch('https://api.example.com/endpoint', {
                method: 'POST',
                body: JSON.stringify(data),
                signal: controller.signal
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            return response.json();
        } finally {
            clearTimeout(timeout);
        }
    });
}
```

### Implementation Guidelines

1. **Timeout Budgets**
    
    ```python
    TOTAL_TIMEOUT = 30  # seconds
    
    timeout_budget = {
        'auth': TOTAL_TIMEOUT * 0.1,      # 3s
        'database': TOTAL_TIMEOUT * 0.3,   # 9s
        'external_api': TOTAL_TIMEOUT * 0.4, # 12s
        'cache': TOTAL_TIMEOUT * 0.1,      # 3s
        'buffer': TOTAL_TIMEOUT * 0.1      # 3s
    }
    ```
    
2. **Health Check Aggregation**
    
    ```python
    @app.route('/health/ready')
    def readiness_check():
        checks = {
            'database': check_with_timeout(check_database, 2),
            'cache': check_with_timeout(check_redis, 1),
            'external_api': check_with_timeout(check_api, 3)
        }
        
        # Partial failure is okay for non-critical services
        critical_services = ['database']
        critical_healthy = all(
            checks[service] for service in critical_services
        )
        
        status = 'ready' if critical_healthy else 'not ready'
        status_code = 200 if critical_healthy else 503
        
        return jsonify({
            'status': status,
            'checks': checks,
            'timestamp': datetime.utcnow().isoformat()
        }), status_code
    ```
    

### Best Practices

1. **Fail fast** - Don't wait for timeouts
2. **Graceful degradation** - Partial service better than none
3. **Bulkhead critical resources** - Isolate failure domains
4. **Monitor circuit breaker state** - Alert on open circuits
5. **Test failure scenarios** - Chaos engineering

### Key Takeaways

1. Failures are inevitable in distributed systems
2. Circuit breakers prevent cascade failures
3. Bulkheads isolate resource exhaustion
4. Timeouts prevent indefinite waiting
5. Graceful degradation maintains user experience

---

### Sources

- `https://pragprog.com/titles/mnee2/release-it-second-edition/`
- `https://github.com/Netflix/Hystrix/wiki`
- `https://martinfowler.com/bliki/CircuitBreaker.html`
- `https://docs.microsoft.com/en-us/azure/architecture/patterns/bulkhead`