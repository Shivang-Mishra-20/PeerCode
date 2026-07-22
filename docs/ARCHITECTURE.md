# PeerCode System Architecture

## Overview

PeerCode is a distributed, real-time collaborative code editor equipped with automated, local AI peer review. The architecture decouples real-time CRDT document synchronization from CPU/GPU-intensive AI inference microservices.

```mermaid
flowchart TD
    Client["React + Monaco Editor\n(Frontend SPA)"]
    WS["WebSocket Server\n(Yjs CRDT Provider)"]
    API["Express API Server\n(Node.js / TypeScript)"]
    DB[(PostgreSQL\nPrisma ORM)]
    Cache[(Redis\nPub/Sub & Sessions)]
    AI["FastAPI Service\n(Python Microservice)"]
    Ollama["Ollama Daemon\n(Qwen2.5-Coder 7B)"]

    Client <-->|WebSockets / Yjs Sync| WS
    Client <-->|REST API| API
    WS <--> API
    API <--> DB
    API <--> Cache
    API -->|HTTP REST / Debounced| AI
    AI -->|HTTP / JSON Mode| Ollama
```

---

## Key Subsystems

### 1. Frontend Client (`apps/frontend`)
- **UI Framework**: React 18 with Vite, TypeScript, and Tailwind CSS.
- **Code Editor**: Monaco Editor (VS Code core engine).
- **CRDT Layer**: `yjs` + `y-monaco` + `y-websocket` for lock-free multi-user document state convergence and live cursor awareness.

### 2. Primary Backend (`apps/backend`)
- **Runtime**: Node.js with Express and TypeScript.
- **WebSocket Gateway**: Manages real-time room sessions, relays CRDT delta updates across connected peers, and publishes state events to Redis.
- **Persistence**: PostgreSQL via Prisma ORM for room configurations, snapshot history, and past AI review records.
- **State Buffer**: Redis for pub/sub messaging across WS nodes and fast transient session state storage.

### 3. AI Peer Review Microservice (`apps/ai-service`)
- **Runtime**: Python 3.11 with FastAPI and Pydantic.
- **Model Engine**: Local Ollama instance serving `Qwen2.5-Coder:7b`.
- **Structured Output**: Strict JSON enforcement for line-level suggestions (`bug`, `smell`, `inefficiency`, `unused`).
- **Concurrency & Queueing**: Server-side room debouncing (3s idle threshold) and asynchronous request queuing to prevent local hardware saturation.

---

## Data Flow Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User1 as User A (Browser)
    actor User2 as User B (Browser)
    participant WS as Express WebSocket Server
    participant Redis as Redis Cache
    participant DB as PostgreSQL
    participant AI as FastAPI Microservice
    participant Ollama as Local Ollama Engine

    User1->>WS: Yjs Document Update (Binary Delta)
    WS->>User2: Broadcast Delta Update
    WS->>Redis: Buffer Delta & Update Awareness State
    
    Note over WS: Debounce Timer (3s idle)
    WS->>AI: POST /api/v1/review (Code Snapshot + Language)
    AI->>Ollama: Prompt (Qwen2.5-Coder 7B, JSON format)
    Ollama-->>AI: Raw JSON Code Analysis
    AI-->>WS: Formatted AI Suggestions Payload
    WS->>DB: Persist AI Review History
    WS-->>User1: Push AI Markers & Highlights
    WS-->>User2: Push AI Markers & Highlights
```

---

## Directory Topology (Monorepo Layout)

```
PeerCode/
├── apps/
│   ├── frontend/         # React SPA + Monaco Editor + Yjs client
│   ├── backend/          # Express API + WebSocket Gateway + Prisma ORM
│   └── ai-service/       # FastAPI + Ollama integration microservice
├── packages/
│   └── shared/           # Shared TypeScript interfaces & API contracts
├── docker/
│   └── docker-compose.yml# PostgreSQL 16 & Redis 7 services
├── docs/
│   ├── ARCHITECTURE.md   # Architectural reference & diagrams
│   └── CONVENTIONS.md    # Development standards & guidelines
├── .env.example          # Root environment template
├── package.json          # Root npm workspace manifest
└── PROJECT_PROGRESS.md   # Development tracker & milestone status
```
