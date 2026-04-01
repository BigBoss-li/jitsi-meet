import React from 'react';
import { WebView } from 'react-native-webview';
import { connect } from 'react-redux';

import { ASPECT_RATIO_WIDE } from '../../../base/responsive-ui/constants';
import logger from '../../logger';

import AbstractExtendedVideo from './AbstractExtendedVideo';
import VideoManager from './VideoManager';
import WebRTCPlayer from './WebRTCPlayer';
import { CENTRAL_PLAYER_HTML } from './WebView/centralPlayerHtml';

interface IProps {

    /**
     * The Redux dispatch function.
     */
    dispatch: IStore['dispatch'];

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
class ExtendedSingleVideo extends AbstractExtendedVideo<IProps> {

    /**
     * Handles WebView message events.
     *
     * @param {Object} event - The message event.
     * @returns {void}
     */
    _onWebViewMessage(event: any): void {
        logger.log('WebView message:', event.nativeEvent.data);
    }

    /**
     * Implements React Component's render.
     *
     * @inheritdoc
     */
    render() {
        const { videoUrl, playerHeight, playerWidth } = this.props;
        const _videoUrl = videoUrl?.split(',')[0];

        let videoPlayer;

        if (this.matchNormalVideoUrl(_videoUrl)) {
            videoPlayer = (<VideoManager
                height = { playerHeight }
                videoId = { _videoUrl }
                width = { playerWidth } />);
        } else if (this.matchWsVideoUrl(_videoUrl)) {
            logger.log('matchWsVideoUrl', _videoUrl);

            const html = CENTRAL_PLAYER_HTML.replace('WS_URL_PLACEHOLDER', _videoUrl);

            videoPlayer = (<WebView
                domStorageEnabled = { true }
                javaScriptEnabled = { true }
                onMessage = { this._onWebViewMessage }
                source = {{ html }}
                style = {{
                    width: playerWidth,
                    height: playerHeight
                }} />);
        } else {
            videoPlayer = <WebRTCPlayer videoUrl = { _videoUrl } />;
        }

        return videoPlayer;

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
    const { aspectRatio, clientHeight, clientWidth } = state['features/base/responsive-ui'];

    const isWideScreen = aspectRatio === ASPECT_RATIO_WIDE;

    let playerHeight, playerWidth;

    if (isWideScreen) {
        playerHeight = clientHeight;
        playerWidth = playerHeight * 16 / 9;
    } else {
        playerWidth = clientWidth;
        playerHeight = playerWidth * 9 / 16;
    }

    return {
        playerHeight,
        playerWidth
    };
}

export default connect(_mapStateToProps)(ExtendedSingleVideo);
