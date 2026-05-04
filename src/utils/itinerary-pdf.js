const PdfPrinter = require('pdfmake');

const fonts = {
    Roboto: {
        normal: 'node_modules/pdfmake/build/vfs_fonts.js',
        bold: 'node_modules/pdfmake/build/vfs_fonts.js',
        italics: 'node_modules/pdfmake/build/vfs_fonts.js',
        bolditalics: 'node_modules/pdfmake/build/vfs_fonts.js',
    },
};

/**
 * Sinh Buffer PDF cho một lịch trình.
 * @param {object} itinerary - object lịch trình đầy đủ (có days & stops)
 * @returns {Promise<Buffer>}
 */
function buildItineraryPdf(itinerary) {
    return new Promise((resolve, reject) => {
        const printer = new PdfPrinter(fonts);

        const dayContent = (itinerary.days || []).flatMap((day) => {
            const stopRows = (day.stops || []).map((s, i) => [
                { text: String(i + 1), style: 'tableCell' },
                { text: s.spot_name || s.custom_name || '—', style: 'tableCell' },
                { text: s.planned_arrival || '—', style: 'tableCell' },
                { text: s.planned_duration_min ? `${s.planned_duration_min} phút` : '—', style: 'tableCell' },
                { text: s.notes || '', style: 'tableCell' },
            ]);

            const dayBlock = [
                {
                    text: `Ngày ${day.day_number}${day.title ? ': ' + day.title : ''}${day.date_actual ? '  (' + day.date_actual + ')' : ''}`,
                    style: 'dayHeader',
                    margin: [0, 12, 0, 4],
                },
            ];

            if (day.notes) {
                dayBlock.push({ text: day.notes, style: 'dayNote', margin: [0, 0, 0, 4] });
            }

            if (stopRows.length) {
                dayBlock.push({
                    table: {
                        headerRows: 1,
                        widths: ['auto', '*', 'auto', 'auto', '*'],
                        body: [
                            [
                                { text: '#', style: 'tableHeader' },
                                { text: 'Địa điểm', style: 'tableHeader' },
                                { text: 'Giờ đến', style: 'tableHeader' },
                                { text: 'Thời gian', style: 'tableHeader' },
                                { text: 'Ghi chú', style: 'tableHeader' },
                            ],
                            ...stopRows,
                        ],
                    },
                    layout: 'lightHorizontalLines',
                });
            } else {
                dayBlock.push({ text: 'Chưa có điểm dừng.', italics: true, color: '#888', margin: [0, 2, 0, 0] });
            }

            return dayBlock;
        });

        const docDefinition = {
            content: [
                { text: 'LỊCH TRÌNH DU LỊCH NINH BÌNH', style: 'mainTitle' },
                { text: itinerary.title, style: 'title' },
                {
                    columns: [
                        itinerary.start_date ? { text: `Ngày đi: ${itinerary.start_date}`, style: 'meta' } : {},
                        itinerary.end_date ? { text: `Ngày về: ${itinerary.end_date}`, style: 'meta' } : {},
                        itinerary.total_days ? { text: `Số ngày: ${itinerary.total_days}`, style: 'meta' } : {},
                    ],
                    margin: [0, 4, 0, 0],
                },
                itinerary.total_distance_km
                    ? { text: `Tổng quãng đường: ${itinerary.total_distance_km} km`, style: 'meta', margin: [0, 2, 0, 0] }
                    : {},
                itinerary.budget_vnd
                    ? { text: `Ngân sách: ${Number(itinerary.budget_vnd).toLocaleString('vi-VN')} VNĐ`, style: 'meta', margin: [0, 2, 0, 8] }
                    : { margin: [0, 0, 0, 8] },
                itinerary.description
                    ? { text: itinerary.description, style: 'description', margin: [0, 0, 0, 12] }
                    : {},
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#cccccc' }] },
                ...dayContent,
                {
                    text: `\nTạo bởi hệ thống Du lịch Ninh Bình • ${new Date().toLocaleDateString('vi-VN')}`,
                    style: 'footer',
                    margin: [0, 20, 0, 0],
                },
            ],
            styles: {
                mainTitle: { fontSize: 10, color: '#666', alignment: 'center', margin: [0, 0, 0, 4] },
                title: { fontSize: 18, bold: true, alignment: 'center', color: '#1a5276', margin: [0, 0, 0, 8] },
                meta: { fontSize: 10, color: '#555' },
                description: { fontSize: 11, italics: true, color: '#444' },
                dayHeader: { fontSize: 13, bold: true, color: '#1a5276' },
                dayNote: { fontSize: 10, italics: true, color: '#555' },
                tableHeader: { bold: true, fontSize: 10, fillColor: '#d6eaf8' },
                tableCell: { fontSize: 10 },
                footer: { fontSize: 9, color: '#999', alignment: 'center' },
            },
            defaultStyle: { font: 'Roboto', fontSize: 11 },
            pageMargins: [40, 40, 40, 40],
        };

        try {
            const pdfDoc = printer.createPdfKitDocument(docDefinition);
            const chunks = [];
            pdfDoc.on('data', (chunk) => chunks.push(chunk));
            pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
            pdfDoc.on('error', reject);
            pdfDoc.end();
        } catch (err) {
            reject(err);
        }
    });
}

module.exports = { buildItineraryPdf };
