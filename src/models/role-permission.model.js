class RolePermission {
    constructor(data = {}) {
        this.role_id = data.role_id;
        this.permission_id = data.permission_id;
        this.granted_by = data.granted_by;
        this.granted_at = data.granted_at;
        this.resource = data.resource;
        this.action = data.action;
        this.name_vi = data.name_vi;
        this.description = data.description;
    }

    toJSON() {
        return {
            role_id: this.role_id,
            permission_id: this.permission_id,
            granted_by: this.granted_by,
            granted_at: this.granted_at,
            resource: this.resource,
            action: this.action,
            name_vi: this.name_vi,
            description: this.description,
        };
    }
}

module.exports = RolePermission;
