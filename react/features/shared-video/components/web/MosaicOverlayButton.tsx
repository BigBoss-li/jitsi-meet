import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IconPlay } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { setEditMode } from '../../actions.any';
import { isLocalParticipantModerator } from '../../../base/participants/functions';

interface IProps extends AbstractButtonProps {

    /**
     * Whether or not the local participant is moderator.
     */
    _isModerator: boolean;

    /**
     * Whether edit mode is enabled.
     */
    _editMode: boolean;
}

/**
 * Implements an {@link AbstractButton} to toggle mosaic overlay edit mode.
 */
class MosaicOverlayButton extends AbstractButton<IProps> {
    accessibilityLabel = 'toolbar.accessibilityLabel.mosaicOverlay';
    toggledAccessibilityLabel = 'toolbar.accessibilityLabel.mosaicOverlay';
    icon = IconPlay;
    label = 'toolbar.mosaicOverlayOn';
    toggledLabel = 'toolbar.mosaicOverlayOff';
    tooltip = 'toolbar.mosaicOverlayOn';
    toggledTooltip = 'toolbar.mosaicOverlayOff';

    /**
     * Handles clicking / pressing the button, and toggles edit mode.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        this.props.dispatch(setEditMode(!this.props._editMode));
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._editMode;
    }

    /**
     * Indicates whether this button is disabled or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isDisabled() {
        return !this.props._isModerator;
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    const { editMode } = state['features/shared-video'];
    const isModerator = isLocalParticipantModerator(state);

    return {
        _editMode: Boolean(editMode),
        _isModerator: Boolean(isModerator)
    };
}


export default translate(connect(_mapStateToProps)(MosaicOverlayButton));
