"use strict";

/**
 * satellite.repository.js
 *
 * Data access layer for the satellite module.
 * Has one concern:
 *   1. GEE computation calls (equivalent to data reads for satellite data)
 *
 * No business logic. No response formatting beyond row normalization.
 */

const {
  buildComposite,
  computeForestChange,
  classifyLandCover,
  getDownloadUrl,
  toGeometry,
  eeEval,
  ee,
} = require("../utils/satellite.gee.util");

const {
  BAND_CONFIG,
  LAND_COVER_CLASSES,
  CHANGE_CLASSES,
  CHANGE_VIS_PALETTE,
  NDVI_PALETTE,
  HEATMAP_PALETTE,
  collectionMap,
} = require("../constants/satellite.constant");

// =============================================================================
//  GEE COMPUTATION METHODS
// =============================================================================

class SatelliteRepository {
  /**
   * Compute RGB composite and generate map tile.
   */
  static async computeRgbComposite({ geometry, startDate, endDate, collection, cloudCover }) {
    const roi = toGeometry(geometry);
    const bandConfig = BAND_CONFIG[collection === "S2" ? "S2" : "LANDSAT"];
    const rgbViz = { bands: bandConfig.rgbBands, min: 0, max: 0.3, gamma: 1.4 };

    const result = await buildComposite({
      collection,
      startDate,
      endDate,
      cloudCover,
      geometry: roi,
      spectralOptions: { ndvi: false, mndwi: false, ndbi: false, mbi: false },
      visualizationParameters: rgbViz,
      returnCollection: true,
    });

    const downloadUrl = await getDownloadUrl(
      result.composite,
      "satellite_rgb",
      rgbViz,
    );

    return {
      mapId: result.tile.mapId,
      tileUrl: result.tile.tileUrl,
      downloadUrl,
      totalImages: result.tile.totalImages,
      visualizationParams: rgbViz,
      _composite: result.composite,
    };
  }

  /**
   * Compute NDVI image, tile, and vegetation area stats.
   */
  static async computeNdviImage({ geometry, startDate, endDate, collection, cloudCover, ndviMinThresh }) {
    const roi = toGeometry(geometry);

    const composite = await buildComposite({
      collection,
      startDate,
      endDate,
      cloudCover,
      geometry: roi,
      spectralOptions: { ndvi: true, mndwi: false, ndbi: false, mbi: false },
      returnCollection: true,
    });

    const ndviImage = composite.composite.select("NDVI");
    const ndviVis = ndviImage.visualize({
      min: -0.2,
      max: 0.85,
      palette: NDVI_PALETTE,
    });

    const mapInfo = await new Promise((resolve, reject) => {
      ndviVis.getMap({ name: "ndviImage" }, (m, err) => {
        if (err) return reject(err);
        resolve(m);
      });
    });

    const ndviBands = ee.Image.cat([
      ndviImage.gt(ndviMinThresh).selfMask().multiply(ee.Image.pixelArea()).rename("veg"),
      ndviImage.lt(0).selfMask().multiply(ee.Image.pixelArea()).rename("lt0"),
      ndviImage.gte(0).and(ndviImage.lt(0.2)).selfMask().multiply(ee.Image.pixelArea()).rename("r0_02"),
      ndviImage.gte(0.2).and(ndviImage.lt(0.4)).selfMask().multiply(ee.Image.pixelArea()).rename("r02_04"),
      ndviImage.gte(0.4).selfMask().multiply(ee.Image.pixelArea()).rename("gt04"),
    ]);

    const ndviStats = await eeEval(
      ndviBands.reduceRegion({
        reducer: ee.Reducer.sum(),
        geometry: roi,
        scale: 100,
        maxPixels: 1e10,
        bestEffort: true,
        tileScale: 4,
      }),
    );

    const downloadUrl = await getDownloadUrl(ndviImage, "satellite_ndvi", {
      min: -0.2,
      max: 0.85,
      palette: NDVI_PALETTE,
    });

    return {
      mapId: mapInfo.mapid,
      tileUrl: mapInfo.urlFormat,
      downloadUrl,
      totalImages: composite.tile.totalImages,
      ndviStats,
      ndviMinThresh,
    };
  }

  /**
   * Compute LST heatmap using Landsat 8/9 (ignores collection param).
   */
  static async computeHeatmap({ geometry, startDate, endDate, cloudCover }) {
    const roi = toGeometry(geometry);

    function maskLandsatL2(img) {
      const qa = img.select("QA_PIXEL");
      const mask = qa
        .bitwiseAnd(1 << 3).eq(0)
        .and(qa.bitwiseAnd(1 << 4).eq(0))
        .and(qa.bitwiseAnd(1 << 2).eq(0));
      return img.updateMask(mask);
    }

    function addLST(img) {
      const lstK = img.select("ST_B10").multiply(0.00341802).add(149.0).rename("LST_K");
      const lstC = lstK.subtract(273.15).rename("LST_C");
      return img.addBands([lstK, lstC]);
    }

    const l8 = ee.ImageCollection(collectionMap.L8)
      .filterBounds(roi).filterDate(startDate, endDate)
      .map(maskLandsatL2).map(addLST);

    const l9 = ee.ImageCollection(collectionMap.L9)
      .filterBounds(roi).filterDate(startDate, endDate)
      .map(maskLandsatL2).map(addLST);

    const merged = l8.merge(l9);

    const collectionSize = await eeEval(merged.size());
    if (collectionSize === 0) {
      const err = new Error(
        `Không tìm thấy ảnh Landsat 8/9 nào trong khoảng thời gian ${startDate} – ${endDate}.`,
      );
      err.code = "EE_EMPTY_COLLECTION";
      throw err;
    }

    const lstMedian = merged.select("LST_C").median().clip(roi);
    const heatViz = {
      min: 15,
      max: 45,
      palette: HEATMAP_PALETTE,
    };

    const lstVis = lstMedian.visualize(heatViz);
    const mapInfo = await new Promise((resolve, reject) => {
      lstVis.getMap({ name: "heatmapImage" }, (m, err) => {
        if (err) return reject(err);
        if (!m || !m.urlFormat) return reject(new Error("Không có tile url"));
        resolve(m);
      });
    });

    const downloadUrl = await getDownloadUrl(lstMedian, "satellite_heatmap_lst", heatViz);

    return {
      mapId: mapInfo.mapid,
      tileUrl: mapInfo.urlFormat,
      downloadUrl,
      totalImages: collectionSize,
      visualizationParams: heatViz,
    };
  }

  /**
   * Compute 7-class land cover classification with area stats.
   */
  static async computeClassified({ geometry, startDate, endDate, collection, cloudCover }) {
    const roi = toGeometry(geometry);

    const compositeResult = await buildComposite({
      collection,
      startDate,
      endDate,
      cloudCover,
      geometry: roi,
      spectralOptions: { ndvi: true, mndwi: true, ndbi: true, mbi: true },
      returnCollection: true,
    });

    const classified = classifyLandCover(
      compositeResult.composite,
      BAND_CONFIG[compositeResult.sensorType] || BAND_CONFIG.S2,
    );

    const classBands = ee.Image.cat(
      [1, 2, 3, 4, 5, 6].map((i) =>
        classified.eq(i).selfMask().multiply(ee.Image.pixelArea()).rename(`class_${i}`),
      ),
    );

    const statsDict = await eeEval(
      classBands.reduceRegion({
        reducer: ee.Reducer.sum(),
        geometry: roi,
        scale: 100,
        maxPixels: 1e10,
        bestEffort: true,
        tileScale: 4,
      }),
    );

    const paletteHex = LAND_COVER_CLASSES.map((c) => c.color.replace("#", ""));
    const classifiedVis = classified.visualize({ palette: paletteHex, min: 0, max: 6 });

    const mapInfo = await new Promise((resolve, reject) => {
      classifiedVis.getMap({ name: "classifiedImage" }, (m, err) => {
        if (err) return reject(err);
        resolve(m);
      });
    });

    const downloadUrl = await getDownloadUrl(classified, "satellite_classified", {
      palette: paletteHex,
      min: 0,
      max: 6,
    });

    return {
      mapId: mapInfo.mapid,
      tileUrl: mapInfo.urlFormat,
      downloadUrl,
      totalImages: compositeResult.tile.totalImages,
      statsDict,
      visualizationParams: { palette: paletteHex, min: 0, max: 6 },
    };
  }

  /**
   * Compute two RGB composites for split-map comparison.
   */
  static async computeCompareRgb({ geometry, startDate1, endDate1, startDate2, endDate2, collection, cloudCover }) {
    const roi = toGeometry(geometry);
    const bandConfig = BAND_CONFIG[collection === "S2" ? "S2" : "LANDSAT"];
    const visualizationParams = { bands: bandConfig.rgbBands, min: 0, max: 0.3, gamma: 1.4 };

    const [composite1Result, composite2Result] = await Promise.all([
      buildComposite({
        collection,
        startDate: startDate1,
        endDate: endDate1,
        cloudCover,
        geometry: roi,
        spectralOptions: { ndvi: false, mndwi: false, ndbi: false, mbi: false },
        visualizationParameters: visualizationParams,
        returnCollection: true,
      }),
      buildComposite({
        collection,
        startDate: startDate2,
        endDate: endDate2,
        cloudCover,
        geometry: roi,
        spectralOptions: { ndvi: false, mndwi: false, ndbi: false, mbi: false },
        visualizationParameters: visualizationParams,
        returnCollection: true,
      }),
    ]);

    const [dl1, dl2] = await Promise.all([
      getDownloadUrl(composite1Result.composite, `satellite_rgb_${startDate1}`, visualizationParams),
      getDownloadUrl(composite2Result.composite, `satellite_rgb_${startDate2}`, visualizationParams),
    ]);

    return {
      period1: {
        mapId: composite1Result.tile.mapId,
        tileUrl: composite1Result.tile.tileUrl,
        downloadUrl: dl1,
        totalImages: composite1Result.tile.totalImages,
        startDate: startDate1,
        endDate: endDate1,
      },
      period2: {
        mapId: composite2Result.tile.mapId,
        tileUrl: composite2Result.tile.tileUrl,
        downloadUrl: dl2,
        totalImages: composite2Result.tile.totalImages,
        startDate: startDate2,
        endDate: endDate2,
      },
      visualizationParams,
    };
  }

  /**
   * Compute forest + road/build change detection map with area stats.
   */
  static async computeDetectForestChange({ geometry, startDate1, endDate1, startDate2, endDate2, cloudCover }) {
    const roi = toGeometry(geometry);

    const { change, debug } = await computeForestChange({
      geometry,
      startDate1,
      endDate1,
      startDate2,
      endDate2,
      cloudCover,
    });

    const changeVis = change.visualize({ min: 0, max: 4, palette: CHANGE_VIS_PALETTE });

    const mapInfo = await new Promise((resolve, reject) => {
      changeVis.getMap({ name: "changeImage" }, (m, err) => {
        if (err) return reject(err);
        resolve(m);
      });
    });

    const classBands = ee.Image.cat(
      [0, 1, 2, 3, 4].map((code) =>
        change.eq(code).selfMask().multiply(ee.Image.pixelArea()).rename(`code_${code}`),
      ),
    );

    const statsDict = await eeEval(
      classBands.reduceRegion({
        reducer: ee.Reducer.sum(),
        geometry: roi,
        scale: 100,
        maxPixels: 1e10,
        bestEffort: true,
        tileScale: 4,
      }),
    );

    const downloadUrl = await getDownloadUrl(change, "satellite_forest_road_change", {
      min: 0,
      max: 4,
      palette: CHANGE_VIS_PALETTE,
    });

    return {
      mapId: mapInfo.mapid,
      tileUrl: mapInfo.urlFormat,
      downloadUrl,
      statsDict,
      debug,
    };
  }

}

module.exports = SatelliteRepository;

