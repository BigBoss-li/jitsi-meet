import React, { Component } from 'react';
import { View } from 'react-native';
import { connect } from 'react-redux';

import { getLocalParticipant } from '../../../base/participants/functions';
import logger from '../../logger';

import ExtendedMultipleVideo from './ExtendedMultipleVideo';
import ExtendedOneLargeThreeVideo from './ExtendedOneLargeThreeVideo';
import ExtendedOneLargeTwoVideo from './ExtendedOneLargeTwoVideo';
import ExtendedOneVideo from './ExtendedOneVideo';
import ExtendedTwoVideo from './ExtendedTwoVideo';
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
        const layoutMap = {
            1: 'ONE',
            2: 'TWO',
            3: 'FOUR',
            4: 'FOUR'
        };
        const videoUrl = signals.map(item => item.meetingSignalOutputs[0].url).join(',');
        let _layout = layout;
        let _renderVideo = null;

        if (!layout || layout === '') {
            _layout = layoutMap[signals.length];
        }

        logger.info('ExtendedVideoManager render layout', _layout);

        if (_layout === 'ONE') {
            _renderVideo = <ExtendedOneVideo videoUrl = { videoUrl } />;
        } else if (_layout === 'TWO') {
            _renderVideo = <ExtendedTwoVideo videoUrl = { videoUrl } />;
        } else if (_layout === 'ONE_LARGE_TWO') {
            _renderVideo = <ExtendedOneLargeTwoVideo videoUrl = { videoUrl } />;
        } else if (_layout === 'ONE_LARGE_THREE') {
            _renderVideo = <ExtendedOneLargeThreeVideo videoUrl = { videoUrl } />;
        } else {
            _renderVideo = <ExtendedMultipleVideo videoUrl = { videoUrl } />;
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
