// Popup controller. Talks to the service worker via chrome.runtime messages.

const WEB_APP_URL = 'http://localhost:5173'

const $ = (id) => document.getElementById(id)
const send = (msg) => new Promise((resolve) => chrome.runtime.sendMessage(msg, resolve))

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab
}

async function init() {
  const auth = await send({ type: 'GET_AUTH' })

  if (!auth?.authenticated) {
    $('login-view').classList.remove('hidden')
    $('open-login').onclick = () => {
      chrome.tabs.create({ url: `${WEB_APP_URL}/login?ext=1` })
    }
    return
  }

  $('main-view').classList.remove('hidden')

  const tab = await activeTab()
  const url = tab?.url || ''
  let domain = '—'
  try {
    domain = new URL(url).hostname
  } catch {}
  $('site-domain').textContent = domain

  const detect = await send({ type: 'DETECT_PORTAL', url })
  const compat = $('compat')
  if (detect?.supported) {
    compat.textContent = `Compatible · ${detect.portal}`
    compat.className = 'badge ok'
    $('autofill').disabled = false
  } else {
    compat.textContent = 'Not a supported job portal'
    compat.className = 'badge no'
    $('autofill').disabled = true
  }

  $('autofill').onclick = async () => {
    $('status').textContent = 'Loading your profile…'
    const { profile, error } = await send({ type: 'GET_PROFILE' })
    if (error || !profile) {
      $('status').textContent = 'Could not load profile.'
      return
    }
    $('status').textContent = 'Filling form…'
    chrome.tabs.sendMessage(tab.id, { type: 'RUN_AUTOFILL', profile }, (resp) => {
      if (chrome.runtime.lastError) {
        $('status').textContent = 'Open a job application page, then try again.'
        return
      }
      const n = resp?.filled ?? 0
      $('status').textContent = n ? `Filled ${n} field${n === 1 ? '' : 's'} ✓` : 'No matching fields found.'
      if (n && detect?.supported) {
        send({
          type: 'TRACK_APPLICATION',
          payload: {
            jobUrl: url,
            portal: detect.portal,
            jobTitle: tab.title?.split(' - ')[0] || 'Application',
            company: detect.portal,
          },
        })
      }
    })
  }

  $('open-dashboard').onclick = (e) => {
    e.preventDefault()
    chrome.tabs.create({ url: `${WEB_APP_URL}/dashboard` })
  }
  $('logout').onclick = async (e) => {
    e.preventDefault()
    await send({ type: 'LOGOUT' })
    location.reload()
  }
}

init()
