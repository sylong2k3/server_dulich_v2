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

            // action: subscribe — client đăng ký nhận event của channel
            if (message.action === 'subscribe' && Array.isArray(message.channels)) {
                message.channels
                    .map((ch) => String(ch).trim())
                    .filter(Boolean)
                    .forEach((ch) => ws._wsState.channels.add(ch));

                safelySend(ws, createMessage('subscribed', {
                    channels: Array.from(ws._wsState.channels),
                }));

                // Dữ liệu capacity ban đầu lấy từ REST API /spots/map
                // WebSocket chỉ push capacity_update / capacity_alert khi có log mới
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

        // Token tuỳ chọn — cho phép kết nối ẩn danh (channel công khai như capacity)
        const token =
            (req.headers.authorization && req.headers.authorization.split(' ')[1]) ||
            requestUrl.searchParams.get('token');

        if (token) {
            try {
                req._wsUser = TokenManager.validateAccessToken(token);
            } catch (_) {
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                socket.destroy();
                return;
            }
        }

        wss.handleUpgrade(req, socket, head, (ws) => {
            setupSocketState(ws, req);
        });
    };

    server.on('upgrade', upgradeHandler);
}

function broadcast(event, data) {
    const message = createMessage(event, data);
    clients.forEach((ws) => {
        if (!safelySend(ws, message)) clients.delete(ws);
    });
}

function notifyUser(userId, event, data) {
    const message = createMessage(event, data);
    clients.forEach((ws) => {
        if (ws._wsState?.userId === String(userId)) {
            if (!safelySend(ws, message)) clients.delete(ws);
        }
    });
}

/**
 * Push event đến tất cả client đang subscribe channel.
 * Được gọi bởi capacity.service.js khi có log mới.
 *
 * Events:
 *  - capacity_update : { spot_id, visitor_count, capacity_pct, status, recorded_at }
 *  - capacity_alert  : { spot_id, status, capacity_pct, visitor_count, recorded_at }
 */
function notifyChannel(channel, event, data) {
    const message = createMessage(event, data);
    clients.forEach((ws) => {
        if (ws._wsState?.channels?.has(channel)) {
            if (!safelySend(ws, message)) clients.delete(ws);
        }
    });
}

function closeWebSocketServer() {
    clients.forEach((ws) => {
        try { ws.close(1000, 'Server shutting down'); } catch (_) { /* no-op */ }
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
