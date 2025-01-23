import React, { Component } from 'react';
import { connect } from 'react-redux';

// @ts-expect-error
import Filmstrip from '../../../../../modules/UI/videolayout/Filmstrip';
import { IReduxState } from '../../../app/types';
import { getLocalParticipant } from '../../../base/participants/functions';
import { getVerticalViewMaxWidth } from '../../../filmstrip/functions.web';
import { getToolboxHeight } from '../../../toolbox/functions.web';
import { isSharedVideoEnabled } from '../../functions';

import ExtendedVideoManager from './ExtendedVideoManager';

// import VideoManager from './VideoManager';
// import YoutubeVideoManager from './YoutubeVideoManager';

interface IProps {

    _signalLayout?: string;

    /**
     * The available client width.
     */
    clientHeight: number;

    /**
     * The available client width.
     */
    clientWidth: number;

    /**
     * Whether the (vertical) filmstrip is visible or not.
     */
    filmstripVisible: boolean;

    /**
     * The width of the vertical filmstrip.
     */
    filmstripWidth: number;

    /**
     * Whether the shared video is enabled or not.
     */
    isEnabled: boolean;

    /**
     * Is the video shared by the local user.
     */
    isOwner: boolean;

    /**
     * Whether or not the user is actively resizing the filmstrip.
     */
    isResizing: boolean;

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
     * Computes the width and the height of the component.
     *
     * @returns {{
     *  height: number,
     *  width: number
     * }}
     */
    getDimensions() {
        const { clientHeight, clientWidth, filmstripVisible, filmstripWidth } = this.props;

        let width;
        let height;

        if (interfaceConfig.VERTICAL_FILMSTRIP) {
            if (filmstripVisible) {
                width = `${clientWidth - filmstripWidth}px`;
            } else {
                width = `${clientWidth}px`;
            }
            height = `${clientHeight - getToolboxHeight()}px`;
        } else {
            if (filmstripVisible) {
                height = `${clientHeight - Filmstrip.getFilmstripHeight()}px`;
            } else {
                height = `${clientHeight}px`;
            }
            width = `${clientWidth}px`;
        }

        return {
            width,
            height
        };
    }

    /**
     * Retrieves the manager to be used for playing the shared video.
     *
     * @returns {Component}
     */
    getManager() {

        const { videoUrl: signalParams, _signalLayout: layout } = this.props;

        if (signalParams === undefined) {
            return null;
        }

        let videoUrl;
        let _signalLayout = layout;

        if (signalParams !== undefined) {
            const signalObj = JSON.parse(signalParams);
            const { signalLayout, signals } = signalObj;

            videoUrl = JSON.stringify(signals);
            _signalLayout = signalLayout;
        }

        if (!videoUrl || videoUrl === '') {
            return null;
        }

        return (
            <ExtendedVideoManager
                _signalLayout = { _signalLayout }
                videoId = { videoUrl } />)
        ;

        // if (videoUrl.match(/http/)) {
        //     const vUrl = new URL(videoUrl);

        //     if (vUrl.pathname.endsWith('.flv') || vUrl.pathname.endsWith('.m3u8')) {
        //         return (
        //             <ExtendedVideoManager
        //                 videoId = { videoUrl } />
        //         );
        //     }

        //     return <VideoManager videoId = { videoUrl } />;

        // }

        // return <YoutubeVideoManager videoId = { videoUrl } />;
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {React$Element}
     */
    render() {
        // console.log('SharedVideo render', this.props);

        const { isEnabled, isResizing, isOwner } = this.props;

        if (!isEnabled) {
            return null;
        }
        const className = !isResizing && isOwner ? '' : 'disable-pointer';

        return (
            <div
                className = { className }
                id = 'sharedVideo'
                style = { this.getDimensions() }>
                {this.getManager()}

            </div>
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
    const { clientHeight, clientWidth } = state['features/base/responsive-ui'];
    const { visible, isResizing } = state['features/filmstrip'];
    const { signalLayout } = state['features/settings'];

    const localParticipant = getLocalParticipant(state);

    return {
        clientHeight,
        clientWidth,
        filmstripVisible: visible,
        filmstripWidth: getVerticalViewMaxWidth(state),
        isEnabled: isSharedVideoEnabled(state),
        isOwner: ownerId === localParticipant?.id,
        isResizing,
        videoUrl,
        _signalLayout: signalLayout
    };
}

export default connect(_mapStateToProps)(SharedVideo);
