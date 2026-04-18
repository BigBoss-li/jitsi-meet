import React from 'react';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import ImageIcon from '../../../base/icons/components/ImageIcon';
import { isLocalParticipantModerator } from '../../../base/participants/functions';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { setEditMode } from '../../actions.any';

// eslint-disable-next-line max-len
const MOSAIC_OVERLAY_ICON = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAFIklEQVR4Aexd7VbCMAxlvpj6ZOqTqU82c4fzSFFWtiRtk8tpHWVdkvvB5AelDyd5zPP8JP1dumV7lVSmTYp/lW6JA7FD4XgQwgDoXZR5km7ZXr5zmeT4jv0iwS1xIHYkHE+4AzwKaV4NAlnlsoxd1myZyzL2FQ4YAK4uT5iN5Z3qms8KiAUOi5gb+Jc7wMac/k83IK5/UiorxB2gciqnRWSABoio6h2YaIA7yIo0dcVCA6xMJD3SAEmFX2HTACsTSY80QFLhV9g0wMpE0iMNkFT4FTYNsDKR9EgDJBO+hEsDlIwkG9MAyQQv4dIAJSPJxjRAMsFLuDRAyUiyMQ2QTPASLg1QMpJsTAMkEfw/mDTAf8wkeR0G+HDGisUVs+ZD6se6Bjm4thA4YIBPV9qYrCcG3h6macLKoLeeqmItLgy8QXvcAU54In2StM9GXcK6NhhaGwtiuoKQZNoYlnjQWjre+KfFAJJoafLih0Vfgvv+Ucch5Xt/VsIbUx0H9BUsP+3CAD+v8kkaBmiA4FJvwaMBthgKfp4GCC7wFjwaYIuh4OdpgOACb8GjAbYYCn6eBggu8BY8GmCLoeDnaYCgAtfCogFqmQo6jwYIKmwtLBqglqmg82iAoMLWwqIBapkKOo8GCCpsLSwaoJapoPNogGDC3guHBriXsWDzLwwwnzeOwOYRqr0BZ6r1gxfB4P4r58ir3QXHRVsMIEmw08YsZ7DAwqJLaNeG39zXxoGYriAkmTaG34tZzt8KhviSqAU4ScvWkIFl5xPcATx3DGmIl6n/YOARBvD+38YFFssCBSlI64iYEs61IadW/WscxPQE0WTHEPXFDsKY+6IN5MQiC82OmNJdG+4ArgmZzIaBvVFpgL3MBbmOBggi5F4YNMBe5oJcRwMEEXIvDBpgL3NBrqMBggi5FwYNsJe5INfRAIMLebR8GuAog4NfTwMMLuDR8mmAowwOfj0NMLiAR8unAY4yOPj1NMDgAh4tnwY4yuDg19MAgwqoVTYNoMXkoHFogEGF0yq7hQFCLNoQAULggAG8v1CJNQjaCx4QUzRxbcg5Oo4PGIA7hrj6pqtkn9wxpCs9XIu53jFkkoeUsC5S0DxKWNeGBRaa9SMWYrqCkGTIq95FZrTz2kBJctHkjMXCjYscDgMLDN6flf7cMURDn9/84zPA7zGfJ2OABkgmeAmXBigZSTamAZIJXsKlAUpGko1pgGSCl3BpgJKRZGMaYBDBrcqkAayYHSQuDTCIUFZl0gBWzA4SlwYYRCirMmkAK2YHiUsDDCKUVZk0gBWzg8SlAToXyro8GsCa4c7j0wCdC2RdHg1gzXDn8S8MMHPHkH8Xe4iO3r+qfvLQYzGAJOKOIafT1iIPLAQRH7i2rZp2nRe90c7fCpZneNICnCuTTHbFwAu0xx2A4l9xk+aFZccQb7TPk/JDAGDxhBxcmykOJyRNdgxxwsY0NQzgX0DNPM4JygANEFTYWlg0QC1TQefRAEGFrYVFA9QyFXQeDRBU2FpYNEAtU07zvNPQAN6Md5aPBuhMEO9yaABvxjvLRwN0Joh3OTSAN+Od5aMBOhPEuxwawJvxzvLRAJ0I0qoMGqAV853kpQE6EaJVGTRAK+Y7yUsDdCJEqzJogJ3MT9Pk/uPRO0u9eRkM4ArEgjiLmDdZMzrZAMeyY4jn7+Bb5rKMXUpumcsydolj2TEEdwAkxbGcoDVG7GWHCq2AZRx592CF03A4buAoT2mOoQfWNbx+AQAA///qcoDwAAAABklEQVQDAP9mpJr+jNm6AAAAAElFTkSuQmCC';

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
