class MapLayer {
    constructor(data = {}) {
        this.id = data.id;
        this.category_id = data.category_id;
        this.code = data.code;
        this.name_vi = data.name_vi;
        this.name_en = data.name_en;
        this.layer_type = data.layer_type;
        this.source_url = data.source_url;
        this.style_json = data.style_json;
        this.min_zoom = data.min_zoom;
        this.max_zoom = data.max_zoom;
        this.is_default_visible = data.is_default_visible;
        this.sort_order = data.sort_order;
        this.status = data.status;
        this.created_by = data.created_by;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        // Joined fields
        this.category_name = data.category_name;
    }

    toJSON() {
        return {
            id: this.id,
            category_id: this.category_id,
            code: this.code,
            name_vi: this.name_vi,
            name_en: this.name_en,
            layer_type: this.layer_type,
            source_url: this.source_url,
            style_json: this.style_json,
            min_zoom: this.min_zoom,
            max_zoom: this.max_zoom,
            is_default_visible: this.is_default_visible,
            sort_order: this.sort_order,
            status: this.status,
            created_by: this.created_by,
            created_at: this.created_at,
            updated_at: this.updated_at,
            category_name: this.category_name,
        };
    }
}

module.exports = MapLayer;
