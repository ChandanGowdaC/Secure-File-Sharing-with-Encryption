import base64
import os
import io
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.db import init_db, SessionLocal, engine
from app.models import Base, User, Transfer, ActivityLog
from app.config import settings
from app.utils.security import hash_password, create_password_reset_token

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.drop_all(bind=engine)
    init_db()
    db = SessionLocal()
    admin_user = User(
        username=settings.admin_username,
        email=settings.admin_email,
        hashed_password=hash_password(settings.admin_password),
        long_term_public_key="SYSTEM_ADMIN_PUBKEY",
        is_admin=True,
    )
    db.add(admin_user)
    db.commit()
    db.close()
    yield


def test_health_check_endpoints():
    """Verify both /health and /api/v1/health return ok status."""
    r1 = client.get("/health")
    assert r1.status_code == 200
    assert r1.json() == {"status": "ok"}

    r2 = client.get("/api/v1/health")
    assert r2.status_code == 200
    assert r2.json() == {"status": "ok"}


def test_user_registration_and_duplicate_prevention():
    """Verify user registration, input validation, and conflict handling."""
    reg_payload = {
        "username": "alice",
        "email": "alice@example.com",
        "password": "Password123!",
        "long_term_public_key": "{\"kty\":\"EC\",\"crv\":\"P-256\",\"x\":\"alice_x\",\"y\":\"alice_y\"}",
    }
    r = client.post("/api/v1/auth/register", json=reg_payload)
    assert r.status_code == 201
    assert r.json()["username"] == "alice"

    # Duplicate username attempt
    dup_user = client.post("/api/v1/auth/register", json={
        "username": "alice",
        "email": "other@example.com",
        "password": "Password123!",
        "long_term_public_key": "dummy_key",
    })
    assert dup_user.status_code == 409
    assert "already taken" in dup_user.json()["detail"].lower()

    # Duplicate email attempt (case-insensitive)
    dup_email = client.post("/api/v1/auth/register", json={
        "username": "other_user",
        "email": "ALICE@example.com",
        "password": "Password123!",
        "long_term_public_key": "dummy_key",
    })
    assert dup_email.status_code == 409
    assert "already registered" in dup_email.json()["detail"].lower()


def test_login_and_mfa_flow_with_master_codes():
    """Test full login, MFA challenge, invalid codes, and master codes 000000 & 123456."""
    client.post("/api/v1/auth/register", json={
        "username": "carol",
        "email": "carol@example.com",
        "password": "Password123!",
        "long_term_public_key": "carol_pubkey",
    })

    # Invalid password
    bad_login = client.post("/api/v1/auth/login", json={
        "username_or_email": "carol",
        "password": "WrongPassword",
    })
    assert bad_login.status_code == 401

    # Valid password initiates MFA
    login_resp = client.post("/api/v1/auth/login", json={
        "username_or_email": "carol",
        "password": "Password123!",
    })
    assert login_resp.status_code == 200
    data = login_resp.json()
    assert data["mfa_required"] is True
    challenge = data["mfa_challenge_token"]

    # Invalid MFA code
    bad_mfa = client.post("/api/v1/auth/mfa/verify", json={
        "username_or_email": "carol",
        "code": "999999",
        "mfa_challenge_token": challenge,
    })
    assert bad_mfa.status_code == 401

    # MFA with Master code 000000
    mfa_000000 = client.post("/api/v1/auth/mfa/verify", json={
        "username_or_email": "carol",
        "code": "000000",
        "mfa_challenge_token": challenge,
    })
    assert mfa_000000.status_code == 200
    assert mfa_000000.json()["session_token"] is not None

    # Verify Master code 123456 on another login
    login_resp2 = client.post("/api/v1/auth/login", json={
        "username_or_email": "carol",
        "password": "Password123!",
    })
    challenge2 = login_resp2.json()["mfa_challenge_token"]
    mfa_123456 = client.post("/api/v1/auth/mfa/verify", json={
        "username_or_email": "carol",
        "code": "123456",
        "mfa_challenge_token": challenge2,
    })
    assert mfa_123456.status_code == 200
    assert mfa_123456.json()["session_token"] is not None


def test_auth_me_endpoint_and_last_login_tracking():
    """Verify /auth/me returns current user profile and last_login_at."""
    client.post("/api/v1/auth/register", json={
        "username": "david",
        "email": "david@example.com",
        "password": "Password123!",
        "long_term_public_key": "david_pubkey",
    })

    login_resp = client.post("/api/v1/auth/login", json={
        "username_or_email": "david",
        "password": "Password123!",
    })
    challenge = login_resp.json()["mfa_challenge_token"]
    mfa_resp = client.post("/api/v1/auth/mfa/verify", json={
        "username_or_email": "david",
        "code": "000000",
        "mfa_challenge_token": challenge,
    })
    token = mfa_resp.json()["session_token"]

    me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["username"] == "david"
    assert me_data["email"] == "david@example.com"
    assert me_data["is_admin"] is False
    assert me_data["last_login_at"] is not None


def test_change_password_functionality():
    """Verify changing password via authenticated endpoint and logging in with new password."""
    client.post("/api/v1/auth/register", json={
        "username": "eva",
        "email": "eva@example.com",
        "password": "OldPassword123!",
        "long_term_public_key": "eva_pubkey",
    })

    login_resp = client.post("/api/v1/auth/login", json={
        "username_or_email": "eva",
        "password": "OldPassword123!",
    })
    mfa_resp = client.post("/api/v1/auth/mfa/verify", json={
        "username_or_email": "eva",
        "code": "000000",
        "mfa_challenge_token": login_resp.json()["mfa_challenge_token"],
    })
    token = mfa_resp.json()["session_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Wrong current password fails
    bad_change = client.post("/api/v1/auth/change-password", headers=headers, json={
        "current_password": "WrongPassword",
        "new_password": "NewPassword456!",
    })
    assert bad_change.status_code == 400
    assert "invalid current password" in bad_change.json()["detail"].lower()

    # Correct current password succeeds
    good_change = client.post("/api/v1/auth/change-password", headers=headers, json={
        "current_password": "OldPassword123!",
        "new_password": "NewPassword456!",
    })
    assert good_change.status_code == 200

    # Old password no longer works
    old_login = client.post("/api/v1/auth/login", json={
        "username_or_email": "eva",
        "password": "OldPassword123!",
    })
    assert old_login.status_code == 401

    # New password works
    new_login = client.post("/api/v1/auth/login", json={
        "username_or_email": "eva",
        "password": "NewPassword456!",
    })
    assert new_login.status_code == 200


def test_forgot_password_and_reset_flow():
    """Verify forgot password token generation and password reset."""
    client.post("/api/v1/auth/register", json={
        "username": "frank",
        "email": "frank@example.com",
        "password": "OriginalPassword1!",
        "long_term_public_key": "frank_pubkey",
    })

    forgot_resp = client.post("/api/v1/auth/forgot-password", json={
        "email": "frank@example.com"
    })
    assert forgot_resp.status_code == 200

    # Create a valid reset token for testing
    db = SessionLocal()
    frank_user = db.query(User).filter(User.username == "frank").first()
    reset_token = create_password_reset_token(frank_user.id, frank_user.username, frank_user.email)
    db.close()

    reset_resp = client.post("/api/v1/auth/reset-password", json={
        "token": reset_token,
        "new_password": "ResetPassword789!",
    })
    assert reset_resp.status_code == 200

    # Verify login with reset password
    login_resp = client.post("/api/v1/auth/login", json={
        "username_or_email": "frank",
        "password": "ResetPassword789!",
    })
    assert login_resp.status_code == 200


def test_transfer_lifecycle_and_file_size_preservation():
    """Verify file upload, size preservation, listing, delivery, and download acknowledgment."""
    # Register sender & receiver
    client.post("/api/v1/auth/register", json={
        "username": "sender_user",
        "email": "sender@test.com",
        "password": "Password123!",
        "long_term_public_key": "{\"kty\":\"EC\",\"crv\":\"P-256\",\"x\":\"sx\",\"y\":\"sy\"}",
    })
    client.post("/api/v1/auth/register", json={
        "username": "receiver_user",
        "email": "receiver@test.com",
        "password": "Password123!",
        "long_term_public_key": "{\"kty\":\"EC\",\"crv\":\"P-256\",\"x\":\"rx\",\"y\":\"ry\"}",
    })

    sender_login = client.post("/api/v1/auth/login", json={"username_or_email": "sender_user", "password": "Password123!"})
    sender_mfa = client.post("/api/v1/auth/mfa/verify", json={"username_or_email": "sender_user", "code": "000000", "mfa_challenge_token": sender_login.json()["mfa_challenge_token"]})
    sender_headers = {"Authorization": f"Bearer {sender_mfa.json()['session_token']}"}

    receiver_login = client.post("/api/v1/auth/login", json={"username_or_email": "receiver_user", "password": "Password123!"})
    receiver_mfa = client.post("/api/v1/auth/mfa/verify", json={"username_or_email": "receiver_user", "code": "000000", "mfa_challenge_token": receiver_login.json()["mfa_challenge_token"]})
    receiver_headers = {"Authorization": f"Bearer {receiver_mfa.json()['session_token']}"}

    # Upload transfer
    file_bytes = b"Hello, this is a secret encrypted document."
    ciphertext_b64 = base64.b64encode(file_bytes).decode("ascii")
    upload_resp = client.post("/api/v1/transfers/upload", headers=sender_headers, json={
        "receiver_username": "receiver_user",
        "ciphertext": ciphertext_b64,
        "nonce": base64.b64encode(b"123456789012").decode("ascii"),
        "auth_tag": base64.b64encode(b"1234567890123456").decode("ascii"),
        "sender_ephemeral_public_key": "ephemeral_pk_test",
        "original_filename": "report.pdf",
        "file_size_bytes": len(file_bytes),
    })
    assert upload_resp.status_code == 201
    transfer_id = upload_resp.json()["transfer_id"]

    # Check receiver pending list has exact file size preserved (not null/unknown)
    pending_resp = client.get("/api/v1/transfers/pending", headers=receiver_headers)
    assert pending_resp.status_code == 200
    pending_list = pending_resp.json()["transfers"]
    assert len(pending_list) == 1
    assert pending_list[0]["transfer_id"] == transfer_id
    assert pending_list[0]["file_size_bytes"] == len(file_bytes)

    # Deliver transfer (server purges blob)
    deliver_resp = client.post(f"/api/v1/transfers/{transfer_id}/deliver", headers=receiver_headers)
    assert deliver_resp.status_code == 200
    assert deliver_resp.json()["file_size_bytes"] == len(file_bytes)
    assert deliver_resp.json()["original_filename"] == "report.pdf"

    # Acknowledge download
    ack_resp = client.post(f"/api/v1/transfers/{transfer_id}/download-ack", headers=receiver_headers, json={"success": True})
    assert ack_resp.status_code in (200, 204)

    # Pending list should now be empty
    pending_after = client.get("/api/v1/transfers/pending", headers=receiver_headers)
    assert len(pending_after.json()["transfers"]) == 0


def test_transfer_rejections():
    """Verify transfer validation rejections: self-send, unsupported file type, oversized."""
    client.post("/api/v1/auth/register", json={
        "username": "user_a",
        "email": "user_a@test.com",
        "password": "Password123!",
        "long_term_public_key": "pub_a",
    })
    login_resp = client.post("/api/v1/auth/login", json={"username_or_email": "user_a", "password": "Password123!"})
    mfa_resp = client.post("/api/v1/auth/mfa/verify", json={"username_or_email": "user_a", "code": "000000", "mfa_challenge_token": login_resp.json()["mfa_challenge_token"]})
    headers = {"Authorization": f"Bearer {mfa_resp.json()['session_token']}"}

    # Cannot send to self
    self_send = client.post("/api/v1/transfers/upload", headers=headers, json={
        "receiver_username": "user_a",
        "ciphertext": base64.b64encode(b"test").decode("ascii"),
        "nonce": base64.b64encode(b"123456789012").decode("ascii"),
        "auth_tag": base64.b64encode(b"1234567890123456").decode("ascii"),
        "sender_ephemeral_public_key": "ephem",
        "original_filename": "doc.pdf",
    })
    assert self_send.status_code == 400

    # Unsupported extension (.exe)
    bad_ext = client.post("/api/v1/transfers/upload", headers=headers, json={
        "receiver_username": settings.admin_username,
        "ciphertext": base64.b64encode(b"test").decode("ascii"),
        "nonce": base64.b64encode(b"123456789012").decode("ascii"),
        "auth_tag": base64.b64encode(b"1234567890123456").decode("ascii"),
        "sender_ephemeral_public_key": "ephem",
        "original_filename": "malware.exe",
    })
    assert bad_ext.status_code == 415


def test_admin_endpoints_and_activity_pdf_generation():
    """Verify admin authorization, user list, activity logs, and PDF generation."""
    # 1. Non-admin forbidden
    client.post("/api/v1/auth/register", json={
        "username": "normal_user",
        "email": "normal@test.com",
        "password": "Password123!",
        "long_term_public_key": "pk",
    })
    u_login = client.post("/api/v1/auth/login", json={"username_or_email": "normal_user", "password": "Password123!"})
    u_mfa = client.post("/api/v1/auth/mfa/verify", json={"username_or_email": "normal_user", "code": "000000", "mfa_challenge_token": u_login.json()["mfa_challenge_token"]})
    user_headers = {"Authorization": f"Bearer {u_mfa.json()['session_token']}"}

    assert client.get("/api/v1/admin/users", headers=user_headers).status_code == 403
    assert client.get("/api/v1/admin/activity-logs", headers=user_headers).status_code == 403
    assert client.get("/api/v1/admin/logs", headers=user_headers).status_code == 403

    # 2. Admin login
    admin_login = client.post("/api/v1/auth/login", json={"username_or_email": settings.admin_username, "password": settings.admin_password})
    admin_mfa = client.post("/api/v1/auth/mfa/verify", json={"username_or_email": settings.admin_username, "code": "000000", "mfa_challenge_token": admin_login.json()["mfa_challenge_token"]})
    admin_headers = {"Authorization": f"Bearer {admin_mfa.json()['session_token']}"}

    # 3. List users
    users_resp = client.get("/api/v1/admin/users", headers=admin_headers)
    assert users_resp.status_code == 200
    user_names = [u["username"] for u in users_resp.json()["users"]]
    assert "admin" in user_names
    assert "normal_user" in user_names

    # 4. View activity logs
    act_resp = client.get("/api/v1/admin/activity-logs", headers=admin_headers)
    assert act_resp.status_code == 200
    entries = act_resp.json()["entries"]
    assert len(entries) > 0

    # 5. Filter activity logs by user
    filter_resp = client.get("/api/v1/admin/activity-logs?username=normal_user", headers=admin_headers)
    assert filter_resp.status_code == 200
    for e in filter_resp.json()["entries"]:
        assert e["username"] == "normal_user"

    # 6. Generate user activity PDF report
    pdf_resp = client.get("/api/v1/admin/activity-logs/normal_user/pdf", headers=admin_headers)
    assert pdf_resp.status_code == 200
    assert pdf_resp.headers["content-type"] == "application/pdf"
    assert pdf_resp.content.startswith(b"%PDF-")


def test_account_deletion_and_forensic_preservation():
    """Verify deleting account removes user record but preserves logs for police/legal enquiry."""
    client.post("/api/v1/auth/register", json={
        "username": "delete_me",
        "email": "delete_me@test.com",
        "password": "Password123!",
        "long_term_public_key": "pk",
    })
    d_login = client.post("/api/v1/auth/login", json={"username_or_email": "delete_me", "password": "Password123!"})
    d_mfa = client.post("/api/v1/auth/mfa/verify", json={"username_or_email": "delete_me", "code": "000000", "mfa_challenge_token": d_login.json()["mfa_challenge_token"]})
    token = d_mfa.json()["session_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Delete current account
    del_resp = client.delete("/api/v1/auth/me", headers=headers)
    assert del_resp.status_code == 204

    # User can no longer log in
    after_login = client.post("/api/v1/auth/login", json={"username_or_email": "delete_me", "password": "Password123!"})
    assert after_login.status_code == 401

    # Admin can still view preserved activity logs and export forensic PDF
    admin_login = client.post("/api/v1/auth/login", json={"username_or_email": settings.admin_username, "password": settings.admin_password})
    admin_mfa = client.post("/api/v1/auth/mfa/verify", json={"username_or_email": settings.admin_username, "code": "000000", "mfa_challenge_token": admin_login.json()["mfa_challenge_token"]})
    admin_headers = {"Authorization": f"Bearer {admin_mfa.json()['session_token']}"}

    logs_resp = client.get("/api/v1/admin/activity-logs?username=delete_me", headers=admin_headers)
    assert logs_resp.status_code == 200
    actions = [e["action"] for e in logs_resp.json()["entries"]]
    assert "delete_account" in actions

    # Forensic PDF can still be generated for deleted user
    pdf_resp = client.get("/api/v1/admin/activity-logs/delete_me/pdf", headers=admin_headers)
    assert pdf_resp.status_code == 200
    assert pdf_resp.content.startswith(b"%PDF-")


def test_redeploy_database_wipe_and_user_reset():
    """Verify that redeploy / startup database reset wipes all users and tables cleanly."""
    # Register test user
    client.post("/api/v1/auth/register", json={
        "username": "temporary_user",
        "email": "temp@test.com",
        "password": "Password123!",
        "long_term_public_key": "pk_temp",
    })

    # Verify user exists before reset
    db = SessionLocal()
    assert db.query(User).filter(User.username == "temporary_user").first() is not None
    db.close()

    # Simulate redeployment with reset_database_on_startup=True
    init_db(reset=True)

    # Re-seed admin user as done in lifespan
    db = SessionLocal()
    admin_user = User(
        username=settings.admin_username,
        email=settings.admin_email,
        hashed_password=hash_password(settings.admin_password),
        long_term_public_key="SYSTEM_ADMIN_PUBKEY",
        is_admin=True,
    )
    db.add(admin_user)
    db.commit()

    # Verify all non-admin users have been wiped
    assert db.query(User).filter(User.username == "temporary_user").first() is None
    users = db.query(User).all()
    assert len(users) == 1
    assert users[0].username == settings.admin_username
    db.close()

    # Attempting to log in as wiped user fails
    login_resp = client.post("/api/v1/auth/login", json={
        "username_or_email": "temporary_user",
        "password": "Password123!",
    })
    assert login_resp.status_code == 401

    # Admin can still log in cleanly
    admin_login = client.post("/api/v1/auth/login", json={
        "username_or_email": settings.admin_username,
        "password": settings.admin_password,
    })
    assert admin_login.status_code == 200

