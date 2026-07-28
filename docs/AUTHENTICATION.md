# Authentication Extension

The first release intentionally uses one seeded demo workspace and no complex
authentication. `getCurrentWorkspace()` is the only application-level seam that
resolves workspace context.

## Recommended evolution

Better Auth or Neon Auth can supply sessions and user identities. Add:

- `app.user` or the authentication provider’s user table;
- `app.workspace_membership(workspace_id, user_id, role, created_at)`;
- roles such as `viewer`, `reviewer`, and `admin`;
- a session-backed replacement for `getCurrentWorkspace()`;
- authorization helpers for read, resolution, ingestion, and source-management
  capabilities.

Each request should resolve a session, choose a workspace from memberships, and
pass that workspace ID through the existing query/service boundary. Do not
accept a workspace ID from a client without membership verification.

## Row-level security

Application validation remains necessary. Postgres RLS can later add defense in
depth by setting a transaction-local workspace/user context and applying
policies to every scoped table. Introduce RLS only after migrations, connection
pooling, background tasks, and administrative access have a documented context
strategy.

Neon Auth is attractive when preview branches should include isolated auth data.
Better Auth is attractive when application-owned adapters and session behavior
are preferred. Either can connect without changing canonical catalog,
resolution, or analytics contracts.
