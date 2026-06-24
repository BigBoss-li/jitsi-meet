# Research: Custom XMPP Command and Event Listener

**Phase**: 0 — Research
**Mission**: `custom-xmpp-command-and-event-01KVVVG9`
**Date**: 2026-06-24

## Decision 1 — Transport: MUC private message, not a new IQ stanza

**Decision**: Use the existing MUC private message transport (`<message type="chat" to="room@conf.example/occupant"><body>...</body></message>`) via `conference.sendPrivateTextMessage(participantId, jsonString)`.

**Rationale**:
- The mission must not modify `lib-jitsi-meet` (NFR-001). Adding a new IQ stanza would require:
  - a new `XEP` / namespace constant in `lib-jitsi-meet`,
  - a new `addHandler` registration in `XMPP._initStrophePlugins` or `ChatRoom`,
  - a corresponding event in `JitsiConferenceEventManager`,
  - a public method on `JitsiConference`,
  - a `JitsiConferenceEvents.*` constant.
  All of which are out of scope for a feature that lives entirely in jitsi-meet.
- The MUC private message transport is the only public-API path that delivers a payload to a single MUC occupant. It is the same transport used by 1:1 chat and by av-moderation's directed notifications.
- The body of the message is a free-form string. Encoding our JSON payload as a string body is a clean fit and keeps the implementation local.

**Alternatives considered**:
- **Custom IQ** — rejected: requires lib-jitsi-meet changes; violates NFR-001.
- **WebRTC data channel** — rejected: data channels are per-participant-pair, not a MUC-wide abstraction; setting one up between two arbitrary participants is non-trivial and bypasses the MUC lifecycle.
- **Chat (room-wide) message** — rejected: would deliver to all participants, not a single target.

## Decision 2 — Public API surface for send / receive

**Decision**:
- Send: `conference.sendPrivateTextMessage(participantId, jsonString)`.
- Receive: `conference.on(JitsiConferenceEvents.PRIVATE_MESSAGE_RECEIVED, handler)`.
- Resolve target participantId to a MUC occupant JID: `conference.getParticipantById(participantId).getJid()` — wait, that is the participant's MUC JID. We pass the participantId directly to `sendPrivateTextMessage`, which the conference already resolves internally (see `react/features/chat/middleware.ts:208`).

**Rationale**:
- Both methods are on the documented public surface of `JitsiConference`.
- The chat feature already uses the same pair (see `react/features/chat/middleware.ts:208` for send and `react/features/chat/middleware.ts:322` for receive), so we have a working pattern to mirror.
- The receiving handler receives `(participantId, message, timestamp, messageId)`. We ignore `timestamp` and `messageId` (host page does not need them) and treat `message` as a JSON string to parse.

**Alternatives considered**:
- `conference.sendMessage(message, to)` (the older "third arg = private recipient" form) — also works but is the lower-level form; `sendPrivateTextMessage` is the cleaner public API.
- Subscribing to `JitsiConferenceEvents.MESSAGE_RECEIVED` instead of `PRIVATE_MESSAGE_RECEIVED` — rejected, that fires for every room-wide chat, not for our private messages.

## Decision 3 — Where the new code lives

**Decision**: New feature module `react/features/custom-xmpp/`, plus one entry each in the existing `external_api.js` maps and one case in `react/features/external-api/middleware.ts`.

**Rationale**:
- A new feature module keeps the diff focused, reviewable, and reversible.
- The new module exports the action types and the redux-aware send / receive middleware; it does not depend on web or RN specifics.
- `external-api/middleware.ts` is the single fan-out from redux to `APP.API`. Adding a `case` there keeps the dispatch path symmetric with the other 50+ events the project already exposes.

**Alternatives considered**:
- Put the logic in `react/features/chat/` — rejected: semantically not chat; would mix concerns.
- Put the logic in `react/features/base/conference/` — rejected: that directory owns the conference lifecycle, not application-level features; would couple this feature to base code that is shared by all other features.
- New `react/features/base/custom-xmpp/` — rejected: base features are infrastructure, this is an application feature.

## Decision 4 — Result object for `sendCustomXmppCommand`

**Decision**: No return value. The `executeCommand` contract stays synchronous-void. The host page observes success indirectly via `customXmppEvent` arriving on the receiver.

**Rationale**:
- `JitsiMeetExternalAPI.executeCommand` is sync-void and used by hundreds of existing integrations. Changing its contract would break them.
- Adding a parallel "result event" would require a `requestId` round-trip and add complexity to a feature that is fundamentally best-effort transport.
- For the duplicate-user flow, the receiving host page is the source of truth: if the user is still in the meeting, the command worked; if not, it didn't. The sender can observe this via the existing `participantLeft` event and does not need a separate acknowledgement.

**Alternatives considered**:
- Add `customXmppCommandResult` event — rejected: would require a requestId convention, complicates the API for a one-shot feature.
- Make `executeCommand` return a Promise — rejected: would require changing `external_api.js:913` and break all existing call sites.

## Decision 5 — React Native bridge parity

**Decision**: Add native bridge constants and event plumbing in `ios/sdk/src/ExternalAPI.{h,m}`, `ios/sdk/src/JitsiMeetView.{h,m}`, the Android `ExternalAPIModule.*` + `JitsiMeetView.*` files, and the `react/features/mobile/external-api/middleware.ts` listener / emit calls.

**Rationale**:
- The existing `sendChatMessage` / `chatUpdated` pair is the template. It has the same shape: command goes host → JS via `NativeEventEmitter`, event goes JS → host via a `JitsiMeetViewListener`-style callback.
- The JS side of the bridge is already wired in `react/features/mobile/external-api/middleware.ts:452`; we just add one more `eventEmitter.addListener` and one more `eventEmitter.emit` call.

**Alternatives considered**:
- Skip the native bridge and ship web-only first — rejected: spec FR-007 requires RN parity, and a one-shot RN change is straightforward enough to land in the same mission.
- Use a generic `eventEmitter.sendEvent(name, data)` over a typed constant — rejected: the existing pattern uses typed constants; consistency matters.

## Decision 6 — Test approach

**Decision**: Manual two-tab end-to-end test using a new `doc/examples/custom-xmpp-example.html`, plus manual smoke-test of the existing `doc/examples/api.html` to confirm no regression.

**Rationale**:
- The repository has no unit-test framework in `react/features/` (verified: no `*.spec.ts` / `*.test.ts` files; no `cypress/` directory). Adding Jest for this one feature is a non-trivial scope expansion.
- The two-tab flow is straightforward to demonstrate by hand and is the only test that exercises the full XMPP round-trip — a unit test of the JSON validator would not catch a mis-spelled wire name in `external_api.js`.
- Manual test of the existing example is the cheapest regression check.

**Alternatives considered**:
- Add Jest + a few unit tests for the new feature — rejected: scope creep, no surrounding test infrastructure to learn from.
- Add Cypress / Playwright — rejected: same reason, and the project does not currently have a browser-automation test layer.
