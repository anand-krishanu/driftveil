# Enterprise Migration Strategy: Spring Boot Core + Python AI

Migrating the core data routing backend to **Spring Boot** while keeping the Mathematical/AI orchestration in **Python (FastAPI)** is an exceedingly common and highly regarded architecture for enterprise industrial applications. 

This document outlines the **Whys**, the **Why Nots**, and the **How-To** of setting up a complete Minimum Viable Product (MVP) using this dual-language microservice pattern.

---

## 1. Why Do This? (The Pros)

### Enterprise Readiness & SCADA Integrations
Most enterprise manufacturing floors operate heavily on Java ecosystems. **Spring Boot** is the gold standard for robust, high-concurrency data streaming, Authentication (Spring Security), and Database connection pooling (Hibernate/JPA). When you pitch DriftVeil to large industrial clients, saying "The core is Spring Boot" immediately builds trust regarding stability.

### The Best Tool for the Job
You decouple your application to let each language do what it does best:
- **Java (Spring)** is built for managing millions of WebSocket connections, processing thousands of telemetry ticks a second, and enforcing strict authorization rules without breaking a sweat.
- **Python** is the undisputed king of Machine Learning. Libraries like `numpy`, `pandas`, official `mcp-sdk` support, and Amazon Bedrock APIs are native and seamless in Python. Trying to rewrite matrix math or LLM Agent pipelines in Java is clunky and slow.

### Scalability
LLM orchestration and `numpy` math (Agent 2) are highly CPU-intensive. Routing basic sensor data to a React dashboard (Spring Boot) is incredibly lightweight. Splitting them means you can scale your heavily-taxed Python AI containers horizontally on high-CPU nodes without wasting money scaling the entire web server.

---

## 2. Why NOT Do This? (The Cons)

### Engineering Overhead
For a small team building an MVP, introducing two languages doubles your DevOps work. You now have two separate `Dockerfiles`, two sets of dependencies (`pom.xml` vs `requirements.txt`), and two deployment pipelines.

### Network Latency Bottlenecks
In our current FastAPI monolith, passing data from the "sensor feed" to the "drift math engine" happens in local memory (microseconds). If you split them, Spring Boot has to serialize blocks of sensor data into JSON or Protobuf and send them over the local network to Python to check for drift. Over massive data loads, network serialization overhead can become a bottleneck.

---

## 3. How to Implement It (The Architecture)

To successfully build this, you transition from a "Monolith" to an "Event-Driven Microservice Architecture".

### Component Breakdown
1. **React Frontend**: Remains exactly the same.
2. **Spring Boot (Core Server - Port 8080)**: 
   - Handles the WebSocket (`wss://`) connection to the frontend.
   - Saves incoming raw SCADA telemetry directly into a TimescaleDB (Postgres) database.
   - Pushes standard live sensor ticks seamlessly to the React frontend.
3. **Python AI Agent Service (Port 8000)**:
   - Does **not** directly communicate with the frontend.
   - Exclusively handles CUSUM math, the MCP context fetching, and the Claude 3.5 Bedrock logic.
4. **Message Broker (e.g., Apache Kafka or RabbitMQ)**: The glue that holds them together.

### The New Pipeline Flow
1. **Ingestion**: The factory sends data to Spring Boot. Spring Boot publishes this data directly to a Kafka topic called `sensor_telemetry`. It also pipes it over WebSockets to the React UI.
2. **Detection Loop**: The Python service continuously listens to the `sensor_telemetry` Kafka topic. It runs its `numpy` CUSUM math silently in the background on every tick.
3. **Drift Trigger**: When Python calculates a CUSUM > 10, it stops processing new messages and immediately runs the Bedrock LLM Agent 3 & 4. 
4. **Alerting**: Once the Python Agent formats the JSON Alert, Python publishes the alert payload to a Kafka topic called `ai_alerts`.
5. **UI Push**: Spring Boot, listening to `ai_alerts`, instantly catches the completed JSON alert and pipes it directly down the WebSocket to the Operator's screen.

### Step-by-Step Migration Plan
1. **Set up Spring Websocket**: Recreate the `/ws/feed/{machine_id}` endpoint in Java using Spring WebSockets (STOMP).
2. **Convert Python to a Worker**: Remove all FastAPI WebSocket logic from `main.py`. Convert it into a daemon script that listens to a Redis or RabbitMQ queue for data arrays.
3. **Bridge the Communication**: Ensure Spring Boot can dispatch `POST` requests to Python `/api/run-agents`, OR rely strictly on a message bus to pass the data payloads back and forth.
