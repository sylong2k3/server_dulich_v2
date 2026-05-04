class Permission {
    constructor(data = {}) {
        this.id = data.id;
        this.resource = data.resource;
        this.action = data.action;
        this.name_vi = data.name_vi;
        this.description = data.description;
        this.created_at = data.created_at;
    }

    toJSON() {
        return {
            id: this.id,
            resource: this.resource,
            action: this.action,
            name_vi: this.name_vi,
            description: this.description,
            created_at: this.created_at,
        };
    }

    static prepareData(data = {}) {
        const prepared = {};
        if (data.resource !== undefined) prepared.resource = data.resource?.trim() || null;
        if (data.action !== undefined) prepared.action = data.action?.trim() || null;
        if (data.name_vi !== undefined) prepared.name_vi = data.name_vi?.trim() || null;
        if (data.description !== undefined) prepared.description = data.description?.trim() || null;
        return prepared;
    }
}

module.exports = Permission;
