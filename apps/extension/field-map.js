// Normalized dictionary mapping common form-field concepts to the profile data
// path that fills them, plus the label/attribute synonyms used to detect them.
// Multilingual (EN/ES/PT) since the target portals span LATAM.

export const FIELD_DEFS = [
  {
    key: 'fullName',
    get: (p) => p.personal?.fullName,
    synonyms: ['full name', 'name', 'nombre', 'nombre completo', 'nome', 'nome completo'],
  },
  {
    key: 'firstName',
    get: (p) => (p.personal?.fullName || '').split(' ')[0],
    synonyms: ['first name', 'given name', 'nombre', 'primeiro nome'],
  },
  {
    key: 'lastName',
    get: (p) => (p.personal?.fullName || '').split(' ').slice(1).join(' '),
    synonyms: ['last name', 'surname', 'family name', 'apellido', 'sobrenome'],
  },
  {
    key: 'email',
    get: (p) => p.personal?.email,
    synonyms: ['email', 'e-mail', 'correo', 'correo electrónico', 'e-mail'],
  },
  {
    key: 'phone',
    get: (p) => p.personal?.phone,
    synonyms: ['phone', 'telephone', 'mobile', 'teléfono', 'celular', 'telefone'],
  },
  {
    key: 'location',
    get: (p) => p.personal?.location,
    synonyms: ['location', 'city', 'address', 'ubicación', 'ciudad', 'localização', 'cidade'],
  },
  {
    key: 'headline',
    get: (p) => p.personal?.headline,
    synonyms: ['headline', 'current title', 'job title', 'puesto', 'cargo', 'título'],
  },
  {
    key: 'summary',
    get: (p) => p.personal?.summary,
    synonyms: ['summary', 'about', 'profile', 'resumen', 'sobre', 'resumo'],
  },
  {
    key: 'linkedin',
    get: (p) => (p.links || []).find((l) => /linkedin/i.test(l.url))?.url,
    synonyms: ['linkedin', 'linkedin url', 'perfil de linkedin'],
  },
  {
    key: 'website',
    get: (p) => (p.links || []).find((l) => !/linkedin/i.test(l.url))?.url,
    synonyms: ['website', 'portfolio', 'sitio web', 'site', 'portafolio'],
  },
  {
    key: 'workAuthorization',
    get: (p) => p.complementary?.workAuthorization,
    synonyms: ['work authorization', 'authorization', 'autorización', 'autorização'],
  },
  {
    key: 'noticePeriod',
    get: (p) => p.complementary?.noticePeriod,
    synonyms: ['notice period', 'availability', 'preaviso', 'aviso prévio'],
  },
]

export function normalize(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

// Score how well a label/attribute string matches a field definition.
export function matchField(haystack) {
  const h = normalize(haystack)
  if (!h) return null
  for (const def of FIELD_DEFS) {
    for (const syn of def.synonyms) {
      const s = normalize(syn)
      if (h === s) return { def, score: 1 }
    }
  }
  for (const def of FIELD_DEFS) {
    for (const syn of def.synonyms) {
      const s = normalize(syn)
      if (h.includes(s) || s.includes(h)) return { def, score: 0.6 }
    }
  }
  return null
}
