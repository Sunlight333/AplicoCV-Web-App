// AES-256-GCM encryption for the auth token at rest in chrome.storage.local,
// per the plan's requirement. Uses the Web Crypto API (available in MV3 service
// workers). A 256-bit key is generated once per install and persisted; each
// value gets a fresh random 12-byte IV.
//
// Threat model note: chrome.storage.local is already origin-isolated to the
// extension, and the key lives beside the ciphertext, so this primarily defends
// against casual disk inspection rather than a compromised extension context.
// It satisfies the "stored under AES-256 encryption" requirement honestly.

const KEY_NAME = 'aplico_enc_key'

async function getKey() {
  const stored = await chrome.storage.local.get(KEY_NAME)
  if (stored[KEY_NAME]) {
    const raw = Uint8Array.from(atob(stored[KEY_NAME]), (c) => c.charCodeAt(0))
    return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt'])
  }
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
    'decrypt',
  ])
  const raw = new Uint8Array(await crypto.subtle.exportKey('raw', key))
  await chrome.storage.local.set({ [KEY_NAME]: btoa(String.fromCharCode(...raw)) })
  return key
}

export async function encrypt(plaintext) {
  const key = await getKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext)),
  )
  // Pack iv + ciphertext as base64.
  const packed = new Uint8Array(iv.length + ct.length)
  packed.set(iv)
  packed.set(ct, iv.length)
  return btoa(String.fromCharCode(...packed))
}

export async function decrypt(b64) {
  const key = await getKey()
  const packed = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
  const iv = packed.slice(0, 12)
  const ct = packed.slice(12)
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct)
  return new TextDecoder().decode(pt)
}
