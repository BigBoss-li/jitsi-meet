import React from 'react';
import { Text, View } from 'react-native';
import { connect } from 'react-redux';

import AbstractExtendedVideo from './AbstractExtendedVideo';
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
class ExtendedTwoVideo extends AbstractExtendedVideo<IProps> {

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

        videoUrlList.forEach(url => {
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
            renderVideoList.push(videoPlayer);
        });

        if (emptySize > 0) {
            for (let i = 0; i < emptySize; i++) {
                renderVideoList.push(<Text>暂无信号</Text>);
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
        const { videoUrl, playerHeight, playerWidth, containerWidth, containerHeight } = this.props;
        const videoUrlList = videoUrl?.split(',');
        const leftVideoUrlList = videoUrlList?.slice(0, 1);
        const rightVideoUrlList = videoUrlList?.slice(1, 2);
        const renderLeftVideoList = this.renderVideoList(leftVideoUrlList || [], playerWidth, playerHeight,
            1 - (leftVideoUrlList?.length || 0));
        const renderRightVideoList = this.renderVideoList(rightVideoUrlList || [], playerWidth, playerHeight,
            1 - (rightVideoUrlList?.length || 0));

        return (
            <View
                style = { styles.multipleVideoContainer as ViewStyle } >
                <View
                    style = { [ styles.videoWrapper as ViewStyle, {
                        height: containerHeight,
                        width: containerWidth
                    } ] } >
                    {renderLeftVideoList}
                </View>
                <View
                    style = { [ styles.videoWrapper as ViewStyle, {
                        height: containerHeight,
                        width: containerWidth
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
