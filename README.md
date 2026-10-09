# Build Dreams MM · Operations

Private operations center for a DFW general contractor, with Spanish and English UI. This repository contains application source and a separate Vercel access page. It contains no customer records or provider credentials.

## Working core

Contacts and follow-up ownership → cost-based estimates → recorded written acceptance → projects → deposit/preparation gate → expenses, payments and approved changes → closeout evidence. Tasks, audit history, CSV import/export, printable client proposals, and JSON record backups are included. Real records start empty; demonstration records live in a separate namespace.

Money is stored in USD cents. Target margin is calculated on revenue: `price = cost / (1 - margin)`. Received payments are recorded against external receipt/invoice references; this application does not process payments. An accepted estimate needs a named approver and evidence reference. Project activation requires recorded deposit, scope, supplier quotes, permits/design review as applicable, and assigned crew.

## Architecture

- React 19 / Vinext / TypeScript, Cloudflare-compatible Worker.
- D1 SQLite transactions with optimistic version guards and request-id idempotency.
- Private owner access is enforced by the hosting platform. Do not deploy the API on a public host without adding authentication.
- Provider credentials are AES-GCM encrypted using a server-only master key. They are never returned in exports or the browser API.
- The `/api/agent` route is read-only and additionally requires a dedicated bearer token. Private platform authentication still applies; it is not an anonymous endpoint.
- WebMCP exposes a read-only state tool and a tool that opens a contact form for review. Runtime browser support is required.

## Integrations and current limits

| Component | Implemented | Account setup still required |
| --- | --- | --- |
| GitHub | Source versioning | Repository is public; keep data and secrets outside Git |
| Vercel | `portal/` static access page | Deployment permission, GitHub Login Connection, commercial plan |
| Apollo | Auth test + People API Search | API key and endpoint eligibility; ChatGPT connector access is separate |
| GoHighLevel | Contacts search and upsert | Sub-account location ID and scoped private integration token |
| Ollama Cloud | Model validation and bilingual follow-up draft | API key and an available cloud model |
| Hermes | Read-only summary endpoint | Persistent machine, Hermes installation, model setup, authorized access |
| Billing system | External references recorded in ledger | Existing invoicing/payment system remains the billing source |

No integration sends emails or SMS automatically. Apollo search does not enrich emails or phone numbers. GHL contact synchronization is manual; CRM opportunities, calendar, messaging and workflows must be configured separately.

## Development

Requires Node >=22.13. Install using the existing pnpm lockfile. `npm run build` produces `dist/server` and `dist/client`. Database schema is `db/schema.ts`; migration is `drizzle/0000_perpetual_havok.sql`. Apply migrations only to the intended database and keep a backup before upgrading an existing database.

Use the platform environment manager for `BD_CREDENTIAL_KEY` (base64-encoded random 32-byte encryption key) and `BD_AGENT_TOKEN` (random dedicated token). Do not rotate the encryption master without a credential re-encryption plan. Optional metadata: `BD_GITHUB_URL`, `BD_VERCEL_URL`, `BD_SITE_URL`, `BD_APOLLO_CHAT_VERIFIED`. Never put credentials into metadata fields. Credentials for Apollo/GHL/Ollama are entered in the private application's Connections screen.

Build then run `node --experimental-strip-types tests/ops.test.mjs` for financial and Worker/D1 integration checks. Tests create isolated, transient storage and no external account traffic. `node node_modules/typescript/bin/tsc --noEmit` checks types.

## Vercel page

Deploy **only `portal/`** as a static project with Framework Preset Other. It links to the private operations center. It does not proxy protected records or contain a backend access token. The root application expects Cloudflare D1 and is not a drop-in Vercel deployment. A future migration needs a database and authenticated API design plus explicit authorization for any new credential destination.

## Operators

Every opportunity needs an owner and next step date. Confirm measured scope, quotes, design/permits, approved price and written agreement before execution. Record only actual receipts/payments, each with a unique reference. Record scope changes only after written approval. Review tasks morning and afternoon; review cash, commitments, margins and follow-ups weekly. Back up records regularly. JSON export contains business records and recent audit entries, not credentials or a full provider configuration backup.

## Primary references

- [Apollo People API Search](https://docs.apollo.io/reference/people-api-search)
- [Apollo API authentication](https://docs.apollo.io/reference/authentication)
- [GoHighLevel private integrations](https://help.gohighlevel.com/support/solutions/articles/155000001305-private-integrations)
- [GoHighLevel API](https://marketplace.gohighlevel.com/docs/)
- [Ollama Cloud](https://docs.ollama.com/cloud)
- [Ollama Hermes integration](https://docs.ollama.com/integrations/hermes)
- [Hermes Agent](https://hermes-agent.nousresearch.com/)
- [Vercel Git integration](https://vercel.com/docs/git)
- [Vercel pricing](https://vercel.com/pricing)
