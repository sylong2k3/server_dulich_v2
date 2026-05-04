const { query } = require('../configs/database');

class MapMeasureService {
    static async measureDistance(coordinates, unit = 'm') {
        const values = [];
        const pointsSql = coordinates.map(([lng, lat]) => {
            const lngIdx = values.push(lng);
            const latIdx = values.push(lat);
            return `ST_SetSRID(ST_MakePoint($${lngIdx}, $${latIdx}), 4326)`;
        });

        const sql = `
      SELECT ST_Length(
        ST_MakeLine(ARRAY[${pointsSql.join(', ')}])::geography
      ) AS distance_m
    `;

        const { rows } = await query(sql, values);
        const distanceM = Number(rows[0]?.distance_m ?? 0);

        return this._formatDistance(distanceM, unit);
    }
    static async measureArea(coordinates, unit = 'm2') {
        const ring = [...coordinates];
        const first = ring[0];
        const last = ring[ring.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
            ring.push(first);
        }

        const values = [];
        const pointsSql = ring.map(([lng, lat]) => {
            const lngIdx = values.push(lng);
            const latIdx = values.push(lat);
            return `ST_SetSRID(ST_MakePoint($${lngIdx}, $${latIdx}), 4326)`;
        });

        const sql = `
      SELECT ST_Area(
        ST_MakePolygon(ST_MakeLine(ARRAY[${pointsSql.join(', ')}]))::geography
      ) AS area_m2
    `;

        const { rows } = await query(sql, values);
        const areaM2 = Number(rows[0]?.area_m2 ?? 0);

        return this._formatArea(areaM2, unit);
    }

    static _formatDistance(distanceM, unit) {
        if (unit === 'km') {
            return { value: +(distanceM / 1000).toFixed(4), unit: 'km', value_m: +distanceM.toFixed(2) };
        }
        return { value: +distanceM.toFixed(2), unit: 'm', value_m: +distanceM.toFixed(2) };
    }

    static _formatArea(areaM2, unit) {
        if (unit === 'km2') {
            return { value: +(areaM2 / 1_000_000).toFixed(6), unit: 'km²', value_m2: +areaM2.toFixed(2) };
        }
        if (unit === 'ha') {
            return { value: +(areaM2 / 10_000).toFixed(4), unit: 'ha', value_m2: +areaM2.toFixed(2) };
        }
        return { value: +areaM2.toFixed(2), unit: 'm²', value_m2: +areaM2.toFixed(2) };
    }
}

module.exports = MapMeasureService;
