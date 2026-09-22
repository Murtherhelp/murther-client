#!/usr/bin/env python3
"""wire_digest.py - Fisen auxiliary. NOT part of the fisen.py launch contract.
Launch: python wire_digest.py   (no args; reads ./fisen_report.json next to it)
v2: adds the JOIN section - does any 0x02 record id repeat inside one state frame,
and do repeated ids intersect the 0x31 roster uint16 fields? that single answer
decides owner-level vs cell-level ids. raw base64 never leaves the machine."""
import json
import base64
import pathlib
import collections
import sys

REPORT = pathlib.Path("fisen_report.json")


def decode(preview):
    return base64.b64decode(preview.replace(' ', '').replace('\n', ''))


def parse_roster(b):
    """0x31: [31][u32 count] then [u16 field][utf16le name][00 00] repeated."""
    out = []
    if len(b) < 5 or b[0] != 0x31:
        return out
    p = 5
    while p + 2 <= len(b):
        field = int.from_bytes(b[p:p + 2], 'little')
        q = p + 2
        chars = []
        while q + 1 < len(b):
            cu = int.from_bytes(b[q:q + 2], 'little')
            if cu == 0:
                q += 2
                break
            chars.append(cu)
            q += 2
        out.append((field, ''.join(chr(c) for c in chars)))
        p = q
    return out


def parse_state_ids(b):
    """0x02: 9-byte header then 8-byte records, id = u16LE at record+0."""
    ids = []
    if len(b) < 9 or b[0] != 0x02:
        return ids
    o = 9
    while o + 8 <= len(b):
        ids.append(int.from_bytes(b[o:o + 2], 'little'))
        o += 8
    return ids


def main():
    # Windows consoles default to cp1252, which cannot print the CJK/symbol
    # names living in roster frames — without this the final print dies after
    # the decision lines are already out. Data unchanged, channel fixed.
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
    d = json.loads(REPORT.read_text(encoding='utf-8', errors='replace'))
    ins = [f for f in d.get('cdp', {}).get('frames', []) if f.get('dir') == 'in']
    rosters, states = [], []
    seen = set()
    for f in ins:
        b = decode(f.get('preview', ''))
        key = (b[0] if b else 0, len(b), b[:32])
        if key in seen:
            continue
        seen.add(key)
        if b and b[0] == 0x31:
            rosters.append(parse_roster(b))
        elif b and b[0] == 0x02:
            states.append(parse_state_ids(b))
    fields = set()
    for rec in rosters:
        for fid, name in rec:
            fields.add(fid)
    dup_max, dup_samples, hit = 0, [], 0
    for ids in states:
        c = collections.Counter(ids)
        reps = [(i, n) for i, n in c.items() if n >= 2]
        if reps:
            top = max(n for _, n in reps)
            if top > dup_max:
                dup_max = top
            for i, n in reps[:3]:
                if len(dup_samples) < 6:
                    dup_samples.append((i, n, i in fields))
        hit += sum(1 for i in set(ids) if i in fields)
    print(f"roster frames={len(rosters)} fields={len(fields)} state frames={len(states)}")
    print(f"state id repeats within a frame: max={dup_max}")
    print(f"sample repeated ids (id, count, in_roster): {dup_samples}")
    print(f"state frames containing >=1 roster field: {hit}/{len(states)}")
    if rosters:
        print("roster0 sample:", [(f, n[:14]) for f, n in rosters[0][:5]])


if __name__ == '__main__':
    main()
