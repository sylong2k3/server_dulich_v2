class MapLayerApiPermission {
    constructor(data = {}) {
        this.id = data.id;
        this.map_layer_api_id = data.map_layer_api_id;
        this.principal_type = data.principal_type;
        this.user_id = data.user_id;
        this.role_id = data.role_id;
        this.can_view = data.can_view;
        this.can_edit = data.can_edit;
        this.can_delete = data.can_delete;
        this.created_at = data.created_at;
        // Joined fields
        this.user_name = data.user_name;
        this.role_name = data.role_name;
    }

    toJSON() {
        return {
            id: this.id,
            map_layer_api_id: this.map_layer_api_id,
            principal_type: this.principal_type,
            user_id: this.user_id,
            role_id: this.role_id,
            can_view: this.can_view,
            can_edit: this.can_edit,
            can_delete: this.can_delete,
            created_at: this.created_at,
            user_name: this.user_name,
            role_name: this.role_name,
        };
    }
}

module.exports = MapLayerApiPermission;
