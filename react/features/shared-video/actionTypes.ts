/**
 * The type of the action which signals to update the current known state of the
 * shared video.
 *
 * {
 *     type: SET_SHARED_VIDEO_STATUS,
 *     status: string
 * }
 */
export const SET_SHARED_VIDEO_STATUS = 'SET_SHARED_VIDEO_STATUS';

/**
 * The type of the action which signals to reset the current known state of the
 * shared video.
 *
 * {
 *     type: RESET_SHARED_VIDEO_STATUS,
 * }
 */
export const RESET_SHARED_VIDEO_STATUS = 'RESET_SHARED_VIDEO_STATUS';

/**
 * The type of the action which marks that the user had confirmed to play video.
 *
 * {
 *     type: SET_CONFIRM_SHOW_VIDEO
 * }
 */
export const SET_CONFIRM_SHOW_VIDEO = 'SET_CONFIRM_SHOW_VIDEO';


/**
 * The type of the action which signals to disable or enable the shared video
 * button.
 *
 * {
 *     type: SET_DISABLE_BUTTON
 * }
 */
export const SET_DISABLE_BUTTON = 'SET_DISABLE_BUTTON';

/**
 * The type of the action which sets an array of whitelisted urls.
 *
 * {
 *     type: SET_ALLOWED_URL_DOMAINS
 * }
 */
export const SET_ALLOWED_URL_DOMAINS = 'SET_ALLOWED_URL_DOMAINS';

/**
 * The type of the action which sets or updates a mosaic overlay for a video.
 *
 * {
 *     type: SET_MOSAIC_OVERLAY,
 *     videoIdx: number,
 *     overlay: IMosaicOverlay
 * }
 */
export const SET_MOSAIC_OVERLAY = 'SET_MOSAIC_OVERLAY';

/**
 * The type of the action which removes a mosaic overlay from a video.
 *
 * {
 *     type: REMOVE_MOSAIC_OVERLAY,
 *     videoIdx: number
 * }
 */
export const REMOVE_MOSAIC_OVERLAY = 'REMOVE_MOSAIC_OVERLAY';
