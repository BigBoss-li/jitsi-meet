import React, { Component } from 'react';

import 'adapterjs';
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

        const { videoUrl } = this.props;
        const playWebRTC = async () => {
            const player = new SrsRtcWhipWhepAsync();

            try {
                // 替换为你的 WebRTC 播放 URL
                await player.play(videoUrl);
                this.videoRef.current.srcObject = player.stream;
                console.log('WebRTC Stream Playing...');
            } catch (error) {
                console.error('Failed to play WebRTC stream:', error);
                player.close();
            }
        };

        playWebRTC();
    }

    /**
     * Removes all listeners.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        // TODO destroy
    }

    /**
     * Implements React's {@link Component#render()}.
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
