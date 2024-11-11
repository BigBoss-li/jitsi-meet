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
}


/**
 * Manager of shared video.
 *
 * @param {string} videoId - Video url.
 * @returns {void}
 */
class ExtendedVideoManager extends AbstractVideoManager<IState> {
    playerRef: React.RefObject<HTMLDivElement>;
    reactPlayersRef: Array<RefObject<ReactPlayer>>;


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
            isMuted: false
        };

        this.playerRef = React.createRef<HTMLDivElement>();
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
     * Implements React Component's render.
     *
     * @inheritdoc
     */
    render() {
        const { videoId } = this.props;

        const videoUrls = videoId?.split(',');
        const videoClassName = `shared-video-size-${videoUrls?.length}`;

        if (videoUrls && videoUrls?.length > 0) {
            this.reactPlayersRef = new Array(videoUrls.length);
        }

        return (
            <div
                className = { clsx(
            'shared-video-wrapper',
            videoClassName
                ) }
                ref = { this.playerRef }>
                { videoUrls && videoUrls?.length > 0
                    ? videoUrls?.map((url, idx) => (
                        <div
                            className = 'shared-video'
                            key = { idx }>
                            <ReactPlayer
                                // eslint-disable-next-line react/jsx-no-bind
                                ref = { refItem => {
                                    this.reactPlayersRef[idx] = refItem;
                                } }
                                { ...this.getPlayerOptions(url) } />
                        </div>
                    ))
                    : ''}
            </div>

        );
    }
}

export default connect(_mapStateToProps, _mapDispatchToProps)(ExtendedVideoManager);
