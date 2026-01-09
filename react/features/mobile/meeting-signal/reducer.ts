import ReducerRegistry from '../../base/redux/ReducerRegistry';

import { CHECK_MEETING_SIGNAL, MEETING_SIGNALS_UPDATED } from './actionTypes';

export interface IMeetingSignalsExternalApiState {
    meetingSignals: any[];
}

const DEFAULT_STATE = {
    meetingSignals: []
};

ReducerRegistry.register<IMeetingSignalsExternalApiState>('features/mobile/meeting-signal',
    (state = DEFAULT_STATE, action): IMeetingSignalsExternalApiState => {
        switch (action.type) {
        case MEETING_SIGNALS_UPDATED: {
            return {
                ...state,
                meetingSignals: action.meetingSignals
            };
        }
        case CHECK_MEETING_SIGNAL: {
            return {
                ...state,
                meetingSignals: state.meetingSignals.map(meetingSignal => {
                    if (meetingSignal.id === action.meetingSignalId) {
                        return {
                            ...meetingSignal,
                            checked: action.checked
                        };
                    }

                    return meetingSignal;
                })
            };
        }
        }

        return state;
    });
