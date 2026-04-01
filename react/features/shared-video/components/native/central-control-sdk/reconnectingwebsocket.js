/* eslint-disable */

/**
 * React Native compatible ReconnectingWebSocket
 * - 不依赖 window / document / CustomEvent
 * - 使用简单的事件订阅机制
 * - 可直接运行在 React Native 环境
 */

function ReconnectingWebSocket(url, protocols, options = {}) {
    const settings = {
        debug: true,
        automaticOpen: true,
        reconnectInterval: 1000,
        maxReconnectInterval: 30000,
        reconnectDecay: 1.5,
        timeoutInterval: 2000,
        maxReconnectAttempts: null,
        binaryType: 'blob',
        headers: undefined
    };

    Object.keys(settings).forEach(key => {
        this[key] = options[key] !== undefined ? options[key] : settings[key];
    });

    this.url = url;
    this.reconnectAttempts = 0;
    this.readyState = ReconnectingWebSocket.CONNECTING;
    this.protocol = null;

    let ws = null;
    let forcedClose = false;
    let timedOut = false;

    /** -------------------------
     *  事件系统（RN 友好）
     * ------------------------- */
    const listeners = {
        open: [],
        close: [],
        connecting: [],
        message: [],
        error: []
    };

    const dispatch = (type, event = {}) => {
        listeners[type].forEach(fn => fn(event));
        const handler = this[`on${type}`];
        handler && handler(event);
    };

    this.addEventListener = (type, fn) => {
        listeners[type] && listeners[type].push(fn);
    };

    this.removeEventListener = (type, fn) => {
        if (!listeners[type]) return;
        listeners[type] = listeners[type].filter(f => f !== fn);
    };

    /** -------------------------
     *  核心逻辑
     * ------------------------- */
    this.open = (reconnectAttempt = false) => {
        if (
            reconnectAttempt &&
            this.maxReconnectAttempts &&
            this.reconnectAttempts > this.maxReconnectAttempts
        ) {
            return;
        }

        if (!reconnectAttempt) {
            this.reconnectAttempts = 0;
            dispatch('connecting');
        }

        if (this.debug || ReconnectingWebSocket.debugAll) {
            console.log('[RWS] connect ->', this.url);
        }

        ws = new WebSocket(this.url, protocols, { headers: this.headers });
        ws.binaryType = this.binaryType;

        const timeout = setTimeout(() => {
            timedOut = true;
            ws && ws.close();
            timedOut = false;
        }, this.timeoutInterval);

        ws.onopen = () => {
            clearTimeout(timeout);
            this.readyState = ReconnectingWebSocket.OPEN;
            this.reconnectAttempts = 0;
            this.protocol = ws.protocol;
            dispatch('open', { isReconnect: reconnectAttempt });
        };

        ws.onmessage = event => {
            dispatch('message', { data: event.data });
        };

        ws.onerror = event => {
            dispatch('error', event);
        };

        ws.onclose = event => {
            clearTimeout(timeout);
            ws = null;

            if (forcedClose) {
                this.readyState = ReconnectingWebSocket.CLOSED;
                dispatch('close', event);
                return;
            }

            this.readyState = ReconnectingWebSocket.CONNECTING;
            dispatch('connecting', event);

            if (!reconnectAttempt && !timedOut) {
                dispatch('close', event);
            }

            const delay = Math.min(
                this.reconnectInterval *
                    Math.pow(this.reconnectDecay, this.reconnectAttempts),
                this.maxReconnectInterval
            );

            setTimeout(() => {
                this.reconnectAttempts++;
                this.open(true);
            }, delay);
        };
    };

    if (this.automaticOpen) {
        this.open(false);
    }

    this.send = data => {
        if (!ws || this.readyState !== ReconnectingWebSocket.OPEN) {
            throw new Error('WebSocket is not open');
        }
        ws.send(data);
    };

    this.close = (code = 1000, reason) => {
        forcedClose = true;
        ws && ws.close(code, reason);
    };

    this.refresh = () => {
        ws && ws.close();
    };
}

/** -------------------------
 *  静态属性
 * ------------------------- */
ReconnectingWebSocket.debugAll = false;

ReconnectingWebSocket.CONNECTING = 0;
ReconnectingWebSocket.OPEN = 1;
ReconnectingWebSocket.CLOSING = 2;
ReconnectingWebSocket.CLOSED = 3;

module.exports = ReconnectingWebSocket;