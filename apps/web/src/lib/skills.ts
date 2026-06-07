// Lightweight skill normalization (Phase 3.2). When a user types a misspelled or
// loosely-worded skill ("Business Developtem"), we suggest the closest canonical
// name ("Business Development") via edit distance. No network call needed.

const CANONICAL = [
  // Business / commercial
  'Business Development', 'Sales', 'Account Management', 'Key Account Management',
  'Marketing', 'Digital Marketing', 'Product Management', 'Project Management',
  'Operations', 'Supply Chain', 'Logistics', 'Procurement', 'Negotiation',
  'Customer Success', 'Customer Service', 'Business Analysis', 'Strategy',
  'Finance', 'Accounting', 'Financial Analysis', 'Controlling', 'Auditing',
  'Human Resources', 'Recruiting', 'Talent Acquisition', 'Leadership',
  'Team Management', 'Stakeholder Management', 'Communication', 'Public Speaking',
  // Tech
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'Go', 'Ruby', 'PHP',
  'React', 'Angular', 'Vue', 'Node.js', 'Next.js', 'Django', 'Flask', 'Spring',
  'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'GraphQL', 'REST', 'AWS',
  'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'Git',
  'Linux', 'Data Analysis', 'Data Science', 'Machine Learning', 'Power BI',
  'Tableau', 'Excel', 'SAP', 'Salesforce', 'HubSpot', 'Figma', 'UX Design',
  'UI Design', 'Product Design', 'Agile', 'Scrum', 'Kanban',
  // Languages (as skills)
  'English', 'Spanish', 'Portuguese', 'French', 'German',
]

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (!m) return n
  if (!n) return m
  const prev = new Array(n + 1)
  const curr = new Array(n + 1)
  for (let j = 0; j <= n; j++) prev[j] = j
  for (let i = 1; i <= m; i++) {
    curr[0] = i
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j]
  }
  return prev[n]
}

/** Return a canonical skill suggestion if the input looks like a near-miss, else null. */
export function suggestSkill(input: string): string | null {
  const q = input.trim().toLowerCase()
  if (q.length < 3) return null
  let best: string | null = null
  let bestRatio = 0
  for (const c of CANONICAL) {
    const cl = c.toLowerCase()
    if (cl === q) return null // already canonical
    const dist = levenshtein(q, cl)
    const ratio = 1 - dist / Math.max(q.length, cl.length)
    if (ratio > bestRatio) {
      bestRatio = ratio
      best = c
    }
  }
  // Only suggest a confident, non-identical match.
  return best && bestRatio >= 0.7 ? best : null
}
