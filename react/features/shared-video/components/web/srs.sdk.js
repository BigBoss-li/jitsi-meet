/* eslint-disable */
//
// Copyright (c) 2013-2021 Winlin
//
// SPDX-License-Identifier: MIT
//

'use strict';

function SrsError(name, message) {
    this.name = name;
    this.message = message;
    this.stack = (new Error()).stack;
}
SrsError.prototype = Object.create(Error.prototype);
SrsError.prototype.constructor = SrsError;


// Depends on adapter-7.4.0.min.js from https://github.com/webrtc/adapter
// Async-awat-prmise based SRS RTC Publisher by WHIP.
export function SrsRtcWhipWhepAsync() {
    var self = {};

    // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
    self.constraints = {
        audio: true,
        video: {
            width: {ideal: 320, max: 576}
        }
    };

    // See https://datatracker.ietf.org/doc/draft-ietf-wish-whip/
    // @url The WebRTC url to publish with, for example:
    //      http://localhost:1985/rtc/v1/whip/?app=live&stream=livestream
    // @options The options to control playing, supports:
    //      videoOnly: boolean, whether only play video, default to false.
    //      audioOnly: boolean, whether only play audio, default to false.
    self.publish = async function (url, options) {
        if (url.indexOf('/whip/') === -1) throw new Error(`invalid WHIP url ${url}`);
        if (options?.videoOnly && options?.audioOnly) throw new Error(`The videoOnly and audioOnly in options can't be true at the same time`);

        if (!options?.videoOnly) {
            self.pc.addTransceiver("audio", {direction: "sendonly"});
        } else {
            self.constraints.audio = false;
        }

        if (!options?.audioOnly) {
            self.pc.addTransceiver("video", {direction: "sendonly"});
        } else {
            self.constraints.video = false;
        }

        if (!navigator.mediaDevices && window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
            throw new SrsError('HttpsRequiredError', `Please use HTTPS or localhost to publish, read https://github.com/ossrs/srs/issues/2762#issuecomment-983147576`);
        }
        var stream = await navigator.mediaDevices.getUserMedia(self.constraints);

        // @see https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/addStream#Migrating_to_addTrack
        stream.getTracks().forEach(function (track) {
            self.pc.addTrack(track);

            // Notify about local track when stream is ok.
            self.ontrack && self.ontrack({track: track});
        });

        var offer = await self.pc.createOffer();
        await self.pc.setLocalDescription(offer);
        const answer = await new Promise(function (resolve, reject) {
            console.log(`Generated offer: ${offer.sdp}`);

            const xhr = new XMLHttpRequest();
            xhr.onload = function() {
                if (xhr.readyState !== xhr.DONE) return;
                if (xhr.status !== 200 && xhr.status !== 201) return reject(xhr);
                const data = xhr.responseText;
                console.log("Got answer: ", data);
                return data.code ? reject(xhr) : resolve(data);
            }
            xhr.open('POST', url, true);
            xhr.setRequestHeader('Content-type', 'application/sdp');
            xhr.send(offer.sdp);
        });
        await self.pc.setRemoteDescription(
            new RTCSessionDescription({type: 'answer', sdp: answer})
        );

        return self.__internal.parseId(url, offer.sdp, answer);
    };

    // See https://datatracker.ietf.org/doc/draft-ietf-wish-whip/
    // @url The WebRTC url to play with, for example:
    //      http://localhost:1985/rtc/v1/whep/?app=live&stream=livestream
    // @options The options to control playing, supports:
    //      videoOnly: boolean, whether only play video, default to false.
    //      audioOnly: boolean, whether only play audio, default to false.
    self.play = async function(url, options) {
        if (url.indexOf('/whip-play/') === -1 && url.indexOf('/whep/') === -1) throw new Error(`invalid WHEP url ${url}`);
        if (options?.videoOnly && options?.audioOnly) throw new Error(`The videoOnly and audioOnly in options can't be true at the same time`);

        if (!options?.videoOnly) self.pc.addTransceiver("audio", {direction: "recvonly"});
        if (!options?.audioOnly) self.pc.addTransceiver("video", {direction: "recvonly"});

        var offer = await self.pc.createOffer();
        await self.pc.setLocalDescription(offer);
        const answer = await new Promise(function(resolve, reject) {
            console.log(`Generated offer: ${offer.sdp}`);

            const xhr = new XMLHttpRequest();
            xhr.onload = function() {
                if (xhr.readyState !== xhr.DONE) return;
                if (xhr.status !== 200 && xhr.status !== 201) return reject(xhr);
                const data = xhr.responseText;
                console.log("Got answer: ", data);
                return data.code ? reject(xhr) : resolve(data);
            }
            xhr.open('POST', url, true);
            xhr.setRequestHeader('Content-type', 'application/sdp');
            xhr.send(offer.sdp);
        });
        await self.pc.setRemoteDescription(
            new RTCSessionDescription({type: 'answer', sdp: answer})
        );

        return self.__internal.parseId(url, offer.sdp, answer);
    };

    // Close the publisher.
    self.close = function () {
        self.pc && self.pc.close();
        self.pc = null;
    };

    // The callback when got local stream.
    // @see https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/addStream#Migrating_to_addTrack
    self.ontrack = function (event) {
        // Add track to stream of SDK.
        self.stream.addTrack(event.track);
    };

    self.pc = new RTCPeerConnection(null);

    // To keep api consistent between player and publisher.
    // @see https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/addStream#Migrating_to_addTrack
    // @see https://webrtc.org/getting-started/media-devices
    self.stream = new MediaStream();

    // Internal APIs.
    self.__internal = {
        parseId: (url, offer, answer) => {
            let sessionid = offer.substr(offer.indexOf('a=ice-ufrag:') + 'a=ice-ufrag:'.length);
            sessionid = sessionid.substr(0, sessionid.indexOf('\n') - 1) + ':';
            sessionid += answer.substr(answer.indexOf('a=ice-ufrag:') + 'a=ice-ufrag:'.length);
            sessionid = sessionid.substr(0, sessionid.indexOf('\n'));

            const a = document.createElement("a");
            a.href = url;
            return {
                sessionid: sessionid, // Should be ice-ufrag of answer:offer.
                simulator: a.protocol + '//' + a.host + '/rtc/v1/nack/',
            };
        },
    };

    // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/ontrack
    self.pc.ontrack = function(event) {
        if (self.ontrack) {
            self.ontrack(event);
        }
    };

    return self;
}


