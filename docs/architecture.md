# Application Architecture

This document describes the structured clean architecture of the Community Hero platform.

## Architecture Pattern
The project separates concerns by following the pattern:
```text
Page → Component → Hook → Service → Firebase / REST API
```

### 1. Presentation Layer (Pages & Components)
* **Pages** (`src/pages/`): Thin components that compose layours and features. They do not handle raw data fetching or API interaction directly.
* **Components** (`src/components/layout/` and `src/features/*/components/`): Independent UI widgets that receive state via props or hooks.

### 2. Business Logic Layer (Hooks & Services)
* **Hooks** (`src/features/*/hooks/` or `src/hooks/`): Manage component states, side effects, and connect components to services.
* **Services** (`src/features/*/services/` or `src/services/`): Contain raw integrations with external APIs and Firebase.
  * **Firebase Client SDK** (`src/services/firebase/firebaseClient.ts`): Houses the initialized app and Firestore connections.
  * **AI Service** (`server/services/gemini.service.ts` or client-side wrapper): Manages Gemini model instantiation, configurations, and structured output expectations.

### 3. Data & Types Layer
* **Centralized Types** (`src/types/`): Defines modular entity specifications (`user.ts`, `community.ts`, `issue.ts`, `feed.ts`) that are re-exported by `src/types/index.ts`.

---

## Backend (Server) Pattern
The backend is structured into standard controller-service-routing components under `/server`:
* **Entry Point** (`server/index.ts`): Express server configuration, middleware registrations, API routing mounts, and client assets proxying.
* **Controllers** (`server/controllers/`): Handles express requests, parses request bodies, delegates processing to services, and returns structured JSON responses.
* **Services** (`server/services/`): Houses the Gemini SDK API logic and local high-fidelity fallbacks.
* **Routes** (`server/routes/`): Explicit endpoint routers (e.g. `/api/health`, `/api/gemini/analyze`).
