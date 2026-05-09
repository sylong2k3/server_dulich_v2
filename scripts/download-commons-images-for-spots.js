const fs = require('fs/promises');
const path = require('path');
const { Pool } = require('pg');
const sharp = require('sharp');
require('dotenv').config({ quiet: true });

const database = process.env.MEDIA_DB_NAME || process.env.DB_NAME;
const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'images');
const attributionPath = path.join(uploadDir, 'wikimedia-attribution.json');

const PLACEHOLDER_BASENAMES = [
  '1-kinh-nghiem-du-lich-trang-an-toan-canh.png',
  '60019412712924787195925383263826428877428588n-1771119968637112843541-1771147010761-1771147010923569991570.webp',
  '780_crop_chua-bai-đinh-4.jpg',
  'anhninhbinh_1.jpg',
  'chuabaidinh_2.jpg',
  'du-lich-ninh-binh-5.jpg',
  'du-lich-ninh-binh-ivivu-2.jpg',
  'nb2-9328-1712913023.webp',
  'ninhbinh3.jpg',
  'ninhbinh4.jpg',
  'ninhbinh_2.webp',
  'thungui.jpg',
  'trang-an-ninh-binh-2.webp',
  'z4309470334425c8a43945f8154389c67c623f83639b06-16829400684762053418537.jpg',
];

const PLACEHOLDER_URLS = PLACEHOLDER_BASENAMES.flatMap((name) => [
  `/uploads/${name}`,
  `/uploads/images/${name}`,
]);

const SEARCH_OVERRIDES = {
  'ben-thuyen-thung-nham-ninh-binh': ['Vườn Chim Thung Nham', 'Thung Nham Ninh Binh'],
  'ben-thuyen-van-long-ninh-binh': ['Van Long Nature Reserve', 'Van Long Ninh Binh'],
  'cong-vien-khung-long-ninh-binh': ['Ninh Binh Vietnam tourism'],
  'dong-galaxy-ninh-binh': ['Thien Ha Cave Ninh Binh', 'Ninh Binh cave'],
  'khu-du-lich-kenh-ga-van-trinh-ninh-binh': ['Kenh Ga Ninh Binh', 'Van Trinh cave Ninh Binh'],
  'khu-du-lich-tam-coc-bich-dong-ninh-binh': ['Tam Coc Bich Dong', 'Tam Coc Ninh Binh'],
  'lang-da-my-nghe-ninh-van-ninh-binh': ['Ninh Binh Vietnam limestone', 'Hoa Lu Ninh Binh village', 'Ninh Binh Vietnam tourism'],
  'lang-nghe-theu-ren-van-lam-ninh-binh': ['Van Lam embroidery village', 'Tam Coc Ninh Binh village'],
  'lang-viet-co-co-vien-lau-ninh-binh': ['Co Vien Lau Ninh Binh', 'Hoa Lu ancient village'],
  'nha-tho-dong-dac-ninh-binh': ['Phat Diem Cathedral', 'Ninh Binh church'],
};

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: '-c search_path=public,auth,vn_units',
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

function extensionFromMime(mime) {
  if (mime === 'image/png') return '.png';
  if (mime === 'image/webp') return '.webp';
  return '.jpg';
}

function htmlToText(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchWithRetry(url, options) {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await fetch(url, options);
    if (response.status !== 429 && response.status < 500) {
      return response;
    }

    const retryAfter = Number(response.headers.get('retry-after'));
    const delayMs = Number.isFinite(retryAfter) && retryAfter > 0
      ? retryAfter * 1000
      : attempt * 5000;
    await sleep(delayMs);
  }

  return fetch(url, options);
}

async function commonsSearch(query) {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrnamespace: '6',
    gsrlimit: '8',
    gsrsearch: query,
    prop: 'imageinfo',
    iiprop: 'url|mime|size|extmetadata',
    iiurlwidth: '1400',
    format: 'json',
    origin: '*',
  });

  const response = await fetchWithRetry(`https://commons.wikimedia.org/w/api.php?${params}`, {
    headers: {
      'User-Agent': 'DuLichV2 media importer (local development)',
    },
  });

  if (!response.ok) {
    throw new Error(`Commons search failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return Object.values(data.query?.pages || {})
    .map((page) => ({ page, imageinfo: page.imageinfo?.[0] }))
    .filter(({ imageinfo }) => imageinfo?.thumburl && /^image\/(jpeg|png|webp)$/.test(imageinfo.mime || ''));
}

async function getTargets(limit, slugs) {
  const slugFilter = slugs.length ? 'AND ts.slug = ANY($3)' : '';
  const { rows } = await pool.query(
    `
      SELECT
        ts.id AS spot_id,
        ts.slug,
        ts.name_vi,
        COALESCE(ts.name_en, ts.name_vi) AS search_name,
        sm.id AS media_id
      FROM tourism_spots ts
      LEFT JOIN LATERAL (
        SELECT id, url
        FROM spot_media
        WHERE spot_id = ts.id
        ORDER BY is_primary DESC, created_at ASC
        LIMIT 1
      ) sm ON TRUE
      WHERE (
        sm.id IS NULL
        OR sm.url = ANY($1)
        OR (
           sm.url LIKE '/uploads/images/%'
           AND sm.url NOT LIKE '/uploads/images/wiki-%'
        )
      )
      ${slugFilter}
      ORDER BY ts.created_at DESC, ts.slug
      LIMIT $2
    `,
    slugs.length ? [PLACEHOLDER_URLS, limit, slugs] : [PLACEHOLDER_URLS, limit]
  );

  return rows;
}

async function readAttribution() {
  try {
    return JSON.parse(await fs.readFile(attributionPath, 'utf8'));
  } catch {
    return [];
  }
}

async function writeAttribution(entries) {
  await fs.writeFile(attributionPath, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
}

async function downloadImage(target, imageinfo, title) {
  const ext = extensionFromMime(imageinfo.mime);
  const filename = `wiki-${target.slug}${ext}`;
  const localPath = path.join(uploadDir, filename);
  const publicUrl = `/uploads/images/${filename}`;

  const response = await fetchWithRetry(imageinfo.thumburl, {
    headers: {
      'User-Agent': 'DuLichV2 media importer (local development)',
    },
  });
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(localPath, buffer);

  const metadata = await sharp(buffer).metadata();
  const fileSizeKb = Math.round(buffer.length / 1024);

  return {
    filename,
    publicUrl,
    fileSizeKb,
    resolution: metadata.width && metadata.height ? `${metadata.width}x${metadata.height}` : null,
    sourceUrl: imageinfo.descriptionurl,
    originalUrl: imageinfo.url,
    title,
    author: htmlToText(imageinfo.extmetadata?.Artist?.value),
    license: htmlToText(imageinfo.extmetadata?.LicenseShortName?.value),
    attributionRequired: htmlToText(imageinfo.extmetadata?.AttributionRequired?.value),
  };
}

async function upsertMedia(target, image) {
  if (target.media_id) {
    await pool.query(
      `
        UPDATE spot_media
        SET
          media_type = 'image',
          url = $2,
          thumbnail_url = NULL,
          title_vi = COALESCE(title_vi, $3),
          title_en = $4,
          file_size_kb = $5,
          resolution = $6,
          is_primary = TRUE,
          sort_order = 0
        WHERE id = $1
      `,
      [
        target.media_id,
        image.publicUrl,
        target.name_vi,
        image.title,
        image.fileSizeKb,
        image.resolution,
      ]
    );
    return;
  }

  await pool.query(
    `
      INSERT INTO spot_media (
        spot_id,
        media_type,
        url,
        title_vi,
        title_en,
        file_size_kb,
        resolution,
        is_primary,
        sort_order
      )
      VALUES ($1, 'image', $2, $3, $4, $5, $6, TRUE, 0)
    `,
    [
      target.spot_id,
      image.publicUrl,
      target.name_vi,
      image.title,
      image.fileSizeKb,
      image.resolution,
    ]
  );
}

async function main() {
  const limit = Number(process.argv.find((arg) => arg.startsWith('--limit='))?.split('=')[1] || 200);
  const slugs = (process.argv.find((arg) => arg.startsWith('--slugs='))?.split('=')[1] || '')
    .split(',')
    .map((slug) => slug.trim())
    .filter(Boolean);
  await fs.mkdir(uploadDir, { recursive: true });

  const targets = await getTargets(limit, slugs);
  console.log(`database=${database}`);
  console.log(`targets=${targets.length}`);

  const attribution = await readAttribution();
  const usedSources = new Set(attribution.map((entry) => entry.sourceUrl));

  for (const target of targets) {
    const queries = [
      ...(SEARCH_OVERRIDES[target.slug] || []),
      `${target.search_name} Ninh Binh`,
      `${target.name_vi} Ninh Bình`,
      `Ninh Binh Vietnam tourism ${target.search_name}`,
    ];

    let selected = null;
    for (const query of queries) {
      await sleep(2500);
      const results = await commonsSearch(query);
      selected = results.find(({ imageinfo }) => !usedSources.has(imageinfo.descriptionurl)) || results[0];
      if (selected) break;
    }

    if (!selected) {
      console.warn(`SKIP ${target.slug}: no Wikimedia Commons image found`);
      continue;
    }

    const title = selected.page.title.replace(/^File:/, '');
    const image = await downloadImage(target, selected.imageinfo, title);
    await upsertMedia(target, image);
    await sleep(1500);
    usedSources.add(image.sourceUrl);
    attribution.push({
      spotSlug: target.slug,
      file: image.filename,
      publicUrl: image.publicUrl,
      sourceUrl: image.sourceUrl,
      originalUrl: image.originalUrl,
      title: image.title,
      author: image.author,
      license: image.license,
    });

    console.log(`OK ${target.slug} -> ${image.publicUrl}`);
  }

  await writeAttribution(attribution);
  await pool.end();
}

main().catch(async (error) => {
  console.error(error);
  try {
    await pool.end();
  } catch {}
  process.exit(1);
});
