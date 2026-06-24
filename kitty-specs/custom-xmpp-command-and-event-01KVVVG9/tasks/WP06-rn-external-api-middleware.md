---
work_package_id: WP06
title: React Native mobile/external-api/middleware.ts
dependencies:
- WP02
- WP04
- WP05
requirement_refs:
- C-004
- C-005
- FR-007
tracker_refs: []
planning_base_branch: meeting/develop
merge_target_branch: meeting/develop
branch_strategy: Planning artifacts for this mission were generated on meeting/develop. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into meeting/develop unless the human explicitly redirects the landing branch.
subtasks:
- T019
- T020
- T021
agent: node-norris
shell_pid: '43971'
history:
- timestamp: '2026-06-24T04:15:00Z'
  action: created
  by: spec-kitty.tasks
agent_profile: node-norris
authoritative_surface: react/features/mobile/external-api/middleware.ts
create_intent: []
execution_mode: code_change
model: sonnet
owned_files:
- react/features/mobile/external-api/middleware.ts
role: implementer
tags: []
---

## ⚡ Do This First: Load Agent Profile

Before reading any other section of this prompt, the implementing agent **must** load the assigned agent profile via `/ad-hoc-profile-load node-norris`. This loads the React Native `NativeEventEmitter` pattern and the project's `mobile/external-api/middleware.ts` conventions into your working memory. Do not skip this step.

## Objective

Connect the native bridge constants from WP04 (iOS) and WP05 (Android) to the redux store via `NativeEventEmitter` listeners and emitters in `react/features/mobile/external-api/middleware.ts`. After this WP, RN host apps can drive `sendCustomXmppCommand` / `customXmppEvent` end-to-end.

## Context

`react/features/mobile/external-api/middleware.ts` is the **JS-side** adapter between the React Native bridge and the redux store. It does two things:

1. **Listens** to events emitted from the native side (host → JS), and dispatches the corresponding redux actions.
2. **Emits** events back to the native side (JS → host), so the native listener can forward them to the host app.

For `SEND_CHAT_MESSAGE` and `CHAT_UPDATED`, this is already wired up — we mirror that pattern for `SEND_CUSTOM_XMPP_COMMAND` and `CUSTOM_XMPP_EVENT`.

## Detailed Guidance

### T019 — Add the inbound listener (`SEND_CUSTOM_XMPP_COMMAND`)

Open `react/features/mobile/external-api/middleware.ts`. Around **line 452** you will find the existing `eventEmitter.addListener(ExternalAPI.SEND_CHAT_MESSAGE, …)` registration. Mirror it:

```ts
eventEmitter.addListener(ExternalAPI.SEND_CUSTOM_XMPP_COMMAND, ({ target, payload }) => {
    if (typeof target !== 'string' || !target) {
        logger.error('sendCustomXmppCommand: missing target');
        return;
    }
    store.dispatch(sendCustomXmppCommand(target, payload));
});
```

(Adjust the destructured shape to match what the native side dispatches — see T016/T017 / T013/T014. The exact field names may be `target` / `payload` or slightly different.)

The action creator `sendCustomXmppCommand` is exported from WP02's `react/features/custom-xmpp/`. Add the import at the top of the file:

```ts
import { sendCustomXmppCommand } from '../../custom-xmpp';
```

If `logger` is not yet imported in this file, add it from the project's standard logger.

### T020 — Emit `CUSTOM_XMPP_EVENT` to the native side

In the same file, find where `CHAT_UPDATED` is dispatched to the host (typically a `MiddlewareRegistry.register` block that switches on redux action types and calls `eventEmitter.emit(...)`). Add:

```ts
case CUSTOM_XMPP_EVENT_RECEIVED:
    eventEmitter.emit(ExternalAPI.CUSTOM_XMPP_EVENT, action.payload);
    break;
```

The native side (WP04/WP05) handles the `CUSTOM_XMPP_EVENT` string by forwarding it to the host's `onCustomXmppEvent:` callback. The action type is imported from `../../custom-xmpp`.

### T021 — Cross-platform constant check

After T019 and T020 are in place, run from the worktree root:

```bash
grep -rn "SEND_CUSTOM_XMPP_COMMAND" react/ ios/sdk/ android/ \
    | grep -v node_modules \
    | grep -v build/
```

Expected output: at least three matches with identical strings:

- `react/features/mobile/external-api/middleware.ts` (this WP)
- `react/features/custom-xmpp/actionTypes.ts` (WP02, exported as a JS string)
- `ios/sdk/src/ExternalAPI.{h,m}` (WP04)
- `android/sdk/src/main/java/org/jitsi/meet/sdk/ExternalAPIModule.java` (WP05)

Also run:

```bash
grep -rn "CUSTOM_XMPP_EVENT" react/ ios/sdk/ android/ \
    | grep -v node_modules \
    | grep -v build/
```

Same expectation: identical strings across all four platforms.

If any platform's string differs, fix it before continuing. The two command/event names must match exactly across all four code surfaces.

## Branch Strategy

- **Planning base branch:** `meeting/develop`
- **Final merge target:** `meeting/develop`
- **Execution worktree:** the lane assigned by `lanes.json` after `finalize_tasks`. The implementing agent must `cd` into that worktree path before editing.

## Test Strategy

Manual end-to-end check on a real device or emulator:

1. Run the React Native app on iOS or Android.
2. From the host native code, call `sendCustomXmppCommand(target, payload)` where `target` is the local user's own participant id.
3. Confirm the JS redux log (or `console.log` added temporarily) shows `SEND_CUSTOM_XMPP_COMMAND` being dispatched.
4. From the JS side, dispatch a mock `CUSTOM_XMPP_EVENT_RECEIVED` action with a payload.
5. Confirm the host native side receives `onCustomXmppEvent:` with the same payload.

## Definition of Done

- [ ] `react/features/mobile/external-api/middleware.ts` registers `eventEmitter.addListener` for `SEND_CUSTOM_XMPP_COMMAND` and dispatches `sendCustomXmppCommand(target, payload)` action.
- [ ] Same file emits `CUSTOM_XMPP_EVENT` via `eventEmitter.emit(...)` on `CUSTOM_XMPP_EVENT_RECEIVED`.
- [ ] The `ExternalAPI.SEND_CUSTOM_XMPP_COMMAND` and `ExternalAPI.CUSTOM_XMPP_EVENT` constants are correctly referenced (they are defined in WP04/WP05).
- [ ] Cross-platform string check (T021) returns consistent results across all four platforms.
- [ ] `npm run tsc:native` passes; `npm run lint` passes with no new warnings.

## Risks

- **EventEmitter payload shape mismatch**: the native side may send `{ target, payload }` or `{ action, target, payload }` (where `action` is the command name, not the user-defined action). Read WP04/WP05 carefully to confirm; adapt T019 to destructure only the fields you need.
- **Listener registration timing**: the listener must be registered **once** at app start, not per conference-join. Check that the existing `addListener(SEND_CHAT_MESSAGE, ...)` is registered at top-level inside the `MiddlewareRegistry.register` factory.
- **Circular import**: `react/features/custom-xmpp/` exports the action creator; if `mobile/external-api/middleware.ts` already imports from there via a chain, watch out for cycles. The barrel `index.ts` from WP02 is intentionally minimal to avoid this.

## Reviewer Guidance

A reviewer should verify:

1. The `addListener` and `emit` use the same `ExternalAPI.SEND_CUSTOM_XMPP_COMMAND` / `CUSTOM_XMPP_EVENT` constants from WP04/WP05.
2. The dispatch in T019 calls the action creator from `../../custom-xmpp`, not a hand-written action object.
3. The `logger.error` in T019 is invoked when the target is missing or non-string.
4. The diff is contained to `react/features/mobile/external-api/middleware.ts` — no other mobile file is touched.

## Implementation Command

```
spec-kitty agent action implement WP06 --agent node-norris
```