const fs = require('fs/promises');
const path = require('path');
const { Pool } = require('pg');
const sharp = require('sharp');
require('dotenv').config({ quiet: true });

const database = process.env.MEDIA_DB_NAME || process.env.DB_NAME;
const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'images');
const attributionPath = path.join(uploadDir, 'wikimedia-tour-attribution.json');

const SEARCH_OVERRIDES = {
  'tour-bai-dinh-den-trinh-den-thai-vi-1-ngay': ['Bai Dinh Pagoda Ninh Binh', 'Thai Vi Temple Ninh Binh'],
  'tour-bai-dinh-trang-an-hang-mua-2n1d': ['Trang An Ninh Binh', 'Bai Dinh Trang An Hang Mua'],
  'tour-hang-ba-hang-ca-hang-dai-2n1d': ['Trang An caves Ninh Binh', 'Ninh Binh cave'],
  'tour-hang-dong-nui-ngu-dong-1-ngay': ['Ninh Binh cave mountain', 'Ngu Dong Mountain Ninh Binh'],
  'tour-hoa-lu-den-vua-dinh-den-vua-le-nua-ngay': ['Hoa Lu Ninh Binh', 'King Dinh Temple Ninh Binh'],
  'tour-ninh-binh-classic-4n3d': ['Ninh Binh Vietnam tourism', 'Trang An Tam Coc Ninh Binh'],
  'tour-tam-coc-hang-mua-checkin-1-ngay': ['Tam Coc Ninh Binh', 'Hang Mua Ninh Binh'],
  'tour-tam-coc-hoa-lu-2n1d': ['Tam Coc Hoa Lu Ninh Binh', 'Tam Coc Ninh Binh'],
  'tour-trang-an-hang-sang-hang-toi-1-ngay': ['Trang An caves Ninh Binh', 'Trang An Ninh Binh'],
  'tour-trang-an-hanh-cung-vu-lam-nua-ngay': ['Trang An Ninh Binh', 'Vu Lam Ninh Binh'],
  'tour-di-san-trang-an-hoa-lu-tam-coc-3n2d': ['Trang An Hoa Lu Tam Coc', 'Ninh Binh heritage'],
  'tour-hang-dong-trang-an-1-ngay': ['Trang An caves Ninh Binh', 'Trang An Landscape Complex'],
  'tour-hoa-lu-bai-dinh-tam-linh-1-ngay': ['Bai Dinh Hoa Lu Ninh Binh', 'Bai Dinh Pagoda'],
  'tour-kham-pha-hang-dong-ninh-binh-2n1d': ['Ninh Binh cave', 'Trang An caves Ninh Binh'],
  'tour-tam-coc-den-thai-vi-hang-mua-1-ngay': ['Tam Coc Thai Vi Temple Hang Mua', 'Tam Coc Ninh Binh'],
  'tour-bai-dinh-tam-coc-den-thai-vi-2n1d': ['Bai Dinh Tam Coc Thai Vi', 'Tam Coc Ninh Binh'],
  'tour-trang-an-hang-mua-hoa-lu-1-ngay': ['Trang An Hang Mua Hoa Lu', 'Trang An Ninh Binh'],
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
    if (response.status !== 429 && response.status < 500) return response;
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
    gsrlimit: '10',
    gsrsearch: query,
    prop: 'imageinfo',
    iiprop: 'url|mime|size|extmetadata',
    iiurlwidth: '1400',
    format: 'json',
    origin: '*',
  });

  const response = await fetchWithRetry(`https://commons.wikimedia.org/w/api.php?${params}`, {
    headers: { 'User-Agent': 'DuLichV2 tour media importer (local development)' },
  });
  if (!response.ok) {
    throw new Error(`Commons search failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return Object.values(data.query?.pages || {})
    .map((page) => ({ page, imageinfo: page.imageinfo?.[0] }))
    .filter(({ imageinfo }) => imageinfo?.thumburl && /^image\/(jpeg|png|webp)$/.test(imageinfo.mime || ''));
}

async function getTargets(limit) {
  const { rows } = await pool.query(
    `
      SELECT id, slug, name_vi, COALESCE(name_en, name_vi) AS search_name, cover_image_url
      FROM tour_packages
      WHERE cover_image_url IS NULL
         OR cover_image_url = ''
         OR cover_image_url NOT LIKE '/uploads/images/wiki-tour-%'
      ORDER BY created_at DESC, slug
      LIMIT $1
    `,
    [limit]
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
  const filename = `wiki-tour-${target.slug || slugify(target.search_name)}${ext}`;
  const localPath = path.join(uploadDir, filename);
  const publicUrl = `/uploads/images/${filename}`;

  const response = await fetchWithRetry(imageinfo.thumburl, {
    headers: { 'User-Agent': 'DuLichV2 tour media importer (local development)' },
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
  };
}

async function main() {
  const limit = Number(process.argv.find((arg) => arg.startsWith('--limit='))?.split('=')[1] || 100);
  await fs.mkdir(uploadDir, { recursive: true });

  const targets = await getTargets(limit);
  console.log(`database=${database}`);
  console.log(`targets=${targets.length}`);

  const attribution = await readAttribution();
  const usedSources = new Set(attribution.map((entry) => entry.sourceUrl));

  for (const target of targets) {
    const queries = [
      ...(SEARCH_OVERRIDES[target.slug] || []),
      `${target.search_name} Ninh Binh tour`,
      `${target.name_vi} Ninh Bình tour`,
      'Ninh Binh Vietnam tourism',
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

    await pool.query(
      `
        UPDATE tour_packages
        SET cover_image_url = $2, updated_at = NOW()
        WHERE id = $1
      `,
      [target.id, image.publicUrl]
    );

    usedSources.add(image.sourceUrl);
    attribution.push({
      tourSlug: target.slug,
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

    console.log(`OK ${target.slug} -> ${image.publicUrl}`);
    await sleep(1500);
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
