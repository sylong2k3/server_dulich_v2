class MapLayerApi {
    constructor(data = {}) {
        this.id = data.id;
        this.category_id = data.category_id;
        this.map_layer_id = data.map_layer_id;
        this.name = data.name;
        this.slug = data.slug;
        this.description = data.description;
        this.endpoint_url = data.endpoint_url;
        this.http_method = data.http_method;
        this.status = data.status;
        this.published_at = data.published_at;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        // Joined fields
        this.category_name = data.category_name;
        this.map_layer_name = data.map_layer_name;
    }

    toJSON() {
        return {
            id: this.id,
            category_id: this.category_id,
            map_layer_id: this.map_layer_id,
            name: this.name,
            slug: this.slug,
            description: this.description,
            endpoint_url: this.endpoint_url,
            http_method: this.http_method,
            status: this.status,
            published_at: this.published_at,
            created_at: this.created_at,
            updated_at: this.updated_at,
            category_name: this.category_name,
            map_layer_name: this.map_layer_name,
        };
    }
}

module.exports = MapLayerApi;
