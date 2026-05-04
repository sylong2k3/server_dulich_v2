class MapCategory {
    constructor(data = {}) {
        this.id = data.id;
        this.code = data.code;
        this.name_vi = data.name_vi;
        this.name_en = data.name_en;
        this.description = data.description;
        this.sort_order = data.sort_order;
        this.is_active = data.is_active;
        this.created_at = data.created_at;
    }

    toJSON() {
        return {
            id: this.id,
            code: this.code,
            name_vi: this.name_vi,
            name_en: this.name_en,
            description: this.description,
            sort_order: this.sort_order,
            is_active: this.is_active,
            created_at: this.created_at,
        };
    }

    static prepareData(data = {}) {
        const prepared = {};
        if (data.code !== undefined) prepared.code = data.code?.trim() || null;
        if (data.name_vi !== undefined) prepared.name_vi = data.name_vi?.trim() || null;
        if (data.name_en !== undefined) prepared.name_en = data.name_en?.trim() || null;
        if (data.description !== undefined) prepared.description = data.description?.trim() || null;
        if (data.sort_order !== undefined) prepared.sort_order = data.sort_order;
        if (data.is_active !== undefined) prepared.is_active = data.is_active;
        return prepared;
    }
}

module.exports = MapCategory;
