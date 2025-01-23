/* eslint-disable */
// import { ReconnectingWebSocket } from './Reconnectingwebsocket'
import ReconnectingWebSocket from './reconnectingwebsocket.js'

export function CentralControlAsync(src) {
    var self = {}

    const configuration = { iceServers: [{ urls: "stun:stun4.l.google.com:19302" }] };
    self.pc = new RTCPeerConnection(configuration)

    self.pc.ontrack = evt => {
        if (self.ontrack) {
            self.ontrack(evt)
        }
    }

    
    // self.pc.onicecandidate = evt => {
    //     console.log('===========', JSON.stringify(evt.candidate))
    //     evt.candidate && self.ws.send(JSON.stringify(evt.candidate))
    // };

    self.ws = new ReconnectingWebSocket(src, []);

    self.ws.onmessage = function (wsEvt) {
        let msg = JSON.parse(wsEvt.data);
        console.log("message type " + msg.MessageType);
        switch (msg.MessageType) {
            case 1:
                sdpHandler(msg);
                break;
            case 2:
                srcAddedHandler(msg);
                break;
            case 3:
                srcRemovedHandler(msg);
                break;
        }
    };


    self.ontrack = evt => {
        self.stream.addTrack(evt.track)
    }

    self.stream = new MediaStream()

    const sdpHandler = async function (sdpMsg) {
        let sdpJson = JSON.parse(sdpMsg.SdpData);
        console.log("sdp handler");
        if (sdpJson?.candidate) {
            self.pc.addIceCandidate(sdpJson);
        }
        else if (sdpJson?.sdp) {
            await self.pc.setRemoteDescription(new RTCSessionDescription(sdpJson));
            let answer = await self.pc.createAnswer()
            answer.sdp = answer.sdp.replace("useinbandfec=1", "useinbandfec=1; stereo=1; maxaveragebitrate=510000");
            await self.pc.setLocalDescription(answer);
            self.ws.send(JSON.stringify(self.pc.localDescription));
        }
    }

    const srcAddedHandler = function (srcAddedMsg) {
        console.log(srcAddedMsg)
    }

    const srcRemovedHandler = function (srcRemovedMsg) {
        console.log("Source removed");
        let src = srcRemovedMsg.Source;
        console.log(src)
        // if (src.Guid == currentSourceGuid) {
        //     start(EMPTYSOURCENAME);
        // }
    }

    self.close = async function() {
        await self.pc?.close()
        await self.ws?.close()
    }

    return self;
}
