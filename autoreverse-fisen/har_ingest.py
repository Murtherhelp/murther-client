#!/usr/bin/env python3
"""
har_ingest.py - Fisen auxiliary capture ingest. NOT part of the fisen.py launch contract.
Launch: python har_ingest.py   (no args; reads ./fisen_capture.har next to the script)
Purpose: if Opera's DevTools HTTP endpoint refuses every request shape, the wire still
gets captured manually through Opera's own DevTools Network panel, exported as HAR,
and merged into fisen_report.json in the same cdp frame shape (epoch-ms 'rt' stamps).
"""
import json
import pathlib

HAR_PATH = pathlib.Path("fisen_capture.har")
REPORT_PATH = pathlib.Path("fisen_report.json")

def main():
    if not HAR_PATH.exists():
        print("[HAR] no fisen_capture.har found next to this script.")
        print("[HAR] capture it: Opera -> F12 -> Network -> filter WS -> click Play ->")
        print("[HAR]   press Space, wait 3 s, press E, wait 3 s -> right-click the wss:// entry ->")
        print("[HAR]   'Save all as HAR with content' -> rename the file to fisen_capture.har here.")
        return

    har = json.loads(HAR_PATH.read_text(encoding="utf-8", errors="replace"))
    frames = []
    sockets = {}
    for entry in har.get("log", {}).get("entries", []):
        url = (entry.get("request") or {}).get("url", "")
        if "gota.io" not in url:
            continue
        sockets[url] = url
        for m in entry.get("_webSocketMessages", []):
            direction = "out" if m.get("type") == "send" else "in"
            data = m.get("data") or ""
            t = m.get("time")
            frames.append({
                "dir": direction,
                "t": t,
                "rt": int(float(t) * 1000) if t is not None else None,
                "len": len(data),
                "preview": data[:256],
                "socketUrl": url
            })

    if not frames:
        print("[HAR] parsed the HAR but found zero webSocket messages on gota.io sockets.")
        print("[HAR] DevTools only records WS messages while the panel is open and the socket live;")
        print("[HAR] keep Network open during the split protocol and export with content.")
        return

    frames.sort(key=lambda r: r.get("rt") or 0.0)
    existing = {}
    if REPORT_PATH.exists():
        try:
            existing = json.loads(REPORT_PATH.read_text(encoding="utf-8"))
        except Exception:
            existing = {}
    old = existing.get("cdp") or {}
    seen = set()
    merged = []
    for rec in (old.get("frames") or []) + frames:
        key = (rec.get("rt"), rec.get("dir"), rec.get("len"))
        if key in seen:
            continue
        seen.add(key)
        merged.append(rec)
    merged.sort(key=lambda r: r.get("rt") or 0.0)
    if len(merged) > 400:
        merged = merged[-400:]
    sk = dict(old.get("sockets") or {})
    sk.update(sockets)
    windows = list(old.get("captureWindows") or [])
    ts = [r["rt"] for r in frames if r.get("rt") is not None]
    if ts:
        windows.append({"from": min(ts), "to": max(ts), "count": len(frames), "source": "har"})
    existing["cdp"] = {
        "source": "cdp+har",
        "sockets": sk,
        "frameCount": len(merged),
        "frames": merged,
        "captureWindows": windows[-20:]
    }
    existing["phases"] = sorted(set(existing.get("phases", ["menu"]) + ["cdp"]))
    REPORT_PATH.write_text(json.dumps(existing, indent=2), encoding="utf-8")
    n_in = sum(1 for f in frames if f["dir"] == "in")
    n_out = sum(1 for f in frames if f["dir"] == "out")
    print(f"[HAR] merged {len(frames)} frames ({n_in} in / {n_out} out) into {REPORT_PATH}.")
    print(f"[HAR] cdp.frameCount now {len(merged)}. correlate splits via 'rt' (epoch ms) against hudTimeline.t.")

if __name__ == "__main__":
    main()
