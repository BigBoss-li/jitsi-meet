import { connect } from 'react-redux';
import { withStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import AbstractSignalMuteButton, {
    IProps as AbstractSignalMuteButtonProps,
    mapStateToProps as abstractMapStateToProps
} from '../AbstractSignalMuteButton';

const styles = () => {
    return {
        pendingContainer: {
            position: 'absolute' as const,
            bottom: '3px',
            right: '3px'
        }
    };
};

/**
 * The type of the React {@code Component} props of {@link SignalMuteButton}.
 */
export interface IProps extends AbstractSignalMuteButtonProps {

    /**
     * An object containing the CSS classes.
     */
    classes?: Partial<Record<keyof ReturnType<typeof styles>, string>>;
}

/**
 * Component that renders a toolbar button for toggling video mute.
 *
 * @augments AbstractSignalMuteButton
 */
class SignalMuteButton extends AbstractSignalMuteButton<IProps> {


}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code SignalMuteButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _videoMuted: boolean
 * }}
 */
function _mapStateToProps(state: IReduxState) {

    return {
        ...abstractMapStateToProps(state)
    };
}

export default withStyles(translate(connect(_mapStateToProps)(SignalMuteButton)), styles);
