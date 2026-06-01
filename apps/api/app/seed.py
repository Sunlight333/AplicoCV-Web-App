"""Seed reference data and a demo account so the app is usable immediately."""

from __future__ import annotations

from sqlalchemy import select

from app.db import SessionLocal
from app.models import (
    Application,
    Credential,
    PortalConfig,
    Profile,
    Recommendation,
    User,
)
from app.security import encrypt_secret, hash_password

PORTALS = [
    ("LinkedIn", "*.linkedin.com", {"name": "input[name='name']"}),
    ("Workday", "*.myworkdayjobs.com", {"name": "input[data-automation-id='legalNameSection_firstName']"}),
    ("Indeed", "*.indeed.com", {"name": "#input-applicant\\.name"}),
    ("Get on Board", "*.getonbrd.com", {"name": "#name"}),
    ("Computrabajo", "*.computrabajo.com", {"name": "#FirstName"}),
    ("Glassdoor", "*.glassdoor.com", {"name": "input[name='name']"}),
    ("Bumeran", "*.bumeran.com", {"name": "#nombre"}),
    ("Zonajobs", "*.zonajobs.com", {"name": "#nombre"}),
    ("Laborum", "*.laborum.com", {"name": "#nombre"}),
    ("Konzerta", "*.konzerta.com", {"name": "#nombre"}),
]

DEMO_PROFILE = {
    "personal": {
        "fullName": "Alex Morgan",
        "headline": "Frontend Engineer",
        "email": "demo@aplicocv.com",
        "phone": "+54 11 5555 0100",
        "location": "Buenos Aires, AR",
        "summary": "Frontend engineer with 5 years building accessible, performant React apps.",
    },
    "experience": [
        {
            "id": "exp_1", "employer": "Nimbus Labs", "title": "Senior Frontend Engineer",
            "startDate": "2022-03", "endDate": None, "location": "Remote",
            "bullets": ["Led migration to React + Vite, cutting bundle size 40%.",
                        "Built a shared component library adopted by 4 teams."],
        }
    ],
    "education": [],
    "skills": ["React", "TypeScript", "Tailwind CSS", "Node.js", "GraphQL", "Testing"],
    "languages": [{"id": "lang_1", "language": "Spanish", "level": "native"},
                  {"id": "lang_2", "language": "English", "level": "professional"}],
    "links": [{"id": "lnk_1", "label": "GitHub", "url": "https://github.com/alexmorgan"}],
    "complementary": {"workAuthorization": "Argentine citizen", "willingToRelocate": True},
    "version": 3,
}

DEMO_APPS = [
    ("https://linkedin.com/jobs/1", "LinkedIn", "Senior Frontend Engineer", "Vercel", "interview"),
    ("https://workday.com/jobs/2", "Workday", "React Developer", "Globant", "viewed"),
    ("https://getonbrd.com/jobs/3", "Get on Board", "Frontend Lead", "Mercado Libre", "applied"),
    ("https://indeed.com/jobs/4", "Indeed", "UI Engineer", "Auth0", "offer"),
    ("https://computrabajo.com/jobs/5", "Computrabajo", "Desarrollador Frontend", "Despegar", "rejected"),
]


async def seed() -> None:
    async with SessionLocal() as db:
        # Portal configs
        if not (await db.execute(select(PortalConfig))).first():
            for name, pattern, selectors in PORTALS:
                db.add(PortalConfig(name=name, domain_pattern=pattern, selectors=selectors))

        # Demo user (idempotent)
        existing = (
            await db.execute(select(User).where(User.email == "demo@aplicocv.com"))
        ).scalar_one_or_none()
        if existing is None:
            user = User(
                email="demo@aplicocv.com",
                full_name="Alex Morgan",
                hashed_password=hash_password("password123"),
                plan="premium",
                onboarded=True,
                preferences={
                    "targetRoles": ["Frontend Engineer"], "seniority": "mid",
                    "locations": ["Buenos Aires", "Remote"], "remote": "remote",
                    "salaryMin": 45000, "salaryCurrency": "USD",
                },
            )
            db.add(user)
            await db.flush()
            db.add(Profile(user_id=user.id, data=DEMO_PROFILE, version=3))
            for url, portal, title, company, status in DEMO_APPS:
                db.add(Application(
                    user_id=user.id, job_url=url, portal=portal,
                    job_title=title, company=company, status=status,
                ))
            db.add(Credential(
                user_id=user.id, portal="LinkedIn", email="demo@aplicocv.com",
                encrypted_password=encrypt_secret("demo-portal-pass"), sync_status="verified",
            ))
            db.add(Recommendation(
                user_id=user.id, job_title="Staff Frontend Engineer", company="Stripe",
                portal="Greenhouse", match_score=88, job_url="https://stripe.com/jobs/1",
                strategic_note="Posted 3 days ago with low applicant volume.",
            ))
        await db.commit()
