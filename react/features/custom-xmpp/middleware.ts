import { CONFERENCE_JOINED } from '../base/conference/actionTypes';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';

import { SEND_CUSTOM_XMPP_COMMAND } from './actionTypes';
import { customXmppEventReceived } from './actions';
import {
    tryDecodeCustomXmppMessage,
    validateCustomXmppPayload
} from './functions';
import logger from './logger';

MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case CONFERENCE_JOINED: {
        // The listener is attached inside CONFERENCE_JOINED so that we never
        // subscribe twice (matches the chat feature's deduplication pattern).
        const { conference } = action;

        conference.on(
            JitsiConferenceEvents.PRIVATE_MESSAGE_RECEIVED,
            (_participantId: string, message: string) => {
                // Per spec INV-2 only the message body is interesting; the
                // participantId / timestamp / messageId are intentionally
                // ignored so the host page never sees them.
                const decoded = tryDecodeCustomXmppMessage(message);

                if (decoded) {
                    store.dispatch(customXmppEventReceived(decoded));
                } else {
                    logger.error('Failed to decode custom XMPP message body');
                }
            }
        );
        break;
    }

    case SEND_CUSTOM_XMPP_COMMAND: {
        const { target, payload } = action;

        const result = validateCustomXmppPayload(payload);

        if (!result.ok) {
            logger.error(`sendCustomXmppCommand rejected: ${result.reason}`, { target });

            return next(action);
        }

        const { conference } = store.getState()['features/base/conference'];

        if (!conference) {
            logger.error('sendCustomXmppCommand called before CONFERENCE_JOINED');

            return next(action);
        }

        try {
            conference.sendPrivateTextMessage(target, result.serialised);
        } catch (e) {
            logger.error('sendPrivateTextMessage threw', e);
        }

        return next(action);
    }
    }

    return next(action);
});
