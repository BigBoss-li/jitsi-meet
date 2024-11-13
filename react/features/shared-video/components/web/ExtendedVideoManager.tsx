/* eslint-disable no-invalid-this */
import clsx from 'clsx';
import React from 'react';
import ReactPlayer from 'react-player';
import { connect } from 'react-redux';

import { PLAYBACK_STATUSES } from '../../constants';

import AbstractVideoManager, {
    IProps,
    _mapDispatchToProps,
    _mapStateToProps
} from './AbstractVideoManager';

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

        this.state = {
            isPlaying: true,
            isMuted: false,
            layout: 'horizontal'
        };

        this.playerRef = React.createRef<HTMLDivElement>();
    }

    /**
     * Add listenners.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        this._onMessageListener = this._onMessageListener.bind(this);

        window.addEventListener('message', this._onMessageListener);

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

    // _onPlayerProgress = (event: any) => {
    //     console.log(event);
    //     const { _isOwner } = this.props;

    //     if (_isOwner) {
    //         this.throttledFireUpdateSharedVideoEvent();
    //     }
    // };

    onPlayerPause = () => {
        this.setState({
            isPlaying: false
        }, () => {
            this.onPause();
        });
    };

    onPlayerPlay = () => {
        this.setState({
            isPlaying: true
        }, () => {
            this.onPlay();
        });
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

    /**
     * Message listener.
     *
     * @param {any} e -received data.
     * @returns {void}
     */
    _onMessageListener(e: any) {
        const { layout } = this.state;

        if (this.reactPlayersRef && this.reactPlayersRef.length > 0) {
            this.reactPlayersRef.forEach(ref => {
                if (ref !== null) {
                    ref.getInternalPlayer('flv')?.destroy();
                }
            });
        }

        if (e.data.type === 'video_layout') {
            this.setState({
                layout: layout === 'horizontal' ? 'vertical' : 'horizontal'
            });
        }
    }

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
     * Render video players.
     *
     * @param { Array<string> } videoUrls - Video urls.
     * @param {number} playerRefStartIdx - PlayerRef start idx.
     * @returns {React.DOMElement}
     */
    renderVideoPlayers(videoUrls: Array<string>, playerRefStartIdx = 0) {
        return videoUrls.map((url: string, idx: number) => (
            <div
                className = 'shared-video'
                key = { idx }>
                <ReactPlayer
                    // eslint-disable-next-line react/jsx-no-bind
                    ref = { refItem => {
                        // eslint-disable-next-line react/jsx-no-bind
                        this.reactPlayersRef[idx + playerRefStartIdx] = refItem;
                    } }
                    { ...this.getPlayerOptions(url) } />
            </div>
        ));
    }

    /**
     * Render horizontal videos.
     *
     * @param {Array<string>} videoUrls - Video urls.
     * @returns {React.DOMElement}
     */
    renderVideoHorizontal(videoUrls: Array<string>) {
        const videoClassName = `shared-video-size-${videoUrls?.length}`;

        return (
            <div className = { clsx('shared-video__horizontal', videoClassName) }>
                { this.renderVideoPlayers(videoUrls) }
            </div>
        );
    }

    /**
     * Render vertical videos.
     *
     * @param {Array<string>} videoUrls - Video urls.
     * @returns {React.DOMElement}
     */
    renderVideoVertical(videoUrls: Array<string>) {
        return (
            <div className = 'shared-video__vertical'>
                <div className = 'shared-video_large'>
                    { this.renderVideoPlayers(videoUrls?.slice(0, 1)) }
                </div>
                <div className = 'shared-video__small'>
                    { this.renderVideoPlayers(videoUrls?.slice(1, videoUrls.length), 1) }
                </div>
            </div>
        );
    }

    /**
     * Implements React Component's render.
     *
     * @inheritdoc
     */
    render() {
        const { videoId } = this.props;
        const { layout } = this.state;

        const videoUrls = videoId?.split(',');

        if (videoUrls && videoUrls?.length > 0) {
            this.reactPlayersRef = new Array(videoUrls.length);
        }

        const ele = videoUrls && videoUrls?.length > 0
            ? layout === 'horizontal' ? this.renderVideoHorizontal(videoUrls) : this.renderVideoVertical(videoUrls)
            : '';

        return (
            <div
                className = 'shared-video-wrapper'
                ref = { this.playerRef }>
                { ele }
            </div>

        );
    }
}

export default connect(_mapStateToProps, _mapDispatchToProps)(ExtendedVideoManager);
