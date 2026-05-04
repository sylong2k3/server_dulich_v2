const fs = require("fs");
const path = require("path");
const ee = require("@google/earthengine");

let isInitialized = false;
let cachedPrivateKey = null;

function parseServiceAccount(rawJson, sourceLabel) {
  try {
    const parsed = JSON.parse(rawJson);
    if (!parsed.client_email || !parsed.private_key) {
      throw new Error(
        `Invalid Earth Engine service account from ${sourceLabel}: missing client_email/private_key`,
      );
    }
    return parsed;
  } catch (error) {
    throw new Error(
      `Cannot parse Earth Engine service account from ${sourceLabel}: ${error.message}`,
    );
  }
}

function loadServiceAccountFromFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Earth Engine key file not found: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, "utf8");
  return parseServiceAccount(raw, `file ${filePath}`);
}

function resolvePrivateKey() {
  if (cachedPrivateKey) {
    return cachedPrivateKey;
  }

  const fromJson = process.env.GGE_SERVICE_ACCOUNT_JSON;
  if (fromJson && fromJson.trim()) {
    cachedPrivateKey = parseServiceAccount(
      fromJson,
      "env GGE_SERVICE_ACCOUNT_JSON",
    );
    return cachedPrivateKey;
  }

  const fromBase64 = process.env.GGE_SERVICE_ACCOUNT_JSON_BASE64;
  if (fromBase64 && fromBase64.trim()) {
    const decoded = Buffer.from(fromBase64, "base64").toString("utf8");
    cachedPrivateKey = parseServiceAccount(
      decoded,
      "env GGE_SERVICE_ACCOUNT_JSON_BASE64",
    );
    return cachedPrivateKey;
  }

  const keyFileFromEnv = process.env.GGE_SERVICE_ACCOUNT_FILE;
  if (keyFileFromEnv && keyFileFromEnv.trim()) {
    const filePath = path.isAbsolute(keyFileFromEnv)
      ? keyFileFromEnv
      : path.resolve(process.cwd(), keyFileFromEnv);
    cachedPrivateKey = loadServiceAccountFromFile(filePath);
    return cachedPrivateKey;
  }

  const legacyFile = path.resolve(__dirname, "../../ggeServiceKey.json");
  if (process.env.NODE_ENV !== "production" && fs.existsSync(legacyFile)) {
    cachedPrivateKey = loadServiceAccountFromFile(legacyFile);
    return cachedPrivateKey;
  }

  throw new Error(
    "Missing Earth Engine credentials. Set one of: GGE_SERVICE_ACCOUNT_JSON, GGE_SERVICE_ACCOUNT_JSON_BASE64, or GGE_SERVICE_ACCOUNT_FILE.",
  );
}

const initializeEarthEngine = () => {
  return new Promise((resolve, reject) => {
    if (isInitialized) {
      resolve();
      return;
    }

    let privateKey;
    try {
      privateKey = resolvePrivateKey();
    } catch (error) {
      reject(error);
      return;
    }

    ee.data.authenticateViaPrivateKey(
      privateKey,
      () => {
        ee.initialize(
          null,
          null,
          () => {
            isInitialized = true;
            resolve();
          },
          (error) => {
            console.error("Earth Engine initialization failed:", error);
            reject(error);
          },
        );
      },
      (error) => {
        console.error("Authentication failed:", error);
        reject(error);
      },
    );
  });
};

module.exports = {
  ee,
  initializeEarthEngine,
  isInitialized: () => isInitialized,
};
