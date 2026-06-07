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
    { key: 'email', get: (p) => p.personal?.email, syn: ['email address', 'e-mail address', 'email', 'e-mail', 'correo electronico', 'correo'] },
    { key: 'phone', get: (p) => p.personal?.phone, syn: ['phone', 'telephone', 'mobile', 'telefono', 'celular', 'telefone'] },
    { key: 'location', get: (p) => p.personal?.location, syn: ['location', 'city', 'address', 'ubicacion', 'ciudad', 'localizacao', 'cidade'] },
    { key: 'headline', get: (p) => p.personal?.headline, syn: ['headline', 'professional headline', 'titular profesional'] },
    { key: 'summary', get: (p) => p.personal?.summary, syn: ['summary', 'about', 'profile', 'resumen', 'sobre', 'resumo'] },
    { key: 'linkedin', get: (p) => (p.links || []).find((l) => /linkedin/i.test(l.url))?.url, syn: ['linkedin', 'linkedin url', 'perfil de linkedin'] },
    { key: 'website', get: (p) => (p.links || []).find((l) => !/linkedin/i.test(l.url))?.url, syn: ['personal website', 'website', 'portfolio', 'sitio web', 'portafolio'] },
    { key: 'workAuthorization', get: (p) => p.complementary?.workAuthorization, syn: ['work authorization', 'authorization', 'autorizacion', 'autorizacao'] },
    { key: 'noticePeriod', get: (p) => p.complementary?.noticePeriod, syn: ['notice period', 'availability', 'preaviso', 'aviso previo'] },
    // Work history (most recent role). Single-field forms fill directly; repeating
    // sections are handled by fillRepeating() below.
    { key: 'employer', get: (p) => p.experience?.[0]?.employer, syn: ['employer', 'company', 'current company', 'most recent employer', 'empresa', 'compania', 'empresa atual', 'empleador'] },
    { key: 'jobTitle', get: (p) => p.experience?.[0]?.title || p.personal?.headline, syn: ['job title', 'current title', 'most recent title', 'position', 'role', 'puesto', 'puesto actual', 'cargo', 'cargo atual'] },
    { key: 'workStart', get: (p) => p.experience?.[0]?.startDate, syn: ['start date', 'from', 'fecha de inicio', 'data de inicio', 'desde'] },
    { key: 'workEnd', get: (p) => p.experience?.[0]?.endDate, syn: ['end date', 'to', 'fecha de fin', 'data de termino', 'hasta'] },
    // Education (most recent).
    { key: 'school', get: (p) => p.education?.[0]?.institution, syn: ['school', 'university', 'college', 'institution', 'universidad', 'escuela', 'instituicao', 'universidade'] },
    { key: 'degree', get: (p) => p.education?.[0]?.degree, syn: ['degree', 'qualification', 'titulo', 'grado', 'formacao', 'graduacao'] },
    // Standardized degree level → the label most "highest level of education" selects use.
    { key: 'degreeLevel', get: (p) => degreeLabel(p.education?.[0]?.degreeLevel), syn: ['degree level', 'education level', 'highest degree', 'highest level of education', 'level of education', 'nivel de estudios', 'nivel educativo', 'escolaridade', 'grau academico'] },
    { key: 'fieldOfStudy', get: (p) => p.education?.[0]?.field, syn: ['field of study', 'major', 'area of study', 'especialidad', 'area de estudo'] },
    // Skills — fills a single skills/keywords field with the full list.
    { key: 'skills', get: (p) => (p.skills || []).join(', '), syn: ['skills', 'key skills', 'top skills', 'habilidades', 'competencias', 'aptidoes', 'conhecimentos'] },
    // Phase 2 — answers sourced from the user's saved job preferences. `yn` maps a
    // boolean to a Yes/No the typical form select expects.
    { key: 'gender', get: (p) => p.preferences?.gender, syn: ['gender', 'sex', 'how do you identify', 'genero', 'sexo', 'genero'] },
    { key: 'veteran', get: (p) => yn(p.preferences?.veteran), syn: ['veteran', 'veteran status', 'military', 'veterano'] },
    { key: 'driverLicense', get: (p) => yn(p.preferences?.driverLicense), syn: ['driver license', 'drivers license', 'driving license', 'licencia de conducir', 'carteira de motorista', 'cnh'] },
    { key: 'disability', get: (p) => yn(p.preferences?.disability), syn: ['disability', 'disabled', 'discapacidad', 'deficiencia'] },
    { key: 'howHeard', get: (p) => p.preferences?.howDidYouHear, syn: ['how did you hear', 'source', 'referral source', 'como nos conociste', 'como soube', 'como te enteraste'] },
    { key: 'relocation', get: (p) => yn(p.preferences?.relocation), syn: ['willing to relocate', 'relocation', 'relocate', 'reubicacion', 'mudanca', 'realocacao'] },
  ]

  // Map a boolean preference to the Yes/No string most application selects expect.
  function yn(v) {
    return v === true ? 'Yes' : v === false ? 'No' : undefined
  }

  // Map a standardized degree level to the wording job-site dropdowns commonly use.
  // fillSelect matches by partial text, so a generic label hits most variants.
  function degreeLabel(level) {
    return {
      secondary: 'High School',
      certificate: 'Certificate',
      associate: 'Associate Degree',
      bachelor: "Bachelor's Degree",
      master: "Master's Degree",
      doctorate: 'Doctorate',
      other: 'Other',
    }[level]
  }
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

  // Resolve a field def from a set of label/attribute strings. An exact synonym
  // match wins outright; the fuzzy (substring) pass then prefers the MOST SPECIFIC
  // (longest) synonym, and ignores synonyms under 4 chars. This prevents the classic
  // false positives: "Company name" -> 'company' (employer) not 'name' (full name);
  // "Relocation" -> 'relocation' not 'location'; and bare "to"/"sex" never substring-
  // match unrelated labels (they only match exactly).
  function defForHaystacks(haystacks) {
    const hays = haystacks.map(norm).filter(Boolean)
    for (const h of hays)
      for (const def of FIELD_DEFS) if (def.syn.some((s) => h === norm(s))) return def
    let best = null
    let bestLen = 0
    for (const h of hays)
      for (const def of FIELD_DEFS)
        for (const s of def.syn) {
          const ns = norm(s)
          if (ns.length >= 4 && ns.length > bestLen && h.includes(ns)) {
            best = def
            bestLen = ns.length
          }
        }
    return best
  }

  function findDef(el) {
    return defForHaystacks([labelFor(el), el.name, el.id, el.placeholder, el.getAttribute('aria-label')])
  }

  // Match a single text string (e.g. a radio group's question) to a field def.
  function matchDefByText(text) {
    return defForHaystacks([text])
  }

  // The question text for a radio group (fieldset legend or ARIA group label).
  function radioGroupQuestion(radio) {
    const fs = radio.closest('fieldset')
    if (fs) {
      const lg = fs.querySelector('legend')
      if (lg && lg.textContent) return lg.textContent
    }
    const grp = radio.closest('[role="radiogroup"], [role="group"]')
    if (grp) {
      if (grp.getAttribute('aria-label')) return grp.getAttribute('aria-label')
      const id = grp.getAttribute('aria-labelledby')
      if (id) {
        const e = document.getElementById(id)
        if (e) return e.textContent
      }
    }
    return ''
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

  // Acceptable spellings for a value, so a Yes/No (or other) answer matches forms in
  // English, Spanish and Portuguese. fillSelect/fillRadio match against any of these.
  function valueSynonyms(value) {
    const v = norm(value)
    const YES = ['yes', 'si', 'sí', 'sim', 'true', '1']
    const NO = ['no', 'nao', 'não', 'false', '0']
    if (YES.includes(v)) return YES
    if (NO.includes(v)) return NO
    return [v]
  }

  // Dropdowns: select the option matching by value or visible text (multilingual).
  function fillSelect(el, value) {
    const wants = valueSynonyms(value)
    for (const opt of el.options) {
      const ov = norm(opt.value)
      const ot = norm(opt.textContent)
      if (wants.some((w) => ov === w || ot === w || (w.length > 1 && ot.includes(w)))) {
        setNativeValue(el, opt.value)
        el.dispatchEvent(new Event('input', { bubbles: true }))
        el.dispatchEvent(new Event('change', { bubbles: true }))
        return true
      }
    }
    return false
  }

  // Radio groups: pick the radio in the field's group whose label/value matches the
  // value (handles the common Yes/No radios that selects do not cover).
  function fillRadio(el, value) {
    const wants = valueSynonyms(value)
    const name = el.name
    const group = name
      ? document.querySelectorAll(`input[type="radio"][name="${CSS.escape(name)}"]`)
      : [el]
    for (const radio of group) {
      const cand = norm(labelFor(radio) || radio.value)
      if (wants.some((w) => cand === w || (w.length > 1 && cand.includes(w)))) {
        radio.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
        radio.checked = true
        radio.dispatchEvent(new Event('input', { bubbles: true }))
        radio.dispatchEvent(new Event('change', { bubbles: true }))
        radio.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        return true
      }
    }
    return false
  }

  function fillAny(el, value) {
    if (el.tagName === 'SELECT') return fillSelect(el, value)
    if (el.type === 'radio') return fillRadio(el, value)
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

  // Repeating sections (work history / education): when a form pre-renders several
  // rows, fill the i-th row from the i-th profile entry. We match by an "anchor"
  // field (employer / school) and fill siblings within the same row container.
  // Conservative: we never click "add row" buttons (too portal-specific) — we only
  // populate rows the page already shows beyond the first.
  function rowContainer(el) {
    return (
      el.closest('fieldset, [class*="experience" i], [class*="education" i], [class*="entry" i], [class*="item" i], li') ||
      el.parentElement
    )
  }

  // Yes/No (and similar) radio-button questions: match the group's question text to a
  // field def and select the matching radio. The generic input pass skips radios
  // because each radio's own label is the option (Yes/No), not the question.
  function fillRadioGroups(profile, done) {
    let filled = 0
    const seen = new Set()
    for (const radio of document.querySelectorAll('input[type="radio"]')) {
      const name = radio.name
      if (!name || seen.has(name)) continue
      seen.add(name)
      const def = matchDefByText(radioGroupQuestion(radio))
      if (!def) continue
      const value = def.get(profile)
      if (!value) continue
      if (fillRadio(radio, value)) {
        done.add(radio)
        flash(radio)
        filled++
      }
    }
    return filled
  }

  function fillRepeating(profile, done) {
    let filled = 0
    const sections = [
      {
        anchorSyn: DEF_BY_KEY.employer.syn,
        entries: profile.experience || [],
        map: { employer: 'employer', jobTitle: 'title', workStart: 'startDate', workEnd: 'endDate' },
      },
      {
        anchorSyn: DEF_BY_KEY.school.syn,
        entries: profile.education || [],
        map: { school: 'institution', degree: 'degree', fieldOfStudy: 'field', workStart: 'startDate', workEnd: 'endDate' },
      },
    ]
    for (const sec of sections) {
      if (sec.entries.length < 2) continue // first entry already handled generically
      // Find anchor fields (one per visible row), in document order.
      const all = document.querySelectorAll('input, textarea')
      const anchors = []
      for (const el of all) {
        const h = norm(labelFor(el) || el.name || el.placeholder)
        if (h && sec.anchorSyn.some((s) => h.includes(norm(s)))) anchors.push(el)
      }
      const keys = Object.keys(sec.map)
      anchors.forEach((anchor, i) => {
        const entry = sec.entries[i]
        if (!entry) return
        // Build an {defKey: value} view of the entry for fillInContainer.
        const view = {}
        for (const k of keys) view[k] = entry[sec.map[k]]
        // Attach a `.field` lookup so fillInContainer can read values by def key.
        const defs = keys
        const container = rowContainer(anchor)
        const inputs = container ? container.querySelectorAll('input, textarea, select') : []
        for (const el of inputs) {
          if (done.has(el) || el.value) continue
          const def = findDef(el)
          if (!def || !defs.includes(def.key)) continue
          const value = view[def.key]
          if (!value) continue
          if (fillAny(el, value)) {
            flash(el)
            done.add(el)
            filled++
          }
        }
      })
    }
    return filled
  }

  // Default acceptances (Phase 2): only the data/privacy-policy consent checkbox is
  // auto-ticked, and only when the user left the default on (acceptDataPolicy !== false).
  // The user still reviews everything before submitting. Deliberately conservative so
  // unrelated checkboxes are never touched.
  const _CONSENT = /privacy|policy|terms|consent|gdpr|data protection|process(ing)? (of )?(my )?data|politica|privacidad|t[eé]rminos|consentimiento|tratamiento de datos|aceito|concordo|acepto/i
  function applyAcceptances(profile, done) {
    const prefs = profile.preferences || {}
    if (prefs.acceptDataPolicy === false) return 0
    let filled = 0
    for (const el of document.querySelectorAll('input[type="checkbox"]')) {
      if (done.has(el) || el.checked) continue
      const label = norm(labelFor(el))
      if (label && _CONSENT.test(label)) {
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
        el.checked = true
        el.dispatchEvent(new Event('input', { bubbles: true }))
        el.dispatchEvent(new Event('change', { bubbles: true }))
        flash(el)
        done.add(el)
        filled++
      }
    }
    return filled
  }

  // Multi-strategy autofill: (1) portal selector map (most reliable), then
  // (2) generic label/attribute matching, then (3) repeating work/education rows,
  // (3b) default consent, then (4) FAQ answers for open-text fields.
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

    // (3) repeating work-history / education rows the form already shows.
    filled += fillRepeating(profile, done)

    // (3b) Yes/No radio-button questions (veteran, licence, relocation, ...).
    filled += fillRadioGroups(profile, done)

    // (3c) default acceptances (Phase 2) — tick the data/privacy-policy consent the
    // user opted into by default, so the form does not block on an unchecked box.
    filled += applyAcceptances(profile, done)

    // (4) FAQ answers for open-text questions still empty (the long free-text
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
  // after load, so keep filling within a window after the autofill click. The
  // observer is only active during that window (started on autofill, disconnected
  // when the window expires) rather than for the page's whole lifetime.
  let pendingProfile = null
  let pendingSelectors = {}
  let pendingFaq = []
  let fillToken = 0
  const observer = new MutationObserver(() => {
    if (pendingProfile) autofill(pendingProfile, pendingSelectors, pendingFaq)
  })

  // Phase 1.4 — for open-text fields the FAQ pass couldn't fill, ask the backend
  // (via the service worker) for a short, human-toned answer. Bounded to a few
  // fields per run since each call costs credits and a round-trip. Opt-in.
  async function fillSmartAnswers(jobDescription, max = 3) {
    const fields = document.querySelectorAll('textarea, input[type="text"], input:not([type])')
    let count = 0
    for (const el of fields) {
      if (count >= max) break
      if (el.value || el.offsetParent === null) continue
      const label = labelFor(el)
      // Only target genuine open questions (longer prompts), not short inputs.
      if (!label || norm(label).split(/\s+/).length < 3) continue
      const answer = await new Promise((resolve) =>
        chrome.runtime.sendMessage(
          { type: 'FIELD_ANSWER', fieldLabel: label, jobDescription },
          (resp) => resolve(resp && !resp.error ? resp.answer : null),
        ),
      )
      if (answer && !el.value && fillAny(el, answer)) {
        flash(el)
        count++
      }
    }
    return count
  }

  chrome.runtime.onMessage.addListener((msg, _s, sendResponse) => {
    if (msg.type === 'RUN_AUTOFILL') {
      const filled = autofill(msg.profile, msg.selectors || {}, msg.faq || [])
      pendingProfile = msg.profile
      pendingSelectors = msg.selectors || {}
      pendingFaq = msg.faq || []
      // Workday paginates the form across steps — keep the fill window open
      // longer so later steps get populated as the user advances.
      const fillWindow = msg.multiStep || IS_WORKDAY ? 15000 : 4000
      const token = ++fillToken
      observer.observe(document.documentElement, { childList: true, subtree: true })
      setTimeout(() => {
        if (token !== fillToken) return // a newer autofill took over; let it finish
        pendingProfile = null
        observer.disconnect()
      }, fillWindow)
      if (msg.smartAnswers) {
        // Async; reports the combined count back to the popup when done.
        fillSmartAnswers(msg.jobDescription || '').then((extra) =>
          sendResponse({ filled: filled + extra }),
        )
        return true // keep the channel open for the async response
      }
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
