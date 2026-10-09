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
| ChatGPT | Private read-only MCP daily report, project details, connection status and operating guide | Installation confirmed by user; successful MCP requests observed, but tools are not exposed in this session for a data call |
| GitHub | Source versioning | Repository is public; keep data and secrets outside Git |
| Vercel | `portal/` access page deployed READY at https://build-dreams-ops.vercel.app; inactive report preview also READY | GitHub Login Connection for automatic builds; commercial plan; protected-fetch permission and report credentials remain pending |
| Apollo | Auth test + People API Search; ChatGPT reads saved contacts (zero returned) | Connected Free account denied new prospect API search; direct center key and eligible plan pending |
| GoHighLevel | Contacts search and upsert | Company Google sign-in returned `User does not exist`; existing GHL account, location ID and scoped token needed |
| Ollama Cloud | Model validation and bilingual follow-up draft | GitHub sign-in returned a server error; account access, key, cloud model and inference test pending |
| Hermes | Software installed and CLI version checked in the current temporary environment | Model authentication and persistent host; no scheduled agent or gateway active |
| Billing system | External references recorded in ledger | Existing invoicing/payment system remains the billing source |

No integration sends emails or SMS automatically. Apollo search does not enrich emails or phone numbers. GHL contact synchronization is manual; CRM opportunities, calendar, messaging and workflows must be configured separately.

## Development

Requires Node >=22.13. Install using the existing pnpm lockfile. `npm run build` produces `dist/server` and `dist/client`. Database schema is `db/schema.ts`; migration is `drizzle/0000_perpetual_havok.sql`. Apply migrations only to the intended database and keep a backup before upgrading an existing database.

Use the platform environment manager for `BD_CREDENTIAL_KEY` (base64-encoded random 32-byte encryption key) and `BD_AGENT_TOKEN` (random dedicated token). Do not rotate the encryption master without a credential re-encryption plan. Optional metadata: `BD_GITHUB_URL`, `BD_VERCEL_URL`, `BD_SITE_URL`, `BD_APOLLO_CHAT_VERIFIED`. Never put credentials into metadata fields. Credentials for Apollo/GHL/Ollama are entered in the private application's Connections screen.

Provider check metadata (`BD_APOLLO_CHAT_STATUS`, `BD_GHL_SIGNIN_STATUS`, `BD_OLLAMA_SIGNIN_STATUS`, `BD_HERMES_STATUS`, `BD_VERCEL_MODE`, `BD_PLATFORM_CHECKED_AT`) reports specific observed limits. It is not a substitute for a live API test with the configured credential.

Build then run `node --experimental-strip-types tests/ops.test.mjs` for financial and Worker/D1 integration checks. Tests create isolated, transient storage and no external account traffic. `node node_modules/typescript/bin/tsc --noEmit` checks types.

`node tests/vercel-report.test.mjs` checks the unactivated Vercel report gateway with mock upstream calls, including production refusal and credential redaction.

## Private report tools

`POST /mcp` supports JSON-RPC initialization, discovery and four read-only tools. Discovery contains no business records. Data calls require the trusted `oai-authenticated-user-id` that Sites supplies after OAuth and the owner-private access check; a service bearer alone does not create that identity. All record reads use company mode, never example data. Use the generated Site plugin's Install/Connect action in ChatGPT, then verify a read-only report call. Publication alone does not establish the connection.

## Vercel page

Deploy **only `portal/`** as a static project with Framework Preset Other. It links to the private operations center. It does not proxy protected records or contain a backend access token. The root application expects Cloudflare D1 and is not a drop-in Vercel deployment. A future migration needs a database and authenticated API design plus explicit authorization for any new credential destination.

`integrations/vercel-report-gateway/` contains a separate, reviewed read-only preview report module. The preview deployment is READY at https://build-dreams-167ssccib-albertbtc-1680.vercel.app and remains inactive, without report credentials. `/api/service-report` in the private center is disabled until its dedicated `BD_SERVICE_TOKEN` is configured; private platform access is still required. The automatic approval review rejected transferring two access secrets to Vercel. Do not send them by another route; obtain specific authorization naming both secrets and the preview project destination first. The gateway README states the activation and Deployment Protection requirements.

## Operators

Every opportunity needs an owner and next step date. Confirm measured scope, quotes, design/permits, approved price and written agreement before execution. Record only actual receipts/payments, each with a unique reference. Record scope changes only after written approval. Review tasks morning and afternoon; review cash, commitments, margins and follow-ups weekly. Back up records regularly. JSON export contains business records and recent audit entries, not credentials or a full provider configuration backup.

See [Operating instructions / Instrucciones](docs/OPERAR_ES_EN.md).

## Primary references

- [Apollo People API Search](https://docs.apollo.io/reference/people-api-search)
- [Apollo API authentication](https://docs.apollo.io/reference/authentication)
- [GoHighLevel private integrations](https://help.gohighlevel.com/support/solutions/articles/155000003054-private-integrations-everything-you-need-to-know)
- [GoHighLevel API](https://marketplace.gohighlevel.com/docs/)
- [Ollama Cloud](https://docs.ollama.com/cloud)
- [Ollama Hermes integration](https://docs.ollama.com/integrations/hermes)
- [Hermes Agent](https://hermes-agent.nousresearch.com/)
- [Vercel Git integration](https://vercel.com/docs/git)
- [Vercel pricing](https://vercel.com/pricing)
