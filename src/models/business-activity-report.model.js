class BusinessActivityReport {
    constructor(data = {}) {
        this.id = data.id;
        this.business_id = data.business_id;
        this.report_period = data.report_period;
        this.period_from = data.period_from;
        this.period_to = data.period_to;
        this.total_revenue_vnd = data.total_revenue_vnd;
        this.total_bookings = data.total_bookings;
        this.total_visitors = data.total_visitors;
        this.avg_capacity_pct = data.avg_capacity_pct;
        this.notes = data.notes;
        this.status = data.status;
        this.submitted_by = data.submitted_by;
        this.reviewed_by = data.reviewed_by;
        this.reviewed_at = data.reviewed_at;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        // Joined fields
        this.business_name = data.business_name;
    }

    toJSON() {
        return {
            id: this.id,
            business_id: this.business_id,
            report_period: this.report_period,
            period_from: this.period_from,
            period_to: this.period_to,
            total_revenue_vnd: this.total_revenue_vnd,
            total_bookings: this.total_bookings,
            total_visitors: this.total_visitors,
            avg_capacity_pct: this.avg_capacity_pct,
            notes: this.notes,
            status: this.status,
            submitted_by: this.submitted_by,
            reviewed_by: this.reviewed_by,
            reviewed_at: this.reviewed_at,
            created_at: this.created_at,
            updated_at: this.updated_at,
            business_name: this.business_name,
        };
    }

    static prepareData(data = {}) {
        const prepared = {};
        if (data.business_id !== undefined) prepared.business_id = data.business_id;
        if (data.report_period !== undefined) prepared.report_period = data.report_period;
        if (data.period_from !== undefined) prepared.period_from = data.period_from;
        if (data.period_to !== undefined) prepared.period_to = data.period_to;
        if (data.total_revenue_vnd !== undefined) prepared.total_revenue_vnd = data.total_revenue_vnd;
        if (data.total_bookings !== undefined) prepared.total_bookings = data.total_bookings;
        if (data.total_visitors !== undefined) prepared.total_visitors = data.total_visitors;
        if (data.avg_capacity_pct !== undefined) prepared.avg_capacity_pct = data.avg_capacity_pct;
        if (data.notes !== undefined) prepared.notes = data.notes;
        if (data.status !== undefined) prepared.status = data.status;
        if (data.submitted_by !== undefined) prepared.submitted_by = data.submitted_by;
        if (data.reviewed_by !== undefined) prepared.reviewed_by = data.reviewed_by;
        if (data.reviewed_at !== undefined) prepared.reviewed_at = data.reviewed_at;
        return prepared;
    }
}

module.exports = BusinessActivityReport;
