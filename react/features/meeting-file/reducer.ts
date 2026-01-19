import ReducerRegistry from '../base/redux/ReducerRegistry';

import { MEETING_FILES_UPDATED } from './actionTypes';
import { IMeetingFile } from './types';

export interface IMeetingFilesExternalApiState {
    meetingFiles: Array<IMeetingFile>;
}

const DEFAULT_STATE = {
    meetingFiles: []
};

ReducerRegistry.register<IMeetingFilesExternalApiState>('features/meeting-file',
    (state = DEFAULT_STATE, action): IMeetingFilesExternalApiState => {
        switch (action.type) {
        case MEETING_FILES_UPDATED: {
            return {
                ...state,
                meetingFiles: action.meetingFiles
            };
        }
        }

        return state;
    });
