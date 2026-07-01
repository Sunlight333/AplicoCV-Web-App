// Injected into job-portal pages. Detects form fields, fills them from the
// user's profile using portal selector maps + real input-event simulation, and
// surfaces a login-autofill prompt. Loaded as a classic content script, so it
// inlines its helpers rather than importing modules (this file is the single
// source of truth for the field dictionary).

;(() => {
  // --- field dictionary (key → profile accessor + label/attr synonyms) --------
  // Multilingual (EN/ES/PT) since the target portals span LATAM. The `key` is
  // what portal selector maps (GET /portals/configs) reference.
  // Split a full name into given/family parts. Tuned for LATAM (ES/PT) names, which
  // commonly carry two given names and two surnames ("Juan Carlos Pérez García"):
  // a naive first-token/rest split would wrongly fold the second given name into the
  // surname. Heuristic: 4+ tokens → first two are given names, the rest are surnames;
  // 3 tokens → one given name + two surnames (the most common LATAM shape).
  function splitName(full) {
    const parts = (properName(full) || '').trim().split(/\s+/).filter(Boolean)
    if (parts.length <= 1) return { first: parts[0] || '', last: '' }
    if (parts.length === 2) return { first: parts[0], last: parts[1] }
    if (parts.length === 3) return { first: parts[0], last: parts.slice(1).join(' ') }
    return { first: parts.slice(0, 2).join(' '), last: parts.slice(2).join(' ') }
  }

  // Names stored in ALL CAPS are rejected by some portals (Workday) and look wrong.
  // If a value is entirely uppercase, convert it to Title Case; mixed-case names are
  // left untouched so "McDonald" / "de la Cruz" aren't mangled.
  function properName(s) {
    if (!s) return s
    const isAllCaps = s === s.toUpperCase() && s !== s.toLowerCase()
    if (!isAllCaps) return s
    return s.toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (_, sep, ch) => sep + ch.toUpperCase())
  }

  // Phone helpers: portals like Workday have a SEPARATE country-code selector, so
  // putting the full "+56 9 1234 5678" into the number field duplicates the code and
  // fails validation. localPhone strips a leading "+<code>" for the number field;
  // phoneCountryCode returns just the "+56" for the country-code field.
  function localPhone(s) {
    if (!s) return s
    return String(s).replace(/^\s*\+\d{1,3}[\s-]?/, '').trim() || String(s)
  }
  function phoneCountryCode(s) {
    const m = String(s || '').match(/^\s*(\+\d{1,3})/)
    return m ? m[1] : undefined
  }

  const FIELD_DEFS = [
    { key: 'fullName', get: (p) => properName(p.personal?.fullName), syn: ['full name', 'name', 'nombre completo', 'nome completo', 'nombre', 'nome'] },
    { key: 'firstName', get: (p) => splitName(p.personal?.fullName).first, syn: ['first name', 'given name', 'primeiro nome'] },
    { key: 'lastName', get: (p) => splitName(p.personal?.fullName).last, syn: ['last name', 'surname', 'family name', 'apellido', 'sobrenome'] },
    { key: 'email', get: (p) => p.personal?.email, syn: ['email address', 'e-mail address', 'email', 'e-mail', 'correo electronico', 'correo'] },
    { key: 'phoneCountryCode', get: (p) => phoneCountryCode(p.personal?.phone), syn: ['country code', 'phone country code', 'codigo de pais', 'codigo pais', 'codigo do pais', 'country phone code'] },
    { key: 'phone', get: (p) => localPhone(p.personal?.phone), syn: ['phone', 'telephone', 'mobile', 'phone number', 'telefono', 'numero de telefono', 'celular', 'telefone'] },
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
    // Role responsibilities — stored as bullet points; joined for a free-text field.
    { key: 'roleDescription', get: (p) => (p.experience?.[0]?.bullets || []).join('\n'), syn: ['role description', 'description of role', 'responsibilities', 'job duties', 'what did you do', 'descripcion del cargo', 'descripcion del rol', 'responsabilidades', 'funciones', 'descricao', 'atividades', 'descripcion'] },
    // Education (most recent).
    { key: 'school', get: (p) => p.education?.[0]?.institution, syn: ['school', 'university', 'college', 'institution', 'universidad', 'escuela', 'instituicao', 'universidade'] },
    { key: 'degree', get: (p) => p.education?.[0]?.degree, syn: ['degree', 'qualification', 'titulo', 'grado', 'formacao', 'graduacao'] },
    // Standardized degree level → the label most "highest level of education" selects use.
    { key: 'degreeLevel', get: (p) => degreeLabel(p.education?.[0]?.degreeLevel), syn: ['degree level', 'education level', 'highest degree', 'highest level of education', 'level of education', 'nivel de estudios', 'nivel educativo', 'escolaridade', 'grau academico'] },
    { key: 'fieldOfStudy', get: (p) => p.education?.[0]?.field, syn: ['field of study', 'major', 'area of study', 'especialidad', 'area de estudo'] },
    // Skills — fills a single skills/keywords field with the full list.
    { key: 'skills', get: (p) => (p.skills || []).join(', '), syn: ['skills', 'key skills', 'top skills', 'habilidades', 'competencias', 'aptidoes', 'conhecimentos'] },
    // Languages — combined into one field when the form offers a single free-text box.
    // Per-language rows with proficiency levels are handled by fillRepeating below.
    { key: 'language', get: (p) => (p.languages || []).map((l) => l.language).filter(Boolean).join(', '), syn: ['languages', 'languages spoken', 'idiomas', 'lenguajes', 'idioma', 'linguas'] },
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

  // True when an element already holds a meaningful value, so autofill should skip
  // it. A <select>'s .value is its first option (often a placeholder), and a
  // checkbox/radio .value is the constant "on" — neither means "already filled", so
  // they must not be gated on raw .value (that bug skipped every dropdown/checkbox).
  function isMeaningfullyFilled(el) {
    if (el.tagName === 'SELECT') return el.selectedIndex > 0
    const type = (el.type || '').toLowerCase()
    if (type === 'checkbox' || type === 'radio') return false
    return !!el.value
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

  // Map a language proficiency level to the wording forms commonly use (fillSelect
  // matches by partial text, so a single label hits most variants).
  function languageLevelLabel(level) {
    return {
      basic: 'Basic', conversational: 'Conversational', professional: 'Professional',
      advanced: 'Advanced', native: 'Native', bilingual: 'Bilingual',
    }[level]
  }

  // Find a section's "Add" button by SECTION-SPECIFIC text only (never a bare "Add"),
  // so we never mis-click an unrelated control. Prefers the most specific match.
  function findAddButton(addSyn, scope) {
    const root = scope || document
    let best = null, bestLen = 0
    for (const b of root.querySelectorAll('button, a, [role="button"]')) {
      if (b.disabled || b.offsetParent === null) continue
      const t = norm(b.textContent || b.getAttribute('aria-label') || '')
      if (!t) continue
      for (const s of addSyn) {
        const ns = norm(s)
        if (ns.length >= 5 && t.includes(ns) && ns.length > bestLen) { best = b; bestLen = ns.length }
      }
    }
    return best
  }

  // --- Split date fields (Workday & similar) ---------------------------------
  // Workday renders dates as separate month/day/year spinbutton inputs the generic
  // text pass can't fill. Parse the stored date and type each section.
  function parseDate(str) {
    if (!str) return null
    const s = String(str).trim()
    if (/present|actual|current|ongoing|now|hoy|atual/i.test(s)) return { present: true }
    const mon = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    let m
    if ((m = s.match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?/))) return { year: +m[1], month: +m[2], day: m[3] ? +m[3] : null }
    if ((m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) return { year: +m[3], month: +m[1], day: +m[2] }
    if ((m = s.match(/^(\d{1,2})\/(\d{4})$/))) return { year: +m[2], month: +m[1], day: null }
    if ((m = s.match(/([A-Za-z]{3})[a-z]*\.?\s+(\d{4})/))) {
      const mi = mon.indexOf(m[1].toLowerCase())
      if (mi >= 0) return { year: +m[2], month: mi + 1, day: null }
    }
    if ((m = s.match(/\b(19|20)\d{2}\b/))) return { year: +m[0], month: null, day: null }
    return null
  }

  // The label of the field group an element belongs to (Workday wraps fields in
  // a formField group with its own label/legend).
  function groupLabel(el) {
    const grp = el.closest('[data-automation-id^="formField" i], fieldset, [role="group"]')
    if (grp) {
      const lab = grp.querySelector('label, legend')
      if (lab && lab.textContent.trim()) return lab.textContent
      if (grp.getAttribute('aria-label')) return grp.getAttribute('aria-label')
    }
    return el.getAttribute('aria-label') || ''
  }

  // Date-section wrappers within a scope: groups that contain a "year" section input.
  function dateWrappersIn(scope) {
    const wrappers = new Set()
    for (const i of scope.querySelectorAll('input')) {
      const id = norm(
        (i.getAttribute('data-automation-id') || '') + ' ' + (i.getAttribute('aria-label') || '') +
        ' ' + (i.getAttribute('placeholder') || '') + ' ' + (i.name || ''),
      )
      if (/year|yyyy|\bano\b/.test(id)) {
        const w =
          i.closest('[data-automation-id*="dateinput" i], [data-automation-id^="datewidget" i], [data-automation-id^="formField" i], fieldset, [role="group"]') ||
          i.parentElement?.parentElement || i.parentElement
        if (w) wrappers.add(w)
      }
    }
    return [...wrappers]
  }

  // Type month/day/year into a date wrapper's section inputs.
  function fillDateSections(wrapper, parsed, done) {
    if (!parsed || parsed.present) return 0
    let n = 0
    const pick = (re) =>
      [...wrapper.querySelectorAll('input')].find((i) =>
        re.test(norm(
          (i.getAttribute('data-automation-id') || '') + ' ' + (i.getAttribute('aria-label') || '') +
          ' ' + (i.getAttribute('placeholder') || '') + ' ' + (i.name || ''),
        )),
      )
    const put = (el, val) => {
      if (el && !done.has(el) && val != null) { fillField(el, String(val)); done.add(el); flash(el); n++ }
    }
    put(pick(/month|\bmm\b|\bmes\b/), parsed.month)
    put(pick(/\bday\b|\bdd\b|\bdia\b/), parsed.day)
    put(pick(/year|yyyy|\bano\b/), parsed.year)
    return n
  }

  // Bounded add-clicks per run, so we never loop clicking "Add" endlessly. Reset on
  // each RUN_AUTOFILL.
  let addClicks = {}
  // One in-flight searchable-dropdown ("prompt") at a time — opened on one pass, its
  // option clicked on the next (options render async). Reset on each RUN_AUTOFILL.
  let pendingPrompt = null

  // Workday-style searchable dropdowns: a trigger that opens a listbox of options
  // (native <select> is handled by fillSelect; this covers the custom widget). Opens
  // one prompt per pass and, on the next pass, clicks the option whose text matches —
  // only on a confident match, never a guess; unmatched dropdowns are closed, not set.
  function fillPromptWidgets(profile, done) {
    let n = 0
    if (pendingPrompt) {
      const opts = document.querySelectorAll('[role="option"], [data-automation-id="promptOption"], [data-automation-id*="menuItem" i]')
      const wants = valueSynonyms(pendingPrompt.value)
      let clicked = false
      for (const o of opts) {
        if (o.offsetParent === null) continue
        const ot = norm(o.textContent || '')
        if (ot && wants.some((w) => ot === w || (w.length > 2 && ot.includes(w)))) {
          o.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
          o.click()
          n++; clicked = true; break
        }
      }
      if (!clicked && opts.length) {
        document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      }
      pendingPrompt = null
      if (clicked) return n
    }
    for (const trig of document.querySelectorAll('[aria-haspopup="listbox"], [data-automation-id*="selectinput" i], [data-automation-id*="promptinput" i]')) {
      if (done.has(trig) || trig.offsetParent === null) continue
      const def = defForHaystacks([groupLabel(trig), trig.getAttribute('aria-label') || '', trig.getAttribute('data-automation-id') || ''])
      if (!def) continue
      const value = def.get(profile)
      if (!value) continue
      const shown = norm(trig.textContent || trig.value || '')
      const wants = valueSynonyms(value)
      if (shown && wants.some((w) => w.length > 2 && shown.includes(w))) { done.add(trig); continue } // already set
      done.add(trig)
      pendingPrompt = { value }
      trig.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
      trig.click()
      const search = trig.tagName === 'INPUT' ? trig : trig.querySelector('input')
      if (search) fillField(search, String(value)) // type to filter, if searchable
      break // one prompt per pass; the observer re-runs to click its option
    }
    return n
  }

  // Repeating sections (experience / education / languages): fill each visible row
  // from the matching profile entry, and — bounded — click the section's Add button
  // to create rows for extra entries (the MutationObserver re-runs autofill once the
  // new row renders). Values can be transforms (e.g. bullets -> joined text).
  function fillRepeating(profile, done) {
    let filled = 0
    const sections = [
      {
        key: 'experience',
        anchorSyn: DEF_BY_KEY.employer.syn,
        addSyn: ['add experience', 'add another experience', 'add work', 'add employment', 'add position', 'add job', 'agregar experiencia', 'anadir experiencia', 'adicionar experiencia'],
        entries: profile.experience || [],
        map: {
          employer: (e) => e.employer,
          jobTitle: (e) => e.title,
          location: (e) => e.location,
          workStart: (e) => e.startDate,
          workEnd: (e) => e.endDate,
          roleDescription: (e) => (e.bullets || []).join('\n'),
        },
      },
      {
        key: 'education',
        anchorSyn: DEF_BY_KEY.school.syn,
        addSyn: ['add education', 'add another education', 'add school', 'add degree', 'agregar educacion', 'anadir educacion', 'adicionar formacao'],
        entries: profile.education || [],
        map: {
          school: (e) => e.institution,
          degree: (e) => e.degree,
          degreeLevel: (e) => degreeLabel(e.degreeLevel),
          fieldOfStudy: (e) => e.field,
          workStart: (e) => e.startDate,
          workEnd: (e) => e.endDate,
        },
      },
      {
        key: 'languages',
        anchorSyn: DEF_BY_KEY.language.syn,
        addSyn: ['add language', 'add another language', 'agregar idioma', 'anadir idioma', 'adicionar idioma'],
        entries: profile.languages || [],
        map: { language: (e) => e.language },
        level: (e) => languageLevelLabel(e.level),
      },
    ]
    for (const sec of sections) {
      if (!sec.entries.length) continue
      const keys = Object.keys(sec.map)
      // Find anchor fields (one per visible row), in document order.
      const anchors = []
      for (const el of document.querySelectorAll('input, textarea')) {
        const h = norm(labelFor(el) || el.name || el.placeholder)
        if (h && sec.anchorSyn.some((s) => h.includes(norm(s)))) anchors.push(el)
      }
      // Process every visible row (idempotent via the `done` set): text fields the
      // generic pass already handled are skipped, but row scoping lets us fill the
      // split date widgets and per-row values the generic pass can't.
      anchors.forEach((anchor, i) => {
        const entry = sec.entries[i]
        if (!entry) return
        const container = rowContainer(anchor)
        const inputs = container ? container.querySelectorAll('input, textarea, select') : []
        for (const el of inputs) {
          if (done.has(el) || isMeaningfullyFilled(el)) continue
          const def = findDef(el)
          if (!def || !keys.includes(def.key)) continue
          const value = sec.map[def.key](entry)
          if (!value) continue
          if (fillAny(el, value)) { flash(el); done.add(el); filled++ }
        }
        // Language proficiency: fill any level select/dropdown in the same row.
        if (sec.level && container) {
          const lvl = sec.level(entry)
          if (lvl) for (const el of container.querySelectorAll('select')) {
            if (done.has(el) || isMeaningfullyFilled(el)) continue
            if (fillSelect(el, lvl)) { flash(el); done.add(el); filled++ }
          }
        }
        // Split date widgets (Workday): fill start/end date groups from the entry,
        // and tick "I currently work here" when an experience has no end date.
        if (container && (entry.startDate || entry.endDate)) {
          for (const w of dateWrappersIn(container)) {
            const gl = norm(groupLabel(w))
            if (/start|from|desde|inicio|inicial/.test(gl) && entry.startDate) {
              filled += fillDateSections(w, parseDate(entry.startDate), done)
            } else if (/end|\bto\b|hasta|\bfin\b|termino|final/.test(gl) && entry.endDate) {
              filled += fillDateSections(w, parseDate(entry.endDate), done)
            }
          }
        }
        if (sec.key === 'experience' && container && !entry.endDate) {
          for (const cb of container.querySelectorAll('input[type="checkbox"]')) {
            if (done.has(cb) || cb.checked) continue
            if (/current|present|actual|i currently|actualmente|atualmente/.test(norm(labelFor(cb)))) {
              cb.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
              cb.checked = true
              cb.dispatchEvent(new Event('input', { bubbles: true }))
              cb.dispatchEvent(new Event('change', { bubbles: true }))
              done.add(cb); flash(cb); filled++
            }
          }
        }
      })
      // Bounded add-row: more entries than visible rows -> click the section's Add
      // button once per pass; the observer re-runs to fill the freshly added row.
      if (anchors.length && anchors.length < sec.entries.length && (addClicks[sec.key] || 0) < sec.entries.length) {
        const scope = rowContainer(anchors[anchors.length - 1])?.parentElement || document
        const btn = findAddButton(sec.addSyn, scope) || findAddButton(sec.addSyn, document)
        if (btn) { addClicks[sec.key] = (addClicks[sec.key] || 0) + 1; btn.click() }
      }
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
      if (!el || done.has(el) || isMeaningfullyFilled(el)) continue
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
      if (done.has(el) || isMeaningfullyFilled(el)) continue
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

    // (3b·2) Searchable dropdowns / prompt widgets (Workday) that aren't <select>.
    filled += fillPromptWidgets(profile, done)

    // (3c) default acceptances (Phase 2) — tick the data/privacy-policy consent the
    // user opted into by default, so the form does not block on an unchecked box.
    filled += applyAcceptances(profile, done)

    // (4) FAQ answers for open-text questions still empty (the long free-text
    // fields the structured passes can't handle).
    if (faq && faq.length) {
      const openText = document.querySelectorAll('textarea, input[type="text"], input:not([type])')
      for (const el of openText) {
        if (done.has(el) || isMeaningfullyFilled(el)) continue
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
  // after load, so keep filling within a window after the autofill click. The window
  // SLIDES — it stays open while fields keep getting filled (so multi-step forms get
  // each new step populated as the user advances), and closes after a spell of
  // inactivity or a hard cap, rather than a single fixed timeout.
  let pendingProfile = null
  let pendingSelectors = {}
  let pendingFaq = []
  let fillToken = 0
  let lastActivity = 0
  const observer = new MutationObserver(() => {
    if (!pendingProfile) return
    const n = autofill(pendingProfile, pendingSelectors, pendingFaq)
    if (n > 0) lastActivity = Date.now()
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

  // --- Multi-step navigation (auto-advance) ----------------------------------
  // Click a step's "Save and Continue"/"Next" to advance a paginated form (Workday),
  // but NEVER a final "Submit"/"Apply" — the user always makes the final submission.
  // Only advances when the visible step has no empty required fields, so we never skip
  // validation or spam a blocked step.
  const _SUBMIT_RE = /\bsubmit\b|\bapply\b|enviar|postular|finish|send application|revisar y enviar/i
  const _CONTINUE_RE = /save and continue|save & continue|save and next|\bcontinue\b|\bnext\b|siguiente|continuar|guardar y continuar|pr[oó]ximo|avan[cç]ar/i

  function findContinueButton() {
    for (const b of document.querySelectorAll('button, a[role="button"], input[type="submit"], [role="button"]')) {
      if (b.disabled || b.offsetParent === null) continue
      const t = (b.textContent || b.value || b.getAttribute('aria-label') || '').trim()
      if (!t || _SUBMIT_RE.test(t)) continue // never auto-click a final submission
      if (_CONTINUE_RE.test(t)) return b
    }
    return null
  }

  function hasEmptyRequired() {
    for (const el of document.querySelectorAll('input[required], select[required], textarea[required], [aria-required="true"]')) {
      if (el.offsetParent === null) continue // not on the visible step
      const t = (el.type || '').toLowerCase()
      if (t === 'checkbox' || t === 'radio') {
        if (el.name && document.querySelector(`input[name="${CSS.escape(el.name)}"]:checked`)) continue
        return true
      }
      if (el.tagName === 'SELECT') { if (el.selectedIndex <= 0) return true; continue }
      if (!el.value) return true
    }
    return false
  }

  chrome.runtime.onMessage.addListener((msg, _s, sendResponse) => {
    if (msg.type === 'RUN_AUTOFILL') {
      addClicks = {} // reset per run so add-row clicking is bounded to this session
      pendingPrompt = null
      const filled = autofill(msg.profile, msg.selectors || {}, msg.faq || [])
      pendingProfile = msg.profile
      pendingSelectors = msg.selectors || {}
      pendingFaq = msg.faq || []
      // Sliding window: stay active while the form keeps yielding fields (multi-step
      // portals like Workday paginate across steps), closing after IDLE_MS of no new
      // fills or MAX_MS total. This replaces the old fixed 15s cap that expired mid-flow.
      const IDLE_MS = msg.multiStep || IS_WORKDAY ? 12000 : 5000
      const MAX_MS = 300000
      // Auto-advance paginated forms (default ON for multi-step/Workday; opt out via
      // preferences.autoAdvance === false). Bounded so it can never loop indefinitely.
      const autoAdvance = (msg.multiStep || IS_WORKDAY) && msg.profile?.preferences?.autoAdvance !== false
      const MAX_STEPS = 12
      let steps = 0
      const token = ++fillToken
      const started = Date.now()
      lastActivity = Date.now()
      observer.observe(document.documentElement, { childList: true, subtree: true })
      const iv = setInterval(() => {
        if (token !== fillToken) { clearInterval(iv); return } // a newer run took over
        const stop = () => { clearInterval(iv); pendingProfile = null; observer.disconnect() }
        const now = Date.now()
        if (now - started > MAX_MS) return stop()
        if (now - lastActivity > IDLE_MS) {
          // The step has settled. Advance to the next step when it's safe: auto-advance
          // is on, we have budget, and no required field on this step is still empty.
          if (autoAdvance && steps < MAX_STEPS && !hasEmptyRequired()) {
            const btn = findContinueButton()
            if (btn) { steps++; btn.click(); lastActivity = Date.now(); return }
          }
          stop() // nothing left to fill or advance
        }
      }, 1000)
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
