import React, { Component } from 'react';
import { Text, View } from 'react-native';
import { connect } from 'react-redux';

import logger from '../../logger';

import VideoManager from './VideoManager';
import WebRTCPlayer from './WebRTCPlayer';
import styles from './styles';


interface IProps {

    containerHeight: number;

    containerWidth: number;

    /**
     * The available player width.
     */
    playerHeight: number;

    /**
     * The available player width.
     */
    playerWidth: number;

    videoUrl?: string;
}

/**
 * Component for displaying a video.
 *
 * @augments Component
 */
class ExtendedTwoVideo extends Component<IProps> {

    /**
     * Implements React Component's render.
     *
     * @inheritdoc
     */
    render() {
        const { videoUrl, playerHeight, playerWidth, containerWidth, containerHeight } = this.props;
        const renderVideoList = [];
        const videoUrlList = videoUrl?.split(',')?.slice(0, 2);

        logger.info('ExtendedTwoVideo render videoUrl', videoUrl);

        videoUrlList?.forEach((url, index) => {
            let videoPlayer;

            if (url.endsWith('.flv') || url.endsWith('.m3u8') || url.endsWith('.mp4')) {
                videoPlayer = (<VideoManager
                    height = { playerHeight }
                    videoId = { url }
                    width = { playerWidth } />);
            } else if (url.startsWith('wss://') || url.startsWith('ws://')) {
                // TODO CentralControl not supported
            } else {
                videoPlayer = <WebRTCPlayer videoUrl = { url } />;
            }
            renderVideoList.push(<View
                key = { `video_${index}` }
                style = { [ styles.videoWrapper as ViewStyle, {
                    height: containerHeight,
                    width: containerWidth
                } ] } >
                {videoPlayer}
            </View>);
        });

        const emptyDomCount = 2 - videoUrlList?.length;

        for (let i = 0; i < emptyDomCount; i++) {
            renderVideoList.push(<View
                key = { `empty_${i}` }
                style = { [ styles.videoWrapper as ViewStyle, {
                    height: containerHeight,
                    width: containerWidth
                } ] } >
                <Text>暂无信号</Text>
            </View>);
        }

        return (
            <View
                style = { styles.multipleVideoContainer as ViewStyle } >
                {renderVideoList}
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
    const { clientHeight, clientWidth } = state['features/base/responsive-ui'];

    const containerHeight = clientHeight;
    const containerWidth = clientWidth / 2;

    const playerWidth = containerWidth;
    const playerHeight = playerWidth * 9 / 16;

    return {
        playerHeight,
        playerWidth,
        containerHeight,
        containerWidth
    };
}

export default connect(_mapStateToProps)(ExtendedTwoVideo);
