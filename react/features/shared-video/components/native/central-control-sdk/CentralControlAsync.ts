import {
    MediaStream,
    RTCIceCandidate,
    RTCPeerConnection,
    RTCSessionDescription
} from 'react-native-webrtc';

import { CentralControlOptions } from './types';

/**
 * 封装了 WebRTC 的 API，和 central.sdk.js 一样，
 * 完全对齐。.
 */
export class CentralControlAsync {
    ws: WebSocket | null = null;
    pc: RTCPeerConnection | null = null;
    stream: MediaStream;

    private url: string;
    private options: CentralControlOptions;

    /**
     * 构造.
     *
     * @param {string} url - Url.
     * @param {Object} options - Options.
     */
    constructor(url: string, options: CentralControlOptions = {}) {
        this.url = url;
        this.options = options;
        this.stream = new MediaStream();

        this.init();
    }

    /**
     * 封装了 console.log，如果 options.debug 为 true，则打印日志.
     *
     * @param {any} args - Args.
     * @returns {void}
     */
    private log(...args: any[]) {
        if (this.options.debug) {
            console.log('[CentralControl]', ...args);
        }
    }

    /**
     * 封装了初始化逻辑.
     *
     * @returns {void}
     */
    private async init() {
        this.log('init');

        // 1️⃣ PeerConnection
        this.pc = new RTCPeerConnection({
            iceServers: this.options.iceServers ?? [
                { urls: 'stun:stun4.l.google.com:19302' }
            ]
        });

        this.pc.ontrack = e => {
            this.log('ontrack');
            this.stream.addTrack(e.track);
        };

        // 2️⃣ WebSocket（私有信令）
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            this.log('ws connected');
        };

        this.ws.onmessage = e => {
            this.handleWsMessage(e.data);
        };

        this.ws.onerror = e => {
            this.log('ws error', e);
        };

        this.ws.onclose = () => {
            this.log('ws closed');
        };
    }

    /**
     *  封装了 WebSocket 的消息处理逻辑.
     *
     * @param {string} data - The WebSocket message data.
     * @returns {void}
     */
    private async handleWsMessage(data: string) {
        const msg = JSON.parse(data);

        this.log('ws message', msg.MessageType);

        switch (msg.MessageType) {
        case 1:
            await this.handleSdp(msg);
            break;
        case 2:
            this.log('source added');
            break;
        case 3:
            this.log('source removed');
            break;
        }
    }

    /**
     * 完全对齐 central.sdk.js 的 sdpHandler.
     *
     * @param {any} msg - The SDP message.
     * @returns {void}
     */
    private async handleSdp(msg: any) {
        if (!this.pc || !this.ws) {
            return;
        }

        const sdpJson = JSON.parse(msg.SdpData);

        // ICE
        if (sdpJson.candidate) {
            await this.pc.addIceCandidate(new RTCIceCandidate(sdpJson));

            return;
        }

        // Offer
        if (sdpJson.sdp) {
            await this.pc.setRemoteDescription(
                new RTCSessionDescription(sdpJson)
            );

            const answer = await this.pc.createAnswer();

            await this.pc.setLocalDescription(answer);

            // 🔥 和 Web SDK 一样：直接发 localDescription
            this.ws.send(JSON.stringify(this.pc.localDescription));
        }
    }

    /**
     * 对外暴露的关闭方法.
     *
     * @returns {void}
     */
    close() {
        this.log('close');

        this.ws?.close();
        this.ws = null;

        this.pc?.close();
        this.pc = null;

        this.stream.getTracks().forEach(t => t.stop());
    }
}
