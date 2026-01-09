import {
    SET_SIGNAL_LAYOUT
} from './actionTypes';

/**
 * Sets the visibility of the video settings.
 *
 * @param {string} value - The new value.
 * @returns {Function}
 */
export function setSignalSettingsLayout(value: string) {

    return {
        type: SET_SIGNAL_LAYOUT,
        value
    };
}

/**
 * Toggles the visibility of the video settings.
 *
 * @param {string} layout - The new settings.
 * @returns {void}
 */
export function setSignalLayout(layout: string) {
    return (dispatch: IStore['dispatch']) => {

        dispatch(setSignalSettingsLayout(layout));
    };
}
