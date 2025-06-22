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
   ```yaml
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