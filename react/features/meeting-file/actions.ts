import { MEETING_FILES_UPDATED } from './actionTypes';

/**
 * Creates a (redux) action which signals that the list of known participants
 * with screen shares has changed.
 *
 * @param {Array} meetingFiles - The participants which currently have active
 * screen share streams.
 * @returns {{
 *     type: MEETING_FILES_UPDATED,
 *     meetingFiles: Array
 * }}
 */
export function setMeetingFiles(meetingFiles: Array<object>) {

    return {
        type: MEETING_FILES_UPDATED,
        meetingFiles
    };
}
