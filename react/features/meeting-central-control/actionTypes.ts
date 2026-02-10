/**
 * The type of the action which sets the list of known participant IDs which
 * have an active screen share.
 *
 * @returns {{
    *     type: MEETING_CENTRAL_CONTROL_UPDATED,
    *     meetingSignals: Array<object>
    * }}
    */
export const MEETING_OFFER_UPDATED
    = 'MEETING_OFFER_UPDATED';

/**
 * The type of the action which updates candidate for a video.
 */
export const MEETING_CANDIDATE_UPDATED
    = 'MEETING_CANDIDATE_UPDATED';

/**
 * The type of the action which sets the list of known participant IDs which
 * have an active screen share.
 *
 * @returns {{
 *     type: MEETING_CENTRAL_CONTROL_UPDATED,
 *     meetingSignals: Array<object>
 * }}
 */
export const MEETING_CENTRAL_CONTROL_UPDATED
    = 'MEETING_CENTRAL_CONTROL_UPDATED';
