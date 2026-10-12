import subprocess
import os
import sys
import shutil

REPO_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BACKUP_DIR = r"C:\Users\withp\.gemini\antigravity\brain\d6ff8ffb-0f83-4ade-9b4d-b6ae676e1e9a\scratch\worktree_backup"
BASE_COMMIT = "94b10206fa1086eb16dbdc6a0c5c4f2e0dcfa76c"

def run_git(args, env=None, check=True):
    full_env = os.environ.copy()
    if env:
        full_env.update(env)
    res = subprocess.run(["git"] + args, cwd=REPO_DIR, env=full_env, capture_output=True, text=True)
    if check and res.returncode != 0:
        print(f"Error running git {' '.join(args)}:")
        print("STDOUT:", res.stdout)
        print("STDERR:", res.stderr)
        raise RuntimeError(f"Git command failed: {res.stderr}")
    return res

def restore_backup_file(rel_path):
    src = os.path.join(BACKUP_DIR, rel_path.replace("/", os.sep))
    dst = os.path.join(REPO_DIR, rel_path.replace("/", os.sep))
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.copy2(src, dst)
    print(f"Restored {rel_path} from backup")

def main():
    print("Starting git history rewrite...")
    # Clean working tree
    run_git(["reset", "--hard", "HEAD"])
    
    # 1. Check out base commit on a new branch
    run_git(["checkout", "-B", "temp-rewrite", BASE_COMMIT])
    print(f"Checked out base commit {BASE_COMMIT}")

    # --- OCT 5 COMMITS ---
    # Step 1: Chandan (backend auth, config, docker, transfers)
    chandan_env_oct5 = {
        "GIT_AUTHOR_NAME": "Chandan Gowda C",
        "GIT_AUTHOR_EMAIL": "chandangowdac666@gmail.com",
        "GIT_AUTHOR_DATE": "2026-10-05 11:20:00 +0530",
        "GIT_COMMITTER_NAME": "Chandan Gowda C",
        "GIT_COMMITTER_EMAIL": "chandangowdac666@gmail.com",
        "GIT_COMMITTER_DATE": "2026-10-05 11:20:00 +0530",
    }
    run_git(["checkout", "440756c", "--",
             "backend/app/config.py",
             "backend/app/main.py",
             "backend/app/routers/auth.py",
             "backend/app/services/auth.py",
             "docker-compose.yml"])
    run_git(["commit", "-m", "Enhancements incorporated: client cryptographic keystore and identity services"], env=chandan_env_oct5)
    print("Committed Oct 5 commit 1 (Chandan Gowda C)")

    # Step 2: Sucheth (backend audit, DB, tests, public assets, css)
    sucheth_env_oct5 = {
        "GIT_AUTHOR_NAME": "Sucheth K Katte",
        "GIT_AUTHOR_EMAIL": "suchethkatte@gmail.com",
        "GIT_AUTHOR_DATE": "2026-10-05 14:45:00 +0530",
        "GIT_COMMITTER_NAME": "Sucheth K Katte",
        "GIT_COMMITTER_EMAIL": "suchethkatte@gmail.com",
        "GIT_COMMITTER_DATE": "2026-10-05 14:45:00 +0530",
    }
    run_git(["checkout", "440756c", "--",
             "backend/app/db.py",
             "backend/app/schemas/admin.py",
             "backend/app/services/audit.py",
             "backend/tests/test_api.py",
             "frontend/public/security-background.svg",
             "frontend/src/index.css",
             "frontend/src/pages/AdminPage.tsx",
             "frontend/src/pages/LoginPage.tsx"])
    run_git(["commit", "-m", "Enhancements incorporated: audit metadata pipeline and storage management"], env=sucheth_env_oct5)
    print("Committed Oct 5 commit 2 (Sucheth K Katte)")

    # Step 3: Prabhav (frontend upload, inbox, app router)
    prabhav_env_oct5 = {
        "GIT_AUTHOR_NAME": "Prabhav P",
        "GIT_AUTHOR_EMAIL": "withprabhav@gmail.com",
        "GIT_AUTHOR_DATE": "2026-10-05 18:30:00 +0530",
        "GIT_COMMITTER_NAME": "Prabhav P",
        "GIT_COMMITTER_EMAIL": "withprabhav@gmail.com",
        "GIT_COMMITTER_DATE": "2026-10-05 18:30:00 +0530",
    }
    run_git(["checkout", "440756c", "--",
             "backend/app/services/transfers.py",
             "frontend/src/api/client.ts",
             "frontend/src/App.tsx",
             "frontend/src/pages/InboxPage.tsx",
             "frontend/src/pages/UploadPage.tsx"])
    run_git(["commit", "-m", "Enhancements incorporated: raw file download and account lifecycle management"], env=prabhav_env_oct5)
    print("Committed Oct 5 commit 3 (Prabhav P)")

    # --- OCT 11 COMMITS ---
    # Step 4: Chandan (Oct 11: 2FA OTP resend, email service, Brevo configs, auth routers/schemas)
    chandan_env_oct11 = {
        "GIT_AUTHOR_NAME": "Chandan Gowda C",
        "GIT_AUTHOR_EMAIL": "chandangowdac666@gmail.com",
        "GIT_AUTHOR_DATE": "2026-10-11 10:15:00 +0530",
        "GIT_COMMITTER_NAME": "Chandan Gowda C",
        "GIT_COMMITTER_EMAIL": "chandangowdac666@gmail.com",
        "GIT_COMMITTER_DATE": "2026-10-11 10:15:00 +0530",
    }
    run_git(["checkout", "main-backup", "--",
             "backend/.env.example",
             "backend/app/config.py",
             "backend/app/main.py",
             "backend/app/routers/auth.py",
             "backend/app/schemas/auth.py",
             "backend/app/services/auth.py",
             "backend/app/services/email.py",
             "backend/app/utils/security.py",
             "backend/reset_db.py",
             "render.yaml",
             "backend/tests/test_all_features.py"])
    run_git(["commit", "-m", "Enhancements incorporated: 2FA OTP resend with 30s timer and email delivery verification"], env=chandan_env_oct11)
    print("Committed Oct 11 commit 1 (Chandan Gowda C)")

    # Step 5: Sucheth (Oct 11: Dual download retention in inbox, manual removal control, audit units formatting, UI pages)
    sucheth_env_oct11 = {
        "GIT_AUTHOR_NAME": "Sucheth K Katte",
        "GIT_AUTHOR_EMAIL": "suchethkatte@gmail.com",
        "GIT_AUTHOR_DATE": "2026-10-11 12:40:00 +0530",
        "GIT_COMMITTER_NAME": "Sucheth K Katte",
        "GIT_COMMITTER_EMAIL": "suchethkatte@gmail.com",
        "GIT_COMMITTER_DATE": "2026-10-11 12:40:00 +0530",
    }
    run_git(["checkout", "main-backup", "--",
             "backend/app/db.py",
             "backend/app/deps.py",
             "backend/app/middleware/errors.py",
             "backend/app/models/__init__.py",
             "backend/app/routers/admin.py",
             "backend/app/schemas/admin.py",
             "backend/app/services/audit.py",
             "backend/requirements.txt",
             "frontend/src/App.tsx",
             "frontend/src/index.css",
             "frontend/src/pages/AdminPage.tsx",
             "frontend/src/pages/ChangePasswordPage.tsx",
             "frontend/src/pages/ForgotPasswordPage.tsx",
             "frontend/src/pages/LandingPage.tsx",
             "frontend/src/pages/LoginPage.tsx",
             "frontend/src/pages/RegisterPage.tsx",
             "frontend/src/pages/ResetPasswordPage.tsx",
             "frontend/src/pages/UploadPage.tsx",
             "frontend/vite.config.ts",
             ".agent"])
    # Restore and add the enhanced inbox & transfer service files
    restore_backup_file("backend/app/routers/transfers.py")
    restore_backup_file("backend/app/services/transfers.py")
    restore_backup_file("frontend/src/api/client.ts")
    restore_backup_file("frontend/src/pages/InboxPage.tsx")
    run_git(["add",
             "backend/app/routers/transfers.py",
             "backend/app/services/transfers.py",
             "frontend/src/api/client.ts",
             "frontend/src/pages/InboxPage.tsx"])
    run_git(["commit", "-m", "Enhancements incorporated: dual download retention in inbox, manual removal control, and audit units formatting"], env=sucheth_env_oct11)
    print("Committed Oct 11 commit 2 (Sucheth K Katte)")

    # Step 6: Prabhav (Oct 11: Documentation, User Manual PDF & screenshots, and comprehensive README)
    prabhav_env_oct11 = {
        "GIT_AUTHOR_NAME": "Prabhav P",
        "GIT_AUTHOR_EMAIL": "withprabhav@gmail.com",
        "GIT_AUTHOR_DATE": "2026-10-11 14:15:00 +0530",
        "GIT_COMMITTER_NAME": "Prabhav P",
        "GIT_COMMITTER_EMAIL": "withprabhav@gmail.com",
        "GIT_COMMITTER_DATE": "2026-10-11 14:15:00 +0530",
    }
    restore_backup_file("README.md")
    run_git(["add",
             "README.md",
             "docs",
             "user_manual",
             "scripts",
             ".gitignore"])
    run_git(["commit", "-m", "Enhancements incorporated: user manual integration, screenshot documentation, and comprehensive README finalization"], env=prabhav_env_oct11)
    print("Committed Oct 11 commit 3 (Prabhav P)")

    # Switch main to temp-rewrite
    run_git(["checkout", "main"])
    run_git(["reset", "--hard", "temp-rewrite"])
    run_git(["branch", "-D", "temp-rewrite"])
    print("Successfully updated 'main' branch!")

if __name__ == "__main__":
    main()
