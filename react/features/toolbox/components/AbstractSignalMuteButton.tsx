import { IReduxState } from '../../app/types';
import { VIDEO_MUTE_BUTTON_ENABLED } from '../../base/flags/constants';
import { getFeatureFlag } from '../../base/flags/functions';
import { MEDIA_TYPE } from '../../base/media/constants';
import { IProps as AbstractButtonProps } from '../../base/toolbox/components/AbstractButton';
import BaseSignalMuteButton from '../../base/toolbox/components/BaseSignalMuteButton';
import { isLocalTrackMuted } from '../../base/tracks/functions';
import { setSignalLayout } from '../../settings/actions.web';
import { isVideoMuteButtonDisabled } from '../functions';

/**
 * The type of the React {@code Component} props of {@link AbstractSignalMuteButton}.
 */
export interface IProps extends AbstractButtonProps {

    /**
     * Whether video button is disabled or not.
     */
    _videoDisabled: boolean;

    /**
     * Whether video is currently muted or not.
     */
    _videoMuted: boolean;

    layout: string;
}

/**
 * Component that renders a toolbar button for toggling video mute.
 *
 * @augments BaseSignalMuteButton
 */
export default class AbstractSignalMuteButton<P extends IProps> extends BaseSignalMuteButton<P> {
    accessibilityLabel = 'toolbar.accessibilityLabel.videomute';
    toggledAccessibilityLabel = 'toolbar.accessibilityLabel.videounmute';
    label = 'toolbar.videomute';
    toggledLabel = 'toolbar.signalunmute';
    tooltip = 'toolbar.videomute';
    toggledTooltip = 'toolbar.signalunmute';

    /**
     * Indicates if video is currently disabled or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isDisabled() {
        return this.props._videoDisabled;
    }

    /**
     * Indicates if video is currently muted or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isVideoMuted() {
        return this.props.layout;
    }

    /**
     * Changes the muted state.
     *
     * @override
     * @param {string} layout - Whether video should be muted or not.
     * @protected
     * @returns {void}
     */
    _setSignalLayout(layout: string) {
        console.log(layout);
        console.log('============');
        console.log('============');
        console.log('============');
        console.log('============');

        setSignalLayout('TWO');

        // this.props.dispatch(handleToggleVideoMuted(videoMuted, true, true));
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code VideoMuteButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _videoMuted: boolean
 * }}
 */
export function mapStateToProps(state: IReduxState) {
    const tracks = state['features/base/tracks'];

    const enabledFlag = getFeatureFlag(state, VIDEO_MUTE_BUTTON_ENABLED, true);

    return {
        _videoDisabled: isVideoMuteButtonDisabled(state),
        layout: isLocalTrackMuted(tracks, MEDIA_TYPE.VIDEO),
        visible: enabledFlag
    };
}
