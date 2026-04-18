import { CONFERENCE_JOIN_IN_PROGRESS } from '../base/conference/actionTypes';
import { getLocalParticipant } from '../base/participants/functions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';

import { setDisableButton } from './actions.web';
import { MOSAIC_OVERLAY, PLAYBACK_STATUSES, SHARED_VIDEO } from './constants';
import { isSharedVideoEnabled } from './functions';

import './middleware.any';

MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    const state = getState();
    const localParticipantId = getLocalParticipant(state)?.id;

    switch (action.type) {
    case CONFERENCE_JOIN_IN_PROGRESS: {
        if (!isSharedVideoEnabled(state)) {
            break;
        }

        const { conference } = action;

        conference.addCommandListener(SHARED_VIDEO, ({ attributes }: { attributes:
            { from: string; state: string; }; }) => {
            const { from } = attributes;
            const status = attributes.state;

            // console.log(SHARED_VIDEO, attributes);

            if (status === PLAYBACK_STATUSES.PLAYING) {
                if (localParticipantId !== from) {
                    dispatch(setDisableButton(true));
                }
            } else if (status === 'stop') {
                dispatch(setDisableButton(false));
            }
        });

        conference.addCommandListener(MOSAIC_OVERLAY, ({ attributes }: { attributes:
            Record<string, string>; }) => {
            const { videoIdx, action, x, y, width, height, visible } = attributes;
            const idx = parseInt(videoIdx, 10);

            if (action === 'remove') {
                dispatch({
                    type: 'REMOVE_MOSAIC_OVERLAY',
                    videoIdx: idx
                });
            } else {
                const overlay = {
                    videoIdx: idx,
                    x: parseInt(x, 10),
                    y: parseInt(y, 10),
                    width: parseInt(width, 10),
                    height: parseInt(height, 10),
                    visible: visible === 'true'
                };
                dispatch({
                    type: 'SET_MOSAIC_OVERLAY',
                    videoIdx: idx,
                    overlay
                });
            }
        });
        break;
    }
    }

    return next(action);
});
