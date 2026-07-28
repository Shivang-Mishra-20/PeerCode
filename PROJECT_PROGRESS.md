# Project Progress & Roadmap

## Summary

- **Project Name**: PeerCode
- **Status**: Milestone 4 Completed (Real-Time CRDT Collaboration, Yjs WebSockets, Persistence & Redis PubSub)
- **Current Milestone**: Milestone 5 - FastAPI AI Microservice & Ollama Pipeline

---

## Completed Milestones

### Milestone 0: Project Planning & Architectural Foundation

- [x] Defined system architecture and data flow sequence with Mermaid diagrams.
- [x] Established monorepo layout (`apps/frontend`, `apps/backend`, `apps/ai-service`, `packages/shared`).
- [x] Configured root `package.json` with npm workspace declarations.
- [x] Provisioned `docker-compose.yml` for PostgreSQL 16 and Redis 7.
- [x] Configured environment variable strategies (`.env.example` templates across services).
- [x] Written engineering conventions (`docs/CONVENTIONS.md`) and system architecture reference (`docs/ARCHITECTURE.md`).
- [x] Created root project README and repository foundation.

### Milestone 1: Core Monorepo Setup & Infrastructure Setup

- [x] **Session 1**: Configured root & package-level TypeScript build settings (`tsconfig.base.json`, workspace `tsconfig.json` files), linked `@peercode/shared` workspace dependency, setup ESLint & Prettier.
- [x] **Session 2**: Implemented Express HTTP server (`apps/backend/src/index.ts`) with `/health` route & FastAPI microservice (`apps/ai-service/app/main.py`) with `/health` route, initialized base Prisma ORM schema (`schema.prisma`), and verified build/lint status across workspaces.

### Milestone 2: Backend REST API & Database Schema Implementation

- [x] **Session 1**: Defined Prisma data models (`Room`, `CodeSnapshot`, `AIReview`), created initial PostgreSQL migration (`0_init`), generated Prisma Client, and established database singleton (`src/lib/prisma.ts`).
- [x] **Session 2**: Built room service layer (`roomService.ts`) and Express REST controllers (`POST /api/rooms`, `GET /api/rooms/:id`, `POST /api/rooms/:id/snapshots`, `GET /api/rooms/:id/snapshots/latest`).

### Milestone 3: Frontend Desktop IDE Shell & Monaco Editor Engine

- [x] Built React 18 SPA with Vite build pipeline, Tailwind CSS design system, Framer Motion transitions, custom UI primitives (`Button`, `IconButton`, `Input`, `Card`, `Badge`, `Modal`), desktop IDE 3-pane layout (`AppLayout`), Monaco Editor integration (`CodeEditor.tsx`), active language switcher (`javascript`, `typescript`, `python`, `cpp`), and status bar cursor line/column tracking.

### Milestone 4: Real-Time CRDT Collaboration & Yjs WebSockets

- [x] **Session 1**: Built custom Yjs WebSocket gateway (`websocketGateway.ts`), `RoomSession` class abstraction, `RoomSessionManager` singleton, Yjs binary sync protocol handlers (`y-protocols/sync`), 30s ping/pong heartbeat, enhanced `GET /health` diagnostics, and `SIGINT`/`SIGTERM` graceful shutdown.
- [x] **Session 2**: Enabled Client Yjs Provider (`WebsocketProvider`), `y-monaco` binding, live cursor awareness presence badges, dynamic CSS color styling (`injectAwarenessStyles`), and bottom status bar connection badges.
- [x] **Session 3**: Added dual Y.Doc/text snapshot persistence, `RoomPersistenceService`, 10s debounced auto-save, immediate disconnect flush, graceful exit flush, exponential backoff retries, and health metrics (`lastSuccessfulSnapshotAt`).
- [x] **Session 4**: Added `CollaborationTransport` abstraction, production-ready Redis client (`redis.ts`), `RedisPubSubService` for multi-node room message relay, `RedisSessionStore` for transient session metadata with TTLs, dynamic channel sub/unsub, and mandatory Redis outage resilience fallback.

---

## Upcoming Milestones

### Milestone 5: FastAPI AI Microservice & Ollama Pipeline

- Scope: Python microservice with Ollama `qwen2.5-coder:7b` integration, Pydantic response parsing, and background task queueing.

### Milestone 6: AI Peer Review UI & Monaco Markers

- Scope: End-to-end integration of AI suggestions into Monaco inline markers, highlights, and history panel.

### Milestone 7: Final Polishing, Comprehensive Verification & Documentation

- Scope: E2E testing, final README updates, screenshots, and interview readiness audit.

---

## Known Issues

- None at present.

---

## Technical Debt

- None at present.
