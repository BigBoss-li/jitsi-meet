---
work_package_id: WP04
title: iOS 原生桥
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
- T013
- T014
- T015
agent: implementer-ivan
shell_pid: '32423'
history:
- timestamp: '2026-06-24T04:15:00Z'
  action: created
  by: spec-kitty.tasks
agent_profile: implementer-ivan
authoritative_surface: ios/sdk/src/
create_intent: []
execution_mode: code_change
model: sonnet
owned_files:
- ios/sdk/src/ExternalAPI.h
- ios/sdk/src/ExternalAPI.m
- ios/sdk/src/JitsiMeetView.h
- ios/sdk/src/JitsiMeetView.m
role: implementer
tags: []
---

## ⚡ Do This First: Load Agent Profile

Before reading any other section of this prompt, the implementing agent **must** load the assigned agent profile via `/ad-hoc-profile-load implementer-ivan`. This loads the iOS Objective-C / Swift SDK conventions of jitsi-meet and the `JitsiMeetViewListener` protocol patterns into your working memory. Do not skip this step.

## Objective

Add iOS native bridge support for `sendCustomXmppCommand` (host → JS) and `customXmppEvent` (JS → host). After this WP, an iOS host app embedding `JitsiMeetView` can call `JitsiMeetView.sendCustomXmppCommand(target, payload)` and register `onCustomXmppEvent:` to receive events.

## Context

The React Native bridge on iOS is two-sided:

1. **Host → JS:** the host app calls a method on `JitsiMeetView`. That method dispatches an `ExternalAPI` action string over the bridge. The RN middleware (WP06) listens for that string and dispatches a redux action.
2. **JS → Host:** the RN middleware emits an event string. The native module that hosts `JitsiMeetViewListener` forwards it back to the host app via the listener's optional method.

Reference pattern: `sendChatMessage` / `onChatUpdated` in `ios/sdk/src/ExternalAPI.{h,m}` and `ios/sdk/src/JitsiMeetView.{h,m}`.

## Detailed Guidance

### T013 — Add string constants in `ios/sdk/src/ExternalAPI.h`

Locate the existing string constants like:

```objc
extern NSString * const SEND_CHAT_MESSAGE;
extern NSString * const CHAT_UPDATED;
```

Add two more immediately after them:

```objc
extern NSString * const SEND_CUSTOM_XMPP_COMMAND;
extern NSString * const CUSTOM_XMPP_EVENT;
```

The values for these strings are defined in `ExternalAPI.m` (T014). They must equal `SEND_CUSTOM_XMPP_COMMAND` and `CUSTOM_XMPP_EVENT` exactly — no case change, no extra characters.

### T014 — Define constant values and action handler in `ios/sdk/src/ExternalAPI.m`

In `ExternalAPI.m`, find the `@implementation` block where existing constants are defined:

```objc
NSString * const SEND_CHAT_MESSAGE = @"SEND_CHAT_MESSAGE";
NSString * const CHAT_UPDATED = @"CHAT_UPDATED";
```

Add:

```objc
NSString * const SEND_CUSTOM_XMPP_COMMAND = @"SEND_CUSTOM_XMPP_COMMAND";
NSString * const CUSTOM_XMPP_EVENT = @"CUSTOM_XMPP_EVENT";
```

Then find the existing `sendChatMessageAction:` (or similarly named) handler that bridges `SEND_CHAT_MESSAGE` into the JS engine. Add a parallel handler:

```objc
- (void)sendCustomXmppCommandAction:(NSDictionary *)data {
    [self sendEventWithName:SEND_CUSTOM_XMPP_COMMAND body:data];
}
```

(Adjust the exact pattern to match the existing code — look at how `sendChatMessageAction` is invoked and registered. The dispatch may go through a different helper like `sendEventWithName:body:` or `RCTEventEmitter`.)

### T015 — Add `sendCustomXmppCommand:target:payload:` and `onCustomXmppEvent:` to `JitsiMeetView`

In `JitsiMeetView.h`:

```objc
- (void)sendCustomXmppCommand:(NSString *)action
                       target:(NSString *)targetId
                      payload:(NSDictionary * _Nullable)payload;

@optional
- (void)onCustomXmppEvent:(NSDictionary *)payload;
```

(Confirm the exact convention by looking at `sendChatMessage:to:` / `onChatUpdated:`. Adjust names if the project uses a different style.)

In `JitsiMeetView.m`, implement the methods:

```objc
- (void)sendCustomXmppCommand:(NSString *)action
                       target:(NSString *)targetId
                      payload:(NSDictionary *)payload {
    [self sendEventWithName:ExternalAPI.SEND_CUSTOM_XMPP_COMMAND
                       body:@{
                           @"action": action ?: SEND_CUSTOM_XMPP_COMMAND,
                           @"target": targetId ?: @"",
                           @"payload": payload ?: @{}
                       }];
}

- (void)onCustomXmppEvent:(NSDictionary *)payload {
    // dispatched by the listener implementation in JitsiMeetViewListener category,
    // forwarding payload to the host app's onCustomXmppEvent:
}
```

Note: `onCustomXmppEvent:` on `JitsiMeetView` itself may not be the right hook. The project typically routes the event via the `JitsiMeetViewListener` protocol. Check the existing `onChatUpdated:` flow and mirror it exactly.

If there is a `JitsiMeetView+PrivateAPI.m` or similar category where `JitsiMeetViewListener` methods are mapped to `JitsiMeetView` methods, add a new entry there.

## Branch Strategy

- **Planning base branch:** `meeting/develop`
- **Final merge target:** `meeting/develop`
- **Execution worktree:** the lane assigned by `lanes.json` after `finalize_tasks`. The implementing agent must `cd` into that worktree path before editing.

iOS files are not compiled during web lint — but they are compiled during the RN app build. Cross-check that `react-native` can find these constants in the RN module's export.

## Test Strategy

No automated tests. The smoke check is:

1. Open `ios/sdk/example/` (or equivalent sample app) in Xcode.
2. In the sample app's `ViewController.m`, call:

   ```objc
   [jitsiMeetView sendCustomXmppCommand:SEND_CUSTOM_XMPP_COMMAND
                                 target:@"test-target"
                                payload:@{ @"action": @"hello" }];
   ```

3. Confirm the JS console (Metro / Safari dev tools connected to the running RN app) shows the redux action `SEND_CUSTOM_XMPP_COMMAND` being dispatched.
4. From JS, dispatch a mock `CUSTOM_XMPP_EVENT_RECEIVED` with payload `{ hello: 'world' }`. Confirm the sample app's `onCustomXmppEvent:` (if registered) fires.

## Definition of Done

- [ ] Two new constants `SEND_CUSTOM_XMPP_COMMAND` and `CUSTOM_XMPP_EVENT` declared in `ExternalAPI.h` and defined in `ExternalAPI.m`.
- [ ] A new action handler bridging `SEND_CUSTOM_XMPP_COMMAND` to the JS engine is registered.
- [ ] `JitsiMeetView` exposes `sendCustomXmppCommand:target:payload:` and the host's `JitsiMeetViewListener`-style listener supports `onCustomXmppEvent:`.
- [ ] Xcode build (`xcodebuild` or `pod install` followed by `npm run ios`) succeeds for the iOS SDK sample.
- [ ] No new dependency, no new file outside the owned list.
- [ ] **NFR-004 verification**: `cd ios && pod install && xcodebuild -workspace ios/sdk/sdk.xcworkspace -scheme JitsiMeetSDK -configuration Debug build` produces no new warnings versus the baseline (capture the warning count in the commit message).

## Risks

- **String drift**: native side uses `SEND_CUSTOM_XMPP_COMMAND`; JS-side action type (from WP02) uses the same string `SEND_CUSTOM_XMPP_COMMAND`. Any case difference breaks the bridge.
- **`@protocol` extensions**: `JitsiMeetViewListener` is an Objective-C protocol. Adding new optional methods is safe; **do not** add required methods or change existing signatures.
- **`null` payload handling**: iOS Objective-C does not have null-safety; the `payload ?: @{}` fallback must be present to avoid NSNull crashes.
- **Category placement**: the `JitsiMeetViewListener` mapping may live in a category file (`.m`) — adding the new method to the wrong place causes silent failures.

## Reviewer Guidance

A reviewer should verify:

1. The constant strings match `SEND_CUSTOM_XMPP_COMMAND` and `CUSTOM_XMPP_EVENT` exactly (case-sensitive).
2. `sendCustomXmppCommand:target:payload:` accepts `NSDictionary *` for payload with proper null handling.
3. `onCustomXmppEvent:` is added to the `JitsiMeetViewListener` protocol as `@optional`.
4. The handler in `ExternalAPI.m` registers the action and forwards `data` to the JS engine.
5. No new file is created; only `ExternalAPI.{h,m}` and `JitsiMeetView.{h,m}` (plus any existing category file) are touched.

## Implementation Command

```
spec-kitty agent action implement WP04 --agent implementer-ivan
```