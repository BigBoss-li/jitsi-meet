import { IconSignal } from '../../icons/svg';

import AbstractButton, { IProps } from './AbstractButton';

/**
 * An abstract implementation of a button for toggling video mute.
 */
export default class BaseSignalMuteButton<P extends IProps, S=any>
    extends AbstractButton<P, S> {

    icon = IconSignal;
    toggledIcon = IconSignal;

    /**
     * Handles clicking / pressing the button, and toggles the video mute state
     * accordingly.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        this._setSignalLayout(this._isVideoMuted());
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return false;
    }

    /**
     * Helper function to be implemented by subclasses, which must return a
     * {@code boolean} value indicating if video is muted or not.
     *
     * @protected
     * @returns {boolean}
     */
    _isVideoMuted() {
        // To be implemented by subclass.
        return 'horizontal';
    }

    /**
     * Helper function to perform the actual setting of the video mute / unmute
     * action.
     *
     * @param {string} _layout - Whether video should be muted or not.
     * @protected
     * @returns {void}
     */
    _setSignalLayout(_layout: string) {
        // To be implemented by subclass.
    }
}
