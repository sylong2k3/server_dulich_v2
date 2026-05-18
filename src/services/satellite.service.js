"use strict";

/**
 * satellite.service.js
 *
 * Business logic layer for the satellite module.
 * Responsibilities:
 *   - Call SatelliteRepository (GEE + DB)
 *   - Convert GEE/internal errors to ApiErrors
 *   - Build the response data shape (not HTTP response — that's the controller)
 *   - Fire-and-forget audit logs (if required)
 *
 * Does NOT: contain SQL, write res.json(), or do raw GEE calls.
 */

// TODO: adjust import path to match SERVER 2's error class location
const { Api400Error } = require("../core/error.response");

const SatelliteRepository = require("../repositories/satellite.repository");
const { LAND_COVER_CLASSES, CHANGE_CLASSES, CHANGE_VIS_PALETTE } = require("../constants/satellite.constant");
const { SatelliteResult, SatelliteCompareResult, SatelliteChangeResult } = require("../models/Satellite.model");

// =============================================================================
//  HELPERS
// =============================================================================

const toKm2 = (m2) => parseFloat(((m2 || 0) / 1_000_000).toFixed(2));

/**
 * Map raw GEE errors to domain ApiErrors for consistent HTTP responses.
 */
const mapGeeError = (error) => {
  if (error.code === "EE_EMPTY_COLLECTION") {
    return new Api400Error(error.message);
  }
  if (error.code === "EE_GEOMETRY_INVALID") {
    return new Api400Error(error.message);
  }
  return error;
};

// =============================================================================
//  SERVICE 1: RGB COMPOSITE
// =============================================================================

/**
 * Lấy ảnh composite True Color (RGB) cho một khoảng thời gian.
 */
const getRgbCompositeService = async (params) => {
  try {
    const { geometry, startDate, endDate, collection = "S2", cloudCover = 30 } = params;

    const result = await SatelliteRepository.computeRgbComposite({
      geometry,
      startDate,
      endDate,
      collection,
      cloudCover,
    });

    const legend = [{ name: "Ảnh màu tự nhiên (RGB)", color: "N/A" }];

    return new SatelliteResult({
      mapId: result.mapId,
      tileUrl: result.tileUrl,
      downloadUrl: result.downloadUrl,
      totalImages: result.totalImages,
      legend,
      visualizationParams: result.visualizationParams,
      metadata: {
        type: "rgb_composite",
        collection,
        startDate,
        endDate,
        cloudCover,
        processed_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    throw mapGeeError(error);
  }
};

// =============================================================================
//  SERVICE 2: NDVI + VEGETATION AREA
// =============================================================================

/**
 * Lấy ảnh NDVI và thống kê diện tích thực vật.
 */
const getNdviImageService = async (params) => {
  try {
    const {
      geometry,
      startDate,
      endDate,
      collection = "S2",
      cloudCover = 30,
      ndviMinThresh = 0.2,
    } = params;

    const result = await SatelliteRepository.computeNdviImage({
      geometry,
      startDate,
      endDate,
      collection,
      cloudCover,
      ndviMinThresh,
    });

    const { ndviStats } = result;

    const rawClasses = [
      { key: "no_veg", label: "Nước / Không có thực vật", color: "#8B0000", areaKm2: toKm2(ndviStats["lt0"]) },
      { key: "bare", label: "Đất trống", color: "#FF0000", areaKm2: toKm2(ndviStats["r0_02"]) },
      { key: "sparse_veg", label: "Thực vật thưa", color: "#FFFF00", areaKm2: toKm2(ndviStats["r02_04"]) },
      { key: "dense_veg", label: "Thực vật dày", color: "#006400", areaKm2: toKm2(ndviStats["gt04"]) },
    ];

    const totalKm2 = parseFloat(
      rawClasses.reduce((s, c) => s + c.areaKm2, 0).toFixed(2),
    );

    const classes = rawClasses.map((c) => ({
      ...c,
      pct: totalKm2 > 0 ? parseFloat(((c.areaKm2 / totalKm2) * 100).toFixed(2)) : 0,
    }));

    const legend = [
      { range: "< 0", name: "Nước / Không có thực vật", color: "#8B0000" },
      { range: "0–0.1", name: "Đất trống", color: "#FF0000" },
      { range: "0.1–0.2", name: "Thảm cỏ thưa", color: "#FFA500" },
      { range: "0.2–0.3", name: "Cây bụi / Cỏ", color: "#FFFF00" },
      { range: "0.3–0.45", name: "Thực vật vừa", color: "#ADFF2F" },
      { range: "0.45–0.6", name: "Rừng khộp / TV khỏe", color: "#00FF00" },
      { range: "> 0.6", name: "Rừng thường xanh dày", color: "#006400" },
    ];

    const vizPalette = ["8B0000", "FF0000", "FFA500", "FFFF00", "ADFF2F", "00FF00", "006400"];

    return new SatelliteResult({
      mapId: result.mapId,
      tileUrl: result.tileUrl,
      downloadUrl: result.downloadUrl,
      totalImages: result.totalImages,
      areaStats: {
        totalKm2,
        vegetationKm2: toKm2(ndviStats["veg"]),
        ndviThreshold: ndviMinThresh,
        classes,
      },
      legend,
      visualizationParams: { min: -0.2, max: 0.85, palette: vizPalette },
      metadata: {
        type: "ndvi",
        collection,
        startDate,
        endDate,
        cloudCover,
        processed_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    throw mapGeeError(error);
  }
};

// =============================================================================
//  SERVICE 3: HEATMAP (LST)
// =============================================================================

/**
 * Lấy bản đồ nhiệt LST (Land Surface Temperature) từ Landsat 8/9.
 * Tham số `collection` nhận vào nhưng luôn dùng L8+L9.
 */
const getHeatmapService = async (params) => {
  try {
    const { geometry, startDate, endDate, collection, cloudCover = 30 } = params;

    const result = await SatelliteRepository.computeHeatmap({
      geometry,
      startDate,
      endDate,
      cloudCover,
    });

    const legend = [
      { range: "< 20°C", name: "Rất mát (nước, rừng dày)", color: "#313695" },
      { range: "20–25°C", name: "Mát", color: "#74add1" },
      { range: "25–30°C", name: "Trung bình", color: "#e0f3f8" },
      { range: "30–35°C", name: "Ấm (thực vật thưa)", color: "#fee090" },
      { range: "35–40°C", name: "Nóng (đất trống, đô thị)", color: "#f46d43" },
      { range: "> 40°C", name: "Rất nóng (mặt đường, mái tôn)", color: "#a50026" },
    ];

    return new SatelliteResult({
      mapId: result.mapId,
      tileUrl: result.tileUrl,
      downloadUrl: result.downloadUrl,
      totalImages: result.totalImages,
      legend,
      visualizationParams: result.visualizationParams,
      metadata: {
        type: "heatmap_lst",
        collection: "L8+L9",
        collectionParam: collection,
        startDate,
        endDate,
        cloudCover,
        processed_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    throw mapGeeError(error);
  }
};

// =============================================================================
//  SERVICE 4: CLASSIFIED LAND COVER
// =============================================================================

/**
 * Phân loại 7 lớp phủ đất và tính diện tích từng lớp.
 */
const getClassifiedImageService = async (params) => {
  try {
    const { geometry, startDate, endDate, collection = "S2", cloudCover = 30 } = params;

    const result = await SatelliteRepository.computeClassified({
      geometry,
      startDate,
      endDate,
      collection,
      cloudCover,
    });

    const { statsDict } = result;

    const classAreas = [];
    let totalArea = 0;

    for (let i = 1; i <= 6; i++) {
      const areaM2 = statsDict[`class_${i}`] || 0;
      const areaKm2 = areaM2 / 1_000_000;
      if (areaKm2 > 0) {
        classAreas.push({
          value: i,
          name: LAND_COVER_CLASSES[i].name,
          color: LAND_COVER_CLASSES[i].color,
          areaKm2: parseFloat(areaKm2.toFixed(2)),
          pct: 0,
        });
        totalArea += areaKm2;
      }
    }

    classAreas.forEach((ca) => {
      ca.pct = parseFloat(((ca.areaKm2 / totalArea) * 100).toFixed(2));
    });

    const legend = LAND_COVER_CLASSES.slice(1).map((c) => ({
      value: c.value,
      name: c.name,
      color: c.color,
    }));

    return new SatelliteResult({
      mapId: result.mapId,
      tileUrl: result.tileUrl,
      downloadUrl: result.downloadUrl,
      totalImages: result.totalImages,
      areaStats: {
        totalKm2: parseFloat(totalArea.toFixed(2)),
        classes: classAreas.map((c) => ({
          key: `class_${c.value}`,
          label: c.name,
          color: c.color,
          areaKm2: c.areaKm2,
          pct: c.pct,
        })),
      },
      legend,
      visualizationParams: result.visualizationParams,
      metadata: {
        type: "land_cover_classification",
        collection,
        startDate,
        endDate,
        cloudCover,
        classes: 7,
        processed_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    throw mapGeeError(error);
  }
};

// =============================================================================
//  SERVICE 5: COMPARE RGB (SPLIT MAP)
// =============================================================================

/**
 * Tạo 2 ảnh RGB để hiển thị split map so sánh 2 thời điểm.
 */
const compareRgbCompositeService = async (params) => {
  try {
    const {
      geometry,
      startDate1,
      endDate1,
      startDate2,
      endDate2,
      collection = "S2",
      cloudCover = 30,
    } = params;

    const result = await SatelliteRepository.computeCompareRgb({
      geometry,
      startDate1,
      endDate1,
      startDate2,
      endDate2,
      collection,
      cloudCover,
    });

    const legend = [{ name: "Ảnh màu tự nhiên (RGB)", color: "N/A" }];

    return new SatelliteCompareResult({
      period1: result.period1,
      period2: result.period2,
      legend,
      visualizationParams: result.visualizationParams,
      metadata: {
        type: "compare_rgb",
        collection,
        cloudCover,
        processed_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    throw mapGeeError(error);
  }
};

// =============================================================================
//  SERVICE 6: FOREST + ROAD CHANGE DETECTION
// =============================================================================

/**
 * Phát hiện thay đổi rừng (mất/tăng) và mở đường/xây dựng.
 */
const detectForestChangeService = async (params) => {
  try {
    const {
      geometry,
      startDate1,
      endDate1,
      startDate2,
      endDate2,
      collection,
      cloudCover = 30,
    } = params;

    const result = await SatelliteRepository.computeDetectForestChange({
      geometry,
      startDate1,
      endDate1,
      startDate2,
      endDate2,
      cloudCover,
    });

    const { statsDict, debug } = result;

    const toKm2Local = (m2) => parseFloat(((m2 || 0) / 1_000_000).toFixed(2));
    let totalAreaKm2 = 0;
    const classAreas = CHANGE_CLASSES.map((cls) => {
      const areaKm2 = toKm2Local(statsDict[`code_${cls.value}`]);
      totalAreaKm2 += areaKm2;
      return { ...cls, areaKm2 };
    });

    classAreas.forEach((ca) => {
      ca.pct =
        totalAreaKm2 > 0
          ? parseFloat(((ca.areaKm2 / totalAreaKm2) * 100).toFixed(2))
          : 0;
    });

    const legend = CHANGE_CLASSES.map((cls) => ({
      value: cls.value,
      name: cls.name,
      color: `#${CHANGE_VIS_PALETTE[cls.value]}`,
    }));

    return new SatelliteChangeResult({
      mapId: result.mapId,
      tileUrl: result.tileUrl,
      downloadUrl: result.downloadUrl,
      legend,
      areaStats: {
        totalAreaKm2: parseFloat(totalAreaKm2.toFixed(2)),
        byPeriod: {
          period1: { startDate: startDate1, endDate: endDate1 },
          period2: { startDate: startDate2, endDate: endDate2 },
        },
        classes: classAreas.map((ca) => ({
          key: `code_${ca.value}`,
          label: ca.name,
          color: ca.color,
          areaKm2: ca.areaKm2,
          pct: ca.pct,
        })),
      },
      metadata: {
        type: "forest_road_change_detection",
        collectionParam: collection,
        period1: { startDate: startDate1, endDate: endDate1 },
        period2: { startDate: startDate2, endDate: endDate2 },
        cloudCover,
        processed_at: new Date().toISOString(),
        debug: { s2Images: debug?.meta?.s2Images },
      },
    });
  } catch (error) {
    throw mapGeeError(error);
  }
};
module.exports = {
  getRgbCompositeService,
  getNdviImageService,
  getHeatmapService,
  getClassifiedImageService,
  compareRgbCompositeService,
  detectForestChangeService,
};



