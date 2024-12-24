import i18next from 'i18next';
import { v4 as uuidV4 } from 'uuid';

import { IStore } from '../../../app/types';
import { getRoomName } from '../../../base/conference/functions';
import { MEDIA_TYPE } from '../../../base/media/constants';
import { getLocalTrack, getTrackState } from '../../../base/tracks/functions';
import { inIframe } from '../../../base/util/iframeUtils';
import { stopLocalVideoRecording } from '../../actions.any';

interface ISelfRecording {
    on: boolean;
    withVideo: boolean;
}

interface ILocalRecordingManager {
    addAudioTrackToLocalRecording: (track: MediaStreamTrack) => void;
    audioContext: AudioContext | undefined;
    audioDestination: MediaStreamAudioDestinationNode | undefined;
    binaryFileIndex: number;
    fileSizeLimit: number;
    getFilename: () => string;
    initializeAudioMixer: () => void;
    isRecordingLocally: () => boolean;
    mediaType: string;
    mixAudioStream: (stream: MediaStream) => void;
    recorder: MediaRecorder | undefined;
    recordingData: Blob[];
    recordingType: string;
    roomName: string;
    saveRecording: (recordingData: Blob[], filename: string) => void;
    selfRecording: ISelfRecording;
    sendBlobRecording: (recordingData: Blob[]) => void;
    sendSplitRecording: (recordingData: Blob[]) => void;
    startLocalRecording: (store: IStore, onlySelf: boolean) => Promise<void>;
    stopLocalRecording: () => void;
    stream: MediaStream | undefined;
    totalSize: number;
}

const getMimeType = (): string => {
    const possibleTypes = [
        'video/mp4;'
    ];

    for (const type of possibleTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
            return type;
        }
    }
    throw new Error('No MIME Type supported by MediaRecorder');
};

const VIDEO_BIT_RATE = 2500000; // 2.5Mbps in bits
const MAX_SIZE = 1073741824; // 1GB in bytes
const DEF_FILE_SIZE = 1048576; // 1MB in bytes
// const DEF_FILE_SIZE = 104857600; // 100MB in bytes

// Lazily initialize.
let preferredMediaType: string;

const LocalRecordingManager: ILocalRecordingManager = {
    binaryFileIndex: 0,
    recordingData: [],
    recorder: undefined,
    stream: undefined,
    audioContext: undefined,
    audioDestination: undefined,
    roomName: '',
    totalSize: MAX_SIZE,
    selfRecording: {
        on: false,
        withVideo: false
    },
    recordingType: 'SINGLE',
    fileSizeLimit: DEF_FILE_SIZE,

    get mediaType() {
        if (this.selfRecording.on && !this.selfRecording.withVideo) {
            return 'audio/mp3;';
        }
        if (!preferredMediaType) {
            preferredMediaType = getMimeType();
        }

        return preferredMediaType;
    },

    /**
     * Initializes audio context used for mixing audio tracks.
     *
     * @returns {void}
     */
    initializeAudioMixer() {
        this.audioContext = new AudioContext();
        this.audioDestination = this.audioContext.createMediaStreamDestination();
    },

    /**
     * Mixes multiple audio tracks to the destination media stream.
     *
     * @param {MediaStream} stream - The stream to mix.
     * @returns {void}
     * */
    mixAudioStream(stream) {
        if (stream.getAudioTracks().length > 0 && this.audioDestination) {
            this.audioContext?.createMediaStreamSource(stream).connect(this.audioDestination);
        }
    },

    /**
     * Adds audio track to the recording stream.
     *
     * @param {MediaStreamTrack} track - The track to be added.
     * @returns {void}
     */
    addAudioTrackToLocalRecording(track) {
        if (this.selfRecording.on) {
            return;
        }
        if (track) {
            const stream = new MediaStream([ track ]);

            this.mixAudioStream(stream);
        }
    },

    /**
     * Returns a filename based ono the Jitsi room name in the URL and timestamp.
     *
     * @returns {string}
     * */
    getFilename() {
        const now = new Date();
        const timestamp = now.toISOString();

        return `${this.roomName}_${timestamp}`;
    },

    /**
     * Saves local recording to file.
     *
     * @param {Array} recordingData - The recording data.
     * @param {string} filename - The name of the file.
     * @returns {void}
     * */
    async saveRecording(recordingData) {
        // @ts-ignore
        const blob = new Blob(recordingData, { type: 'application/octet-stream' });

        const file = new File([ blob ], 'test.001');
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');

        // const extension = this.mediaType.slice(this.mediaType.indexOf('/') + 1, this.mediaType.indexOf(';'));

        a.style.display = 'none';
        a.href = url;

        // a.download = `${filename}.${extension}`;
        a.download = 'test.001';
        a.click();
        this.recordingData = [];
    },

    async sendBlobRecording(recordingData: any) {
        // @ts-ignore
        const blob = new Blob(recordingData, { type: 'application/octet-stream' });
        const filename = `${this.binaryFileIndex}.bin`;

        window.parent.postMessage({
            type: 'recorder_full_data',
            data: {
                blob,
                filename
            }
        }, '*');
    },

    async sendSplitRecording(recordingData: any) {
        // @ts-ignore
        const blob = new Blob(recordingData, { type: 'application/octet-stream' });

        // const extension = this.mediaType.slice(this.mediaType.indexOf('/') + 1, this.mediaType.indexOf(';'));
        const filename = `${this.binaryFileIndex}.bin`;

        this.binaryFileIndex++;

        window.parent.postMessage({
            type: 'recorder_split_data',
            data: {
                blob,
                filename
            }
        }, '*');
        this.recordingData = [];
    },

    /**
     * Stops local recording.
     *
     * @returns {void}
     * */
    stopLocalRecording() {
        if (this.recorder) {
            this.recorder.stop();
            this.recorder = undefined;
            this.audioContext = undefined;
            this.audioDestination = undefined;
            this.totalSize = MAX_SIZE;
            setTimeout(() => {
                if (this.recordingData.length > 0) {
                    // this.saveRecording(this.recordingData, this.getFilename());
                    this.sendBlobRecording(this.recordingData);
                }
            }, 1000);
        }
    },

    /**
     * Starts a local recording.
     *
     * @param {IStore} store - The redux store.
     * @param {boolean} onlySelf - Whether to record only self streams.
     * @returns {void}
     */
    async startLocalRecording(store, onlySelf) {
        const { dispatch, getState } = store;

        this.fileSizeLimit = DEF_FILE_SIZE;

        this.binaryFileIndex = 0;

        // @ts-ignore
        const supportsCaptureHandle = Boolean(navigator.mediaDevices.setCaptureHandleConfig) && !inIframe();
        const tabId = uuidV4();

        this.selfRecording.on = onlySelf;
        this.recordingData = [];
        this.roomName = getRoomName(getState()) ?? '';
        let gdmStream: MediaStream = new MediaStream();
        const tracks = getTrackState(getState());

        if (onlySelf) {
            let audioTrack: MediaStreamTrack | undefined = getLocalTrack(tracks, MEDIA_TYPE.AUDIO)?.jitsiTrack?.track;
            let videoTrack: MediaStreamTrack | undefined = getLocalTrack(tracks, MEDIA_TYPE.VIDEO)?.jitsiTrack?.track;

            if (!audioTrack) {
                APP.conference.muteAudio(false);
                setTimeout(() => APP.conference.muteAudio(true), 100);
                await new Promise(resolve => {
                    setTimeout(resolve, 100);
                });
            }
            if (videoTrack && videoTrack.readyState !== 'live') {
                videoTrack = undefined;
            }
            audioTrack = getLocalTrack(getTrackState(getState()), MEDIA_TYPE.AUDIO)?.jitsiTrack?.track;
            if (!audioTrack && !videoTrack) {
                throw new Error('NoLocalStreams');
            }
            this.selfRecording.withVideo = Boolean(videoTrack);
            const localTracks = [];

            audioTrack && localTracks.push(audioTrack);
            videoTrack && localTracks.push(videoTrack);
            this.stream = new MediaStream(localTracks);
        } else {
            if (supportsCaptureHandle) {
                // @ts-ignore
                navigator.mediaDevices.setCaptureHandleConfig({
                    handle: `JitsiMeet-${tabId}`,
                    permittedOrigins: [ '*' ]
                });
            }
            const localAudioTrack = getLocalTrack(tracks, MEDIA_TYPE.AUDIO)?.jitsiTrack?.track;

            // Starting chrome 107, the recorder does not record any data if the audio stream has no tracks
            // To fix this we create a track for the local user(muted track)
            if (!localAudioTrack) {
                APP.conference.muteAudio(false);
                setTimeout(() => APP.conference.muteAudio(true), 100);
                await new Promise(resolve => {
                    setTimeout(resolve, 100);
                });
            }

            // handle no mic permission
            if (!getLocalTrack(getTrackState(getState()), MEDIA_TYPE.AUDIO)?.jitsiTrack?.track) {
                throw new Error('NoMicTrack');
            }

            const currentTitle = document.title;

            document.title = i18next.t('localRecording.selectTabTitle');

            // @ts-ignore
            gdmStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    displaySurface: 'browser',
                    frameRate: 30
                },
                audio: false, // @ts-ignore
                preferCurrentTab: true
            });
            document.title = currentTitle;

            const isBrowser = gdmStream.getVideoTracks()[0].getSettings().displaySurface === 'browser';

            if (!isBrowser || (supportsCaptureHandle // @ts-ignore
                && gdmStream.getVideoTracks()[0].getCaptureHandle()?.handle !== `JitsiMeet-${tabId}`)) {
                gdmStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
                throw new Error('WrongSurfaceSelected');
            }

            this.initializeAudioMixer();

            const allTracks = getTrackState(getState());

            allTracks.forEach((track: any) => {
                if (track.mediaType === MEDIA_TYPE.AUDIO) {
                    const audioTrack = track?.jitsiTrack?.track;

                    this.addAudioTrackToLocalRecording(audioTrack);
                }
            });
            this.stream = new MediaStream([
                ...this.audioDestination?.stream.getAudioTracks() || [],
                gdmStream.getVideoTracks()[0]
            ]);
        }

        this.recorder = new MediaRecorder(this.stream, {
            mimeType: this.mediaType,
            videoBitsPerSecond: VIDEO_BIT_RATE
        });

        this.recorder.addEventListener('dataavailable', e => {
            if (e.data && e.data.size > 0) {
                console.log(e);
                this.recordingData.push(e.data);
                this.totalSize -= e.data.size;
                if (this.totalSize <= 0) {
                    dispatch(stopLocalVideoRecording());
                }
                this.fileSizeLimit -= e.data.size;
                console.log('fileSizeLimit', this.fileSizeLimit);
                if (this.fileSizeLimit <= 0) {
                    this.fileSizeLimit = DEF_FILE_SIZE;
                    console.log('reset', this.fileSizeLimit);
                    this.sendSplitRecording(this.recordingData);
                }
            }
        });

        if (!onlySelf) {
            this.recorder.addEventListener('stop', () => {
                this.stream?.getTracks().forEach((track: MediaStreamTrack) => track.stop());
                gdmStream?.getTracks().forEach((track: MediaStreamTrack) => track.stop());
            });

            gdmStream?.addEventListener('inactive', () => {
                dispatch(stopLocalVideoRecording());
            });

            this.stream.addEventListener('inactive', () => {
                dispatch(stopLocalVideoRecording());
            });
        }

        this.recorder.start(5000);

        window.parent.postMessage({
            type: 'recorder_start',
            data: true
        }, '*');
    },

    /**
     * Whether or not we're currently recording locally.
     *
     * @returns {boolean}
     */
    isRecordingLocally() {
        return Boolean(this.recorder);
    }

};

export default LocalRecordingManager;
