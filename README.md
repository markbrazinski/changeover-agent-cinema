# Changeover: Autonomous AI Caption Continuity for Live Television

> **One-Sentence Thesis**: Changeover uses Google Gemini 2.5 Flash, Google ADK, and Grafana Cloud MCP to detect viewer-impacting caption failures on live broadcast channels in seconds, isolate caption-layer faults from video feed issues, arbitrate scarce backup capacity via a deterministic policy engine, and present a single-click authorization gate to a human broadcast engineer.

---

## 📺 Product Demonstration & Screenshots

![Human Authorization Gate](tests/e2e/screenshots/beat_05_awaiting_approval.png)
*Figure 1: The Human Authorization Gate halts the incident workflow until a human broadcast engineer authorizes failover. Real PromQL sync offset (+2.996s) and Gemini diagnostic rationale are displayed on the right Agent Spine panel.*

---

## 💥 The Problem

In live television broadcasting, captions often drift or freeze silently while the primary video and audio feeds remain perfectly healthy. When a caption encoder fails, viewers who rely on closed captions suffer an immediate accessibility blackout.

Today, broadcast engineering teams must manually:
1. Notice caption drift on a wall of broadcast monitors.
2. Search Grafana observability dashboards to identify the specific faulty channel.
3. Determine whether the fault is in the caption encoder or the main video transmission.
4. Verify whether a secondary backup stream is healthy.
5. Manually switch the transmission line.

This process takes minutes, violating compliance regulations and disrupting viewer access.

---

## ⚡ What Changeover Does

Changeover is an autonomous broadcast accessibility agent that protects caption continuity:

- **Continuous Telemetry Tracking**: Monitors live caption cue sync offset (`caption_cue_sync_offset_seconds`) and feed liveness (`feed_liveness_seconds`) across channels.
- **Grafana Cloud MCP Investigation**: Queries live Prometheus metrics via official Grafana Labs `mcp-grafana` Go server.
- **Gemini-Powered Layer Isolation**: Evaluates telemetry evidence using **Google Gemini 2.5 Flash** through **Google ADK** to discriminate between viewer-impacting caption freeze vs. main feed video liveness faults.
- **Deterministic Resource Contention Arbitration**: When multiple channels fault concurrently ($N=2$) and backup capacity is scarce ($M=1$), a deterministic policy engine applies operator-declared service tiers (`Emergency/Public-Info` vs. `General Entertainment`).
- **Human Authorization Gate**: Halts execution indefinitely before hardware actuation, requiring explicit human operator approval (`operator:mark`).

---

## 🔄 Demonstrated End-to-End Flow

### Wave 1: Single-Channel Failover (Use Case 1)
1. **Healthy Baseline**: Channel 14 (*Tears of Steel*) plays with nominal caption sync offset ($+0.510\text{s}$).
2. **Caption Freeze Fault**: At `t=20.0s`, captions freeze on the right viewer while the video stream continues playing smoothly.
3. **Agent Investigation**: Python orchestration queries official Grafana MCP and passes telemetry evidence to **Gemini 2.5 Flash** via **Google ADK**. Gemini evaluates telemetry metrics ($+2.996\text{s}$ offset) and isolates the failure to the caption layer.
4. **Backup Stream Verification**: `ffprobe` programmatically checks the secondary backup file (`backup.mp4`), confirming stream health.
5. **Human Authorization Gate**: The Agent Spine opens the Human Authorization Gate (`05_awaiting_approval`) and **halts indefinitely**.
6. **Failover Actuation**: The operator clicks **`AUTHORIZE FAILOVER`**. Source switches to backup and caption sync restores to $+0.486\text{s}$.

### Wave 2: Two-Channel Resource Contention (Use Case 2)
1. **Healthy 2-Channel Baseline**: Channel 14 (*Tears of Steel*) and Channel 27 (*Sintel*) play side-by-side.
2. **Concurrent Caption Failures**: At `T+7.5s`, caption failures occur simultaneously on both channels ($N=2$).
3. **Scarce Capacity Evaluation**: The backup pool has only $M=1$ available backup line.
4. **Deterministic Policy Priority**: The policy engine evaluates operator-declared service tiers:
   - **CH-14**: Emergency / Public-Information Tier (Priority 1) $\rightarrow$ **RECOMMENDED RESTORE**
   - **CH-27**: General Entertainment Tier (Priority 2) $\rightarrow$ **FLAG UNMITIGATED**
5. **Human Authorization Gate**: The Agent Spine presents the prioritization trade-off and halts indefinitely.
6. **Partial Mitigation**: Upon operator click, CH-14 is restored to the backup feed while CH-27 remains degraded (`PARTIALLY MITIGATED`).

---

## 🏛️ System Architecture & Call Graph

```
Python Orchestration
       │
       ▼
Official Grafana MCP (mcp-grafana stdio)
       │
       ▼
Live Operational Evidence
       │
       ▼
Gemini 2.5 Flash through Google ADK
       │
       ▼
Structured Layer Diagnosis
       │
       ▼
Deterministic Policy Engine (Service Tiers)
       │
       ▼
⏸ HUMAN AUTHORIZATION GATE (Halts for Operator)
       │ (Operator Click)
       ▼
Actuator Tool (Source Failover)
```

---

## 🧩 How Gemini, ADK, and Grafana Power Changeover

| Point | Sponsor role | Product consequence |
|---|---|---|
| Live operational evidence | **Grafana** returns current, channel-scoped PromQL measurements through its official MCP server. | Changeover gets one operational query path across channels instead of requiring operators or incident-specific code to inspect each dashboard separately. |
| Evidence-directed diagnosis | **Gemini + ADK and Grafana** pass current operational evidence through a structured ADK diagnosis. | Changing combinations of channel evidence become a consistent failed-layer assessment without maintaining a separate hand-authored diagnosis path for every incident shape. |

Gemini does not assign service priority or authorize a switch. A deterministic policy engine applies the network’s predeclared capacity and service tiers. The human operator authorizes the consequence.

---

## ⚖️ Authority Boundaries

To ensure safe, broadcast-compliant execution:

- **Gemini does NOT assign service priority**: Priorities are dictated by operator-declared policy configurations (`CHANNELS[cid].criticality_tier`).
- **Gemini does NOT authorize failovers**: Failover execution is strictly blocked until an explicit `human_authorizer` parameter is supplied by the operator.
- **Deterministic code manages capacity**: $M=1$ backup allocation during resource contention is sorted programmatically by `ContentionSupervisor`.
- **The Human Operator owns the final action**: Hardware actuation never executes automatically.

---

## 🚀 Judge Quickstart

### Prerequisites
- **Node.js**: v18+ (tested on v20+)
- **Python**: 3.10+ (requires `google-adk` and `mcp`)
- **Official Grafana MCP**: `mcp-grafana` (`brew install mcp-grafana` or Go binary)

### 1-Minute Launch
```bash
# 1. Install frontend & Python dependencies
npm install
python3 -m pip install -r requirements.txt

# 2. Start FastAPI Backend (Port 8008)
PYTHONPATH="." python3 scripts/run_server.py &

# 3. Start React Frontend (Port 5173)
npm run dev
```

Open **`http://localhost:5173`** in your browser.

---

## 🎛️ Running the Demo & Scenario Controls

When viewing the application UI at `http://localhost:5173`, use the visible controls in the top header as the primary launch method:

| Scenario | Header control | Expected outcome |
| --- | --- | --- |
| Single-channel recovery | `CAPTION RECOVERY` | Changeover isolates a caption-layer failure, waits for human authorization, and restores the channel through the verified backup. |
| Resource contention | `CAPACITY CONTENTION` | Two channels require one backup; deterministic policy presents the tradeoff, the operator authorizes it, and the final state is `PARTIALLY MITIGATED`. |

### Secondary Operator Replay Shortcuts
For operator replay or keyboard-driven demos, the top header controls are also bound to these single-key shortcuts:

- **Key `(1)`**: **Single-Channel Failover Replay** — Triggers the `CAPTION RECOVERY` scenario.
- **Key `(3)`**: **Training Overlay Replay** — Triggers single-channel recovery with timecode timer overlay.
- **Key `(2)`**: **Resource Contention Replay** — Triggers the `CAPACITY CONTENTION` scenario.

---

## 🧪 Tests & Verification

Verify the complete system using the automated test suite:

```bash
# 1. Run Backend Unit, Sponsor-Path, & Integration Tests
PYTHONPATH="." python3 -m pytest tests/test_sponsor_path.py tests/test_slice2.py tests/test_slice6.py
# Expected output: 13 passed

# 2. Install Playwright Browsers (if required)
npx playwright install chromium

# 3. Run End-to-End Playwright Audit Suite (Browser E2E)
npx playwright test tests/e2e/e2e_audit.spec.ts
# Expected output: 4 passed in ~1.9m
```

The Playwright suite verifies both visible scenario header controls (`CAPTION RECOVERY` and `CAPACITY CONTENTION`), backend-driven Agent Spine evidence, the human-authorization boundary, and the two terminal outcomes (`RESTORED` and `PARTIALLY MITIGATED`).

---

## 📁 Repository Structure

```
changeover-agent-cinema/
├── changeover/                 # Python Backend Package
│   ├── action/                 # Actuator tools (backup_verifier, failover_tool)
│   ├── agent/                  # Diagnoser (Gemini 2.5 Flash via ADK) & orchestration loops
│   ├── ceilings/               # Derived safety thresholds & ceiling models
│   ├── config/                 # Channel configurations & service tiers
│   ├── contention/             # ContentionSupervisor (M<N capacity arbitration)
│   ├── evidence/               # GrafanaMCPClient & EvidenceGate
│   ├── server/                 # FastAPI server application (app.py)
│   └── telemetry/              # CaptionMeter, ProgramClock, PrometheusExporter
├── src/                        # React Frontend Application
│   ├── components/             # AgentSpine, SplitHero, EvidenceChart
│   └── App.tsx                 # Main UI, header scenario controls & keyboard shortcut orchestration
├── films/                      # Open-source video streams & WebVTT caption sidecars
├── tests/                      # Pytest unit tests & Playwright E2E audit suites
├── .env.example                # Sanitized configuration template
├── ATTRIBUTION.md              # Open-source media & library attributions
└── LICENSE                     # MIT License
```

---

## 💡 Honest Limitations

- **Simulated Hardware Switching**: In this broadcast cinema demonstration, feed failover toggles media streams on screen rather than sending SDI/IP hardware router matrix commands.
- **Predeclared Service Tiers**: Channel criticality tiers (`Emergency` vs `General`) are loaded from static configuration files (`CHANNELS`) rather than an active enterprise CMDB.
- **External Binary Requirement**: Executing live MCP queries requires the official `mcp-grafana` Go binary installed in system `PATH` or configured via `GRAFANA_MCP_BIN`.
- **Local/Demo Metric Fallback**: When remote Grafana Cloud Prometheus queries are unpopulated or offline, local evidence rules ensure uninterrupted presentation and deterministic fallback.

---

## 📜 License & Attribution

- **Code License**: [MIT License](LICENSE)
- **Media Credits**: See [ATTRIBUTION.md](ATTRIBUTION.md) for full Blender Foundation CC BY 3.0 credits (*Tears of Steel* & *Sintel*).
