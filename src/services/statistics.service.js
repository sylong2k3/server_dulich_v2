const StatisticsRepository = require('../models/repositories/statistics.repository');
const { Api404Error } = require('../core/error.response');

const REPORTS = [
    {
        name: 'system-overview.json',
        title: 'Tong quan he thong',
        format: 'json',
        contentType: 'application/json; charset=utf-8',
        load: () => StatisticsRepository.getOverview(),
    },
    {
        name: 'province-statistics.csv',
        title: 'Thong ke theo tinh',
        format: 'csv',
        contentType: 'text/csv; charset=utf-8',
        load: () => StatisticsRepository.getProvinceStats(),
    },
    {
        name: 'spots-by-category.csv',
        title: 'Diem du lich theo danh muc',
        format: 'csv',
        contentType: 'text/csv; charset=utf-8',
        load: () => StatisticsRepository.getSpotsByCategory(),
    },
    {
        name: 'businesses-by-type.csv',
        title: 'Doanh nghiep theo loai',
        format: 'csv',
        contentType: 'text/csv; charset=utf-8',
        load: () => StatisticsRepository.getBusinessesByType(),
    },
    {
        name: 'top-rated-spots.csv',
        title: 'Top diem du lich danh gia cao',
        format: 'csv',
        contentType: 'text/csv; charset=utf-8',
        load: () => StatisticsRepository.getTopRatedSpots(50),
    },
    {
        name: 'rating-trends.csv',
        title: 'Xu huong danh gia theo thang',
        format: 'csv',
        contentType: 'text/csv; charset=utf-8',
        load: () => StatisticsRepository.getRatingTrends({ months: 12 }),
    },
    {
        name: 'capacity-overview.json',
        title: 'Tong quan suc chua hien tai',
        format: 'json',
        contentType: 'application/json; charset=utf-8',
        load: () => StatisticsRepository.getCapacityOverview(),
    },
    {
        name: 'vlog-statistics.json',
        title: 'Thong ke bai viet cong dong',
        format: 'json',
        contentType: 'application/json; charset=utf-8',
        load: () => StatisticsRepository.getVlogStats(),
    },
];

const normalizeRows = (data) => (Array.isArray(data) ? data : [data || {}]);

const csvEscape = (value) => {
    if (value === null || value === undefined) return '';
    const text = value instanceof Date ? value.toISOString() : String(value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const toCsv = (data) => {
    const rows = normalizeRows(data);
    const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];

    if (columns.length === 0) {
        return '\uFEFF';
    }

    const lines = [
        columns.map(csvEscape).join(','),
        ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(',')),
    ];

    return `\uFEFF${lines.join('\n')}\n`;
};

const toJson = (data) => JSON.stringify(data, null, 2);

const getReport = (filename) => REPORTS.find((report) => report.name === filename);

const serializeReport = (report, data) => {
    if (report.format === 'csv') {
        return toCsv(data);
    }

    return toJson(data);
};

class StatisticsService {
    async listDataFiles() {
        const generatedAt = new Date();

        const files = await Promise.all(
            REPORTS.map(async (report) => {
                const data = await report.load();
                const content = serializeReport(report, data);
                const rows = Array.isArray(data) ? data.length : 1;

                return {
                    name: report.name,
                    title: report.title,
                    format: report.format,
                    rows,
                    size_bytes: Buffer.byteLength(content, 'utf8'),
                    last_modified: generatedAt,
                    generated_at: generatedAt,
                    download_url: `/api/v1/statistics/data-files/download/${encodeURIComponent(report.name)}`,
                };
            })
        );

        return {
            total: files.length,
            files,
        };
    }

    async getDataFile(filename) {
        const safe = String(filename || '').trim();
        const report = getReport(safe);

        if (!report) {
            throw new Api404Error(`Không tìm thấy file: ${safe}`);
        }

        const data = await report.load();
        const content = serializeReport(report, data);

        return {
            filename: report.name,
            contentType: report.contentType,
            content,
        };
    }
}

module.exports = new StatisticsService();
