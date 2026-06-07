from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_current_user
from app.models import CoverLetter, Document, InterviewSession, Profile as ProfileModel, User
from app.schemas import (
    AtsAnalysis,
    AtsSimulationOut,
    CoverLetterInput,
    CoverLetterOut,
    FieldAnswerInput,
    FieldAnswerOut,
    GhostRecruiterOut,
    InterviewAnswerInput,
    InterviewFeedbackOut,
    InterviewSessionOut,
    InterviewStartInput,
    InterviewStartOut,
    JobDescriptionInput,
    JobRefInput,
    PersonalAnalysisOut,
    PersonalizedLetterInput,
    PredictiveScoreOut,
    SalaryInput,
    SalaryInsightsOut,
    SkillSuggestionsOut,
    SuperCvInput,
    SuperCvOut,
)
from app.services import credit_service, job_fetch_service, llm_service

# In-memory ATS cache keyed by (job hash + profile version) per the plan's MVP note.
_ats_cache: dict[str, dict] = {}

router = APIRouter(tags=["ai"])


async def _profile_data(db: AsyncSession, user_id: str) -> dict:
    result = await db.execute(select(ProfileModel).where(ProfileModel.user_id == user_id))
    profile = result.scalar_one_or_none()
    return (profile.data if profile else {}) or {}


async def _charge(db: AsyncSession, user_id: str, action: str) -> None:
    """Spend the action's credit cost; 402 if the balance is insufficient."""
    cost = credit_service.AI_COSTS.get(action, 0)
    if cost <= 0:
        return
    acc = await credit_service.get_account(db, user_id)
    if not await credit_service.spend(db, acc, cost, f"ai_{action}"):
        raise HTTPException(
            status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Not enough credits — {action} costs {cost}, you have {acc.balance}.",
        )


@router.post("/ats/score", response_model=AtsAnalysis)
async def ats_score(
    body: JobDescriptionInput,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AtsAnalysis:
    profile = await _profile_data(db, user.id)
    key = f"{hash(body.jobDescription)}:{profile.get('version', 1)}:{body.language or ''}"
    if key in _ats_cache:
        return AtsAnalysis(**_ats_cache[key])
    result = await llm_service.score_ats_match(body.jobDescription, profile, body.language)
    _ats_cache[key] = result
    return AtsAnalysis(**result)


@router.post("/cover-letters/generate", response_model=CoverLetterOut)
async def generate_cover_letter(
    body: CoverLetterInput,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CoverLetterOut:
    await _charge(db, user.id, "cover_letter")
    profile = await _profile_data(db, user.id)
    text = await llm_service.generate_cover_letter(
        body.jobDescription, profile, body.tone, body.language
    )
    db.add(CoverLetter(user_id=user.id, tone=body.tone, text=text))
    await db.commit()
    return CoverLetterOut(text=text)


@router.post("/ai/super-cv", response_model=SuperCvOut)
async def super_cv(
    body: SuperCvInput,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SuperCvOut:
    await _charge(db, user.id, "super_cv")
    profile = await _profile_data(db, user.id)
    result = await llm_service.super_cv(
        profile, body.targetRole, body.jobDescription, body.cvText, body.language
    )
    doc = Document(
        user_id=user.id,
        filename=f"Super CV — {body.targetRole}",
        path="",
        kind="optimized_cv",
        parsed={"text": result["cvText"], "ats": result["atsScore"], "role": body.targetRole},
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return SuperCvOut(
        cvText=result["cvText"], atsScore=result["atsScore"], gaps=result["gaps"], documentId=doc.id
    )


@router.post("/ai/personal-analysis", response_model=PersonalAnalysisOut)
async def personal_analysis(
    language: str | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PersonalAnalysisOut:
    await _charge(db, user.id, "personal_analysis")
    profile = await _profile_data(db, user.id)
    res = await llm_service.personal_analysis(profile, language)
    # persist into the profile so it shows on the profile page
    row = (await db.execute(select(ProfileModel).where(ProfileModel.user_id == user.id))).scalar_one_or_none()
    if row is not None:
        data = dict(row.data or {})
        data["analysis"] = res
        row.data = data
        await db.commit()
    return PersonalAnalysisOut(**res)


@router.post("/ai/skill-suggestions", response_model=SkillSuggestionsOut)
async def skill_suggestions(
    language: str | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SkillSuggestionsOut:
    await _charge(db, user.id, "skill_suggestions")
    profile = await _profile_data(db, user.id)
    skills = await llm_service.skill_suggestions(profile, language)
    return SkillSuggestionsOut(skills=skills)


@router.post("/ai/cover-letter-pro", response_model=CoverLetterOut)
async def cover_letter_pro(
    body: PersonalizedLetterInput,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CoverLetterOut:
    """100%-personalized, from-scratch cover letter (higher credit cost)."""
    await _charge(db, user.id, "cover_letter_pro")
    profile = await _profile_data(db, user.id)
    text = await llm_service.personalized_cover_letter(
        profile, body.jobDescription, body.company, body.role, body.highlights, body.tone,
        body.language,
    )
    db.add(CoverLetter(user_id=user.id, tone=body.tone, text=text))
    await db.commit()
    return CoverLetterOut(text=text)


# --- Phase 2/3 — per-posting intelligence -------------------------------------


@router.post("/ai/predictive-score", response_model=PredictiveScoreOut)
async def predictive_score(
    body: JobRefInput,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PredictiveScoreOut:
    """Phase 2.4 — predicted chance of success for a posting, with fix-it guidance."""
    await _charge(db, user.id, "predictive_score")
    profile = await _profile_data(db, user.id)
    jd = await job_fetch_service.job_text_or_fallback(body.jobUrl, body.jobDescription)
    result = await llm_service.predictive_apply_score(jd, profile, body.language)
    return PredictiveScoreOut(**result)


@router.post("/ai/ats-simulate", response_model=AtsSimulationOut)
async def ats_simulate(
    language: str | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AtsSimulationOut:
    """Phase 2.3 — simulate how an ATS parses the CV: parse score + invisible errors."""
    await _charge(db, user.id, "ats_simulate")
    profile = await _profile_data(db, user.id)
    result = await llm_service.ats_simulate(profile, None, language)
    return AtsSimulationOut(**result)


@router.post("/ai/ghost-recruiter", response_model=GhostRecruiterOut)
async def ghost_recruiter(
    body: JobRefInput,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> GhostRecruiterOut:
    """Phase 3.1 — should you apply here? apply / caution / skip with honest reasons."""
    await _charge(db, user.id, "ghost_recruiter")
    profile = await _profile_data(db, user.id)
    jd = await job_fetch_service.job_text_or_fallback(body.jobUrl, body.jobDescription)
    result = await llm_service.ghost_recruiter(jd, profile, body.language)
    return GhostRecruiterOut(**result)


@router.post("/ai/salary-insights", response_model=SalaryInsightsOut)
async def salary_insights(
    body: SalaryInput,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SalaryInsightsOut:
    """Phase 3.3 — Job Copilot: salary range + negotiation guidance."""
    await _charge(db, user.id, "salary_insights")
    profile = await _profile_data(db, user.id)
    result = await llm_service.salary_insights(profile, body.role, body.region, body.language)
    return SalaryInsightsOut(**result)


@router.post("/ai/field-answer", response_model=FieldAnswerOut)
async def field_answer(
    body: FieldAnswerInput,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FieldAnswerOut:
    """Phase 1.4 — generate a smart, human-toned answer to one open application field."""
    await _charge(db, user.id, "field_answer")
    profile = await _profile_data(db, user.id)
    answer = await llm_service.smart_field_answer(
        profile, body.fieldLabel, body.jobDescription, body.language
    )
    return FieldAnswerOut(answer=answer)


# --- AI Interview -------------------------------------------------------------


@router.post("/ai/interview/start", response_model=InterviewStartOut)
async def interview_start(
    body: InterviewStartInput,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> InterviewStartOut:
    await _charge(db, user.id, "interview")
    profile = await _profile_data(db, user.id)
    # Phase 2.6 interview memory: pull weak-area notes from recent completed sessions
    # so the new question set reinforces where the user previously struggled.
    past = (
        await db.execute(
            select(InterviewSession)
            .where(InterviewSession.user_id == user.id, InterviewSession.feedback.isnot(None))
            .order_by(InterviewSession.created_at.desc())
            .limit(3)
        )
    ).scalars().all()
    history: list[str] = []
    for s in past:
        fb = s.feedback or {}
        if fb.get("summary"):
            history.append(str(fb["summary"]))
        for item in fb.get("perQuestion") or []:
            if isinstance(item, dict) and item.get("rating", 5) <= 2 and item.get("feedback"):
                history.append(str(item["feedback"]))
    questions = await llm_service.interview_questions(
        profile, body.role, body.jobDescription, body.kind, history or None, body.language
    )
    session = InterviewSession(
        user_id=user.id, role=body.role, kind=body.kind, questions=questions
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return InterviewStartOut(sessionId=session.id, questions=questions)


@router.post("/ai/interview/feedback", response_model=InterviewFeedbackOut)
async def interview_feedback(
    body: InterviewAnswerInput,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> InterviewFeedbackOut:
    session = await db.get(InterviewSession, body.sessionId)
    if not session or session.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Interview session not found")
    profile = await _profile_data(db, user.id)
    questions = list(session.questions or [])
    qa = list(zip(questions, body.answers + [""] * (len(questions) - len(body.answers))))
    result = await llm_service.interview_feedback(profile, session.role, qa, body.language)
    session.answers = body.answers
    session.feedback = result
    session.overall_score = result["overallScore"]
    await db.commit()
    return InterviewFeedbackOut(**result)


@router.get("/ai/interview/history", response_model=list[InterviewSessionOut])
async def interview_history(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> list[InterviewSessionOut]:
    rows = (
        await db.execute(
            select(InterviewSession)
            .where(InterviewSession.user_id == user.id)
            .order_by(InterviewSession.created_at.desc())
            .limit(30)
        )
    ).scalars().all()
    return [
        InterviewSessionOut(
            id=s.id,
            role=s.role,
            kind=s.kind,
            createdAt=s.created_at,
            questionCount=len(s.questions or []),
            overallScore=s.overall_score,
            completed=s.feedback is not None,
        )
        for s in rows
    ]
