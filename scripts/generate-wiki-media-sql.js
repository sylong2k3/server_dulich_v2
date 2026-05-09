const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.join(__dirname, '..');
const attributionPath = path.join(root, 'public', 'uploads', 'images', 'wikimedia-attribution.json');
const outputPath = path.join(root, 'migrations', 'add_wikimedia_images_to_spot_media.sql');

function sqlString(value) {
  return `'${String(value || '').replace(/'/g, "''")}'`;
}

(async () => {
  const attribution = JSON.parse(fs.readFileSync(attributionPath, 'utf8'));
  const seen = new Set();
  const rows = [];

  for (const entry of attribution) {
    if (!entry.spotSlug || !entry.publicUrl || seen.has(entry.publicUrl)) continue;
    seen.add(entry.publicUrl);

    const filePath = path.join(root, 'public', 'uploads', 'images', entry.file);
    if (!fs.existsSync(filePath)) continue;

    const metadata = await sharp(filePath).metadata();
    const fileSizeKb = Math.round(fs.statSync(filePath).size / 1024);
    const resolution = metadata.width && metadata.height
      ? `${metadata.width}x${metadata.height}`
      : null;

    rows.push([
      sqlString(entry.spotSlug),
      sqlString(entry.publicUrl),
      sqlString(entry.title || entry.file),
      fileSizeKb,
      resolution ? sqlString(resolution) : 'NULL',
    ]);
  }

  const imageDir = path.join(root, 'public', 'uploads', 'images');
  for (const file of fs.readdirSync(imageDir).filter((name) => /^wiki-.+\.(jpe?g|png|webp)$/i.test(name))) {
    const publicUrl = `/uploads/images/${file}`;
    if (seen.has(publicUrl)) continue;
    seen.add(publicUrl);

    const filePath = path.join(imageDir, file);
    const metadata = await sharp(filePath).metadata();
    const fileSizeKb = Math.round(fs.statSync(filePath).size / 1024);
    const resolution = metadata.width && metadata.height
      ? `${metadata.width}x${metadata.height}`
      : null;
    const slug = file.replace(/^wiki-/, '').replace(/\.(jpe?g|png|webp)$/i, '');
    const title = file.replace(/^wiki-/, '');

    rows.push([
      sqlString(slug),
      sqlString(publicUrl),
      sqlString(title),
      fileSizeKb,
      resolution ? sqlString(resolution) : 'NULL',
    ]);
  }

  const values = rows
    .map((row) => `    (${row.join(', ')})`)
    .join(',\n');

  const sql = `BEGIN;

WITH media_seed(slug, url, title_en, file_size_kb, resolution) AS (
  VALUES
${values}
),
updated_media AS (
  UPDATE spot_media sm
  SET
    media_type = 'image',
    url = ms.url,
    title_en = ms.title_en,
    file_size_kb = ms.file_size_kb,
    resolution = ms.resolution,
    is_primary = TRUE,
    sort_order = 0
  FROM media_seed ms
  JOIN tourism_spots ts
    ON ts.slug = ms.slug
  WHERE sm.spot_id = ts.id
    AND (
      sm.url = ms.url
      OR (
        sm.is_primary = TRUE
        AND sm.media_type = 'image'
        AND sm.url LIKE '/uploads/images/%'
        AND sm.url NOT LIKE '/uploads/images/wiki-%'
      )
    )
  RETURNING sm.spot_id, sm.url
)
INSERT INTO spot_media (
  spot_id,
  media_type,
  url,
  title_en,
  file_size_kb,
  resolution,
  is_primary,
  sort_order
)
SELECT
  ts.id,
  'image',
  ms.url,
  ms.title_en,
  ms.file_size_kb,
  ms.resolution,
  TRUE,
  0
FROM media_seed ms
JOIN tourism_spots ts
  ON ts.slug = ms.slug
WHERE NOT EXISTS (
  SELECT 1
  FROM spot_media sm
  WHERE sm.spot_id = ts.id
    AND sm.url = ms.url
)
AND NOT EXISTS (
  SELECT 1
  FROM updated_media um
  WHERE um.spot_id = ts.id
    AND um.url = ms.url
);

COMMIT;
`;

  fs.writeFileSync(outputPath, sql, 'utf8');
  console.log(`Wrote ${rows.length} rows to ${outputPath}`);
})();
