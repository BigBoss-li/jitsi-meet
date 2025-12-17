/* eslint-disable no-invalid-this */
import React from 'react';
import ReactPlayer from 'react-player';
import { connect } from 'react-redux';

import { PLAYBACK_STATUSES } from '../../constants';

import AbstractVideoManager, { IProps, _mapDispatchToProps, _mapStateToProps } from './AbstractVideoManager';
import CentralControlPlayer from './CentralControlPlayer';
// eslint-disable-next-line import/order
import WebRTCPlayer from './WebRTCPlayer';

// @ts-ignore
import { enableDragDropTouch } from './drag-drop-touch.esm.min.js';

interface IState {
    isMuted: boolean;
    isPlaying: boolean;
    layout: string;
}

/**
 * Manager of shared video.
 *
 * @param {string} videoId - Video url.
 * @returns {void}
 */
class ExtendedVideoManager extends AbstractVideoManager<IState> {
    playerRef: React.RefObject<HTMLDivElement>;
    reactPlayersRef: Array<ReactPlayer | null>;

    // player?: any;

    /**
     * Initializes a new VideoManager instance.
     *
     * @param {Object} props - This component's props.
     *
     * @returns {void}
     */
    constructor(props: IProps) {
        super(props);

        const layoutHistory = localStorage.getItem('video_layout');
        const layout = layoutHistory ? layoutHistory : 'horizontal';

        this.state = {
            isPlaying: true,
            isMuted: false,
            layout
        };

        this.playerRef = React.createRef<HTMLDivElement>();

        this._onDragStart = this._onDragStart.bind(this);
        this._onDragLeave = this._onDragLeave.bind(this);
        this._onDrop = this._onDrop.bind(this);
        this._onDragEnter = this._onDragEnter.bind(this);

        // this._onTouchStart = this._onTouchStart.bind(this);

        // this._onTouchEnd = this._onTouchEnd.bind(this);
        // this.getTouchEle = this.getTouchEle.bind(this);
    }

    /**
     * Removes all listeners.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        if (this.reactPlayersRef && this.reactPlayersRef.length > 0) {
            this.reactPlayersRef.forEach(ref => {
                if (ref !== null) {
                    ref.getInternalPlayer('flv')?.destroy();
                }
            });
        }
    }

    /**
     * Retrieves the current player ref.
     */
    get player() {
        return this.playerRef.current;
    }

    /**
     * Indicates the playback state of the video.
     *
     * @returns {string}
     */
    getPlaybackStatus() {
        return this.state.isPlaying ? PLAYBACK_STATUSES.PLAYING : PLAYBACK_STATUSES.PAUSED;
    }

    /**
     * Indicates whether the video is muted.
     *
     * @returns {boolean}
     */
    isMuted() {
        return this.state.isMuted;
    }

    /**
     * Retrieves current time.
     *
     * @returns {number}
     */
    getTime() {
        // if (this.player === undefined || this.player === null || this.player.getCurrentTime() === null) {
        //     return -1;
        // }

        return -1;
    }

    /**
     * Seeks video to provided time.
     *
     * @param {number} _time - The time to seek to.
     *
     * @returns {void}
     */
    seek(_time: number) {
        return;
    }

    /**
     * Plays video.
     *
     * @returns {void}
     */
    play() {
        this.setState({
            isPlaying: true
        });
    }

    /**
     * Pauses video.
     *
     * @returns {void}
     */
    pause() {
        this.setState({
            isPlaying: false
        });
    }

    /**
     * Mutes video.
     *
     * @returns {void}
     */
    mute() {
        this.setState({
            isMuted: true
        });
    }

    /**
     * Unmutes video.
     *
     * @returns {void}
     */
    unMute() {
        this.setState({
            isMuted: false
        });
    }

    onPlayerPause = () => {
        this.setState(
            {
                isPlaying: false
            },
            () => {
                this.onPause();
            }
        );
    };

    onPlayerPlay = () => {
        this.setState(
            {
                isPlaying: true
            },
            () => {
                this.onPlay();
            }
        );
    };

    /**
     * Fired when player is ready.
     *
     * @param {Object} event - The player event.
     *
     * @returns {void}
     */
    onPlayerReady = () => {
        this.play();

        // sometimes youtube can get muted state from previous videos played in the browser
        // and as we are disabling controls we want to unmute it
        if (this.isMuted()) {
            this.unMute();
        }
    };

    getPlayerOptions = (videoId: string) => {
        const { showControls } = this.props;
        const { isPlaying } = this.state;

        const options: any = {
            url: videoId,
            playing: isPlaying,
            controls: showControls,
            volume: 0.5,
            muted: false,
            height: '100%',
            width: '100%',
            progressInterval: 5000,
            config: {
                hlsSdkUrl: 'libs/hls.min.js',
                flvSdkUrl: 'libs/flv.min.js'
            }
        };

        return options;
    };

    /**
     * 获取最高分辨率url.
     *
     * @param {Array<any>} signalOutputs -signalOutputs.
     * @returns {string}
     */
    _getHeightResolutionUrl(signalOutputs: Array<any>) {
        const resolution = [ '4K', '1080P', '720P', '360P' ];
        const target = signalOutputs;

        target.sort((a, b) => resolution.indexOf(a.resolutionName) - resolution.indexOf(b.resolutionName));

        return target[0].url;
    }

    /**
     * 获取最低分辨率url.
     *
     * @param {Array<any>} signalOutputs -signalOutputs.
     * @returns {string}
     */
    _getLowResolutionUrl(signalOutputs: Array<any>) {
        const resolution = [ '4K', '1080P', '720P', '360P' ];
        const target = signalOutputs;

        target.sort((a, b) => resolution.indexOf(b.resolutionName) - resolution.indexOf(a.resolutionName));

        return target[0].url;
    }

    /**
     * 开始触摸事件.
     *
     * @param {React.DragEvent<HTMLDivElement>} e - 拖动event.
     * @returns {void}
     */
    // _onTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    //     const from = e.currentTarget.dataset.idx;

    //     e.currentTarget.classList.add('drag-over');
    //     const boxList = document.querySelectorAll('div.react-player-box');

    //     boxList.forEach(box => {
    //         if (from !== box.dataset.idx) {
    //             box.classList.add('touch-over');
    //         }
    //     });
    // }

    /**
     * 结束触摸事件.
     *
     * @param {React.DragEvent<HTMLDivElement>} e - 拖动event.
     * @returns {void}
     */
    // _onTouchEnd(e: React.TouchEvent<HTMLDivElement>) {

    //     const boxList = document.querySelectorAll('div.react-player-box');

    //     boxList.forEach(box => {
    //         box.classList.remove('touch-over', 'drag-over');
    //     });
    //     const touch = e.changedTouches[0];
    //     const currentTarget = document.elementFromPoint(touch.clientX, touch.clientY);

    //     const from = parseInt(this.getTouchEle(e.currentTarget).dataset.idx, 10);
    //     const to = parseInt(this.getTouchEle(currentTarget).dataset.idx, 10);

    //     if (from === to) {
    //         return;
    //     }

    //     const { videoId } = this.props;

    //     if (videoId !== undefined) {
    //         const signalList = JSON.parse(videoId);

    //         const fromUrl = signalList[from];
    //         const toUrl = signalList[to];

    //         signalList[from] = toUrl;
    //         signalList[to] = fromUrl;

    //         if (this.props._isOwner) {
    //             this.props._updateSignalVideoOrder(signalList);
    //         }
    //     }
    // }

    /**
     * 结束触摸事件.
     *
     * @param {React.DragEvent<HTMLDivElement>} e - 拖动event.
     * @returns {void}
     */
    // _onTouchMove(e: React.TouchEvent<HTMLDivElement>) {

    //     const touch = e.changedTouches[0];
    //     const touchedElement = document.elementFromPoint(touch.clientX, touch.clientY);

    //     const currentTarget = this.getTouchEle(touchedElement);

    //     console.log(currentTarget);
    // }

    /**
     * 获取触摸节点.
     *
     * @param {HTMLDivElement} ele -ele.
     * @returns {string}
     */
    // getTouchEle(ele: HTMLDivElement) {
    //     if (ele.dataset.idx) {
    //         return ele;
    //     }
    //     const parentEle = ele.parentElement;

    //     return this.getTouchEle(parentEle);
    // }

    /**
     * 视频放大点击事件.
     *
     * @param {React.DragEvent<HTMLDivElement>} e - 拖动event.
     * @returns {void}
     */
    _onDragStart(e: React.DragEvent<HTMLDivElement>) {
        e.dataTransfer?.setData('from', `${e.currentTarget.dataset.idx}`);
        e.dataTransfer.effectAllowed = 'move';

        // 设置拖动图片 (隐藏默认的拖动预览效果)
        const dragImage = document.createElement('div');

        dragImage.style.position = 'absolute';
        dragImage.style.top = '0';
        dragImage.style.left = '0';
        dragImage.style.width = '160px';
        dragImage.style.height = '80px';
        dragImage.style.backgroundColor = '#000';
        dragImage.style.color = '#fff';
        dragImage.style.display = 'flex';
        dragImage.style.justifyContent = 'center';
        dragImage.style.alignItems = 'center';
        dragImage.style.fontSize = '12px';
        dragImage.style.pointerEvents = 'none';
        dragImage.style.cursor = 'grabbing';
        dragImage.textContent = '拖动后松开交换位置';

        document.body.appendChild(dragImage);

        e.dataTransfer?.setDragImage(dragImage, 50, 25);

        // 清理 DOM
        setTimeout(() => {
            document.body.removeChild(dragImage);
        }, 0);

    }

    /**
     * 视频拖动离开区域事件.
     *
     * @param {React.DragEvent<HTMLDivElement>} e - 视频序号.
     * @returns {void}
     */
    _onDragLeave(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
    }

    /**
     * 视频放大点击事件.
     *
     * @param {React.DragEvent<HTMLDivElement>} e - 视频Url.
     * @returns {void}
     */
    _onDrop(e: React.DragEvent<HTMLDivElement>) {
        e.currentTarget.classList.remove('drag-over');

        if (e.currentTarget?.dataset?.idx === undefined) {
            return;
        }
        const from = parseInt(e.dataTransfer?.getData('from'), 10);
        const to = parseInt(e.currentTarget?.dataset?.idx, 10);

        if (from === to) {
            return;
        }

        const { videoId } = this.props;

        if (videoId !== undefined) {
            const signalList = JSON.parse(videoId);

            const fromUrl = signalList[from];
            const toUrl = signalList[to];

            signalList[from] = toUrl;
            signalList[to] = fromUrl;

            if (this.props._isOwner) {
                this.props._updateSignalVideoOrder(signalList);
            }
        }

    }

    /**
     * 视频放大点击事件.
     *
     * @param {React.DragEvent<HTMLDivElement>} e - React.DragEvent.
     * @returns {void}
     */
    _onDragEnter(e: React.DragEvent<HTMLDivElement>) {
        e.currentTarget.classList.add('drag-over');
    }

    /**
     * Implements React Component's render.
     *
     * @inheritdoc
     */
    render() {
        const { videoId, _signalLayout } = this.props;

        enableDragDropTouch();

        if (this.reactPlayersRef && this.reactPlayersRef.length > 0) {
            this.reactPlayersRef.forEach(ref => {
                if (ref !== null) {
                    ref.getInternalPlayer('flv')?.destroy();
                }
            });
        }

        let ele2;

        if (videoId) {
            const signalList = JSON.parse(videoId);

            if (signalList && signalList?.length > 0) {
                this.reactPlayersRef = new Array(signalList.length);

                let maxSignals = -1;
                let signalLayout = _signalLayout;

                if (!signalLayout) {
                    if (signalList.length === 1) {
                        signalLayout = 'ONE';
                    } else if (signalList.length === 2) {
                        signalLayout = 'TWO';
                    } else if (signalList.length === 3 || signalList.length === 4) {
                        signalLayout = 'FOUR';
                    }
                }

                if (signalLayout === 'ONE') {
                    maxSignals = 1;
                } else if (signalLayout === 'TWO') {
                    maxSignals = 2;
                } else if (signalLayout === 'ONE_LARGE_TWO') {
                    maxSignals = 3;
                } else {
                    maxSignals = 4;
                }

                if (signalLayout === 'ONE_LARGE_TWO' || signalLayout === 'ONE_LARGE') {
                    const smallItems = [];
                    const largeUrl = signalList[0] && signalList[0].meetingSignalOutputs.length > 0
                        ? this._getHeightResolutionUrl(signalList[0].meetingSignalOutputs) : '';

                    for (let i = 1; i < maxSignals; i++) {
                        const signal = signalList[i];

                        if (signal) {
                            let videoPlayer;

                            const url = this._getLowResolutionUrl(signal.meetingSignalOutputs);

                            if (url.endsWith('.flv') || url.endsWith('.m3u8') || url.endsWith('.mp4')) {
                                videoPlayer = (
                                    <ReactPlayer
                                        // eslint-disable-next-line react/jsx-no-bind
                                        ref = { refItem => {
                                            // eslint-disable-next-line react/jsx-no-bind
                                            if (!this.reactPlayersRef[i]) {
                                                this.reactPlayersRef[i] = refItem;
                                            }
                                        } }
                                        { ...this.getPlayerOptions(`${url}?_t=${new Date().getTime()}`) } />
                                );
                            } else if (url.startsWith('wss://') || url.startsWith('ws://')) {

                                videoPlayer = <CentralControlPlayer videoUrl = { url } />;
                            } else {
                                videoPlayer = <WebRTCPlayer videoUrl = { url } />;
                            }
                            smallItems.push(
                                <div
                                    className = { 'react-player-box' }
                                    data-idx = { i }
                                    draggable = { true }
                                    key = { i }
                                    onDragEnter = { this._onDragEnter }
                                    onDragLeave = { this._onDragLeave }
                                    // eslint-disable-next-line react/jsx-no-bind
                                    onDragOver = { e => e.preventDefault() }
                                    onDragStart = { this._onDragStart }
                                    onDrop = { this._onDrop }>
                                    {videoPlayer}
                                </div>
                            );
                        } else {
                            smallItems.push(
                                <div
                                    className = { 'react-player-box box-no-signal' }
                                    data-idx = { i }
                                    draggable = { true }
                                    key = { i }
                                    onDragEnter = { this._onDragEnter }
                                    onDragLeave = { this._onDragLeave }
                                    // eslint-disable-next-line react/jsx-no-bind
                                    onDragOver = { e => e.preventDefault() }
                                    onDragStart = { this._onDragStart }
                                    onDrop = { this._onDrop }>
                                    <div
                                        className = { 'no-signal' }>暂无信号</div>
                                </div>
                            );
                        }
                    }

                    let videoPlayer2;

                    if (largeUrl && largeUrl !== '#' && largeUrl !== '') {
                        if (largeUrl.endsWith('.flv') || largeUrl.endsWith('.m3u8') || largeUrl.endsWith('.mp4')) {
                            videoPlayer2 = (
                                <ReactPlayer
                                    // eslint-disable-next-line react/jsx-no-bind
                                    ref = { refItem => {
                                        // eslint-disable-next-line react/jsx-no-bind
                                        if (!this.reactPlayersRef[0]) {
                                            this.reactPlayersRef[0] = refItem;
                                        }
                                    } }
                                    { ...this.getPlayerOptions(`${largeUrl}?_t=${new Date().getTime()}`) } />
                            );
                        } else if (largeUrl.startsWith('wss://') || largeUrl.startsWith('ws://')) {

                            videoPlayer2 = <CentralControlPlayer videoUrl = { largeUrl } />;
                        } else {
                            videoPlayer2 = <WebRTCPlayer videoUrl = { largeUrl } />;
                        }
                    } else {
                        videoPlayer2 = (<div
                            className = { 'react-player-box box-no-signal' }>
                            <div className = { 'no-signal' }>暂无信号</div>
                        </div>);
                    }


                    const leftItem = (<div
                        className = 'shared-video__large react-player-box'
                        data-idx = { 0 }
                        draggable = { true }
                        key = { 0 }
                        onDragEnter = { this._onDragEnter }
                        onDragLeave = { this._onDragLeave }
                        // eslint-disable-next-line react/jsx-no-bind
                        onDragOver = { e => e.preventDefault() }
                        onDragStart = { this._onDragStart }
                        onDrop = { this._onDrop }>{videoPlayer2}</div>);
                    const rightItem = <div className = { 'shared-video__small' }>{smallItems}</div>;

                    ele2 = (
                        <div className = { `shared-video shared-video-${signalLayout}` }>
                            {leftItem}
                            {rightItem}
                        </div>
                    );
                } else {
                    const listItems = [];

                    for (let i = 0; i < maxSignals; i++) {

                        const signal = signalList[i];

                        if (signal) {
                            let videoPlayer;
                            const url = this._getHeightResolutionUrl(signal.meetingSignalOutputs);

                            if (url.endsWith('.flv') || url.endsWith('.m3u8') || url.endsWith('.mp4')) {
                                videoPlayer = (
                                    <ReactPlayer
                                        data-idx = { i }
                                        // eslint-disable-next-line react/jsx-no-bind
                                        ref = { refItem => {
                                            // eslint-disable-next-line react/jsx-no-bind
                                            if (!this.reactPlayersRef[i]) {
                                                this.reactPlayersRef[i] = refItem;
                                            }
                                        } }
                                        { ...this.getPlayerOptions(`${url}?_t=${new Date().getTime()}`) } />
                                );
                            } else if (url.startsWith('wss://') || url.startsWith('ws://')) {

                                videoPlayer = <CentralControlPlayer videoUrl = { url } />;
                            } else {
                                videoPlayer = <WebRTCPlayer videoUrl = { url } />;
                            }
                            listItems.push(
                                <div
                                    className = { 'react-player-box' }
                                    data-idx = { i }
                                    draggable = { signalLayout !== 'ONE' }
                                    key = { i }
                                    onDragEnter = { this._onDragEnter }
                                    onDragLeave = { this._onDragLeave }
                                    // eslint-disable-next-line react/jsx-no-bind
                                    onDragOver = { e => e.preventDefault() }
                                    onDragStart = { this._onDragStart }
                                    onDrop = { this._onDrop }>
                                    {videoPlayer}
                                </div>
                            );
                        } else {
                            listItems.push(
                                <div
                                    className = { 'react-player-box box-no-signal' }
                                    data-idx = { i }
                                    draggable = { true }
                                    key = { i }
                                    onDragEnter = { this._onDragEnter }
                                    onDragLeave = { this._onDragLeave }
                                    // eslint-disable-next-line react/jsx-no-bind
                                    onDragOver = { e => e.preventDefault() }
                                    onDragStart = { this._onDragStart }
                                    onDrop = { this._onDrop }>
                                    <div className = { 'no-signal' }>暂无信号</div>
                                </div>
                            );
                        }
                    }

                    ele2 = <div className = { `shared-video shared-video-${signalLayout}` }>{listItems}</div>;
                }
            }
        }


        return (
            <div
                className = 'shared-video-wrapper'
                ref = { this.playerRef }>
                {ele2}
            </div>
        );
    }
}

export default connect(_mapStateToProps, _mapDispatchToProps)(ExtendedVideoManager);
