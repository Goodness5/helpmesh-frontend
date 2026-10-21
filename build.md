# HelpMesh: Build Spec for the Cursor Agent

> Read this whole file before writing code. Work one phase at a time (Section 10). Do not start a phase until the previous phase's "Done when" checks pass.

## 0. Agent operating rules

1. **Accessibility is the product, not a feature.** The primary users are blind, low-vision, deaf, hard-of-hearing, motor-impaired, speech-impaired, cognitively disabled and elderly people. Every screen must be fully usable by each group. A screen that fails the accessibility gate (Section 11) is not done, even if it works visually.
2. **No path may depend on a single sense.** Anything conveyed by sound must also be text and visual. Anything conveyed by sight must also be available to a screen reader. Anything requiring fine motor control must have a simple alternative.
3. **AI and wallets must never be the only way to do something.** Every action has a plain form-based path that works with no AI call and no wallet popup.
4. **Money is invisible plumbing.** Users never see gas, seed phrases, chain names or hex addresses unless they open an "Advanced" section.
5. **Small commits, one task each.** After each task: run `pnpm lint && pnpm typecheck && pnpm test && pnpm test:a11y`. Fix failures before moving on.
6. **If a requirement is ambiguous or conflicts with another, stop and ask the user.** Do not guess on safety, payments or accessibility behavior.
7. **Never fake a security property.** If something is simulated for the demo (identity verification, dispute resolution), label it in code with `// DEMO-SIMULATED:` and list it in `docs/DEMO_SIMULATIONS.md`.

## 1. Product summary

HelpMesh is a global assistance network. A person requests help (for example, "I'm in a wheelchair and the station elevator is broken, I need help reaching platform 3") and chooses how it is helped:

| Mode | Meaning | Money flow |
|---|---|---|
| Volunteer | Requester cannot pay | None |
| Reward | Requester offers an amount | Requester funds escrow, released on confirmation |
| Sponsored | A fund pays | Sponsorship pool funds escrow if the request is eligible |
| Emergency | Needs professional help | No matching. Show local emergency numbers and a call/SMS action. Out of scope beyond this screen. |

Extras: tip after completion, donate to a helper, organizations create funds with eligibility rules. An AI layer parses requests, ranks helpers and explains options. Reputation is earned only from verified completions, never bought.

Tagline: **AI coordinates. Humans help. Communities fund.**

## 2. Accessibility requirements (the core of this spec)

### 2.1 Standards

- Meet **WCAG 2.2 Level AA** everywhere. Meet AAA contrast (7:1 body text) wherever the design allows, and always for the primary action and status text.
- Specifically honor the WCAG 2.2 additions: 2.4.11 Focus Not Obscured, 2.5.7 Dragging Movements (no drag-only actions), 2.5.8 Target Size (we use 48x48 CSS px minimum, stricter than the 24px floor), 3.2.6 Consistent Help, 3.3.7 Redundant Entry, 3.3.8 Accessible Authentication (no cognitive tests, no CAPTCHA that relies on puzzles; passkeys and email links are fine).
- Follow the ARIA Authoring Practices patterns. Prefer native HTML elements over ARIA. No ARIA is better than bad ARIA.

### 2.2 User groups and what each needs

**Blind and screen-reader users (VoiceOver iOS/macOS, TalkBack, NVDA, JAWS)**
- Logical heading outline: one `h1` per page, no skipped levels.
- Landmarks: `header`, `nav`, `main`, `footer`, plus `aria-label` when more than one of a type.
- A "Skip to main content" link as the first focusable element.
- Every control has an accessible name. Icon-only buttons need `aria-label`. Decorative icons use `aria-hidden="true"`.
- Status changes announced via live regions: a single global `<div aria-live="polite" role="status">` and an `assertive` one for urgent items (helper arrived, SOS). Build one `useAnnounce()` hook; do not scatter ad-hoc live regions.
- On client-side navigation, move focus to the new page's `h1` and update `document.title`.
- The helper list is a real list (`ul`/`li`) with each item readable in one pass: "Daniel, 300 meters away, identity verified, 87 completed, accepts rewards, button: Choose Daniel".
- **No map as primary UI.** Maps are inaccessible by default. The default view is a ranked list with distance and compass direction text ("300 meters north-east"). A map may exist behind a "Show map" toggle and must never hold unique information.
- Forms: visible `label` for every input, errors linked via `aria-describedby`, error summary at the top that receives focus on failed submit, `autocomplete` attributes set.
- Do not use placeholder text as a label. No auto-advancing carousels. No content that appears only on hover.

**Low-vision users**
- Reflow with no horizontal scroll down to 320px width and at 400% zoom.
- All sizing in `rem`. Text must scale to 200% with no loss of function.
- Support `prefers-contrast: more` with a higher-contrast token set, and a manual high-contrast toggle in settings. Support light, dark and system themes.
- Never use color alone to carry meaning. Pair color with text and an icon (for example the escrow state "Held" is amber **and** says "Held in escrow").
- Visible focus ring on every focusable element: 3px, 3:1 contrast against adjacent colors, never removed. Focus must not be hidden behind sticky headers.
- User-selectable text size (Normal, Large, Extra large) and the font **Atkinson Hyperlegible** (designed for low vision) as default. Provide a dyslexia-friendly option (OpenDyslexic or Lexend).

**Deaf and hard-of-hearing users**
- No information is ever audio-only. Notifications go through text, visual (banner, flashing is forbidden, see below) and **haptic** channels (`navigator.vibrate` pattern, web push with vibrate).
- Any audio or video content must have captions. In the demo, any narration is captioned.
- Any helper-to-requester voice call is **optional**; the default channel is in-app text chat with quick-reply chips ("I'm here", "I'm at the entrance", "Please wait 2 minutes", "I can't hear you, I'll text").
- Accessibility profile (Section 2.3) lets a requester set "Communicate by: text only, writing/gestures in person". This is shown prominently to the helper before they accept.
- Offer a "Show this to the helper" full-screen card: large text of the requester's need and communication preference, readable at arm's length.
- Never rely on sound cues such as chimes without a visual equivalent.

**Motor and dexterity impairments (switch access, voice control, eye tracking, tremor)**
- Everything operable by keyboard alone and by sequential switch navigation. Logical tab order matching visual order.
- Targets at least 48x48 px with 8px spacing. No tiny close icons.
- No drag-and-drop, no swipe-only gestures, no long-press-only actions, no precision gestures, no hover-only menus. Provide button alternatives.
- No time limits that cannot be extended. If a session or offer window expires, warn at least 60 seconds before and allow extension with one action.
- Support voice control: visible labels must match accessible names (WCAG 2.5.3 Label in Name) so "Click Choose Daniel" works.
- Request creation must be completable in at most 3 taps/steps for the most common cases (template buttons, Section 9.2).

**Speech-impaired and non-verbal users**
- Full functionality with no voice input and no voice call. Quick phrases, text chat, and "Show this to the helper" cards.
- Optional text-to-speech "Say this" button on quick phrases, using the browser `speechSynthesis` API, so a non-verbal person can speak a phrase aloud to a helper.

**Cognitive, learning and neurodivergent users, and elderly users**
- Plain language, reading level around grade 6. One primary action per screen. Short steps with a visible "Step 2 of 4" indicator (text, not only a bar).
- Consistent layout and navigation across pages. Consistent help: a "Get help with this app" link in the same place on every page.
- Confirm destructive or money-moving actions with a summary screen in plain words ("You will lock $10. It is only paid to Daniel after you confirm.") and an easy undo or cancel where possible.
- `prefers-reduced-motion` respected: disable all non-essential animation. **No flashing content over 3 times per second, ever.**
- Forgiving input: accept amounts as "10", "$10", "10.00". Save drafts. Never make the user re-enter data (WCAG 3.3.7).
- Avoid jargon: say "held safely until you confirm" instead of "escrow", "your wallet" instead of "account abstraction". Provide a glossary page.

**Users with limited connectivity or older devices**
- Pages work as server-rendered HTML first; core flows work with JavaScript slow to load. Keep the JS bundle small. Test on throttled "Slow 4G".

### 2.3 Accessibility profile (data and UX)

Collected in onboarding, editable any time, shown only with the user's consent. Fields:

```ts
type AccessibilityProfile = {
  disabilities: ('blind'|'low_vision'|'deaf'|'hard_of_hearing'|'mobility'|'wheelchair'|'speech'|'cognitive'|'elderly'|'other')[]; // all optional, never required
  communicate: ('text'|'voice'|'gestures'|'sign_language'|'written_notes')[];
  needsSummary?: string;       // free text, e.g. "I use a power wheelchair, need help with a step"
  ui: { textSize:'normal'|'large'|'xlarge'; theme:'system'|'light'|'dark'|'high_contrast'; reduceMotion:boolean; font:'default'|'dyslexia'; haptics:boolean; speakAnnouncements:boolean };
  shareWithHelper: boolean;    // controls what a matched helper sees
};
```

Rules: the profile is **never required to use the app**. UI preferences apply immediately and persist (cookie for logged-out, DB for logged-in). Detect `prefers-reduced-motion`, `prefers-color-scheme`, `prefers-contrast` as defaults.

### 2.4 Helper-side accessibility

Helpers can have disabilities too (a deaf helper can help a blind requester with a task). The helper app obeys all rules above. Helpers declare **what they can do** (skills: wheelchair assist, guide for blind, sign language, reading/translating, errands, companionship) and **how they communicate**.

### 2.5 In-person safety (required because help happens in the physical world)

- Identity verification status shown to both sides (demo: simulated badge, see Section 12).
- Share-live-status link with a trusted contact (text-only link, no app needed).
- Large always-visible "I need help now" control in an active session: opens options to message the platform, call local emergency number (tel: link), or notify the trusted contact.
- Check-in prompt when a session runs longer than the estimate, answerable with one button.
- Meet in public places by default; the app suggests this.
- Either party can cancel safely at any time with a reason chip.

## 3. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js (latest stable, App Router), React, TypeScript strict | Server components by default. Server-render core pages. |
| Styling | Tailwind CSS with design tokens as CSS variables | Tokens for the contrast sets and text sizes |
| Accessible primitives | **react-aria-components** (Adobe) | Handles focus, keyboard, screen-reader semantics for dialogs, menus, tabs, comboboxes. Use these instead of hand-rolled widgets. |
| Forms | react-hook-form + zod | Error summary component is custom (Section 2.2) |
| i18n | next-intl | Ship English; structure all strings for translation. RTL-safe CSS (logical properties). |
| DB | Postgres (Neon or Supabase) with PostGIS or a Haversine function | Drizzle ORM |
| Auth | Passkeys / email magic link. **Privy or Dynamic embedded wallets** so wallets are created invisibly | No seed phrases, no browser extension needed |
| Chain | EVM L2 testnet (Base Sepolia by default, chain id in env so it can change) | Test USDC (mintable ERC-20 deployed by us) |
| Contracts | Foundry, OpenZeppelin | Tests in Solidity |
| Chain client | viem (+ wagmi only where hooks help) | |
| Gas | Sponsored via paymaster/relayer so users hold no gas token | Server-side relayer is acceptable for the hackathon |
| Attestations | Ethereum Attestation Service (EAS) if available on the chosen chain, else our own `HelpAttestations` contract | |
| AI | Anthropic API from server routes only. Model: `claude-sonnet-5-5`. Structured output validated with zod | Never call from the browser. Key in env. |
| Realtime | SSE or Supabase Realtime for request status and chat | Must also work via polling fallback |
| Notifications | Web Push (with vibrate), email, in-app banner + live region | Never audio-only |
| Testing | Vitest, Playwright, `@axe-core/playwright`, Foundry tests | |
| Lint | ESLint with `eslint-plugin-jsx-a11y` (strict), Prettier | |
| Hosting | Vercel | |

## 4. Repository layout

```
/app
  (marketing)/page.tsx                 landing + demo entry
  (app)/
    onboarding/                        accessibility profile wizard
    request/new/                       create request (3 input modes)
    request/[id]/                      status, helpers, chat, active session
    helper/                            open requests nearby, my tasks
    wallet/                            balance, history, tip, withdraw (demo)
    fund/                              donor: create/fund pools, see impact
    profile/[id]/                      public helper profile + reputation
    settings/accessibility/            all UI prefs
    help/                              plain-language help + glossary
  api/
    ai/parse-request/route.ts
    ai/rank-helpers/route.ts
    requests/...                       CRUD + state transitions
    escrow/...                         build/relay on-chain calls
    notifications/...
/components
  a11y/ (SkipLink, Announcer, FocusOnMount, ErrorSummary, VisuallyHidden, ShowToHelper)
  ui/   (Button, Field, Dialog, Toast, StepIndicator, StatusBadge...) built on react-aria-components
/lib      (db, auth, chain, ai, matching, i18n, announce)
/contracts (src, test, script)  Foundry project
/docs     (A11Y_CHECKLIST.md, DEMO_SIMULATIONS.md, ARCHITECTURE.md)
/e2e      Playwright specs incl. axe + keyboard-only flows
.cursor/rules/accessibility.mdc   (content in Appendix A)
```

## 5. Data model (Postgres)

```
users(id, email, display_name, role: requester|helper|both|donor|org_admin,
      wallet_address, identity_status: unverified|demo_verified, created_at)
accessibility_profiles(user_id PK, jsonb profile, share_with_helper bool)
helper_profiles(user_id PK, skills text[], accepts_free bool, accepts_paid bool,
                available bool, home_lat, home_lng, radius_m, bio)
requests(id, requester_id, category, title, description, mode: volunteer|reward|sponsored|emergency,
         amount_cents, currency, lat, lng, place_text, status, helper_id null,
         pool_id null, escrow_id null, created_at, accepted_at, completed_at)
request_events(id, request_id, type, actor_id, payload jsonb, created_at)   -- audit trail
messages(id, request_id, sender_id, body, kind: text|quick_reply|system, created_at)
tips(id, from_user, to_user, request_id null, amount_cents, tx_hash)
helper_donations(id, from_user, to_helper, amount_cents, tx_hash)
funding_pools(id, owner_id, name, description, balance_cents, rules jsonb,
              contract_address)   -- rules: categories[], max_per_request, region, eligibility[]
reputation_events(id, helper_id, request_id, kind: completed|disputed|cancelled, attestation_uid)
trusted_contacts(id, user_id, name, channel, destination, share_token)
```

Request status machine (enforce server-side, log every transition in `request_events`):

```
draft -> open -> matched -> funded -> in_progress -> completed_pending_confirm -> completed
                                \-> cancelled        \-> disputed -> resolved_release | resolved_refund
open -> expired (no helper in window)
```

Volunteer requests skip `funded`. Emergency requests never enter this machine.

## 6. Smart contracts (Foundry + OpenZeppelin)

### 6.1 `MockUSDC`
ERC-20, 6 decimals, public `faucet()` capped per address for demo.

### 6.2 `HelpEscrow`
Holds funds per request until confirmation.

```
struct Escrow { address requester; address helper; address token; uint256 amount;
                uint64 createdAt; uint64 deadline; State state; }
enum State { None, Funded, Released, Refunded, Disputed }
```

Functions:
- `fund(bytes32 requestId, address helper, address token, uint256 amount, uint64 deadline)`: pulls tokens from requester (or from `SponsorPool` via `fundFromPool`). Reverts if the id exists.
- `confirm(bytes32 requestId)`: callable by requester only; transfers amount to helper; state `Released`; emits `Released`.
- `refund(bytes32 requestId)`: requester may refund **only before** the helper has marked started, or after `deadline` if helper never confirmed arrival. Otherwise reverts.
- `markStarted(bytes32 requestId)`: helper only; blocks requester refund.
- `dispute(bytes32 requestId)`: either party; freezes funds; state `Disputed`.
- `resolve(bytes32 requestId, bool releaseToHelper)`: `onlyRole(ARBITER_ROLE)`. DEMO-SIMULATED arbiter: a platform-controlled address.
- `autoRelease(bytes32 requestId)`: anyone may call after `deadline + 48h` if helper marked started and requester neither confirmed nor disputed.
- Add `ReentrancyGuard`, `SafeERC20`, `Pausable`. No platform fee in v1.

Events: `Funded`, `Started`, `Released`, `Refunded`, `Disputed`, `Resolved`. The app listens to these (or reconciles via the relayer's receipts) to update DB status.

### 6.3 `SponsorPool`
- `deposit(uint256 amount)` by any donor; tracks per-donor contributions for a transparent impact page.
- `releaseToEscrow(bytes32 requestId, address helper, uint256 amount)`: only callable by `ELIGIBILITY_SIGNER_ROLE` (the server) after it verifies the pool rules off-chain. Enforce on-chain: `amount <= maxPerRequest` and `amount <= balance`.
- Pool rules (categories, region, eligibility) live off-chain in `funding_pools.rules`, with the rule hash stored on-chain so it is auditable.

### 6.4 Attestations
On `completed`, the server (as attester) writes an attestation: `{helperAddress, requestIdHash, category, completedAt, requesterConfirmed:true}`. Use EAS if available, else `HelpAttestations.attest(...)` emitting an event. Reputation is **computed from attestations and dispute history only**. A test must assert that no tip, donation or reward amount feeds the reputation score.

### 6.5 Contract tests (must pass)
fund then confirm pays helper; double confirm reverts; non-requester cannot confirm; refund before start works; refund after start reverts; dispute freezes then resolve pays correct side; autoRelease only after window; pool cap enforced; unauthorized pool release reverts; reentrancy test; fuzz amounts.

Deploy scripts write addresses to `contracts/deployments/<chainId>.json` and the app reads them from there.

## 7. API and server logic

All state transitions go through server routes that (1) authenticate, (2) authorize by role and ownership, (3) validate with zod, (4) apply the status machine, (5) write `request_events`, (6) emit a notification. Never trust client-sent status.

Key endpoints:
- `POST /api/requests` create draft/open. `POST /api/requests/:id/accept` (helper). `POST /api/requests/:id/start`, `/complete`, `/confirm`, `/cancel`, `/dispute`.
- `POST /api/escrow/prepare` returns a transaction plan; the server relays it with gas sponsorship, so the user taps one button "Lock $10".
- `GET /api/helpers/nearby?requestId=` returns ranked helpers (Section 8.2).
- `POST /api/tips`, `POST /api/donations`, `POST /api/pools`, `POST /api/pools/:id/deposit`.
- `GET /api/events/:requestId` SSE stream; `GET /api/requests/:id` for polling fallback.

Rate-limit all write endpoints. Log no personal data in server logs.

## 8. AI orchestration

AI is an **assistant layer**. Every AI feature has a non-AI fallback and is clearly labeled "Suggested by AI".

### 8.1 Request intake: `POST /api/ai/parse-request`
Input: free text or speech transcript plus the user's accessibility profile (only if `shareWithHelper` or the user is the requester). Output (zod-validated JSON, no prose):

```ts
{ category: 'mobility'|'vision'|'hearing'|'errand'|'companionship'|'transport'|'home'|'other',
  title: string,            // <= 60 chars, plain language
  needSummary: string,      // what the helper must do, <= 200 chars
  urgency: 'now'|'today'|'scheduled',
  estimatedMinutes: number,
  suggestedMode: 'volunteer'|'reward'|'sponsored',
  suggestedAmountCents?: number,
  isEmergency: boolean,     // if true: stop and show emergency screen, no matching
  clarifyingQuestion?: string }  // at most one
```
System prompt requirements: plain language, no medical advice, never diagnose, treat any mention of danger, injury or medical emergency as `isEmergency: true`, never invent details. If the call fails or the JSON does not validate, show the manual form with the user's text pre-filled. Never lose the user's input.

### 8.2 Helper ranking: `GET /api/helpers/nearby`
Ranking is **deterministic code** first, AI only explains.
Hard filters: available, within radius, skill match, mode compatibility (free requests only show `accepts_free`), not blocked. Score = weighted sum of distance, skill match, verified status, completion count, success rate, response time. **Payment amount must not boost rank above a free helper who is closer and better matched.** Then call the LLM to write a one-sentence plain-language recommendation, for example: "Two verified volunteers are nearby. Priya is 650 m away and accepts free requests." Return both the ranked data and the sentence.

### 8.3 Accessible conversational mode (optional, Phase 6)
A chat panel that wraps 8.1 and asks at most one question at a time. Must be a real `role="log"` region, keyboard operable, with each AI message announced politely and no auto-scrolling that steals focus. Voice input via Web Speech API is **progressive enhancement** only (check support, never required, always show the transcript for editing before submit).

### 8.4 Guardrails
Prompt-injection safe: treat user text as data. Never let model output trigger a payment or state transition directly; it only fills form fields the user then confirms. Log model name and a request id, not content.

## 9. Screens and their accessible behavior

### 9.1 Onboarding
Three short steps: (1) choose role (needs help / want to help / want to fund), (2) optional accessibility profile with "Skip for now" always visible, (3) UI preferences with a live preview. Every step reachable by keyboard; progress as text "Step 2 of 3".

### 9.2 Create request (three input modes, all equivalent)
- **Templates**: large buttons "Help with stairs or steps", "Guide me", "Read something for me", "Carry something", "Company or conversation", "Something else". One tap pre-fills category.
- **Form**: need text, place (text with browser geolocation as optional helper, never required), mode radio group (Free, Reward, Sponsored) with amount chips ($5, $10, $20, custom).
- **Describe it (AI)**: type or dictate; result goes to the form for review.
The summary screen states in plain words what will happen and what it costs before submit.

### 9.3 Request status (requester)
Single status headline at top (`h1`) that updates and is announced: "Looking for helpers", "Daniel accepted", "Daniel is 3 minutes away", "Help completed". A text timeline lists events. Contains: helper card, chat with quick replies, "Show this to the helper" card, SOS control, cancel. Funds line: "$10 held safely, not paid yet".

### 9.4 Helper app
Nearby open requests as a list (no map needed), each stating need, distance, estimated time, reward or "Volunteer", and the requester's communication preference **before** accepting. Accept needs one confirm. After accept: directions as text steps plus an optional link to the phone's native maps app.

### 9.5 Confirm, tip, thank
After helper marks complete, requester gets a push, banner and live-region announcement. One large "Yes, help was completed" button, one "There was a problem" button. Then optional thank-you chips ($2, $5, $10, custom) and "Skip". Release happens on confirm.

### 9.6 Wallet
Plain-language balance, a history list, tips received, "Cash out" (DEMO-SIMULATED). Advanced section (collapsed): address, chain, explorer links.

### 9.7 Donor and organization
Create fund (name, purpose, rules: categories, region, max per request), deposit, impact page ("Your $500 paid for 38 requests"), transparent on-chain flow list. Rules form uses accessible fieldsets and a rule preview sentence.

### 9.8 Helper profile
Counts by category, people helped, reputation (computed), badges for verified identity and credentials, "Support this helper" donate button. Reputation explanation text: "Reputation comes only from confirmed help. Money cannot raise it."

## 10. Phased build plan with acceptance criteria

Time-box to the November final. Dates assume starting October 8, 2026; adjust to the actual final date.

**Phase 0: Setup (Day 1)**
Tasks: init Next.js TS strict, Tailwind, ESLint with jsx-a11y strict, Prettier, Vitest, Playwright + axe, Foundry project, CI workflow running lint/typecheck/unit/a11y, `.cursor/rules` file (Appendix A), `docs/A11Y_CHECKLIST.md`.
Done when: CI is green on an empty app; one Playwright test runs axe on the home page with zero violations.

**Phase 1: Accessibility foundation and design system (Days 2-4)**
Tasks: tokens (4 themes x 3 text sizes), fonts, `SkipLink`, `Announcer` + `useAnnounce`, focus-on-navigate, `ErrorSummary`, `Button`, `Field`, `Dialog`, `StatusBadge`, `StepIndicator`, accessibility settings page with live preview and persistence, reduced-motion handling.
Done when: all components have Playwright keyboard tests; axe has zero violations at 320px, 400% zoom, each theme; settings persist after reload; manual VoiceOver or NVDA pass recorded in `docs/A11Y_CHECKLIST.md`.

**Phase 2: Auth, onboarding, profiles (Days 5-6)**
Tasks: passkey/email auth with embedded wallet creation, onboarding flow, accessibility profile CRUD, helper profile CRUD, DB schema + migrations + seed.
Done when: a new user finishes onboarding keyboard-only in under 2 minutes; profile "skip" works; no wallet jargon visible.

**Phase 3: Request lifecycle without money (Days 7-10)**
Tasks: create request (templates + form), status machine + event log, helper nearby list (deterministic ranking), accept/start/complete/confirm, chat with quick replies, SSE + polling fallback, notifications (banner + live region + web push with vibrate), "Show this to the helper" card, SOS control, trusted contact link.
Done when: two browsers complete a Volunteer request end to end; every status change is announced to a screen reader; the whole flow passes axe and a keyboard-only Playwright run; works with JS throttled.

**Phase 4: Contracts (Days 7-11, parallel)**
Tasks: MockUSDC, HelpEscrow, SponsorPool, attestations, full test suite (6.5), deploy scripts, deployments JSON.
Done when: `forge test` green incl. fuzz; deployed on the testnet; addresses committed.

**Phase 5: Payments integration (Days 12-15)**
Tasks: relayer + gas sponsorship, `/api/escrow/prepare`, Reward flow (fund, hold, confirm, release), tips, helper wallet view, event listener/reconciler, plain-language money copy, cancel/refund and dispute paths (arbiter simulated).
Done when: Reward request completes with real testnet txs and the UI never shows gas or hex addresses outside Advanced; a failed tx shows a clear plain-language recovery message; funds-state line announced on every change.

**Phase 6: AI layer (Days 16-18)**
Tasks: parse-request with zod and fallback, ranking explanation sentence, optional accessible chat mode, optional voice dictation with transcript review, eval set of 20 sample requests including emergencies and adversarial text.
Done when: all 20 evals behave (emergency detection 100% on the emergency samples); AI off (env flag) leaves every flow fully working.

**Phase 7: Sponsorship and funding (Days 19-21)**
Tasks: pool creation with rules, deposit, eligibility check + `releaseToEscrow`, Sponsored mode in the request flow, donor impact page, donate-to-helper, org fund example ("Accessibility Fund").
Done when: a Sponsored request is paid from a pool with correct cap enforcement; impact page matches on-chain data.

**Phase 8: Reputation and trust (Days 22-23)**
Tasks: write attestations on completion, compute reputation from attestations + disputes only, public helper profile, unit test proving money does not affect score.
Done when: profile shows verified history with link to an attestation; the "money cannot raise reputation" test passes.

**Phase 9: Hardening and audit (Days 24-26)**
Tasks: full `docs/A11Y_CHECKLIST.md` run with a real screen reader (VoiceOver + one of NVDA/TalkBack), voice control, switch-style keyboard test, 400% zoom, high-contrast, reduced motion, slow network. Fix every issue. Security pass (authz on every route, rate limits, input validation). Seed demo data.
Done when: zero axe violations on every route; checklist fully ticked or each exception documented.

**Phase 10: Demo (Days 27-30)**
Tasks: demo mode with seeded personas (Maria requester, Daniel/Priya helpers, an org fund), a "fast-forward" control for waiting periods, a scripted 3-minute run, screen-reader walkthrough clip with captions, fallback recorded video, pitch deck assets.
Done when: the demo runs three times in a row without intervention and works offline-tolerant (cached seed + testnet fallback to a mocked chain with a visible "demo chain" label).

## 11. Quality gates (every PR)

Automated: `pnpm lint` (jsx-a11y strict), `pnpm typecheck`, `pnpm test`, `pnpm test:a11y` (Playwright + axe on every route in every theme and at 320px), `forge test`.
Manual per screen (tick in `docs/A11Y_CHECKLIST.md`):
1. Tab through the whole screen: order logical, focus always visible, no traps, Esc closes dialogs and focus returns to the trigger.
2. Screen reader: read the page top to bottom; every control has a name and role; all status changes are announced once, not repeated.
3. 200% text and 400% zoom: no clipped text or lost function.
4. High-contrast and dark themes readable; no color-only meaning.
5. Reduced motion respected; nothing flashes.
6. Voice control: visible label equals accessible name.
7. Target sizes at least 48px.
8. Copy is plain language and has no jargon.

Do not mark a task done if any item fails.

## 12. Security, privacy, honesty

- Disability and location data is sensitive. Collect the minimum, encrypt at rest, show helpers only what the requester consented to, and delete on request. Round exact location until a helper is matched.
- Authorize every route by ownership and role. Server enforces the status machine.
- Escrow contract: audited patterns only (OpenZeppelin), no admin ability to take user funds.
- Be honest in the demo: identity verification and arbiter dispute resolution are simulated; list them in `docs/DEMO_SIMULATIONS.md`. Testnet funds only; label them as test money in the UI.
- Do not market the app as emergency or medical service.

## 13. Out of scope for the hackathon (describe in the pitch only)

Real KYC, fiat on/off-ramps, mainnet, organization admin dashboards beyond one fund, multi-language beyond English structure, native mobile apps (the web app must be PWA-installable if time permits), Emergency mode beyond the redirect screen.

## 14. Environment variables

```
DATABASE_URL=
NEXT_PUBLIC_CHAIN_ID=84532
RPC_URL=
RELAYER_PRIVATE_KEY=          # server only, testnet only
ELIGIBILITY_SIGNER_KEY=       # server only
ANTHROPIC_API_KEY=            # server only
AI_ENABLED=true
PRIVY_APP_ID= / PRIVY_APP_SECRET=
VAPID_PUBLIC_KEY= / VAPID_PRIVATE_KEY=
DEMO_MODE=false
```

## 15. Open decisions to ask the user before Phase 2

1. Target chain and testnet (default Base Sepolia).
2. Embedded wallet provider (Privy vs Dynamic vs own relayer only).
3. Region/currency for the demo and emergency numbers shown.
4. Whether EAS is available on the chosen chain, else use our own attestation contract.
5. Real testers: ask the user to recruit at least one blind and one deaf tester for Phase 9 if possible.

## Appendix A: `.cursor/rules/accessibility.mdc`

```
---
description: HelpMesh accessibility rules, always apply
alwaysApply: true
---
- This app is for disabled users. Accessibility failures are P0 bugs.
- Use native HTML first; use react-aria-components for complex widgets. Never build custom dialogs, menus, tabs or comboboxes from divs.
- Every interactive element: accessible name, keyboard operable, visible 3px focus ring, 48x48px minimum target.
- Never convey information by color alone, sound alone, or hover alone.
- No drag-only, swipe-only, long-press-only, or time-limited interactions.
- Every status change goes through useAnnounce(). On route change, focus the h1 and set document.title.
- Forms: visible labels, aria-describedby for errors, ErrorSummary on submit failure, autocomplete set.
- Text in rem; layouts reflow to 320px; support 400% zoom; respect prefers-reduced-motion, prefers-contrast, prefers-color-scheme. Never flash content.
- Maps never hold unique information; list view is primary.
- Plain-language copy (grade 6). No blockchain jargon in the primary UI: say "held safely", not "escrow"; never show gas, chain or hex addresses outside Advanced.
- AI output only fills fields for the user to confirm; every AI feature has a non-AI fallback.
- Run lint, typecheck, tests and the axe suite after each task. Do not mark a task done if it fails.
```