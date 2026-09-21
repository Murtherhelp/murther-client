#!/usr/bin/env python3
"""
Fisen - Observation Script for Murther Auto Reverse Mechanic
Launch contract: python fisen.py (no args, no flags, no env vars)
v4.8: single-file session capture (one betix_session.jsonl per run when
      single_file is set), self-restarting bridge listener, wire-truth census
      (opcode/length histograms + 30 s summaries, no packet layouts invented).
v4.9: session file is valid JSON (betix_session_<ts>.json array, atomic
      rewrite per record) — same content, same scopes, same capture-until-close.
NOTE: the LIVE client under observation is the Fisen client (gde- DOM).
      The Murther client is the project's final deliverable, not a detection target.
"""
import base64
import os
import sys
import json
import asyncio
import pathlib
import datetime

WAIT_STATE = {}
CONFIRMED_STATE = {}
BETIX_SCOPE_LOGGERS = {}  # Step 5: per-scope BetixLogger cache for the /log endpoint.
SESSION = {"obj": None}  # v4.8: the single-file session logger when single_file mode is on.
CDP_STATE = {"sockets": {}, "frames": [], "dirty": False, "target_id": None,
             "attached": False, "last_nag": 0.0, "last_console_state": None,
             "http_variant": None}

REQUEST_VARIANTS = [
    ("curl-exact",     "GET /json/list HTTP/1.1\r\nHost: localhost:{port}\r\nUser-Agent: curl/8.21.0\r\nAccept: */*\r\n\r\n"),
    ("host-ip",        "GET /json/list HTTP/1.1\r\nHost: 127.0.0.1:{port}\r\nConnection: close\r\n\r\n"),
    ("host-localhost", "GET /json/list HTTP/1.1\r\nHost: localhost:{port}\r\nConnection: close\r\n\r\n"),
    ("http10",         "GET /json/list HTTP/1.0\r\nHost: localhost:{port}\r\n\r\n"),
]

class BetixLogger:
    def __init__(self, log_dir, scope, max_size=716800):
        self.log_dir = pathlib.Path(log_dir)
        self.log_dir.mkdir(parents=True, exist_ok=True)
        self.scope = scope
        self.max_size = max_size
        self.current_file = None
        self.current_size = 0
        self.index = 1
        self.timestamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H-%M-%SZ")
        self.first_record = True
        self._open_new_file()

    def _get_filename(self):
        return self.log_dir / f"betix_{self.scope}_{self.timestamp}_{self.index:04d}.json"

    def _open_new_file(self):
        if self.current_file:
            self.current_file.write("\n]\n")
            self.current_file.close()
        self.filename = self._get_filename()
        self.current_file = open(self.filename, "w", encoding="utf-8")
        self.current_file.write("[\n")
        self.current_size = 2
        self.first_record = True

    def log(self, level, message, data=None):
        record = {
            "ts": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "scope": self.scope,
            "level": level,
            "msg": message
        }
        if data:
            record["data"] = data

        line = json.dumps(record)
        prefix = "" if self.first_record else ",\n"
        self.first_record = False

        write_str = prefix + line
        line_bytes = len(write_str.encode("utf-8"))

        if self.current_size + line_bytes + 4 > self.max_size:
            self.index += 1
            self._open_new_file()
            write_str = line
            line_bytes = len(write_str.encode("utf-8"))

        self.current_file.write(write_str)
        self.current_file.flush()
        self.current_size += line_bytes

    def close(self):
        if self.current_file:
            self.current_file.write("\n]\n")
            self.current_file.close()

class SessionLogger:
    """v4.8/v4.9: one valid-JSON file per run, all scopes merged, no rotation.
    Active only when config single_file is true (operator session capture).
    Fresh file at startup, appended until the process closes. v4.9: the file
    is a real JSON array (betix_session_<ts>.json), rewritten atomically on
    every record so it stays valid even if the process is killed mid-run."""

    def __init__(self, log_dir):
        self.log_dir = pathlib.Path(log_dir)
        self.log_dir.mkdir(parents=True, exist_ok=True)
        ts = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H-%M-%SZ")
        self.filename = self.log_dir / f"betix_session_{ts}.json"
        self.records = []
        self._write()

    def log(self, scope, level, message, data=None):
        record = {
            "ts": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "scope": scope,
            "level": level,
            "msg": message
        }
        if data is not None:
            record["data"] = data
        self.records.append(record)
        self._write()

    def _write(self):
        tmp = str(self.filename) + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(self.records, f, indent=1)
        os.replace(tmp, self.filename)

    def close(self):
        try:
            self._write()
        except Exception:
            pass


class SessionScope:
    """Adapter so single-file mode plugs into every logger.log(level, msg, data)
    call site unchanged."""

    def __init__(self, session, scope):
        self._session = session
        self._scope = scope

    def log(self, level, message, data=None):
        self._session.log(self._scope, level, message, data)

    def close(self):
        pass

def load_config():
    default_config = {
        "bridge_port": 8765,
        "log_dir": "./logs",
        "max_log_size_bytes": 716800,
        "report_output": "./fisen_report.json",
        "lock_file": "./.fisen.lock",
        "cdp_enabled": True,
        "cdp_port": 9222,
        "single_file": False
    }
    config_path = pathlib.Path("fisen.config.json")
    if config_path.exists():
        try:
            with open(config_path, "r") as f:
                loaded = json.load(f)
                default_config.update(loaded)
        except Exception as e:
            print(f"[WARN] Failed to parse fisen.config.json, using defaults: {e}")
    return default_config

def acquire_lock(lock_file):
    lock_path = pathlib.Path(lock_file)
    try:
        if lock_path.exists():
            with open(lock_path, "r") as f:
                pid = int(f.read().strip())
            try:
                os.kill(pid, 0)
                return False, pid
            except OSError:
                pass
        with open(lock_path, "w") as f:
            f.write(str(os.getpid()))
        return True, os.getpid()
    except Exception as e:
        return False, str(e)

def release_lock(lock_file):
    try:
        os.remove(lock_file)
    except OSError:
        pass

def read_existing_report(report_path):
    try:
        if report_path.exists():
            with open(report_path, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception:
        pass
    return None

def merge_report(report_path, payload):
    """ingame merges wire+HUD into existing; menu carries forward any ingame/cdp data
    so a late refresh tab can no longer clobber captured wire evidence."""
    phase = payload.get("phase", "menu")
    existing = read_existing_report(report_path)
    if phase == "ingame" and existing:
        existing["wsHook"] = payload.get("wsHook", existing.get("wsHook", {}))
        existing["workerHook"] = payload.get("workerHook", existing.get("workerHook", {}))
        existing["hudTimeline"] = payload.get("hudTimeline", existing.get("hudTimeline", []))
        existing["tapMode"] = payload.get("tapMode", existing.get("tapMode"))
        existing["ingameTimestamp"] = payload.get("timestamp")
        existing["phases"] = sorted(set(existing.get("phases", ["menu"]) + ["ingame"]))
        merged = existing
    else:
        merged = payload
        if existing and "ingame" in existing.get("phases", []):
            for k in ("wsHook", "workerHook", "hudTimeline", "cdp", "ingameTimestamp"):
                if k in existing:
                    merged[k] = existing[k]
            merged["phases"] = ["ingame", "menu"]
        else:
            merged["phases"] = [phase]
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(merged, f, indent=2)
    return phase

def merge_cdp_into_report(report_path, snap):
    """union frames across sessions, deduped by (rt, dir, len), capped, windowed."""
    existing = read_existing_report(report_path) or {}
    old = existing.get("cdp") or {}
    seen = set()
    frames = []
    for rec in (old.get("frames") or []) + (snap.get("frames") or []):
        key = (rec.get("rt"), rec.get("dir"), rec.get("len"))
        if key in seen:
            continue
        seen.add(key)
        frames.append(rec)
    frames.sort(key=lambda r: r.get("rt") or 0)
    if len(frames) > 400:
        frames = frames[-400:]
    sockets = dict(old.get("sockets") or {})
    sockets.update(snap.get("sockets") or {})
    windows = list(old.get("captureWindows") or [])
    ts = [r.get("rt") for r in (snap.get("frames") or []) if r.get("rt") is not None]
    if ts:
        windows.append({"from": min(ts), "to": max(ts), "count": len(snap.get("frames") or [])})
    existing["cdp"] = {
        "source": "cdp",
        "sockets": sockets,
        "frameCount": len(frames),
        "frames": frames,
        "captureWindows": windows[-20:]
    }
    existing["phases"] = sorted(set(existing.get("phases", ["menu"]) + ["cdp"]))
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(existing, f, indent=2)

async def read_http_response(reader):
    """v4.7: stop reading when the body is complete. keep-alive no longer hangs us."""
    head = await reader.readuntil(b"\r\n\r\n")
    lines = head.decode("utf-8", "replace").split("\r\n")
    status_line = lines[0] if lines else ""
    headers = {}
    for line in lines[1:]:
        if ":" in line:
            k, v = line.split(":", 1)
            headers[k.strip().lower()] = v.strip()
    transfer = headers.get("transfer-encoding", "").lower()
    length = headers.get("content-length")
    if "chunked" in transfer:
        body = b""
        while True:
            size_line = await reader.readuntil(b"\r\n")
            size_token = size_line.strip().split(b";")[0] or b"0"
            size = int(size_token, 16)
            if size == 0:
                await reader.readuntil(b"\r\n")
                break
            body += await reader.readexactly(size)
            await reader.readexactly(2)
    elif length is not None:
        body = await reader.readexactly(int(length))
    else:
        body = await reader.read(-1)
    return status_line, body

async def fetch_one_variant(port, name, template, timeout=4):
    reader, writer = await asyncio.open_connection("127.0.0.1", port)
    try:
        writer.write(template.format(port=port).encode("utf-8"))
        await writer.drain()
        status_line, body = await asyncio.wait_for(read_http_response(reader), timeout=timeout)
    finally:
        writer.close()
    if "200" not in status_line:
        raise ConnectionError(f"variant {name} answered: {status_line}")
    return json.loads(body.decode("utf-8", "replace"))

async def fetch_targets_raw(port, logger):
    last_err = None
    for name, template in REQUEST_VARIANTS:
        try:
            targets = await fetch_one_variant(port, name, template)
            if CDP_STATE["http_variant"] != name:
                CDP_STATE["http_variant"] = name
                print(f"[FISEN] CDP: DevTools HTTP answered variant '{name}'. Using it from now on.")
                logger.log("INFO", "CDP DevTools HTTP variant resolved", {"variant": name})
            return targets
        except asyncio.CancelledError:
            raise
        except Exception as e:
            last_err = e
            continue
    raise last_err or ConnectionError("all variants failed")

def announce(logger, state_key, text, level="WARN"):
    if CDP_STATE.get("last_console_state") == state_key:
        return
    CDP_STATE["last_console_state"] = state_key
    print(text)
    logger.log(level, text)

# v4.8 wire-truth census. Observed facts only: direction, length, and the first
# payload byte where it base64-decodes cleanly (binary frames) — "text" when it
# does not. No packet layouts are decoded or claimed here.
WIRE = {"in": {}, "out": {}, "n_in": 0, "n_out": 0, "win_in": 0, "win_out": 0,
        "win_ops": {}, "last_sum": 0.0}

def wire_note(direction, preview):
    try:
        key = "text"
        if isinstance(preview, str) and len(preview) >= 4:
            try:
                raw = base64.b64decode(preview[:4])
                if len(raw) >= 1:
                    key = f"0x{raw[0]:02x}"
            except Exception:
                key = "text"
        h = WIRE.get(direction)
        if isinstance(h, dict):
            h[key] = h.get(key, 0) + 1
        WIRE["n_" + direction] = WIRE.get("n_" + direction, 0) + 1
        WIRE["win_in" if direction == "in" else "win_out"] += 1
        WIRE["win_ops"][direction + ":" + key] = WIRE["win_ops"].get(direction + ":" + key, 0) + 1
    except Exception:
        pass

async def cdp_observe(logger, config):
    try:
        import websockets
    except ImportError:
        print("[FISEN] CDP observer disabled: 'websockets' not installed. Run: pip install websockets")
        logger.log("WARN", "CDP observer disabled: 'websockets' not installed. Run: pip install websockets")
        return

    port = config["cdp_port"]
    print(f"[FISEN] CDP observer task alive. Probing 127.0.0.1:{port} with a content-length-aware reader.")
    logger.log("INFO", "CDP observer task started", {"port": port})

    async def timed_connect(url):
        return await websockets.connect(url, max_size=2 ** 22)

    while True:
        try:
            targets = await fetch_targets_raw(port, logger)
        except asyncio.CancelledError:
            raise
        except Exception as e:
            CDP_STATE["attached"] = False
            CDP_STATE["target_id"] = None
            announce(logger, "fetch-fail",
                     f"[FISEN] CDP: port {port} still not answering any request shape ({str(e)[:80]}). "
                     f"HAR path (har_ingest.py) is the wire source until this clears.")
            logger.log("WARN", "CDP observer retry", {"error": str(e)[:120]})
            await asyncio.sleep(5)
            continue

        try:
            page = next((t for t in targets if t.get("type") == "page" and "play.gota.io" in (t.get("url") or "")), None)
            if not page or not page.get("webSocketDebuggerUrl"):
                CDP_STATE["attached"] = False
                seen_urls = [(t.get("url") or "")[:60] for t in targets if t.get("type") == "page"][:6]
                announce(logger, "no-game-tab",
                         f"[FISEN] CDP: port {port} reachable but NO play.gota.io tab in THIS browser. "
                         f"tabs seen: {seen_urls}. Open the game in the flagged browser.")
                await asyncio.sleep(5)
                continue
            if page.get("id") == CDP_STATE["target_id"]:
                await asyncio.sleep(5)
                continue
            CDP_STATE["target_id"] = page.get("id")
            try:
                conn = await asyncio.wait_for(timed_connect(page["webSocketDebuggerUrl"]), timeout=10)
            except asyncio.TimeoutError:
                CDP_STATE["attached"] = False
                announce(logger, "connect-hang",
                         f"[FISEN] CDP: debugger socket handshake never completed within 10 s. Relaunch browser with the flag.")
                await asyncio.sleep(5)
                continue
            async with conn as ws:
                CDP_STATE["attached"] = True
                announce(logger, "attached",
                         f"[FISEN] CDP ATTACHED to game tab ({page.get('url')}). Wire capture live. You may click Play.",
                         level="INFO")
                logger.log("INFO", "CDP observer attached to game tab", {"target": page.get("id"), "url": page.get("url")})
                await ws.send(json.dumps({"id": 1, "method": "Network.enable", "params": {}}))
                async for raw in ws:
                    msg = json.loads(raw)
                    m = msg.get("method")
                    p = msg.get("params", {})
                    if m == "Network.webSocketCreated":
                        CDP_STATE["sockets"][str(p.get("socketId"))] = p.get("url")
                        logger.log("INFO", "CDP: game WebSocket created", {"url": p.get("url")})
                    elif m in ("Network.webSocketFrameReceived", "Network.webSocketFrameSent"):
                        direction = "in" if m.endswith("Received") else "out"
                        body = p.get("response") if direction == "in" else p.get("request")
                        payload_data = (body or {}).get("payloadData") or ""
                        CDP_STATE["frames"].append({
                            "dir": direction,
                            "t": p.get("timestamp"),
                            "rt": int(datetime.datetime.now(datetime.timezone.utc).timestamp() * 1000),
                            "len": len(payload_data),
                            "preview": payload_data[:256],
                            "socketUrl": CDP_STATE["sockets"].get(str(p.get("socketId")))
                        })
                        if len(CDP_STATE["frames"]) > 400:
                            CDP_STATE["frames"] = CDP_STATE["frames"][-400:]
                        CDP_STATE["dirty"] = True
                        wire_note(direction, payload_data)
        except asyncio.CancelledError:
            raise
        except Exception as e:
            CDP_STATE["target_id"] = None
            CDP_STATE["attached"] = False
            logger.log("WARN", "CDP observer retry (browser not debuggable yet?)", {"error": str(e)[:120]})
            await asyncio.sleep(5)
            continue
        if not CDP_STATE["attached"]:
            now = datetime.datetime.now(datetime.timezone.utc).timestamp()
            if now - CDP_STATE["last_nag"] >= 30:
                CDP_STATE["last_nag"] = now
                print(f"[FISEN] CDP still not attached (state: {CDP_STATE.get('last_console_state')}). "
                      f"The game tab and the --remote-debugging-port flag must live in the SAME browser.")

async def wire_watch(logger):
    """v4.8: every 30 s, if frames flowed, log the wire-truth summary. This is
    the record that proves the game stream is alive during a session — the
    contrast with an empty client-side reader is then evidence, not assertion."""
    while True:
        await asyncio.sleep(30)
        try:
            wi = WIRE.get("win_in", 0)
            wo = WIRE.get("win_out", 0)
            if wi + wo == 0:
                continue
            ops = dict(WIRE.get("win_ops", {}))
            WIRE["win_in"] = 0
            WIRE["win_out"] = 0
            WIRE["win_ops"] = {}
            WIRE["last_sum"] = datetime.datetime.now(datetime.timezone.utc).timestamp()
            top = sorted(ops.items(), key=lambda kv: kv[1], reverse=True)[:8]
            logger.log("INFO", "wire alive (30 s window)",
                       {"in": wi, "out": wo,
                        "total_in": WIRE.get("n_in", 0), "total_out": WIRE.get("n_out", 0),
                        "top_ops": [{"op": k, "n": v} for k, v in top],
                        "sockets": list(CDP_STATE.get("sockets", {}).values())})
        except asyncio.CancelledError:
            raise
        except Exception as e:
            logger.log("ERROR", "wire watch failed", {"error": str(e)[:120]})

async def cdp_flush(logger, config):
    report_path = pathlib.Path(config["report_output"])
    while True:
        await asyncio.sleep(5)
        if not CDP_STATE["dirty"]:
            continue
        CDP_STATE["dirty"] = False
        snap = {
            "source": "cdp",
            "sockets": CDP_STATE["sockets"],
            "frameCount": len(CDP_STATE["frames"]),
            "frames": CDP_STATE["frames"][-120:]
        }
        try:
            merge_cdp_into_report(report_path, snap)
            logger.log("INFO", "CDP wire frames merged into report",
                       {"sockets": len(CDP_STATE["sockets"]), "frames": len(CDP_STATE["frames"])})
        except Exception as e:
            logger.log("ERROR", "CDP report merge failed", {"error": str(e)})

async def handle_http(reader, writer, logger, config):
    try:
        request_line = await reader.readline()
        if not request_line:
            writer.close()
            return

        headers = {}
        while True:
            line = await reader.readline()
            if line == b'\r\n' or not line:
                break
            if b':' in line:
                key, val = line.split(b':', 1)
                headers[key.strip().lower()] = val.strip()

        parts = request_line.decode().split(' ')
        if len(parts) < 2:
            writer.close()
            return
        method, path = parts[0], parts[1]

        content_length = int(headers.get(b'content-length', 0))
        body = b""
        if content_length > 0:
            body = await reader.readexactly(content_length)

        response_data = {}
        status = "200 OK"

        if method == 'OPTIONS':
            # Step 5: CORS preflight for the https page talking to loopback.
            response_data = {}
            status = "204 No Content"

        elif method == 'POST' and path == '/handshake':
            try:
                data = json.loads(body)
                agent = data.get("agent")
                url = data.get("url", "")
                flavor = data.get("clientFlavor", "unknown")
                instance = data.get("instanceId", "unknown")

                if agent != "fisen.detector.user.js":
                    logger.log("WARN", "Rejected handshake from unknown agent.", {"agent": agent})
                    response_data = {"error": "unknown agent"}
                elif "play.gota.io" not in url:
                    logger.log("WARN", "Rejected handshake from non-game URL.", {"url": url})
                    response_data = {"error": "wrong url"}
                else:
                    if data.get("clientDetected"):
                        WAIT_STATE.pop(url, None)
                        if url not in CONFIRMED_STATE:
                            CONFIRMED_STATE[url] = True
                            logger.log("INFO", f"Live client confirmed (flavor: {flavor}, instance: {instance}). Dispatching scan command.", {"evidence": data.get("evidence")})
                        response_data = {"action": "scan_environment"}
                    else:
                        now = datetime.datetime.now(datetime.timezone.utc).timestamp()
                        st = WAIT_STATE.setdefault(url, {"count": 0, "last_log": 0.0})
                        st["count"] += 1
                        if st["count"] == 1 or (now - st["last_log"] >= 10):
                            st["last_log"] = now
                            logger.log("WARN", "Detector connected but live client not yet verified. Waiting.", {"url": url, "instance": instance, "handshake_count": st["count"]})
                        response_data = {"action": "wait"}
            except Exception as e:
                logger.log("ERROR", "Handshake parse error", {"error": str(e)})
                response_data = {"error": "parse error"}

        elif method == 'POST' and path == '/report':
            try:
                data = json.loads(body)
                payload = data.get("data", {})
                sample_count = len(payload.get("wsHook", {}).get("samplePackets", []))
                socket_count = len(payload.get("wsHook", {}).get("sockets", []))
                worker_in = len(payload.get("workerHook", {}).get("inbound", []))
                worker_out = len(payload.get("workerHook", {}).get("outbound", []))
                hud_count = len(payload.get("hudTimeline", []))
                bind_count = len(payload.get("shortcutSet", {}).get("binds", []))
                phase = payload.get("phase", "menu")
                logger.log("INFO", f"Environment report received (phase: {phase}). Assimilating.",
                           {"sockets": socket_count, "sample_packets": sample_count,
                            "worker_in": worker_in, "worker_out": worker_out,
                            "hud_samples": hud_count, "binds_captured": bind_count})
                report_path = pathlib.Path(config["report_output"])
                merge_report(report_path, payload)
                logger.log("INFO", "Report written to disk", {"path": str(report_path), "phase": phase})
                response_data = {"status": "success"}
            except Exception as e:
                logger.log("ERROR", "Report parse error", {"error": str(e)})
                response_data = {"error": "parse error"}

        elif method == 'POST' and path == '/dump':
            try:
                data = json.loads(body)
                logger.log("INFO", "Diagnostic dump received. Writing to fisen_dump.json", {"instance": data.get("instanceId")})
                dump_path = pathlib.Path("fisen_dump.json")
                with open(dump_path, "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=2)
                response_data = {"status": "dump_saved"}
            except Exception as e:
                logger.log("ERROR", "Dump parse error", {"error": str(e)})
                response_data = {"error": "parse error"}

        elif method == 'POST' and path == '/log':
            # Step 5: Betix ingest for in-page emitters (murther.user.js MX_BETIX).
            # Cap, folder and rotation stay enforced inside BetixLogger itself.
            try:
                data = json.loads(body)
                scope = str(data.get("scope") or "murther")[:32]
                records = data.get("records") or []
                if not isinstance(records, list):
                    raise ValueError("records must be a list")
                slog = None
                session = SESSION.get("obj")
                if session is not None:
                    # v4.8 single-file mode: every scope lands in the session file.
                    slog = SessionScope(session, scope)
                else:
                    slog = BETIX_SCOPE_LOGGERS.get(scope)
                    if slog is None:
                        slog = BetixLogger(config["log_dir"], scope, config["max_log_size_bytes"])
                        BETIX_SCOPE_LOGGERS[scope] = slog
                accepted = 0
                for rec in records[:100]:
                    if not isinstance(rec, dict):
                        continue
                    level = str(rec.get("level") or "INFO")[:16]
                    msg = str(rec.get("msg") or "")[:500]
                    rdata = rec.get("data")
                    slog.log(level, msg, rdata)
                    accepted += 1
                response_data = {"status": "success", "accepted": accepted}
            except Exception as e:
                logger.log("ERROR", "Log ingest parse error", {"error": str(e)})
                response_data = {"error": "parse error"}

        else:
            status = "404 Not Found"
            response_data = {"error": "not found"}

        resp_body = json.dumps(response_data).encode('utf-8')
        http_resp = (f"HTTP/1.1 {status}\r\nContent-Type: application/json\r\n"
                     f"Access-Control-Allow-Origin: *\r\n"
                     f"Access-Control-Allow-Methods: POST, OPTIONS\r\n"
                     f"Access-Control-Allow-Headers: Content-Type\r\n"
                     f"Content-Length: {len(resp_body)}\r\nConnection: close\r\n\r\n").encode('utf-8') + resp_body
        writer.write(http_resp)

    except Exception as e:
        logger.log("ERROR", "HTTP handler crashed", {"error": str(e)})
    finally:
        try:
            await writer.drain()
        except:
            pass
        writer.close()

def task_death_callback(logger, name):
    def cb(task):
        if task.cancelled():
            return
        exc = task.exception()
        if exc is not None:
            print(f"[FISEN] TASK {name} DIED: {exc!r}")
            logger.log("FATAL", f"Background task {name} died", {"error": repr(exc)})
    return cb

async def main():
    if len(sys.argv) > 1:
        print("[FATAL] Launch contract violated. Run exactly: python fisen.py")
        sys.exit(1)

    for key in ("HTTP_PROXY", "http_proxy", "HTTPS_PROXY", "https_proxy", "ALL_PROXY", "all_proxy"):
        os.environ.pop(key, None)

    config = load_config()
    # v4.8: single-file session mode. One betix_session_<ts>.jsonl per run, all
    # scopes merged, no rotation — the operator's whole session in one place.
    # Default stays rotation-compliant; the local fisen.config.json opts in.
    session = None
    if config.get("single_file"):
        session = SessionLogger(config["log_dir"])
        SESSION["obj"] = session
        logger = SessionScope(session, "fisen")
        print(f"[FISEN] single-file session log: {session.filename}")
    else:
        logger = BetixLogger(config["log_dir"], "fisen", config["max_log_size_bytes"])
    logger.log("INFO", "Fisen observation script starting", {"config": config})

    locked, pid_or_err = acquire_lock(config["lock_file"])
    if not locked:
        logger.log("FATAL", "Instance lock failed. Another Fisen process is running or stale lock exists.", {"pid_or_err": str(pid_or_err)})
        print(f"[FATAL] Instance lock failed. PID/Err: {pid_or_err}")
        sys.exit(1)

    logger.log("INFO", "Instance lock acquired", {"pid": pid_or_err})

    if config.get("cdp_enabled", True):
        t1 = asyncio.create_task(cdp_observe(logger, config))
        t1.add_done_callback(task_death_callback(logger, "cdp_observe"))
        t2 = asyncio.create_task(cdp_flush(logger, config))
        t2.add_done_callback(task_death_callback(logger, "cdp_flush"))
        t3 = asyncio.create_task(wire_watch(logger))
        t3.add_done_callback(task_death_callback(logger, "wire_watch"))

    try:
        # v4.8: the listener restarts itself on failure. Capture runs until the
        # operator closes the process — a dead socket never ends the session.
        while True:
            try:
                logger.log("INFO", "Starting local HTTP bridge", {"port": config["bridge_port"]})
                server = await asyncio.start_server(
                    lambda r, w: handle_http(r, w, logger, config),
                    'localhost',
                    config["bridge_port"]
                )
                print(f"[FISEN] HTTP Bridge armed on http://localhost:{config['bridge_port']}. CDP observer on port {config.get('cdp_port', 9222)} (content-length-aware).")
                await server.serve_forever()
                break  # serve_forever only returns on clean close; fall through to release.
            except (asyncio.CancelledError, KeyboardInterrupt):
                raise
            except Exception as e:
                logger.log("FATAL", "Bridge listener died — re-arming in 5 s, capture continues", {"error": str(e)[:200]})
                print("[FISEN] Bridge listener died — re-arming in 5 s (session capture continues).")
                await asyncio.sleep(5)
    except (asyncio.CancelledError, KeyboardInterrupt):
        pass
    except Exception as e:
        logger.log("FATAL", "Bridge server crashed", {"error": str(e)})
    finally:
        release_lock(config["lock_file"])
        logger.log("INFO", "Instance lock released. Fisen shutting down.")
        try:
            logger.close()
        except Exception:
            pass
        if session is not None:
            try:
                session.close()
            except Exception:
                pass

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
