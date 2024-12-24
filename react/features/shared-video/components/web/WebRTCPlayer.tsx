import React, { Component } from 'react';

import 'adapterjs';

// @ts-ignore
import { SrsRtcWhipWhepAsync } from './srs.sdk.js';

interface IProps {
    videoUrl?: string;
}

/** .
 * Implements a React {@link Component} which represents the large video (a.k.a.
 * The conference participant who is on the local stage) on Web/React.
 *
 * @augments Component
 */
class WebRTCPlayer extends Component<IProps> {
    videoRef: React.RefObject<HTMLVideoElement>;
    player: SrsRtcWhipWhepAsync | null;

    /**
     * Initializes a new VideoManager instance.
     *
     * @param {Object} props - This component's props.
     *
     * @returns {void}
     */
    constructor(props: IProps) {
        super(props);

        this.videoRef = React.createRef();
        this.player = null;
    }

    /**
     * 在组件挂载后初始化 WebRTC 播放.
     *
     * @returns {void}
     */
    async componentDidMount() {
        const { videoUrl } = this.props;

        if (!videoUrl) {
            return;
        }

        try {
            this.player = new SrsRtcWhipWhepAsync();
            await this.player.play(videoUrl);

            if (this.videoRef.current) {
                this.videoRef.current.srcObject = this.player.stream;
            }
            console.log('WebRTC Stream Playing...');
        } catch (error) {
            console.error('Failed to play WebRTC stream:', error);

            if (this.player) {
                this.player.close();
                this.player = null;
            }
        }
    }

    /**
     * 释放资源.
     *
     * @returns {void}
     */
    componentWillUnmount() {
        if (this.player) {
            this.player.close();
            this.player = null;
        }
    }

    /**
     * 渲染视频元素和错误信息。 {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {React$Element}
     */
    render() {
        return (
            <video
                autoPlay = { true }
                controls = { true }
                playsInline = { true }
                ref = { this.videoRef } />
        );
    }
}

export default WebRTCPlayer;
