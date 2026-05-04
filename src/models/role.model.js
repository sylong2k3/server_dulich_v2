class Role {
    constructor(data) {
        this.id = data.id;
        this.code = data.code;
        this.name_vi = data.name_vi;
        this.name_en = data.name_en;
        this.description = data.description;
        this.created_at = data.created_at;
    }

    toJSON() {
        return {
            id: this.id,
            code: this.code,
            name_vi: this.name_vi,
            name_en: this.name_en,
            description: this.description,
            created_at: this.created_at,
        };
    }

    static prepareData(data) {
        const prepared = {};
        if (data.code !== undefined) prepared.code = data.code?.trim() || null;
        if (data.name_vi !== undefined) prepared.name_vi = data.name_vi?.trim() || null;
        if (data.name_en !== undefined) prepared.name_en = data.name_en?.trim() || null;
        if (data.description !== undefined) prepared.description = data.description?.trim() || null;
        Object.keys(prepared).forEach((key) => prepared[key] === undefined && delete prepared[key]);
        return prepared;
    }
}

module.exports = Role;
