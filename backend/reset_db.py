"""Direct command-line database reset script for Render Shell, Docker, or local execution."""
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db import reset_entire_system

if __name__ == "__main__":
    print("[*] Resetting database and wiping all user data...")
    result = reset_entire_system()
    print(f"[+] Success: {result['message']}")
