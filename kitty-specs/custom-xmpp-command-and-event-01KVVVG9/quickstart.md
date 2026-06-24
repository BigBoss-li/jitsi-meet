# Quickstart: Manual Test for Custom XMPP Command and Event

**Phase**: 1 — Design
**Mission**: `custom-xmpp-command-and-event-01KVVVG9`
**Date**: 2026-06-24

The mission does not introduce an automated test framework. This document is the runbook for the manual end-to-end scenarios from `spec.md`. It is the primary acceptance check.

## Prerequisites

- A running jitsi-meet build with this mission's changes merged.
- A local Jitsi Meet backend (the public `meet.jit.si` works for web; for the iOS / Android checks you need a build that the host can connect to).
- Two browser tabs of the same origin running `doc/examples/custom-xmpp-example.html` (the example page added by this mission).

## Test environment

The mission adds one HTML example, `doc/examples/custom-xmpp-example.html`. It is a near-clone of `doc/examples/api.html` with three additions:
- a "Send custom XMPP command" button that calls `api.executeCommand('sendCustomXmppCommand', { target, payload })`,
- a "First-joiner leaves voluntarily" handler that listens for `customXmppEvent` and calls `api.executeCommand('hangup')`,
- a `requestId` generated client-side and stamped onto every payload, used for de-duplication.

To run the two-tab scenario, open the example in two browser windows / tabs of the same browser, point them at the same room name, and use the same `userInfo.name` (or whatever identity field the host page uses to detect duplicates).

## Scenario 1 — Happy path: duplicate detection and graceful eviction

1. Open the example in tab A, join room `TestRoom` as `Alice`.
2. Open the example in tab B, join room `TestRoom` as `Alice` (same identity).
3. Tab A detects the duplicate (by comparing `participantJoined` event payloads against its own userId).
4. Tab A calls `sendCustomXmppCommand` targeting tab A's own `participantId` (the first joiner), payload `{ action: 'duplicateDetected', requestId: 'r1' }`.
5. Tab A receives `customXmppEvent` with the same payload, then calls `executeCommand('hangup')`.
6. Tab A leaves. Tab B continues.

**Pass criteria**:
- Tab A's `participantLeft` event for the local user fires within ~1 second of step 4.
- Tab B sees only one local participant (itself) after tab A leaves.
- Tab A's console shows the `customXmppEvent` payload before the `hangup` is issued.

## Scenario 2 — Unknown target

1. Join tab A in room `TestRoom` as `Alice`.
2. From tab A's devtools console, run:
   ```js
   api.executeCommand('sendCustomXmppCommand', {
       target: 'this-id-does-not-exist',
       payload: { action: 'noop' }
   });
   ```
3. Tab A's iframe console logs a `console.error` from the jitsi-meet layer.
4. No `customXmppEvent` fires anywhere (because no one is listening for a no-op and there is no participant with that id).

**Pass criteria**: No exception thrown to the host page; `console.error` is present; nothing crashes.

## Scenario 3 — Invalid payload

From tab A's devtools console, run each of:
```js
api.executeCommand('sendCustomXmppCommand', { target: tabAId, payload: null });
api.executeCommand('sendCustomXmppCommand', { target: tabAId, payload: 'a string' });
api.executeCommand('sendCustomXmppCommand', { target: tabAId, payload: [] });
api.executeCommand('sendCustomXmppCommand', {
    target: tabAId,
    payload: { action: '', /* no action */ }
});
api.executeCommand('sendCustomXmppCommand', {
    target: tabAId,
    payload: { action: 'oversize', big: 'x'.repeat(20 * 1024) }
});
```

**Pass criteria**: Each call logs a `console.error` and does NOT call `sendPrivateTextMessage` on the conference (verifiable in the Network / xmpp logs if you have a debug build, or by absence of `customXmppEvent` on the receiver).

## Scenario 4 — Cross-platform (React Native)

1. Build and run the iOS or Android app with this mission's changes.
2. From the host application (a minimal native shell that embeds `JitsiMeetView`), join room `TestRoom` as `Bob`.
3. From a second native instance, join as `Bob`. (Two physical devices, or one device + one simulator, or one native + one web tab.)
4. Trigger the duplicate-detected flow from the second instance.
5. Verify the first instance receives the `customXmppEvent` callback and calls `hangUp`.

**Pass criteria**: `customXmppEvent` fires on the first instance's host with the exact payload, and the first instance leaves the meeting.

## Scenario 5 — Regression: existing `doc/examples/api.html` works

1. Open `doc/examples/api.html` in a browser.
2. Click each button (toggleAudio, toggleVideo, setLargeVideoParticipant, sendChatMessage, etc.) and confirm each still works.

**Pass criteria**: All existing commands and events still fire as before. The new `sendCustomXmppCommand` and `customXmppEvent` are absent from the list (because the example doesn't bind them), but the rest of the API surface is unchanged.

## Scenario 6 — Concurrent / duplicate sends

1. Open the example in tabs A, B, C. All join `TestRoom` as `Alice` (the host page uses `userInfo.name` for identity).
2. Tab A detects the duplicate of itself (tab A is the first joiner) and sends `{ action: 'duplicateDetected', requestId: 'r1' }` to itself.
3. Tab C also detects the duplicate and sends `{ action: 'duplicateDetected', requestId: 'r2' }` to tab A.
4. Tab A receives two `customXmppEvent` events, with different `requestId`s.

**Pass criteria**: jitsi-meet delivers both events. The host page's handler uses `requestId` to decide whether it has already responded; if tab A has already left, the second `requestId` is ignored by the host page (not by jitsi-meet — jitsi-meet delivers everything it can).

## Notes

- All `console.error` messages in these scenarios come from inside the jitsi-meet iframe / RN app, not from the host page.
- The 16 KiB payload cap is enforced by `react/features/custom-xmpp/functions.ts`. A 20 KiB payload in Scenario 3 will be rejected before any XMPP traffic.
- The 50 ms latency budget in NFR-003 is not measured manually; it is enforced by the simplicity of the implementation (validation + `JSON.stringify` + one `sendPrivateTextMessage` call).
