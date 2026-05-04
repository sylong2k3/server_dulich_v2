class ApiKey {
    constructor(data = {}) {
        this.id = data.id;
        this.name = data.name;
        this.key_hash = data.key_hash;
        this.issued_to_user_id = data.issued_to_user_id;
        this.status = data.status;
        this.effective_status = data.effective_status || data.status;
        this.expires_at = data.expires_at;
        this.revoked_at = data.revoked_at;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        this.api_count = data.api_count !== undefined ? Number(data.api_count) : undefined;
    }

    get is_expired() {
        if (!this.expires_at) return false;
        return new Date(this.expires_at).getTime() < Date.now();
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            issued_to_user_id: this.issued_to_user_id,
            status: this.status,
            effective_status: this.effective_status,
            expires_at: this.expires_at,
            revoked_at: this.revoked_at,
            created_at: this.created_at,
            updated_at: this.updated_at,
            api_count: this.api_count,
            is_expired: this.is_expired,
        };
    }
}

module.exports = ApiKey;
