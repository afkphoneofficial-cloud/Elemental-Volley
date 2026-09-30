# Emit a session reminder after 2026-10-10 until scripts/live-prod.pending is removed.
import json
import os
import sys
from datetime import datetime, timedelta, timezone

LIVE = datetime(2026, 10, 10).date()
BKK = timezone(timedelta(hours=7))
MSG = (
    "ยังไม่ได้ย้าย Vercel Production Branch เป็น live "
    "หลังวันเปิดจริง 10 ต.ค. 2026 evolley.dev ยังตาม main อยู่ "
    "ไปที่ Vercel → Project evolley.dev → Settings → Git → Production Branch = live "
    "แล้วบอกในแชทว่าทำแล้ว จะได้เลิกเตือน"
)


def roots(payload):
    out = []
    for key in ("workspace_roots", "workspaceRoots", "roots"):
        val = payload.get(key) or []
        if isinstance(val, str):
            out.append(val)
        elif isinstance(val, list):
            out.extend(val)
    cwd = os.getcwd()
    out.append(cwd)
    home = os.path.expanduser("~")
    out.append(os.path.join(home, "GameProject"))
    out.append(r"F:\GameProject")
    seen = set()
    uniq = []
    for r in out:
        if not r:
            continue
        n = os.path.normpath(str(r))
        if n not in seen:
            seen.add(n)
            uniq.append(n)
    return uniq


def pending_path(payload):
    for r in roots(payload):
        p = os.path.join(r, "scripts", "live-prod.pending")
        if os.path.isfile(p):
            return p
    return None


def main():
    raw = sys.stdin.read()
    try:
        payload = json.loads(raw or "{}")
    except json.JSONDecodeError:
        payload = {}
    if datetime.now(BKK).date() < LIVE:
        print("{}")
        return
    if not pending_path(payload):
        print("{}")
        return
    print(json.dumps({"additional_context": MSG}, ensure_ascii=False))


if __name__ == "__main__":
    main()
