"""Make short cute character cries for smash hits."""
from __future__ import annotations

import asyncio
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "audio"
RAW = OUT / "_voice_raw"
RAW.mkdir(parents=True, exist_ok=True)

# Short Pikachu-style name cries, then chipmunked in ffmpeg.
JOBS = [
    {
        "id": "ignis",
        "text": "イグニー！",
        "voice": "ja-JP-NanamiNeural",
        "rate": "+22%",
        "pitch": "+40Hz",
        "shift": 1.38,
    },
    {
        "id": "aqua",
        "text": "アクアー！",
        "voice": "ja-JP-NanamiNeural",
        "rate": "+18%",
        "pitch": "+32Hz",
        "shift": 1.42,
    },
    {
        "id": "volt",
        "text": "ボルッ！",
        "voice": "ja-JP-NanamiNeural",
        "rate": "+28%",
        "pitch": "+55Hz",
        "shift": 1.52,
    },
    {
        "id": "terra",
        "text": "テラー！",
        "voice": "ja-JP-KeitaNeural",
        "rate": "+8%",
        "pitch": "+8Hz",
        "shift": 1.18,
    },
]


async def synth(job: dict) -> Path:
    dest = RAW / f"{job['id']}.mp3"
    comm = edge_tts.Communicate(
        job["text"],
        job["voice"],
        rate=job["rate"],
        pitch=job["pitch"],
    )
    await comm.save(str(dest))
    return dest


async def main() -> None:
    import subprocess

    for job in JOBS:
        raw = await synth(job)
        out = OUT / f"voice-{job['id']}.mp3"
        # Pitch up, trim to ~1s, fade out so it never trails into the next hit.
        tempo = max(0.5, min(1.0, 1.0 / job["shift"] * 1.12))
        af = (
            "silenceremove=start_periods=1:start_silence=0.02:start_threshold=-42dB,"
            f"asetrate=44100*{job['shift']},aresample=44100,atempo={tempo:.3f},"
            "highpass=f=180,lowpass=f=7800,volume=4.2,"
            "afade=t=in:st=0:d=0.02,afade=t=out:st=0.72:d=0.22"
        )
        subprocess.check_call([
            "ffmpeg", "-y", "-i", str(raw),
            "-af", af, "-t", "1.0",
            "-ar", "44100", "-ac", "1", "-b:a", "96k",
            str(out),
        ])
        print("wrote", out)

    # keep raw only if someone wants to re-filter; drop to stay lean
    for p in RAW.glob("*.mp3"):
        p.unlink()
    try:
        RAW.rmdir()
    except OSError:
        pass


if __name__ == "__main__":
    asyncio.run(main())
