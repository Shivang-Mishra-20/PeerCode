# Project Progress & Roadmap

## Summary

- **Project Name**: PeerCode
- **Status**: Milestone 1 Completed (Core Monorepo Setup & Infrastructure Setup)
- **Current Milestone**: Milestone 2 - Backend REST API & Database Schema Implementation

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

---

## Current Milestone

### Milestone 2: Backend REST API & Database Schema Implementation

- [ ] Implement Prisma schema persistence models (`User`, `Room`, `RoomSession`, `AIReview`).
- [ ] Build Express REST API routes for room lifecycle management.

---

## Upcoming Milestones

### Milestone 1: Core Monorepo Setup & Infrastructure Setup

- Scope: Initializing workspace package dependencies, setting up Prisma ORM base schemas in backend, FastAPI health check in Python microservice, and verifying Docker infrastructure.

### Milestone 2: Backend REST API & Database Schema Implementation

- Scope: User, Room, Session, and AIReview persistence models in PostgreSQL; Express API routing for room lifecycle management.

### Milestone 3: Real-Time CRDT Collaboration & Monaco Engine

- Scope: React SPA setup with Monaco Editor, Yjs CRDT WebSocket binding, and multi-user cursor awareness.

### Milestone 4: Room Session Persistence & Redis Integration

- Scope: Redis session store, periodic Yjs update snapshotting to PostgreSQL, and room session restoration.

### Milestone 5: FastAPI AI Microservice & Ollama Pipeline

- Scope: Python service with Ollama `qwen2.5-coder:7b` integration, Pydantic response parsing, and background task queueing.

### Milestone 6: AI Peer Review UI & Monaco Markers

- Scope: End-to-end integration of AI suggestions into Monaco inline markers, highlights, and history panel.

### Milestone 7: Final Polishing, Comprehensive Verification & Documentation

- Scope: E2E testing, final README updates, screenshots, and interview readiness audit.

---

## Pending Work

- Initial package dependency installation across workspaces.
- Prisma schema definition for room persistence.
- WebSocket server implementation in backend.

---

## Known Issues

- None at present.

---

## Technical Debt

- None at present.

---

## Future Enhancements (Post-MVP)

- [ ] **Multi-file Room Support**: Enable navigating and editing multiple files in a single room session.
- [ ] **Voice / Audio Chat**: WebRTC integrated audio channel for real-time pair programming.
- [ ] **Custom AI Prompt Tuning**: Allow users to configure AI review severity and focus areas (e.g., security-focused vs. performance-focused).
- [ ] **Code Execution Sandbox**: Run collaborative code snippets safely inside an isolated server-side sandbox or WebAssembly runtime.
- [ ] **Role-based Permissions**: Read-only vs. Write access modes for room participants.
