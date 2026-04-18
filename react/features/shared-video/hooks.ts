import { useSelector } from 'react-redux';

import { SharedVideoButton } from './components';
import { isSharedVideoEnabled } from './functions';
import MosaicOverlayButton from './components/web/MosaicOverlayButton';

const shareVideo = {
    key: 'sharedvideo',
    Content: SharedVideoButton,
    group: 3
};

const mosaicOverlay = {
    key: 'mosaicoverlay',
    Content: MosaicOverlayButton,
    group: 3
};

/**
 * A hook that returns the shared video button if it is enabled and undefined otherwise.
 *
 *  @returns {Object | undefined}
 */
export function useSharedVideoButton() {
    const sharedVideoEnabled = useSelector(isSharedVideoEnabled);

    if (sharedVideoEnabled) {
        return shareVideo;
    }
}

/**
 * A hook that returns the mosaic overlay button if user is moderator and shared video is enabled.
 *
 *  @returns {Object | undefined}
 */
export function useMosaicOverlayButton() {
    const sharedVideoEnabled = useSelector(isSharedVideoEnabled);
    const hasSharedVideo = useSelector(state => {
        const sharedVideoState = state as any;
        return Boolean(sharedVideoState['features/shared-video']?.videoUrl);
    });

    if (sharedVideoEnabled && hasSharedVideo) {
        return mosaicOverlay;
    }
}
