from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, EmailStr, Field

# --- Auth ---------------------------------------------------------------------


class RegisterInput(BaseModel):
    fullName: str = Field(min_length=2)
    email: EmailStr
    password: str = Field(min_length=8)


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class OnsiteLocation(BaseModel):
    """A preferred on-site city plus the candidate's work-authorization status there."""

    city: str
    citizenship: Literal[
        "citizen", "permanent_resident", "work_visa", "open_work_permit", "not_authorized"
    ] | None = None


class JobPreferences(BaseModel):
    # --- existing fields ---
    targetRoles: list[str] = []  # up to 5 desired roles
    seniority: Literal["intern", "junior", "mid", "senior", "lead", "principal"] = "mid"
    locations: list[str] = []
    remote: Literal["onsite", "hybrid", "remote", "any"] = "any"
    salaryMin: int | None = None
    salaryMax: int | None = None
    salaryCurrency: str | None = "USD"
    salaryPeriod: Literal["year", "month", "hour"] = "year"
    salaryType: Literal["gross", "net"] = "gross"
    availability: str | None = None  # "asap" | "next_week" | a date | ...
    workAuthorization: str | None = None  # visa / legal-status note
    industries: list[str] = []

    # --- Phase 2: expanded mandatory questionnaire ---
    employmentStatus: Literal[
        "unemployed", "unemployed_relaxed", "employed_seeking", "employed_open"
    ] | None = None
    # Salary in both local currency and USD (a local amount and a USD amount differ a lot).
    salaryLocalCurrency: str | None = None
    salaryLocalAmount: int | None = None
    salaryUsdAmount: int | None = None
    # Work modality (multi-select): part_time, full_time, remote.
    workModalities: list[str] = []
    # full_remote = anywhere in the world; onsite_hybrid = office near a city.
    remoteScope: Literal["full_remote", "onsite_hybrid"] | None = None
    remoteRegions: list[str] = []  # Europe, North America, ... , Worldwide
    onsiteLocations: list[OnsiteLocation] = []
    relocation: bool | None = None
    driverLicense: bool | None = None
    gender: str | None = None
    disability: bool | None = None
    disabilityAccommodation: str | None = None
    veteran: bool | None = None
    howDidYouHear: str | None = None  # default answer for "how did you hear" fields
    # Default acceptances applied during autofill (reduce empty fields / errors).
    workedHereBefore: bool = False
    knowsSomeoneHere: bool = False
    acceptDataPolicy: bool = True
    # Autonomous assistant (Phase 8): email a digest of new high-match jobs while
    # offline; autoApply lets the ALPHA agent queue strong matches for review.
    emailDigest: bool = False
    autoApply: bool = False
    # The generated CV the user marks as their default to apply with (Phase 4).
    defaultCvId: str | None = None


class UserOut(BaseModel):
    id: str
    email: EmailStr
    fullName: str
    avatarUrl: str | None = None
    plan: Literal["free", "premium"]
    onboarded: bool
    preferences: JobPreferences
    # False for accounts created via Google that have not set a password yet.
    hasPassword: bool = False
    # Premium unlocked (paid OR within the free trial window).
    premiumActive: bool = False
    # On the free trial right now (premium unlocked but not paying).
    onTrial: bool = False
    # ISO timestamp the trial ends; null for paying members.
    trialEndsAt: str | None = None


class AuthResponse(BaseModel):
    accessToken: str
    user: UserOut


class RefreshResponse(BaseModel):
    accessToken: str


class SetPasswordInput(BaseModel):
    # Omitted/None when the account has no password yet (e.g. Google sign-up).
    currentPassword: str | None = None
    newPassword: str = Field(min_length=8)


class ForgotPasswordInput(BaseModel):
    email: EmailStr


class ResetPasswordInput(BaseModel):
    token: str
    newPassword: str = Field(min_length=8)


# --- Profile ------------------------------------------------------------------


class PersonalInfo(BaseModel):
    fullName: str = ""
    headline: str = ""
    email: str = ""
    phone: str | None = None
    location: str | None = None
    summary: str = ""


class WorkExperience(BaseModel):
    id: str
    employer: str
    title: str
    startDate: str
    endDate: str | None = None
    location: str | None = None
    bullets: list[str] = []


# Standardized degree levels so the autofill can map to a job site's dropdown
# (e.g. "Master" vs "Master's Degree") instead of relying on free-text.
DegreeLevel = Literal[
    "secondary", "certificate", "associate", "bachelor", "master", "doctorate", "other"
]


class Education(BaseModel):
    id: str
    institution: str
    degree: str  # free-text title, e.g. "BSc Computer Science"
    degreeLevel: DegreeLevel | None = None  # standardized level for autofill
    field: str | None = None
    startDate: str
    endDate: str | None = None


LanguageLevel = Literal[
    "basic", "conversational", "professional", "advanced", "native", "bilingual"
]


class LanguageSkill(BaseModel):
    id: str
    language: str
    level: LanguageLevel
    # Optional per-skill levels — many forms ask oral/written/reading separately.
    oral: LanguageLevel | None = None
    written: LanguageLevel | None = None
    reading: LanguageLevel | None = None
    native: bool | None = None


class ProfileLink(BaseModel):
    id: str
    label: str
    url: str


class ComplementaryInfo(BaseModel):
    workAuthorization: str | None = None
    willingToRelocate: bool | None = None
    visaRequired: bool | None = None
    noticePeriod: str | None = None
    preferredStartDate: str | None = None


class Certification(BaseModel):
    id: str
    name: str
    issuer: str | None = None
    year: str | None = None
    credentialUrl: str | None = None


class ProjectItem(BaseModel):
    id: str
    name: str
    description: str | None = None
    url: str | None = None
    skills: list[str] = []


class Profile(BaseModel):
    personal: PersonalInfo = PersonalInfo()
    experience: list[WorkExperience] = []
    education: list[Education] = []
    skills: list[str] = []
    skillsToAvoid: list[str] = []  # technologies/roles the candidate wants to avoid
    languages: list[LanguageSkill] = []
    links: list[ProfileLink] = []
    certifications: list[Certification] = []
    projects: list[ProjectItem] = []
    baseCoverLetter: str = ""  # reusable letter the AI personalizes per posting
    complementary: ComplementaryInfo = ComplementaryInfo()
    analysis: dict[str, Any] | None = None  # cached personal-analysis result
    version: int = 1


# --- Applications -------------------------------------------------------------

ApplicationStatus = Literal["applied", "viewed", "interview", "offer", "rejected"]


class ApplicationCreate(BaseModel):
    jobUrl: str
    portal: str
    jobTitle: str
    company: str
    jobDescription: str | None = None


class ApplicationOut(BaseModel):
    id: str
    jobUrl: str
    portal: str
    jobTitle: str
    company: str
    status: ApplicationStatus
    appliedAt: datetime
    cvVersionLabel: str | None = None
    coverLetter: str | None = None
    jobDescription: str | None = None
    notes: str | None = None


class StatusUpdate(BaseModel):
    status: ApplicationStatus


class NotesUpdate(BaseModel):
    notes: str


class DashboardStats(BaseModel):
    totalApplications: int
    responseRate: float
    interviews: int
    minutesSaved: int
    applicationsThisMonth: int = 0
    monthlyLimit: int | None = None  # None = unlimited (premium/trial)


# --- AI -----------------------------------------------------------------------


class AtsAnalysis(BaseModel):
    matchScore: int
    matchedKeywords: list[str]
    missingKeywords: list[str]
    qualification: Literal["underqualified", "strong match", "overqualified"]
    recommendations: list[str]


class JobDescriptionInput(BaseModel):
    jobDescription: str
    language: str | None = None  # UI locale so the AI replies in the user's language


class CoverLetterInput(BaseModel):
    jobDescription: str
    tone: Literal["professional", "warm", "direct"] = "professional"
    language: str | None = None


class CoverLetterOut(BaseModel):
    text: str


class SuperCvInput(BaseModel):
    targetRole: str
    jobDescription: str | None = None
    cvText: str | None = None  # paste an alternative CV; else use the system profile
    language: str | None = None


class SuperCvOut(BaseModel):
    cvText: str
    atsScore: int
    gaps: list[str]
    documentId: str


class PersonalAnalysisOut(BaseModel):
    strengths: list[str]
    weaknesses: str
    motivation: str


class SkillSuggestionsOut(BaseModel):
    skills: list[str]


class PersonalizedLetterInput(BaseModel):
    jobDescription: str
    company: str | None = None
    role: str | None = None
    highlights: str | None = None  # what the candidate wants to emphasize
    tone: Literal["professional", "warm", "direct"] = "professional"
    language: str | None = None


# --- AI Interview -------------------------------------------------------------


class InterviewStartInput(BaseModel):
    role: str
    jobDescription: str | None = None
    kind: Literal["behavioral", "technical", "mixed"] = "mixed"
    language: str | None = None


class InterviewStartOut(BaseModel):
    sessionId: str
    questions: list[str]


class InterviewAnswerInput(BaseModel):
    sessionId: str
    answers: list[str]
    language: str | None = None


class InterviewQuestionFeedback(BaseModel):
    question: str
    answer: str
    rating: int  # 1-5
    feedback: str


class InterviewFeedbackOut(BaseModel):
    overallScore: int  # 0-100
    summary: str
    perQuestion: list[InterviewQuestionFeedback]


class InterviewSessionOut(BaseModel):
    id: str
    role: str
    kind: str
    createdAt: datetime
    questionCount: int
    overallScore: int | None = None
    completed: bool


class GeneratedDoc(BaseModel):
    id: str
    title: str
    createdAt: datetime
    preview: str
    atsScore: int | None = None


class DocumentLibrary(BaseModel):
    cvs: list[GeneratedDoc]
    letters: list[GeneratedDoc]


class LocalizeInput(BaseModel):
    language: str
    region: str | None = None


# --- Phase 2/3 — predictive score, ATS simulator, copilot, ghost recruiter ----


class JobRefInput(BaseModel):
    """A posting referenced by pasted text and/or a URL the server can fetch."""

    jobDescription: str | None = None
    jobUrl: str | None = None
    language: str | None = None


class FitBreakdown(BaseModel):
    skills: int
    seniority: int
    location: int


class PredictiveScoreOut(BaseModel):
    successProbability: int
    fitBreakdown: FitBreakdown
    missingSkills: list[str]
    keywordsToAdd: list[str]
    overqualified: bool
    atsPass: bool
    advice: str


class AtsSimulationOut(BaseModel):
    parseScore: int
    sectionsDetected: list[str]
    likelyDropped: list[str]
    formattingIssues: list[str]
    invisibleErrors: list[str]
    summary: str


class GhostRecruiterOut(BaseModel):
    verdict: Literal["apply", "caution", "skip"]
    reasons: list[str]
    betterFitNote: str | None = None


class SalaryInput(BaseModel):
    role: str
    region: str | None = None
    language: str | None = None


class SalaryInsightsOut(BaseModel):
    role: str
    estimatedRange: str
    currency: str = "USD"
    negotiationPoints: list[str]
    marketNote: str


class FieldAnswerInput(BaseModel):
    fieldLabel: str
    jobDescription: str | None = None
    language: str | None = None


class FieldAnswerOut(BaseModel):
    answer: str


# --- Phase 3/4 — insights: scam detection, burnout, market heatmap ------------


class ScamCheckInput(BaseModel):
    jobTitle: str | None = None
    company: str | None = None
    jobDescription: str | None = None
    jobUrl: str | None = None


class ScamCheckOut(BaseModel):
    riskLevel: Literal["low", "medium", "high"]
    riskScore: int  # 0-100
    signals: list[str]
    advice: str


class BurnoutOut(BaseModel):
    level: Literal["healthy", "elevated", "high"]
    score: int  # 0-100, higher = more strain
    applicationsLast7Days: int
    responseRate: float
    signals: list[str]
    suggestions: list[str]


class MarketStat(BaseModel):
    label: str
    value: int


class MarketHeatmapOut(BaseModel):
    topSkills: list[MarketStat]
    topCompanies: list[MarketStat]
    topPortals: list[MarketStat]
    remoteShare: int  # percent
    sampleSize: int
    insight: str


# --- Phase 1.3 — assisted apply queue -----------------------------------------


class ApplyRequestInput(BaseModel):
    recommendationId: str | None = None
    jobUrl: str
    portal: str
    jobTitle: str
    company: str
    jobDescription: str | None = None
    autoTailor: bool = True


class ApplyTaskOut(BaseModel):
    id: str
    jobUrl: str
    portal: str
    jobTitle: str
    company: str
    status: Literal["queued", "prepared", "submitted", "dismissed", "error"]
    cvVersionLabel: str | None = None
    coverLetter: str | None = None
    matchScore: int | None = None
    createdAt: datetime


# --- Credentials --------------------------------------------------------------


class CredentialCreate(BaseModel):
    portal: str
    email: EmailStr
    password: str


class CredentialOut(BaseModel):
    id: str
    portal: str
    email: EmailStr
    syncStatus: Literal["unverified", "verified", "invalid"]


class DecryptedCredential(BaseModel):
    portal: str
    email: str
    password: str


# --- Recommendations / portals / operations ----------------------------------


class RecommendationOut(BaseModel):
    id: str
    jobTitle: str
    company: str
    portal: str
    matchScore: int
    jobUrl: str
    strategicNote: str | None = None


class PortalConfigOut(BaseModel):
    name: str
    domainPattern: str
    selectors: dict[str, Any]
    quirks: str | None = None
    logoUrl: str | None = None


class OperationOut(BaseModel):
    id: str
    kind: str
    status: Literal["pending", "completed", "error"]
    result: dict[str, Any] | None = None


# --- Referrals ----------------------------------------------------------------


class ReferralOut(BaseModel):
    code: str
    link: str
    referredCount: int
    earned: int
    reward: int


class RedeemInput(BaseModel):
    code: str


class RedeemOut(BaseModel):
    ok: bool
    amount: int = 0
    message: str


# --- Billing ------------------------------------------------------------------


class CheckoutOut(BaseModel):
    url: str


class PlanOut(BaseModel):
    id: str
    name: str
    price: float
    currency: str = "USD"
    interval: Literal["month", "year", "once"]
    credits: int | None = None
    features: list[str]
    highlighted: bool = False
    kind: Literal["subscription", "credits"]
    current: bool = False


class CreditPackInput(BaseModel):
    pack: str  # id of a "credits" PlanOut
