# Contract: Custom XMPP Command and Event

**Phase**: 1 — Design
**Mission**: `custom-xmpp-command-and-event-01KVVVG9`
**Date**: 2026-06-24

This is the public contract between a host page and the jitsi-meet iframe / React Native view. It mirrors the wiring inside `modules/API/external/external_api.js` (web) and the `ExternalAPI` native module (mobile).

## Command: `sendCustomXmppCommand`

**Wire name (kebab-case)**: `send-custom-xmpp-command`
**Public method**: `JitsiMeetExternalAPI.executeCommand('sendCustomXmppCommand', { target, payload })`
**Return type**: `void` (synchronous)

### Arguments

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `target` | `string` | yes | The `participantId` of the receiving participant. The host page learns these from the existing `participantJoined` event. |
| `payload` | `object` | yes | A JSON-encodable object owned by the host page. Must have a non-empty string `action` field by convention. Maximum 16 KiB serialised. |

### Behaviour

| Pre-condition | Outcome |
|---------------|---------|
| `target` is not in the meeting anymore | jitsi-meet calls `conference.sendPrivateTextMessage`, which returns a transport-level error; jitsi-meet logs a `console.error`. The host page is not notified. |
| `payload` fails validation (not an object, no `action`, oversize, non-serialisable) | jitsi-meet logs a `console.error` and does not call `sendPrivateTextMessage`. |
| Local conference is not joined | jitsi-meet logs a `console.error` and does not call `sendPrivateTextMessage`. |
| All pre-conditions pass | jitsi-meet calls `conference.sendPrivateTextMessage(target, JSON.stringify(payload))`. |

### Concurrency

- Two `executeCommand` calls from the same host page in quick succession are enqueued independently by the MUC transport. FIFO is preserved per (sender, target) pair.
- Two host pages can each call `sendCustomXmppCommand` for the same target. Both calls land; the receiver sees two `customXmppEvent` events. jitsi-meet does not de-duplicate. The host page SHOULD use a `requestId` field in the payload to make the handler idempotent.

## Event: `customXmppEvent`

**Wire name (camelCase)**: `customXmppEvent`
**Public method**: `JitsiMeetExternalAPI.addEventListener('customXmppEvent', (payload) => { ... })`

### Argument

| Name | Type | Description |
|------|------|-------------|
| (single) | `object` | The `payload` object that the sender passed in. Always a non-null object. |

### When it fires

- The receiver's jitsi-meet instance received a MUC private message addressed to it.
- The body parsed as JSON and the parsed value is a non-null, non-array object.
- The host page has registered a listener for `customXmppEvent`.

If the host page has not registered a listener, the message is dropped silently — no `console.error`, no retry.

### When it does NOT fire

- The body failed to parse as JSON.
- The body parsed to `null`, an array, or a non-object.
- The sender is the same participant as the receiver (jitsi-meet does not deliver to self by default for MUC private messages).
- The target participant is not currently joined to the conference.

## Examples

### Host page — send

```js
// tab A
api.addEventListener('videoConferenceJoined', () => {
    api.executeCommand('sendCustomXmppCommand', {
        target: firstJoinerId,                  // participantId of tab A's own user
        payload: {
            action: 'duplicateDetected',
            requestId: 'req-123',
            role: 'firstJoiner'
        }
    });
});
```

### Host page — receive

```js
// tab A (the first joiner)
api.addEventListener('customXmppEvent', (payload) => {
    if (payload.action === 'duplicateDetected' && payload.role === 'firstJoiner') {
        // I am the first joiner — leave voluntarily.
        api.executeCommand('hangup');
    }
});
```

### React Native (host) — send

```ts
import { NativeModules } from 'react-native';
const { JitsiMeetView } = NativeModules;

JitsiMeetView.sendCustomXmppCommand(target, payload);
```

### React Native (host) — receive

```ts
import { NativeEventEmitter, NativeModules } from 'react-native';
const emitter = new NativeEventEmitter(NativeModules.JitsiMeetView);

emitter.addListener('customXmppEvent', payload => {
    if (payload.action === 'duplicateDetected' && payload.role === 'firstJoiner') {
        JitsiMeetView.hangUp();
    }
});
```

## Error handling matrix

| Failure | Detected by | What the host page sees |
|---------|-------------|-------------------------|
| Unknown `target` | `conference.sendPrivateTextMessage` returns a transport error | Nothing. `console.error` in iframe / RN app. |
| `payload` invalid | jitsi-meet (synchronous) | Nothing. `console.error` in iframe / RN app. |
| Conference not joined | jitsi-meet (synchronous) | Nothing. `console.error` in iframe / RN app. |
| Body fails to parse on receiver | jitsi-meet (synchronous) | Nothing. `console.error` in iframe / RN app. |
| Receiver has no listener | jitsi-meet | Nothing. No `console.error`. |
| Receiver already left | MUC transport | Nothing. `console.error` in sender's iframe / RN app. |
