import { CENTRAL_CONTROL_VIDEO, CUSTOM_OVERFLOW_MENU_BUTTON_PRESSED,
    CUSTOM_SCREEN_RECORD_PRESSED } from './actionTypes';

export * from './actions.any';

/**
 * Shows the toolbox for specified timeout.
 *
 * @param {number} _timeout - Timeout for showing the toolbox.
 * @returns {Function}
 */
export function showToolbox(_timeout?: number): any {
    return {};
}

/**
 * Shows/hides the overflow menu.
 *
 * @param {boolean} _visible - True to show it or false to hide it.
 * @returns {{
 *     type: SET_OVERFLOW_MENU_VISIBLE,
 *     visible: boolean
 * }}
 */
export function setOverflowMenuVisible(_visible: boolean): any {
    return {};
}

/**
 * Creates a (redux) action which that a custom overflow menu button was pressed.
 *
 * @param {string} id - The id for the custom button.
 * @param {string} text - The label for the custom button.
 * @returns {{
 *     type: CUSTOM_OVERFLOW_MENU_BUTTON_PRESSED,
 *     id: string,
 *     text: string
 * }}
 */
export function customOverflowMenuButtonPressed(id: string, text: string) {
    return {
        type: CUSTOM_OVERFLOW_MENU_BUTTON_PRESSED,
        id,
        text
    };
}

/**
 * Creates a (redux) action which signals that a custom screen record button was pressed.
 *
 * @param {boolean} isRecording - Whether the screen record button is pressed or not.
 * @returns {{
 *     type: CUSTOM_SCREEN_RECORD_PRESSED,
 *     isRecording: boolean
 * }}
 */
export function customScreenRecordPressed(isRecording: boolean) {

    return {
        type: CUSTOM_SCREEN_RECORD_PRESSED,
        isRecording
    };
}

/**
 * Plays a video through central control.
 *
 * @param {string} videoUrl - The video URL to play.
 * @returns {{
 *     type: CENTRAL_CONTROL_VIDEO,
 *    videoUrl: string
 * }}
 */
export function centralControlVideoPlay(videoUrl: string) {
    return {
        type: CENTRAL_CONTROL_VIDEO,
        videoUrl
    };
}
