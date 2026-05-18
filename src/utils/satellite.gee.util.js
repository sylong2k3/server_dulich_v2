'use strict';

/**
 * satellite.gee.util.js
 *
 * Pure Google Earth Engine helper functions.
 * No business logic. No HTTP. No DB.
 * All functions here operate on ee objects or plain JS primitives.
 *
 * Import path for SERVER 2: adjust `gge` config path to match SERVER 2 structure.
 */

const { ee } = require('../configs/gge');
const roiData = require('../data/khubaoton.json');

const { collectionMap, BAND_CONFIG, CFG, CHANGE_CFG } = require('../constants/satellite.constant');

// =============================================================================
//  CORE HELPERS
// =============================================================================

/**
 * Evaluate a GEE object and return a JS Promise.
 * @param {ee.ComputedObject} eeObj
 * @returns {Promise<any>}
 */
const eeEval = (eeObj) =>
  new Promise((resolve, reject) => {
    try {
      eeObj.evaluate((v, err) => {
        if (err) return reject(err);
        if (v === null || v === undefined)
          return reject(new Error('EE evaluate returned null/undefined'));
        resolve(v);
      });
    } catch (e) {
      reject(e);
    }
  });

/**
 * Convert any GeoJSON input (Geometry, Feature, FeatureCollection) to ee.Geometry.
 * Throws an error with code "EE_GEOMETRY_INVALID" on failure.
 * @param {Object} geometryInput
 * @returns {ee.Geometry}
 */
const toGeometry = (geometryInput) => {
  if (!geometryInput) {
    const err = new Error('Thieu geometry');
    err.code = 'EE_GEOMETRY_INVALID';
    throw err;
  }

  try {
    if (geometryInput?.type === 'FeatureCollection') {
      if (!Array.isArray(geometryInput.features) || geometryInput.features.length === 0) {
        throw new Error('FeatureCollection khong co features');
      }

      // Keep all features, then dissolve to one ROI geometry.
      return ee.FeatureCollection(geometryInput).geometry().dissolve();
    }

    if (geometryInput?.type === 'Feature') {
      return ee.Feature(geometryInput).geometry();
    }

    return ee.Geometry(geometryInput);
  } catch (error) {
    const message = error.message || 'Invalid geometry';
    const geoError = new Error(`Geometry khong hop le: ${message}`);
    geoError.code = 'EE_GEOMETRY_INVALID';
    throw geoError;
  }
};

/**
 * Count images in an ee.ImageCollection.
 * @param {ee.ImageCollection} collection
 * @returns {Promise<number>}
 */
const countImages = async (collection) => {
  try {
    return await eeEval(collection.size());
  } catch {
    return 0;
  }
};

// =============================================================================
//  CLOUD MASKING
// =============================================================================

/**
 * 4-layer cloud mask for Sentinel-2 SR (with joined Cloud Probability).
 * Uses closure over global CFG.
 * @param {ee.Image} img - Sentinel-2 SR image (must have "cloud_prob" join property)
 * @param {number} [cloudProbThresh]
 * @returns {ee.Image}
 */
const maskS2Clouds = (img, cloudProbThresh = CFG.cloudProbThresh) => {
  const sr = img.divide(10000);
  const crs = img.select('B2').projection().crs();

  let cloudProbImg = ee.Image(img.get('cloud_prob'));
  cloudProbImg = ee.Image(
    ee.Algorithms.If(
      cloudProbImg,
      cloudProbImg.select('probability'),
      ee.Image(0).rename('probability')
    )
  );
  let clouds = cloudProbImg.gt(cloudProbThresh);

  const qa = img.select('QA60');
  let qaCloud = qa
    .bitwiseAnd(1 << 10)
    .neq(0)
    .or(qa.bitwiseAnd(1 << 11).neq(0));

  if (CFG.qa60DilatePx > 0) {
    qaCloud = qaCloud.focal_max(CFG.qa60DilatePx).reproject({ crs: crs, scale: 60 });
  }

  const scl = img.select('SCL');
  const sclBad = scl.eq(8).or(scl.eq(9)).or(scl.eq(10)).or(scl.eq(11));

  const darkPixels = sr.select('B8').lt(CFG.nirDarkThresh).and(clouds.not());
  const az = ee.Number(img.get('MEAN_SOLAR_AZIMUTH_ANGLE'));
  const shadowAz = ee.Number(90).subtract(az);
  const shadowDistPx = ee.Number(CFG.shadowDistM).divide(60).min(256);

  const cloudProj = clouds
    .directionalDistanceTransform(shadowAz, shadowDistPx)
    .reproject({ crs: crs, scale: 60 })
    .select('distance')
    .mask();

  const shadows = cloudProj.and(darkPixels);
  const bad = clouds.or(qaCloud).or(sclBad).or(shadows);

  return sr
    .updateMask(bad.not())
    .select(['B2', 'B3', 'B4', 'B8', 'B11', 'B12'])
    .copyProperties(img, ['system:time_start']);
};

/**
 * Cloud mask for Landsat 8/9 Collection 2 Level-2 using QA_PIXEL.
 * Renames bands to match S2 naming convention: [B2, B3, B4, B8, B11, B12].
 * @param {ee.Image} img
 * @returns {ee.Image}
 */
const maskLandsatClouds = (img) => {
  const crs = img.select('SR_B2').projection().crs();
  const qa = img.select('QA_PIXEL');

  const sr = img
    .select(['SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'SR_B7'])
    .multiply(0.0000275)
    .add(-0.2);

  const cloudBit = 1 << 3;
  const dilatedCloudBit = 1 << 1;
  let clouds = qa.bitwiseAnd(cloudBit).neq(0).or(qa.bitwiseAnd(dilatedCloudBit).neq(0));

  if (CFG.cloudDilatePx > 0) {
    clouds = clouds.focal_max(CFG.cloudDilatePx).reproject({ crs: crs, scale: 60 });
  }

  const darkPixels = sr.select('SR_B5').lt(CFG.nirDarkThresh).and(clouds.not());
  const az = ee.Number(img.get('SUN_AZIMUTH'));
  const shadowAz = ee.Number(90).subtract(az);
  const shadowDistPx = ee.Number(CFG.shadowDistM).divide(60).min(256);

  const cloudProj = clouds
    .directionalDistanceTransform(shadowAz, shadowDistPx)
    .reproject({ crs: crs, scale: 60 })
    .select('distance')
    .mask();

  const shadows = cloudProj.and(darkPixels);
  const bad = clouds.or(shadows);

  return sr.updateMask(bad.not()).copyProperties(img, ['system:time_start']);
};

// =============================================================================
//  SPECTRAL INDICES
// =============================================================================

/**
 * Add spectral indices (NDVI, MNDWI, SAVI, NDBI, MBI) to an image.
 * @param {ee.Image} image
 * @param {Object} [options]
 * @param {Object} [bandConfig]
 * @returns {ee.Image}
 */
const addSpectralIndices = (image, options = {}, bandConfig = BAND_CONFIG.S2) => {
  const {
    ndvi = true,
    mndwi = true,
    savi = true,
    ndbi = true,
    mbi = true,
    ndviTexture = false,
  } = options;
  const { nir, red, green, swir1, swir2 } = bandConfig;

  let result = image;

  if (ndvi || ndviTexture) {
    const ndviImg = image.normalizedDifference([nir, red]).rename('NDVI');
    result = result.addBands(ndviImg);

    if (ndviTexture) {
      const ndviScaled = ndviImg.add(1).multiply(127.5).toByte();
      const glcm = ndviScaled
        .glcmTexture({ size: 3 })
        .select(['NDVI_contrast', 'NDVI_ent', 'NDVI_corr']);
      result = result.addBands(glcm);
    }
  }

  if (savi) {
    const saviImg = image
      .expression('1.5 * (NIR - RED) / (NIR + RED + 0.5)', {
        NIR: image.select(nir),
        RED: image.select(red),
      })
      .rename('SAVI');
    result = result.addBands(saviImg);
  }

  if (mndwi) {
    const mndwiImg = image.normalizedDifference([green, swir1]).rename('MNDWI');
    result = result.addBands(mndwiImg);
  }

  if (ndbi) {
    const ndbiImg = image.normalizedDifference([swir1, nir]).rename('NDBI');
    result = result.addBands(ndbiImg);
  }

  if (mbi) {
    const mbiImg = image
      .expression('((SWIR1 - SWIR2 - NIR) / (SWIR1 + SWIR2 + NIR)) + 0.5', {
        SWIR1: image.select(swir1),
        SWIR2: image.select(swir2),
        NIR: image.select(nir),
      })
      .rename('MBI');
    result = result.addBands(mbiImg);
  }

  return result;
};

// =============================================================================
//  LAND COVER CLASSIFICATION
// =============================================================================

/**
 * Multi-tier land cover classification using decision-tree rules.
 * Returns an image with band "class" (byte, values 0–6).
 * @param {ee.Image} composite
 * @param {Object} [bandConfig]
 * @returns {ee.Image}
 */
const classifyLandCover = (composite, bandConfig = BAND_CONFIG.S2) => {
  const ndvi = composite.select('NDVI');
  const mndwi = composite.select('MNDWI');
  const ndbi = composite.select('NDBI');
  const mbi = composite.select('MBI');
  const nir = composite.select(bandConfig.nir);
  const swir1 = composite.select(bandConfig.swir1);

  const water = mndwi.gt(0.1);

  const concreteHard = ndbi.gt(0.06).and(ndvi.lt(0.2)).and(swir1.gt(0.2));
  const concreteMixed = ndbi.gt(0.04).and(ndvi.gte(0.15)).and(ndvi.lt(0.3)).and(mbi.lt(0.22));
  const solarPanel = nir.lt(0.18).and(swir1.gt(0.08)).and(ndvi.lt(0.1));
  const concreteAll = concreteHard.or(concreteMixed).or(solarPanel);

  const residential = ndbi
    .gt(-0.05)
    .and(ndbi.lte(0.06))
    .and(mbi.lt(0.25))
    .and(ndvi.gte(0.05))
    .and(ndvi.lt(0.4))
    .and(mndwi.lt(0.08));

  const barren = ndvi.lt(0.25).and(mndwi.lt(0.1)).and(swir1.lte(0.2));
  const barrenMoist = ndvi.lt(0.2).and(mndwi.gte(0.05)).and(mndwi.lt(0.18)).and(mbi.lt(0.3));
  const lowVeg = ndvi.gte(0.2).and(ndvi.lt(0.6)).and(mbi.lt(0.27));
  const forest = ndvi.gte(0.6);

  let classified = ee
    .Image(2)
    .where(concreteAll, 3)
    .where(barrenMoist, 2)
    .where(barren, 2)
    .where(residential, 4)
    .where(lowVeg, 5)
    .where(forest, 6)
    .where(water, 1);

  const dataMask = composite.select(bandConfig.blue).mask();
  return classified
    .where(dataMask.not(), 0)
    .updateMask(composite.select(bandConfig.blue).unmask().gt(-1).clip(composite.geometry()))
    .rename('class')
    .byte();
};

// =============================================================================
//  COMPOSITE BUILDER
// =============================================================================

/**
 * Build a cloud-free median composite from one or more satellite collections.
 * @param {Object} params
 * @param {string|string[]} params.collection
 * @param {string} params.startDate
 * @param {string} params.endDate
 * @param {number} [params.cloudCover]
 * @param {Object} params.geometry - GeoJSON or ee.Geometry
 * @param {Object} [params.spectralOptions]
 * @param {boolean} [params.returnCollection]
 * @param {boolean} [params.skipTileGeneration]
 * @param {Object} [params.visualizationParameters]
 * @returns {Promise<{composite: ee.Image, sensorType: string, tile: Object}>}
 */
const buildComposite = async (params) => {
  const {
    collection,
    startDate,
    endDate,
    cloudCover = 30,
    geometry,
    spectralOptions = {},
    returnCollection = false,
    skipTileGeneration = false,
    visualizationParameters,
  } = params;

  const roi = geometry instanceof Object && geometry.evaluate ? geometry : toGeometry(geometry);
  const collections = Array.isArray(collection) ? collection : [collection];

  const imageCollections = [];

  collections.forEach((collName) => {
    const datasetId = collectionMap[collName];
    if (!datasetId) throw new Error(`Unknown collection: ${collName}`);

    let imgCol = ee.ImageCollection(datasetId).filterBounds(roi).filterDate(startDate, endDate);

    if (collName === 'S2') {
      const s2CloudProb = ee
        .ImageCollection(collectionMap.S2_CLOUD_PROB)
        .filterBounds(roi)
        .filterDate(startDate, endDate);

      imgCol = ee.ImageCollection(
        ee.Join.saveFirst('cloud_prob').apply({
          primary: imgCol,
          secondary: s2CloudProb,
          condition: ee.Filter.equals({
            leftField: 'system:index',
            rightField: 'system:index',
          }),
        })
      );

      imgCol = imgCol.map((img) => maskS2Clouds(img, cloudCover));
    } else if (collName === 'L8' || collName === 'L9') {
      imgCol = imgCol.map(maskLandsatClouds);
    }

    imageCollections.push(imgCol);
  });

  const sensorType = collections.every((c) => c === 'S2') ? 'S2' : 'LANDSAT';
  const bandConfig = BAND_CONFIG[sensorType];

  let mergedCollection = imageCollections[0];
  for (let i = 1; i < imageCollections.length; i++) {
    mergedCollection = mergedCollection.merge(imageCollections[i]);
  }

  const collectionSize = await countImages(mergedCollection);
  if (collectionSize === 0) {
    const err = new Error(
      `Không tìm thấy ảnh vệ tinh nào trong khoảng thời gian ${startDate} – ${endDate} ` +
        `với ngưỡng mây ${cloudCover}%. Hãy mở rộng khoảng thời gian hoặc tăng ngưỡng mây.`
    );
    err.code = 'EE_EMPTY_COLLECTION';
    throw err;
  }

  let composite = mergedCollection.median().clip(roi);
  composite = addSpectralIndices(composite, spectralOptions, bandConfig);

  let mapInfo = null;
  if (!skipTileGeneration && visualizationParameters) {
    const vis = composite.visualize(visualizationParameters);
    mapInfo = await new Promise((resolve, reject) => {
      vis.getMap({ name: 'satelliteImage' }, (m, err) => {
        if (err) return reject(err);
        if (!m || !m.urlFormat) return reject(new Error('Không có tile url'));
        resolve(m);
      });
    });
  }

  const result = {
    composite,
    sensorType,
    bandConfig,
    tile: {
      mapId: mapInfo?.mapid || null,
      token: mapInfo?.token || null,
      tileUrl: mapInfo?.urlFormat || null,
    },
  };

  if (returnCollection) {
    result.tile.totalImages = collectionSize;
  }

  return result;
};

// =============================================================================
//  FOREST CHANGE DETECTION
// =============================================================================

/**
 * Detect forest + road/build change using S2 (optical) + S1 (SAR).
 * Change codes: 0=no change, 1=forest loss, 2=forest gain, 3=road/build, 4=loss+road
 * @param {Object} params
 * @returns {Promise<{change: ee.Image, debug: Object}>}
 */
const computeForestChange = async (params) => {
  const { geometry, startDate1, endDate1, startDate2, endDate2, cloudCover = 30 } = params;

  const roi = toGeometry(geometry);

  const s2_1 = await buildComposite({
    collection: 'S2',
    startDate: startDate1,
    endDate: endDate1,
    cloudCover,
    geometry: roi,
    spectralOptions: { ndvi: true, mndwi: false, ndbi: false, mbi: false },
    returnCollection: true,
  });

  const s2_2 = await buildComposite({
    collection: 'S2',
    startDate: startDate2,
    endDate: endDate2,
    cloudCover,
    geometry: roi,
    spectralOptions: { ndvi: true, mndwi: false, ndbi: false, mbi: false },
    returnCollection: true,
  });

  const ndvi1 = s2_1.composite.select('NDVI');
  const ndvi2 = s2_2.composite.select('NDVI');

  const nbr1 = s2_1.composite
    .normalizedDifference([BAND_CONFIG.S2.nir, BAND_CONFIG.S2.swir2])
    .rename('NBR');
  const nbr2 = s2_2.composite
    .normalizedDifference([BAND_CONFIG.S2.nir, BAND_CONFIG.S2.swir2])
    .rename('NBR');

  const dNDVI = ndvi2.subtract(ndvi1).rename('dNDVI');
  const dNBR = nbr2.subtract(nbr1).rename('dNBR');

  const forestLoss = dNBR.lt(CHANGE_CFG.dNBR_loss).and(dNDVI.lt(CHANGE_CFG.dNDVI_loss));
  const forestGain = dNBR.gt(CHANGE_CFG.dNBR_gain).and(dNDVI.gt(CHANGE_CFG.dNDVI_gain));

  const s1Col = ee
    .ImageCollection('COPERNICUS/S1_GRD')
    .filterBounds(roi)
    .filter(ee.Filter.eq('instrumentMode', 'IW'))
    .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
    .filter(ee.Filter.eq('orbitProperties_pass', CHANGE_CFG.s1Pass))
    .filter(ee.Filter.eq('resolution_meters', 10));

  const s1_1 = s1Col.filterDate(startDate1, endDate1).median().clip(roi);
  const s1_2 = s1Col.filterDate(startDate2, endDate2).median().clip(roi);

  const dVV = s1_2.select('VV').subtract(s1_1.select('VV')).rename('dVV');
  const roadBuild = dVV.abs().gt(CHANGE_CFG.dVV_abs);

  let change = ee.Image(0);
  change = change.where(forestLoss, 1);
  change = change.where(forestGain, 2);
  change = change.where(roadBuild, 3);
  change = change.where(forestLoss.and(roadBuild), 4);

  return {
    change: change.rename('change'),
    debug: {
      dNDVI,
      dNBR,
      dVV,
      forestLoss: forestLoss.rename('forestLoss'),
      forestGain: forestGain.rename('forestGain'),
      roadBuild: roadBuild.rename('roadBuild'),
      meta: {
        s2Images: {
          period1: s2_1.tile?.totalImages,
          period2: s2_2.tile?.totalImages,
        },
      },
    },
  };
};

// =============================================================================
//  DOWNLOAD URL
// =============================================================================

/**
 * Generate a GeoTIFF download URL for an ee.Image.
 * Never rejects; resolves null on failure.
 * @param {ee.Image} image - Raw image (not yet visualized)
 * @param {string} filename
 * @param {Object|null} [visualizationParams]
 * @param {number} [scale]
 * @param {Object} [roi]
 * @returns {Promise<string|null>}
 */
const getDownloadUrl = (image, filename, visualizationParams = null, scale = 200, roi = roiData) =>
  new Promise((resolve) => {
    const eeRoi = toGeometry(roi);
    let downloadImage = image.clip(eeRoi);
    if (visualizationParams) {
      downloadImage = downloadImage.visualize(visualizationParams);
    }

    const geoJsonRoi =
      roi && typeof roi === 'object' && roi.type
        ? roi.type === 'FeatureCollection'
          ? roi.features[0].geometry
          : roi.type === 'Feature'
            ? roi.geometry
            : roi
        : roiData.type === 'FeatureCollection'
          ? roiData.features[0].geometry
          : roiData;

    const downloadParams = {
      name: filename,
      region: geoJsonRoi,
      format: 'GEO_TIFF',
      filePerBand: false,
      scale,
    };

    try {
      downloadImage.getDownloadURL(downloadParams, (url, err) => {
        if (err) {
          console.error(`[getDownloadUrl] FAILED "${filename}":`, err);
          resolve(null);
          return;
        }
        resolve(url || null);
      });
    } catch (error) {
      console.error(`[getDownloadUrl] EXCEPTION "${filename}":`, error.message);
      resolve(null);
    }
  });

module.exports = {
  ee,
  eeEval,
  toGeometry,
  countImages,
  maskS2Clouds,
  maskLandsatClouds,
  addSpectralIndices,
  classifyLandCover,
  buildComposite,
  computeForestChange,
  getDownloadUrl,
};

