# PeerCode System Architecture

## Overview

PeerCode is a real-time collaborative code editor equipped with local AI peer review capabilities. The architecture decouples real-time CRDT document synchronization from local AI inference microservices.

---

## 1. System Architecture Topology

```mermaid
flowchart TD
    subgraph ClientLayer["Frontend Layer"]
        SPA["React SPA + Monaco Editor"]
    end

    subgraph InfrastructureLayer["Docker Container Network"]
        GW["Express API & WS Gateway"]
        Redis[("Redis 7 Cache & Pub/Sub")]
        PG[("PostgreSQL 16 Database")]
        AI["FastAPI AI Microservice"]
    end

    subgraph HostLayer["Host Machine Infrastructure"]
        Ollama["Local Ollama Engine"]
    end

    SPA -->|WebSockets & Yjs Sync| GW
    SPA -->|HTTP & SSE Stream| GW
    GW -->|Pub/Sub Relay| Redis
    GW -->|Prisma ORM| PG
    GW -->|POST Request| AI
    AI -->|HTTP Streaming| Ollama
```

---

## 2. Core Components

### A. Frontend Client (`apps/frontend`)
- **Framework**: React 18 with Vite, TypeScript, and Tailwind CSS.
- **Code Editor**: Monaco Editor (VS Code core editing engine).
- **CRDT Synchronization**: `yjs` + `y-monaco` + `y-websocket` for lock-free multi-user document state convergence and live awareness tracking (remote collaborator cursors and selections).
- **AI Integration Client**: Dedicated SSE streaming client (`aiClient.ts`), modular review drawer (`AIReviewDrawer`), and isolated Monaco diagnostic managers (`monacoMarkers.ts` and `monacoDecorations.ts`).

### B. Express Backend Gateway (`apps/backend`)
- **Runtime**: Node.js with Express and TypeScript.
- **WebSocket Gateway**: Manages real-time room sessions, relays Yjs CRDT binary deltas across connected clients, and synchronizes state across backend instances via Redis Pub/Sub.
- **AI Gateway & Context Binding**: Captures current room document snapshots and proxies review requests to the FastAPI microservice using Server-Sent Events (SSE).
- **Persistence & Diagnostics**: Manages database migrations via Prisma ORM, stores room snapshots in PostgreSQL, and exposes a structured health endpoint (`/health`) with isolated dependency reporting (`postgres`, `redis`, `ai_service`, `ollama`).

### C. FastAPI AI Microservice (`apps/ai-service`)
- **Runtime**: Python 3.11 with FastAPI and Pydantic v2 schemas.
- **Model Integration**: Communicates with local Ollama engine serving `qwen2.5-coder:7b`.
- **Streaming & Verification**: Validates incoming prompt requests, enforces JSON output formats for code reviews, and streams live tokens back to the Express gateway using SSE.

---

## 3. Real-Time Collaboration Sequence

```mermaid
sequenceDiagram
    autonumber
    actor UserA as User A Browser
    actor UserB as User B Browser
    participant GW as Express WS Gateway
    participant Redis as Redis Pub/Sub Relay
    participant PG as PostgreSQL Database

    UserA->>GW: Yjs Binary Delta Update
    GW->>UserB: Direct WebSocket Relay
    GW->>Redis: Publish Room Delta
    Redis-->>GW: Relay Delta to Peer Gateway Nodes
    Note over GW: Debounced Document Idle Check
    GW->>PG: Upsert Room Snapshot
```

---

## 4. Live SSE AI Peer Review Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User as User Monaco Editor
    participant Client as React AI Client
    participant GW as Express AI Gateway
    participant AI as FastAPI Microservice
    participant Ollama as Local Ollama Engine

    User->>Client: Click Review Code
    Client->>GW: POST Stream Request
    GW->>GW: Bind Yjs Context and Extract Snapshot
    GW->>AI: POST Generate Stream Payload
    AI->>Ollama: POST Generate Stream
    Ollama-->>AI: Stream Token Chunks
    AI-->>GW: SSE Event Stream
    GW-->>Client: SSE Event Stream
    Note over Client: Buffer Incoming Stream Tokens
    Client-->>User: Live UI Stream Update
    Client->>User: Apply Monaco Markers and Line Decorations
```

---

## 5. Component & Database Entity Diagram

```mermaid
erDiagram
    Room ||--o{ Snapshot : contains
    Room ||--o{ AIReview : has

    Room {
        string id PK
        string name
        string language
        datetime createdAt
        datetime updatedAt
    }

    Snapshot {
        string id PK
        string roomId FK
        bytes content
        datetime createdAt
    }

    AIReview {
        string id PK
        string roomId FK
        string model
        json response
        datetime createdAt
    }
```

---

## 6. Monorepo Directory Topology

```text
PeerCode/
├── apps/
│   ├── frontend/         # React SPA + Monaco Editor + Yjs client
│   │   ├── src/          # Components, hooks, services, utils
│   │   └── Dockerfile    # Developer-first Dockerfile (Port 3000)
│   ├── backend/          # Express API + WebSocket Gateway + Prisma ORM
│   │   ├── src/          # Routes, sockets, services, lib
│   │   ├── prisma/       # PostgreSQL schema definition
│   │   └── Dockerfile    # Developer-first Dockerfile (Port 4000)
│   └── ai-service/       # FastAPI + Ollama microservice
│       ├── app/          # Main application, routes, services
│       └── Dockerfile    # Developer-first Dockerfile (Port 8000)
├── packages/
│   └── shared/           # Shared TypeScript types & API contracts
├── docs/                 # Architectural references & technical decisions
│   ├── ARCHITECTURE.md   # System architecture & sequence diagrams
│   └── DESIGN_DECISIONS.md # Engineering rationale & technology trade-offs
├── .env.example          # Root environment template
├── docker-compose.yml    # Root Docker Compose specification
└── package.json          # Monorepo workspace configuration
```
