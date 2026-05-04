const WebSocket = require('ws');
const TokenManager = require('../utils/tokenManager');

const clients = new Set();
let wss = null;
let upgradeHandler = null;

function createMessage(event, data) {
    return JSON.stringify({
        event,
        data,
        timestamp: new Date().toISOString(),
    });
}

function safelySend(ws, message) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;

    try {
        ws.send(message);
        return true;
    } catch (_) {
        return false;
    }
}

function cleanupClient(ws) {
    clients.delete(ws);
}

function setupSocketState(ws, req) {
    // userId lấy từ token đã xác thực (không tin client truyền vào)
    const userId = req._wsUser ? String(req._wsUser.id) : null;

    ws._wsState = {
        userId,
        channels: new Set(),
    };

    clients.add(ws);

    safelySend(ws, createMessage('connected', {
        userId,
        message: 'WebSocket connected',
    }));

    ws.on('message', (rawPayload) => {
        try {
            const payload = Buffer.isBuffer(rawPayload)
                ? rawPayload.toString('utf8')
                : String(rawPayload);
            const message = JSON.parse(payload);

            if (message.action === 'subscribe' && Array.isArray(message.channels)) {
                message.channels
                    .map((channel) => String(channel).trim())
                    .filter(Boolean)
                    .forEach((channel) => ws._wsState.channels.add(channel));

                safelySend(ws, createMessage('subscribed', {
                    channels: Array.from(ws._wsState.channels),
                }));
            }
        } catch (_) {
            safelySend(ws, createMessage('error', {
                message: 'Invalid WebSocket message format',
            }));
        }
    });

    ws.on('close', () => cleanupClient(ws));
    ws.on('error', () => cleanupClient(ws));
}

function initWebSocketServer(server, options = {}) {
    const path = options.path || '/ws';

    if (wss) return;

    wss = new WebSocket.Server({ noServer: true });

    upgradeHandler = async (req, socket, head) => {
        const requestUrl = new URL(req.url, `http://${req.headers.host}`);

        if (requestUrl.pathname !== path) {
            socket.destroy();
            return;
        }
        const token =
            (req.headers.authorization && req.headers.authorization.split(' ')[1]) ||
            requestUrl.searchParams.get('token');
        if (!token) {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
            return;
        }
        let decoded;
        try {
            decoded = TokenManager.validateAccessToken(token);
        } catch (err) {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
            return;
        }
        req._wsUser = decoded;
        wss.handleUpgrade(req, socket, head, (ws) => {
            setupSocketState(ws, req);
        });
    };
    server.on('upgrade', upgradeHandler);
}

function broadcast(event, data) {
    const message = createMessage(event, data);
    clients.forEach((ws) => {
        const isSent = safelySend(ws, message);
        if (!isSent) clients.delete(ws);
    });
}

function notifyUser(userId, event, data) {
    const message = createMessage(event, data);

    clients.forEach((ws) => {
        if (ws._wsState?.userId === String(userId)) {
            const isSent = safelySend(ws, message);
            if (!isSent) clients.delete(ws);
        }
    });
}

function notifyChannel(channel, event, data) {
    const message = createMessage(event, data);

    clients.forEach((ws) => {
        if (ws._wsState?.channels?.has(channel)) {
            const isSent = safelySend(ws, message);
            if (!isSent) clients.delete(ws);
        }
    });
}

function closeWebSocketServer() {
    clients.forEach((ws) => {
        try {
            ws.close(1000, 'Server shutting down');
        } catch (_) {
            // no-op
        }
    });

    clients.clear();

    if (wss) {
        wss.close();
        wss = null;
    }
}

module.exports = {
    initWebSocketServer,
    closeWebSocketServer,
    broadcast,
    notifyUser,
    notifyChannel,
};
