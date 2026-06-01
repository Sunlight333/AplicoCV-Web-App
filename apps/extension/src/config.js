// Central config for the extension. Point API_BASE at your deployed backend in
// production; localhost is used for development.
export const API_BASE = 'http://localhost:8000/api'
export const WEB_APP_URL = 'http://localhost:5173'

// Polling interval for long backend operations (MV3 service workers can be
// terminated, so we never rely on a live message response).
export const POLL_INTERVAL_MS = 2000
