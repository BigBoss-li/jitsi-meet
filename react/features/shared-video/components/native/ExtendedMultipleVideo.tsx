import React from 'react';
import { Text, View } from 'react-native';
import { connect } from 'react-redux';

import AbstractExtendedVideo from './AbstractExtendedVideo';
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
class ExtendedMultipleVideo extends AbstractExtendedVideo<IProps> {

    /**
     * Render video container.
     *
     * @param {string[]} videoUrlList - VideoUrlList.
     * @param {number} emptySize - EmptySize.
     * @returns {void}
     */
    renderVideoList(videoUrlList: string[], emptySize = 0) {
        const { playerHeight, playerWidth, playerBoxHeight, playerBoxWidth } = this.props;
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
                    height: playerBoxHeight,
                    width: playerBoxWidth
                } ] } >
                {videoPlayer}
            </View>);
        });

        if (emptySize > 0) {
            for (let i = 0; i < emptySize; i++) {
                renderVideoList.push(<View
                    key = { `empty_${i}` }
                    style = { [ styles.videoWrapper as ViewStyle, {
                        height: playerBoxHeight,
                        width: playerBoxWidth
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
        const { videoUrl } = this.props;
        const videoUrlList = videoUrl?.split(',')?.slice(0, 4);
        const renderVideoList = this.renderVideoList(videoUrlList || [], 4 - (videoUrlList?.length || 0));

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

    return {
        playerHeight,
        playerWidth,
        playerBoxHeight,
        playerBoxWidth
    };
}

export default connect(_mapStateToProps)(ExtendedMultipleVideo);
