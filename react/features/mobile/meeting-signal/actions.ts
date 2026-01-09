import { CHECK_MEETING_SIGNAL, MEETING_SIGNALS_UPDATED } from './actionTypes';

/**
 * Creates a (redux) action which signals that the list of known participants
 * with screen shares has changed.
 *
 * @param {Array} meetingSignals - The participants which currently have active
 * screen share streams.
 * @returns {{
 *     type: MEETING_SIGNALS_UPDATED,
 *     meetingSignals: Array
 * }}
 */
export function setMeetingSignals(meetingSignals: Array<object>) {

    return {
        type: MEETING_SIGNALS_UPDATED,
        meetingSignals
    };
}

/**
 * Creates a (redux) action which signals that a meeting signal has been checked.
 *
 * @param {string} meetingSignalId - The id of the meeting signal which has been checked.
 * @param {boolean} checked - Whether the meeting signal has been checked or not.
 * @returns {{
 *     type: CHECK_MEETING_SIGNAL,
 *     meetingSignalId: string,
 *     checked: boolean
 * }}
 */
export function checkMeetingSignal(meetingSignalId: string, checked: boolean) {

    return {
        type: CHECK_MEETING_SIGNAL,
        meetingSignalId,
        checked
    };
}
