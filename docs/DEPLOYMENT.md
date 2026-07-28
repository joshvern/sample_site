# Neon and Vercel Deployment

## Environments

Use separate database branches:

| Environment | Database target                      | Seed data |
| ----------- | ------------------------------------ | --------- |
| Local       | Neon development branch or Docker    | Yes       |
| Preview     | Neon branch created for that preview | Optional  |
| Production  | Protected production branch          | No        |

Configure `DATABASE_URL` as a server-only Vercel environment variable and
`NEXT_PUBLIC_APP_URL` per environment.

## Release sequence

1. Generate and review migration SQL during development.
2. Apply it to an isolated development or preview branch.
3. Run tests and `pnpm build`.
4. Apply the reviewed migration to production as an explicit release step.
5. Deploy the compatible application version.

Do not run migrations from module initialization, page requests, Route Handlers,
or every Vercel build. Concurrent serverless executions are not a migration
orchestrator and may modify the wrong branch.

## Preview branches

Connect the Vercel project through Neon’s preview integration so each preview
receives an isolated branch-derived `DATABASE_URL`. This prevents schema or
seed experiments from changing production data. Delete obsolete preview
branches according to the project’s retention policy.

## Security checklist

- Never commit `.env` files or credentials.
- Keep database access in the Node server runtime.
- Use a least-privilege runtime role; use an owner/migration role only in CI or
  controlled release operations.
- Apply workspace checks to every mutation.
- Retain Vercel and Neon logs without recording connection strings or payload
  secrets.
- Disable production seed execution in deployment automation.

No account provisioning or interactive credential flow is included in the
repository.
