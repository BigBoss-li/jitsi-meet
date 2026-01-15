import { SCREEN_RECORD_UPDATED } from './actionTypes';

/**
 * Creates a (redux) action which signals that the list of known participants
 * with screen shares has changed.
 *
 * @param {boolean} isRecording - The participants which currently have active
 * screen share streams.
 * @returns {{
 *     type: SCREEN_RECORD_UPDATED,
 *     isRecording: boolean
 * }}
 */
export function setScreenRecord(isRecording: boolean) {

    return {
        type: SCREEN_RECORD_UPDATED,
        isRecording
    };
}
