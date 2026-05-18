// earthEngine.js - File cấu hình Earth Engine
const ee = require('@google/earthengine');
const privateKey = require('../../ggeServiceKey.json');

let isInitialized = false;

// Hàm khởi tạo Earth Engine với Promise
const initializeEarthEngine = () => {
  return new Promise((resolve, reject) => {
    if (isInitialized) {
      resolve();
      return;
    }

    ee.data.authenticateViaPrivateKey(
      privateKey,
      () => {
        ee.initialize(null, null, () => {
          console.log('Earth Engine initialized successfully');
          isInitialized = true;
          resolve();
        }, (error) => {
          console.error('Earth Engine initialization failed:', error);
          reject(error);
        });
      },
      (error) => {
        console.error('Authentication failed:', error);
        reject(error);
      }
    );
  });
};

module.exports = {
  ee: ee,
  initializeEarthEngine: initializeEarthEngine,
  isInitialized: () => isInitialized
};
