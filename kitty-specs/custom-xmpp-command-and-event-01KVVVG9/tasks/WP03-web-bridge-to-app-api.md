---
work_package_id: WP03
title: Web 桥接到 APP.API
dependencies:
- WP01
- WP02
requirement_refs:
- C-005
- FR-003
- FR-006
tracker_refs: []
planning_base_branch: meeting/develop
merge_target_branch: meeting/develop
branch_strategy: Planning artifacts for this mission were generated on meeting/develop. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into meeting/develop unless the human explicitly redirects the landing branch.
subtasks:
- T011
- T012
agent: node-norris
shell_pid: '30611'
history:
- timestamp: '2026-06-24T04:15:00Z'
  action: created
  by: spec-kitty.tasks
agent_profile: node-norris
authoritative_surface: react/features/external-api/middleware.ts
create_intent: []
execution_mode: code_change
model: sonnet
owned_files:
- react/features/external-api/middleware.ts
- modules/API/API.js
role: implementer
tags: []
---

## ⚡ Do This First: Load Agent Profile

Before reading any other section of this prompt, the implementing agent **must** load the assigned agent profile via `/ad-hoc-profile-load node-norris`. This loads Node.js module patterns and the jitsi-meet `external-api` redux middleware structure into your working memory. Do not skip this step.

## Objective

Wire the new `CUSTOM_XMPP_EVENT_RECEIVED` redux action (produced in WP02) to the host page via the iframe postMessage channel. After this WP, when the new feature module dispatches `CUSTOM_XMPP_EVENT_RECEIVED`, the host page's `api.addEventListener('customXmppEvent', …)` listener fires with the decoded payload.

## Context

The dispatch chain on the receive side is:

```
JitsiConferenceEvents.PRIVATE_MESSAGE_RECEIVED
  → custom-xmpp/middleware.ts (WP02)
  → dispatch CUSTOM_XMPP_EVENT_RECEIVED
  → external-api/middleware.ts post-next switch (THIS WP)
  → APP.API.notifyCustomXmppEvent(payload)
  → postMessage to host page
  → host page's addEventListener('customXmppEvent', …) fires
```

`external-api/middleware.ts` is the **single fan-out point** from redux to `APP.API` for all events. Every existing event (e.g. `chatUpdated`, `participantJoined`) has a `case` here. We add one more.

## Detailed Guidance

### T010 — Add `notifyCustomXmppEvent` to `APP.API`

First, find where the existing `APP.API.notifyXxx` methods live. They are typically in one of these files:

- `modules/API/external/ExternalAPI.js`
- `modules/API/API.js`
- `modules/API/APP.js`

Use `grep -rn "notifyChatUpdated" modules/API/` to locate the canonical implementation. The pattern is:

```js
APP.API.notifyCustomXmppEvent = function (payload) {
    sendMessage({
        type: 'custom-xmpp-event',
        data: payload
    });
};
```

`sendMessage` is the existing iframe → host postMessage helper used by every other notify method. The wire name `custom-xmpp-event` must match the key you added in WP01 to the `events` map in `external_api.js`.

### T011 — Add `case CUSTOM_XMPP_EVENT_RECEIVED` to `external-api/middleware.ts`

Open `react/features/external-api/middleware.ts`. Around **line 94** there is a `for (const action of actions)` loop with a `switch (action.type)` inside. Inside that switch, every event action type is mapped to one `APP.API.notifyXxx` call. Add:

```ts
case CUSTOM_XMPP_EVENT_RECEIVED:
    APP.API.notifyCustomXmppEvent(action.payload);
    break;
```

Import the action type at the top of the file:

```ts
import { CUSTOM_XMPP_EVENT_RECEIVED } from '../custom-xmpp';
```

Also import `APP.API` (it is almost certainly already imported via `../base/app`).

### T012 — Verify iframe ↔ host transport wiring

The `commands` and `events` maps from WP01 already handle the wire-name translation; this subtask is a static check:

1. Open `modules/API/external/external_api.js`. Confirm the `events` map contains `'custom-xmpp-event': 'customXmppEvent'` (added in WP01).
2. Confirm the host-side listener handler that receives `'custom-xmpp-event'` postMessages exists. Look for `customXmppEvent` in `modules/API/external/external_api.js` (around line 600-700) — there should be a case in the host-side message switch. **If it is missing**, add it here:

   ```js
   case 'custom-xmpp-event':
       API.notifyCustomXmppEvent && API.notifyCustomXmppEvent(data.data);
       break;
   ```

   (The exact location depends on the file; mirror how `chatUpdated` is handled.)

3. If T010 lives in a different file than expected, T012 is the catch-all step that ensures the host receives the event. Skim the file where you find `notifyChatUpdated` and confirm a host-side dispatch line equivalent exists or is auto-generated.

## Branch Strategy

- **Planning base branch:** `meeting/develop`
- **Final merge target:** `meeting/develop`
- **Execution worktree:** the lane assigned by `lanes.json` after `finalize_tasks`. The implementing agent must `cd` into that worktree path before editing.

## Test Strategy

Manual end-to-end check:

1. `npm start` (or `make dev`).
2. Open `doc/examples/api.html` in **two** browser tabs and join the same room.
3. From tab A's console:

   ```js
   api.addEventListener('customXmppEvent', payload => {
       console.log('GOT:', payload);
   });
   ```

4. From tab B's console:

   ```js
   api.addEventListener('participantJoined', p => {
       // wait until you see the participant from tab A, then send
       api.executeCommand('sendCustomXmppCommand', {
           target: <participantId of A>,
           payload: { action: 'hello', from: 'B' }
       });
   });
   ```

5. **Expected:** tab A's console prints `GOT: { action: 'hello', from: 'B' }`. (Tab B's `executeCommand` will work even without WP02's `sendPrivateTextMessage` if the action is dropped silently — but the receive path needs WP02 done.)

The T012 host-side dispatch line is the most likely point of breakage; if tab A receives nothing, inspect the iframe's DevTools console for any postMessage errors.

## Definition of Done

- [ ] `notifyCustomXmppEvent` is callable on `APP.API` (or equivalent) and posts a `'custom-xmpp-event'` message.
- [ ] `external-api/middleware.ts` has a `case CUSTOM_XMPP_EVENT_RECEIVED` that calls `notifyCustomXmppEvent(action.payload)`.
- [ ] The host-side iframe-message switch (in `external_api.js`) handles `'custom-xmpp-event'` and forwards to the host's listener.
- [ ] `npm run lint`, `npm run tsc:web`, `npm run tsc:native` pass with no new warnings.
- [ ] End-to-end smoke test: tab A receives the `customXmppEvent` after tab B sends it.

## Risks

- **Missing host-side dispatcher.** The `events` map in WP01 only registers the translation; it does not automatically add a host-side switch case. The T012 grep is essential.
- **APP.API namespace drift.** Some notify methods may be on `APP.API`, others on a private namespace — verify by reading the existing `chatUpdated` path end-to-end before adding.
- **`data.data` vs `data`.** The host-side switch may use `data.data` (with one extra wrapper) depending on the message format. Match the existing pattern exactly.

## Reviewer Guidance

A reviewer should verify:

1. The new `case CUSTOM_XMPP_EVENT_RECEIVED` is **inside** the `for (const action of actions)` loop, not at file top level.
2. The `break;` is present after the notify call (no fall-through).
3. The wire name string `'custom-xmpp-event'` matches `events` map and `contracts/custom-xmpp.md`.
4. T010's notify method is reachable from `APP.API.notifyXxx` style (same naming as siblings).
5. The diff does not introduce new state or reducer slices.

## Implementation Command

```
spec-kitty agent action implement WP03 --agent node-norris
```