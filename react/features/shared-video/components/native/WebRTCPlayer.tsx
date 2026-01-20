import React, { Component } from 'react';
import { View, ViewStyle } from 'react-native';
import { MediaStream, RTCView } from 'react-native-webrtc';

// @ts-ignore
import { SrsRtcWhipWhepAsync } from './srs.sdk.js';

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

/** .
 * Implements a React {@link Component} which represents the large video (a.k.a.
 * The conference participant who is on the local stage) on React Native.
 *
 * @augments Component
 */
class WebRTCPlayer extends Component<IProps> {
    player: any;
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
     * 在组件挂载后初始化 WHEP 播放.
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
            const result = await this.player.play(videoUrl, { audioOnly: false });

            this.stream = result?.stream || null;
            this.forceUpdate();
            console.log('WHEP stream playing (React Native)');
        } catch (error) {
            console.error('Failed to play WHEP stream:', error);
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
     * 渲染 RTCView 视频元素。 {@link Component#render()}.
     *
     * @inheritdoc
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


export default WebRTCPlayer;
