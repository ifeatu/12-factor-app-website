# Factor 6: Processes

## Execute the app as one or more stateless processes

### Original Principle

Twelve-factor processes are stateless and share-nothing. Any data that needs to persist must be stored in a stateful backing service, typically a database. The memory space or filesystem of the process can be used as a brief, single-transaction cache.

### Modern Evolution

While statelessness remains a cornerstone of scalable applications, modern architectures have introduced sophisticated patterns for managing necessary state. The evolution includes distributed caching, event sourcing, and coordinated state management that maintain the spirit of statelessness while addressing real-world requirements.

#### The Reality of State in Distributed Systems

Modern applications often require:
- **Session affinity** for WebSocket connections
- **Local caches** for performance optimization
- **In-memory computation** for stream processing
- **Distributed consensus** for coordination

The key is **externalizing state** while maintaining process independence:

```python
# Bad: Storing state in process memory
class BadUserService:
    def __init__(self):
        self.user_cache = {}  # Will be lost on restart!
    
    def get_user(self, user_id):
        if user_id not in self.user_cache:
            self.user_cache[user_id] = db.fetch_user(user_id)
        return self.user_cache[user_id]

# Good: Externalized state with Redis
class GoodUserService:
    def __init__(self):
        self.redis = redis.Redis.from_url(os.environ['REDIS_URL'])
    
    def get_user(self, user_id):
        cached = self.redis.get(f"user:{user_id}")
        if cached:
            return json.loads(cached)
        
        user = db.fetch_user(user_id)
        self.redis.setex(
            f"user:{user_id}",
            300,  # 5-minute TTL
            json.dumps(user)
        )
        return user
```

#### Modern State Management Patterns

1. **Distributed Caching**
   ```

### Implementation Guidelines

1. **Stateless Process Design**
   ```python
   # Stateless worker process
   class Worker:
       def __init__(self):
           # All state in external services
           self.db = create_db_connection()
           self.cache = create_redis_connection()
           self.queue = create_sqs_connection()
       
       def process_message(self, message):
           # No local state persists between messages
           context = self.load_context(message.context_id)
           result = self.perform_work(message, context)
           self.save_result(result)
           
           # Clean up any temporary data
           self.cleanup_temp_files()
   ```

2. **Horizontal Scaling Pattern**
   ```yaml
   # Kubernetes HPA for stateless scaling
   apiVersion: autoscaling/v2
   kind: HorizontalPodAutoscaler
   metadata:
     name: worker-hpa
   spec:
     scaleTargetRef:
       apiVersion: apps/v1
       kind: Deployment
       name: worker
     minReplicas: 2
     maxReplicas: 100
     metrics:
     - type: Resource
       resource:
         name: cpu
         target:
           type: Utilization
           averageUtilization: 70
     - type: Pods
       pods:
         metric:
           name: pending_jobs
         target:
           type: AverageValue
           averageValue: "30"
   ```

3. **Session Management**
   ```javascript
   // Express session with Redis store
   const session = require('express-session');
   const RedisStore = require('connect-redis')(session);
   
   app.use(session({
     store: new RedisStore({
       client: redisClient,
       prefix: 'session:',
       ttl: 86400  // 24 hours
     }),
     secret: process.env.SESSION_SECRET,
     resave: false,
     saveUninitialized: false,
     cookie: {
       secure: true,
       httpOnly: true,
       maxAge: 86400000
     }
   }));
   ```

### Best Practices

1. **Ephemeral File System**
   ```python
   import tempfile
   import os
   
   def process_upload(file_data):
       # Use temp directory that's cleaned automatically
       with tempfile.NamedTemporaryFile(delete=True) as tmp:
           tmp.write(file_data)
           tmp.flush()
           
           # Process file
           result = process_file(tmp.name)
           
           # File automatically deleted when context exits
       
       # Store results in object storage
       s3.upload_fileobj(
           io.BytesIO(result),
           'my-bucket',
           f'results/{uuid.uuid4()}.json'
       )
   ```

2. **Distributed Work Queues**
   ```python
   # Celery for distributed task processing
   from celery import Celery
   
   app = Celery('tasks', broker=os.environ['REDIS_URL'])
   
   @app.task(bind=True, max_retries=3)
   def process_order(self, order_id):
       try:
           # Stateless processing
           order = fetch_order(order_id)
           result = process_payment(order)
           send_confirmation(order, result)
       except Exception as exc:
           # Retry with exponential backoff
           raise self.retry(exc=exc, countdown=2 ** self.request.retries)
   ```

3. **Cache-Aside Pattern**
   ```python
   class CacheAsideService:
       def __init__(self):
           self.cache = Redis()
           self.db = Database()
       
       async def get_data(self, key):
           # Try cache first
           cached = await self.cache.get(key)
           if cached:
               return json.loads(cached)
           
           # Load from database
           data = await self.db.fetch(key)
           
           # Update cache for next time
           await self.cache.setex(
               key,
               300,  # 5 minute TTL
               json.dumps(data)
           )
           
           return data
   ```

### Anti-Patterns to Avoid

- **In-memory state** between requests
- **Local file storage** for persistent data
- **Sticky sessions** without external session store
- **Process-specific** configuration
- **Stateful singletons** in application code

### Modern Tools and Services

- **Distributed Cache**: Redis, Memcached, Hazelcast
- **Session Stores**: Redis, DynamoDB, Memcached
- **Message Queues**: RabbitMQ, AWS SQS, Google Pub/Sub
- **Stream Processing**: Apache Kafka, Apache Pulsar
- **Coordination**: Apache Zookeeper, etcd, Consul

### Key Takeaways

1. Stateless processes enable horizontal scaling
2. Externalize all persistent state to backing services
3. Use distributed caching for performance
4. Session affinity requires external session stores
5. Event sourcing provides audit trails with stateless processing
6. Temporary files should use ephemeral storage

---

### Sources

- `https://12factor.net/processes`
- `https://martinfowler.com/articles/microservices.html#DecentralizedDataManagement`
- `https://redis.io/topics/distlock`
- `https://kubernetes.io/docs/tasks/run-application/run-stateless-application-deployment/`
- `https://docs.microsoft.com/en-us/azure/architecture/patterns/event-sourcing`yaml
   # Redis Cluster for high availability
   apiVersion: apps/v1
   kind: StatefulSet
   metadata:
     name: redis-cluster
   spec:
     serviceName: redis-cluster
     replicas: 6
     template:
       spec:
         containers:
         - name: redis
           image: redis:7-alpine
           command: ["redis-server"]
           args:
           - "--cluster-enabled yes"
           - "--cluster-config-file nodes.conf"
           - "--cluster-node-timeout 5000"
   ```

2. **Event Sourcing**
   ```python
   # State as a series of events
   class EventStore:
       def __init__(self, kafka_producer):
           self.producer = kafka_producer
       
       def append_event(self, aggregate_id, event):
           self.producer.send(
               topic=f"events.{event.aggregate_type}",
               key=aggregate_id,
               value={
                   "id": str(uuid.uuid4()),
                   "aggregate_id": aggregate_id,
                   "type": event.type,
                   "data": event.data,
                   "timestamp": datetime.utcnow().isoformat()
               }
           )
   
   # Rebuild state from events
   def rebuild_aggregate_state(aggregate_id):
       events = kafka_consumer.consume_all(
           topic="events.order",
           key=aggregate_id
       )
       
       state = {}
       for event in events:
           state = apply_event(state, event)
       
       return state
   ```

3. **Coordination with External State**
   ```python
   # Distributed locking with Redis
   import redlock
   
   dlm = redlock.Redlock([
       {"host": "redis1.example.com", "port": 6379},
       {"host": "redis2.example.com", "port": 6379},
       {"host": "redis3.example.com", "port": 6379},
   ])
   
   def process_job(job_id):
       lock = dlm.lock(f"job:{job_id}", 10000)  # 10 second lock
       if lock:
           try:
               # Process job with exclusive access
               result = perform_work(job_id)
               save_result(result)
           finally:
               dlm.unlock(lock)
   ```