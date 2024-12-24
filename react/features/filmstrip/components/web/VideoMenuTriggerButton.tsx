import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';


import { isSupported as isAvModerationSupported } from '../../../../features/av-moderation/functions';
import { MEDIA_TYPE } from '../../../../features/base/media/constants';
import { PARTICIPANT_ROLE } from '../../../../features/base/participants/constants';
import { getLocalParticipant } from '../../../../features/base/participants/functions';
import { isParticipantAudioMuted, isParticipantVideoMuted } from '../../../../features/base/tracks/functions.any';
import { QUICK_ACTION_BUTTON } from '../../../../features/participants-pane/constants';
import { getQuickActionButtonType } from '../../../../features/participants-pane/functions';
import { getParticipantMenuButtonsWithNotifyClick } from '../../../../features/toolbox/functions.web';
import AskToUnmuteButton from '../../../../features/video-menu/components/web/AskToUnmuteButton';
import MuteButton from '../../../../features/video-menu/components/web/MuteButton';
import TogglePinToStageButton from '../../../../features/video-menu/components/web/TogglePinToStageButton';
import { PARTICIPANT_MENU_BUTTONS as BUTTONS } from '../../../../features/video-menu/constants';
import { IReduxState } from '../../../app/types';
import { IParticipant } from '../../../base/participants/types';
import { NOTIFY_CLICK_MODE } from '../../../toolbox/types';

interface IProps {

    /**
     * Hide popover callback.
     */
    hidePopover?: Function;

    /**
     * Whether or not the button is for the local participant.
     */
    local?: boolean;

    /**
     * An object with information about the participant related to the thumbnail.
     */
    participant: IParticipant;

    /**
     * The id of the participant for which the button is.
     */
    participantId?: string;

    /**
     * Whether popover is visible or not.
     */
    popoverVisible?: boolean;

    /**
     * Show popover callback.
     */
    showPopover?: Function;

    /**
     * The type of thumbnail.
     */
    thumbnailType: string;

    /**
     * Whether or not the component is visible.
     */
    visible: boolean;
}

const useStyles = makeStyles()(() => {
    return {
        contextWrapper: {
            display: 'flex'
        }
    };
});

// eslint-disable-next-line no-confusing-arrow
const VideoMenuTriggerButton = ({
    local,
    participantId = '',
    participant
}: IProps) => {
    const { classes: styles, cx } = useStyles();
    const localParticipant = useSelector(getLocalParticipant);
    const _isModerator = Boolean(localParticipant?.role === PARTICIPANT_ROLE.MODERATOR);
    const _isAudioMuted = useSelector((state: IReduxState) => isParticipantAudioMuted(participant, state));
    const _isVideoMuted = useSelector((state: IReduxState) => isParticipantVideoMuted(participant, state));
    const { disableRemoteMute }
        = useSelector((state: IReduxState) => state['features/base/config']);

    const isModerationSupported = useSelector((state: IReduxState) => isAvModerationSupported()(state));
    const buttonsWithNotifyClick = useSelector(getParticipantMenuButtonsWithNotifyClick);

    const notifyClick = useCallback(
        (buttonKey: string) => {
            const notifyMode = buttonsWithNotifyClick?.get(buttonKey);

            if (!notifyMode) {
                return;
            }

            APP.API.notifyParticipantMenuButtonClicked(
                buttonKey,
                participantId,
                notifyMode === NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY
            );
        }, [ buttonsWithNotifyClick, participantId ]);

    const quickActionButtonType = useSelector((state: IReduxState) =>
        getQuickActionButtonType(participant, _isAudioMuted, _isVideoMuted, state));

    const buttons: JSX.Element[] = [];
    const buttons2: JSX.Element[] = [];

    const getButtonProps = useCallback((key: string) => {
        const notifyMode = buttonsWithNotifyClick?.get(key);
        const shouldNotifyClick = typeof notifyMode !== 'undefined';

        return {
            key,
            notifyMode,
            notifyClick: shouldNotifyClick ? () => notifyClick(key) : undefined,
            participantID: participantId
        };
    }, [ participantId, buttonsWithNotifyClick, notifyClick ]);

    buttons2.push(<TogglePinToStageButton
        { ...getButtonProps(BUTTONS.PIN_TO_STAGE) }
        withText = { false } />);
    if (_isModerator) {

        if (isModerationSupported) {
            if (_isAudioMuted && !participant.isSilent
                && quickActionButtonType === QUICK_ACTION_BUTTON.ASK_TO_UNMUTE) {
                buttons.push(<AskToUnmuteButton
                    { ...getButtonProps(BUTTONS.ASK_UNMUTE) }
                    buttonType = { MEDIA_TYPE.AUDIO } />
                );
            }
        }

        if (!disableRemoteMute && !participant.isSilent && quickActionButtonType === QUICK_ACTION_BUTTON.MUTE) {
            buttons.push(<MuteButton
                { ...getButtonProps(BUTTONS.MUTE) }
                withText = { false } />);
        }
    }

    return local
        ? (
            <span
                id = 'localvideomenu'>
                { buttons2 }
                {/* <LocalVideoMenuTriggerButton
                    buttonVisible = { visible }
                    hidePopover = { hidePopover }
                    popoverVisible = { popoverVisible }
                    showPopover = { showPopover }
                    thumbnailType = { thumbnailType } /> */}
            </span>
        )
        : (
            <span
                className = { cx(styles.contextWrapper) }
                id = 'remotevideomenu'>
                { buttons }
                { buttons2 }
            </span>
        );
};

export default VideoMenuTriggerButton;
