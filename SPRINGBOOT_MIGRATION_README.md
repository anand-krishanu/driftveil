# DriftVeil: Spring Boot Migration Guide

## 🚀 Immediate Action: Shared PostgreSQL Setup
*Use this to run Python and Spring Boot side-by-side today.*

### 1. Python (Prisma) Update
1. Change `datasource db` provider to `"postgresql"` in `schema.prisma`.
2. Update `.env` with `DATABASE_URL="postgresql://user:password@localhost:5432/driftveil"`.
3. Run `npx prisma migrate dev`.

### 2. Spring Boot (JPA) Setup
1. Use `ddl-auto: validate` in `application.yml`.
2. Map Entities to match Prisma names exactly (e.g., `@Table(name = "Machine")`).

### 3. Port Allocation
- **Python**: `localhost:8000` (The AI Engine)
- **Spring Boot**: `localhost:8080` (The API Gateway)

---

## Architecture Decision: Who Does What

| Responsibility | Current Owner | After Migration (Option A: Dual Stack) | After Migration (Option B: Pure Java) |
|---|---|---|---|
| WebSocket / REST / DB | FastAPI/Prisma | **Spring Boot** | **Spring Boot** |
| CUSUM Math (numpy) | Python | **Python** | **Spring Boot (Commons Math)** |
| AI Agents (Gemini) | Python | **Python** | **Spring AI** |
| MCP Tool Server | Python | **Python** | **Spring AI MCP** |
| Chat Orchestration | Python | **Python** | **Spring AI** |
| Inter-service Glue | N/A | **Kafka / RabbitMQ** | **Internal Event Bus (Guava/Spring)** |

---

## Option A: Dual-Language (The "Keep Python Math" Path)
*Use this if you have complex numpy/scipy/pandas logic that is too painful to port.* (Detailed in the previous version of this doc).

---

## Option B: Pure Java (The "Enterprise Standard" Path)
*Use this for a single-repo, single-language stack. This is the most robust architecture for DriftVeil.*

### 1. Definitive Dependencies (pom.xml)

Add the **Spring AI BOM** to your `dependencyManagement` first, then add these:

```xml
<dependencies>
    <!-- Core Engine -->
    <dependency>spring-boot-starter-web</dependency>
    <dependency>spring-boot-starter-websocket</dependency>
    <dependency>spring-boot-starter-data-jpa</dependency>
    <dependency>org.postgresql:postgresql</dependency>
    
    <!-- AI & MCP (Replaces Python AI Logic) -->
    <dependency>spring-ai-google-vertex-ai-gemini-spring-boot-starter</dependency>
    <dependency>spring-ai-mcp-spring-boot-starter</dependency>
    
    <!-- Math (Replaces Numpy) -->
    <dependency>
        <groupId>org.apache.commons</groupId>
        <artifactId>commons-math3</artifactId>
        <version>3.6.1</version>
    </dependency>

    <!-- Dev Productivity -->
    <dependency>lombok</dependency>
</dependencies>
```

### 2. Feature Porting Reference

| Python Component | Java Equivalent |
|---|---|
| `agent_detection` (numpy) | `DiagnosticService` using `SimpleRegression` |
| `agent_root_cause` (Gemini) | `DiagnosticAgent` using `ChatClient.entity()` |
| `mcp_server.py` | `@Tool` annotated methods in a `@Service` |
| `chat_orchestrator.py` | Spring AI `ChatClient` with Tool Call callbacks |
| `simulation_engine.py` | Java `SimulationService` using POJOs and Streams |

### 4. Why "Pure Java" Wins
1. **Zero Latency**: No JSON serialization over Kafka/Network. Data stays in local RAM.
2. **Type Safety**: Your `Machine` entity is the same object used by the UI, the Math, and the AI.
3. **Easier Deployment**: One `.jar` file. One `Dockerfile`. One pipeline.
4. **Spring Security**: Protect your AI endpoints and data tools with a single unified security policy.


---

## Why This Split

**Spring Boot takes over everything that is "infrastructure":**
- WebSocket connection management (STOMP handles thousands of concurrent operators)
- Database CRUD (Hibernate/JPA is the enterprise standard; TimescaleDB needs JDBC anyway)
- Auth & Security (Spring Security is battle-tested; Prisma has no auth story)
- REST routing (Spring MVC is more suitable for multi-tenant industrial deployments)

**Python keeps everything that requires the scientific stack:**
- `numpy` for CUSUM and linear regression (`np.polyfit`, `np.sum`) — no clean Java equivalent
- `google-genai` SDK for Gemini structured outputs with `response_schema=AlertResponseModel` — Pydantic native
- `simulation_engine.py` — pure math projection, tightly coupled to Python float precision
- `chat_orchestrator.py` — Gemini function-calling loop, MCP tool dispatch

---

## Service Map After Migration

```
React Frontend  ──────────────────────────────────────────────────────────
     │                    WebSocket (wss://)   REST (HTTP)
     ▼                         │                    │
┌──────────────────────────────────────────────────────────┐
│          Spring Boot  (Port 8080)                        │
│  - WebSocket STOMP endpoint  /ws/feed/{machine_id}       │
│  - REST: /api/machines, /api/machine-types               │
│  - REST: /api/machines/auto (create + seed telemetry)    │
│  - REST: /api/chat/sessions/**                           │
│  - REST: /api/start-feed, /api/reset, /health            │
│  - JPA Repositories → TimescaleDB (PostgreSQL)           │
│  - Kafka Producer: publishes to `sensor_telemetry`       │
│  - Kafka Consumer: listens to `ai_alerts`, pipes to WS   │
└──────────────────────────────────────────────────────────┘
            │                              ▲
   Kafka topic: sensor_telemetry     Kafka topic: ai_alerts
            │                              │
            ▼                              │
┌────────────────────────────────────────────────────────┐
│         Python AI Worker  (Port 8000)                  │
│  - Kafka Consumer: reads sensor_telemetry              │
│  - agent_detection()  (numpy CUSUM + polyfit)          │
│  - agent_root_cause() (Gemini structured output)       │
│  - run_agent_pipeline() triggers on drift              │
│  - Kafka Producer: publishes alert to ai_alerts        │
│  - /api/chat/simulate  (chat orchestration)            │
│  - /api/run-detection  (called by Spring if no Kafka)  │
└────────────────────────────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────┐
│  Python MCP Server  (Port 8001)        │
│  STAYS INTERNAL — called by AI Worker  │
│  /tools/get_sensor_data                │
│  /tools/get_fingerprints               │
│  /tools/get_machines                   │
└────────────────────────────────────────┘
```

---

## Part 1: Spring Boot Service

### 1.1 Project Setup

Use Spring Initializr with these dependencies:

```xml
<!-- pom.xml -->
<dependencies>
  <!-- Web & WebSocket -->
  <dependency>spring-boot-starter-web</dependency>
  <dependency>spring-boot-starter-websocket</dependency>

  <!-- Database -->
  <dependency>spring-boot-starter-data-jpa</dependency>
  <dependency>org.postgresql:postgresql</dependency>

  <!-- Messaging -->
  <dependency>spring-kafka</dependency>

  <!-- Utilities -->
  <dependency>spring-boot-starter-validation</dependency>
  <dependency>lombok</dependency>
</dependencies>
```

### 1.2 Database Entities (maps to current `schema.prisma`)

Every Prisma model maps 1:1 to a JPA `@Entity`:

```java
// Machine.java  ← maps to Prisma `Machine` model
@Entity @Table(name = "machines")
public class Machine {
    @Id String id;                    // MCH-01, MCH-02 ...
    String name;
    String line;
    String location;
    int baseHealth;
    String status;                    // NORMAL | WARN | DRIFT
    LocalDateTime installedAt;
    LocalDateTime createdAt;

    @OneToMany(mappedBy = "machine") List<SensorReading> sensorReadings;
    @OneToMany(mappedBy = "machine") List<Alert> alerts;
    @OneToMany(mappedBy = "machine") List<ChatSession> chatSessions;
}

// SensorReading.java  ← maps to Prisma `SensorReading` model
@Entity @Table(name = "sensor_readings")
public class SensorReading {
    @Id String id;
    LocalDateTime time;
    String machineId;
    double temperature;
    double vibration;
    Integer rpm;

    @ManyToOne @JoinColumn(name = "machineId") Machine machine;
}

// Alert.java           ← maps to Prisma `Alert` model
// ChatSession.java     ← maps to Prisma `ChatSession` model
// ChatMessage.java     ← maps to Prisma `ChatMessage` model
// WhatIfSimulation.java← maps to Prisma `WhatIfSimulation` model
// FailureFingerprint.java← maps to Prisma `FailureFingerprint` model
```

### 1.3 WebSocket Endpoint (replaces `@app.websocket("/ws/feed/{machine_id}")`)

The current Python WS loop runs at 2 Hz (500ms sleep) and maintains per-machine state in a `states` dict. Spring Boot recreates this with STOMP:

```java
// WebSocketConfig.java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws/feed").setAllowedOrigins("*").withSockJS();
    }
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }
}

// FeedService.java — recreates the 2Hz loop per machine
// Uses @Scheduled every 500ms per active machine session
// Reads SensorReadings from DB by cursor offset
// Broadcasts to /topic/feed/{machine_id}
// When drift is detected → publishes to Kafka `sensor_telemetry`
```

**Key state to replicate from `main.py` `states` dict:**

```java
// MachineStreamState.java — replaces Python's `states` in-memory dict
public class MachineStreamState {
    int cursor;
    boolean running;
    boolean driftDetected;
    boolean agentRunning;
    Map<String, Object> alert;       // last alert from Python AI Worker
    String diagnosisRaw;
    List<Map<String, Object>> sentRows; // accumulates for drift detection
}
```

### 1.4 REST Endpoints (replaces all `@app.get/post` in `main.py`)

| Current Python Route | Spring Boot Controller Method |
|---|---|
| `POST /api/start-feed?machine_id=X` | `@PostMapping("/api/start-feed")` |
| `GET /api/machines` | `@GetMapping("/api/machines")` |
| `GET /api/machine-types` | `@GetMapping("/api/machine-types")` |
| `GET /api/machine-types/{type}/preview` | `@GetMapping("/api/machine-types/{type}/preview")` |
| `POST /api/machines/auto` | `@PostMapping("/api/machines/auto")` |
| `GET /api/machines/{id}/history` | `@GetMapping("/api/machines/{id}/history")` |
| `POST /api/reset` | `@PostMapping("/api/reset")` |
| `GET /health` | `@GetMapping("/health")` |
| `POST /api/chat/sessions` | `@PostMapping("/api/chat/sessions")` |
| `GET /api/chat/sessions/{id}/messages` | `@GetMapping("/api/chat/sessions/{id}/messages")` |
| `POST /api/chat/sessions/{id}/message` | `@PostMapping("/api/chat/sessions/{id}/message")` |

> **Note:** `/api/chat/sessions/{id}/message` in Python calls `run_chat_turn()` from `chat_orchestrator.py`. In Spring Boot, this endpoint instead dispatches an HTTP `POST` to the Python AI Worker at `http://python-ai:8000/api/chat/simulate`. Spring Boot saves the result to DB; Python does the LLM work.

### 1.5 Machine Profiles & Data Generation

`MACHINE_PROFILES` and `SCENARIO_SETTINGS` from `main.py` and the `_generate_stream_rows()` function should be moved to a Spring Boot `MachineProfileService`. The math is simple enough:

```java
// MachineProfileService.java
// Replaces MACHINE_PROFILES dict, SCENARIO_SETTINGS dict,
// and _generate_stream_rows() function from main.py
public List<SensorReadingDto> generateStreamRows(
    String machineType, String scenario, int points) {
    // Port the exact ramp/noise math from Python _generate_stream_rows
    // Uses ThreadLocalRandom instead of random.uniform
    // Returns List<SensorReadingDto> for bulk insert
}
```

### 1.6 Kafka Integration

```java
// KafkaProducerService.java
// Called by FeedService when drift is detected
public void publishSensorBatch(String machineId, List<SensorRow> rows) {
    kafkaTemplate.send("sensor_telemetry", machineId, rows);
}

// AlertConsumer.java
// Listens to ai_alerts topic, broadcasts alert to WebSocket
@KafkaListener(topics = "ai_alerts")
public void onAlert(AlertPayload payload) {
    messagingTemplate.convertAndSend(
        "/topic/feed/" + payload.getMachineId(), payload
    );
}
```

---

## Part 2: Python AI Worker (Slimmed Down)

The Python service loses all of its HTTP routing responsibility. It becomes a **pure AI worker**.

### 2.1 Files That Stay Completely Unchanged

| File | Reason |
|---|---|
| `agent_detection()` in `main.py` | `numpy` CUSUM + `polyfit` — cannot be replicated cleanly in Java |
| `agent_root_cause()` in `main.py` | `google-genai` Pydantic structured output with `response_schema=AlertResponseModel` |
| `run_agent_pipeline()` in `main.py` | Orchestrates agents 1-4, calls Gemini |
| `mcp_server.py` | Tool server, now called only by the AI Worker (not Spring Boot) |
| `chat_orchestrator.py` | Full Gemini function-calling loop with `MCP_TOOLS` |
| `simulation_engine.py` | What-if math projection — keep as-is |
| `prompt_templates.py` | System prompt, fallback template — keep as-is |
| `schema.prisma` | Remove Prisma (Spring Boot owns DB now) OR keep read-only for the MCP server |

### 2.2 What Gets Removed from Python

Remove all of these from `main.py`:

```python
# REMOVE — Spring Boot owns these now:
@app.websocket("/ws/feed/{machine_id}")   # ← entire function
@app.post("/api/start-feed")
@app.get("/api/machines")
@app.get("/api/machine-types")
@app.get("/api/machine-types/{machine_type}/preview")
@app.post("/api/machines/auto")
@app.get("/api/machines/{machine_id}/history")
@app.post("/api/reset")
@app.get("/health")
@app.post("/api/chat/sessions")
@app.get("/api/chat/sessions/{session_id}/messages")
@app.post("/api/chat/sessions/{session_id}/message")

# REMOVE — Spring Boot now owns DB writes via JPA:
db = Prisma()
@app.on_event("startup") / "shutdown"   # Prisma connect/disconnect

# REMOVE — Spring Boot does its own data generation:
_generate_stream_rows()
MACHINE_PROFILES
SCENARIO_SETTINGS

# REMOVE — DB helper calls inside WebSocket loop:
load_all_rows_from_mcp()     # Spring reads from its own JPA repo
_next_machine_id()           # Spring generates machine IDs
await db.machine.create()    # Spring JPA does writes
await db.sensorreading.create_many()
```

### 2.3 New Python `main.py` Structure

After the strip-down, Python's `main.py` exposes exactly **two entry points**:

```python
# NEW main.py — Python AI Worker Only

from fastapi import FastAPI
from kafka import KafkaConsumer, KafkaProducer
import asyncio

app = FastAPI(title="DriftVeil AI Worker", version="2.0.0")

# ── Kafka Consumer Loop ──────────────────────────────────────────────────
# Listens to `sensor_telemetry` topic published by Spring Boot.
# Runs agent_detection() on every message.
# When drift detected → calls run_agent_pipeline() → publishes to `ai_alerts`.

async def kafka_detection_loop():
    consumer = KafkaConsumer("sensor_telemetry", ...)
    for msg in consumer:
        payload = json.loads(msg.value)
        machine_id = payload["machine_id"]
        rows = payload["rows"]

        detection_stats = agent_detection(rows)   # ← UNCHANGED numpy math

        if detection_stats["drift_detected"] and not already_triggered(machine_id):
            drifting_rows = rows[-15:]
            alert = await agent_root_cause(drifting_rows, detection_stats)  # ← UNCHANGED Gemini call
            producer.send("ai_alerts", json.dumps({
                "machine_id": machine_id,
                "alert": alert.dict(),
                "diagnosis_raw": alert.diagnosis_raw
            }).encode())

# ── Chat Endpoint (called by Spring Boot) ────────────────────────────────
@app.post("/api/chat/simulate")
async def simulate_direct(req: ChatMessageRequest):
    # ← UNCHANGED — full chat_orchestrator.run_chat_turn() call
    answers, sim_obj, recommendation = await run_chat_turn(
        "session", req.message, build_context(req)
    )
    return {"assistant_message": answers, "simulation": sim_obj, "recommendation": recommendation}

# ── Health ────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "server": "DriftVeil AI Worker"}
```

### 2.4 Updated `requirements.txt` for Python Worker

```txt
# Keep everything — these are ALL needed by the AI worker
fastapi
uvicorn[standard]
numpy
pandas
google-genai
httpx
python-dotenv
tenacity

# Add for Kafka
kafka-python

# Remove (Spring Boot owns the DB now — unless MCP server still needs it)
# prisma   ← remove ONLY if mcp_server.py is updated to call Spring Boot's REST API
#            instead of hitting Prisma directly
```

> **Decision point:** The `mcp_server.py` currently reads from Prisma/SQLite. After migration it should call Spring Boot's own REST API (`GET /api/machines`, `GET /api/machines/{id}/history`) instead of hitting the database directly. This makes `prisma` completely removable from Python.

---

## Part 3: Database Migration

### Current: SQLite via Prisma (dev only)

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./driftveil.db"
}
```

### Target: PostgreSQL + TimescaleDB via Spring JPA

```yaml
# application.yml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/driftveil
    username: driftveil
    password: secret
  jpa:
    hibernate:
      ddl-auto: validate    # Use Flyway for migrations
    properties:
      hibernate.dialect: org.hibernate.dialect.PostgreSQLDialect
```

The `SensorReading` table should use TimescaleDB's `create_hypertable` on the `time` column — this replaces the `@@index([machineId, time(sort: Desc)])` hint from Prisma:

```sql
-- Flyway migration: V1__init.sql
SELECT create_hypertable('sensor_readings', 'time');
```

---

## Part 4: Step-by-Step Migration Order

Follow this sequence to avoid breaking the demo at any point:

```
Step 1 — Database
  └─ Spin up PostgreSQL + TimescaleDB (Docker)
  └─ Write Flyway migrations for all 6 Prisma models
  └─ Seed fingerprints via Spring Boot data.sql

Step 2 — Spring Boot Core
  └─ Scaffold project (Spring Initializr)
  └─ Implement all 6 JPA entities
  └─ Implement all REST endpoints (no WebSocket yet)
  └─ Test: curl /api/machines, /api/machine-types

Step 3 — Spring Boot WebSocket
  └─ Configure STOMP WebSocket
  └─ Implement FeedService (500ms scheduler)
  └─ Connect React frontend to new ws:// endpoint
  └─ Test: sensor ticks flow to UI

Step 4 — Kafka Bridge
  └─ Docker-compose Kafka + Zookeeper
  └─ Spring Boot: KafkaProducer publishes sensor_telemetry on drift trigger
  └─ Spring Boot: KafkaConsumer listens to ai_alerts → WS broadcast

Step 5 — Python AI Worker
  └─ Strip main.py down to new structure (see 2.3)
  └─ Add Kafka consumer loop
  └─ Update mcp_server.py to call Spring Boot REST instead of Prisma
  └─ Test: drift trigger → Kafka → Python → Gemini → Kafka → Spring WS → UI

Step 6 — Chat
  └─ Spring Boot /api/chat/sessions/{id}/message → POST to Python /api/chat/simulate
  └─ Spring Boot saves ChatMessage + WhatIfSimulation to DB
  └─ Test: full chat flow end-to-end
```

---

## Part 5: `docker-compose.yml` (Full Stack)

```yaml
version: "3.9"
services:

  db:
    image: timescale/timescaledb:latest-pg16
    environment:
      POSTGRES_DB: driftveil
      POSTGRES_USER: driftveil
      POSTGRES_PASSWORD: secret
    ports: ["5432:5432"]
    volumes: [db_data:/var/lib/postgresql/data]

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"
    depends_on: [zookeeper]

  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181

  spring-backend:
    build: ./spring-backend
    ports: ["8080:8080"]
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/driftveil
      SPRING_KAFKA_BOOTSTRAP_SERVERS: kafka:9092
    depends_on: [db, kafka]

  python-ai-worker:
    build: ./backend
    ports: ["8000:8000"]
    environment:
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      KAFKA_BOOTSTRAP_SERVERS: kafka:9092
      MCP_BASE_URL: http://python-ai-worker:8001
    depends_on: [kafka]

  python-mcp-server:
    build: ./backend
    command: python mcp_server.py
    ports: ["8001:8001"]
    environment:
      SPRING_API_URL: http://spring-backend:8080
    depends_on: [spring-backend]

  frontend:
    build: ./frontend
    ports: ["5173:5173"]

volumes:
  db_data:
```

---

## Option C: The Hybrid Bridge (Dual Backend)
*Use this if you want to keep your current Python AI code running while using Spring Boot for the Frontend API.*

### 1. Shared PostgreSQL
You **must** migrate from SQLite to PostgreSQL. 
- **Python**: Points to Postgres in `.env` (`DATABASE_URL="postgresql://..."`).
- **Spring**: Points to the same Postgres in `application.yml`.

### 2. The Responsibility Split
- **Spring Boot (Port 8080)**: The "Face" of the app. Handles WebSockets, React REST requests, and Database writes.
- **Python (Port 8000)**: The "Brain". Handles only the `@app.post("/api/analyze")` endpoint.

### 3. The Flow
1. React sends a message to **Spring Boot**.
2. Spring Boot saves the data to **Postgres**.
3. Spring Boot calls `POST http://localhost:8000/api/analyze` with the latest data.
4. Python runs `numpy` + `Gemini` and returns the JSON result.
5. Spring Boot pushes that result to the operator via **WebSocket**.

### 4. Structure
```text
/backend-python   <- Keep Prisma and Agent code
/backend-java     <- New Spring Boot Gateway
```
