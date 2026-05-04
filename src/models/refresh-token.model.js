class RefreshToken {
    constructor(data) {
        this.id = data.id;
        this.token = data.token;
        this.user_id = data.user_id;
        this.expires_at = data.expires_at;
        this.revoked_at = data.revoked_at;
        this.last_used = data.last_used;
        this.created_at = data.created_at;
    }

    toJSON() {
        return {
            id: this.id,
            token: this.token,
            user_id: this.user_id,
            expires_at: this.expires_at,
            revoked_at: this.revoked_at,
            last_used: this.last_used,
            created_at: this.created_at
        };
    }

    static prepareData(data) {
        const prepared = {};
        if (data.token !== undefined) prepared.token = data.token;
        if (data.user_id !== undefined) prepared.user_id = data.user_id;
        if (data.expires_at !== undefined) prepared.expires_at = data.expires_at;
        if (data.revoked_at !== undefined) prepared.revoked_at = data.revoked_at;
        if (data.last_used !== undefined) prepared.last_used = data.last_used;
        Object.keys(prepared).forEach((key) => prepared[key] === undefined && delete prepared[key]);
        return prepared;
    }
}

module.exports = RefreshToken;
