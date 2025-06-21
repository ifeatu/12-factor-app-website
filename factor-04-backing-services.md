---
layout: default
title: "Factor 4: Backing Services"
---

# Factor 4: Backing Services

## Treat backing services as attached resources

### Original Principle

A backing service is any service the app consumes over the network as part of its normal operation. The code for a twelve-factor app makes no distinction between local and third party services. To the app, both are attached resources, accessed via a URL or other locator stored in the config.

### Modern Evolution

The principle remains sound, but service mesh technologies and event-driven architectures have revolutionized how we implement service communication. Modern applications deal with dozens or hundreds of backing services, requiring sophisticated discovery, routing, and resilience patterns.

#### Service Mesh Revolution

Service mesh provides infrastructure-level handling of service communication:

```yaml
# Istio VirtualService for intelligent routing
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: reviews
spec:
  hosts:
  - reviews
  http:
  - match:
    - headers:
        end-user:
          exact: jason
    route:
    - destination:
        host: reviews
        subset: v2
  - route:
    - destination:
        host: reviews
        subset: v1
      weight: 90
    - destination:
        host: reviews
        subset: v2
      weight: 10
```

Key service mesh features:
- **Automatic mutual TLS** between services
- **Circuit breaking** and retry logic
- **Load balancing** with various algorithms
- **Distributed tracing** without code changes
- **Traffic management** for canary deployments

#### Event-Driven Communication

Modern architectures increasingly use asynchronous, event-driven patterns:

```python
# Event producer
from confluent_kafka import Producer
import json

producer = Producer({
    'bootstrap.servers': os.environ['KAFKA_BROKERS'],
    'security.protocol': 'SASL_SSL',
    'sasl.mechanism': 'PLAIN',
    'sasl.username': os.environ['KAFKA_USERNAME'],
    'sasl.password': os.environ['KAFKA_PASSWORD']
})

def publish_event(event_type, data):
    event = {
        'type': event_type,
        'timestamp': datetime.utcnow().isoformat(),
        'data': data
    }
    producer.produce(
        topic='domain-events',
        key=str(data.get('id')),
        value=json.dumps(event)
    )
```

### Implementation Guidelines

1. **Service Discovery**
   ```

### Modern Patterns

1. **Sidecar Proxy Pattern**
   ```yaml
   # Envoy sidecar configuration
   apiVersion: v1
   kind: Pod
   spec:
     containers:
     - name: app
       image: myapp:latest
     - name: envoy
       image: envoyproxy/envoy:latest
       volumeMounts:
       - name: envoy-config
         mountPath: /etc/envoy
   ```

2. **Service Virtualization**
   ```javascript
   // Mock external services for testing
   const nock = require('nock');
   
   // Virtualize payment service
   nock('https://payment.example.com')
     .post('/charge')
     .reply(200, {
       transaction_id: 'mock-12345',
       status: 'success'
     });
   ```

3. **Distributed Tracing**
   ```python
   from opentelemetry import trace
   from opentelemetry.exporter.jaeger import JaegerExporter
   
   tracer = trace.get_tracer(__name__)
   
   def call_backing_service(service_name, operation):
       with tracer.start_as_current_span(f"{service_name}.{operation}"):
           # Service call logic here
           pass
   ```

### Best Practices

1. **Health Checks**
   ```python
   # Standardized health check endpoint
   @app.route('/health')
   def health_check():
       checks = {
           'database': check_database(),
           'redis': check_redis(),
           'kafka': check_kafka()
       }
       
       status = 'healthy' if all(checks.values()) else 'unhealthy'
       return jsonify({
           'status': status,
           'checks': checks,
           'timestamp': datetime.utcnow().isoformat()
       }), 200 if status == 'healthy' else 503
   ```

2. **Timeout Management**
   ```python
   # Hierarchical timeout budget
   TOTAL_TIMEOUT = 30  # seconds
   
   timeouts = {
       'database': TOTAL_TIMEOUT * 0.5,  # 50% of budget
       'cache': TOTAL_TIMEOUT * 0.1,     # 10% of budget
       'external_api': TOTAL_TIMEOUT * 0.4  # 40% of budget
   }
   ```

3. **Graceful Degradation**
   ```python
   async def get_user_with_recommendations(user_id):
       user = await user_service.get_user(user_id)
       
       # Non-critical service - degrade gracefully
       try:
           recommendations = await recommendation_service.get_recommendations(user_id)
       except ServiceUnavailable:
           recommendations = []  # Empty recommendations better than error
       
       return {
           'user': user,
           'recommendations': recommendations
       }
   ```

### Anti-Patterns to Avoid

- **Hardcoded service locations**
- **Missing timeouts** on service calls
- **Synchronous calls** for non-critical data
- **Tight coupling** to service implementations
- **Missing circuit breakers** for external services

### Modern Tools and Services

- **Service Mesh**: Istio, Linkerd, Consul Connect
- **API Gateways**: Kong, Zuul, AWS API Gateway
- **Event Streaming**: Apache Kafka, AWS Kinesis, Google Pub/Sub
- **Service Discovery**: Consul, Eureka, Kubernetes DNS
- **Contract Testing**: Pact, Spring Cloud Contract

### Key Takeaways

1. Service mesh handles cross-cutting concerns at infrastructure level
2. Event-driven patterns reduce coupling between services
3. Circuit breakers prevent cascade failures
4. Service contracts ensure compatibility
5. Health checks and timeouts are non-negotiable
6. Design for graceful degradation

---

### Sources

- `https://12factor.net/backing-services`
- `https://istio.io/latest/docs/concepts/what-is-istio/`
- `https://martinfowler.com/articles/microservices.html`
- `https://netflixtechblog.com/making-the-netflix-api-more-resilient-a8ec62159c2d`
- `https://landscape.cncf.io/card-mode?category=service-mesh`yaml
   # Kubernetes Service for discovery
   apiVersion: v1
   kind: Service
   metadata:
     name: user-service
   spec:
     selector:
       app: user-service
     ports:
     - port: 80
       targetPort: 8080
   ```

2. **Connection Abstraction**
   ```python
   # Abstract backing service connections
   class BackingService:
       def __init__(self, service_url: str):
           self.url = service_url
           self._connection = None
       
       @property
       def connection(self):
           if not self._connection:
               self._connection = self._create_connection()
           return self._connection
       
       def _create_connection(self):
           raise NotImplementedError
   
   class PostgresService(BackingService):
       def _create_connection(self):
           return psycopg2.connect(self.url)
   
   class RedisService(BackingService):
       def _create_connection(self):
           return redis.from_url(self.url)
   ```

3. **Circuit Breaker Pattern**
   ```python
   from py_breaker import CircuitBreaker
   
   # Configure circuit breaker
   db_breaker = CircuitBreaker(
       fail_max=5,
       reset_timeout=60,
       exclude=[KeyError]  # Don't trip on app errors
   )
   
   @db_breaker
   def query_user_service(user_id):
       response = requests.get(
           f"{USER_SERVICE_URL}/users/{user_id}",
           timeout=5
       )
       response.raise_for_status()
       return response.json()
   ```

4. **Service Contracts**
   ```yaml
   # OpenAPI specification for service contract
   openapi: 3.0.0
   info:
     title: User Service
     version: 1.0.0
   paths:
     /users/{userId}:
       get:
         parameters:
         - name: userId
           in: path
           required: true
           schema:
             type: string
         responses:
           200:
             description: User found
             content:
               application/json:
                 schema:
                   $ref: '#/components/schemas/User'
   ```