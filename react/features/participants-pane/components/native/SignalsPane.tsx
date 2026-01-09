import React, { useCallback } from 'react';
import { FlatList } from 'react-native';

import JitsiScreen from '../../../base/modal/components/JitsiScreen';

import MeetingSignalList from './MeetingSignalList';
import styles from './styles';


/**
 * Participants pane.
 *
 * @returns {React$Element<any>}
 */
const SignalsPane = () => {
    const keyExtractor
        = useCallback((e: undefined, i: number) => i.toString(), []);
    const renderListHeaderComponent = () =>
        <MeetingSignalList />
    ;

    return (
        <JitsiScreen
            style = { styles.participantsPaneContainer }>

            { /* Fixes warning regarding nested lists */ }
            <FlatList

                // eslint-disable-next-line react/jsx-no-bind
                ListHeaderComponent = { renderListHeaderComponent }
                data = { [] as ReadonlyArray<undefined> }
                keyExtractor = { keyExtractor }
                renderItem = { null }
                windowSize = { 2 } />
        </JitsiScreen>
    );
};

export default SignalsPane;
