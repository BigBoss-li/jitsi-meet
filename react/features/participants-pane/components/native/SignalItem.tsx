import React, { useCallback } from 'react';
import {
    GestureResponderEvent,
    StyleProp,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';
import { Text } from 'react-native-paper';
import { useDispatch } from 'react-redux';

import { IMeetingSignal } from '../../../base/participants/types';
import Switch from '../../../base/ui/components/native/Switch';
import { checkMeetingSignal } from '../../../mobile/meeting-signal/actions';
import { type MediaState } from '../../constants';

import styles from './styles';

interface IProps {

    /**
     * Media state for audio.
     */
    audioMediaState?: MediaState;

    /**
     * React children.
     */
    children?: React.ReactNode;

    /**
     * Whether or not to disable the moderator indicator.
     */
    disableModeratorIndicator?: boolean;

    /**
     * The name of the participant. Used for showing lobby names.
     */
    displayName: string;

    /**
     * Is the participant waiting?
     */
    isKnockingParticipant?: boolean;

    /**
     * Whether or not the user is a moderator.
     */
    isModerator?: boolean;

    /**
     * True if the participant is local.
     */
    local?: boolean;

    localVideoOwner: boolean;

    meetingSignal: IMeetingSignal;

    /**
     * Callback to be invoked on pressing the participant item.
     */
    onPress?: (e?: GestureResponderEvent) => void;

    /**
     * The ID of the participant.
     */
    participantID: string;

    /**
     * Media state for video.
     */
    videoMediaState?: MediaState;
}

/**
 * Participant item.
 *
 * @returns {React$Element<any>}
 */
function ParticipantItem({
    isKnockingParticipant = false,
    onPress,
    meetingSignal,
    isModerator,
    localVideoOwner
}: IProps) {
    const dispatch = useDispatch();

    const participantNameContainerStyles
        = isKnockingParticipant ? styles.lobbyParticipantNameContainer : styles.participantNameContainer;

    const onSwitchToggled = useCallback(() => (enabled?: boolean) => {
        dispatch(checkMeetingSignal(meetingSignal.id, enabled));
    }, [ dispatch, checkMeetingSignal ]);

    return (
        <View style = { styles.participantContainer as StyleProp<ViewStyle> } >
            <TouchableOpacity
                onPress = { onPress }
                style = { [ styles.participantContent as StyleProp<ViewStyle>,
                styles.meetingSignalContent as StyleProp<ViewStyle> ] }>
                <View
                    style = { [
                        styles.meetingSignalDetailsContainer
                    ] as StyleProp<ViewStyle> }>
                    <View style = { participantNameContainerStyles as StyleProp<ViewStyle> }>
                        <Text style = { styles.meetingSignalTypeLabel as StyleProp<TextStyle> }>
                            {meetingSignal.srcType}
                        </Text>
                        <Text
                            numberOfLines = { 1 }
                            style = { styles.participantName as StyleProp<TextStyle> }>
                            {meetingSignal.name}
                        </Text>
                    </View>
                    <Text style = { styles.moderatorLabel as StyleProp<TextStyle> }>
                        {meetingSignal.ip}
                    </Text>
                </View>
                {isModerator && <View style = { styles.meetingSignalSwitch as StyleProp<ViewStyle> }>
                    <Switch
                        checked = { meetingSignal.checked }
                        disabled = { !localVideoOwner }
                        onChange = { onSwitchToggled() } />
                </View>}
            </TouchableOpacity>
        </View>
    );
}

export default ParticipantItem;
