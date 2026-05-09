const { Pool } = require('pg');
require('dotenv').config({ quiet: true });

const ROOT_UPLOAD_URLS = [
  '/uploads/1-kinh-nghiem-du-lich-trang-an-toan-canh.png',
  '/uploads/60019412712924787195925383263826428877428588n-1771119968637112843541-1771147010761-1771147010923569991570.webp',
  '/uploads/780_crop_chua-bai-đinh-4.jpg',
  '/uploads/anhninhbinh_1.jpg',
  '/uploads/chuabaidinh_2.jpg',
  '/uploads/du-lich-ninh-binh-5.jpg',
  '/uploads/du-lich-ninh-binh-ivivu-2.jpg',
  '/uploads/nb2-9328-1712913023.webp',
  '/uploads/ninhbinh3.jpg',
  '/uploads/ninhbinh4.jpg',
  '/uploads/ninhbinh_2.webp',
  '/uploads/thungui.jpg',
  '/uploads/trang-an-ninh-binh-2.webp',
  '/uploads/z4309470334425c8a43945f8154389c67c623f83639b06-16829400684762053418537.jpg',
];

const database = process.env.MEDIA_DB_NAME || process.env.DB_NAME;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: '-c search_path=public,auth,vn_units',
});

(async () => {
  const { rows } = await pool.query(
    `
      SELECT
        ts.slug,
        COALESCE(ts.name_en, ts.name_vi) AS name,
        COUNT(sm.id)::int AS media_count,
        BOOL_OR(sm.url = ANY($1)) AS has_root_placeholder,
        BOOL_OR(sm.url LIKE '/uploads/images/wiki-%') AS has_wiki_image
      FROM tourism_spots ts
      LEFT JOIN spot_media sm ON sm.spot_id = ts.id
      GROUP BY ts.id, ts.slug, ts.name_vi, ts.name_en
      HAVING COUNT(sm.id) = 0
        OR BOOL_OR(sm.url = ANY($1))
        OR BOOL_OR(sm.url LIKE '/uploads/images/%' AND sm.url NOT LIKE '/uploads/images/wiki-%')
      ORDER BY has_wiki_image ASC, media_count ASC, ts.slug
    `,
    [ROOT_UPLOAD_URLS]
  );

  console.log(`database=${database}`);
  console.table(rows);
  await pool.end();
})().catch(async (error) => {
  console.error(error);
  try {
    await pool.end();
  } catch {}
  process.exit(1);
});
