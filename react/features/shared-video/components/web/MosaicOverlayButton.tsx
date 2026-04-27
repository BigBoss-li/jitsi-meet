import React from 'react';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import ImageIcon from '../../../base/icons/components/ImageIcon';
import { isLocalParticipantModerator } from '../../../base/participants/functions';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { setEditMode } from '../../actions.any';

// eslint-disable-next-line max-len
const MOSAIC_OVERLAY_ICON = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/PjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+PHN2ZyB0PSIxNzc3Mjg2OTgyNjMxIiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjEwMjk4IiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgd2lkdGg9IjI1NiIgaGVpZ2h0PSIyNTYiPjxwYXRoIGQ9Ik0xMDI0IDY4Mi42NjY2Njd2MzQxLjMzMzMzM2gtMzQxLjMzMzMzM3YtMzQxLjMzMzMzM2gzNDEuMzMzMzMzek0zNDEuMzMzMzMzIDY4Mi42NjY2Njd2MzQxLjMzMzMzM0gwdi0zNDEuMzMzMzMzaDM0MS4zMzMzMzN6IG0zNDEuMzMzMzM0LTI0MS4zMzMzMzR2MzQxLjMzMzMzNEgzNDEuMzMzMzMzVjM0MS4zMzMzMzNoMzQxLjMzMzMzNHogbTM0MS4zMzMzMzMtMjQxLjMzMzMzM3YzNDEuMzMzMzMzaC0zNDEuMzMzMzMzVjBoMzQxLjMzMzMzM3pNMzQxLjMzMzMzMyAwdjM0MS4zMzMzMzNIMFYwaDM0MS4zMzMzMzN6IiBmaWxsPSIjRDhEOEQ4IiBwLWlkPSIxMDI5OSI+PC9wYXRoPjwvc3ZnPg==';

interface IIconProps {
    height?: number | string;
    width?: number | string;
}

/**
 * Custom icon component for mosaic overlay button.
 *
 * @returns {ReactElement}
 */
function MosaicOverlayIcon({ height, width }: IIconProps) {
    return (
        <ImageIcon
            height = { height }
            src = { MOSAIC_OVERLAY_ICON }
            width = { width } />
    );
}

interface IProps extends AbstractButtonProps {
    _editMode: boolean;
    _isModerator: boolean;
}

/**
 * Implements an {@link AbstractButton} to toggle mosaic overlay edit mode.
 */
class MosaicOverlayButton extends AbstractButton<IProps> {
    accessibilityLabel = 'toolbar.accessibilityLabel.mosaicOverlay';
    customClass = 'mosaic-overlay-button';
    icon = MosaicOverlayIcon;
    label = 'toolbar.mosaicOverlayOn';
    toggledAccessibilityLabel = 'toolbar.accessibilityLabel.mosaicOverlay';
    toggledLabel = 'toolbar.mosaicOverlayOff';
    toggledTooltip = 'toolbar.mosaicOverlayOff';
    tooltip = 'toolbar.mosaicOverlayOn';

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
     * Indicates whether this button is disabled or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isDisabled() {
        return !this.props._isModerator;
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
