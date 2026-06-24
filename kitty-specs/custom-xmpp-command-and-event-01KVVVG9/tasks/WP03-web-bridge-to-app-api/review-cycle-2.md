# WP03 Review Feedback (Cycle 1)

## Critical issue: T010 not implemented

The implementer added the redux-side case `case CUSTOM_XMPP_EVENT_RECEIVED: APP.API.notifyCustomXmppEvent(action.payload);` but did NOT add T010 (defining `APP.API.notifyCustomXmppEvent` itself).

Result: when a `CUSTOM_XMPP_EVENT_RECEIVED` action is dispatched, the call `APP.API.notifyCustomXmppEvent` will throw `TypeError: APP.API.notifyCustomXmppEvent is not a function`. The receive path is broken at runtime.

## Required fixes

1. **T010**: Add `notifyCustomXmppEvent` to `modules/API/API.js` inside the `class API { ... }` block (alongside `notifyChatUpdated` around line 1225 — note this is a class, not the legacy `APP.API` namespace from the WP prompt example, so the implementer should mirror the class-method pattern):

   ```js
   /**
    * Notify external application (if API is enabled) that a custom XMPP event
    * has been received.
    *
    * @param {Object} data - The decoded custom XMPP payload.
    * @returns {void}
    */
   notifyCustomXmppEvent(data) {
       this._sendEvent({
           name: 'custom-xmpp-event',
           data
       });
   }
   ```

   The wire name `custom-xmpp-event` must match the `events` map key in `modules/API/external/external_api.js` (added in WP01).

2. **T012 (verify)**: Confirm the host-side postMessage switch in `modules/API/external/external_api.js` already routes `custom-xmpp-event` to host listeners. The `_setupListeners` function (line 589-710) handles internal events explicitly (lines 593-699) and then has a generic fallback (lines 701-707) that uses `events[name]` to look up the camelCase name and emit to consumers. Since WP01 added `'custom-xmpp-event': 'customXmppEvent'` to the `events` map, the generic path will dispatch `customXmppEvent` to `api.addEventListener('customXmppEvent', ...)` listeners WITHOUT requiring a custom `case` in the explicit switch. So T012 is effectively already handled by the generic dispatch — no extra case needed. The implementer should confirm this is still the case after merging WP01 and add a regression test if not already present.

3. **T011 (already done, no change needed)**: The redux-side case is correctly added inside the `switch (action.type)` block in `react/features/external-api/middleware.ts`.

After fixing, re-commit and move WP03 back to for_review.