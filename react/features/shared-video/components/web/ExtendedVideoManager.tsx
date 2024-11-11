/* eslint-disable no-invalid-this */
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
}


/**
 * Manager of shared video.
 *
 * @returns {void}
 */
class ExtendedVideoManager extends AbstractVideoManager<IState> {
    playerRef: React.RefObject<ReactPlayer>;

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
            isPlaying: false,
            isMuted: false
        };

        this.playerRef = React.createRef<ReactPlayer>();
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
        if (this.player === undefined || this.player === null || this.player.getCurrentTime() === null) {
            return -1;
        }

        return this.player.getCurrentTime();
    }

    /**
     * Seeks video to provided time.
     *
     * @param {number} time - The time to seek to.
     *
     * @returns {void}
     */
    seek(time: number) {
        return this.player?.seekTo(time);
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

    getPlayerOptions = () => {
        const { _isOwner, videoId, showControls, _isMuted } = this.props;
        const { isPlaying } = this.state;

        let options: any = {
            url: videoId,
            playing: isPlaying,
            controls: showControls,
            volume: 0.5,
            muted: _isMuted,
            height: '100%',
            width: '100%',
            progressInterval: 5000,
            config: {
                hlsSdkUrl: 'libs/hls.min.js',
                flvSdkUrl: 'libs/flv.min.js'
            },
            onReady: () => this.onPlayerReady(),
            onPlay: () => this.onPlayerPlay(),
            onError: () => this.onError()
        };

        if (_isOwner) {
            options = {
                ...options,
                onPause: () => this.onPlayerPause(),
                onProgress: this.throttledFireUpdateSharedVideoEvent
            };

        }

        return options;
    };

    /**
     * Implements React Component's render.
     *
     * @inheritdoc
     */
    render() {
        console.log('ExtendedVideoManager', this.state);

        return (
            <ReactPlayer
                ref = { this.playerRef }
                { ...this.getPlayerOptions() } />
        );
    }
}

export default connect(_mapStateToProps, _mapDispatchToProps)(ExtendedVideoManager);
