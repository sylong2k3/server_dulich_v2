const fs = require('fs/promises');
const path = require('path');
const { Pool } = require('pg');
const sharp = require('sharp');
require('dotenv').config({ quiet: true });

const database = process.env.MEDIA_DB_NAME || process.env.DB_NAME;
const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'images');
const attributionPath = path.join(uploadDir, 'wikimedia-festival-ocop-attribution.json');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: '-c search_path=public,auth,vn_units',
});

const festivalQueries = {
  'Festival Âm Nhạc & Du Thuyền Tràng An': ['Trang An Festival Ninh Binh', 'Trang An boat Ninh Binh'],
  'Lễ Hội Cố Đô Hoa Lư - Lịch Sử & Văn Hóa': ['Hoa Lu festival Ninh Binh', 'Hoa Lu Ninh Binh'],
  'Lễ Hội Đền Đinh - Tế Vua Đinh': ['King Dinh Temple Ninh Binh', 'Hoa Lu festival Ninh Binh'],
  'Lễ Hội Mùa Thu Hang Múa - Trekking & Nhiếp Ảnh': ['Hang Mua Ninh Binh', 'Mua Cave Ninh Binh'],
  'Lễ Hội Tái Hiện Lịch Sử Hoàng Gia': ['Hoa Lu Ancient Capital Ninh Binh', 'Vietnam royal reenactment'],
  'Lễ Hội Tết Trung Thu Tam Cốc': ['Tam Coc Ninh Binh', 'Mid Autumn Festival Vietnam'],
  'Lễ Hội Xuân Tràng An - Du Lịch Golf & Lữ Hành': ['Trang An Ninh Binh', 'Trang An festival'],
  'Lễ Phật Đản Bái Đính - Lễ Hội Tôn Giáo Lớn Nhất': ['Bai Dinh Pagoda Ninh Binh', 'Buddha Birthday Vietnam'],
};

const ocopQueries = {
  'Bánh Gai Ninh Bình': ['Bánh gai', 'Vietnamese sticky rice cake'],
  'Cơm Cháy Ninh Bình Thành Nhân': ['Cơm cháy Ninh Bình', 'Vietnamese crispy rice'],
  'Giỏ Cói Mỹ Nghệ Kim Sơn': ['Vietnam sedge basket craft', 'Vietnam handicraft basket'],
  'Mắm Tép Gia Viễn Bà Quý': ['Vietnamese shrimp paste', 'mắm tép'],
  'Mật Ong Rừng Nho Quan': ['honey jar', 'forest honey'],
  'Muối Hạt Kim Sơn': ['sea salt', 'coarse salt'],
  'Nem Chua Yên Mạc Ninh Bình': ['Nem chua Vietnam', 'Vietnamese fermented pork'],
  'Rượu Gạo Kim Sơn Truyền Thống': ['Vietnamese rice wine', 'rice wine bottle'],
  'Thịt Dê Núi Ninh Bình Khô Tẩm Gia Vị': ['goat meat Vietnam', 'dried meat'],
  'Tinh Dầu Tràm Ninh Bình': ['cajuput essential oil', 'essential oil bottle'],
  'Trà Hoa Sen Ninh Bình': ['lotus tea', 'Vietnam lotus tea'],
  'Tranh Thêu Tay Làng Nghề Văn Lâm': ['Vietnam embroidery', 'hand embroidery Vietnam'],
};

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
    if (response.status !== 429 && response.status < 500) return response;
    const retryAfter = Number(response.headers.get('retry-after'));
    const delayMs = Number.isFinite(retryAfter) && retryAfter > 0
      ? retryAfter * 1000
      : attempt * 8000;
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
    headers: { 'User-Agent': 'DuLichV2 festival ocop media importer (local development)' },
  });
  if (!response.ok) throw new Error(`Commons search failed: ${response.status} ${response.statusText}`);
  const data = await response.json();
  return Object.values(data.query?.pages || {})
    .map((page) => ({ page, imageinfo: page.imageinfo?.[0] }))
    .filter(({ imageinfo }) => imageinfo?.thumburl && /^image\/(jpeg|png|webp)$/.test(imageinfo.mime || ''));
}

async function downloadImage(prefix, key, imageinfo, title) {
  const ext = extensionFromMime(imageinfo.mime);
  const filename = `wiki-${prefix}-${slugify(key)}${ext}`;
  const localPath = path.join(uploadDir, filename);
  const publicUrl = `/uploads/images/${filename}`;
  const response = await fetchWithRetry(imageinfo.thumburl, {
    headers: { 'User-Agent': 'DuLichV2 festival ocop media importer (local development)' },
  });
  if (!response.ok) throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(localPath, buffer);
  const metadata = await sharp(buffer).metadata();
  return {
    filename,
    publicUrl,
    fileSizeKb: Math.round(buffer.length / 1024),
    resolution: metadata.width && metadata.height ? `${metadata.width}x${metadata.height}` : null,
    sourceUrl: imageinfo.descriptionurl,
    originalUrl: imageinfo.url,
    title,
    author: htmlToText(imageinfo.extmetadata?.Artist?.value),
    license: htmlToText(imageinfo.extmetadata?.LicenseShortName?.value),
  };
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

async function processRows(kind, rows, queryMap, updateSql) {
  const attribution = await readAttribution();
  const usedSources = new Set(attribution.map((entry) => entry.sourceUrl));

  for (const row of rows) {
    const name = row.name_vi;
    const queries = [
      ...(queryMap[name] || []),
      row.name_en,
      name,
    ].filter(Boolean);

    let selected = null;
    for (const query of queries) {
      await sleep(4500);
      const results = await commonsSearch(query);
      selected = results.find(({ imageinfo }) => !usedSources.has(imageinfo.descriptionurl)) || results[0];
      if (selected) break;
    }

    if (!selected) {
      console.warn(`SKIP ${kind} ${name}: no Wikimedia Commons image found`);
      continue;
    }

    const image = await downloadImage(kind, name, selected.imageinfo, selected.page.title.replace(/^File:/, ''));
    await pool.query(updateSql, [row.id, image.publicUrl]);
    usedSources.add(image.sourceUrl);
    attribution.push({
      kind,
      id: row.id,
      name,
      file: image.filename,
      publicUrl: image.publicUrl,
      sourceUrl: image.sourceUrl,
      originalUrl: image.originalUrl,
      title: image.title,
      author: image.author,
      license: image.license,
      fileSizeKb: image.fileSizeKb,
      resolution: image.resolution,
    });
    await writeAttribution(attribution);
    console.log(`OK ${kind} ${name} -> ${image.publicUrl}`);
    await sleep(2000);
  }
}

async function main() {
  await fs.mkdir(uploadDir, { recursive: true });
  console.log(`database=${database}`);

  const festivals = await pool.query(`
    SELECT id, name_vi, name_en, cover_image_url
    FROM festivals
    WHERE cover_image_url IS NULL
       OR cover_image_url = ''
       OR cover_image_url NOT LIKE '/uploads/images/wiki-festival-%'
    ORDER BY created_at DESC, name_vi
  `);
  const ocop = await pool.query(`
    SELECT id, name_vi, name_en, cover_image_url
    FROM ocop_products
    WHERE cover_image_url IS NULL
       OR cover_image_url = ''
       OR cover_image_url NOT LIKE '/uploads/images/wiki-ocop-%'
    ORDER BY created_at DESC, name_vi
  `);

  console.log(`festival_targets=${festivals.rowCount}`);
  await processRows(
    'festival',
    festivals.rows,
    festivalQueries,
    'UPDATE festivals SET cover_image_url = $2, updated_at = NOW() WHERE id = $1'
  );

  console.log(`ocop_targets=${ocop.rowCount}`);
  await processRows(
    'ocop',
    ocop.rows,
    ocopQueries,
    'UPDATE ocop_products SET cover_image_url = $2, media_urls = ARRAY[$2]::text[], updated_at = NOW() WHERE id = $1'
  );

  await pool.end();
}

main().catch(async (error) => {
  console.error(error);
  try {
    await pool.end();
  } catch {}
  process.exit(1);
});
