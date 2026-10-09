# Plan: Instagram Direct Publishing

## Summary
Publish approved assets straight to each client's Instagram (Business/Creator) from Spool. Meta fetches media from a presigned R2 URL, so bytes never touch the server; captions + hashtags are composed in-app. Per-client Facebook OAuth connect, encrypted token store mirroring `user_ai_settings`, queue-driven publish worker, and auto-mark-published so planner counts stay truthful.

## User Story
As an admin, I want to publish an approved asset to the client's Instagram with a caption + hashtags from inside Spool, so that delivery ends in-app instead of in a phone gallery.

## Problem → Solution
Approved assets stall at "send the file to someone's phone" → Spool holds per-client IG tokens and publishes via the Graph API, tracking container → published per queue row.

## Metadata
- **Complexity**: Large
- **Source PRD**: N/A
- **PRD Phase**: N/A (standalone; follows day-plan + storage work)
- **Estimated Files**: 16 (2 migrations, 2 schema, 1 OAuth pair, 1 IG client, 1 worker, 2 routes, 2 UI, types, api-client, crypto reuse, 2 tests)
- **External dependency**: Meta app + App Review (`instagram_content_publish`) — dev-mode works pre-review with test users only

---

## UX Design

### Before
```
Queue row: platform label "instagram", caption text, scheduled date.
Publishing = someone downloads the file and posts from a phone.
```

### After
```
Client page: "Connect Instagram" → Facebook OAuth → shows @handle + disconnect.
Asset/queue row: "Publish to Instagram" → composer (caption + hashtags,
prefilled from queue row) → Publish now / Schedule → status chip flows
pending → publishing → published (or failed with Meta's message + Retry).
```

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| Client detail | handle text only | + Connect status + button | admin, `portal:manage`-adjacent perm |
| Queue row | static platform tag | Publish button + composer + status | reuse existing caption/hashtags columns |
| Asset detail | approval buttons | + Publish (when connected + approved) | gated on `assets:approve` |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `src/db/schema/user-ai-settings.ts` | all | encrypted per-owner secret pattern to mirror |
| P0 | `src/lib/chat/crypto.ts` | 40-100 | AES-256-GCM encrypt/decrypt/mask + HKDF key derivation |
| P0 | `src/db/schema/upload-queue.ts` | all | platform/caption/hashtags/scheduled_date/status columns to extend |
| P0 | `src/services/asset-uploads.ts` | 102-160 | `finalizeAssetUpload` input shape + auth pattern |
| P0 | `src/integrations/r2/r2-service.ts` | 118-154 | `getPresignedDownloadUrl(key, ttl)` — container source URL |
| P1 | `app/api/cycles/route.ts` | 28-57 | zod + parseBody + service POST pattern |
| P1 | `lib/api-client.ts` | 1230-1309 | `cyclesApi` CRUD shape for `instagramApi` |
| P1 | `src/lib/background-queue.ts` | all | concurrency/dedupe/backoff fan-out to reuse for poll loop |
| P1 | `app/api/chat/route.ts` | all | internal-API-with-user-session precedent (NOT used by worker; see Gotcha) |
| P2 | `src/services/assets-service.ts` | 390-410 | `publishAssetWithRecord` path fired by status→published |

## External Documentation

| Topic | Source | Key Takeaway |
|---|---|---|
| Content publishing | Meta Graph API docs (`/{ig-user-id}/media`, `/media_publish`) | Two-step for video: container → poll `status_code===FINISHED` → publish; photo container publishes directly |
| Login + tokens | Meta Login review docs | `instagram_basic,instagram_content_publish,pages_show_list`; code → short token → `grant_fb_exchange_token` long-lived (~60d); discover IG id via `/me/accounts?fields=instagram_business_account` |
| Limits | Meta rate-limit docs | ~25 API publishes / account / 24h; caption ≤2200 chars, ≤30 hashtags; reels need `share_to_feed=true`, public presigned URL works as `video_url`/`image_url` |

---

## Patterns to Mirror

### OAUTH_CALLBACK
// SOURCE: app/api/auth/* routes + lib/app-url.ts
Build absolute redirect from `NEXT_PUBLIC_APP_URL`; `state` carries signed clientId; exchange server-side, never expose app secret.

### ENCRYPTED_SECRET
// SOURCE: src/db/schema/user-ai-settings.ts + src/lib/chat/crypto.ts
`encrypted_api_key/api_key_iv/api_key_tag` columns + `encryptApiKey/decryptApiKey/maskApiKey`; masked preview to UI, raw never leaves server.

### REPOSITORY_PATTERN
// SOURCE: src/repositories/service-cycles-repository.ts:66-80
Thin `insertX/updateX/listX` over inferred `Db*` types; no hand SQL except the advisory-lock precedent in numbering.

### SERVICE_PATTERN
// SOURCE: src/services/service-cycles-service.ts:172-208
`getOrCreateCurrentUserProfile()` → validate → insert → follow-on work → mapped DTO.

### TEST_STRUCTURE
// SOURCE: src/services/__tests__/plan-utils.test.ts
vitest `describe/it/toEqual` on pure builders (caption assembly, container payloads, status mapping).

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `src/db/schema/client-social-accounts.ts` (+ index export) | CREATE | `client_id unique, provider='instagram', ig_user_id, page_id, encrypted_token/iv/tag, token_expires_at, connected_by` |
| `drizzle/migrations/00XX_*.sql` | CREATE via `pnpm db:generate` | above table |
| `drizzle/migrations/00XY_*.sql` | CREATE via `pnpm db:generate` | queue adds: `ig_container_id, ig_media_id, attempts int default 0, last_error` |
| `src/integrations/instagram/client.ts` | CREATE | fetch-based Graph client: exchange/refresh token, IG-id discovery, container create/status/publish, error mapping — no new dep |
| `src/services/instagram-service.ts` | CREATE | connect/disconnect, token refresh-on-use, `publishNow(queueId)` (container→poll→publish→mark asset published), `runDueItems()` |
| `app/api/integrations/instagram/auth/route.ts` | CREATE | GET: redirect to FB dialog with signed state |
| `app/api/integrations/instagram/callback/route.ts` | CREATE | GET: code→tokens→IG id→upsert, redirect back with toast param |
| `app/api/queue/[id]/publish/route.ts` | CREATE | POST: caption/hashtags (≤2200/≤30 enforced) → service publishNow |
| `app/api/cron/publish-due/route.ts` | CREATE | GET with `CRON_SECRET`: runDueItems (Vercel Cron; note Hobby limits, manual Publish-now always works) |
| `components/clients/instagram-connect.tsx` | CREATE | status + connect/disconnect, reuse Badge/Button/Card styles |
| `components/queue/publish-dialog.tsx` | CREATE | caption + hashtag composer, reuse cycle-form-dialog Switch/Input styling |
| `lib/api-client.ts` | UPDATE | `instagramApi` mirroring `cyclesApi` |
| `src/types/index.ts` | UPDATE | `SocialAccount`, `PublishStatus`, queue row extensions |
| `src/services/__tests__/instagram-payload.test.ts` | CREATE | caption/hashtag validation, container bodies, status mapping |
| `.env.example` | UPDATE | `META_APP_ID/SECRET`, `CRON_SECRET` |

## NOT Building
- No stories/albums/Collabs posts (single photo + reels only, v1)
- No auto-posting without human tap except scheduled queue items (already a queue concept)
- No token cron-refresh daemon — refresh-on-use when expiry <7d (no always-on infra)
- No multi-image carousel, no comment management, no insights import
- No new avatar/media proxy — Meta pulls the presigned R2 URL directly (server never sees bytes)

---

## Step-by-Step Tasks

### Task 1: Token store + crypto reuse
- **ACTION**: schema table + migration + repository CRUD + service connect/disconnect/status
- **IMPLEMENT**: columns per Files table; `encryptApiKey/decryptApiKey` reused as-is; `maskApiKey` for UI display of connected handle expiry
- **MIRROR**: ENCRYPTED_SECRET + REPOSITORY_PATTERN
- **GOTCHA**: `user_ai_settings.user_id` has the only FK precedent — new table needs none; keep `client_id unique` (one IG per client, v1)
- **VALIDATE**: `pnpm db:generate && pnpm db:migrate`, row round-trips encrypted

### Task 2: OAuth pair
- **ACTION**: auth redirect + callback routes
- **IMPLEMENT**: `state` = signed `{clientId, nonce}` (HMAC via `getEncryptionKey`); callback exchanges code → short token → long-lived → `/me/accounts` → first `instagram_business_account` → upsert; errors redirect with `?ig=error`
- **MIRROR**: OAUTH_CALLBACK; zod query validation
- **GOTCHA**: redirect URI must match Meta dashboard entry exactly (`${APP_URL}/api/integrations/instagram/callback`); dev-mode apps only work for test users until review passes
- **VALIDATE**: connect a test-user IG, row appears with masked handle

### Task 3: Graph client (pure fetch)
- **ACTION**: `src/integrations/instagram/client.ts`
- **IMPLEMENT**: `createPhotoContainer(igId, token, {imageUrl, caption})`, `createReelContainer({videoUrl, caption, coverUrl?})`, `getContainerStatus`, `publishContainer`, `tokenRefresh`, typed `IgApiError` mapping `error.message/code`
- **MIRROR**: r2-service logging tags (`[ig][publish]`, never log tokens)
- **GOTCHA**: video containers need polling (`IN_PROGRESS`→`FINISHED`, expiry of container ~24h); caption assembled as `${caption}\n\n${hashtags}` with 2200/30 enforcement before send
- **VALIDATE**: unit tests with mocked fetch for payload shapes + error mapping

### Task 4: Publish worker + queue columns
- **ACTION**: queue migration + `instagram-service.publishNow/runDueItems`
- **IMPLEMENT**: presign R2 GET (TTL 2h) → container by asset mime → bounded poll (≤50s, Vercel `maxDuration=60`) → publish → `updateAsset(status published)` (fires publication record + planner counts) → queue row `published` + `ig_media_id`; failures → `failed` + `last_error` (raw Meta message, shown in UI + Retry)
- **MIRROR**: SERVICE_PATTERN; background-queue backoff constants for poll spacing
- **GOTCHA**: worker has no user session — service-layer auth via explicit `actorId` param, NOT `getCurrentUser`; route layer enforces `assets:approve`
- **VALIDATE**: publish a test photo + reel to a dev IG; retry-after-failure path

### Task 5: UI + client
- **ACTION**: `instagramApi`, connect component, publish dialog, queue status wiring
- **IMPLEMENT**: dialog prefillable caption/hashtags from queue row; status chip mirrors queue `status`; disconnect requires confirm (token row deleted)
- **MIRROR**: `cyclesApi` shape; dark `#161616` card classes; `["queue"]` invalidation like `useInvalidateAssetViews`
- **GOTCHA**: `QueryClient` has no refetchOnFocus — invalidate explicitly after publish transitions
- **VALIDATE**: `pnpm dev` click-through: connect → compose → publish now → status flips → asset shows published

---

## Testing Strategy

### Unit Tests
| Test | Input | Expected | Edge? |
|---|---|---|---|
| caption assembly | 2201 chars / 31 tags | rejected with message | yes |
| reel container body | videoUrl + caption | `media_type=REELS, share_to_feed=true` | no |
| status map | `ERROR` + code 9004 | failed + surfaced message | yes |
| token refresh | expiry in 3d | refresh called, new expiry stored | no |
| refresh skip | expiry in 30d | no call | no |

### Edge Cases Checklist
- [ ] No connected account → publish blocked with "connect first" message
- [ ] Container never finishes in 50s → row stays `publishing`, next run resumes by `ig_container_id`
- [ ] Meta daily limit hit → failed + Retryable message, no row loss
- [ ] Token expired mid-flow → one refresh attempt, then clear relink error
- [ ] Asset deleted mid-queue → worker skips gracefully

---

## Validation Commands

```bash
npx tsc --noEmit          # EXPECT: zero errors
npx vitest run            # EXPECT: all pass incl. new payload tests
pnpm db:migrate           # EXPECT: both migrations applied
pnpm dev                  # EXPECT: connect + publish click-through works
```

### Manual Validation
- [ ] Connect test-user IG → handle + expiry shown
- [ ] Publish photo now → appears on IG, asset published, planner counts move
- [ ] Publish reel → poll completes, same effects
- [ ] Schedule for later → cron/manual run publishes it
- [ ] Disconnect → publish blocked with guidance

---

## Acceptance Criteria
- [ ] All tasks completed, validations green, tests passing
- [ ] No new npm dependencies (fetch only)
- [ ] Server never proxies media bytes (presigned R2 URLs throughout)
- [ ] Raw tokens never reach the client (masked only)

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Meta App Review delay/rejection | Med | High (blocks prod) | dev-mode + test users unblock all engineering now |
| Vercel Hobby cron limits | Med | Low | Publish-now + manual due-run always work; cron is additive |
| Container stuck IN_PROGRESS | Low | Low | resume-by-id on next run; attempts counter surfaces chronic items |
| Token expiry unnoticed | Low | Med | refresh-on-use <7d + expiry shown in UI |

## Notes
Decisions locked with you: presigned-R2-direct (zero server bytes), captions + hashtags composed in Spool, all handles Business/Creator (personal-account path out of scope permanently). Upgrade trigger: carousels/stories/insights only after photo+reel flow is boring.
