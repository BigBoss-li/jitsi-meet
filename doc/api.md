# Jitsi Meet API

This document has been moved [here](https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe).

# `sendCustomXmppCommand` (command) and `customXmppEvent` (event)

This in-repo reference documents the `sendCustomXmppCommand` external API
command and the matching `customXmppEvent` event. They are available in both
the web iframe build and the React Native (iOS / Android) build of
Jitsi Meet. The canonical, handbook copy lives at
[the Jitsi Handbook](https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe);
this section is kept in the repo so integrators browsing the source tree can
discover the API surface.

## Background

`sendCustomXmppCommand` lets a host page send a small JSON payload to a
single MUC participant. The transport is the existing MUC private message
channel (`conference.sendPrivateTextMessage`); the recipient's host page
receives a `customXmppEvent` carrying the same payload object. jitsi-meet
provides the channel only — it does not interpret the payload, does not
authenticate "same user", and does not enforce any exit policy. The host
page owns all of those concerns.

## `sendCustomXmppCommand` (command)

Sends a custom JSON payload to a single MUC participant.

Parameters:

- `target` (string, required): the `participantId` of the recipient. This
  id is exposed to the host page through the existing `participantJoined`
  event.
- `payload` (object, required): any JSON-serialisable object with a
  non-empty string `action` field. The serialised body must not exceed
  16 KiB.

Returns: nothing (`void`). The function is synchronous.

Errors:

- The iframe / RN app logs `console.error` for invalid payloads, payloads
  larger than 16 KiB, unknown targets, or calls made before the conference
  is joined. These are **not** surfaced to the host page — the host page
  can only confirm delivery by observing `customXmppEvent` on the
  recipient side.

Example (web):

```js
api.executeCommand('sendCustomXmppCommand', {
    target: firstJoinerId,
    payload: { action: 'duplicateDetected', role: 'firstJoiner', requestId: 'r1' }
});
```

Example (React Native):

```ts
import { NativeModules } from 'react-native';

NativeModules.JitsiMeetView.sendCustomXmppCommand(
    firstJoinerId,
    { action: 'duplicateDetected', role: 'firstJoiner', requestId: 'r1' }
);
```

## `customXmppEvent` (event)

Fires on the recipient's host page when a custom XMPP message is received.
The single argument is the original `payload` object.

Triggered when:

- A `sendCustomXmppCommand` was sent to this participant's id, and
- The serialised JSON body parses to a non-null object, and
- The host page has registered a `customXmppEvent` listener.

Not triggered when:

- The host page has no listener for `customXmppEvent` (the message is
  silently dropped).
- The body fails to parse as JSON (logged, dropped).

Example (web):

```js
api.addEventListener('customXmppEvent', function (payload) {
    if (payload.action === 'duplicateDetected') {
        api.executeCommand('hangup');
    }
});
```

Example (React Native):

```ts
import { NativeEventEmitter, NativeModules } from 'react-native';

const emitter = new NativeEventEmitter(NativeModules.JitsiMeetView);

emitter.addListener('customXmppEvent', function (payload) {
    if (payload.action === 'duplicateDetected') {
        NativeModules.JitsiMeetView.hangUp();
    }
});
```

## Notes for integrators

- jitsi-meet does not deduplicate concurrent sends. If two host pages send
  `sendCustomXmppCommand` to the same target, the target receives two
  `customXmppEvent` callbacks; the host page is responsible for making
  its handler idempotent (for example by keying on `payload.requestId` or
  `payload.action`).
- The `payload` object is delivered verbatim. Do not put secrets in it
  unless you trust every other participant in the room.
- The 16 KiB limit applies to the JSON-serialised form of `payload`. If
  your flow needs more capacity, split it across multiple sends.
