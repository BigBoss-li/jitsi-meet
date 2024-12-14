import React, { ReactNode } from 'react';
import { connect } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../../app/types';
import Popover from '../../../../base/popover/components/Popover.web';
import { SMALL_MOBILE_WIDTH } from '../../../../base/responsive-ui/constants';
import {
    setSignalLayout
} from '../../../../settings/actions.web';
import { toggleSignalSettings } from '../../../actions';
import { getSignalSettingsVisibility } from '../../../functions.web';

import SignalSettingsContent from './SignalSettingsContent';

interface IProps {

    /**
    * Component children (the Video button).
    */
    children: ReactNode;

    /**
    * Flag controlling the visibility of the popup.
    */
    isOpen: boolean;

    /**
    * Callback executed when the popup closes.
    */
    onClose: Function;

    /**
     * Callback invoked to change current camera.
     */
    onLayoutSelect: Function;

    /**
     * The popup placement enum value.
     */
    popupPlacement: string;

    /**
     * All the camera device ids currently connected.
     */
    videoDeviceIds: string[];
}

const useStyles = makeStyles()(() => {
    return {
        container: {
            background: 'none',
            display: 'inline-block'
        }
    };
});

/**
 * Popup with a preview of all the video devices.
 *
 * @returns {ReactElement}
 */
function SignalSettingsPopup({
    children,
    isOpen,
    onClose,
    onLayoutSelect,
    popupPlacement
}: IProps) {
    const { classes, cx } = useStyles();

    return (
        <div className = { cx('signal-preview', classes.container) }>
            <Popover
                allowClick = { true }
                content = { <SignalSettingsContent
                    setSignalLayout = { onLayoutSelect }
                    toggleSignalSettings = { onClose } /> }
                headingId = 'signal-settings-button'
                onPopoverClose = { onClose }
                position = { popupPlacement }
                trigger = 'click'
                visible = { isOpen }>
                { children }
            </Popover>
        </div>
    );
}

/**
 * Maps (parts of) the redux state to the associated {@code SignalSettingsPopup}'s
 * props.
 *
 * @param {Object} state - Redux state.
 * @returns {Object}
 */
function mapStateToProps(state: IReduxState) {
    const { clientWidth } = state['features/base/responsive-ui'];

    return {
        isOpen: Boolean(getSignalSettingsVisibility(state)),
        popupPlacement: clientWidth <= Number(SMALL_MOBILE_WIDTH) ? 'auto' : 'top-end'
    };
}

const mapDispatchToProps = {
    onClose: toggleSignalSettings,
    onLayoutSelect: setSignalLayout
};

export default connect(mapStateToProps, mapDispatchToProps)(SignalSettingsPopup);
