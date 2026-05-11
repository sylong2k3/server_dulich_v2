"use strict";

const collectionMap = {
  S2: "COPERNICUS/S2_SR_HARMONIZED",
  S2_CLOUD_PROB: "COPERNICUS/S2_CLOUD_PROBABILITY",
  L8: "LANDSAT/LC08/C02/T1_L2",
  L9: "LANDSAT/LC09/C02/T1_L2",
};

const BAND_CONFIG = {
  S2: {
    blue: "B2",
    green: "B3",
    red: "B4",
    nir: "B8",
    swir1: "B11",
    swir2: "B12",
    rgbBands: ["B4", "B3", "B2"],
    swirUrbanBands: ["B12", "B8", "B4"],
  },
  LANDSAT: {
    blue: "SR_B2",
    green: "SR_B3",
    red: "SR_B4",
    nir: "SR_B5",
    swir1: "SR_B6",
    swir2: "SR_B7",
    rgbBands: ["SR_B4", "SR_B3", "SR_B2"],
    swirUrbanBands: ["SR_B7", "SR_B5", "SR_B4"],
  },
};

// Global cloud masking config
const CFG = {
  cloudProbThresh: 30,
  qa60DilatePx: 2,
  nirDarkThresh: 0.15,
  shadowDistM: 300,
  cloudDilatePx: 2,
};

// Change detection thresholds
const CHANGE_CFG = {
  dNBR_loss: -0.15,
  dNDVI_loss: -0.2,
  dNBR_gain: 0.12,
  dNDVI_gain: 0.15,
  s1Pass: "DESCENDING",
  dVV_abs: 1.5,
};

const LAND_COVER_CLASSES = [
  { value: 0, name: "Không có dữ liệu (Mây)", color: "#000000" },
  { value: 1, name: "Nước", color: "#1E90FF" },
  { value: 2, name: "Đất trống (Khô và Ẩm)", color: "#D2B48C" },
  { value: 3, name: "Bê tông / Nhân tạo", color: "#808080" },
  { value: 4, name: "Khu dân cư nông thôn", color: "#FFD700" },
  { value: 5, name: "Thực vật thưa / Rừng khộp", color: "#90EE90" },
  { value: 6, name: "Rừng thường xanh", color: "#006400" },
];

const CHANGE_CLASSES = [
  { value: 0, name: "Không đổi", color: "#808080" },
  { value: 1, name: "Giảm thảm thực vật", color: "#FF0000" },
  { value: 2, name: "Tăng thảm thực vật", color: "#00FF00" },
  { value: 3, name: "Mở đường / Xây dựng", color: "#00FFFF" },
  { value: 4, name: "Giảm thực vật + Mở đường", color: "#FF00FF" },
];

const CHANGE_VIS_PALETTE = ["808080", "FF0000", "00FF00", "00FFFF", "FF00FF"];

const NDVI_PALETTE = [
  "8B0000", "FF0000", "FFA500", "FFFF00", "ADFF2F", "00FF00", "006400",
];

const HEATMAP_PALETTE = [
  "#313695", "#4575b4", "#74add1", "#abd9e9", "#e0f3f8",
  "#ffffbf", "#fee090", "#fdae61", "#f46d43", "#d73027", "#a50026",
];

const DEFAULT_VIZ = {
  bands: ["B4", "B3", "B2"],
  min: [0, 0, 0],
  max: [3000, 3000, 3000],
  gamma: [1, 1, 1],
};

module.exports = {
  collectionMap,
  BAND_CONFIG,
  CFG,
  CHANGE_CFG,
  LAND_COVER_CLASSES,
  CHANGE_CLASSES,
  CHANGE_VIS_PALETTE,
  NDVI_PALETTE,
  HEATMAP_PALETTE,
  DEFAULT_VIZ,
};
