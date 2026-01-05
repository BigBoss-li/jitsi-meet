import React, { Component } from 'react';
import { Text, View } from 'react-native';
import { connect } from 'react-redux';

import logger from '../../logger';

import VideoManager from './VideoManager';
import WebRTCPlayer from './WebRTCPlayer';
import styles from './styles';


interface IProps {

    playerBoxHeight: number;

    playerBoxWidth: number;

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
class ExtendedMultipleVideo extends Component<IProps> {

    /**
     * Implements React Component's render.
     *
     * @inheritdoc
     */
    render() {
        const { videoUrl, playerHeight, playerWidth, playerBoxHeight, playerBoxWidth } = this.props;

        logger.info('ExtendedTwoVideo render videoUrl', videoUrl);
        logger.info('ExtendedTwoVideo render playerHeight', playerHeight);
        logger.info('ExtendedTwoVideo render playerWidth', playerWidth);

        const urlList = videoUrl?.split(',');

        const renderVideoList = [];

        urlList?.forEach((url, index) => {
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
                    height: playerBoxHeight,
                    width: playerBoxWidth
                } ] } >
                {videoPlayer}
            </View>);
        });

        const emptyDomCount = 4 - urlList?.length;

        for (let i = 0; i < emptyDomCount; i++) {
            renderVideoList.push(<View
                key = { `empty_${i}` }
                style = { [ styles.videoWrapper as ViewStyle, {
                    height: playerBoxHeight,
                    width: playerBoxWidth
                } ] } >
                <Text>暂无信号</Text>
            </View>);
        }

        return (<View style = { styles.multipleVideoContainer as ViewStyle } >
            {renderVideoList}
        </View>);

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

    // const isWideScreen = aspectRatio === ASPECT_RATIO_WIDE;

    const playerBoxHeight = clientHeight / 2;
    const playerBoxWidth = clientWidth / 2;

    const playerWidth = playerBoxWidth;
    const playerHeight = playerWidth * 9 / 16;

    // if (isWideScreen) {
    //     playerHeight = playerBoxHeight;
    //     playerWidth = playerHeight * 16 / 9;
    // } else {
    //     playerWidth = playerBoxWidth;
    //     playerHeight = playerWidth * 9 / 16;
    // }

    return {
        playerHeight,
        playerWidth,
        playerBoxHeight,
        playerBoxWidth
    };
}

export default connect(_mapStateToProps)(ExtendedMultipleVideo);
