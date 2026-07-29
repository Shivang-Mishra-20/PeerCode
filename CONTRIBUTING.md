# Contributing to PeerCode

Thank you for your interest in contributing to PeerCode! This document outlines the guidelines and workflow for contributing to the repository.

---

## Development Environment Setup

### Prerequisites

- **Node.js**: `>= 20.x` and `npm >= 10.x`
- **Python**: `>= 3.11`
- **Docker**: Docker Desktop with Docker Compose V2
- **Ollama**: Local Ollama runtime with `qwen2.5-coder:7b` pulled:
  ```bash
  ollama pull qwen2.5-coder:7b
  ```

---

## Getting Started

1. **Fork and Clone the Repository**:

   ```bash
   git clone https://github.com/Shivang-Mishra-20/PeerCode.git
   cd PeerCode
   ```

2. **Launch Development Infrastructure via Docker Compose**:

   ```bash
   docker compose up -d
   ```

   This automatically provisions PostgreSQL 16, Redis 7, Express API Gateway, FastAPI AI Microservice, and the React SPA Frontend.

3. **Verify Service Health**:
   ```bash
   curl http://localhost:4000/health
   ```

---

## Development Workflow

1. **Branch Naming**:
   Create a focused feature or fix branch from `main`:
   - `feature/description` for new features
   - `fix/description` for bug fixes
   - `docs/description` for documentation improvements

2. **Code Style & Guidelines**:
   - Maintain TypeScript strict type safety across `apps/frontend`, `apps/backend`, and `packages/shared`.
   - Preserve existing API contracts and docstrings.
   - Keep UI components modular and responsive using dynamic layout calculations.
   - Keep Python microservice code compliant with FastAPI and Pydantic v2 schemas.

3. **Commit Messages**:
   - Use concise, imperative-style commit messages starting with a action verb (e.g. `add user awareness indicator`, `fix Yjs snapshot save error`, `implement SSE token buffer`).
   - Keep the summary line short (under 72 characters) and focused on a single change.

4. **Testing & Verification**:
   Before submitting changes, ensure:
   - All services compile without TypeScript or Python errors.
   - Container healthchecks pass cleanly (`docker compose ps`).
   - Yjs CRDT synchronization and SSE streaming AI features function as expected.

5. **Submitting a Pull Request**:
   - Keep pull requests focused on a single responsibility.
   - Provide a clear summary of changes, motivation, and verification steps in the PR description.

---

## License

By contributing to PeerCode, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
