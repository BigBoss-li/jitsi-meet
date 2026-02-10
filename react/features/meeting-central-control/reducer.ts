import ReducerRegistry from '../base/redux/ReducerRegistry';

import { MEETING_CANDIDATE_UPDATED, MEETING_OFFER_UPDATED } from './actionTypes';

export interface IMeetingCentralControlExternalApiState {
    centralControl: Map<string, { candidate: string; offer: string; }>;
}

const DEFAULT_STATE = {
    centralControl: new Map<string, { candidate: string; offer: string; }>()
};

ReducerRegistry.register<IMeetingCentralControlExternalApiState>(
    'features/meeting-central-control',
    (state = DEFAULT_STATE, action): IMeetingCentralControlExternalApiState => {
        switch (action.type) {
        case MEETING_OFFER_UPDATED: {
            const { videoUrl, offer } = action;
            const centralControl = new Map(state.centralControl);
            const current = centralControl.get(videoUrl)
                || { candidate: '',
                    offer: '' };

            centralControl.set(videoUrl, {
                ...current,
                offer
            });

            return {
                ...state,
                centralControl
            };
        }

        case MEETING_CANDIDATE_UPDATED: {
            const { videoUrl, candidate } = action;
            const centralControl = new Map(state.centralControl);
            const current = centralControl.get(videoUrl)
                || { candidate: '',
                    offer: '' };

            centralControl.set(videoUrl, {
                ...current,
                candidate
            });

            return {
                ...state,
                centralControl
            };
        }
        }

        return state;
    }
);
