---
work_package_id: WP05
title: Android 原生桥
dependencies:
- WP02
requirement_refs:
- C-004
- C-005
- FR-007
tracker_refs: []
planning_base_branch: meeting/develop
merge_target_branch: meeting/develop
branch_strategy: Planning artifacts for this mission were generated on meeting/develop. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into meeting/develop unless the human explicitly redirects the landing branch.
subtasks:
- T016
- T017
- T018
agent: java-jenny
shell_pid: '33104'
history:
- timestamp: '2026-06-24T04:15:00Z'
  action: created
  by: spec-kitty.tasks
agent_profile: java-jenny
authoritative_surface: android/sdk/src/main/java/org/jitsi/meet/sdk/
create_intent: []
execution_mode: code_change
model: sonnet
owned_files:
- android/sdk/src/main/java/org/jitsi/meet/sdk/**
role: implementer
tags: []
---

## ⚡ Do This First: Load Agent Profile

Before reading any agent profile, the implementing agent **must** load the assigned profile via `/ad-hoc-profile-load java-jenny`. This loads Android Java SDK conventions and the project's `JitsiMeetView` / `ExternalAPIModule` patterns into your working memory. Do not skip this step.

## Objective

Add Android native bridge support for `sendCustomXmppCommand` and `customXmppEvent`, mirroring WP04 (iOS). After this WP, an Android host app embedding `JitsiMeetView` can call `sendCustomXmppCommand(target, payload)` and register a listener for `onCustomXmppEvent`.

## Context

The Android bridge is parallel to the iOS one but uses Java idioms:

1. **Host → JS:** host app calls a public method on `JitsiMeetView`. That method dispatches an event over the React Native bridge to JS. The JS RN middleware (WP06) listens for the action and dispatches a redux action.
2. **JS → Host:** the RN middleware emits an event. The native `ExternalAPIModule` receives it and forwards to listeners registered on the host.

Reference: `sendChatMessage` / `onChatUpdated` in `android/sdk/src/main/java/org/jitsi/meet/sdk/`.

## Detailed Guidance

### T016 — Add string constants in `ExternalAPIModule.java`

Locate the existing constants:

```java
public static final String SEND_CHAT_MESSAGE = "SEND_CHAT_MESSAGE";
public static final String CHAT_UPDATED = "CHAT_UPDATED";
```

Add immediately after:

```java
public static final String SEND_CUSTOM_XMPP_COMMAND = "SEND_CUSTOM_XMPP_COMMAND";
public static final String CUSTOM_XMPP_EVENT = "CUSTOM_XMPP_EVENT";
```

These must equal the iOS strings in WP04 character-for-character.

### T017 — Add `sendCustomXmppCommand` to `JitsiMeetView.java`

Find the existing `sendChatMessage` method on `JitsiMeetView`. Add:

```java
public void sendCustomXmppCommand(@Nullable String action,
                                  @Nullable String targetId,
                                  @Nullable ReadableMap payload) {
    WritableMap params = Arguments.createMap();
    params.putString("action", action != null ? action : ExternalAPIModule.SEND_CUSTOM_XMPP_COMMAND);
    params.putString("target", targetId != null ? targetId : "");
    if (payload != null) {
        params.putMap("payload", payload);
    } else {
        params.putMap("payload", Arguments.createMap());
    }
    ReactInstanceManagerHolder.emitEvent(
        ExternalAPIModule.SEND_CUSTOM_XMPP_COMMAND, params);
}
```

(Adjust if `ReactInstanceManagerHolder.emitEvent` is not the canonical path — mirror how `sendChatMessage` actually dispatches.)

For the listener side, locate the existing `onChatUpdated` callback wiring (likely in a listener interface or in `JitsiMeetView`'s event handler). Add:

```java
public interface JitsiMeetViewListener {
    // ... existing methods ...
    @Optional
    void onCustomXmppEvent(@Nullable ReadableMap payload);
}
```

If `JitsiMeetViewListener` is an interface defined elsewhere, add the method there. The `dispatchEvent` plumbing for `CUSTOM_XMPP_EVENT` is handled by `ExternalAPIModule` (T018).

### T018 — Bridge handler in `ExternalAPIModule`

In `ExternalAPIModule.java`, locate the existing event-handler switch (e.g. a method that dispatches `CHAT_UPDATED` to listeners). Add a case for `CUSTOM_XMPP_EVENT`:

```java
} else if (CUSTOM_XMPP_EVENT.equals(event)) {
    // parse payload and call listener.onCustomXmppEvent(payload)
}
```

(Adjust to match the existing dispatch pattern — it may use `ReadableMap`, `WritableMap`, or a custom event class.)

Confirm that `ExternalAPIModule` is registered in the RN package list. Look for `ReactPackage` implementations that include it; if a new package list file is needed, add `ExternalAPIModule` to the existing one (do not create a new package class for this single addition).

## Branch Strategy

- **Planning base branch:** `meeting/develop`
- **Final merge target:** `meeting/develop`
- **Execution worktree:** the lane assigned by `lanes.json` after `finalize_tasks`. The implementing agent must `cd` into that worktree path before editing.

Android files are not compiled during web lint. Cross-check with `./gradlew assembleDebug` (or the project's standard Android build command) to confirm the SDK compiles.

## Test Strategy

No automated tests. Smoke check:

1. Build the Android SDK sample app: `./gradlew :sample:installDebug` (or equivalent).
2. In the sample's `MainActivity.java`, after joining a room, call:

   ```java
   jitsiMeetView.sendCustomXmppCommand(
       ExternalAPIModule.SEND_CUSTOM_XMPP_COMMAND,
       "test-target",
       payloadMap
   );
   ```

3. Confirm the JS console (Metro / Chrome dev tools connected via `chrome://inspect`) shows the redux action `SEND_CUSTOM_XMPP_COMMAND`.
4. From JS, dispatch a mock `CUSTOM_XMPP_EVENT_RECEIVED`. Confirm the sample app's `onCustomXmppEvent` listener fires.

## Definition of Done

- [ ] Two new constants `SEND_CUSTOM_XMPP_COMMAND` and `CUSTOM_XMPP_EVENT` declared in `ExternalAPIModule.java`.
- [ ] `JitsiMeetView` exposes a public `sendCustomXmppCommand(action, target, payload)` method.
- [ ] `JitsiMeetViewListener` (or equivalent) has a new `@Optional` method `onCustomXmppEvent`.
- [ ] `ExternalAPIModule` dispatches `CUSTOM_XMPP_EVENT` to listeners.
- [ ] Android SDK compiles via `./gradlew assembleDebug` (or equivalent).
- [ ] No new file is created; only existing files in the owned list are touched.
- [ ] **NFR-004 verification**: `./gradlew :sdk:lintDebug` (or equivalent Android lint task) produces no new warnings versus the baseline (capture the warning count in the commit message).

## Risks

- **Java vs Kotlin**: this project may use Java, Kotlin, or both. Mirror the file you're editing. Do not mix.
- **Null-safety annotations**: Android Java code uses `@Nullable` / `@NonNull`. Match the project's existing convention.
- **Event dispatch path**: `ReactInstanceManagerHolder.emitEvent` may or may not be the right entry point. Verify by reading how `sendChatMessage` dispatches.
- **Listener registration**: the host app must register a listener to receive `onCustomXmppEvent`. Add the method to the listener interface, not as a standalone callback.

## Reviewer Guidance

A reviewer should verify:

1. The constants `SEND_CUSTOM_XMPP_COMMAND` and `CUSTOM_XMPP_EVENT` match the iOS strings in WP04 character-for-character.
2. `sendCustomXmppCommand` accepts nullable parameters and uses sensible defaults.
3. `onCustomXmppEvent` is `@Optional` in the listener interface.
4. The dispatch in `ExternalAPIModule` is registered with the same React context used by other events.
5. The diff does not add new Gradle dependencies or new Java packages.

## Implementation Command

```
spec-kitty agent action implement WP05 --agent java-jenny
```