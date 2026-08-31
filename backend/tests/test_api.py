import os
import base64
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.db import init_db, SessionLocal, engine
from app.models import Base, User, Transfer
from app.config import settings
from app.utils.security import hash_password

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



def test_full_e2e_backend_workflow():
    # 1. Register User 1 (Sender) - F.1
    sender_reg = client.post("/api/v1/auth/register", json={
        "username": "alice",
        "email": "alice@example.com",
        "password": "password123",
        "long_term_public_key": "{\"kty\":\"EC\",\"crv\":\"P-256\",\"x\":\"alice_x\",\"y\":\"alice_y\"}"
    })
    assert sender_reg.status_code == 201
    assert "mfa_provisioning_uri" in sender_reg.json()

    # 2. Register User 2 (Receiver) - F.1
    receiver_reg = client.post("/api/v1/auth/register", json={
        "username": "bob",
        "email": "bob@example.com",
        "password": "password456",
        "long_term_public_key": "{\"kty\":\"EC\",\"crv\":\"P-256\",\"x\":\"bob_x\",\"y\":\"bob_y\"}"
    })
    assert receiver_reg.status_code == 201

    # 3. Login Sender (Alice) - F.2 & F.3
    login_resp = client.post("/api/v1/auth/login", json={
        "username_or_email": "alice",
        "password": "password123"
    })
    assert login_resp.status_code == 200
    mfa_challenge = login_resp.json()["mfa_challenge_token"]

    mfa_resp = client.post("/api/v1/auth/mfa/verify", json={
        "username_or_email": "alice",
        "code": "000000",
        "mfa_challenge_token": mfa_challenge
    })
    assert mfa_resp.status_code == 200
    alice_token = mfa_resp.json()["session_token"]
    alice_headers = {"Authorization": f"Bearer {alice_token}"}

    # 4. Lookup Receiver Public Key - F.4
    lookup_resp = client.get("/api/v1/auth/users/public-key?username=bob", headers=alice_headers)
    assert lookup_resp.status_code == 200
    assert lookup_resp.json()["found"] is True
    assert "bob_x" in lookup_resp.json()["public_key"]

    # 5. Upload Encrypted Transfer to Bob - F.5 to F.9
    dummy_ciphertext = base64.b64encode(b"SECRET_ENCRYPTED_FILE_BYTES").decode("ascii")
    dummy_nonce = base64.b64encode(b"123456789012").decode("ascii")
    dummy_tag = base64.b64encode(b"1234567890123456").decode("ascii")
    dummy_ephemeral_pubkey = "{\"kty\":\"EC\",\"crv\":\"P-256\",\"x\":\"ephemeral_x\",\"y\":\"ephemeral_y\"}"

    upload_resp = client.post("/api/v1/transfers/upload", headers=alice_headers, json={
        "receiver_username": "bob",
        "ciphertext": dummy_ciphertext,
        "nonce": dummy_nonce,
        "auth_tag": dummy_tag,
        "sender_ephemeral_public_key": dummy_ephemeral_pubkey,
        "original_filename": "test_document.txt"
    })
    assert upload_resp.status_code == 201
    transfer_id = upload_resp.json()["transfer_id"]
    assert upload_resp.json()["status"] == "pending"

    # 6. Login Receiver (Bob) - F.2 & F.3
    bob_login = client.post("/api/v1/auth/login", json={
        "username_or_email": "bob",
        "password": "password456"
    })
    bob_challenge = bob_login.json()["mfa_challenge_token"]
    bob_mfa = client.post("/api/v1/auth/mfa/verify", json={
        "username_or_email": "bob",
        "code": "000000",
        "mfa_challenge_token": bob_challenge
    })
    bob_token = bob_mfa.json()["session_token"]
    bob_headers = {"Authorization": f"Bearer {bob_token}"}

    # 7. Check Pending Transfers - F.10
    pending_resp = client.get("/api/v1/transfers/pending", headers=bob_headers)
    assert pending_resp.status_code == 200
    pending_list = pending_resp.json()["transfers"]
    assert len(pending_list) == 1
    assert pending_list[0]["transfer_id"] == transfer_id

    # 8. Deliver Transfer & Verify Server Blob Storage Purge - F.11, C.6
    deliver_resp = client.post(f"/api/v1/transfers/{transfer_id}/deliver", headers=bob_headers)
    assert deliver_resp.status_code == 200
    payload = deliver_resp.json()
    assert payload["transfer_id"] == transfer_id
    assert payload["ciphertext"] == dummy_ciphertext
    assert payload["nonce"] == dummy_nonce
    assert payload["auth_tag"] == dummy_tag
    assert payload["sender_ephemeral_public_key"] == dummy_ephemeral_pubkey

    # Check DB to confirm blob_path was cleared/purged on server
    db = SessionLocal()
    t_obj = db.query(Transfer).filter(Transfer.transfer_id == transfer_id).first()
    assert t_obj.status == "delivered"
    assert t_obj.blob_path is None
    db.close()

    # 9. Acknowledge Download Success - F.13/F.14
    ack_resp = client.post(f"/api/v1/transfers/{transfer_id}/download-ack", headers=bob_headers, json={
        "success": True
    })
    assert ack_resp.status_code == 204

    # 10. Login Admin & Check Metadata Logs - F.15
    admin_login = client.post("/api/v1/auth/login", json={
        "username_or_email": "admin",
        "password": "admin123456"
    })
    admin_challenge = admin_login.json()["mfa_challenge_token"]
    admin_mfa = client.post("/api/v1/auth/mfa/verify", json={
        "username_or_email": "admin",
        "code": "000000",
        "mfa_challenge_token": admin_challenge
    })
    admin_token = admin_mfa.json()["session_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    logs_resp = client.get("/api/v1/admin/logs", headers=admin_headers)
    assert logs_resp.status_code == 200
    entries = logs_resp.json()["entries"]
    assert len(entries) >= 1
    log_transfer_ids = [e["transfer_id"] for e in entries]
    assert transfer_id in log_transfer_ids
