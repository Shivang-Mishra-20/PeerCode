# PeerCode Engineering Conventions & Standards

## Code Style & Guidelines

### TypeScript & JavaScript

- Enforce strict typing. Avoid using `any`; prefer `unknown` or specific interfaces defined in `@peercode/shared`.
- Use explicit return types on public exports and API handlers.
- Prefer functional components with hooks in React. Keep components modular and single-purpose.
- Name files using `PascalCase` for React components (`CodeEditor.tsx`) and `camelCase` for utilities/helpers (`roomState.ts`).

### Python (`apps/ai-service`)

- Follow PEP 8 guidelines.
- Use explicit type annotations for all function parameters and return values.
- Use Pydantic models for request/response serialization and validation.
- Name modules and files using `snake_case` (`review_service.py`).

### Environment Variables & Secrets

- Never commit actual `.env` files or credentials to Git.
- Always update corresponding `.env.example` templates when adding new configuration keys.
- Reference variables cleanly via centralized config modules rather than raw `process.env` calls throughout the code.

---

## Git & Commit Workflow

### Commit Message Format

Commit messages must be concise, descriptive, and imperative:

- `init project foundation and architecture docs`
- `add prisma schema for rooms and snapshot models`
- `setup express websocket gateway with yjs provider`
- `implement Monaco editor CRDT binding`
- `connect fastAPI microservice with local ollama`

### Branch & PR Guidelines

- Work is executed in logical milestones.
- Every commit must leave the repository in a compiling and working state.
