---
affected_files: []
cycle_number: 1
mission_slug: custom-xmpp-command-and-event-01KVVVG9
reproduction_command:
reviewed_at: '2026-06-24T06:32:39Z'
reviewer_agent: coordinator
verdict: rejected
wp_id: WP07
review_artifact_override_at: "2026-06-24T07:08:51Z"
review_artifact_override_actor: "operator"
review_artifact_override_wp_id: "WP07"
review_artifact_override_reason: "Arbiter override of prior reset-only review-cycle-1.md: WP07 implementation is complete and passes all acceptance criteria. doc/examples/custom-xmpp-example.html (118 lines) mirrors doc/examples/api.html iframe pattern - loads https://meet.jit.si/external_api.js, constructs new JitsiMeetExternalAPI(domain, options), button onclick calls api.executeCommand('sendCustomXmppCommand', { target, payload }), api.addEventListener('customXmppEvent') appends JSON-serialised payload line to <div id=custom-xmpp-log>. doc/api.md has a complete new section (lines 5-119) documenting both sendCustomXmppCommand (command) and customXmppEvent (event) with web (api.executeCommand + api.addEventListener) and React Native (NativeModules.JitsiMeetView.sendCustomXmppCommand + NativeEventEmitter.addListener) examples, plus parameters, returns, errors, trigger conditions, and idempotency guidance. ESLint on custom-xmpp + middlewares + modules/API exits 0 with no warnings. tsc:web passes clean (no output). tsc:native has exactly 281 pre-existing baseline errors (identical count to meeting/develop primary checkout), all in unrelated web-only files (web-hid, virtual-background, toolbox/web/DialogPortal, welcome/AbstractWelcomePage) - zero new errors from WP01-WP07. Symbols verified live: sendCustomXmppCommand and customXmppEvent wired through modules/API/external/external_api.js commands/events maps, notifyCustomXmppEvent in modules/API/API.js, imported by react/features/external-api/middleware.ts (CUSTOM_XMPP_EVENT_RECEIVED) and react/features/mobile/external-api/middleware.ts (CUSTOM_XMPP_EVENT_RECEIVED + sendCustomXmppCommand). No MUST NOT clauses in spec/plan/contracts. No dead code. doc/ is authoritative_surface per WP07 frontmatter. Approving."
---

**Reset**: lane-g merge conflict resolved (all 6 dependency lanes merged in). Re-claim fresh.
