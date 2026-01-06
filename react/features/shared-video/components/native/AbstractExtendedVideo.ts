import { Component } from 'react';

/**
 * Abstract class for extended video.
 */
abstract class AbstractExtendedVideo<S = void> extends Component<S> {
    /**
     * Match video url.
     *
     * @param {string} url - VideoUrl.
     * @returns {boolean} Boolean.
     */
    matchNormalVideoUrl(url: string) {
        return url.endsWith('.flv') || url.endsWith('.m3u8') || url.endsWith('.mp4');
    }

    /**
     * Match WS video url.
     *
     * @param {string} url - VideoUrl.
     * @returns {boolean} Boolean.
     */
    matchWsVideoUrl(url: string) {
        return url.startsWith('wss://') || url.startsWith('ws://');
    }
}

export default AbstractExtendedVideo;
