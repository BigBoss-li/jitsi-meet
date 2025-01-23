import React, { Component } from 'react';

// @ts-ignore
import { CentralControlAsync } from './central.sdk';

interface IProps {
    videoUrl?: string;
}

/**
 * Implements a React {@link Component} which represents the large video.
 *
 * @augments Component
 */
class CentralControlPlayer extends Component<IProps> {
    videoRef: React.RefObject<HTMLVideoElement>;
    player: CentralControlAsync | null;

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
     * 初始化.
     *
     * @returns {void}
     */
    async componentDidMount() {
        const { videoUrl } = this.props;

        if (!videoUrl) {
            return;
        }

        try {
            this.player = new CentralControlAsync(videoUrl);

            if (this.videoRef.current) {
                this.videoRef.current.srcObject = this.player.stream;
            }
            console.log('CentralControl Stream Playing...');
        } catch (error) {
            console.error('Failed to play CentralControl stream:', error);

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
     * 渲染video.
     *
     * @returns {React$Element}
     */
    render() {
        return (
            <video
                autoPlay = { true }
                controls = { false }
                playsInline = { true }
                ref = { this.videoRef } />
        );
    }
}

export default CentralControlPlayer;
