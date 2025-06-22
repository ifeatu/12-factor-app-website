---
layout: factor
title: "Factor 11: Logs"
factor_number: 11
factor_name: "Logs"
description: "Treat logs as event streams"
prev_factor: "factor-10-dev-prod-parity.md"
next_factor: "factor-12-admin-processes.md"
---

# Factor 11: Logs

## Treat logs as event streams

### Original Principle

A twelve-factor app never concerns itself with routing or storage of its output stream. It should not attempt to write to or manage logfiles. Instead, each running process writes its event stream, unbuffered, to stdout.

### Modern Evolution

Logs are now just one pillar of observability alongside metrics and traces. Structured logging, distributed tracing, and centralized aggregation have become essential for understanding distributed systems. The principle of treating logs as streams remains, but the sophistication has increased dramatically.

#### Modern Observability Stack

```python
# Structured logging with OpenTelemetry
import logging
from opentelemetry import trace
from opentelemetry.instrumentation.logging import LoggingInstrumentor

LoggingInstrumentor().instrument()
tracer = trace.get_tracer(__name__)

logger = logging.getLogger(__name__)

def process_order(order_id):
    with tracer.start_as_current_span("process_order") as span:
        span.set_attribute("order.id", order_id)
        
        logger.info("Processing order", extra={
            "order_id": order_id,
            "trace_id": span.get_span_context().trace_id,
            "span_id": span.get_span_context().span_id,
            "service.name": "order-processor",
            "service.version": "1.2.3"
        })
```

#### Log Aggregation Pipeline

```yaml
# Fluentd configuration
<source>
  @type forward
  port 24224
</source>

<filter **>
  @type parser
  key_name log
  <parse>
    @type json
  </parse>
</filter>

<filter **>
  @type record_transformer
  <record>
    hostname "#{Socket.gethostname}"
    tag ${tag}
    timestamp ${time}
  </record>
</filter>

<match **>
  @type elasticsearch
  host elasticsearch.monitoring.svc.cluster.local
  port 9200
  logstash_format true
  logstash_prefix k8s
  <buffer>
    @type file
    path /var/log/fluentd-buffers/kubernetes.system.buffer
    flush_mode interval
    flush_interval 5s
  </buffer>
</match>
```

### Best Practices

1. **Structured logging** with JSON format
2. **Correlation IDs** for request tracing
3. **Log levels** appropriate to environment
4. **No sensitive data** in logs
5. **Centralized aggregation** for analysis

### Key Takeaways

- Logs are event streams, not files
- Structure enables parsing and analysis
- Observability requires logs, metrics, and traces
- Centralization enables correlation
- Security and compliance constrain content

---

### Sources

- `https://12factor.net/logs`
- `https://opentelemetry.io/docs/specs/otel/logs/`
- `https://www.fluentd.org/architecture`