# Session reminders: Vercel Production Branch after 2026-10-10, save-cheat RPCs from 2026-10-08.
import json
import os
import sys
from datetime import datetime, timedelta, timezone

LIVE = datetime(2026, 10, 10).date()
CHEAT = datetime(2026, 10, 8).date()
BKK = timezone(timedelta(hours=7))
VERCEL_MSG = (
    "ยังไม่ได้ย้าย Vercel Production Branch เป็น live "
    "หลังวันเปิดจริง 10 ต.ค. 2026 evolley.dev ยังตาม main อยู่ "
    "ไปที่ Vercel → Project evolley.dev → Settings → Git → Production Branch = live "
    "แล้วบอกในแชทว่าทำแล้ว จะได้เลิกเตือน"
)
CHEAT_MSG = (
    "ยังไม่ได้ล็อกเซฟเรื่องโกงก่อนเปิดเซิร์ฟ "
    "ผงอีเธเรียกันแล้ว แต่เหรียญ/เศษ/หิน และคอสตูมใน save JSON ยังให้ไคลเอนต์เขียนได้ "
    "ต้องย้ายรางวัลแมตช์กับการให้ของเป็น RPC ฝั่งเซิร์ฟ แล้วบอกในแชทว่าทำแล้ว จะได้เลิกเตือน"
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


def pending_file(payload, name):
    for r in roots(payload):
        p = os.path.join(r, "scripts", name)
        if os.path.isfile(p):
            return p
    return None


def main():
    raw = sys.stdin.read()
    try:
        payload = json.loads(raw or "{}")
    except json.JSONDecodeError:
        payload = {}
    today = datetime.now(BKK).date()
    bits = []
    if today >= LIVE and pending_file(payload, "live-prod.pending"):
        bits.append(VERCEL_MSG)
    if today >= CHEAT and pending_file(payload, "cheat-rpc.pending"):
        bits.append(CHEAT_MSG)
    if not bits:
        print("{}")
        return
    print(json.dumps({"additional_context": " ".join(bits)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
