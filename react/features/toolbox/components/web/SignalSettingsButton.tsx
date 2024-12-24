import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import { IconArrowUp } from '../../../base/icons/svg';
import ToolboxButtonWithIcon from '../../../base/toolbox/components/web/ToolboxButtonWithIcon';
import { toggleSignalSettings } from '../../../settings/actions';
import SignalSettingsPopup from '../../../settings/components/web/signal/SignalSettingsPopup';


import SignalMuteButton from './SignalMuteButton';

interface IProps extends WithTranslation {

    /**
     * The button's key.
     */
    buttonKey?: string;

    /**
     * External handler for click action.
     */
    handleClick: Function;

    /**
     * If the button should be disabled.
     */
    isDisabled: boolean;

    /**
     * Defines is popup is open.
     */
    isOpen: boolean;

    /**
     * Notify mode for `toolbarButtonClicked` event -
     * whether to only notify or to also prevent button click routine.
     */
    notifyMode?: string;

    /**
     * Click handler for the small icon. Opens video options.
     */
    onSignalOptionsClick: Function;

    /**
     * Flag controlling the visibility of the button.
     * VideoSettings popup is currently disabled on mobile browsers
     * as mobile devices do not support capture of more than one
     * camera at a time.
     */
    visible: boolean;
}

/**
 * Button used for video & video settings.
 *
 * @returns {ReactElement}
 */
class SignalSettingsButton extends Component<IProps> {
    /**
     * Initializes a new {@code SignalSettingsButton} instance.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        this._onEscClick = this._onEscClick.bind(this);
        this._onClick = this._onClick.bind(this);
    }

    /**
     * Click handler for the more actions entries.
     *
     * @param {KeyboardEvent} event - Esc key click to close the popup.
     * @returns {void}
     */
    _onEscClick(event: React.KeyboardEvent) {
        if (event.key === 'Escape' && this.props.isOpen) {
            event.preventDefault();
            event.stopPropagation();
            this._onClick();
        }
    }

    /**
     * Click handler for the more actions entries.
     *
     * @param {MouseEvent} e - Mousw event.
     * @returns {void}
     */
    _onClick(e?: React.MouseEvent) {
        const { onSignalOptionsClick, isOpen } = this.props;

        if (isOpen) {
            e?.stopPropagation();
        }
        onSignalOptionsClick();
    }

    /**
     * Implements React's {@link Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { t, isOpen, buttonKey, notifyMode } = this.props;

        return (
            <SignalSettingsPopup>
                <ToolboxButtonWithIcon
                    ariaControls = 'signal-settings-dialog'
                    ariaExpanded = { isOpen }
                    ariaHasPopup = { true }
                    ariaLabel = { this.props.t('toolbar.videoSettings') }
                    buttonKey = { buttonKey }
                    icon = { IconArrowUp }
                    iconDisabled = { false }
                    iconId = 'signal-settings-button'
                    iconTooltip = { t('toolbar.signalSettings') }
                    notifyMode = { notifyMode }
                    onIconClick = { this._onClick }
                    onIconKeyDown = { this._onEscClick }>
                    <SignalMuteButton
                        buttonKey = { buttonKey }
                        notifyMode = { notifyMode } />
                </ToolboxButtonWithIcon>
            </SignalSettingsPopup>
        );
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @returns {Object}
 */
function mapStateToProps() {

    return {
        isDisabled: false,
        isOpen: false
    };
}

const mapDispatchToProps = {
    onSignalOptionsClick: toggleSignalSettings
};

export default translate(connect(
    mapStateToProps,
    mapDispatchToProps
)(SignalSettingsButton));
