---
layout: factor
title: "Factor 14: GraphQL & gRPC"
factor_number: 14
factor_name: "GraphQL & gRPC"
description: "Modern API protocols for efficient communication"
prev_factor:
  number: 13
  name: "API First"
  url: "/factor-13-api-first"
next_factor:
  number: 15
  name: "Authentication & Authorization"
  url: "/factor-15-auth"
---

# Factor 14: GraphQL & gRPC

## Modern API protocols for efficient communication

### Modern Principle

While REST APIs remain important, modern applications benefit from more efficient protocols like GraphQL for flexible data fetching and gRPC for high-performance service-to-service communication.

#### GraphQL Benefits

- **Flexible Data Fetching**: Clients request exactly the data they need
- **Strong Type System**: Self-documenting APIs with introspection
- **Single Endpoint**: Reduces over-fetching and under-fetching
- **Real-time Subscriptions**: Built-in support for live data

#### gRPC Advantages

- **High Performance**: Binary protocol with HTTP/2
- **Language Agnostic**: Generated clients and servers
- **Streaming Support**: Bidirectional streaming capabilities
- **Built-in Load Balancing**: Advanced routing and load balancing

### Implementation Guidelines

1. **Use GraphQL for client-facing APIs** where flexibility is important
2. **Use gRPC for service-to-service communication** where performance matters
3. **Maintain REST APIs** for simple CRUD operations and external integrations
4. **Implement proper schema versioning** for both GraphQL and gRPC
5. **Use code generation** to maintain type safety across services

### Modern Tools

- **GraphQL**: Apollo Server, GraphQL Yoga, Hasura
- **gRPC**: Protocol Buffers, Envoy Proxy, Istio
- **API Gateways**: Kong, Ambassador, Traefik
- **Schema Management**: Apollo Studio, Buf Schema Registry

### Anti-patterns

- Using GraphQL for everything without considering use case
- Exposing internal gRPC services directly to clients
- Not implementing proper error handling for different protocols
- Mixing protocols without clear boundaries