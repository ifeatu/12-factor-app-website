---
layout: factor
title: "Factor 16: Event-Driven Architecture"
factor_number: 16
factor_name: "Event-Driven Architecture"
description: "Decouple services through asynchronous events"
prev_factor:
  number: 15
  name: "Authentication & Authorization"
  url: "/factor-15-auth"
next_factor:
  number: 17
  name: "Failure Isolation"
  url: "/factor-17-failure-isolation"
---

# Factor 16: Event-Driven Architecture

## Decouple services through asynchronous events

### Modern Principle

Modern distributed systems benefit from loose coupling through event-driven communication. Instead of tight synchronous coupling, services communicate through events, enabling better scalability, resilience, and flexibility.

#### Core Concepts

- **Event Sourcing**: Store state changes as events
- **CQRS**: Separate read and write models
- **Event Streaming**: Real-time event processing
- **Saga Pattern**: Distributed transaction management
- **Event Choreography**: Decentralized event coordination

### Implementation Guidelines

1. **Design events as first-class citizens** in your architecture
2. **Use event schemas** for contract definition and evolution
3. **Implement idempotent event handlers** for reliability
4. **Apply event versioning** for backward compatibility
5. **Monitor event flows** for observability
6. **Handle event ordering** when sequence matters
7. **Implement dead letter queues** for failed events

### Event Patterns

- **Domain Events**: Business-meaningful state changes
- **Integration Events**: Cross-service communication
- **Command Events**: Request for action
- **Query Events**: Request for information
- **Notification Events**: Informational broadcasts

### Modern Tools

- **Message Brokers**: Apache Kafka, RabbitMQ, AWS SQS/SNS
- **Event Streaming**: Apache Kafka, AWS Kinesis, Azure Event Hubs
- **Event Stores**: EventStore, AWS DynamoDB Streams
- **Schema Registries**: Confluent Schema Registry, AWS Glue
- **Event Processing**: Apache Flink, AWS Lambda, Azure Functions

### Benefits

- **Loose Coupling**: Services don't need to know about each other
- **Scalability**: Asynchronous processing enables better scaling
- **Resilience**: Failures in one service don't cascade
- **Flexibility**: Easy to add new consumers of events
- **Auditability**: Complete history of state changes

### Anti-patterns

- Using events for synchronous request-response patterns
- Creating chatty event interfaces with too many small events
- Not handling event ordering when it matters
- Ignoring event schema evolution and versioning
- Not implementing proper error handling and retry logic