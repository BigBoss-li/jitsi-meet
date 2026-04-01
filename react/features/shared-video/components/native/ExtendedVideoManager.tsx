import React, { Component } from 'react';
import { View } from 'react-native';
import { connect } from 'react-redux';

import { getLocalParticipant } from '../../../base/participants/functions';

import ExtendedDoubleVideo from './ExtendedDoubleVideo';
import ExtendedMultipleVideo from './ExtendedMultipleVideo';
import ExtendedOneLargeThreeVideo from './ExtendedOneLargeThreeVideo';
import ExtendedOneLargeTwoVideo from './ExtendedOneLargeTwoVideo';
import ExtendedSingleVideo from './ExtendedSingleVideo';
import styles from './styles';

interface IProps {

    /**
     * The Redux dispatch function.
     */
    dispatch: IStore['dispatch'];

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
        const { signals, layout, dispatch } = this.props;
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

        switch (_layout) {
        case 'ONE':
            _renderVideo = (<ExtendedSingleVideo
                dispatch = { dispatch }
                videoUrl = { videoUrl } />);
            break;
        case 'TWO':
            _renderVideo = (<ExtendedDoubleVideo
                dispatch = { dispatch }
                videoUrl = { videoUrl } />);
            break;
        case 'ONE_LARGE_TWO':
            _renderVideo = (<ExtendedOneLargeTwoVideo
                dispatch = { dispatch }
                videoUrl = { videoUrl } />);
            break;
        case 'ONE_LARGE':
            _renderVideo = (<ExtendedOneLargeThreeVideo
                dispatch = { dispatch }
                videoUrl = { videoUrl } />);
            break;
        default:
            _renderVideo = (<ExtendedMultipleVideo
                dispatch = { dispatch }
                videoUrl = { videoUrl } />);
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
