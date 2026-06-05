// Injected into job-portal pages. Detects form fields, fills them from the
// user's profile using portal selector maps + real input-event simulation, and
// surfaces a login-autofill prompt. Loaded as a classic content script, so it
// inlines its helpers rather than importing modules (this file is the single
// source of truth for the field dictionary).

;(() => {
  // --- field dictionary (key → profile accessor + label/attr synonyms) --------
  // Multilingual (EN/ES/PT) since the target portals span LATAM. The `key` is
  // what portal selector maps (GET /portals/configs) reference.
  const FIELD_DEFS = [
    { key: 'fullName', get: (p) => p.personal?.fullName, syn: ['full name', 'name', 'nombre completo', 'nome completo', 'nombre', 'nome'] },
    { key: 'firstName', get: (p) => (p.personal?.fullName || '').split(' ')[0], syn: ['first name', 'given name', 'primeiro nome'] },
    { key: 'lastName', get: (p) => (p.personal?.fullName || '').split(' ').slice(1).join(' '), syn: ['last name', 'surname', 'family name', 'apellido', 'sobrenome'] },
    { key: 'email', get: (p) => p.personal?.email, syn: ['email', 'e-mail', 'correo', 'correo electronico'] },
    { key: 'phone', get: (p) => p.personal?.phone, syn: ['phone', 'telephone', 'mobile', 'telefono', 'celular', 'telefone'] },
    { key: 'location', get: (p) => p.personal?.location, syn: ['location', 'city', 'address', 'ubicacion', 'ciudad', 'localizacao', 'cidade'] },
    { key: 'headline', get: (p) => p.personal?.headline, syn: ['headline', 'current title', 'job title', 'puesto', 'cargo', 'titulo'] },
    { key: 'summary', get: (p) => p.personal?.summary, syn: ['summary', 'about', 'profile', 'resumen', 'sobre', 'resumo'] },
    { key: 'linkedin', get: (p) => (p.links || []).find((l) => /linkedin/i.test(l.url))?.url, syn: ['linkedin', 'linkedin url', 'perfil de linkedin'] },
    { key: 'website', get: (p) => (p.links || []).find((l) => !/linkedin/i.test(l.url))?.url, syn: ['website', 'portfolio', 'sitio web', 'site', 'portafolio'] },
    { key: 'workAuthorization', get: (p) => p.complementary?.workAuthorization, syn: ['work authorization', 'authorization', 'autorizacion', 'autorizacao'] },
    { key: 'noticePeriod', get: (p) => p.complementary?.noticePeriod, syn: ['notice period', 'availability', 'preaviso', 'aviso previo'] },
  ]
  const DEF_BY_KEY = Object.fromEntries(FIELD_DEFS.map((d) => [d.key, d]))

  const norm = (t) =>
    (t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()

  const IS_WORKDAY = /myworkdayjobs\.com/.test(location.host)

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
      for (const def of FIELD_DEFS) if (def.syn.some((s) => h === norm(s))) return def
    }
    for (const c of candidates) {
      const h = norm(c)
      if (!h) continue
      for (const def of FIELD_DEFS) if (def.syn.some((s) => h.includes(norm(s)))) return def
    }
    return null
  }

  // Native value setter so React/Vue controlled inputs register the change.
  function setNativeValue(el, value) {
    const proto =
      el instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : el instanceof HTMLTextAreaElement
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

  // Dropdowns: select the option matching by value or visible text.
  function fillSelect(el, value) {
    const want = norm(value)
    for (const opt of el.options) {
      if (norm(opt.value) === want || norm(opt.textContent) === want || norm(opt.textContent).includes(want)) {
        setNativeValue(el, opt.value)
        el.dispatchEvent(new Event('input', { bubbles: true }))
        el.dispatchEvent(new Event('change', { bubbles: true }))
        return true
      }
    }
    return false
  }

  function fillAny(el, value) {
    if (el.tagName === 'SELECT') return fillSelect(el, value)
    fillField(el, value)
    return true
  }

  function flash(el) {
    const prev = el.style.boxShadow
    el.style.transition = 'box-shadow 0.4s'
    el.style.boxShadow = '0 0 0 2px #3392ff'
    setTimeout(() => (el.style.boxShadow = prev), 900)
  }

  // Fuzzy-match a field's question text against the user's saved FAQ answers.
  function matchFaqAnswer(questionText, faq) {
    const q = norm(questionText)
    if (!q || !faq || !faq.length) return null
    const qWords = new Set(q.split(/\s+/).filter((w) => w.length > 3))
    let best = null
    let bestScore = 0
    for (const item of faq) {
      const fq = norm(item.question)
      let score = 0
      if (fq && (q.includes(fq) || fq.includes(q))) score = 0.9
      else {
        const fWords = fq.split(/\s+/).filter((w) => w.length > 3)
        const overlap = fWords.filter((w) => qWords.has(w)).length
        score = fWords.length ? overlap / fWords.length : 0
      }
      if (score > bestScore) {
        bestScore = score
        best = item
      }
    }
    return bestScore >= 0.5 ? best.answer : null
  }

  // Multi-strategy autofill: (1) portal selector map (most reliable), then
  // (2) generic label/attribute matching, then (3) FAQ answers for open-text fields.
  function autofill(profile, selectors = {}, faq = []) {
    let filled = 0
    const done = new Set()

    for (const [key, sel] of Object.entries(selectors || {})) {
      const def = DEF_BY_KEY[key]
      if (!def) continue
      const value = def.get(profile)
      if (!value) continue
      let el = null
      try {
        el = document.querySelector(sel)
      } catch {
        el = null
      }
      if (!el || done.has(el) || el.value) continue
      if (fillAny(el, value)) {
        flash(el)
        done.add(el)
        filled++
      }
    }

    const fields = document.querySelectorAll(
      'input[type="text"], input[type="email"], input[type="tel"], input[type="url"], input:not([type]), textarea, select',
    )
    for (const el of fields) {
      if (done.has(el) || el.value) continue
      const def = findDef(el)
      if (!def) continue
      const value = def.get(profile)
      if (!value) continue
      if (fillAny(el, value)) {
        flash(el)
        done.add(el)
        filled++
      }
    }

    // (3) FAQ answers for open-text questions still empty (the long free-text
    // fields the structured passes can't handle).
    if (faq && faq.length) {
      const openText = document.querySelectorAll('textarea, input[type="text"], input:not([type])')
      for (const el of openText) {
        if (done.has(el) || el.value) continue
        const answer = matchFaqAnswer(labelFor(el), faq)
        if (answer && fillAny(el, answer)) {
          flash(el)
          done.add(el)
          filled++
        }
      }
    }
    return filled
  }

  // --- login-form detection + non-intrusive confirm overlay -------------------
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
      chrome.runtime.sendMessage({ type: 'DECRYPT_CREDENTIAL', portal: location.hostname }, (resp) => {
        if (resp?.credential) fillLogin(resp.credential)
        bar.remove()
      })
    }
  }

  function fillLogin({ email, password }) {
    const emailEl = document.querySelector('input[type="email"], input[name*="email" i], input[name*="user" i]')
    const passEl = document.querySelector('input[type="password"]')
    if (emailEl) fillField(emailEl, email)
    if (passEl) fillField(passEl, password)
  }

  // Insert generated cover-letter text into the focused field (or first textarea
  // / contenteditable). Used by the popup's "Insert" action.
  function insertCoverLetter(text) {
    const active = document.activeElement
    let target =
      active && (active.tagName === 'TEXTAREA' || active.isContentEditable) ? active : null
    if (!target) target = document.querySelector('textarea, [contenteditable="true"]')
    if (!target) return false
    if (target.isContentEditable) {
      target.focus()
      document.execCommand('insertText', false, text)
    } else {
      fillField(target, text)
    }
    return true
  }

  // MutationObserver: SPA portals (and Workday's multi-step pages) inject fields
  // after load, so keep filling within a window after the autofill click.
  let pendingProfile = null
  let pendingSelectors = {}
  let pendingFaq = []
  const observer = new MutationObserver(() => {
    if (pendingProfile) autofill(pendingProfile, pendingSelectors, pendingFaq)
  })
  observer.observe(document.documentElement, { childList: true, subtree: true })

  chrome.runtime.onMessage.addListener((msg, _s, sendResponse) => {
    if (msg.type === 'RUN_AUTOFILL') {
      const filled = autofill(msg.profile, msg.selectors || {}, msg.faq || [])
      pendingProfile = msg.profile
      pendingSelectors = msg.selectors || {}
      pendingFaq = msg.faq || []
      // Workday paginates the form across steps — keep the fill window open
      // longer so later steps get populated as the user advances.
      const window = msg.multiStep || IS_WORKDAY ? 15000 : 4000
      setTimeout(() => (pendingProfile = null), window)
      sendResponse({ filled })
    }
    if (msg.type === 'EXTRACT_JOB_DESCRIPTION') {
      const main = document.querySelector('main, article, [class*="description" i]') || document.body
      sendResponse({ text: (main.innerText || '').slice(0, 6000) })
    }
    if (msg.type === 'INSERT_COVER_LETTER') {
      sendResponse({ inserted: insertCoverLetter(msg.text || '') })
    }
    return true
  })

  if (detectLoginForm()) showLoginPrompt()
})()
