import React, { Component } from 'react';
import { Text, View } from 'react-native';
import { connect } from 'react-redux';

import logger from '../../logger';

import VideoManager from './VideoManager';
import WebRTCPlayer from './WebRTCPlayer';
import styles from './styles';


interface IProps {

    leftContainerHeight: number;

    leftContainerWidth: number;
    leftPlayerHeight: number;
    leftPlayerWidth: number;
    rightContainerHeight: number;
    rightContainerWidth: number;

    rightPlayerHeight: number;

    rightPlayerWidth: number;

    videoUrl?: string;
}

/**
 * Component for displaying a video.
 *
 * @augments Component
 */
class ExtendedTwoVideo extends Component<IProps> {

    /**
     * Match video url.
     *
     * @param {string} url - VideoUrl.
     * @returns {boolean} Boolean.
     */
    matchNormalVideoUrl(url: string) {
        return url.endsWith('.flv') || url.endsWith('.m3u8') || url.endsWith('.mp4');
    }

    /**
     * Match WS video url.
     *
     * @param {string} url - VideoUrl.
     * @returns {boolean} Boolean.
     */
    matchWsVideoUrl(url: string) {
        return url.startsWith('wss://') || url.startsWith('ws://');
    }

    /**
     * Render video container.
     *
     * @param {string[]} videoUrlList - VideoUrlList.
     * @param {number} playerWidth - PlayerWidth.
     * @param {number} playerHeight - PlayerHeight.
     * @param {number} emptySize - EmptySize.
     * @returns {void}
     */
    renderVideoList(videoUrlList: string[], playerWidth: number, playerHeight: number, emptySize = 0) {
        const renderVideoList = [];

        videoUrlList.forEach((url, index) => {
            let videoPlayer;

            if (this.matchNormalVideoUrl(url)) {
                videoPlayer = (<VideoManager
                    height = { playerHeight }
                    videoId = { url }
                    width = { playerWidth } />);
            } else if (this.matchWsVideoUrl(url)) {
                // TODO CentralControl not supported
            } else {
                videoPlayer = <WebRTCPlayer videoUrl = { url } />;
            }
            renderVideoList.push(<View
                key = { `video_${index}` }
                style = { [ styles.videoWrapper as ViewStyle, {
                    height: playerHeight,
                    width: playerWidth
                } ] } >
                {videoPlayer}
            </View>);
        });

        if (emptySize > 0) {
            for (let i = 0; i < emptySize; i++) {
                renderVideoList.push(<View
                    key = { `empty_${i}` }
                    style = { [ styles.videoWrapper as ViewStyle, {
                        height: playerHeight,
                        width: playerWidth
                    } ] } >
                    <Text>暂无信号</Text>
                </View>);
            }

        }

        return renderVideoList;
    }

    /**
     * Implements React Component's render.
     *
     * @inheritdoc
     */
    render() {
        const { videoUrl, leftContainerHeight,
            leftContainerWidth,
            rightContainerHeight,
            rightContainerWidth,
            leftPlayerWidth,
            leftPlayerHeight,
            rightPlayerWidth,
            rightPlayerHeight } = this.props;


        const videoUrlList = videoUrl?.split(',');
        const leftVideoUrlList = videoUrlList?.slice(0, 1);
        const rightVideoUrlList = videoUrlList?.slice(1, 3);

        logger.info('ExtendedOneLargeTwo render videoUrl', videoUrl);
        logger.info('ExtendedOneLargeTwo render', leftContainerHeight,
            leftContainerWidth,
            rightContainerHeight,
            rightContainerWidth,
            leftPlayerWidth,
            leftPlayerHeight,
            rightPlayerWidth,
            rightPlayerHeight);

        const renderLeftVideoList = this.renderVideoList(leftVideoUrlList || [], leftPlayerWidth, leftPlayerHeight);
        const renderRightVideoList = this.renderVideoList(rightVideoUrlList || [], rightPlayerWidth, rightPlayerHeight,
            2 - rightVideoUrlList?.length || 0);

        return (
            <View
                style = { styles.multipleVideoContainer as ViewStyle } >
                <View
                    style = { [ styles.largeTwoVideoLeftContainer as ViewStyle, {
                        height: leftContainerHeight,
                        width: leftContainerWidth
                    } ] } >
                    {renderLeftVideoList}
                </View>
                <View
                    style = { [ styles.largeTwoVideoRightContainer as ViewStyle, {
                        height: rightContainerHeight,
                        width: rightContainerWidth
                    } ] } >
                    {renderRightVideoList}
                </View>
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

    const leftContainerHeight = clientHeight;
    const leftContainerWidth = clientWidth * 2 / 3;
    const rightContainerHeight = clientHeight;
    const rightContainerWidth = clientWidth / 3;

    const leftPlayerWidth = leftContainerWidth;
    const leftPlayerHeight = leftPlayerWidth * 9 / 16;

    const rightPlayerWidth = rightContainerWidth;
    const rightPlayerHeight = rightPlayerWidth * 9 / 16;

    return {
        leftContainerHeight,
        leftContainerWidth,
        rightContainerHeight,
        rightContainerWidth,
        leftPlayerWidth,
        leftPlayerHeight,
        rightPlayerWidth,
        rightPlayerHeight
    };
}

export default connect(_mapStateToProps)(ExtendedTwoVideo);
