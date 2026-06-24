import {
    CUSTOM_XMPP_EVENT_RECEIVED,
    SEND_CUSTOM_XMPP_COMMAND
} from './actionTypes';

/**
 * Action creator for the send side of the custom XMPP feature. The
 * middleware is responsible for validating {@code payload} and forwarding the
 * serialised form to {@code conference.sendPrivateTextMessage}.
 *
 * @param {string} target - The id of the recipient participant.
 * @param {unknown} payload - The arbitrary host-supplied payload to send.
 * @returns {{
 *     type: SEND_CUSTOM_XMPP_COMMAND,
 *     target: string,
 *     payload: unknown
 * }}
 */
export function sendCustomXmppCommand(target: string, payload: unknown) {
    return {
        type: SEND_CUSTOM_XMPP_COMMAND,
        target,
        payload
    };
}

/**
 * Action creator for the receive side of the custom XMPP feature. The
 * middleware dispatches this action when a private message is decoded into a
 * valid JSON object.
 *
 * @param {Record<string, unknown>} payload - The decoded payload received
 * from a remote participant.
 * @returns {{
 *     type: CUSTOM_XMPP_EVENT_RECEIVED,
 *     payload: Record<string, unknown>
 * }}
 */
export function customXmppEventReceived(payload: Record<string, unknown>) {
    return {
        type: CUSTOM_XMPP_EVENT_RECEIVED,
        payload
    };
}
