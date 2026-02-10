import { MEETING_CANDIDATE_UPDATED, MEETING_CENTRAL_CONTROL_UPDATED, MEETING_OFFER_UPDATED } from './actionTypes';

/**
 * Creates a (redux) action which updates offer for a video.
 *
 * @param {string} videoUrl - The video URL.
 * @param {string} offer - The offer SDP.
 * @returns {{
 *     type: MEETING_OFFER_UPDATED,
 *     videoUrl: string,
 *     offer: string
 * }}
 */
export function updateOffer(videoUrl: string, offer: string) {
    return {
        type: MEETING_OFFER_UPDATED,
        videoUrl,
        offer
    };
}

/**
 * Creates a (redux) action which updates candidate for a video.
 *
 * @param {string} videoUrl - The video URL.
 * @param {string} candidate - The ICE candidate.
 * @returns {{
 *     type: MEETING_CANDIDATE_UPDATED,
 *     videoUrl: string,
 *     candidate: string
 * }}
 */
export function updateCandidate(videoUrl: string, candidate: string) {
    return {
        type: MEETING_CANDIDATE_UPDATED,
        videoUrl,
        candidate
    };
}

/**
 * Creates a (redux) action which signals that the list of known participants
 * with screen shares has changed.
 *
 * @param {Array} centralControl - The participants which currently have active
 * screen share streams.
 * @returns {{
 *     type: MEETING_CENTRAL_CONTROL_UPDATED,
 *     centralControl: Object
 * }}
 */
export function updateMeetingCentralControl(centralControl: Object) {

    return {
        type: MEETING_CENTRAL_CONTROL_UPDATED,
        centralControl
    };
}
