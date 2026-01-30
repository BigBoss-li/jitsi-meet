import React, { Component } from 'react';
import { View, ViewStyle } from 'react-native';
import { RTCView } from 'react-native-webrtc';

import { CentralControlAsync } from './central-control-sdk';

interface IProps {
    style?: any;
    videoUrl?: string;
}

const styles = {
    container: {
        width: '100%',
        height: '100%',
        backgroundColor: 'black'
    }
};

/**
 * Implements a React {@link Component} which represents the large video.
 *
 * @augments Component
 */
class CentralControlPlayer extends Component<IProps> {
    player: CentralControlAsync | null;
    stream: MediaStream | null;

    /**
     * Initializes a new VideoManager instance.
     *
     * @param {Object} props - This component's props.
     *
     * @returns {void}
     */
    constructor(props: IProps) {
        super(props);

        this.player = null;
        this.stream = null;
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
            this.player = new CentralControlAsync(videoUrl, { debug: true });

            this.stream = this.player.stream;
            this.forceUpdate();

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
        this.stream = null;
    }

    /**
     * 渲染video.
     *
     * @returns {React$Element}
     */
    render() {
        const { style } = this.props;

        if (!this.stream) {
            return <View style = { [ styles.container as ViewStyle, style ] } />;
        }

        return (
            <RTCView
                objectFit = 'contain'
                streamURL = { this.stream.toURL() }
                style = { [ styles.container, style ] } />
        );
    }
}

export default CentralControlPlayer;
