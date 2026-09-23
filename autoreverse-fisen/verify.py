#!/usr/bin/env python3
"""verify.py - Auto Reverse console-probe automator. NOT part of the fisen.py
launch contract, but honors the same rule: `python verify.py`, no args.

What it does: everything the runbooks keep asking you to type into the game-tab
console (wasm block, freeze block, build markers) is pulled over Chrome DevTools
Protocol instead and graded PASS/WARN/FAIL. The game tab must live in a browser
launched with --remote-debugging-port=9222 (same requirement as fisen.py's CDP
observer). fisen.py does NOT need to be running.

Output: verdicts on screen + `verify_report_<UTC-timestamp>.json` next to this
file. Send that file instead of console screenshots.

Still manual (needs a human in the match): pressing binds, splits, spawning,
anything you watch with your eyes. This script automates every *read* probe.
"""
import asyncio
import datetime
import json
import pathlib
import socket
import sys

CDP_PORT = 9222
BRIDGE_PORT = 8765
HERE = pathlib.Path(__file__).resolve().parent

BATCH_JS = """(function () {
  var out = { murther: false, markers: {}, wasm: null, freeze: null,
              autoreverseKeys: [], error: null };
  try {
    out.murther = (typeof window.__murther !== 'undefined');
    var M = window.__murtherAutoReverse || null;
    out.markers.module = !!M;
    out.markers.simulate = !!(M && typeof M.simulate === 'function');
    out.markers.report = !!(M && typeof M.report === 'function');
    out.markers.snapshot = !!(M && typeof M.snapshot === 'function');
    out.markers.armFromBind = !!(M && typeof M.armFromBind === 'function');
    out.markers.acquireLock = !!(M && typeof M.acquireLock === 'function');
    if (M) {
      try { out.wasm = (typeof M.status === 'function') ? M.status() : null; }
      catch (e1) { out.wasmError = String(e1 && e1.message || e1); }
      try {
        var r = (typeof M.report === 'function') ? M.report() : null;
        if (r) {
          out.autoreverseKeys = Object.keys(r);
          out.freeze = r.freeze || null;
        } else { out.reportNull = true; }
      } catch (e2) { out.reportError = String(e2 && e2.message || e2); }
    }
  } catch (e) { out.error = String(e && e.message || e); }
  return out;
})()"""


async def fetch_targets_raw(port):
    """Plain TCP + hand-written HTTP GET. No urllib, no proxy resolution."""
    reader, writer = await asyncio.open_connection("127.0.0.1", port)
    try:
        writer.write(
            f"GET /json/list HTTP/1.1\r\nHost: 127.0.0.1:{port}\r\nConnection: close\r\n\r\n".encode("utf-8")
        )
        await writer.drain()
        chunks = []
        while True:
            chunk = await reader.read(65536)
            if not chunk:
                break
            chunks.append(chunk)
        raw = b"".join(chunks)
    finally:
        writer.close()
    head, _, body = raw.partition(b"\r\n\r\n")
    status = head.split(b"\r\n", 1)[0] if head else b""
    if b"200" not in status:
        raise ConnectionError("CDP endpoint answered: " + status.decode("utf-8", "replace"))
    return json.loads(body.decode("utf-8", "replace"))


def bridge_reachable():
    try:
        s = socket.create_connection(("127.0.0.1", BRIDGE_PORT), timeout=3)
        s.close()
        return True
    except OSError:
        return False


async def evaluate(ws_url, expression, timeout=15):
    """One Runtime.evaluate round-trip. Returns the value or raises."""
    import websockets
    msg_id = 1
    async with websockets.connect(ws_url, max_size=2 ** 22) as ws:
        await ws.send(json.dumps({
            "id": msg_id, "method": "Runtime.evaluate",
            "params": {"expression": expression, "returnByValue": True,
                       "awaitPromise": True},
        }))
        async for raw in ws:
            msg = json.loads(raw)
            if msg.get("id") != msg_id:
                continue
            if "error" in msg:
                raise RuntimeError("CDP error: " + json.dumps(msg["error"])[:200])
            res = msg.get("result", {}).get("result", {})
            if res.get("subtype") == "error" or res.get("type") == "undefined":
                desc = res.get("description", "evaluation failed")
                raise RuntimeError("page error: " + str(desc)[:200])
            return res.get("value")
    raise RuntimeError("debugger socket closed without an answer")


def grade(data):
    """data = batch result dict. Returns (verdicts list, overall)."""
    v = []
    if not isinstance(data, dict) or data.get("error"):
        return [("FAIL", "batch", "page probe crashed: " + str((data or {}).get("error")))], "FAIL"
    if not data.get("murther"):
        return [("FAIL", "client", "no __murther on the page (client off? wrong tab?)")], "FAIL"
    m = data.get("markers", {}) or {}
    missing = [k for k in ("simulate", "report", "snapshot", "armFromBind", "acquireLock")
               if not m.get(k)]
    if not m.get("module"):
        v.append(("FAIL", "module", "__murtherAutoReverse missing"))
    elif missing:
        v.append(("WARN", "build", "stale build? missing: " + ",".join(missing)))
    else:
        v.append(("PASS", "build", "all module markers present (simulate/report/snapshot/arm/acquire)"))
    w = data.get("wasm") or {}
    if not w:
        v.append(("WARN", "wasm", "status() unreadable: " + str(data.get("wasmError", "?"))))
    else:
        v.append(("PASS" if w.get("ready") else "FAIL", "ready",
                  "brain ready=" + str(w.get("ready"))))
        v.append(("INFO", "state",
                  "armed=%s threshold=%s deny=%s live=%s own=%s foes=%s engine=%s" % (
                      w.get("armed"), w.get("threshold"), w.get("deny"),
                      w.get("live"), w.get("own"), w.get("foes"), w.get("engine"))))
    fz = data.get("freeze")
    if fz is None:
        v.append(("WARN", "freeze", "no freeze block (report() predates it?)"))
    elif not isinstance(fz, dict) or not fz.get("hook", False):
        v.append(("INFO", "freeze", "no hook object; nothing latched here"))
    elif fz.get("on"):
        v.append(("FAIL", "freeze", "R.on TRUE ageMs=%s (latched window)" % fz.get("ageMs")))
    elif str(fz.get("mode", "reverse")) != "reverse":
        v.append(("FAIL", "freeze", "foreign mode latched: %s" % fz.get("mode")))
    else:
        v.append(("PASS", "freeze", "hook idle, mode=reverse, R off"))
    if data.get("reportError"):
        v.append(("WARN", "report", str(data["reportError"])[:120]))
    overall = "FAIL" if any(x[0] == "FAIL" for x in v) else "WARN" if any(x[0] == "WARN" for x in v) else "PASS"
    return v, overall


async def main_async():
    try:
        import websockets  # noqa: F401
    except ImportError:
        print("[VERIFY] FATAL: 'websockets' not installed. Run: pip install websockets")
        return 2
    print("[VERIFY] bridge :8765 reachable:", bridge_reachable(),
          "(needed for file logs only, not for these probes)")
    try:
        targets = await asyncio.wait_for(fetch_targets_raw(CDP_PORT), timeout=8)
    except Exception as e:
        print("[VERIFY] FATAL: no debuggable browser on :%d (%s)" % (CDP_PORT, str(e)[:100]))
        print("[VERIFY] relaunch the browser with --remote-debugging-port=9222,")
        print("[VERIFY] then open play.gota.io in THAT browser and rerun: python verify.py")
        return 2
    page = next((t for t in targets
                 if t.get("type") == "page" and "play.gota.io" in (t.get("url") or "")), None)
    if not page or not page.get("webSocketDebuggerUrl"):
        seen = [(t.get("url") or "")[:60] for t in targets if t.get("type") == "page"][:6]
        print("[VERIFY] FATAL: port reachable but no play.gota.io tab here.")
        print("[VERIFY] tabs seen:", seen)
        return 2
    print("[VERIFY] game tab:", page.get("url"))
    try:
        data = await asyncio.wait_for(
            evaluate(page["webSocketDebuggerUrl"], BATCH_JS), timeout=20)
    except Exception as e:
        print("[VERIFY] FATAL: probe failed:", str(e)[:200])
        return 2
    verdicts, overall = grade(data)
    for level, name, msg in verdicts:
        print("[VERIFY] %-4s %-8s %s" % (level, name, msg))
    ts = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H-%M-%SZ")
    out_path = HERE / f"verify_report_{ts}.json"
    out_path.write_text(json.dumps({
        "ts": ts, "overall": overall,
        "verdicts": [{"level": a, "check": b, "msg": c} for a, b, c in verdicts],
        "data": data,
    }, indent=1), encoding="utf-8")
    print("[VERIFY] overall:", overall)
    print("[VERIFY] artifact:", out_path)
    return 0 if overall != "FAIL" else 1


def main():
    if len(sys.argv) > 1:
        print("[VERIFY] launch contract: python verify.py (no args)")
        return 2
    try:
        return asyncio.run(main_async())
    except KeyboardInterrupt:
        return 130


if __name__ == "__main__":
    sys.exit(main())
