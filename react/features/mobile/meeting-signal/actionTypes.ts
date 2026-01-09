/**
 * The type of the action which sets the list of known participant IDs which
 * have an active screen share.
 *
 * @returns {{
    *     type: MEETING_SIGNALS_UPDATED,
    *     meetingSignals: Array<object>
    * }}
    */
export const MEETING_SIGNALS_UPDATED
    = 'MEETING_SIGNALS_UPDATED';


export const CHECK_MEETING_SIGNAL
    = 'CHECK_MEETING_SIGNAL';