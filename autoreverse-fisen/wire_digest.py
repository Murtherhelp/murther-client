#!/usr/bin/env python3
"""wire_digest.py - Fisen auxiliary. NOT part of the fisen.py launch contract.
Launch: python wire_digest.py   (no args; reads ./fisen_report.json next to it)
Purpose: derive candidate byte offsets for owner names (UTF-16LE) and skin URLs
(ASCII) inside long in:0x02 frames, and print ONLY a small paste-safe digest.
Raw base64 never leaves the machine; the digest is ~30 short lines.
"""
import json
import base64
import pathlib
import re

REPORT = pathlib.Path("fisen_report.json")


def utf16_runs(b):
    """Offsets of printable UTF-16LE runs of >= 3 chars (player/skin names)."""
    out = []
    i, n = 0, len(b)
    while i + 1 < n:
        if 0x20 <= b[i] <= 0x7e and b[i + 1] == 0:
            j, s = i, []
            while j + 1 < n and 0x20 <= b[j] <= 0x7e and b[j + 1] == 0:
                s.append(chr(b[j]))
                j += 2
            if len(s) >= 3:
                out.append((i, ''.join(s)))
                i = j
                continue
        i += 1
    return out


def ascii_runs(b):
    """Offsets of printable ASCII runs of >= 10 chars (skin URLs, tags)."""
    return [(m.start(), m.group().decode('ascii', 'replace'))
            for m in re.finditer(rb'[ -~]{10,}', b)]


def decode(preview):
    return base64.b64decode(preview.replace(' ', '').replace('\n', ''))


def first_byte(f):
    try:
        raw = base64.b64decode((f.get('preview') or '')[:4])
        return raw[0] if raw else -1
    except Exception:
        return -1


def show_frame(idx, f, tag):
    b = decode(f['preview'])
    names = utf16_runs(b)
    print(f"== {tag} {idx} len={len(b)} head={b[:24].hex()}")
    for off, s in names[:6]:
        print(f"  u16 @{off:5d} {s!r}")
    for off, s in ascii_runs(b)[:2]:
        print(f"  asc @{off:5d} {s[:56]!r}")
    print()
    return names[0][0] if names else -1


def main():
    d = json.loads(REPORT.read_text(encoding='utf-8', errors='replace'))
    ins = [f for f in d.get('cdp', {}).get('frames', []) if f.get('dir') == 'in']
    if not ins:
        print("no inbound frames in report; capture a live session first.")
        return
    longs = [f for f in ins if len(f.get('preview', '')) > 1500][:3]
    roster = [f for f in ins if first_byte(f) == 0x31][:4]
    if not longs and not roster:
        print("no long in:0x02 previews found; was full_preview true for this capture?")
        return
    firsts, lens, rnames = [], [], []
    for idx, f in enumerate(longs):
        b = decode(f['preview'])
        lens.append(len(b))
        firsts.append(show_frame(idx, f, "state"))
    for idx, f in enumerate(roster):
        b = decode(f['preview'])
        rnames.append([(off, s) for off, s in utf16_runs(b)[:4]])
        show_frame(idx, f, "roster")
    print("state first-name offsets:", firsts, "lens:", lens)
    print("roster names:", rnames)


if __name__ == '__main__':
    main()
