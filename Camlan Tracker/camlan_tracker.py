"""
Camlan Tracker (passive mode) - Score / Mass reverse-engineering probe.
Targets: https://gota.io/camlan/ and https://play.gota.io/

YOU browse manually in your own Opera. The script touches NOTHING -
no browser launch, no navigation, no clicks. It only LISTENS.

Setup (once):
  1. Opera + Tampermonkey: create a new script, paste the whole file
     "Camlan Tracker/camlan_probe.user.js", save, make sure it is ON.
  2. Run:  python "Camlan Tracker/camlan_tracker.py"

Use:
  - Open the game URL yourself, play a round.
  - The probe inside the page beacons panel snaps + engine-write taps
    to http://127.0.0.1:18721/event (localhost only, game page only).
  - UI has ONLY two buttons: Start (S) = arm the receiver, End (E) =
    stop + write the VERDICT.
  - Lamp: RED blinking RECORDING while fresh events arrive from a
    target URL; GREY NOT RECORDING otherwise (wrong page, idle,
    probe missing, or stopped).

Output: ./captures/camlan-<stamp>.jsonl (raw) + -VERDICT.txt (answer).
"""
import base64
import json
import re
import struct
import threading
import time
import tkinter as tk
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from tkinter import messagebox

TARGET_PREFIXES = ("https://play.gota.io/", "https://gota.io/camlan/")
PORT = 18721
OUT_DIR = Path(__file__).parent / "captures"
OUT_DIR.mkdir(exist_ok=True)


class Tracker:
    def __init__(self):
        self.armed = False
        self.events = []
        self.ws_frames = []
        self.panel_history = []
        self.first_panel = None
        self.moved = {}
        self.bin_full = 0      # ws-msg-bin events carrying a full base64 body
        self.bin_bytes = 0     # total binary payload bytes seen
        self.lock = threading.Lock()
        self.last_target_at = 0.0
        self.last_url = "-"
        self.server = None
        self.log_path = None
        self.report_path = None
        # ui hooks (set by main)
        self.on_status = lambda s: None
        self.on_url = lambda u: None
        self.on_rec = lambda on: None

    # ---------- receiver ----------
    def _serve(self):
        tracker = self

        class H(BaseHTTPRequestHandler):
            def log_message(self, *a):
                pass

            def _cors(self):
                self.send_response(200)
                self.send_header("Access-Control-Allow-Origin", "*")
                self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
                self.send_header("Access-Control-Allow-Headers", "Content-Type")
                self.end_headers()

            def do_OPTIONS(self):
                self._cors()

            def do_GET(self):
                self._cors()
                self.wfile.write(b"camlan-tracker-ok")

            def do_POST(self):
                try:
                    n = int(self.headers.get("Content-Length", "0") or 0)
                    raw = self.rfile.read(max(0, min(n, 1 << 20)))
                    batch = json.loads(raw.decode("utf-8", "replace"))
                except Exception:
                    batch = None
                self._cors()
                try:
                    self.wfile.write(b"ok")
                except Exception:
                    pass
                if not batch:
                    return
                if isinstance(batch, dict):
                    batch = [batch]
                tracker._ingest(batch)

        try:
            self.server = ThreadingHTTPServer(("127.0.0.1", PORT), H)
            self.server.daemon_threads = True
            self.server.serve_forever()
        except OSError as e:
            self.on_status(f"PORT BUSY 127.0.0.1:{PORT} - close the other tracker ({e})")
        except Exception:
            pass

    def _ingest(self, batch):
        if not self.armed:
            return
        now = time.time()
        fresh = False
        for e in batch:
            if not isinstance(e, dict):
                continue
            url = str(e.get("url", ""))
            if url.startswith(TARGET_PREFIXES):
                fresh = True
                self.last_url = url
                self.on_url(url)
                with self.lock:
                    kind = e.get("kind")
                    if kind == "panel-snap":
                        self.panel_history.append(e)
                        panel = e.get("panel", {})
                        if self.first_panel is None:
                            self.first_panel = json.dumps(panel, sort_keys=True)
                        elif json.dumps(panel, sort_keys=True) != self.first_panel:
                            try:
                                flat0 = json.loads(self.first_panel)
                                for k, v in panel.items():
                                    if k.startswith("__"):
                                        continue
                                    if json.dumps(v, sort_keys=True) != json.dumps(
                                            flat0.get(k), sort_keys=True):
                                        self.moved[k] = True
                            except Exception:
                                pass
                    else:
                        self.events.append(e)
                        if kind == "ws-msg" and e.get("dir") == "in":
                            self.ws_frames.append(e.get("text", ""))
                        elif kind == "ws-msg-bin":
                            try:
                                self.bin_bytes += int(e.get("len") or 0)
                            except Exception:
                                pass
                            if e.get("full") and e.get("b64"):
                                self.bin_full += 1
                self._log(e)
        if fresh:
            self.last_target_at = now

    # ---------- public: START (S) ----------
    def start(self):
        if self.armed:
            return
        stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        self.log_path = OUT_DIR / f"camlan-{stamp}.jsonl"
        self.report_path = OUT_DIR / f"camlan-{stamp}-VERDICT.txt"
        self._log({"kind": "tracker-start", "target": list(TARGET_PREFIXES), "at": stamp})
        self.armed = True
        self.on_status("ARMED - open the game URL yourself and play. Waiting for beacon...")

    # ---------- public: END (E) ----------
    def stop(self):
        if not self.armed:
            return
        self.armed = False
        try:
            self._flush_report(reason="manual-stop")
        except Exception:
            pass
        try:
            self.on_rec(False)
        except Exception:
            pass
        self.on_status("STOPPED - report written to captures/")

    def _log(self, obj):
        try:
            with open(self.log_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(obj, ensure_ascii=False) + "\n")
        except Exception:
            pass

    # ---------- watchdog: RECORDING lamp ----------
    def watch(self):
        while True:
            time.sleep(0.5)
            live = self.armed and (time.time() - self.last_target_at < 2.5)
            try:
                self.on_rec(live)
            except Exception:
                pass
            if self.armed:
                with self.lock:
                    ne, nw = len(self.events), len(self.ws_frames)
                if live:
                    self.on_status(f"RECORDING - tracing {self.last_url[:60]}  events={ne} ws={nw}")
                else:
                    self.on_status("NOT RECORDING - no beacon. Open a target URL with the probe ON, then play.")

    # ---------- verdict (same hunt as before) ----------
    def _flush_report(self, reason="stop"):
        moved_ids = sorted(self.moved.keys())
        setters = {}
        muts = {}
        with self.lock:
            evs = list(self.events)
            snaps = list(self.panel_history)
        for e in evs:
            if e.get("kind") == "setter":
                k = f"{e.get('node')}::{e.get('prop')}"
                setters[k] = setters.get(k, 0) + 1
            elif e.get("kind") == "mutation":
                k = e.get("node", "?")
                muts[k] = muts.get(k, 0) + 1
        num_re = re.compile(r"(\d[\d.,]*[kKmM%]?)")
        last_numbers = []
        for e in evs[-400:]:
            v = str(e.get("value", ""))
            if v and v.strip() not in ("0", "Mass: 0", "Score: 0"):
                m = num_re.findall(v)
                if m:
                    last_numbers.append((e.get("kind"), e.get("node"), v[:80]))
        last_numbers = last_numbers[-15:]
        ws_hit = "n/a - no ws text frames captured"
        if self.ws_frames:
            sample_vals = set()
            for _, _, v in last_numbers:
                sample_vals.update(num_re.findall(v))
            hits = []
            for fv in list(sample_vals)[:8]:
                for i, fr in enumerate(self.ws_frames[-200:]):
                    if fv and fv in fr:
                        hits.append(f"value {fv!r} found in ws frame #{i} (len {len(fr)}) head={fr[:120]!r}")
                        break
            ws_hit = "\n".join(hits) if hits else f"{len(self.ws_frames)} frames captured, none contained DOM values {sorted(sample_vals)[:8]} (binary protocol likely - see ws-msg-bin + panel-snap correlation)"
        # ws binary census (first-byte opcode histogram from head arrays)
        bin_census = {}
        for e in evs:
            if e.get("kind") == "ws-msg-bin":
                h = e.get("head") or []
                if h:
                    k = f"op={h[0]} len={e.get('len')}"
                    bin_census[k] = bin_census.get(k, 0) + 1
        lines = []
        lines.append("=" * 64)
        lines.append("CAMLAN TRACKER - VERDICT (Score/Mass source hunt, passive mode)")
        lines.append("=" * 64)
        lines.append(f"ended: {datetime.now().isoformat(timespec='seconds')} reason={reason}")
        lines.append(f"raw log: {self.log_path}")
        lines.append(f"panel snapshots: {len(snaps)}  hook events: {len(evs)}  ws frames: {len(self.ws_frames)}")
        lines.append(f"binary payload: {self.bin_bytes} bytes seen, {self.bin_full} full bodies kept (base64 in raw log)")
        lines.append("")
        lines.append("[1] PANEL-MOVED (a panel that never moves is a dead template)")
        lines.append(f"    moved ids: {moved_ids if moved_ids else 'NONE - panel never moved this session'}")
        if not moved_ids:
            lines.append("    -> The engine does NOT write the DOM panel live;")
            lines.append("       Score/Mass must come from canvas labels or net frames (see [4][5]).")
        else:
            lines.append(f"    -> Read {moved_ids} by ID, require moved==True, publish.")
        lines.append("")
        lines.append("[2] HOOKED SETTERS (engine writes caught even to replaced nodes)")
        if setters:
            for k, c in sorted(setters.items(), key=lambda x: -x[1])[:15]:
                lines.append(f"    {c:5d}x  {k}")
            lines.append("    -> The top setter IS the engine's write path.")
        else:
            lines.append("    none - engine never used text setters on score nodes.")
        lines.append("")
        lines.append("[3] MUTATIONS (covers node-replacement + characterData writes)")
        if muts:
            for k, c in sorted(muts.items(), key=lambda x: -x[1])[:15]:
                lines.append(f"    {c:5d}x  {k}")
        else:
            lines.append("    none observed.")
        lines.append("")
        lines.append("[4] LAST NON-ZERO NUMBERS (what the live game actually showed)")
        if last_numbers:
            for kind, node, v in last_numbers:
                lines.append(f"    [{kind}] {node} = {v}")
        else:
            lines.append("    none - no live match was played while armed. JOIN A GAME, eat, then press E.")
        lines.append("")
        lines.append("[5] WEBSOCKET (text hits + binary opcode census)")
        lines.append(f"    {ws_hit}")
        if bin_census:
            lines.append("    binary frames (op=len: count):")
            for k, c in sorted(bin_census.items(), key=lambda x: -x[1])[:12]:
                lines.append(f"      {c:5d}x  {k}")
            lines.append("    -> The steady high-rate opcode is the world feed; own mass hides there.")
        lines.append("")
        lines.append("[6] OVERLAY CENSUS (are cell name+mass labels DOM nodes over #canvas?)")
        try:
            ov_texts = {}
            ov_snaps = 0
            for s in snaps[-60:]:
                ov = (s.get("panel") or {}).get("__overlays") or []
                if ov:
                    ov_snaps += 1
                for o in ov[:60]:
                    t = str(o.get("text", ""))[:18]
                    ov_texts[t] = ov_texts.get(t, 0) + 1
            if ov_texts:
                lines.append(f"    {ov_snaps} recent snaps carried overlay labels:")
                for t, c in sorted(ov_texts.items(), key=lambda x: -x[1])[:25]:
                    lines.append(f"      {c:4d}x  {t!r}")
                lines.append("    -> Name+number pairs here = Murther can read them structurally.")
            else:
                lines.append("    none - cell labels are NOT DOM (canvas pixels). ws decode is the way.")
        except Exception:
            lines.append("    census unreadable.")
        lines.append("")
        lines.append("[7] HOW TO UNSTICK murther.user.js (in this order)")
        lines.append("    a. If [1] moved: copy the moving node id/selector into the native-by-id map.")
        lines.append("    b. Else if [2]/[3] fired: publish the setter/mutation path via the ledger first.")
        lines.append("    c. Else: canvas labels + ws binary decode are the only sources left.")
        lines.append("")
        lines.append("[8] SCENE CENSUS (probe v1.13.0: armed-time snips + tiny-op2 keep; gfx tombstone; body retired)")
        try:
            scene_snaps = 0
            app_seen = 0
            has_scene = 0
            via_counts = {}
            kind_tot = {}
            canvas_info = {}
            fill_tot = {}
            scene_texts = {}
            murther_last = None
            own_last = None
            own_nick = None
            own_hits_max = 0
            counter_site = None
            state_keys = None
            state_nums = None
            gfx_last = None
            gfx_why = None
            gfx_attr = None
            mesh_max = 0
            mesh_measured = False
            for s in snaps[-60:]:
                sc = (s.get("panel") or {}).get("__scene") or {}
                if not sc:
                    continue
                scene_snaps += 1
                if sc.get("app"):
                    app_seen += 1
                if sc.get("hasScene"):
                    has_scene += 1
                via = str(sc.get("via") or "none")[:32]
                via_counts[via] = via_counts.get(via, 0) + 1
                try:
                    own_hits_max = max(own_hits_max, int(sc.get("ownHits") or 0))
                except Exception:
                    pass
                if sc.get("counterSite"):
                    counter_site = sc.get("counterSite")
                for k, v in (sc.get("fill") or {}).items():
                    try:
                        if v > fill_tot.get(k, 0):
                            fill_tot[k] = v
                    except Exception:
                        pass
                for k, v in (sc.get("kinds") or {}).items():
                    try:
                        kind_tot[k] = max(kind_tot.get(k, 0), int(v))
                    except Exception:
                        pass
                for c in (sc.get("canvases") or [])[:8]:
                    try:
                        cid = str(c.get("id"))
                        canvas_info[cid] = f'{c.get("w")}x{c.get("h")} cssW={c.get("cw")}'
                    except Exception:
                        pass
                for o in (sc.get("texts") or [])[:40]:
                    t = str(o.get("text", ""))[:18]
                    sib = str(o.get("sib", ""))[:18]
                    key = f"{t!r}" + (f" sib={sib!r}" if sib else "")
                    scene_texts[key] = scene_texts.get(key, 0) + 1
                if sc.get("murther"):
                    murther_last = sc.get("murther")
                if sc.get("own"):
                    own_last = sc.get("own")
                    own_nick = sc.get("ownNick")
                if sc.get("stateKeys"):
                    state_keys = sc.get("stateKeys")
                    state_nums = sc.get("stateNums")
                if sc.get("gfx"):
                    gfx_last = sc.get("gfx")
                if sc.get("gfxWhy"):
                    gfx_why = sc.get("gfxWhy")
                if sc.get("gfxAttr"):
                    gfx_attr = sc.get("gfxAttr")
                if "meshCount" in sc:
                    mesh_measured = True
                    try:
                        mesh_max = max(mesh_max, int(sc.get("meshCount") or 0))
                    except Exception:
                        pass
            if scene_snaps:
                lines.append(f"    {scene_snaps} snaps carried a scene census, app.stage in {app_seen}, any-scene in {has_scene}.")
                if via_counts:
                    lines.append("    scene source (via): " + ", ".join(f"{k}={v}" for k, v in sorted(via_counts.items(), key=lambda x: -x[1])[:6]))
                if canvas_info:
                    lines.append("    canvases (id: backing cssW):")
                    for k, v in list(canvas_info.items())[:8]:
                        lines.append(f"      {k}: {v}")
                if kind_tot:
                    lines.append("    scene node kinds (max per snap):")
                    for k, v in sorted(kind_tot.items(), key=lambda x: -x[1])[:12]:
                        lines.append(f"      {v:6d}x  {k}")
                if fill_tot:
                    lines.append("    2D fillText calls by canvas (zero on arena = WebGL build):")
                    for k, v in sorted(fill_tot.items(), key=lambda x: -x[1])[:10]:
                        lines.append(f"      {v:7d}x  {k}")
                else:
                    lines.append("    no 2D fillText calls counted (pure WebGL or probe v1.3.x).")
                if scene_texts:
                    lines.append("    stage texts (nicks only in this build - mass is sprite scale):")
                    for t, c in sorted(scene_texts.items(), key=lambda x: -x[1])[:20]:
                        lines.append(f"      {c:4d}x  {t}")
                else:
                    lines.append("    no stage texts walked (no scene yet - renderer.render not seen - or no Text nodes).")
                if own_last is not None:
                    lines.append(f"    own proxy (nick={own_nick!r}): {str(own_last)[:400]}")
                    lines.append(f"    own texts found (max snap): {own_hits_max} (v1.8.0: own bypasses the 40-cap).")
                    lines.append("    -> POSITION grouping only. Scale/width RETIRED as mass (024957+025430: sx flat + px never fired).")
                if mesh_measured:
                    lines.append(f"    mesh count (max snap, measured): {mesh_max} (v8 Mesh is not a Sprite).")
                else:
                    lines.append("    mesh count: NOT MEASURED (probe < v1.11.0 - update the probe).")
                if gfx_last is not None:
                    lines.append(f"    graphics bbox: {str(gfx_last)[:200]}")
                    lines.append("    -> eat/split and watch bbox move: moving bbox = vector-drawn cells live here.")
                else:
                    why = f"attr={gfx_attr} why={gfx_why}" if (gfx_attr or gfx_why) else "no Graphics node walked"
                    lines.append(f"    graphics bbox: none ({why}).")
                cap = None
                try:
                    for e in evs:
                        if isinstance(e, dict) and e.get("kind") == "state-capture":
                            cap = e
                except Exception:
                    cap = None
                snips = []
                try:
                    for e in evs:
                        if isinstance(e, dict) and e.get("kind") == "bundle-snip":
                            snips.append(e)
                except Exception:
                    pass
                if state_keys is not None:
                    lines.append(f"    STATE KEYS (syncRuntimeState this): {str(state_keys)[:400]}")
                    lines.append(f"    state nums: {str(state_nums)[:400]}")
                    lines.append("    -> mass/score/size/radius field here = game over.")
                elif cap is not None:
                    lines.append(f"    STATE KEYS (state-capture event): {str(cap.get('keys'))[:400]}")
                    lines.append(f"    state nums: {str(cap.get('nums'))[:400]}")
                    lines.append("    -> mass/score/size/radius field here = game over.")
                elif scene_snaps:
                    lines.append("    state keys: not yet captured (CallSite trap arms on HUD tick).")
                if counter_site:
                    lines.append(f"    counter site: {str(counter_site)[:160]}")
                    lines.append("    -> fetch this bundle offline; mass lives in that scope, not in nodes.")
                if snips:
                    seen_terms = set()
                    for sn in snips[:4]:
                        term = str(sn.get("term", "?"))
                        if term in seen_terms:
                            continue
                        seen_terms.add(term)
                        lines.append(f"    bundle snip [{term}] @{str(sn.get('bundle', ''))}:")
                        lines.append(f"      {str(sn.get('snip', ''))[:400]}")
                if murther_last is not None:
                    lines.append(f"    murther readouts: {str(murther_last)[:300]}")
            else:
                lines.append("    none - no scene census arrived: confirm the tab is play.gota.io,")
                lines.append("    the probe script is enabled for that origin, and the tracker was")
                lines.append("    armed (Start) BEFORE loading / while playing the game.")
        except Exception:
            lines.append("    census unreadable.")
        lines.append("")
        lines.append("[9] WIRE-MASS (offline split-diff: pCells transitions vs full op=2 frames)")
        try:
            fulls = []
            for e in evs:
                if not isinstance(e, dict) or e.get("kind") != "ws-msg-bin":
                    continue
                if not e.get("full") or not e.get("b64"):
                    continue
                try:
                    d = base64.b64decode(e["b64"])
                except Exception:
                    continue
                if d and d[0] == 2:
                    fulls.append((e.get("t") or 0, len(d), d))
            fulls.sort(key=lambda x: x[0])
            lines.append(f"    {len(fulls)} full op=2 bodies kept.")
            if fulls:
                from collections import Counter as _C
                lens = _C(ln for _, ln, _ in fulls)
                for ln, c in lens.most_common(8):
                    samp = next(d for _, l, d in fulls if l == ln)
                    body = samp[9:]
                    fit = len(body) > 5 and body[-5:] == b"\x00" * 5 and (len(body) - 5) % 8 == 0
                    if fit:
                        lines.append(f"      {c:4d}x  len={ln}: 9+{(len(body) - 5) // 8}x8B+5")
                    else:
                        lines.append(f"      {c:4d}x  len={ln}: other shape (hdr {samp[:12].hex()})")

                def _parse8(dd):
                    try:
                        if not dd or dd[0] != 2 or len(dd) < 15:
                            return None
                        bb = dd[9:]
                        if len(bb) >= 5 and bb[-5:] == b"\x00" * 5:
                            bb = bb[:-5]
                        if not bb or len(bb) % 8:
                            return None
                        return [struct.unpack_from("<Hhhh", bb, i) for i in range(0, len(bb), 8)]
                    except Exception:
                        return None

                trans = []
                prevc = None
                for s in snaps:
                    try:
                        cc = ((s.get("panel") or {}).get("pCells") or {}).get("text", "")
                    except Exception:
                        cc = ""
                    if prevc is None:
                        prevc = cc
                    elif cc != prevc:
                        trans.append((s.get("t") or 0, prevc, cc))
                        prevc = cc
                shown = 0
                for t, a, b in trans:
                    if shown >= 6:
                        break
                    bef = [(tt, l, d) for tt, l, d in fulls if 0 < t - tt < 60000]
                    aft = [(tt, l, d) for tt, l, d in fulls if 0 < tt - t < 60000]
                    pair = None
                    for tb, lb, db in reversed(bef):
                        for ta, la, da in aft:
                            if lb == la:
                                pair = ((tb, db), (ta, da), lb)
                                break
                        if pair:
                            break
                    if not pair:
                        lines.append(f"    {a}->{b}: no same-len full bracket")
                        shown += 1
                        continue
                    (tb, db), (ta, da), lb = pair
                    rb = {r[0]: r for r in (_parse8(db) or [])}
                    ra = {r[0]: r for r in (_parse8(da) or [])}
                    if not rb or not ra:
                        lines.append(f"    {a}->{b}: len {lb} not 8B-shaped")
                        shown += 1
                        continue
                    halved = []
                    for i in sorted(set(rb) & set(ra)):
                        cb, ca = rb[i][3], ra[i][3]
                        if cb and abs(ca * 2 - cb) <= max(3, abs(cb) * 0.05):
                            halved.append(f"{i:#x}:{cb}->{ca}")
                    newids = sorted(set(ra) - set(rb))
                    lines.append(f"    {a}->{b}: len {lb}, {len(rb)}->{len(ra)} recs, halved-c: {halved[:8] or 'NONE'}")
                    if newids:
                        lines.append(f"      new ids: {[hex(i) for i in newids[:8]]}")
                    shown += 1
                if not trans:
                    lines.append("    no pCells transitions this session.")
                roster = []
                for _, ln, d in fulls:
                    if roster:
                        break
                    try:
                        hits = list(re.finditer(rb"(?:[\x20-\x7e]\x00){2,}", bytes(d)))[:12]
                    except Exception:
                        continue
                    if len(hits) < 2:
                        continue
                    for m in hits:
                        st = m.start()
                        blob = d[max(0, st - 9):st]
                        try:
                            eid = struct.unpack("<H", blob[-2:])[0] if len(blob) >= 2 else None
                        except Exception:
                            eid = None
                        try:
                            nick = m.group().decode("utf-16le", "ignore")[:16]
                        except Exception:
                            nick = "?"
                        roster.append((nick, eid))
                if roster:
                    lines.append("    roster snapshot (nick -> pre-blob u16):")
                    for nick, eid in roster[:12]:
                        lines.append(f"      {nick!r} -> {eid if eid is None else hex(eid)}")
                else:
                    lines.append("    no roster snapshot (nick-bearing frame) kept this session.")
            else:
                lines.append("    no full op=2 bodies kept (throttled heads only).")
        except Exception:
            lines.append("    wire census unreadable.")
        lines.append("=" * 64)
        try:
            with open(self.report_path, "w", encoding="utf-8") as f:
                f.write("\n".join(lines) + "\n")
        except Exception:
            pass


def main():
    tracker = Tracker()
    t = threading.Thread(target=tracker._serve, daemon=True)
    t.start()
    w = threading.Thread(target=tracker.watch, daemon=True)
    w.start()

    root = tk.Tk()
    root.title("Camlan Tracker")
    root.geometry("440x270")
    root.resizable(False, False)
    try:
        root.attributes("-topmost", True)
    except Exception:
        pass

    status_var = tk.StringVar(value="IDLE - press Start (S)")
    url_var = tk.StringVar(value="url: -")
    rec_var = tk.StringVar(value="NOT RECORDING")
    rec_state = {"on": False, "blink": False}

    rec_row = tk.Frame(root)
    rec_row.pack(pady=(10, 0))
    rec_dot = tk.Canvas(rec_row, width=22, height=22, highlightthickness=0)
    rec_dot.pack(side="left", padx=(0, 6))
    _dot = rec_dot.create_oval(3, 3, 19, 19, fill="#3a3a3a", outline="#222")
    tk.Label(rec_row, textvariable=rec_var, font=("Consolas", 11, "bold")).pack(side="left")

    def paint_rec():
        if rec_state["on"]:
            rec_state["blink"] = not rec_state["blink"]
            rec_dot.itemconfig(_dot, fill="#ff2222" if rec_state["blink"] else "#7a1010")
        else:
            rec_dot.itemconfig(_dot, fill="#3a3a3a")
        root.after(500, paint_rec)
    paint_rec()

    def set_rec(on):
        def _apply():
            rec_state["on"] = bool(on)
            rec_var.set("RECORDING" if on else "NOT RECORDING")
        root.after(0, _apply)

    tracker.on_status = lambda s: root.after(0, lambda: status_var.set(s))
    tracker.on_url = lambda u: root.after(0, lambda: url_var.set("url: " + u[:62]))
    tracker.on_rec = set_rec

    def on_start():
        tracker.start()

    def on_end():
        tracker.stop()
        try:
            messagebox.showinfo("Camlan Tracker", "Tracing stopped.\nRead the VERDICT file in captures/")
        except Exception:
            pass

    tk.Label(root, text="CAMLAN TRACKER  |  passive - you browse, it listens",
             font=("Consolas", 10, "bold")).pack(pady=(10, 4))
    tk.Label(root, textvariable=status_var, font=("Consolas", 9),
             wraplength=410, justify="center").pack(pady=2)
    tk.Label(root, textvariable=url_var, font=("Consolas", 8),
             wraplength=410, justify="center", fg="#555").pack(pady=2)
    tk.Label(root, text="needs: camlan_probe.user.js ON in Tampermonkey",
             font=("Consolas", 8), fg="#888").pack(pady=0)

    row = tk.Frame(root)
    row.pack(pady=8)
    b_start = tk.Button(row, text="Start (S)", font=("Consolas", 13, "bold"),
                        width=12, height=2, bg="#1d7a2f", fg="white", command=on_start)
    b_start.pack(side="left", padx=10)
    b_end = tk.Button(row, text="End (E)", font=("Consolas", 13, "bold"),
                      width=12, height=2, bg="#a32121", fg="white", command=on_end)
    b_end.pack(side="left", padx=10)

    root.bind("s", lambda e: on_start())
    root.bind("S", lambda e: on_start())
    root.bind("e", lambda e: on_end())
    root.bind("E", lambda e: on_end())
    root.mainloop()


if __name__ == "__main__":
    main()
