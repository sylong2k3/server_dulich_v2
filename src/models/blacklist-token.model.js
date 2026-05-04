class BlacklistToken {
    constructor(data) {
        this.id = data.id;
        this.token = data.token;
        this.user_id = data.user_id;
        this.token_type = data.token_type;
        this.revoked_at = data.revoked_at;
        this.expires_at = data.expires_at;
        this.reason = data.reason;
        this.created_at = data.created_at;
    }

    toJSON() {
        return {
            id: this.id,
            token: this.token,
            user_id: this.user_id,
            token_type: this.token_type,
            revoked_at: this.revoked_at,
            expires_at: this.expires_at,
            reason: this.reason,
            created_at: this.created_at
        };
    }

    static prepareData(data) {
        const prepared = {};
        if (data.token !== undefined) prepared.token = data.token;
        if (data.user_id !== undefined) prepared.user_id = data.user_id;
        if (data.token_type !== undefined) prepared.token_type = data.token_type;
        if (data.expires_at !== undefined) prepared.expires_at = data.expires_at;
        if (data.reason !== undefined) prepared.reason = data.reason;
        Object.keys(prepared).forEach((key) => prepared[key] === undefined && delete prepared[key]);
        return prepared;
    }
}

module.exports = BlacklistToken;
