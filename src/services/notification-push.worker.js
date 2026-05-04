const https = require("https");
const http2 = require("http2");
const crypto = require("crypto");
const NotificationRepository = require("../models/repositories/notification.repository");

const FCM_ENDPOINT = "https://fcm.googleapis.com/fcm/send";

const toPositiveInt = (value, fallback) => {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? Math.floor(number) : fallback;
};

const isFeatureEnabled = (rawValue, fallbackValue = true) => {
    if (rawValue === undefined || rawValue === null || rawValue === "") {
        return fallbackValue;
    }

    const value = String(rawValue).trim().toLowerCase();
    if (["0", "false", "off", "no", "disabled"].includes(value)) return false;
    if (["1", "true", "on", "yes", "enabled"].includes(value)) return true;
    return fallbackValue;
};

const parseJsonSafe = (raw) => {
    if (!raw) return null;
    if (typeof raw === "object") return raw;
    if (typeof raw !== "string") return null;

    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

const toBase64Url = (value) =>
    Buffer.from(value)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");

const normalizeCustomData = (data) => {
    const parsed = parseJsonSafe(data);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed;
};

const escapeApnsValue = (value) => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    return JSON.stringify(value);
};

class NotificationPushWorker {
    constructor() {
        this.intervalId = null;
        this.processing = false;
        this.cachedApnsToken = null;
        this.cachedApnsIat = 0;
    }

    isEnabled() {
        return isFeatureEnabled(process.env.NOTIFICATION_PUSH_WORKER_ENABLED, true);
    }

    getIntervalMs() {
        return toPositiveInt(process.env.NOTIFICATION_PUSH_WORKER_INTERVAL_MS, 30000);
    }

    getBatchSize() {
        return Math.min(
            toPositiveInt(process.env.NOTIFICATION_PUSH_WORKER_BATCH_SIZE, 50),
            500,
        );
    }

    start() {
        if (!this.isEnabled()) {
            console.log("[NotificationPushWorker] disabled by configuration");
            return;
        }

        if (this.intervalId) return;

        const intervalMs = this.getIntervalMs();
        const batchSize = this.getBatchSize();

        this.intervalId = setInterval(() => {
            this.processPendingNotifications().catch((error) => {
                console.error("[NotificationPushWorker] Tick error:", error.message);
            });
        }, intervalMs);

        if (typeof this.intervalId.unref === "function") {
            this.intervalId.unref();
        }

        console.log(
            `[NotificationPushWorker] started (interval=${intervalMs}ms, batch=${batchSize})`,
        );

        this.processPendingNotifications().catch((error) => {
            console.error("[NotificationPushWorker] Initial run error:", error.message);
        });
    }

    stop() {
        if (!this.intervalId) return;

        clearInterval(this.intervalId);
        this.intervalId = null;
        console.log("[NotificationPushWorker] stopped");
    }

    /**
     * HIGH-07 FIX: Process notifications with bounded parallelism
     *
     * BEFORE: Sequential for-loop → 50 × 500ms = 25s per tick
     * AFTER:  Parallel chunks of 10 → 5 chunks × 500ms = ~2.5s per tick
     *
     * Performance: 10x faster push throughput
     */
    async processPendingNotifications() {
        if (this.processing) return;

        this.processing = true;
        try {
            const notifications = await NotificationRepository.getPendingNotifications(
                this.getBatchSize(),
            );

            if (!notifications.length) return;

            const PUSH_CONCURRENCY = 10;
            for (let i = 0; i < notifications.length; i += PUSH_CONCURRENCY) {
                const chunk = notifications.slice(i, i + PUSH_CONCURRENCY);
                await Promise.allSettled(
                    chunk.map((notification) => this.processOne(notification)),
                );
            }
        } finally {
            this.processing = false;
        }
    }

    async processOne(notification) {
        const channels = this.resolveChannels(notification);

        if (!channels.length) {
            await NotificationRepository.finalizePendingDelivery(notification.id, "failed");
            console.warn(
                `[NotificationPushWorker] notification=${notification.id} failed (no device token)`,
            );
            return;
        }

        let delivered = false;
        let lastError = null;

        for (const channel of channels) {
            try {
                if (channel === "fcm") {
                    await this.sendViaFcm(notification);
                } else if (channel === "apns") {
                    await this.sendViaApns(notification);
                }
                delivered = true;
            } catch (error) {
                lastError = error;
            }
        }

        if (delivered) {
            await NotificationRepository.finalizePendingDelivery(notification.id, "sent");
            return;
        }

        await NotificationRepository.finalizePendingDelivery(notification.id, "failed");
        const reason = lastError?.message || "Unknown delivery error";
        console.warn(
            `[NotificationPushWorker] notification=${notification.id} failed (${reason})`,
        );
    }

    resolveChannels(notification) {
        const hasFcm =
            typeof notification.fcm_token === "string" && notification.fcm_token.trim();
        const hasApns =
            typeof notification.apns_token === "string" && notification.apns_token.trim();
        const deviceOs = String(notification.device_os || "").toLowerCase();

        const channels = [];
        if (deviceOs.includes("ios")) {
            if (hasApns) channels.push("apns");
            if (hasFcm) channels.push("fcm");
        } else {
            if (hasFcm) channels.push("fcm");
            if (hasApns) channels.push("apns");
        }

        return [...new Set(channels)];
    }

    buildMessage(notification) {
        const title = (notification.title_vi || "Thong bao").toString();
        const body = (notification.body_vi || "").toString();
        const data = normalizeCustomData(notification.data);

        return {
            title,
            body,
            data: {
                ...data,
                notification_id: String(notification.id),
                notification_type: String(notification.type || ""),
            },
        };
    }

    postJson(url, headers, payload) {
        return new Promise((resolve, reject) => {
            const request = https.request(
                url,
                {
                    method: "POST",
                    headers,
                },
                (response) => {
                    let raw = "";
                    response.setEncoding("utf8");
                    response.on("data", (chunk) => {
                        raw += chunk;
                    });
                    response.on("end", () => {
                        resolve({
                            statusCode: response.statusCode || 0,
                            body: raw,
                        });
                    });
                },
            );

            request.on("error", reject);
            request.write(JSON.stringify(payload));
            request.end();
        });
    }

    async sendViaFcm(notification) {
        const serverKey = process.env.FCM_SERVER_KEY;
        if (!serverKey || !String(serverKey).trim()) {
            throw new Error("FCM_SERVER_KEY is not configured");
        }

        const token = String(notification.fcm_token || "").trim();
        if (!token) {
            throw new Error("Missing FCM token");
        }

        const message = this.buildMessage(notification);
        const payload = {
            to: token,
            priority: "high",
            notification: {
                title: message.title,
                body: message.body,
            },
            data: Object.fromEntries(
                Object.entries(message.data).map(([key, value]) => [key, escapeApnsValue(value)]),
            ),
        };

        const result = await this.postJson(
            FCM_ENDPOINT,
            {
                Authorization: `key=${serverKey}`,
                "Content-Type": "application/json",
            },
            payload,
        );

        if (result.statusCode < 200 || result.statusCode >= 300) {
            throw new Error(`FCM HTTP ${result.statusCode}`);
        }

        const response = parseJsonSafe(result.body) || {};
        if (Number(response.success) > 0) {
            return;
        }

        const firstResult = Array.isArray(response.results)
            ? response.results[0] || null
            : null;
        const reason =
            firstResult?.error || response.error || "FCM delivery did not succeed";

        throw new Error(reason);
    }

    getApnsAuthToken() {
        const teamId = process.env.APNS_TEAM_ID;
        const keyId = process.env.APNS_KEY_ID;
        const privateKeyRaw = process.env.APNS_PRIVATE_KEY;

        if (!teamId || !keyId || !privateKeyRaw) {
            throw new Error("APNS credentials are incomplete");
        }

        const nowInSeconds = Math.floor(Date.now() / 1000);
        if (this.cachedApnsToken && nowInSeconds - this.cachedApnsIat < 50 * 60) {
            return this.cachedApnsToken;
        }

        const privateKey = String(privateKeyRaw).replace(/\\n/g, "\n");
        const header = {
            alg: "ES256",
            kid: keyId,
        };
        const payload = {
            iss: teamId,
            iat: nowInSeconds,
        };

        const encodedHeader = toBase64Url(JSON.stringify(header));
        const encodedPayload = toBase64Url(JSON.stringify(payload));
        const unsignedToken = `${encodedHeader}.${encodedPayload}`;

        const signer = crypto.createSign("sha256");
        signer.update(unsignedToken);
        signer.end();

        const signature = toBase64Url(signer.sign(privateKey));
        this.cachedApnsToken = `${unsignedToken}.${signature}`;
        this.cachedApnsIat = nowInSeconds;

        return this.cachedApnsToken;
    }

    async sendViaApns(notification) {
        const bundleId = process.env.APNS_BUNDLE_ID;
        if (!bundleId) {
            throw new Error("APNS_BUNDLE_ID is not configured");
        }

        const deviceToken = String(notification.apns_token || "").trim();
        if (!deviceToken) {
            throw new Error("Missing APNS token");
        }

        const host = isFeatureEnabled(process.env.APNS_USE_SANDBOX, false)
            ? "api.sandbox.push.apple.com"
            : "api.push.apple.com";

        const bearerToken = this.getApnsAuthToken();
        const message = this.buildMessage(notification);

        const apnsPayload = {
            aps: {
                alert: {
                    title: message.title,
                    body: message.body,
                },
                sound: "default",
            },
            ...Object.fromEntries(
                Object.entries(message.data).map(([key, value]) => [key, escapeApnsValue(value)]),
            ),
        };

        await new Promise((resolve, reject) => {
            const client = http2.connect(`https://${host}`);
            client.on("error", reject);

            const request = client.request({
                ":method": "POST",
                ":path": `/3/device/${deviceToken}`,
                authorization: `bearer ${bearerToken}`,
                "apns-topic": bundleId,
                "apns-push-type": "alert",
                "content-type": "application/json",
            });

            let responseBody = "";

            request.setEncoding("utf8");
            request.on("response", (headers) => {
                const status = Number(headers[":status"] || 0);

                request.on("data", (chunk) => {
                    responseBody += chunk;
                });

                request.on("end", () => {
                    client.close();

                    if (status >= 200 && status < 300) {
                        resolve();
                        return;
                    }

                    const parsed = parseJsonSafe(responseBody) || {};
                    const reason = parsed.reason || `APNS HTTP ${status}`;
                    reject(new Error(reason));
                });
            });

            request.on("error", (error) => {
                client.close();
                reject(error);
            });

            request.end(JSON.stringify(apnsPayload));
        });
    }
}

module.exports = new NotificationPushWorker();
