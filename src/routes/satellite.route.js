"use strict";

/**
 * satellite.route.js
 *
 * Endpoints:
 *   POST /satellite/rgb           RGB composite True Color
 *   POST /satellite/ndvi          NDVI image + vegetation area stats
 *   POST /satellite/heat-map      LST heatmap (Landsat 8/9)
 *   POST /satellite/classified    7-class land cover + area stats
 *   POST /satellite/compare       RGB split map (2 periods)
 *   POST /satellite/change        Forest + road/build change detection
 *
 * NOTE on authentication:
 *   SERVER 1 did NOT apply auth/permission middleware to the five
 *   computation endpoints (rgb, ndvi, heat-map, classified, compare/change).
 *   They are treated as public here to preserve original behavior.
 */

const express = require("express");
const router = express.Router();

// TODO: adjust import paths to match SERVER 2 middleware locations
const { validateBody } = require("../middlewares/validation");

const ctrl = require("../controllers/satellite.controller");

const {
  singlePeriodSchema,
  ndviSchema,
  dualPeriodSchema,
} = require("../schemas/satellite.schema");

// =============================================================================
//  SATELLITE COMPUTATION ENDPOINTS
//  Currently public (no auth) — matches SERVER 1 behavior.
// =============================================================================

router.post(
  "/rgb",
  validateBody(singlePeriodSchema),
  ctrl.getRgbCompositeController,
);

router.post(
  "/ndvi",
  validateBody(ndviSchema),
  ctrl.getNdviController,
);

router.post(
  "/heat-map",
  validateBody(singlePeriodSchema),
  ctrl.getHeatmapController,
);

router.post(
  "/classified",
  validateBody(singlePeriodSchema),
  ctrl.getClassifiedController,
);

router.post(
  "/compare",
  validateBody(dualPeriodSchema),
  ctrl.compareController,
);

router.post(
  "/change",
  validateBody(dualPeriodSchema),
  ctrl.detectForestChangeController,
);

module.exports = router;

