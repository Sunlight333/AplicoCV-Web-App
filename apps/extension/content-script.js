// Injected into job-portal pages. Detects form fields, fills them from the
// user's profile using real input-event simulation, and surfaces a login-autofill
// prompt. Loaded as a classic content script, so it inlines its small helpers
// rather than importing modules.

;(() => {
  // --- field dictionary (mirrors field-map.js; inlined for content-script scope) ---
  const FIELD_DEFS = [
    { get: (p) => p.personal?.fullName, syn: ['full name', 'name', 'nombre completo', 'nome completo', 'nombre', 'nome'] },
    { get: (p) => (p.personal?.fullName || '').split(' ')[0], syn: ['first name', 'given name', 'primeiro nome'] },
    { get: (p) => (p.personal?.fullName || '').split(' ').slice(1).join(' '), syn: ['last name', 'surname', 'apellido', 'sobrenome'] },
    { get: (p) => p.personal?.email, syn: ['email', 'e-mail', 'correo', 'correo electronico'] },
    { get: (p) => p.personal?.phone, syn: ['phone', 'mobile', 'telefono', 'celular', 'telefone'] },
    { get: (p) => p.personal?.location, syn: ['location', 'city', 'address', 'ubicacion', 'ciudad', 'localizacao', 'cidade'] },
    { get: (p) => p.personal?.headline, syn: ['headline', 'current title', 'job title', 'puesto', 'cargo', 'titulo'] },
    { get: (p) => p.personal?.summary, syn: ['summary', 'about', 'resumen', 'sobre', 'resumo'] },
    { get: (p) => (p.links || []).find((l) => /linkedin/i.test(l.url))?.url, syn: ['linkedin'] },
    { get: (p) => (p.links || []).find((l) => !/linkedin/i.test(l.url))?.url, syn: ['website', 'portfolio', 'sitio web', 'site'] },
    { get: (p) => p.complementary?.workAuthorization, syn: ['work authorization', 'autorizacion', 'autorizacao'] },
  ]

  const norm = (t) =>
    (t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()

  function labelFor(el) {
    if (el.id) {
      const lab = document.querySelector(`label[for="${CSS.escape(el.id)}"]`)
      if (lab) return lab.textContent
    }
    const wrap = el.closest('label')
    if (wrap) return wrap.textContent
    return el.getAttribute('aria-label') || el.placeholder || el.name || ''
  }

  function findDef(el) {
    const candidates = [labelFor(el), el.name, el.id, el.placeholder, el.getAttribute('aria-label')]
    for (const c of candidates) {
      const h = norm(c)
      if (!h) continue
      for (const def of FIELD_DEFS) {
        if (def.syn.some((s) => h === norm(s))) return def
      }
    }
    for (const c of candidates) {
      const h = norm(c)
      if (!h) continue
      for (const def of FIELD_DEFS) {
        if (def.syn.some((s) => h.includes(norm(s)))) return def
      }
    }
    return null
  }

  // Native value setter so React/Vue controlled inputs register the change.
  function setNativeValue(el, value) {
    const proto = el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
    setter ? setter.call(el, value) : (el.value = value)
  }

  function fillField(el, value) {
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    el.focus()
    setNativeValue(el, value)
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
    el.dispatchEvent(new Event('blur', { bubbles: true }))
  }

  function autofill(profile) {
    const fields = document.querySelectorAll(
      'input[type="text"], input[type="email"], input[type="tel"], input:not([type]), textarea',
    )
    let filled = 0
    for (const el of fields) {
      if (el.value) continue
      const def = findDef(el)
      if (!def) continue
      const value = def.get(profile)
      if (value) {
        fillField(el, value)
        flash(el)
        filled++
      }
    }
    return filled
  }

  function flash(el) {
    const prev = el.style.boxShadow
    el.style.transition = 'box-shadow 0.4s'
    el.style.boxShadow = '0 0 0 2px #3392ff'
    setTimeout(() => (el.style.boxShadow = prev), 900)
  }

  // --- login-form detection + non-intrusive confirm overlay ---
  function detectLoginForm() {
    return !!document.querySelector('input[type="password"]')
  }

  function showLoginPrompt() {
    if (document.getElementById('aplicocv-login-overlay')) return
    const bar = document.createElement('div')
    bar.id = 'aplicocv-login-overlay'
    bar.style.cssText =
      'position:fixed;top:0;left:0;right:0;z-index:2147483647;display:flex;gap:12px;' +
      'align-items:center;justify-content:center;padding:10px;background:#0b1426;color:#fff;' +
      'font:500 14px Inter,system-ui,sans-serif'
    bar.innerHTML =
      '<span>AplicoCV detected a login form — autofill credentials?</span>' +
      '<button id="aplico-yes" style="background:#0a74f0;color:#fff;border:0;border-radius:8px;padding:6px 14px;cursor:pointer">Confirm</button>' +
      '<button id="aplico-skip" style="background:transparent;color:#9fb0d0;border:0;cursor:pointer">Skip</button>'
    document.body.appendChild(bar)
    bar.querySelector('#aplico-skip').onclick = () => bar.remove()
    bar.querySelector('#aplico-yes').onclick = () => {
      chrome.runtime.sendMessage(
        { type: 'DECRYPT_CREDENTIAL', portal: location.hostname },
        (resp) => {
          if (resp?.credential) fillLogin(resp.credential)
          bar.remove()
        },
      )
    }
  }

  function fillLogin({ email, password }) {
    const emailEl = document.querySelector('input[type="email"], input[name*="email" i], input[name*="user" i]')
    const passEl = document.querySelector('input[type="password"]')
    if (emailEl) fillField(emailEl, email)
    if (passEl) fillField(passEl, password)
  }

  // MutationObserver: SPA portals inject fields after load.
  let pendingProfile = null
  const observer = new MutationObserver(() => {
    if (pendingProfile) autofill(pendingProfile)
  })
  observer.observe(document.documentElement, { childList: true, subtree: true })

  // Messages from the popup.
  chrome.runtime.onMessage.addListener((msg, _s, sendResponse) => {
    if (msg.type === 'RUN_AUTOFILL') {
      const filled = autofill(msg.profile)
      pendingProfile = msg.profile // keep filling late-rendered fields briefly
      setTimeout(() => (pendingProfile = null), 4000)
      sendResponse({ filled })
    }
    if (msg.type === 'EXTRACT_JOB_DESCRIPTION') {
      const main = document.querySelector('main, article, [class*="description" i]') || document.body
      sendResponse({ text: (main.innerText || '').slice(0, 6000) })
    }
    return true
  })

  if (detectLoginForm()) showLoginPrompt()
})()
