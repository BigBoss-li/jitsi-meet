# Custom XMPP Command and Event Listener

**Status**: Draft
**Mission**: `custom-xmpp-command-and-event-01KVVVG9`
**Owner**: jitsi-meet frontend
**Last updated**: 2026-06-24

## Summary

Jitsi Meet's `JitsiMeetExternalAPI` exposes a fixed set of `executeCommand` actions and a fixed set of events. A host page that wants to drive a coordinated flow purely from outside the meeting UI (for example: detect that the same user has joined twice, ask the first joiner to leave voluntarily) has no clean way to send a private message to a single participant and observe the inbound counterpart.

This mission adds one new command, `sendCustomXmppCommand`, and one new event, `customXmppEvent`. The transport is a MUC private message addressed to a single participant's occupant JID. The shape of the payload is a JSON object that the host page owns. The "same user" rule, the eviction policy, and any identity/joining-order bookkeeping live entirely in the host page; jitsi-meet only provides the channel.

## Use Case (Primary Scenario)

A host page embeds Jitsi Meet for two browser sessions of the same end user. The host page wants to ensure only one session stays connected at a time. The host page itself is the source of truth for "same user" (for example, by reading a custom participant attribute it set at join time).

1. Session A joins. The host page records the `participantId` and join order.
2. Session B joins with the same identity. The host page recognises a duplicate.
3. The host page calls `api.executeCommand('sendCustomXmppCommand', { target: <sessionA's participantId>, payload: { action: 'duplicateDetected', role: 'firstJoiner' } })`.
4. jitsi-meet routes the payload to session A's tab over the MUC private message channel.
5. Session A's host page receives `customXmppEvent` with the same payload, decides that the local user should leave, and calls `api.executeCommand('hangup')`.
6. Session A leaves voluntarily. Session B continues.

## User Scenarios & Testing

### Scenario 1 — Happy path: duplicate detection and graceful eviction

- **Actor**: host page in two browser tabs of the same user.
- **Trigger**: second tab joins; host page detects the duplicate.
- **Flow**:
  1. Host page calls `executeCommand('sendCustomXmppCommand', { target, payload })`.
  2. jitsi-meet dispatches the command to the MUC private message transport for the named participant only.
  3. Receiving jitsi-meet instance raises `customXmppEvent` on its host page.
  4. Receiving host page calls `executeCommand('hangup')`.
- **Success**: only the first tab's user remains in the meeting; the second tab's user keeps their session.
- **Testable outcome**: in a two-tab test, after the host-page-driven flow, the conference has exactly one local user; the first tab's `participantLeft` event for the local user fires.

### Scenario 2 — Message addressed to a participant that has already left

- **Trigger**: host page sends a command for a `target` that already left the meeting.
- **Flow**: jitsi-meet passes the call to the MUC transport; lib-jitsi-meet's send path returns a failure (the occupant JID is unknown).
- **Outcome**: a `console.error` is logged inside the iframe / RN app; the receiving side never sees an event; no error is surfaced to the sending host page.

### Scenario 3 — Receiver has no listener

- **Trigger**: the target's host page never calls `addEventListener('customXmppEvent', ...)`.
- **Flow**: jitsi-meet still delivers the message at the lib-jitsi-meet level, but the event has no handler.
- **Outcome**: the message is dropped silently. No console errors, no retries.

### Scenario 4 — Malformed payload

- **Trigger**: a `payload` is not a serialisable JSON object, or it exceeds a reasonable size.
- **Flow**: jitsi-meet rejects the command synchronously and logs a `console.error`. No XMPP traffic is generated.

### Scenario 5 — Cross-platform

- **Trigger**: sender is web, receiver is React Native (or vice versa).
- **Flow**: the same command/event name and payload shape work on both platforms.
- **Outcome**: the JSON payload survives the JS / native bridge; the receiver behaves identically.

### Scenario 6 — Concurrent / duplicate sends

- **Trigger**: two different host pages each detect the same duplicate user and both call `sendCustomXmppCommand` against the same target.
- **Flow**: jitsi-meet enqueues both messages; the MUC transport delivers both to the target in arrival order. The target's host page receives two `customXmppEvent` with similar payloads.
- **Outcome**: jitsi-meet does not de-duplicate. The target's host page SHOULD use a `requestId` (or the `action` field) inside the payload to make the handler idempotent. After this mission lands, jitsi-meet itself SHALL NOT de-duplicate or coalesce.

## Functional Requirements

| ID | Status | Requirement |
|----|--------|-------------|
| FR-001 | Proposed | jitsi-meet SHALL accept a new external API command `sendCustomXmppCommand` with arguments `{ target: string, payload: object }`, where `target` is a participant id as exposed by the conference and `payload` is any JSON-serialisable object owned by the host page. |
| FR-002 | Proposed | When `sendCustomXmppCommand` is invoked, jitsi-meet SHALL resolve the target `participantId` to a MUC occupant JID and deliver the JSON-encoded `payload` to that JID using the existing MUC private message transport (`conference.sendMessage`). |
| FR-003 | Proposed | jitsi-meet SHALL expose a new external API event `customXmppEvent` whose argument is the original `payload` object. The event SHALL fire only on the host page of the participant whose JID matched the `target`. |
| FR-004 | Proposed | The sending `executeCommand` SHALL follow the existing `JitsiMeetExternalAPI.executeCommand` contract: it is synchronous and returns `void`. jitsi-meet SHALL NOT extend this contract for this mission. If the command is malformed, jitsi-meet SHALL log to `console` and SHALL NOT notify the host page on success or failure. The host page can verify the round-trip by observing `customXmppEvent` arriving on the receiver's side. |
| FR-005 | Proposed | jitsi-meet SHALL validate the `payload` synchronously before any XMPP traffic: it MUST be a non-null object, JSON-serialisable, and at most 16 KiB serialised. A payload that fails validation SHALL be dropped and a `console.error` SHALL be logged. The host page is informed of failure only indirectly (no `customXmppEvent` arrives on the receiver). |
| FR-006 | Proposed | jitsi-meet SHALL subscribe to `JitsiConferenceEvents.PRIVATE_MESSAGE_RECEIVED` (or its native equivalent), parse the body as JSON, and re-emit it as `customXmppEvent` only when the body parses successfully. Malformed bodies SHALL be dropped silently on the receiving side. |
| FR-007 | Proposed | The host page MUST be able to use `sendCustomXmppCommand` and `customXmppEvent` on both web and React Native (iOS + Android) builds of jitsi-meet, with identical semantics. |
| FR-008 | Proposed | jitsi-meet SHALL support `sendCustomXmppCommand` in prejoin, in-meeting, and during the post-meeting-leave sequence as long as the conference is still joined on the receiving side. Calls when the local conference is gone SHALL be dropped and a `console.error` SHALL be logged. Calls when the target participant is no longer in the meeting SHALL be passed to the MUC transport, which will return a delivery error; that error SHALL be logged and not surfaced to the host page. |

## Non-Functional Requirements

| ID | Status | Requirement |
|----|--------|-------------|
| NFR-001 | Proposed | The added command and event SHALL be implemented entirely inside the jitsi-meet project. No changes SHALL be made to `lib-jitsi-meet`, and no private fields of `JitsiConference` or `ChatRoom` SHALL be accessed at runtime. |
| NFR-002 | Proposed | The added code SHALL only use the documented public surface of `JitsiConference` (in particular `sendMessage`, `addListener` / `on` with `JitsiConferenceEvents.PRIVATE_MESSAGE_RECEIVED`, and `getParticipantById`). |
| NFR-003 | Proposed | Round-trip latency from `executeCommand` invocation to `customXmppEvent` firing on the receiver SHALL be dominated by the XMPP transport, not by jitsi-meet's own processing. jitsi-meet's local handling SHALL add no more than 50 ms of synchronous work. |
| NFR-004 | Proposed | The added code SHALL pass `npm run lint` and `npm run tsc:web` and `npm run tsc:native` with no new warnings. |
| NFR-005 | Proposed | The added code SHALL be exercised by a manual two-tab end-to-end scenario using `doc/examples/api.html` (or a new sibling example file) that demonstrates: (a) the happy-path round-trip, (b) unknown target, (c) invalid payload, (d) cross-platform (web + RN) parity. |
| NFR-006 | Proposed | The added code SHALL not regress any existing `JitsiMeetExternalAPI` command or event. Manual smoke-test of the existing `doc/examples/api.html` SHALL continue to work unchanged. |

## Constraints

| ID | Status | Constraint |
|----|--------|------------|
| C-001 | Confirmed | Implementation lives inside the jitsi-meet repository only. `lib-jitsi-meet` is treated as an external npm dependency and is not modified for this mission. |
| C-002 | Confirmed | The transport is the existing MUC private message channel. The mission does not introduce a new XMPP stanza, namespace, IQ, or component address. |
| C-003 | Confirmed | The same user / first-joiner rule lives in the host page. jitsi-meet does not authenticate participants, does not decide who is "the same", and does not enforce any eviction policy. |
| C-004 | Confirmed | Supported platforms are web (the existing `index.web.js` SPA) and React Native (iOS + Android via the existing `index.ios.js` / `index.android.js` entries). No desktop or Electron-specific work. |
| C-005 | Confirmed | Trigger entry point is the public `JitsiMeetExternalAPI` (`api.executeCommand` / `api.addEventListeners`). The new command and event follow the existing dispatch pattern in `modules/API/external/external_api.js` and the `react/features/external-api/` middleware. |
| C-006 | Confirmed | The command SHALL be addressed to a single MUC occupant by participant id. Group / broadcast / room-wide notifications are explicitly out of scope. |

## Success Criteria

- A manual two-tab test (using `doc/examples/api.html` or a small dedicated example) where the host page calls `sendCustomXmppCommand` from tab A to tab B (same user, same meeting) results in tab B receiving `customXmppEvent` with the exact payload.
- A manual test that calls `sendCustomXmppCommand` with an unknown `target` does not throw to the host page; a `console.error` is logged inside the iframe / RN app.
- A manual test that calls `sendCustomXmppCommand` with a non-object or oversize `payload` does not call `sendMessage` on the conference; a `console.error` is logged.
- The same command and event work in a React Native build (verified by manual test on iOS or Android) with no web-only code paths.
- The mission is implemented without modifying `lib-jitsi-meet` and without reading private fields of `JitsiConference` or `ChatRoom` from production code.

## Key Entities

- **Command**: `sendCustomXmppCommand` — the host-page-driven verb.
  - Arguments: `{ target: string (participantId), payload: object }`
  - Result: `void` (no synchronous return value; feedback arrives via `customXmppEvent` on the receiver's side)
- **Event**: `customXmppEvent` — fired on the receiving host page.
  - Argument: the original `payload` object.
- **Transport**: MUC private message (`<message type="chat" to="room@conf.example/occupant">` with a JSON string body), exposed to jitsi-meet via `conference.sendMessage` and `JitsiConferenceEvents.PRIVATE_MESSAGE_RECEIVED`.
- **Participant identity**: the `participantId` exposed by `JitsiConference.getParticipantById` and propagated to the host page via the existing `participantJoined` / `participantUpdated` / `participantLeft` events. The host page is responsible for mapping this id to its own user model.

## Assumptions

- "Same user" is a host-page concept. jitsi-meet does not need a stable user id; the host page attaches whatever identifier it wants to a participant (for example, by setting a custom participant metadata field) and decides equality.
- The MUC private message transport is the only path needed. No IQ-based custom command is required for this use case.
- The receiving host page is responsible for any side effects (e.g. calling `hangup`). jitsi-meet does not auto-leave on receipt.
- The 16 KiB payload cap is a reasonable upper bound for a host-page-driven flow and matches the typical MUC message size limit; if a flow needs more, it is out of scope and should be split or use a different transport.
- The sending `executeCommand` is synchronous and returns `void`. The only way the host page can verify success is to wait for `customXmppEvent` to arrive on the receiver; no positive confirmation event is sent back to the sender. Failure is only observable through `console.error` inside the iframe / RN app.
- Concurrent sends from the same host page are independent: jitsi-meet does not coordinate, debounce, or coalesce. The underlying MUC transport preserves FIFO order per (sender, target) pair, so back-to-back sends from the same host page to the same target are received in order. Cross-pair or cross-host concurrency is out of jitsi-meet's control: two host pages can each send a command to the same target, and the target's host page SHOULD treat the payload as idempotent (for example by using a `requestId` inside the payload, or by keying on the `action` field).

## Out of Scope

- Authenticating that two participants belong to the same end user. The host page owns this.
- Group / broadcast / room-wide notifications of this shape. (That is a different mission.)
- New XMPP stanzas, namespaces, IQ types, or new component addresses in `lib-jitsi-meet` or jicofo.
- Persisting the payload, retrying on failure, or guaranteeing at-least-once delivery. The transport is best-effort MUC private message.
- Auto-leaving on receipt. The host page decides whether to call `hangup`.
- Any server-side change (jicofo, prosody, focus, jigasi).

## Open Questions

- None at this point. The use case, the transport choice, the trigger entry point, the platform scope, and the public-API-only constraint have all been confirmed with the requester.
