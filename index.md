---
layout: default
title: "The Modern 17-Factor App"
description: "An evolution of the twelve-factor methodology for modern cloud-native applications"
---

# The Modern 17-Factor App

## Building Cloud-Native Applications in 2025

The twelve-factor methodology revolutionized cloud application development when it emerged in 2011. Today, thirteen years later, the landscape has transformed dramatically. Modern distributed systems, with their microservices architectures, sophisticated security requirements, and edge computing demands, require an evolved approach.

This site presents **The Modern 17-Factor App** - an evolution of the original twelve factors plus five critical new factors that address today's cloud-native realities.

### Why 17 Factors?

The original twelve factors emerged from Heroku's experience running hundreds of apps on one of the first Platform-as-a-Service offerings. While these principles remain foundational, modern applications face challenges that didn't exist in 2011:

- **Security threats** have evolved from simple password attacks to sophisticated supply chain compromises
- **Microservices architectures** create complex service meshes requiring new communication patterns
- **Observability needs** have expanded beyond simple logging to comprehensive telemetry
- **Event-driven patterns** have become essential for scalable, loosely-coupled systems
- **Progressive delivery** techniques blur traditional deployment boundaries

### The Original Twelve - Evolved

1. [**Codebase**](./factor-01-codebase.md) - One codebase tracked in revision control, many deploys *(Now with GitOps)*
2. [**Dependencies**](./factor-02-dependencies.md) - Explicitly declare and isolate dependencies *(Now with supply chain security)*
3. [**Config**](./factor-03-config.md) - Store config in the environment *(Now with configuration services)*
4. [**Backing Services**](./factor-04-backing-services.md) - Treat backing services as attached resources *(Now with service mesh)*
5. [**Build, Release, Run**](./factor-05-build-release-run.md) - Strictly separate build and run stages *(Now with progressive delivery)*
6. [**Processes**](./factor-06-processes.md) - Execute the app as one or more stateless processes *(Now with distributed state)*
7. [**Port Binding**](./factor-07-port-binding.md) - Export services via port binding *(Now with container orchestration)*
8. [**Concurrency**](./factor-08-concurrency.md) - Scale out via the process model *(Now with pods and functions)*
9. [**Disposability**](./factor-09-disposability.md) - Maximize robustness with fast startup and graceful shutdown *(Now with chaos engineering)*
10. [**Dev/Prod Parity**](./factor-10-dev-prod-parity.md) - Keep development, staging, and production as similar as possible *(Now with containers)*
11. [**Logs**](./factor-11-logs.md) - Treat logs as event streams *(Now part of observability)*
12. [**Admin Processes**](./factor-12-admin-processes.md) - Run admin/management tasks as one-off processes *(Still critical)*

### The New Five - Essential for Modern Apps

13. [**API First**](./factor-13-api-first.md) - Design and document APIs before implementation
14. [**Telemetry**](./factor-14-telemetry.md) - Comprehensive observability with metrics, logs, and traces
15. [**Authentication & Authorization**](./factor-15-auth.md) - Security by design with zero-trust principles
16. [**Event-Driven Architecture**](./factor-16-event-driven.md) - Asynchronous communication and event sourcing
17. [**Failure Isolation**](./factor-17-failure-isolation.md) - Design for partial failure with circuit breakers and bulkheads

### Getting Started

Whether you're building a new cloud-native application or modernizing an existing system, these seventeen factors provide a comprehensive framework for success. Start with the factors most critical to your current challenges:

- **For new applications**: Begin with API First, Authentication, and Telemetry as foundational elements
- **For legacy modernization**: Focus on Config, Dependencies, and Dev/Prod Parity first
- **For scaling challenges**: Prioritize Event-Driven Architecture, Concurrency, and Failure Isolation

### About This Guide

This guide builds upon the original twelve-factor methodology created by Adam Wiggins and the Heroku team, incorporating insights from:

- Kevin Hoffman's "Beyond the Twelve-Factor App"
- Martin Fowler's microservices patterns
- Sam Newman's "Building Microservices"
- The Cloud Native Computing Foundation's best practices
- Real-world experience from companies like Netflix, Google, and Amazon

Navigate through each factor using the links above to understand both the original principle and its modern evolution.

---

*Last updated: June 2025*