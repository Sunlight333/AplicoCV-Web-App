// Central config for the extension.
//
// The extension ships pointing at the production deployment. For local
// development against `apps/api` on your machine, switch DEV to true (or load
// the extension and edit these two constants) before "Load unpacked".

const DEV = false

const PROD = {
  API_BASE: 'https://aplicocv.com/api',
  WEB_APP_URL: 'https://aplicocv.com',
}

const LOCAL = {
  API_BASE: 'http://localhost:8000/api',
  WEB_APP_URL: 'http://localhost:5173',
}

const cfg = DEV ? LOCAL : PROD

export const API_BASE = cfg.API_BASE
export const WEB_APP_URL = cfg.WEB_APP_URL

// Polling interval for long backend operations (MV3 service workers can be
// terminated, so we never rely on a live message response).
export const POLL_INTERVAL_MS = 2000
