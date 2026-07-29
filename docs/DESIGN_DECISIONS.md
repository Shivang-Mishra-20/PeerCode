# PeerCode Architectural Design Decisions

This document details the engineering rationale and trade-off analysis behind technology selections and architectural patterns in PeerCode.

---

## 1. Architectural Philosophy

PeerCode is structured around two key design goals:

1. **Real-Time Collaboration**: Multiple developers edit shared documents concurrently without manual locks or editing conflicts.
2. **Local AI Peer Review**: Code intelligence and peer reviews run locally without relying on external cloud LLM services.

To support these goals, the architecture separates real-time CRDT document synchronization (Node.js/Express) from AI model processing (Python/FastAPI & Ollama).

---

## 2. Technology Selection & Trade-Off Rationale

### A. React 18 & Monaco Editor (Frontend)

- **Selection Rationale**:
  - **Monaco Editor** is the code editing engine powering Visual Studio Code. It provides syntax highlighting, language services, inline marker APIs (`monaco.editor.setModelMarkers`), and decoration APIs (`deltaDecorations`).
  - **React 18** handles component lifecycles, UI state management, and declarative rendering for collaborative panels.
- **Trade-Offs Considered**:
  - _Trade-off_: Monaco has a larger asset footprint (~3MB) compared to simpler text inputs or lightweight editors.
  - _Decision_: Monaco was selected because its standard language service interfaces and marker/decoration model support precise, line-level AI peer review diagnostics.

---

### B. Yjs (Conflict-Free Replicated Data Types)

- **Selection Rationale**:
  - **Yjs** is a CRDT library implementing data structures for eventual consistency.
  - Unlike traditional Operational Transformation (OT) approaches that require a central server to order edits in lock-step, Yjs allows decentralized or server-relayed state convergence.
  - An awareness protocol manages real-time user presence, such as collaborator cursors and selection highlights.
- **Trade-Offs Considered**:
  - _Trade-off_: CRDT document histories retain binary metadata for character edits, which increases in-memory document size over time.
  - _Decision_: Yjs was chosen for its execution speed, low memory overhead relative to alternative CRDT libraries, and existing integration bindings (`y-monaco`, `y-websocket`).

---

### C. Node.js & Express (Backend Gateway)

- **Selection Rationale**:
  - Node.js offers an event-driven I/O model suited for managing concurrent WebSocket connections (`ws` protocol).
  - Express acts as the REST API gateway, managing room metadata, health endpoints, and proxying SSE streaming requests.
- **Trade-Offs Considered**:
  - _Trade-off_: A single-threaded event loop can experience latency if blocked by heavy CPU or GPU tasks.
  - _Decision_: AI model inference was placed in a separate Python microservice so the Node.js event loop remains dedicated to WebSocket message relaying and HTTP routing.

---

### D. Python 3.11 & FastAPI (AI Microservice)

- **Selection Rationale**:
  - **FastAPI** supports asynchronous request handling (`async/await`), Server-Sent Events (SSE) streaming via `EventSourceResponse`, and Pydantic schema validation.
  - Python provides a broad ecosystem for model integration and streaming response processing.
- **Trade-Offs Considered**:
  - _Trade-off_: Python typically consumes more memory per process than compiled languages like Go or Rust.
  - _Decision_: FastAPI was selected because its asynchronous I/O handles streaming response tokens efficiently while maintaining access to Python's AI libraries.

---

### E. Redis 7 (Session Cache & Pub/Sub Relay)

- **Selection Rationale**:
  - **Pub/Sub Relay**: Supports multi-node scaling for WebSocket connections. When a document is updated on one backend instance, the CRDT delta is published to Redis and distributed to other instances.
  - **Session Cache**: Stores transient room metadata and active client lists in memory.
- **Trade-Offs Considered**:
  - _Trade-off_: In-memory cache storage is volatile if restarted.
  - _Decision_: Redis is used for transient state and real-time messaging, with PostgreSQL providing persistent document snapshot storage.

---

### F. PostgreSQL 16 & Prisma ORM (Database Layer)

- **Selection Rationale**:
  - **PostgreSQL**: Relational database offering ACID compliance, JSONB support, and structured storage for room configurations, state snapshots, and historical AI reviews.
  - **Prisma ORM**: A typed TypeScript query client generated from declarative models (`schema.prisma`). It handles database schema synchronization (`prisma db push`) and reduces manual SQL mapping.
- **Trade-Offs Considered**:
  - _Trade-off_: Prisma's abstraction layer introduces a small runtime overhead compared to raw database queries.
  - _Decision_: Type safety and automated schema synchronization reduced data mapping issues across the backend.

---

### G. Local Ollama & Qwen2.5-Coder:7b (AI Engine)

- **Selection Rationale**:
  - **Ollama**: Serves a local REST API (`http://localhost:11434`) for model execution.
  - **Data Privacy & Cost**: Running models locally avoids sending source code to external services and avoids per-token API charges.
  - **Qwen2.5-Coder:7b**: An open coding model providing suitable inference speeds and code analysis accuracy for review suggestions.
- **Trade-Offs Considered**:
  - _Trade-off_: Relies on host GPU or CPU resources for local model execution.
  - _Decision_: Matches PeerCode's privacy-focused design objective.

---

### H. Docker Compose V2 (Infrastructure)

- **Selection Rationale**:
  - Manages the multi-container stack (`frontend`, `backend`, `ai-service`, `postgres`, `redis`) with a single startup command (`docker compose up -d`).
  - Provides network isolation (`peercode-network`), volume mounts for local development hot-reloading, container health checks, and database startup synchronization.
- **Trade-Offs Considered**:
  - _Trade-off_: Running services in containers introduces minor resource overhead.
  - _Decision_: Containerization ensures consistent local development environments across systems.
