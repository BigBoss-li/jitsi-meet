import ReducerRegistry from '../../base/redux/ReducerRegistry';

import { SCREEN_RECORD_UPDATED } from './actionTypes';

export interface IScreenRecordExternalApiState {
    isRecording: boolean;
}

const DEFAULT_STATE = {
    isRecording: false
};

ReducerRegistry.register<IScreenRecordExternalApiState>('features/mobile/screen-record',
    (state = DEFAULT_STATE, action): IScreenRecordExternalApiState => {
        switch (action.type) {
        case SCREEN_RECORD_UPDATED: {
            return {
                ...state,
                isRecording: action.isRecording
            };
        }
        }

        return state;
    });
