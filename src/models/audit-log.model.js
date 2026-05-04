class AuditLog {
    constructor(data = {}) {
        this.id = data.id;
        this.user_id = data.user_id;
        this.action = data.action;
        this.entity_type = data.entity_type;
        this.entity_id = data.entity_id;
        this.old_value = data.old_value;
        this.new_value = data.new_value;
        this.ip_address = data.ip_address;
        this.user_agent = data.user_agent;
        this.created_at = data.created_at;
        // Joined fields
        this.user_email = data.user_email;
        this.user_full_name = data.user_full_name;
    }

    static prepareData(data = {}) {
        const prepared = {};
        if (data.user_id !== undefined) prepared.user_id = data.user_id;
        if (data.action !== undefined) prepared.action = data.action;
        if (data.entity_type !== undefined) prepared.entity_type = data.entity_type;
        if (data.entity_id !== undefined) prepared.entity_id = data.entity_id;
        if (data.old_value !== undefined) prepared.old_value = data.old_value;
        if (data.new_value !== undefined) prepared.new_value = data.new_value;
        if (data.ip_address !== undefined) prepared.ip_address = data.ip_address;
        if (data.user_agent !== undefined) prepared.user_agent = data.user_agent;
        return prepared;
    }

    toJSON() {
        return {
            id: this.id,
            user_id: this.user_id,
            action: this.action,
            entity_type: this.entity_type,
            entity_id: this.entity_id,
            old_value: this.old_value,
            new_value: this.new_value,
            ip_address: this.ip_address,
            user_agent: this.user_agent,
            created_at: this.created_at,
            user: this.user_email ? {
                email: this.user_email,
                full_name: this.user_full_name,
            } : null,
        };
    }
}

module.exports = AuditLog;
