---
layout: factor
title: "Factor 17: Event-Driven"
number: 17
name: "Event-Driven"
description: "Asynchronous communication and event sourcing"
prev_factor:
  number: 16
  name: "Auth"
  url: "factor-16-auth"
next_factor:
  number: 18
  name: "Failure Isolation"
  url: "factor-18-failure-isolation"
---

# Factor 17: Event-Driven

## Asynchronous communication and event sourcing

### Modern Principle

Synchronous request-response patterns create tight coupling and scaling bottlenecks. Modern applications increasingly adopt event-driven architectures for loose coupling, horizontal scalability, and real-time processing. Events become the primary integration mechanism between services.

#### Event Streaming with Kafka

```python
# Event producer
from confluent_kafka import Producer
from dataclasses import asdict
import json
import uuid
from datetime import datetime

class EventProducer:
    def __init__(self, config):
        self.producer = Producer(config)
        self.topic_registry = {
            'OrderCreated': 'orders.events',
            'PaymentProcessed': 'payments.events',
            'InventoryUpdated': 'inventory.events'
        }
    
    def publish_event(self, event):
        headers = {
            'event_id': str(uuid.uuid4()),
            'event_type': event.__class__.__name__,
            'timestamp': datetime.utcnow().isoformat(),
            'source': 'order-service',
            'correlation_id': getattr(event, 'correlation_id', str(uuid.uuid4()))
        }
        
        topic = self.topic_registry.get(
            event.__class__.__name__,
            'domain.events'
        )
        
        self.producer.produce(
            topic=topic,
            key=str(event.aggregate_id),
            value=json.dumps(asdict(event)),
            headers=[(k, v.encode('utf-8')) for k, v in headers.items()],
            callback=self._delivery_report
        )
        
        self.producer.flush()
    
    def _delivery_report(self, err, msg):
        if err:
            logger.error(f'Event delivery failed: {err}')
        else:
            logger.info(f'Event delivered to {msg.topic()} [{msg.partition()}]')

# Event consumer with exactly-once semantics
from confluent_kafka import Consumer, KafkaError
import json

class EventConsumer:
    def __init__(self, config, topics):
        self.consumer = Consumer({
            **config,
            'enable.auto.commit': False,
            'isolation.level': 'read_committed'
        })
        self.consumer.subscribe(topics)
        self.handlers = {}
    
    def register_handler(self, event_type, handler):
        self.handlers[event_type] = handler
    
    def consume(self):
        while True:
            msg = self.consumer.poll(1.0)
            
            if msg is None:
                continue
            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    continue
                else:
                    logger.error(f'Consumer error: {msg.error()}')
                    break
            
            try:
                # Process event
                event_type = dict(msg.headers()).get('event_type', b'').decode('utf-8')
                event_data = json.loads(msg.value().decode('utf-8'))
                
                handler = self.handlers.get(event_type)
                if handler:
                    handler(event_data)
                
                # Commit after successful processing
                self.consumer.commit(msg)
                
            except Exception as e:
                logger.error(f'Error processing event: {e}')
                # Implement retry logic or dead letter queue
```

#### Event Sourcing Pattern

```python
# Event sourced aggregate
from typing import List, Dict, Any
from abc import ABC, abstractmethod

class Event(ABC):
    def __init__(self, aggregate_id: str):
        self.aggregate_id = aggregate_id
        self.timestamp = datetime.utcnow()

class OrderCreated(Event):
    def __init__(self, aggregate_id: str, customer_id: str, items: List[Dict]):
        super().__init__(aggregate_id)
        self.customer_id = customer_id
        self.items = items

class OrderShipped(Event):
    def __init__(self, aggregate_id: str, tracking_number: str):
        super().__init__(aggregate_id)
        self.tracking_number = tracking_number

class Order:
    def __init__(self):
        self.id = None
        self.customer_id = None
        self.items = []
        self.status = 'PENDING'
        self.tracking_number = None
        self.version = 0
        self.uncommitted_events = []
    
    def create(self, order_id: str, customer_id: str, items: List[Dict]):
        if self.id is not None:
            raise ValueError("Order already created")
        
        event = OrderCreated(order_id, customer_id, items)
        self._apply_event(event)
        self.uncommitted_events.append(event)
    
    def ship(self, tracking_number: str):
        if self.status != 'PENDING':
            raise ValueError(f"Cannot ship order in {self.status} status")
        
        event = OrderShipped(self.id, tracking_number)
        self._apply_event(event)
        self.uncommitted_events.append(event)
    
    def _apply_event(self, event: Event):
        if isinstance(event, OrderCreated):
            self.id = event.aggregate_id
            self.customer_id = event.customer_id
            self.items = event.items
            self.status = 'PENDING'
        elif isinstance(event, OrderShipped):
            self.tracking_number = event.tracking_number
            self.status = 'SHIPPED'
        
        self.version += 1
    
    @classmethod
    def from_events(cls, events: List[Event]):
        order = cls()
        for event in events:
            order._apply_event(event)
        return order

# Event store
class EventStore:
    def __init__(self, db_connection):
        self.db = db_connection
    
    def save_events(self, aggregate_id: str, events: List[Event], expected_version: int):
        with self.db.transaction() as tx:
            # Check for concurrent modifications
            current_version = tx.execute(
                "SELECT MAX(version) FROM events WHERE aggregate_id = ?",
                (aggregate_id,)
            ).fetchone()[0] or 0
            
            if current_version != expected_version:
                raise ConcurrencyError(
                    f"Expected version {expected_version}, but was {current_version}"
                )
            
            # Save events
            for event in events:
                tx.execute("""
                    INSERT INTO events (
                        aggregate_id, event_type, event_data,
                        version, timestamp
                    ) VALUES (?, ?, ?, ?, ?)
                """, (
                    aggregate_id,
                    event.__class__.__name__,
                    json.dumps(asdict(event)),
                    current_version + 1,
                    event.timestamp
                ))
                current_version += 1
    
    def get_events(self, aggregate_id: str) -> List[Event]:
        rows = self.db.execute("""
            SELECT event_type, event_data
            FROM events
            WHERE aggregate_id = ?
            ORDER BY version
        """, (aggregate_id,)).fetchall()
        
        events = []
        for event_type, event_data in rows:
            data = json.loads(event_data)
            # Reconstruct event object
            event_class = globals()[event_type]
            events.append(event_class(**data))
        
        return events

    def replay_events(self, aggregate_id: str) -> Order:
        """Replay events to rebuild aggregate state"""
        events = self.get_events(aggregate_id)
        order = Order()
        
        for event in events:
            order._apply_event(event)
        
        return order

#### CQRS Implementation

```python
# Command and Query separation
class CommandHandler:
    def __init__(self, event_store: EventStore, event_bus: EventProducer):
        self.event_store = event_store
        self.event_bus = event_bus
    
    def handle_create_order(self, command: CreateOrderCommand):
        # Load aggregate
        order = Order()
        
        # Execute business logic
        order.create(
            order_id=str(uuid.uuid4()),
            customer_id=command.customer_id,
            items=command.items
        )
        
        # Save events
        self.event_store.save_events(
            order.id,
            order.uncommitted_events,
            0
        )
        
        # Publish events
        for event in order.uncommitted_events:
            self.event_bus.publish_event(event)
        
        return order.id

class QueryHandler:
    def __init__(self, read_model_db):
        self.db = read_model_db
    
    def get_order_details(self, order_id: str):
        return self.db.execute("""
            SELECT * FROM order_projections
            WHERE order_id = ?
        """, (order_id,)).fetchone()

# Projection builder
class OrderProjectionBuilder:
    def __init__(self, read_model_db):
        self.db = read_model_db
    
    def handle_order_created(self, event: OrderCreated):
        self.db.execute("""
            INSERT INTO order_projections (
                order_id, customer_id, items, status, created_at
            ) VALUES (?, ?, ?, ?, ?)
        """, (
            event.aggregate_id,
            event.customer_id,
            json.dumps(event.items),
            'PENDING',
            event.timestamp
        ))
    
    def handle_order_shipped(self, event: OrderShipped):
        self.db.execute("""
            UPDATE order_projections
            SET status = 'SHIPPED',
                tracking_number = ?,
                shipped_at = ?
            WHERE order_id = ?
        """, (
            event.tracking_number,
            event.timestamp,
            event.aggregate_id
        ))
```

### Best Practices

1. **Idempotent event handlers** - Handle duplicate events gracefully
2. **Event versioning** - Support schema evolution
3. **Dead letter queues** - Handle processing failures
4. **Event ordering** - Maintain causal consistency
5. **Retention policies** - Balance history vs storage

### Key Takeaways

1. Events enable loose coupling between services
2. Event sourcing provides complete audit trails
3. CQRS optimizes read and write models separately
4. Streaming platforms enable real-time processing
5. Eventual consistency requires careful design

---

### Sources

- `https://martinfowler.com/eaaDev/EventSourcing.html`
- `https://www.confluent.io/blog/event-streaming-patterns/`
- `https://docs.microsoft.com/en-us/azure/architecture/patterns/cqrs`
- `https://www.oreilly.com/library/view/software-architecture-patterns/9781491971437/`
```

### Anti-patterns

- Using events for synchronous request-response patterns
- Creating chatty event interfaces with too many small events
- Not handling event ordering when it matters
- Ignoring event schema evolution and versioning
- Not implementing proper error handling and retry logic