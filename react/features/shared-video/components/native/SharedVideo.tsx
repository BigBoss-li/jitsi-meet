import React, { Component } from 'react';
import { View, ViewStyle } from 'react-native';
import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../../app/types';
import { getLocalParticipant } from '../../../base/participants/functions';
import { ASPECT_RATIO_WIDE } from '../../../base/responsive-ui/constants';
import { setToolboxVisible } from '../../../toolbox/actions';

import ExtendedVideoManager from './ExtendedVideoManager';
import styles from './styles';

interface IProps {

    _signalLayout?: string;

    /**
     * The Redux dispatch function.
     */
    dispatch: IStore['dispatch'];

    /**
     * Is the video shared by the local user.
     *
     * @private
     */
    isOwner: boolean;

    /**
     * True if in landscape mode.
     *
     * @private
     */
    isWideScreen: boolean;

    /**
     * The available player width.
     */
    playerHeight: number;

    /**
     * The available player width.
     */
    playerWidth: number;

    /**
     * The shared video url.
     */
    videoUrl?: string;
}

/** .
 * Implements a React {@link Component} which represents the large video (a.k.a.
 * The conference participant who is on the local stage) on Web/React.
 *
 * @augments Component
 */
class SharedVideo extends Component<IProps> {
    /**
     * Initializes a new {@code SharedVideo} instance.
     *
     * @param {Object} props - The properties.
     */
    constructor(props: IProps) {
        super(props);

        this.setWideScreenMode(props.isWideScreen);
    }

    /**
     * Implements React's {@link Component#componentDidUpdate()}.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidUpdate(prevProps: IProps) {
        const { isWideScreen } = this.props;

        if (isWideScreen !== prevProps.isWideScreen) {
            this.setWideScreenMode(isWideScreen);
        }
    }

    /**
     * Dispatches action to set the visibility of the toolbox, true if not widescreen, false otherwise.
     *
     * @param {isWideScreen} isWideScreen - Whether the screen is wide.
     * @private
     * @returns {void}
    */
    setWideScreenMode(isWideScreen: boolean) {
        this.props.dispatch(setToolboxVisible(!isWideScreen));
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {React$Element}
     */
    render() {
        const { isOwner, videoUrl } = this.props;
        const signalObj = JSON.parse(videoUrl);
        const { signals, signalLayout } = signalObj;

        return (
            <View
                pointerEvents = { isOwner ? 'auto' : 'none' }
                style = { styles.videoContainer as ViewStyle } >
                <ExtendedVideoManager
                    layout = { signalLayout }
                    signals = { signals } />
            </View>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated LargeVideo props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    const { ownerId, videoUrl } = state['features/shared-video'];
    const { aspectRatio, clientHeight, clientWidth } = state['features/base/responsive-ui'];
    const { signalLayout } = state['features/settings'];

    const isWideScreen = aspectRatio === ASPECT_RATIO_WIDE;
    const localParticipant = getLocalParticipant(state);

    let playerHeight, playerWidth;

    if (isWideScreen) {
        playerHeight = clientHeight;
        playerWidth = playerHeight * 16 / 9;
    } else {
        playerWidth = clientWidth;
        playerHeight = playerWidth * 9 / 16;
    }

    return {
        isOwner: ownerId === localParticipant?.id,
        isWideScreen,
        playerHeight,
        playerWidth,
        videoUrl,
        _signalLayout: signalLayout
    };
}

export default connect(_mapStateToProps)(SharedVideo);
