import ReducerRegistry from '../base/redux/ReducerRegistry';

import { MEETING_CANVAS_STATUS_UPDATED } from './actionTypes';

export interface IMeetingCanvasExternalApiState {
    isCanvasOpen: boolean;
}

const DEFAULT_STATE = {
    isCanvasOpen: false
};

ReducerRegistry.register<IMeetingCanvasExternalApiState>('features/meeting-canvas',
    (state = DEFAULT_STATE, action): IMeetingCanvasExternalApiState => {
        switch (action.type) {
        case MEETING_CANVAS_STATUS_UPDATED: {
            return {
                ...state,
                isCanvasOpen: action.isCanvasOpen
            };
        }
        }

        return state;
    });
