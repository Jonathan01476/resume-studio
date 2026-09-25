# Folio / Resume Studio

A digital document, not a portfolio template. Next.js App Router, React, TypeScript, Tailwind CSS, Zod, and Supabase. The fictional Alex Morgan sample is clearly labeled and isolated in `lib/resume/sample-data.ts`.

## Run locally

Requires Node.js **22.17 or newer** and npm.

```powershell
cd C:\Users\obele\resume-studio
npm install
npm run dev
```

Open http://127.0.0.1:3000/resume or http://127.0.0.1:3000/edit. No cloud account or AI key is required. The dev server binds to loopback. Without Supabase, drafts, published snapshots, versions, and sources live under the gitignored `.local/` directory. Back up this directory if you use local mode for real data. Local mode is for a single server process, not shared/serverless deployment.

`npm run build` verifies production compilation. To preview a local production build only, set `LOCAL_DEMO_MODE=true` before `npm start`. This bypass is **always disabled on Vercel**. In production without configured authentication, `/edit` redirects to a locked setup screen and mutation APIs reject requests.

## What works

- Public `/resume`: server-rendered published data, centered responsive document, keyboard-accessible native detail dialogs, Letter-size browser printing.
- `/edit`: the same renderer, instant preview, all profile and nested entry fields, add/delete/reorder, section order, separate save and publish.
- Draft snapshots and published content are separate. Changes appear at the same URL after publication, without redeployment.
- Version history: view the last 20 snapshots, review differences, restore into a new draft. Older snapshots remain in persistence.
- AI: validated proposals with field/section differences, discard or approve/save. Never auto-publishes. Current content is saved before generating a proposal.
- No-key demo provider: deterministic section reordering and shortening multi-sentence descriptions. It **does not perform semantic interpretation or vision**.
- PDFs: signature/type/size validation, text extraction with PDF.js, graceful failure for scans, corrupt and encrypted documents. No OCR. Images and UTF-8 text can also be attached. Images are fully decoded before storage and limited to 20 megapixels; animated or truncated images are rejected.
- Sources: private original files plus text/metadata manifests. Five attachments per command, 3 MB each, PDFs up to 25 pages. Detaching removes a source from the command; it does not delete the stored original. Recent source references are remembered in this browser. Cross-device source-library management is not implemented.
- Resume JSON export and validated import with review. Project image URLs accept HTTP(S); local/private source attachments are not automatically published as project images.
- Optimistic concurrency prevents stale sessions overwriting newer drafts. Publication verifies the exact draft version.

Long resumes flow onto additional print pages rather than silently clipping content. The bundled sample fits one Letter page. Use the browser's print dialog, select Letter and disable browser-generated headers/footers. Browser settings may override CSS defaults.

## Supabase setup

1. Create a Supabase project, then a single email/password user in Authentication. Disable public signup unless you intend to add onboarding. Set an appropriate password and configure Supabase's authentication rate limits.
2. Run `supabase/migrations/001_resume.sql` once in the SQL editor. It creates owner allowlisting, draft/public/version tables, transactional save/publish functions, RLS, and a private source bucket.
3. Insert your Auth user's UUID into `public.resume_owners` using the commented SQL statement in the migration. The app also requires the same UUID as `OWNER_USER_ID`. Both checks are intentional.
4. Copy `.env.example` to `.env.local` and set:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
OWNER_USER_ID=YOUR_AUTH_USER_UUID
```

The anon key is a public application credential; authorization is enforced by RLS and server-side owner checks. **No service-role key is needed or accepted.** Never put an AI key in a `NEXT_PUBLIC_*` variable.

5. Restart the app, sign in at `/login`, replace the illustrative content, save, then publish. A new Supabase project starts with no public resume. Its editor starts with the labeled sample so you can replace it.

Source files are private; only their owner can download them. Public readers can select only `published_resumes`, never drafts, versions, or source objects. Tables reject direct writes; owner-checked database functions save and publish atomically. App reads and writes validate the full Resume schema. SQL also checks identity/ownership/concurrency; malformed data written through direct owner RPC calls will be rejected by the renderer's Zod validation.

## Deploy to Vercel

1. Put this folder in a Git repository and import it into Vercel as a Next.js project (Node 22+).
2. Add the three Supabase variables above to the relevant Vercel environments. Do **not** set `LOCAL_DEMO_MODE`.
3. Deploy using the normal Next.js defaults (`npm run build`). No filesystem persistence is used in this mode.
4. Verify `/edit` and every mutation route reject anonymous requests; sign in as the owner and publish; verify `/resume` from a private browser window.

Cloud deployment requires your own Supabase/Vercel account configuration. The included migration and cloud adapter are ready for integration, but cannot be verified against a live project without those credentials. Hosting and persistence are designed for personal free-tier usage; service quotas and terms still apply. AI is optional and can be left disabled to avoid model charges.

## AI provider contract

`ResumeAIProvider` separates model integration from UI, rendering, ingestion, and persistence. The default HTTP adapter speaks a **provider-neutral gateway contract**, not a vendor-specific API. Point it at your own trusted HTTPS gateway or replace that adapter with a provider SDK implementation.

```dotenv
AI_API_URL=https://YOUR_GATEWAY/resume
AI_API_KEY=YOUR_SERVER_SIDE_SECRET
AI_MODEL=YOUR_MODEL_NAME
```

The server POSTs the following JSON with `Authorization: Bearer <AI_API_KEY>`:

```typescript
{
  model: string;
  system: string; // non-fabrication and untrusted-source instructions
  schema: object; // generated JSON Schema for Resume
  input: {
    resume: Resume;
    instruction: string;
    sources: Array<ResumeSource & { dataUrl?: string }>;
  }
}
```

The gateway must return `{ "resume": <complete canonical Resume> }`. Images are sent as data URLs; a multimodal gateway must forward them to its vision-capable model. PDF and text sources contain extracted text. Requests time out after 45 seconds; responses are limited to 500 KB, parsed as JSON, validated with Zod, and checked for stable identity. Remote responses cannot replace metadata or generate components. All model output is a reviewable proposal. Model instructions cannot guarantee factual accuracy, so users must check proposed qualifications against their sources before approval.

Text/job descriptions can be supplied in the prompt or attached as `.txt`. Variant creation is intentionally deferred; variant-style commands are rejected rather than risking the master document. Storage includes slugs and ownership to support this later.

## Architecture

```text
PDF / image / text / instruction
            |
  ingestion + private source storage
            |
  provider service (or deterministic demo)
            |
  Resume JSON -> Zod -> reviewed proposal
            |
  repository -> versioned draft -> explicit publish
            |
  ResumeRenderer (shared public + editor)
```

| Layer                                 | Location                  |
| ------------------------------------- | ------------------------- |
| Canonical types, validation, fixtures | `lib/resume/`             |
| Renderer and native detail dialogs    | `components/resume/`      |
| Editor, review, history, commands     | `components/editor/`      |
| Server-side provider abstraction      | `lib/ai/`                 |
| PDF extraction and file validation    | `lib/ingestion/`          |
| Private file storage                  | `lib/storage/`            |
| Local and Supabase repositories       | `lib/db/`                 |
| Authentication, origin/body checks    | `lib/auth.ts`, `proxy.ts` |
| Database ownership and RLS            | `supabase/migrations/`    |

The public page uses request-time reads to reflect publication immediately. Secondary detail interaction is a small client component; the renderer itself works as a server component on the public route. No arbitrary HTML rendering, eval, user-provided scripts, or server-side URL fetching occurs. Project images are lazy-loaded external URLs and therefore contact their image host when a reader opens their details.

## Verification

```powershell
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Playwright requires Chromium (`npx playwright install chromium` once). Browser tests use port 3100 and a local development server. **Run tests against a disposable local workspace**, not an owner's live cloud project: workflow tests deliberately save/publish/restore the fictional fixture. Tests leave their snapshots in `.local/` and browser artifacts under `test-results/`.

The PDF inspection helper `node scripts/inspect-pdf.mjs` renders the test PDF through PDF.js and its canvas dependency for visual QA. Printed output is 612 × 792 points (US Letter). Live cloud RLS/authentication, real-provider responses, and Vercel deployment need integration verification after credentials are configured.

Reference documentation: [Next.js request cookies](https://nextjs.org/docs/app/api-reference/functions/cookies), [Supabase server-side authentication](https://supabase.com/docs/guides/auth/server-side), and [Supabase verified user lookup](https://supabase.com/docs/reference/javascript/auth-getuser).
