<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Architecture & Development Workflow Rules

## 1. Decoupled Backend-First Implementation
- **NEVER** make direct calls to the Supabase client (`.from()`, etc.) from the frontend components, hooks, or pages. 
- All data access and business logic **MUST** be implemented in the Express backend first.
- **Workflow Order**: 
    1. Define/Update the database schema in Supabase.
    2. Implement the **Repository**, **Service**, and **Controller** in the `backend/src/` directory.
    3. Register the new route in the backend.
    4. Implement/Update the API client function in `frontend/lib/api/`.
    5. Implement/Update the React Query hook in `frontend/hooks/`.
    6. Finally, consume the hook in the frontend components.

## 2. Backend Architecture (Service-Controller-Repository)
- **Repositories** (`backend/src/repositories/`): Only layer allowed to perform raw database queries via Supabase client.
- **Services** (`backend/src/services/`): Handle business logic, validation, and orchestration between repositories.
- **Controllers** (`backend/src/controllers/`): Handle Express request/response cycles and delegate to services.
- **Routes** (`backend/src/routes/`): Purely for mapping HTTP paths to controllers and applying middleware (auth, admin, etc.).

## 3. Frontend Authentication
- Use `getServerSession()` from `@/lib/auth` for Server Components.
- Use `getAccessToken()` helper from `@/lib/supabase/client` for Client Components/Hooks.
- Avoid using Supabase SDK Auth methods directly in consumer code.
