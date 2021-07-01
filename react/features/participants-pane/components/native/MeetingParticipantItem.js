// @flow

import React, { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import {
    getIsParticipantAudioMuted,
    getIsParticipantVideoMuted
} from '../../../base/tracks';
import { showContextMenuDetails } from '../../actions.native';
import { MEDIA_STATE } from '../../constants';
import { getParticipantAudioMediaState } from '../../functions';

import ParticipantItem from './ParticipantItem';


type Props = {

    /**
     * Participant reference
     */
    participant: Object
};

export const MeetingParticipantItem = ({ participant: p }: Props) => {
    const dispatch = useDispatch();
    const isAudioMuted = useSelector(getIsParticipantAudioMuted(p));
    const isVideoMuted = useSelector(getIsParticipantVideoMuted(p));
    const audioMediaState = useSelector(getParticipantAudioMediaState(p, isAudioMuted));
    const openContextMenuDetails = useCallback(() => !p.local && dispatch(showContextMenuDetails(p), [ dispatch ]));

    return (
        <ParticipantItem
            audioMediaState = { audioMediaState }
            isKnockingParticipant = { false }
            name = { p.name }
            onPress = { openContextMenuDetails }
            participant = { p }
            videoMediaState = { isVideoMuted ? MEDIA_STATE.MUTED : MEDIA_STATE.UNMUTED } />
    );
};
