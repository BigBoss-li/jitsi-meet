import { IReduxState } from '../../app/types';
import { VIDEO_MUTE_BUTTON_ENABLED } from '../../base/flags/constants';
import { getFeatureFlag } from '../../base/flags/functions';
import { IProps as AbstractButtonProps } from '../../base/toolbox/components/AbstractButton';
import BaseSignalMuteButton from '../../base/toolbox/components/BaseSignalMuteButton';
import { setSignalLayout } from '../../settings/actions.web';

/**
 * The type of the React {@code Component} props of {@link AbstractSignalMuteButton}.
 */
export type IProps = AbstractButtonProps;

/**
 * Component that renders a toolbar button for toggling video mute.
 *
 * @augments BaseSignalMuteButton
 */
export default class AbstractSignalMuteButton<P extends IProps> extends BaseSignalMuteButton<P> {
    accessibilityLabel = 'toolbar.accessibilityLabel.signalunmute';
    toggledAccessibilityLabel = 'toolbar.accessibilityLabel.signalunmute';
    label = 'toolbar.signalunmute';
    toggledLabel = 'toolbar.signalunmute';
    tooltip = 'toolbar.signalunmute';
    toggledTooltip = 'toolbar.signalunmute';

    /**
     * Indicates if video is currently disabled or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isDisabled() {
        return false;
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
 *     visible: boolean
 * }}
 */
export function mapStateToProps(state: IReduxState) {

    const enabledFlag = getFeatureFlag(state, VIDEO_MUTE_BUTTON_ENABLED, true);

    return {
        visible: enabledFlag
    };
}
