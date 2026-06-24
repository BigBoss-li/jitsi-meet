---
work_package_id: WP02
title: react/features/custom-xmpp/ 特性模块
dependencies: []
requirement_refs:
- FR-001
- FR-002
- FR-005
- FR-006
- FR-008
- NFR-001
- NFR-002
- NFR-003
- NFR-004
- C-001
- C-002
- C-003
- C-006
tracker_refs: []
planning_base_branch: meeting/develop
merge_target_branch: meeting/develop
branch_strategy: Planning artifacts for this mission were generated on meeting/develop. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into meeting/develop unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-custom-xmpp-command-and-event-01KVVVG9
base_commit: b81f2bdabd966b47492b8bb0c095a05093cb7702
created_at: '2026-06-24T05:55:34.264626+00:00'
subtasks:
- T005
- T006
- T007
- T008
- T009
- T010
agent: node-norris
shell_pid: '23381'
history:
- timestamp: '2026-06-24T04:15:00Z'
  action: created
  by: spec-kitty.tasks
agent_profile: node-norris
authoritative_surface: react/features/custom-xmpp/
create_intent: []
execution_mode: code_change
model: sonnet
owned_files:
- react/features/custom-xmpp/**
role: implementer
tags: []
---

## ⚡ Do This First: Load Agent Profile

Before reading any other section of this prompt, the implementing agent **must** load the assigned agent profile via `/ad-hoc-profile-load node-norris`. This loads Node.js + Redux + jitsi-meet middleware conventions into your working memory. Do not skip this step.

## Objective

Create the entire `react/features/custom-xmpp/` feature module: action types, scoped logger, payload validation/encode/decode functions, action creators, the redux middleware that handles both the send and the receive paths, and the barrel export. This module is the heart of the feature.

## Context

The new command and event both run through this module. On the **send** side, when a host page calls `api.executeCommand('sendCustomXmppCommand', { target, payload })`, the existing dispatch machinery calls `APP.API.sendCustomXmppCommand(target, payload)` (added in WP01+WP03); the iframe-side reducer turns that into a `SEND_CUSTOM_XMPP_COMMAND` redux action; **this** module's middleware validates the payload, JSON-encodes it, and calls `conference.sendPrivateTextMessage(target, jsonString)`. On the **receive** side, this module subscribes to `JitsiConferenceEvents.PRIVATE_MESSAGE_RECEIVED`, parses the body as JSON, validates the result is a non-null object, and dispatches `CUSTOM_XMPP_EVENT_RECEIVED` with the parsed payload (which WP03 forwards to the host page).

Reference data model: [`data-model.md`](../data-model.md).
Reference contract: [`contracts/custom-xmpp.md`](../contracts/custom-xmpp.md).

## Detailed Guidance

### T004 — `react/features/custom-xmpp/actionTypes.ts`

Define exactly two action types as `export default` (or named exports — match the project's existing convention by glancing at `react/features/chat/actionTypes.ts`):

```ts
export const SEND_CUSTOM_XMPP_COMMAND = 'SEND_CUSTOM_XMPP_COMMAND';
export const CUSTOM_XMPP_EVENT_RECEIVED = 'CUSTOM_XMPP_EVENT_RECEIVED';
```

The wire name `SEND_CUSTOM_XMPP_COMMAND` matches what the iOS / Android native bridge uses (kept identical across platforms). The Redux store key path will pick this up by import.

### T005 — `react/features/custom-xmpp/logger.ts`

Use the project's standard jitsi-meet logger pattern. Look at any neighbouring `react/features/<feature>/logger.ts` (e.g. `react/features/chat/logger.ts`) and copy the shape exactly:

```ts
import { getLogger } from '../../base/log/functions';

export default function getCustomXmppLogger() {
    return getLogger('jitsi-meet/custom-xmpp');
}
```

The exact logger name can match neighbouring features; the pattern is `jitsi-meet/<feature>`.

### T006 — `react/features/custom-xmpp/functions.ts`

Implement three pure functions:

```ts
export const MAX_CUSTOM_XMPP_PAYLOAD_BYTES = 16 * 1024;

export type ValidationResult =
    | { ok: true; serialised: string }
    | { ok: false; reason: 'invalidPayload' | 'payloadTooLarge' };

export function validateCustomXmppPayload(payload: unknown): ValidationResult {
    if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
        return { ok: false, reason: 'invalidPayload' };
    }
    const action = (payload as { action?: unknown }).action;
    if (typeof action !== 'string' || action.length === 0) {
        return { ok: false, reason: 'invalidPayload' };
    }
    let serialised: string;
    try {
        serialised = JSON.stringify(payload);
    } catch {
        return { ok: false, reason: 'invalidPayload' };
    }
    if (serialised.length > MAX_CUSTOM_XMPP_PAYLOAD_BYTES) {
        return { ok: false, reason: 'payloadTooLarge' };
    }
    return { ok: true, serialised };
}

export function tryDecodeCustomXmppMessage(body: string): Record<string, unknown> | undefined {
    try {
        const parsed = JSON.parse(body);
        if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return undefined;
        }
        return parsed as Record<string, unknown>;
    } catch {
        return undefined;
    }
}
```

Notes:

- The 16 KiB cap is a project-level constant; export it so tests / docs can reference it.
- `action` validation matches spec FR-005: a non-empty string is the only required key.
- `JSON.stringify` failure covers BigInt, circular refs, and other non-serialisable shapes.

### T007 — `react/features/custom-xmpp/actions.ts`

Two action creators:

```ts
import { CUSTOM_XMPP_EVENT_RECEIVED, SEND_CUSTOM_XMPP_COMMAND } from './actionTypes';
import type { ValidationResult } from './functions';

export function sendCustomXmppCommand(target: string, payload: unknown) {
    return { type: SEND_CUSTOM_XMPP_COMMAND, target, payload };
}

export function customXmppEventReceived(payload: Record<string, unknown>) {
    return { type: CUSTOM_XMPP_EVENT_RECEIVED, payload };
}
```

If you want stricter typing, you can constrain `payload` to `Record<string, unknown>` at the action creator signature too; the validation function will reject non-objects before they ever reach here.

### T008 — `react/features/custom-xmpp/middleware.ts` (the meat)

This is the largest file. Two responsibilities:

1. **Send path** — handle the `SEND_CUSTOM_XMPP_COMMAND` action: validate, encode, dispatch to `conference.sendPrivateTextMessage`.
2. **Receive path** — on `CONFERENCE_JOINED`, attach a `JitsiConferenceEvents.PRIVATE_MESSAGE_RECEIVED` listener. On every received message, parse the body, dispatch `customXmppEventReceived`.

Skeleton:

```ts
import { CONFERENCE_JOINED } from '../base/conference/actionTypes';
import {
    JitsiConferenceEvents
} from '../base/lib-jitsi-meet';
import { MiddlewareRegistry } from '../base/redux';
import { sendCustomXmppCommand, customXmppEventReceived } from './actions';
import { SEND_CUSTOM_XMPP_COMMAND } from './actionTypes';
import {
    tryDecodeCustomXmppMessage,
    validateCustomXmppPayload
} from './functions';
import logger from './logger';

MiddlewareRegistry.register((store) => next => action => {
    switch (action.type) {
    case CONFERENCE_JOINED: {
        const { conference } = action;
        conference.on(
            JitsiConferenceEvents.PRIVATE_MESSAGE_RECEIVED,
            (_participantId: string, message: string) => {
                const decoded = tryDecodeCustomXmppMessage(message);
                if (decoded) {
                    store.dispatch(customXmppEventReceived(decoded));
                } else {
                    logger.error('Failed to decode custom XMPP message body');
                }
            }
        );
        break;
    }
    case SEND_CUSTOM_XMPP_COMMAND: {
        const { target, payload } = action;
        const result = validateCustomXmppPayload(payload);
        if (!result.ok) {
            logger.error(`sendCustomXmppCommand rejected: ${result.reason}`, { target });
            return next(action);
        }
        const { conference } = store.getState()['features/base/conference'];
        if (!conference) {
            logger.error('sendCustomXmppCommand called before CONFERENCE_JOINED');
            return next(action);
        }
        try {
            conference.sendPrivateTextMessage(target, result.serialised);
        } catch (e) {
            logger.error('sendPrivateTextMessage threw', e);
        }
        return next(action);
    }
    }
    return next(action);
});
```

Things to get right:

- **Listener deduplication.** The chat feature's middleware (line ~322) handles this by attaching inside `CONFERENCE_JOINED` and not in `MiddlewareRegistry.register`'s top level. Match that pattern.
- **Never throw.** Both the send path (when `conference.sendPrivateTextMessage` throws or the conference is gone) and the receive path (when `JSON.parse` fails) must swallow errors and log.
- **The receive handler ignores `participantId`, `timestamp`, `messageId`.** Only `message` (the body) is interesting; spec INV-2 says we don't expose anything else to the host page.
- **Import paths.** Match the project's `@/` or relative-path convention by checking `react/features/chat/middleware.ts` imports.

### T009 — `react/features/custom-xmpp/index.ts`

Barrel export, like every other feature module's `index.ts`:

```ts
export * from './actionTypes';
export * from './actions';
export * from './functions';
export { default as logger } from './logger';
```

This lets `react/features/external-api/middleware.ts` and `react/features/mobile/external-api/middleware.ts` do a single `import { CUSTOM_XMPP_EVENT_RECEIVED } from '../custom-xmpp';`.

## Branch Strategy

- **Planning base branch:** `meeting/develop`
- **Final merge target:** `meeting/develop`
- **Execution worktree:** the lane assigned by `lanes.json` after `finalize_tasks`. The implementing agent must `cd` into that worktree path before editing.

This WP creates a new directory `react/features/custom-xmpp/`. Add the directory itself to git (`git add react/features/custom-xmpp/`); do not rely on `git add .` because the worktree's `.gitignore` is inherited.

## Test Strategy

No automated tests for this mission. Verification:

1. **TypeScript**: `npm run tsc:web` and `npm run tsc:native` both pass.
2. **Lint**: `npm run lint` passes with no new warnings.
3. **Static reasoning**: Read the middleware one more time and confirm:
   - listener only attached inside `CONFERENCE_JOINED`;
   - errors are caught and logged, never re-thrown;
   - the receive handler dispatches `CUSTOM_XMPP_EVENT_RECEIVED` with the decoded object.

## Definition of Done

- [ ] Six new files in `react/features/custom-xmpp/`: `actionTypes.ts`, `logger.ts`, `functions.ts`, `actions.ts`, `middleware.ts`, `index.ts`.
- [ ] `npm run tsc:web` and `npm run tsc:native` pass.
- [ ] `npm run lint` passes with no new warnings.
- [ ] The middleware's send path handles all four `validateCustomXmppPayload` failure reasons with `logger.error` and no throw.
- [ ] The middleware's receive path never throws; JSON parse failures produce a `logger.error` and no event.
- [ ] No new dependency is added (the feature uses only `react/features/base/*` and existing imports).
- [ ] **NFR-001 / C-001 verification**: `git diff --stat lib-jitsi-meet/ node_modules/lib-jitsi-meet/ 2>/dev/null` shows zero lines changed against the baseline branch. Run this before declaring the WP done.
- [ ] **C-002 verified**: the only network primitive used is `conference.sendPrivateTextMessage(target, jsonString)`; grep for any other `conference.send*` call returns nothing new in this WP.
- [ ] **C-006 verified**: the API surface accepts a single `target: string` and the middleware never loops over participant ids.
- [ ] **C-003 note (out-of-scope, no implementation)**: this WP does not authenticate participants, does not determine "is same person", and does not enforce any hangup policy. Those concerns live in the host page (per spec assumption).

## Risks

- **Module-load side effects**: `MiddlewareRegistry.register` runs at import time. If `import './middleware'` is placed before `base/redux` is initialised, you'll see a circular-import error. Mitigation: import `middleware` from a leaf feature (e.g. `external-api/middleware.ts` or via `index.ts` of this module only after the feature is fully wired).
- **JSON.stringify corner cases**: BigInt values, circular refs. The try/catch covers them, but verify by writing a 5-line node script in `bash` if uncertain.
- **State selector access**: `store.getState()['features/base/conference']` is the project convention; check by reading how `chat/middleware.ts` reads the conference reference.
- **Reducer / state changes**: This feature does **not** introduce a reducer or new state slice — the work is purely middleware. Don't be tempted to add one.

## Reviewer Guidance

A reviewer should verify:

1. All six files exist and have non-trivial content (no empty stubs).
2. `actionTypes.ts` exports both action types as **strings** (not symbols or numbers).
3. `functions.ts` exports the 16 KiB constant.
4. `middleware.ts` does **not** import anything from `react`, `react-dom`, or `react-native` — the feature is platform-agnostic.
5. The receive handler attaches inside `CONFERENCE_JOINED` only.
6. The send handler reads the conference from redux state via the existing selector pattern.
7. There is **no** new reducer file (the feature is middleware-only by design).

## Implementation Command

```
spec-kitty agent action implement WP02 --agent node-norris
```