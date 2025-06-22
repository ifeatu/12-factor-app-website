---
layout: factor
title: "Factor 7: Port Binding"
factor_number: 7
factor_name: "Port Binding"
description: "Export services via port binding"
prev_factor:
  number: 6
  name: "Processes"
  url: "/factor-06-processes"
next_factor:
  number: 8
  name: "Concurrency"
  url: "/factor-08-concurrency"
---

# Factor 7: Port Binding

## Export services via port binding

### Original Principle

The twelve-factor app is completely self-contained and does not rely on runtime injection of a webserver into the execution environment. The web app exports HTTP as a service by binding to a port, and listening to requests coming in on that port.

### Modern Evolution

Container orchestration has abstracted port binding while maintaining the principle. Applications still bind to ports, but Kubernetes Services, Ingress controllers, and service mesh handle the networking complexity. The principle has evolved from simple port binding to sophisticated service exposure patterns.

#### Container Networking Evolution

```yaml
# Traditional port binding
docker run -p 8080:8080 myapp

# Kubernetes abstraction
apiVersion: v1
kind: Service
metadata:
  name: myapp
spec:
  selector:
    app: myapp
  ports:
  - protocol: TCP
    port: 80        # Service port
    targetPort: 8080 # Container port
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp-ingress
spec:
  rules:
  - host: myapp.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: myapp
            port:
              number: 80
```

#### Self-Contained Applications

Modern frameworks make self-contained servers trivial:

```python
# Python FastAPI
from fastapi import FastAPI
import uvicorn

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Hello World"}

if __name__ == "__main__":
    # Self-contained ASGI server
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8080)),
        log_config={
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "default": {
                    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                },
            },
        }
    )
```

```javascript
// Node.js Express
const express = require('express');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Hello World' });
});

// Self-contained server
const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Process terminated');
  });
});
```

### Implementation Guidelines

1. **Dynamic Port Configuration**
    
    ```go
    // Go with dynamic port binding
    package main
    
    import (
        "fmt"
        "net/http"
        "os"
    )
    
    func main() {
        port := os.Getenv("PORT")
        if port == "" {
            port = "8080"
        }
        
        mux := http.NewServeMux()
        mux.HandleFunc("/", handler)
        
        server := &http.Server{
            Addr:    fmt.Sprintf(":%s", port),
            Handler: mux,
        }
        
        fmt.Printf("Server starting on port %s\n", port)
        if err := server.ListenAndServe(); err != nil {
            panic(err)
        }
    }
    ```
    
2. **Service Discovery Integration**
    
    ```yaml
    # Consul service registration
    apiVersion: v1
    kind: ConfigMap
    metadata:
      name: consul-config
    data:
      service.json: |
        {
          "service": {
            "name": "myapp",
            "port": 8080,
            "tags": ["api", "v1"],
            "check": {
              "http": "http://localhost:8080/health",
              "interval": "10s"
            }
          }
        }
    ```
    
3. **Multi-Protocol Support**
    
    ```python
    # Serving HTTP and gRPC on different ports
    import asyncio
    from concurrent import futures
    import grpc
    from aiohttp import web
    
    # HTTP server
    async def http_handler(request):
        return web.json_response({"protocol": "HTTP"})
    
    app = web.Application()
    app.router.add_get('/', http_handler)
    
    # gRPC server
    class Greeter(greeter_pb2_grpc.GreeterServicer):
        def SayHello(self, request, context):
            return greeter_pb2.HelloReply(message=f'Hello {request.name}')
    
    async def serve():
        # Start HTTP server
        runner = web.AppRunner(app)
        await runner.setup()
        http_site = web.TCPSite(runner, '0.0.0.0', 8080)
        await http_site.start()
        
        # Start gRPC server
        grpc_server = grpc.aio.server()
        greeter_pb2_grpc.add_GreeterServicer_to_server(Greeter(), grpc_server)
        grpc_server.add_insecure_port('[::]:50051')
        await grpc_server.start()
        
        print("HTTP server on :8080, gRPC server on :50051")
        await asyncio.Event().wait()
    
    asyncio.run(serve())
    ```
    

### Best Practices

1. **Bind to All Interfaces**
    
    ```python
    # Bind to 0.0.0.0, not localhost
    app.run(host='0.0.0.0', port=8080)  # Correct
    # app.run(host='127.0.0.1', port=8080)  # Wrong for containers
    ```
    
2. **Graceful Shutdown**
    
    ```javascript
    const server = app.listen(PORT);
    
    // Handle shutdown signals
    ['SIGINT', 'SIGTERM'].forEach(signal => {
      process.on(signal, () => {
        console.log(`${signal} received, closing server`);
        server.close(() => {
          console.log('Server closed');
          process.exit(0);
        });
      });
    });
    ```
    

### Anti-Patterns to Avoid

- **Hardcoded ports** in application code
- **Binding to localhost** in containers
- **Missing graceful shutdown** handlers
- **Port conflicts** from poor planning
- **Ignoring health check** endpoints

### Modern Tools and Services

- **Container Runtimes**: Docker, containerd, CRI-O
- **Orchestration**: Kubernetes, Docker Swarm, Nomad
- **Service Mesh**: Istio, Linkerd, Consul Connect
- **Ingress Controllers**: NGINX, Traefik, HAProxy

### Key Takeaways

1. Self-contained applications simplify deployment
2. Dynamic port configuration enables flexibility
3. Container orchestration abstracts networking complexity
4. Service discovery replaces hardcoded endpoints
5. Multiple protocols can coexist on different ports
6. Graceful shutdown is essential for reliability

---

### Sources

- `https://12factor.net/port-binding`
- `https://kubernetes.io/docs/concepts/services-networking/service/`
- `https://docs.docker.com/network/`
- `https://www.cncf.io/blog/2023/10/18/ingress-controllers-in-kubernetes/`