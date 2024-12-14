import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    SET_AUDIO_SETTINGS_VISIBILITY,
    SET_SIGNAL_LAYOUT,
    SET_SIGNAL_SETTINGS_VISIBILITY,
    SET_VIDEO_SETTINGS_VISIBILITY
} from './actionTypes';

export interface ISettingsState {
    audioSettingsVisible?: boolean;
    signalLayout?: string;
    signalSettingsVisible?: boolean;
    videoSettingsVisible?: boolean;
}

ReducerRegistry.register('features/settings', (state: ISettingsState = {}, action) => {
    switch (action.type) {
    case SET_AUDIO_SETTINGS_VISIBILITY:
        return {
            ...state,
            audioSettingsVisible: action.value
        };
    case SET_VIDEO_SETTINGS_VISIBILITY:
        return {
            ...state,
            videoSettingsVisible: action.value
        };
    case SET_SIGNAL_SETTINGS_VISIBILITY:
        return {
            ...state,
            signalSettingsVisible: action.value
        };
    case SET_SIGNAL_LAYOUT:

        return {
            ...state,
            signalLayout: action.value
        };
    }

    return state;
});
