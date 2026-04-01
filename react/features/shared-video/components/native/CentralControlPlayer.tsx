import React, { Component } from 'react';
import { View, ViewStyle } from 'react-native';
import {
    MediaStream,
    RTCIceCandidate,
    RTCSessionDescription,
    RTCView
} from 'react-native-webrtc';
import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../../app/types';
import { centralControlVideoAnswer, centralControlVideoPlay } from '../../../toolbox/actions.native';
import logger from '../../logger';

import { CentralControlAsync } from './central-control-sdk';


interface IProps {

    /**
     * The ICE candidate from Redux.
     */
    candidate?: string;

    /**
     * The Redux dispatch function.
     */
    dispatch: IStore['dispatch'];

    /**
     * The offer SDP from Redux.
     */
    offer?: string;

    style?: any;

    /**
     * The shared video URL from Redux state.
     */
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
    pc: RTCPeerConnection | null = null;
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
        this.stream = new MediaStream();
    }

    /**
     * 初始化.
     *
     * @returns {void}
     */
    async componentDidMount() {
        const { videoUrl, dispatch } = this.props;

        if (!videoUrl) {
            return;
        }

        logger.log('CentralControlPlayer:', videoUrl);

        dispatch(centralControlVideoPlay(videoUrl));

        // try {
        //     this.player = new CentralControlAsync(videoUrl, { debug: true });

        //     this.stream = this.player.stream;
        //     this.forceUpdate();

        //     console.log('CentralControl Stream Playing...');
        // } catch (error) {
        //     console.error('Failed to play CentralControl stream:', error);

        //     if (this.player) {
        //         this.player.close();
        //         this.player = null;
        //     }
        // }
    }

    /**
     * 监听 offer 和 candidate 变化.
     *
     * @param {IProps} prevProps - The previous props.
     * @returns {void}
     */
    async componentDidUpdate(prevProps: IProps) {
        const { offer, candidate, videoUrl } = this.props;

        console.log('componentDidUpdate offer:', offer, 'prevOffer:', prevProps.offer);
        console.log('componentDidUpdate candidate:', candidate, 'prevCandidate:', prevProps.candidate);
        console.log('componentDidUpdate this.pc:', this.pc);

        console.log('componentDidUpdate: after init offer:', Boolean(offer),
            'offer !== prevProps.offer:', offer !== prevProps.offer, 'this.pc:', Boolean(this.pc));

        // 监听 offer 变化
        if (offer && offer !== prevProps.offer) {
            console.log('componentDidUpdate: calling handleOffer');
            await this.handleOffer(offer, videoUrl);
        }

        // 监听 candidate 变化
        if (candidate && candidate !== prevProps.candidate) {
            console.log('componentDidUpdate: calling handleCandidate');
            await this.handleCandidate(candidate);
        }
    }

    /**
     * 处理 offer，生成 answer.
     *
     * @param {string} offer - The offer SDP.
     * @param {string} videoUrl - The video URL.
     * @returns {Promise<void>}
     */
    private async handleOffer(offer: string, videoUrl?: string) {

        logger.log('CentralControlPlayer: handleOffer', offer);

        const msg = JSON.parse(offer);
        const sdpJson = JSON.parse(msg.SdpData);

        this.pc?.close();

        this.pc = new RTCPeerConnection({
            iceServers: [ { urls: 'stun:stun4.l.google.com:19302' } ]
        });

        const capabilities = RTCRtpReceiver.getCapabilities('video');

        logger.log('capabilities', capabilities);

        this.pc.ontrack = e => {
            logger.log('ontrack', e);
            this.stream.addTrack(e.track);
        };

        this.pc.addTransceiver('audio', { direction: 'recvonly' });
        this.pc.addTransceiver('video', { direction: 'recvonly' });

        const { dispatch } = this.props;

        try {

            const remoteDesc = new RTCSessionDescription(sdpJson);

            await this.pc.setRemoteDescription(remoteDesc);

            const answer = await this.pc.createAnswer();

            logger.log('CentralControlPlayer: answer created replace before', answer);

            answer.sdp = answer.sdp
                .replace('useinbandfec=1', 'useinbandfec=1; stereo=1; maxaveragebitrate=510000')
                .replace('packetization-mode=0', 'packetization-mode=1');

            await this.pc.setLocalDescription(answer);

            // TODO: 发送 answer 到服务器
            logger.log('CentralControlPlayer: answer created', answer);
            dispatch(centralControlVideoAnswer(videoUrl, JSON.stringify(this.pc.localDescription)));
        } catch (error) {
            logger.error('CentralControlPlayer: handleOffer error', error);
        }
    }

    /**
     * 处理 ICE candidate.
     *
     * @param {string} candidate - The ICE candidate.
     * @returns {Promise<void>}
     */
    private async handleCandidate(candidate: string) {
        if (!this.pc) {
            console.log('CentralControlPlayer: handleCandidate skipped - this.pc is null');

            return;
        }

        try {
            logger.log('CentralControlPlayer: handleCandidate');

            // 解析 candidate（如果是 JSON 字符串）
            let candidateObj: any;

            if (typeof candidate === 'string') {
                try {
                    candidateObj = JSON.parse(candidate);
                } catch (e) {
                    // 如果解析失败，直接作为对象使用
                    candidateObj = candidate;
                }
            } else {
                candidateObj = candidate;
            }

            console.log('CentralControlPlayer: parsed candidate:', candidateObj);

            // 检查 sdpMLineIndex 和 sdpMid
            if (candidateObj.sdpMLineIndex === undefined && candidateObj.sdpMid === undefined) {
                console.log('CentralControlPlayer: skip candidate - both sdpMLineIndex and sdpMid are undefined');

                return;
            }

            const iceCandidate = new RTCIceCandidate(candidateObj);

            await this.pc.addIceCandidate(iceCandidate);

            console.log('CentralControlPlayer: addIceCandidate success');
        } catch (error: any) {
            logger.error('CentralControlPlayer: handleCandidate error', error);
            console.log('CentralControlPlayer: handleCandidate error details:', {
                message: error?.message,
                candidate: candidateObj
            });
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

/**
 * Maps part of the Redux store to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The component props.
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState, ownProps: { videoUrl?: string; }) {
    const { centralControl } = state['features/meeting-central-control'];
    const videoUrl = ownProps.videoUrl ?? '';

    console.log('_mapStateToProps videoUrl:', videoUrl);
    console.log('_mapStateToProps centralControl keys:', centralControl ? Array.from(centralControl.keys()) : []);

    const data = centralControl?.get(videoUrl);

    console.log('_mapStateToProps data:', data);


    return {
        offer: data?.offer,
        candidate: data?.candidate
    };
}

export default connect(_mapStateToProps)(CentralControlPlayer);
