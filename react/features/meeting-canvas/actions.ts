import { MEETING_CANVAS_STATUS_UPDATED } from './actionTypes';

/**
 * Creates a (redux) action which signals that the list of known participants
 * with screen shares has changed.
 *
 * @param {boolean} isCanvasOpen - The participants which currently have active
 * screen share streams.
 * @returns {{
 *     type: MEETING_CANVAS_STATUS_UPDATED,
 *     isOpen: boolean
 * }}
 */
export function setMeetingCanvasStatus(isCanvasOpen: boolean) {

    return {
        type: MEETING_CANVAS_STATUS_UPDATED,
        isCanvasOpen
    };
}
