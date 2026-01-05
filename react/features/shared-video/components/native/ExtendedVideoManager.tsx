import React, { Component } from 'react';
import { View } from 'react-native';
import { connect } from 'react-redux';

import { getLocalParticipant } from '../../../base/participants/functions';
import logger from '../../logger';

// import ExtendedOneVideo from './ExtendedOneVideo';
import ExtendedMultipleVideo from './ExtendedMultipleVideo';
import ExtendedOneVideo from './ExtendedOneVideo';
import styles from './styles';

interface IProps {

    /**
     * Is the video shared by the local user.
     *
     * @private
     */
    isOwner: boolean;
    layout?: string;
    signals: any;

    /**
     * The shared video url.
     */
    videoUrl?: string;
}

/**
 * Manager of shared video.
 */
class ExtendedVideoManager extends Component<IProps> {

    /**
     * Implements React Component's render.
     *
     * @inheritdoc
     */
    render() {
        const { signals, layout } = this.props;

        logger.info('ExtendedVideoManager render layout', layout);

        logger.info('ExtendedVideoManager render signals', typeof signals, signals);
        const signal = signals[0];

        logger.info('ExtendedVideoManager render signal', signal);
        const { meetingSignalOutputs } = signal;
        const output = meetingSignalOutputs[0];
        const url = output?.url;

        logger.info('ExtendedVideoManager render url', url);

        let _renderVideo = null;

        if (layout === 'ONE') {
            _renderVideo = <ExtendedOneVideo videoUrl = { url } />;
        } else if (layout === 'ONE_LARGE_TWO') {
            _renderVideo = <ExtendedOneVideo videoUrl = { url } />;
        } else if (layout === 'ONE_LARGE') {
            _renderVideo = <ExtendedOneVideo videoUrl = { url } />;
        } else {
            _renderVideo = <ExtendedMultipleVideo videoUrl = { url } />;
        }

        return (
            <View style = { styles.extendedVideoContainer as ViewStyle } >
                {_renderVideo}
            </View>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated LargeVideo props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    const { ownerId, videoUrl } = state['features/shared-video'];
    const localParticipant = getLocalParticipant(state);

    return {
        isOwner: ownerId === localParticipant?.id,
        videoUrl
    };
}

export default connect(_mapStateToProps)(ExtendedVideoManager);
