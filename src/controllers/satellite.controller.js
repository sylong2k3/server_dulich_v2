"use strict";

/**
 * satellite.controller.js
 *
 * Thin controller - no business logic, no SQL, no GEE.
 * Extract inputs -> call service -> return response.
 */

// TODO: adjust import path to match SERVER 2's response helper location
const { OK } = require("../core/success.response");

const {
  getRgbCompositeService,
  getNdviImageService,
  getHeatmapService,
  getClassifiedImageService,
  compareRgbCompositeService,
  detectForestChangeService,
} = require("../services/satellite.service");

// =============================================================================
//  SATELLITE COMPUTATION CONTROLLERS
// =============================================================================

const getRgbCompositeController = async (req, res) => {
  const data = await getRgbCompositeService(req.body);
  OK(res, "Lay anh RGB composite thanh cong", { data });
};

const getNdviController = async (req, res) => {
  const data = await getNdviImageService(req.body);
  OK(res, "Lay anh NDVI thanh cong", { data });
};

const getHeatmapController = async (req, res) => {
  const data = await getHeatmapService(req.body);
  OK(res, "Lay ban do nhiet LST thanh cong", { data });
};

const getClassifiedController = async (req, res) => {
  const data = await getClassifiedImageService(req.body);
  OK(res, "Phan loai anh ve tinh thanh cong", { data });
};

const compareController = async (req, res) => {
  const data = await compareRgbCompositeService(req.body);
  OK(res, "Lay anh so sanh 2 thoi diem thanh cong", { data });
};

const detectForestChangeController = async (req, res) => {
  const data = await detectForestChangeService(req.body);
  OK(res, "Phan tich thay doi rung thanh cong", { data });
};

module.exports = {
  getRgbCompositeController,
  getNdviController,
  getHeatmapController,
  getClassifiedController,
  compareController,
  detectForestChangeController,
};

