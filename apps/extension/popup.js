// Popup controller. Talks to the service worker via chrome.runtime messages.
// Loaded as an ES module (see popup.html) so it shares the single source of
// truth for URLs in src/config.js instead of hardcoding a host.

import { WEB_APP_URL } from './src/config.js'

const $ = (id) => document.getElementById(id)
const send = (msg) => new Promise((resolve) => chrome.runtime.sendMessage(msg, resolve))
const tabSend = (tabId, msg) =>
  new Promise((resolve) =>
    chrome.tabs.sendMessage(tabId, msg, (resp) => resolve(chrome.runtime.lastError ? null : resp)),
  )

const RING_CIRC = 2 * Math.PI * 27 // r=27 in popup.html

const state = {
  tab: null,
  url: '',
  detect: null,
  jd: '',
  tailored: false,
  tailoredProfile: null,
  coverText: '',
}

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab
}

function hostOf(url) {
  try {
    return new URL(url).hostname
  } catch {
    return '—'
  }
}

function renderCompat(detect) {
  const el = $('compat')
  if (detect?.level === 'full') {
    el.textContent = `Compatible · ${detect.portal}`
    el.className = 'badge ok'
  } else if (detect?.level === 'partial') {
    el.textContent = `Partially compatible · ${detect.portal}`
    el.className = 'badge warn'
  } else {
    el.textContent = 'Not a supported job portal'
    el.className = 'badge no'
  }
  $('autofill').disabled = !detect?.supported
}

function renderRing(score) {
  const meter = $('ats-meter')
  const pct = Math.max(0, Math.min(100, score)) / 100
  meter.style.strokeDashoffset = String(RING_CIRC * (1 - pct))
  meter.style.stroke = score >= 70 ? '#16a34a' : score >= 50 ? '#f59e0b' : '#ef4444'
}

async function extractJD() {
  if (!state.tab?.id) return ''
  const resp = await tabSend(state.tab.id, { type: 'EXTRACT_JOB_DESCRIPTION' })
  return resp?.text || ''
}

async function runAutofill() {
  $('status').textContent = 'Loading your profile…'
  let profile = state.tailored ? state.tailoredProfile : null
  if (!profile) {
    const res = await send({ type: 'GET_PROFILE' })
    if (res?.error || !res?.profile) {
      $('status').textContent = 'Could not load profile.'
      return
    }
    profile = res.profile
  }
  $('status').textContent = state.tailored ? 'Filling form with tailored CV…' : 'Filling form…'
  const resp = await tabSend(state.tab.id, {
    type: 'RUN_AUTOFILL',
    profile,
    selectors: state.detect?.selectors || {},
    multiStep: state.detect?.quirks === 'multi-step',
  })
  if (!resp) {
    $('status').textContent = 'Open a job application page, then try again.'
    return
  }
  const n = resp.filled ?? 0
  $('status').textContent = n ? `Filled ${n} field${n === 1 ? '' : 's'} ✓` : 'No matching fields found.'
  if (n && state.detect?.supported) {
    send({
      type: 'TRACK_APPLICATION',
      payload: {
        jobUrl: state.url,
        portal: state.detect.portal,
        jobTitle: state.tab.title?.split(' - ')[0] || 'Application',
        company: state.detect.portal,
      },
    })
  }
}

async function scoreAts() {
  if (!state.jd) return
  $('ats-section').classList.remove('hidden')
  const { result, error } = await send({ type: 'ATS_SCORE', jobDescription: state.jd })
  if (error || !result) {
    $('ats-score').textContent = 'Could not score this page.'
    return
  }
  renderRing(result.matchScore)
  $('ats-qual').textContent = `${result.matchScore}% · ${result.qualification}`
  const missing = (result.missingKeywords || []).slice(0, 3)
  $('ats-score').textContent = missing.length ? `Add: ${missing.join(', ')}` : 'Strong keyword coverage'
}

function setupCover() {
  $('cover-section').classList.remove('hidden')
  $('cover-generate').onclick = async () => {
    $('cover-generate').textContent = 'Generating…'
    $('cover-generate').disabled = true
    const { text, error } = await send({
      type: 'COVER_LETTER',
      jobDescription: state.jd,
      tone: $('cover-tone').value,
    })
    $('cover-generate').textContent = 'Regenerate'
    $('cover-generate').disabled = false
    if (error || !text) return
    state.coverText = text
    $('cover-text').textContent = text
    $('cover-text').classList.remove('hidden')
    $('cover-actions').classList.remove('hidden')
  }
  $('cover-copy').onclick = () => {
    navigator.clipboard.writeText(state.coverText)
    $('cover-copy').textContent = 'Copied ✓'
    setTimeout(() => ($('cover-copy').textContent = 'Copy'), 1500)
  }
  $('cover-insert').onclick = async () => {
    const resp = await tabSend(state.tab.id, { type: 'INSERT_COVER_LETTER', text: state.coverText })
    $('cover-insert').textContent = resp?.inserted ? 'Inserted ✓' : 'No field found'
    setTimeout(() => ($('cover-insert').textContent = 'Insert'), 1500)
  }
}

function setupTailorToggle() {
  $('tailor-row').classList.remove('hidden')
  $('tailor-toggle').onchange = async (e) => {
    if (!e.target.checked) {
      state.tailored = false
      $('tailor-label').textContent = 'Use a CV tailored to this job'
      return
    }
    $('tailor-label').textContent = 'Tailoring your CV…'
    const { profile, error } = await send({ type: 'TAILOR_FOR_URL', url: state.url })
    if (error || !profile) {
      $('tailor-toggle').checked = false
      $('tailor-label').textContent = 'Tailoring unavailable (premium feature)'
      return
    }
    state.tailored = true
    state.tailoredProfile = profile
    $('tailor-label').textContent = 'Tailored CV ready ✓'
  }
}

function setupFooter() {
  $('open-dashboard').onclick = () => chrome.tabs.create({ url: `${WEB_APP_URL}/dashboard` })
  $('open-settings').onclick = () => chrome.tabs.create({ url: `${WEB_APP_URL}/settings/credentials` })
  $('open-feedback').onclick = () => chrome.tabs.create({ url: `${WEB_APP_URL}/dashboard?feedback=1` })
  $('logout').onclick = async () => {
    await send({ type: 'LOGOUT' })
    location.reload()
  }
}

async function init() {
  const auth = await send({ type: 'GET_AUTH' })
  if (!auth?.authenticated) {
    $('login-view').classList.remove('hidden')
    $('open-login').onclick = () => chrome.tabs.create({ url: `${WEB_APP_URL}/login?ext=1` })
    return
  }

  $('main-view').classList.remove('hidden')
  setupFooter()

  state.tab = await activeTab()
  state.url = state.tab?.url || ''
  $('site-domain').textContent = hostOf(state.url)

  state.detect = await send({ type: 'DETECT_PORTAL', url: state.url })
  renderCompat(state.detect)
  $('autofill').onclick = runAutofill

  if (state.detect?.supported) {
    setupTailorToggle()
    state.jd = await extractJD()
    if (state.jd) {
      scoreAts()
      setupCover()
    }
  }
}

init()
