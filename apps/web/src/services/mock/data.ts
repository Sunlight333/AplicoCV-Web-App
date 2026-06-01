import type {
  Application,
  DashboardStats,
  PortalCredential,
  Profile,
  Recommendation,
  User,
} from '@/types'

/**
 * In-memory mock database used when VITE_USE_MOCKS=true. It lets the entire
 * Phase 2 UI be exercised before the Phase 3 backend exists. State persists for
 * the lifetime of the tab (and selected slices are mirrored to localStorage so a
 * reload keeps you "logged in").
 */

const AUTH_KEY = 'aplicocv.mock.auth'

export const mockUser: User = {
  id: 'usr_001',
  email: 'demo@aplicocv.com',
  fullName: 'Alex Morgan',
  plan: 'free',
  onboarded: false,
  preferences: {
    targetRoles: ['Frontend Engineer'],
    seniority: 'mid',
    locations: ['Buenos Aires', 'Remote'],
    remote: 'remote',
    salaryMin: 45000,
    salaryCurrency: 'USD',
  },
}

export const emptyProfile: Profile = {
  personal: {
    fullName: 'Alex Morgan',
    headline: 'Frontend Engineer',
    email: 'demo@aplicocv.com',
    phone: '+54 11 5555 0100',
    location: 'Buenos Aires, AR',
    summary:
      'Frontend engineer with 5 years building accessible, performant React applications. Focused on design systems and developer experience.',
  },
  experience: [
    {
      id: 'exp_1',
      employer: 'Nimbus Labs',
      title: 'Senior Frontend Engineer',
      startDate: '2022-03',
      endDate: null,
      location: 'Remote',
      bullets: [
        'Led migration of a legacy Angular dashboard to React + Vite, cutting bundle size 40%.',
        'Built a shared component library adopted by 4 product teams.',
      ],
    },
    {
      id: 'exp_2',
      employer: 'Corteza',
      title: 'Frontend Engineer',
      startDate: '2019-06',
      endDate: '2022-02',
      location: 'Buenos Aires, AR',
      bullets: [
        'Shipped the customer onboarding flow that lifted activation 18%.',
        'Introduced visual regression testing across the marketing site.',
      ],
    },
  ],
  education: [
    {
      id: 'edu_1',
      institution: 'Universidad de Buenos Aires',
      degree: 'B.Sc. Computer Science',
      field: 'Computer Science',
      startDate: '2014',
      endDate: '2019',
    },
  ],
  skills: ['React', 'TypeScript', 'Tailwind CSS', 'Node.js', 'GraphQL', 'Testing'],
  languages: [
    { id: 'lang_1', language: 'Spanish', level: 'native' },
    { id: 'lang_2', language: 'English', level: 'professional' },
  ],
  links: [
    { id: 'lnk_1', label: 'GitHub', url: 'https://github.com/alexmorgan' },
    { id: 'lnk_2', label: 'Portfolio', url: 'https://alexmorgan.dev' },
  ],
  complementary: {
    workAuthorization: 'Argentine citizen',
    willingToRelocate: true,
    visaRequired: false,
    noticePeriod: '30 days',
    preferredStartDate: '2026-07-01',
  },
  version: 3,
}

export const mockApplications: Application[] = [
  {
    id: 'app_1',
    jobUrl: 'https://linkedin.com/jobs/1',
    portal: 'LinkedIn',
    jobTitle: 'Senior Frontend Engineer',
    company: 'Vercel',
    status: 'interview',
    appliedAt: '2026-05-20T10:00:00Z',
    cvVersionLabel: 'Tailored · Vercel',
    notes: 'Recruiter screen went well. Tech round scheduled.',
  },
  {
    id: 'app_2',
    jobUrl: 'https://workday.com/jobs/2',
    portal: 'Workday',
    jobTitle: 'React Developer',
    company: 'Globant',
    status: 'viewed',
    appliedAt: '2026-05-22T14:30:00Z',
  },
  {
    id: 'app_3',
    jobUrl: 'https://getonbrd.com/jobs/3',
    portal: 'Get on Board',
    jobTitle: 'Frontend Lead',
    company: 'Mercado Libre',
    status: 'applied',
    appliedAt: '2026-05-25T09:15:00Z',
  },
  {
    id: 'app_4',
    jobUrl: 'https://indeed.com/jobs/4',
    portal: 'Indeed',
    jobTitle: 'UI Engineer',
    company: 'Auth0',
    status: 'offer',
    appliedAt: '2026-05-10T11:00:00Z',
    cvVersionLabel: 'Default',
  },
  {
    id: 'app_5',
    jobUrl: 'https://computrabajo.com/jobs/5',
    portal: 'Computrabajo',
    jobTitle: 'Desarrollador Frontend',
    company: 'Despegar',
    status: 'rejected',
    appliedAt: '2026-04-28T16:45:00Z',
  },
]

export const mockStats: DashboardStats = {
  totalApplications: 42,
  responseRate: 0.31,
  interviews: 6,
  minutesSaved: 1260,
}

export const mockRecommendations: Recommendation[] = [
  {
    id: 'rec_1',
    jobTitle: 'Staff Frontend Engineer',
    company: 'Stripe',
    portal: 'Greenhouse',
    matchScore: 88,
    jobUrl: 'https://stripe.com/jobs/1',
    strategicNote:
      'Posted 3 days ago with low applicant volume. Strong keyword overlap on design systems.',
  },
  {
    id: 'rec_2',
    jobTitle: 'Senior React Engineer',
    company: 'Remote.com',
    portal: 'RemoteOK',
    matchScore: 79,
    jobUrl: 'https://remoteok.com/jobs/2',
  },
  {
    id: 'rec_3',
    jobTitle: 'Frontend Engineer (LATAM)',
    company: 'Toptal',
    portal: 'We Work Remotely',
    matchScore: 72,
    jobUrl: 'https://weworkremotely.com/jobs/3',
  },
]

export const mockCredentials: PortalCredential[] = [
  { id: 'cred_1', portal: 'LinkedIn', email: 'demo@aplicocv.com', syncStatus: 'verified' },
  { id: 'cred_2', portal: 'Workday', email: 'demo@aplicocv.com', syncStatus: 'unverified' },
]

export const persistedAuth = {
  load(): boolean {
    try {
      return localStorage.getItem(AUTH_KEY) === '1'
    } catch {
      return false
    }
  },
  save(loggedIn: boolean) {
    try {
      if (loggedIn) localStorage.setItem(AUTH_KEY, '1')
      else localStorage.removeItem(AUTH_KEY)
    } catch {
      /* ignore */
    }
  },
}
