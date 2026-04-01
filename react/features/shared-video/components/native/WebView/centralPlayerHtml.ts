/**
 * Central Control Player HTML 内容
 */
export const CENTRAL_PLAYER_HTML = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Central Control Player</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #000;
    }
    #videoContainer {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #videoElement {
      width: 100%;
      height: 100%;
      object-fit: contain;
      background-color: #000;
    }
  </style>
</head>
<body>
  <div id="videoContainer">
    <video id="videoElement" autoplay playsinline muted></video>
  </div>
  <script>
  (function() {
    var wsUrl = 'WS_URL_PLACEHOLDER';

    var pc = null;
    var ws = null;
    var stream = null;

    var videoEl = document.getElementById('videoElement');

    function sendToRN(data) {
      try {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(data));
        } else if (window.parent) {
          window.parent.postMessage(JSON.stringify(data), '*');
        }
      } catch (e) {
        console.error('发送消息失败:', e);
      }
    }

    function createPeerConnection() {
      var config = {
        iceServers: [{ urls: 'stun:stun4.l.google.com:19302' }]
      };
      pc = new RTCPeerConnection(config);

      pc.ontrack = function(event) {
        if (!stream) {
          stream = new MediaStream();
          videoEl.srcObject = stream;
        }
        stream.addTrack(event.track);
      };

      pc.onicecandidate = function(event) {
        if (event.candidate && ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(event.candidate));
        }
      };

      return pc;
    }

    function handleSdpMessage(sdpData) {
      try {
        var sdpJson = JSON.parse(sdpData);
        if (sdpJson.candidate) {
          pc.addIceCandidate(new RTCIceCandidate(sdpJson));
        } else if (sdpJson.sdp) {
          pc.setRemoteDescription(new RTCSessionDescription(sdpJson)).then(function() {
            return pc.createAnswer();
          }).then(function(answer) {
            answer.sdp = answer.sdp.replace('useinbandfec=1', 'useinbandfec=1; stereo=1; maxaveragebitrate=510000');
            return pc.setLocalDescription(answer);
          }).then(function() {
            ws.send(JSON.stringify(pc.localDescription));
          }).catch(function(e) {
            sendToRN({ type: 'error', message: 'SDP 处理失败: ' + e.message });
          });
        }
      } catch (e) {
        sendToRN({ type: 'error', message: 'SDP 处理失败: ' + e.message });
      }
    }

    function handleSourceAdded(msg) {
      sendToRN({ type: 'sourceAdded', data: msg });
    }

    function handleSourceRemoved(msg) {
      sendToRN({ type: 'sourceRemoved', data: msg });
    }

    function createWebSocket() {
      if (typeof WebSocket === 'undefined') {
        sendToRN({ type: 'error', message: '当前环境不支持 WebSocket' });
        return;
      }
      try {
        ws = new WebSocket(wsUrl);
        ws.onopen = function() {
          sendToRN({ type: 'wsConnected' });
        };
        ws.onmessage = function(event) {
          try {
            var msg = JSON.parse(event.data);
            switch (msg.MessageType) {
              case 1:
                handleSdpMessage(msg.SdpData);
                break;
              case 2:
                handleSourceAdded(msg);
                break;
              case 3:
                handleSourceRemoved(msg);
                break;
            }
          } catch (e) {
            console.error('消息解析失败:', e);
          }
        };
        ws.onerror = function(error) {
          sendToRN({ type: 'error', message: 'WebSocket 错误' });
        };
        ws.onclose = function(event) {
          sendToRN({ type: 'wsClosed', code: event.code });
        };
      } catch (e) {
        sendToRN({ type: 'error', message: 'WebSocket 创建失败: ' + e.message });
      }
    }

    function init() {
      if (!wsUrl) {
        sendToRN({ type: 'error', message: 'WebSocket URL 为空' });
        return;
      }
      if (typeof RTCPeerConnection === 'undefined') {
        sendToRN({ type: 'error', message: '当前环境不支持 WebRTC' });
        return;
      }
      createPeerConnection();
      createWebSocket();
      stream = new MediaStream();
      videoEl.srcObject = stream;
      sendToRN({ type: 'initialized' });
    }

    function cleanup() {
      if (pc) {
        pc.close();
        pc = null;
      }
      if (ws) {
        ws.close();
        ws = null;
      }
      if (stream) {
        stream = null;
        videoEl.srcObject = null;
      }
    }

    window.addEventListener('message', function(event) {
      try {
        var data = JSON.parse(event.data);
        switch (data.type) {
          case 'play':
            cleanup();
            if (data.wsUrl) {
              wsUrl = data.wsUrl;
            }
            init();
            break;
          case 'stop':
            cleanup();
            break;
          case 'reconnect':
            cleanup();
            init();
            break;
        }
      } catch (e) {
        console.error('处理消息失败:', e);
      }
    });

    document.addEventListener('DOMContentLoaded', init);
    window.addEventListener('beforeunload', cleanup);
  })();
  </script>
</body>
</html>
`;
