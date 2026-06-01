import pytest

pytestmark = pytest.mark.asyncio


async def test_health(client):
    res = await client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


async def test_register_login_me(client):
    reg = await client.post(
        "/api/auth/register",
        json={"fullName": "Ada Lovelace", "email": "ada@example.com", "password": "password123"},
    )
    assert reg.status_code == 200
    assert reg.json()["user"]["email"] == "ada@example.com"

    login = await client.post(
        "/api/auth/login", json={"email": "ada@example.com", "password": "password123"}
    )
    assert login.status_code == 200
    token = login.json()["accessToken"]

    me = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["fullName"] == "Ada Lovelace"


async def test_login_wrong_password(client):
    await client.post(
        "/api/auth/register",
        json={"fullName": "Bob", "email": "bob@example.com", "password": "password123"},
    )
    bad = await client.post(
        "/api/auth/login", json={"email": "bob@example.com", "password": "wrongpass"}
    )
    assert bad.status_code == 401


async def test_requires_auth(client):
    res = await client.get("/api/auth/me")
    assert res.status_code == 401


async def test_duplicate_email_conflict(client):
    payload = {"fullName": "Dup", "email": "dup@example.com", "password": "password123"}
    assert (await client.post("/api/auth/register", json=payload)).status_code == 200
    assert (await client.post("/api/auth/register", json=payload)).status_code == 409


async def test_profile_patch_and_skills(auth_client):
    # New users start with an empty profile.
    res = await auth_client.get("/api/profiles/me")
    assert res.status_code == 200
    base_version = res.json()["version"]

    patched = await auth_client.patch(
        "/api/profiles/me",
        json={"personal": {"fullName": "Test User", "headline": "Engineer", "email": "t@e.com", "summary": ""}},
    )
    assert patched.status_code == 200
    assert patched.json()["personal"]["headline"] == "Engineer"
    assert patched.json()["version"] > base_version

    skills = await auth_client.patch("/api/profiles/me/skills", json={"skills": ["React", "React", "Python"]})
    assert skills.status_code == 200
    assert skills.json()["skills"] == ["React", "Python"]  # de-duplicated


async def test_applications_crud_and_stats(auth_client):
    created = await auth_client.post(
        "/api/applications",
        json={"jobUrl": "https://x.com/1", "portal": "LinkedIn", "jobTitle": "Eng", "company": "Acme"},
    )
    assert created.status_code == 201
    app_id = created.json()["id"]
    assert created.json()["status"] == "applied"

    moved = await auth_client.patch(f"/api/applications/{app_id}/status", json={"status": "interview"})
    assert moved.status_code == 200
    assert moved.json()["status"] == "interview"

    noted = await auth_client.patch(f"/api/applications/{app_id}", json={"notes": "Call Monday"})
    assert noted.json()["notes"] == "Call Monday"

    stats = await auth_client.get("/api/applications/stats")
    assert stats.json()["totalApplications"] == 1
    assert stats.json()["interviews"] == 1


async def test_application_filters(auth_client):
    """Regression: the frontend sends ?status= and ?portal=; both must filter."""
    for url, portal, st in [
        ("https://a/1", "LinkedIn", "applied"),
        ("https://a/2", "Workday", "interview"),
    ]:
        created = await auth_client.post(
            "/api/applications",
            json={"jobUrl": url, "portal": portal, "jobTitle": "Eng", "company": "Acme"},
        )
        await auth_client.patch(f"/api/applications/{created.json()['id']}/status", json={"status": st})

    all_apps = await auth_client.get("/api/applications")
    assert len(all_apps.json()) == 2

    by_status = await auth_client.get("/api/applications?status=interview")
    assert [a["status"] for a in by_status.json()] == ["interview"]

    by_portal = await auth_client.get("/api/applications?portal=LinkedIn")
    assert [a["portal"] for a in by_portal.json()] == ["LinkedIn"]


async def test_ats_score(auth_client):
    await auth_client.patch("/api/profiles/me/skills", json={"skills": ["react", "typescript"]})
    res = await auth_client.post(
        "/api/ats/score",
        json={"jobDescription": "We need a react and typescript engineer with graphql"},
    )
    assert res.status_code == 200
    body = res.json()
    assert 0 <= body["matchScore"] <= 100
    assert "react" in body["matchedKeywords"]


async def test_cover_letter(auth_client):
    res = await auth_client.post(
        "/api/cover-letters/generate",
        json={"jobDescription": "Senior engineer role", "tone": "warm"},
    )
    assert res.status_code == 200
    assert len(res.json()["text"]) > 50


async def test_credentials_roundtrip_never_returns_password(auth_client):
    saved = await auth_client.post(
        "/api/credentials",
        json={"portal": "LinkedIn", "email": "me@example.com", "password": "s3cret-pw"},
    )
    assert saved.status_code == 200
    assert "password" not in saved.json()  # ciphertext never surfaced

    listed = await auth_client.get("/api/credentials")
    assert len(listed.json()) == 1

    # Decrypt endpoint returns the original plaintext (server-side key).
    dec = await auth_client.post("/api/credentials/decrypt?portal=LinkedIn")
    assert dec.status_code == 200
    assert dec.json()["password"] == "s3cret-pw"

    cred_id = listed.json()[0]["id"]
    deleted = await auth_client.delete(f"/api/credentials/{cred_id}")
    assert deleted.status_code == 200
    assert (await auth_client.get("/api/credentials")).json() == []


async def test_premium_gate_on_tailor(auth_client):
    # Free user cannot tailor (premium-gated).
    res = await auth_client.post("/api/profiles/tailor", json={"jobDescription": "react role"})
    assert res.status_code == 402


async def test_portals_seeded(client):
    res = await client.get("/api/portals/configs")
    assert res.status_code == 200
    names = {p["name"] for p in res.json()}
    assert "LinkedIn" in names and "Workday" in names
