# Data Model: Custom XMPP Command and Event Listener

**Phase**: 1 — Design
**Mission**: `custom-xmpp-command-and-event-01KVVVG9`
**Date**: 2026-06-24

## Entities

### `CustomXmppCommand` (host page → jitsi-meet)

A command issued from the host page. Lifted from `JitsiMeetExternalAPI.executeCommand`.

```ts
type CustomXmppCommand = {
    target: string;            // MUC participant id (the value of participant.id from the conference)
    payload: CustomXmppPayload; // see below
};
```

- `target` — required. A non-empty string matching the `id` of a participant currently in the MUC. The conference is the source of truth for the occupant JID; the host page never sees the JID.
- `payload` — required. See `CustomXmppPayload`.

### `CustomXmppPayload` (wire body)

The host-page-owned JSON object that travels in the MUC private message body.

```ts
type CustomXmppPayload = {
    action: string;            // e.g. "duplicateDetected"
    [key: string]: unknown;    // host-page-specific extras, e.g. requestId, role, etc.
};
```

- **Validation rules** (FR-005):
  - `payload` MUST be a non-null, non-array, plain object.
  - `payload.action` MUST be a non-empty string. (Convention only — not enforced by jitsi-meet, but the use case's duplicate-eviction flow requires it.)
  - The serialised form `JSON.stringify(payload)` MUST be at most 16 384 bytes.
  - `JSON.stringify` MUST NOT throw (no cycles, no `BigInt`, no functions). Use a `try/catch` and a length check.
- **Open shape**: any other keys are allowed and forwarded verbatim. The host page owns the contract.

### `CustomXmppCommandMessage` (jitsi-meet internal — wire body)

The MUC private message body. Always a JSON-string-encoded `CustomXmppPayload`. The transport does not wrap it; the body is literally the JSON text.

```
<message type="chat" to="room@conf.example/occupant-id">
  <body>{"action":"duplicateDetected","requestId":"…"}</body>
</message>
```

- `body` is the JSON serialisation of `CustomXmppPayload`.
- The receiver parses `body` with `JSON.parse` inside a `try/catch`. On failure, the message is dropped silently (FR-006).
- The receiver does not interpret `action` — it just re-emits the parsed object as `customXmppEvent`.

### `CustomXmppEvent` (jitsi-meet → host page)

```ts
type CustomXmppEvent = CustomXmppPayload;
```

- The event argument IS the original `payload` (FR-003). Round-trip identity: `JSON.parse(JSON.stringify(payload)) === payload` modulo key order, which is irrelevant for `===` checks if the host page only checks `payload.action` and `payload.requestId`.

## Lifecycle

```
[host page A]
    │
    │  api.executeCommand('sendCustomXmppCommand', { target, payload })
    ▼
[iframe / RN app — jitsi-meet]
    │
    │  SEND_CUSTOM_XMPP_COMMAND action
    ▼
[react/features/custom-xmpp/middleware.ts]
    │
    │  1. validate payload
    │  2. JSON.stringify payload
    │  3. conference.sendPrivateTextMessage(target, jsonString)
    ▼
[XMPP MUC transport — lib-jitsi-meet]
    │
    │  <message> over MUC to target's occupant JID
    ▼
[XMPP MUC transport on receiver]
    │
    │  fires JitsiConferenceEvents.PRIVATE_MESSAGE_RECEIVED
    ▼
[react/features/custom-xmpp/middleware.ts — receiver side]
    │
    │  1. JSON.parse(message) inside try/catch
    │  2. dispatch CUSTOM_XMPP_EVENT_RECEIVED with parsed payload
    ▼
[react/features/external-api/middleware.ts]
    │
    │  APP.API.notifyCustomXmppEvent(payload)
    ▼
[iframe transport / RN bridge]
    │
    │  emits 'custom-xmpp-event' to host page B
    ▼
[host page B]
    api.addEventListener('customXmppEvent', (payload) => { ... })
```

There is exactly one in-flight state: the message is in transit on the XMPP layer. jitsi-meet does not track it.

## Invariants

- **INV-1**: A successful `sendCustomXmppCommand` MUST result in zero or one `customXmppEvent` on the receiver. Zero if the receiver has no listener or the body fails to parse.
- **INV-2**: A `customXmppEvent` payload is `===` the original `payload` modulo key order; receivers MUST NOT depend on key order.
- **INV-3**: `sendCustomXmppCommand` is best-effort. The MUC transport may drop messages under load or when the receiver is transiently disconnected. Callers MUST be tolerant of loss.
- **INV-4**: Two host pages sending the same payload to the same target produce two `customXmppEvent`s on the receiver. jitsi-meet does not de-duplicate (per spec).

## Validation Function (informative)

```ts
// react/features/custom-xmpp/functions.ts
const MAX_PAYLOAD_BYTES = 16 * 1024;

export function validateCustomXmppPayload(payload: unknown): { ok: true } | { ok: false, reason: string } {
    if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
        return { ok: false, reason: 'invalidPayload' };
    }
    if (typeof (payload as { action?: unknown }).action !== 'string'
        || (payload as { action: string }).action.length === 0) {
        return { ok: false, reason: 'invalidPayload' };
    }
    let serialised: string;
    try {
        serialised = JSON.stringify(payload);
    } catch {
        return { ok: false, reason: 'invalidPayload' };
    }
    if (serialised.length > MAX_PAYLOAD_BYTES) {
        return { ok: false, reason: 'invalidPayload' };
    }
    return { ok: true };
}

export function tryDecodeCustomXmppMessage(body: string): unknown | undefined {
    try {
        const parsed = JSON.parse(body);
        if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return undefined;
        }
        return parsed;
    } catch {
        return undefined;
    }
}
```
