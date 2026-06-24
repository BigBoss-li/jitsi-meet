---
work_package_id: WP01
title: Web external API 注册
dependencies: []
requirement_refs:
- C-005
- FR-001
- FR-003
- FR-004
- FR-006
tracker_refs: []
planning_base_branch: meeting/develop
merge_target_branch: meeting/develop
branch_strategy: Planning artifacts for this mission were generated on meeting/develop. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into meeting/develop unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-custom-xmpp-command-and-event-01KVVVG9
base_commit: e00217230d40163e19efdfd0fc0f081aa2d7583a
created_at: '2026-06-24T05:36:09.287711+00:00'
subtasks:
- T001
- T002
- T003
- T004
agent: node-norris
shell_pid: '14074'
history:
- timestamp: '2026-06-24T04:15:00Z'
  action: created
  by: spec-kitty.tasks
agent_profile: node-norris
authoritative_surface: modules/API/external/external_api.js
create_intent: []
execution_mode: code_change
model: sonnet
owned_files:
- modules/API/external/external_api.js
role: implementer
tags: []
---

## ⚡ Do This First: Load Agent Profile

Before reading any other section of this prompt, the implementing agent **must** load the assigned agent profile via `/ad-hoc-profile-load node-norris`. This loads domain context (Node.js module conventions, the `JitsiMeetExternalAPI` architecture, and the project's existing dispatch patterns) into your working memory. Do not skip this step.

## Objective

Make the new `sendCustomXmppCommand` command and `customXmppEvent` event discoverable by every consumer of `JitsiMeetExternalAPI` (web iframe) by adding two map entries in `modules/API/external/external_api.js`.

## Context

This is the first step in shipping the custom-XMPP feature. After this WP, host pages embedded in the jitsi-meet iframe can call `api.executeCommand('sendCustomXmppCommand', { target, payload })` and the dispatch machinery will route the command to a custom reducer case in `react/features/external-api/middleware.ts` (added in WP03). The mapping between the camelCase public method name and the kebab-case wire name is the job of `commands` and `events` maps in `external_api.js`.

Reference contract: [`contracts/custom-xmpp.md`](../contracts/custom-xmpp.md).
Reference plan IC: [IC-01 Web external API 注册](../plan.md#ic-01--web-external-api-registration-).

## Detailed Guidance

### T001 — Register `sendCustomXmppCommand` in the commands map

Open `modules/API/external/external_api.js`. Around **line 29** you will find the `commands` constant object that maps each camelCase public method to its kebab-case wire name. Insert one new entry, alphabetised or grouped sensibly next to similar entries:

```js
sendCustomXmppCommand: 'send-custom-xmpp-command',
```

Verify the surrounding existing entries (e.g., `sendChatMessage: 'send-chat-message'`) follow the same pattern: a JavaScript object literal entry with no trailing comma before the closing brace.

### T002 — Register `customXmppEvent` in the events map

In the same file, around **line 107**, the `events` constant object maps kebab-case wire names (incoming `postMessage` from the iframe) to camelCase public event names (the names host pages subscribe to with `api.addEventListener`). Insert one new entry:

```js
'custom-xmpp-event': 'customXmppEvent'
```

Note that this is the **inverse** direction of `commands`: keys are kebab-case (wire) and values are camelCase (public). The asymmetry is intentional — it is how `executeCommand` and `addEventListener` find each other.

### T003 — Manual sanity check in the browser

1. Run `npm start` (or `make dev`) to launch the webpack dev server.
2. Open `doc/examples/api.html` in **two** browser tabs. Use any conference room (e.g., `meet.jit.si/TestRoom`).
3. In the DevTools console of one tab, paste:

   ```js
   api.executeCommand('sendCustomXmppCommand', {
       target: 'this-id-does-not-exist',
       payload: { action: 'noop' }
   });
   ```

4. **Expected behaviour:** no `Cannot find command` or `unknown command` error. The dispatch reaches the iframe-side feature module (added in WP02) and is silently dropped there with a `console.error` for the unknown target. There should be no host-page error.

If you see "Cannot find command 'sendCustomXmppCommand'" or similar, the wire-name mapping is broken — re-check T001.

### T004 — Add the host-side dispatch case for `custom-xmpp-event`

The `events` map in T002 registers the translation; it does **not** automatically add a host-side switch case. Open `external_api.js` again and find the host-side message switch (the function that receives `postMessage` events from the iframe and dispatches to host-side handlers). Locate where `'chat-updated'` (or similar) is handled. Add a parallel case:

```js
case 'custom-xmpp-event':
    API.notifyCustomXmppEvent && API.notifyCustomXmppEvent(data.data);
    break;
```

(Adjust field access to match how `'chat-updated'` is handled — the exact shape is `data.data` or `data` depending on the existing wrapper.)

**Skip this step** if you discover that the host-side switch already handles unknown events by default (some jitsi-meet versions do this). Run the two-tab test from WP03's smoke check after this WP to confirm the event reaches the host.

## Branch Strategy

This WP runs on the coordination branch `kitty/mission-custom-xmpp-command-and-event-01KVVVG9` (the worktree assigned by `finalize_tasks`). The WP edits `modules/API/external/external_api.js` in place; no new branch is created from this WP itself.

- **Planning base branch:** `meeting/develop`
- **Final merge target:** `meeting/develop`
- **Execution worktree:** the lane assigned by `lanes.json` after `finalize_tasks` runs. The implementing agent must `cd` into that worktree path before editing.

After this WP is complete, downstream WPs (WP02, WP03) will read these map entries. Do **not** rename or remove them once committed.

## Test Strategy

This WP does not introduce automated tests. The manual smoke check in T003 is the verification:

- `npm run lint:ci` must still pass (no new warnings).
- `npm run tsc:web` and `npm run tsc:native` must still pass.
- `doc/examples/api.html` must continue to function end-to-end with no regression in any of the existing buttons.

## Definition of Done

- [ ] Two new entries in `external_api.js`: `sendCustomXmppCommand` in `commands`, `'custom-xmpp-event'` in `events`.
- [ ] Manual smoke check in browser succeeds: `executeCommand('sendCustomXmppCommand', …)` is recognised by the dispatch layer.
- [ ] `npm run lint`, `npm run tsc:web`, `npm run tsc:native` all pass with **no** new warnings.
- [ ] Existing `doc/examples/api.html` buttons still work end-to-end (regression check).
- [ ] Commit message follows the project convention (see `git log --oneline -5`): scope is `feat(api)` or similar, body references the mission slug.

## Risks

- **Asymmetric map convention**: `commands` keys are camelCase, `events` keys are kebab-case. Forgetting this causes the dispatch to look in the wrong direction. Mitigation: cross-reference `contracts/custom-xmpp.md` before editing.
- **Stale dev cache**: webpack-dev-server may cache `external_api.js`. If the smoke check fails, restart the dev server before debugging further.
- **Lint may flag `quote-props`** on the `events` entry because kebab-case keys require quotes. This is **expected** and the project's ESLint config already allows it for this map.

## Reviewer Guidance

A reviewer should verify:

1. The strings `send-custom-xmpp-command` and `customXmppEvent` match `contracts/custom-xmpp.md` character-for-character.
2. The `commands` and `events` map shapes are unchanged apart from the new entries.
3. `git diff modules/API/external/external_api.js` shows only two new lines (or two adjacent edits), no unrelated refactoring.
4. The smoke check passes — the reviewer can run the same `executeCommand` call and confirm no "unknown command" error.

## Implementation Command

```
spec-kitty agent action implement WP01 --agent node-norris
```

## Activity Log

- 2026-06-24T05:56:28Z – user – shell_pid=14074 – Review passed: 2 new map entries verified (sendCustomXmppCommand in commands, 'custom-xmpp-event' in events), contract strings match contracts/custom-xmpp.md character-for-character, lint clean (eslint no output, no new warnings), T004 skip justified by existing events[name] generic dispatch at line 701, diff is minimal (2 insertions, no unrelated refactoring). Override of prior review-cycle-1 stale-workspace reset. Force override of .gitignore/node_modules noise unrelated to WP01 deliverable (commit 8b441ca55 already contains the actual change).
