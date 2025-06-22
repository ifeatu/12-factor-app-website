---
layout: factor
title: "Factor 14: Telemetry"
factor_number: 14
factor_name: "Telemetry"
description: "Comprehensive observability with metrics, logs, and traces"
prev_factor:
  number: 13
  name: "API First"
  url: "factor-13-api-first"
next_factor:
  number: 15
  name: "Auth"
  url: "factor-15-auth"
---

# Factor 14: Telemetry

## Comprehensive observability with metrics, logs, and traces

### Modern Principle

While Factor 11 addresses logging, modern applications require comprehensive telemetry. This factor mandates that applications emit structured metrics, distributed traces, and contextual logs that enable understanding system behavior, debugging issues, and making data-driven decisions. Observability must be built-in, not bolted-on.

#### The Three Pillars of Observability

```python
# Unified telemetry with OpenTelemetry
from opentelemetry import trace, metrics
from opentelemetry.exporter.otlp.proto.grpc import (
    trace_exporter,
    metrics_exporter
)
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.instrumentation.flask import FlaskInstrumentor
import logging

# Configure tracing
trace.set_tracer_provider(TracerProvider())
tracer = trace.get_tracer(__name__)
trace_exporter = trace_exporter.OTLPSpanExporter(
    endpoint="otel-collector:4317"
)

# Configure metrics
metrics.set_meter_provider(MeterProvider())
meter = metrics.get_meter(__name__)
metrics_exporter = metrics_exporter.OTLPMetricExporter(
    endpoint="otel-collector:4317"
)

# Create metrics
request_counter = meter.create_counter(
    name="http_requests_total",
    description="Total HTTP requests",
    unit="1"
)

request_duration = meter.create_histogram(
    name="http_request_duration_seconds",
    description="HTTP request duration",
    unit="s"
)

# Instrument Flask app
app = Flask(__name__)
FlaskInstrumentor().instrument_app(app)

@app.route('/api/orders/<order_id>')
def get_order(order_id):
    with tracer.start_as_current_span("get_order") as span:
        # Add span attributes
        span.set_attribute("order.id", order_id)
        span.set_attribute("user.id", current_user.id)
        
        # Record metrics
        request_counter.add(1, {
            "method": "GET",
            "endpoint": "/api/orders",
            "status": "success"
        })
        
        # Structured logging with trace context
        logger.info("Fetching order", extra={
            "order_id": order_id,
            "trace_id": span.get_span_context().trace_id,
            "span_id": span.get_span_context().span_id,
            "user_id": current_user.id
        })
        
        return fetch_order(order_id)
```

#### SLIs, SLOs, and Error Budgets

```yaml
# Prometheus rules for SLO monitoring
groups:
  - name: slo_rules
    interval: 30s
    rules:
      # Availability SLI
      - record: service:availability:ratio_rate5m
        expr: |
          sum(rate(http_requests_total{status!~"5.."}[5m])) by (service)
          /
          sum(rate(http_requests_total[5m])) by (service)
      
      # Latency SLI (95th percentile under 200ms)
      - record: service:latency:p95_rate5m
        expr: |
          histogram_quantile(0.95,
            sum(rate(http_request_duration_seconds_bucket[5m])) by (service, le)
          )
      
      # Error budget burn rate
      - alert: ErrorBudgetBurn
        expr: |
          (
            1 - service:availability:ratio_rate5m
          ) > (1 - 0.999) * 14.4
        for: 1h
        labels:
          severity: page
        annotations:
          summary: "Error budget burn rate too high"
          description: "Service {{ $labels.service }} is burning error budget at {{ $value }}x rate"
```

#### Distributed Tracing

```javascript
// Node.js with OpenTelemetry
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');

// Initialize tracing
const provider = new NodeTracerProvider({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'order-service',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.2.3',
  }),
});

provider.addSpanProcessor(
  new BatchSpanProcessor(
    new OTLPTraceExporter({
      url: 'http://otel-collector:4317',
    })
  )
);

provider.register();

// Auto-instrument
registerInstrumentations({
  instrumentations: [
    new HttpInstrumentation({
      requestHook: (span, request) => {
        span.setAttributes({
          'http.request.body': JSON.stringify(request.body),
          'user.id': request.user?.id,
        });
      },
    }),
    new ExpressInstrumentation(),
  ],
});
```

### Implementation Guidelines

1. **Structured Events**
    
    ```go
    // Go with structured logging
    import (
        "github.com/sirupsen/logrus"
        "go.opentelemetry.io/otel"
    )
    
    func ProcessPayment(ctx context.Context, payment Payment) error {
        span := trace.SpanFromContext(ctx)
        logger := logrus.WithFields(logrus.Fields{
            "trace_id": span.SpanContext().TraceID().String(),
            "payment_id": payment.ID,
            "amount": payment.Amount,
            "currency": payment.Currency,
        })
        
        logger.Info("Processing payment")
        
        // Record business metrics
        paymentCounter.Add(ctx, 1,
            attribute.String("currency", payment.Currency),
            attribute.String("method", payment.Method),
        )
        
        start := time.Now()
        err := processPaymentInternal(payment)
        duration := time.Since(start)
        
        paymentDuration.Record(ctx, duration.Seconds())
        
        if err != nil {
            logger.WithError(err).Error("Payment failed")
            span.RecordError(err)
            span.SetStatus(codes.Error, err.Error())
            return err
        }
        
        logger.Info("Payment processed successfully")
        return nil
    }
    ```
    
2. **Health and Readiness**
    
    ```python
    @app.route('/healthz')
    def health():
        return jsonify({"status": "healthy"}), 200
    
    @app.route('/readyz')
    def ready():
        checks = {
            "database": check_database(),
            "cache": check_redis(),
            "dependencies": check_external_apis()
        }
        
        ready = all(checks.values())
        status_code = 200 if ready else 503
        
        return jsonify({
            "ready": ready,
            "checks": checks,
            "timestamp": datetime.utcnow().isoformat()
        }), status_code
    ```
    

### Best Practices

1. **Cardinality Control** - Limit label combinations
2. **Sampling Strategy** - Balance detail vs overhead
3. **Context Propagation** - Maintain trace context
4. **Semantic Conventions** - Use standard attribute names
5. **Dashboard Design** - Focus on user journeys

### Key Takeaways

1. Telemetry is not optional in modern systems
2. Three pillars provide different perspectives
3. SLOs drive reliability decisions
4. Distributed tracing is essential for microservices
5. Build observability in from the start

---

### Sources

- `https://opentelemetry.io/docs/`
- `https://sre.google/sre-book/monitoring-distributed-systems/`
- `https://www.oreilly.com/library/view/distributed-tracing-in/9781492056621/`
- `https://prometheus.io/docs/practices/`