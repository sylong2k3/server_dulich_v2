"use strict";

/**
 * SatelliteResult — response shape normalizer.
 *
 * Satellite data does not come from a relational DB; it comes from GEE.
 * This model exists to standardize the response shape and strip any
 * internal/debug fields that should not be sent to clients.
 */
class SatelliteResult {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  toJSON() {
    return {
      mapId: this.mapId ?? null,
      tileUrl: this.tileUrl ?? null,
      downloadUrl: this.downloadUrl ?? null,
      totalImages: this.totalImages ?? null,
      legend: this.legend ?? [],
      visualizationParams: this.visualizationParams ?? null,
      areaStats: this.areaStats ?? null,
      metadata: this.metadata ?? null,
    };
  }
}

class SatelliteCompareResult {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  toJSON() {
    return {
      period1: this.period1 ?? null,
      period2: this.period2 ?? null,
      legend: this.legend ?? [],
      visualizationParams: this.visualizationParams ?? null,
      metadata: this.metadata ?? null,
    };
  }
}

class SatelliteChangeResult {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  toJSON() {
    return {
      mapId: this.mapId ?? null,
      tileUrl: this.tileUrl ?? null,
      downloadUrl: this.downloadUrl ?? null,
      legend: this.legend ?? [],
      areaStats: this.areaStats ?? null,
      metadata: this.metadata ?? null,
    };
  }
}

module.exports = { SatelliteResult, SatelliteCompareResult, SatelliteChangeResult };
