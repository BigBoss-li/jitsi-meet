import React, { useCallback, useEffect, useRef } from 'react';
import { FlatList, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import {
    getLocalParticipant
} from '../../../base/participants/functions';
import { IMeetingSignal } from '../../../base/participants/types';
import { playSharedVideosDef, stopSharedVideo } from '../../../shared-video/actions.any';

import MeetingSignalItem from './MeetingSignalItem';
import logger from './logger';
import styles from './styles';


const MeetingSignalList = () => {
    const dispatch = useDispatch();
    const keyExtractor
        = useCallback((e: undefined, i: number) => i.toString(), []);
    const localParticipant = useSelector(getLocalParticipant);
    const renderMeetingSignal = ({ item/* , index, separators */ }: IMeetingSignal) => (
        <MeetingSignalItem
            key = { item.id }
            meetingSignal = { item }
            participant = { localParticipant } />
    );

    const meetingSignals = useSelector(
        (state: IReduxState) => state['features/mobile/meeting-signal'].meetingSignals);

    const isFirstRender = useRef(true);
    const checkedCount = meetingSignals.filter(item => item.checked).length;

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;

            return;
        }

        if (checkedCount > 0) {
            const checkedList = meetingSignals.filter(item => item.checked);
            const signalMap = {
                signals: checkedList
            };

            logger.info('SharedVideo _callChangeSharedSignals', signalMap);
            dispatch(playSharedVideosDef(JSON.stringify(signalMap)));
        } else {
            dispatch(stopSharedVideo());

        }
    }, [ checkedCount ]);

    return (
        <View style = { styles.meetingListContainer }>
            <FlatList
                data = { meetingSignals as Array<IMeetingSignal> }
                keyExtractor = { keyExtractor }

                /* eslint-disable react/jsx-no-bind */
                renderItem = { renderMeetingSignal }
                windowSize = { 2 } />
        </View>
    );
};

export default MeetingSignalList;
