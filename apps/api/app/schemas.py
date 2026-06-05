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


class JobPreferences(BaseModel):
    targetRoles: list[str] = []
    seniority: Literal["intern", "junior", "mid", "senior", "lead", "principal"] = "mid"
    locations: list[str] = []
    remote: Literal["onsite", "hybrid", "remote", "any"] = "any"
    salaryMin: int | None = None
    salaryCurrency: str | None = "USD"


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


class Education(BaseModel):
    id: str
    institution: str
    degree: str
    field: str | None = None
    startDate: str
    endDate: str | None = None


class LanguageSkill(BaseModel):
    id: str
    language: str
    level: Literal["basic", "conversational", "professional", "native"]


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


class Profile(BaseModel):
    personal: PersonalInfo = PersonalInfo()
    experience: list[WorkExperience] = []
    education: list[Education] = []
    skills: list[str] = []
    languages: list[LanguageSkill] = []
    links: list[ProfileLink] = []
    complementary: ComplementaryInfo = ComplementaryInfo()
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


# --- AI -----------------------------------------------------------------------


class AtsAnalysis(BaseModel):
    matchScore: int
    matchedKeywords: list[str]
    missingKeywords: list[str]
    qualification: Literal["underqualified", "strong match", "overqualified"]
    recommendations: list[str]


class JobDescriptionInput(BaseModel):
    jobDescription: str


class CoverLetterInput(BaseModel):
    jobDescription: str
    tone: Literal["professional", "warm", "direct"] = "professional"


class CoverLetterOut(BaseModel):
    text: str


class SuperCvInput(BaseModel):
    targetRole: str
    jobDescription: str | None = None
    cvText: str | None = None  # paste an alternative CV; else use the system profile


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


# --- Billing ------------------------------------------------------------------


class CheckoutOut(BaseModel):
    url: str
