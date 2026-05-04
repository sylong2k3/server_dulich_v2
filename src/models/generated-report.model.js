class GeneratedReport {
    constructor(data = {}) {
        this.id = data.id;
        this.schedule_id = data.schedule_id;
        this.created_by = data.created_by;
        this.report_type = data.report_type;
        this.period_from = data.period_from;
        this.period_to = data.period_to;
        this.title = data.title;
        this.file_url = data.file_url;
        this.file_format = data.file_format;
        this.file_size_kb = data.file_size_kb;
        this.sent_to_roles = data.sent_to_roles;
        this.generated_at = data.generated_at;
        // Joined fields
        this.created_by_name = data.created_by_name;
    }

    toJSON() {
        return {
            id: this.id,
            schedule_id: this.schedule_id,
            created_by: this.created_by,
            report_type: this.report_type,
            period_from: this.period_from,
            period_to: this.period_to,
            title: this.title,
            file_url: this.file_url,
            file_format: this.file_format,
            file_size_kb: this.file_size_kb,
            sent_to_roles: this.sent_to_roles,
            generated_at: this.generated_at,
            created_by_name: this.created_by_name,
        };
    }

    static prepareData(data = {}) {
        const prepared = {};
        if (data.schedule_id !== undefined) prepared.schedule_id = data.schedule_id;
        if (data.created_by !== undefined) prepared.created_by = data.created_by;
        if (data.report_type !== undefined) prepared.report_type = data.report_type;
        if (data.period_from !== undefined) prepared.period_from = data.period_from;
        if (data.period_to !== undefined) prepared.period_to = data.period_to;
        if (data.title !== undefined) prepared.title = data.title;
        if (data.file_url !== undefined) prepared.file_url = data.file_url;
        if (data.file_format !== undefined) prepared.file_format = data.file_format;
        if (data.file_size_kb !== undefined) prepared.file_size_kb = data.file_size_kb;
        if (data.sent_to_roles !== undefined) prepared.sent_to_roles = data.sent_to_roles;
        return prepared;
    }
}

module.exports = GeneratedReport;
