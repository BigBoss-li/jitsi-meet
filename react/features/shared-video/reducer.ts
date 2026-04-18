import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    RESET_SHARED_VIDEO_STATUS,
    SET_ALLOWED_URL_DOMAINS,
    SET_CONFIRM_SHOW_VIDEO,
    SET_DISABLE_BUTTON,
    SET_SHARED_VIDEO_STATUS,
    SET_MOSAIC_OVERLAY,
    REMOVE_MOSAIC_OVERLAY,
    SET_EDIT_MODE
} from './actionTypes';
import { DEFAULT_ALLOWED_URL_DOMAINS } from './constants';

const initialState = {
    allowedUrlDomains: DEFAULT_ALLOWED_URL_DOMAINS,
    editMode: false,
    mosaicOverlays: {}
};

export interface ISharedVideoState {
    allowedUrlDomains: Array<string>;
    confirmShowVideo?: boolean;
    disabled?: boolean;
    editMode?: boolean;
    muted?: boolean;
    mosaicOverlays: Record<number, IMosaicOverlay>;
    ownerId?: string;
    status?: string;
    time?: number;
    videoUrl?: string;
    volume?: number;
}

/**
 * The shape of a mosaic overlay.
 * Note: This interface is imported from actions.any.ts
 * and re-exported here for ReducerRegistry convenience.
 */
type IMosaicOverlay = {
    videoIdx: number;
    x: number;
    y: number;
    width: number;
    height: number;
    visible: boolean;
};

/**
 * Reduces the Redux actions of the feature features/shared-video.
 */
ReducerRegistry.register<ISharedVideoState>('features/shared-video',
(state = initialState, action): ISharedVideoState => {
    const { videoUrl, status, time, ownerId, disabled, muted, volume } = action;

    switch (action.type) {
    case RESET_SHARED_VIDEO_STATUS:
        return {
            ...initialState,
            allowedUrlDomains: state.allowedUrlDomains
        };
    case SET_CONFIRM_SHOW_VIDEO: {
        return {
            ...state,
            confirmShowVideo: action.value
        };
    }
    case SET_SHARED_VIDEO_STATUS:
        return {
            ...state,
            muted,
            ownerId,
            status,
            time,
            videoUrl,
            volume
        };

    case SET_DISABLE_BUTTON:
        return {
            ...state,
            disabled
        };

    case SET_ALLOWED_URL_DOMAINS: {
        return {
            ...state,
            allowedUrlDomains: action.allowedUrlDomains
        };
    }

    case SET_MOSAIC_OVERLAY: {
        const { videoIdx, overlay } = action;
        return {
            ...state,
            mosaicOverlays: {
                ...state.mosaicOverlays,
                [videoIdx]: overlay
            }
        };
    }

    case REMOVE_MOSAIC_OVERLAY: {
        const { videoIdx } = action;
        const { [videoIdx]: _, ...rest } = state.mosaicOverlays;
        return {
            ...state,
            mosaicOverlays: rest
        };
    }

    case SET_EDIT_MODE: {
        return {
            ...state,
            editMode: action.editMode
        };
    }

    default:
        return state;
    }
});
