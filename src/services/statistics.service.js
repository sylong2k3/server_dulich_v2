const StatisticsRepository = require('../models/repositories/statistics.repository');
const { Api400Error, Api404Error } = require('../core/error.response');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '../../public/uploads/data');

class StatisticsService {
    listDataFiles() {
        if (!fs.existsSync(DATA_DIR)) {
            return { total: 0, files: [] };
        }
        const files = fs.readdirSync(DATA_DIR).filter((f) => {
            const stat = fs.statSync(path.join(DATA_DIR, f));
            return stat.isFile();
        });
        return {
            total: files.length,
            files: files.map((name) => {
                const stat = fs.statSync(path.join(DATA_DIR, name));
                return {
                    name,
                    size_bytes: stat.size,
                    last_modified: stat.mtime,
                };
            }),
        };
    }

    getDataFilePath(filename) {
        // Ngăn path traversal
        const safe = path.basename(filename);
        const filePath = path.join(DATA_DIR, safe);
        if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
            throw new Api404Error(`Không tìm thấy file: ${safe}`);
        }
        return filePath;
    }
}

module.exports = new StatisticsService();
