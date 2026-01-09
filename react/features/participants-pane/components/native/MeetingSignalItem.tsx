import React, { PureComponent } from 'react';
import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import {
    getLocalParticipant,
    isParticipantModerator
} from '../../../base/participants/functions';
import { IMeetingSignal } from '../../../base/participants/types';

import SignalItem from './SignalItem';

interface IProps {

    /**
     * Whether or not the user is a moderator.
     */
    _isModerator: boolean;

    /**
     * True if the participant is the local participant.
     */
    _local: boolean;

    /**
     * Shared video local participant owner.
     */
    _localVideoOwner: boolean;

    _meetingSignals: Array<IMeetingSignal>;

    /**
     * The participant ID.
     */
    _participantID: string;

    /**
     * The redux dispatch function.
     */
    dispatch: IStore['dispatch'];

    meetingSignal?: IMeetingSignal;

    /**
     * The participant.
     */
    participant?: IParticipant;
}

/**
 * Implements the MeetingSignalItem component.
 */
class MeetingSignalItem extends PureComponent<IProps> {

    /**
     * Creates new MeetingSignalItem instance.
     *
     * @param {IProps} props - The props of the component.
     */
    constructor(props: IProps) {
        super(props);

        this._onPress = this._onPress.bind(this);
    }

    /**
     * Handles MeetingSignalItem press events.
     *
     * @returns {void}
     */
    _onPress() {
        // const {
        //     _local,
        //     _localVideoOwner,
        //     _participantID,
        //     dispatch
        // } = this.props;

        // if (_fakeParticipant && _localVideoOwner) {
        //     dispatch(showSharedVideoMenu(_participantID));
        // } else if (!_fakeParticipant) {
        //     dispatch(showContextMenuDetails(_participantID, _local));
        // } // else no-op
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            _isModerator,
            _local,
            _localVideoOwner,
            _participantID,
            meetingSignal,
            _meetingSignals
        } = this.props;

        return (
            <SignalItem
                isModerator = { _isModerator }
                local = { _local }
                localVideoOwner = { _localVideoOwner }
                meetingSignal = { meetingSignal }
                meetingSignals = { _meetingSignals }
                onPress = { this._onPress }
                participantID = { _participantID } />
        );
    }
}

/**
 * Maps (parts of) the redux state to the associated props for this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The own props of the component.
 * @private
 * @returns {IProps}
 */
function mapStateToProps(state: IReduxState, ownProps: any) {
    const { participant } = ownProps;
    const { ownerId } = state['features/shared-video'];
    const { meetingSignals } = state['features/mobile/meeting-signal'];
    const localParticipantId = getLocalParticipant(state)?.id;

    let _localVideoOwner = true;

    if (ownerId !== undefined) {
        _localVideoOwner = Boolean(ownerId === localParticipantId);
    }

    return {
        _isModerator: isParticipantModerator(participant),
        _local: Boolean(participant?.local),
        _localVideoOwner,
        _participantID: participant?.id,
        _meetingSignals: meetingSignals
    };
}


export default translate(connect(mapStateToProps)(MeetingSignalItem));
