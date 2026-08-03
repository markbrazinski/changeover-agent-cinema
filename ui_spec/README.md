# Changeover — Design Reference & Behavior Spec

Broadcast-accessibility ops UI. This is **design/behavior reference**, not production code: 12 rendered state screenshots (`reference/NN-*.png`) plus the layout, information hierarchy, and transition spec below. Front-end is built separately from these.

Composition is **locked (2a)** — build to it, do not redesign: split hero (LEFT operator board / RIGHT the viewer's failing stream) + docked agent reasoning spine + a collapsed lane strip that expands one beat during investigation. Contention states add a **facility view above** the single-channel view.

---

## Brand tokens

**Type** — Space Grotesk (display/UI), Space Mono (telemetry, labels, timecode). Timecode is a recurring motif (PGM-OUT HH:MM:SS, T+MM:SS on the spine).

**Palette — accessibility-first: value carries state, color only reinforces.**
| Token | Hex | Role |
|---|---|---|
| Surface | `#f5f3ec` | frame background |
| Ink | `#16140f` | primary text, borders, "heaviest" alarm weight |
| Nominal | `#3b7a4b` / `#2f6a41` | healthy line/pill (reinforce only) |
| Alarm | `#b4231c` / `#8f1b16` | broken line, frozen — **heaviest/darkest/hatched**, survives desaturation |
| Restored | `#1d6e8c` / `#12566b` | post-swap restored (blue, not green — restored ≠ resolved) |
| Accent | `#b8641b` | **reserved** — scan sweep, capacity meter; **never sole-encodes a state** |

**Alarm must survive muted/desaturated capture** at 640px: it is the darkest, heaviest, hatched element — never red-only. Every state was checked at 640px + grayscale (the "muted-gate read" line under each state in-app).

**Logo** — cue-mark (rounded square + offset dot), the broadcast changeover cue.

---

## Honesty labels (non-negotiable — verify on every relevant screenshot)

- **SIGN legend** = `SIGN · feed-liveness (stand-in)` — process liveness on a stand-in feed. **Never** "signer feed" or anything implying real sign-language content.
- **AD row** = static hatched `AD — not monitored in this build · static`. **Never** a responding line.
- **Caption value** = a **live reading** with a live treatment (pulsing dot + `caption-sync offset · live`, `+55.70s` over `baseline 0.510s`). Not a pinned hero number — the figure is whatever the live series reads. *(In production, bind to `caption_cue_sync_offset_seconds`; read at render, don't hard-code.)*
- **Backup** = `pre-cut file standing in for a scarce live caption source` (stated in the Demo-scope strip).
- **Protected channel** = tier is **operator-declared before the incident**, agent read-only. Labeled defensibly — `Emergency / public-information tier`, **never "premium."**
- **Demo scope** strip (foot of facility view) carries the implementation disclosures.

Two measured layers only (CAP, SIGN). No AD metric, no signer feed, no rollback, no two independent accessibility layers claimed.

---

## Global frame anatomy (all states)

- **PGM header** (ink bar): cue-mark · `CHANGEOVER` · "captions layer" · `REFUSAL` badge (states 7/8) · **ON AIR** tally (pulsing) · `PGM-OUT` timecode.
- **Left column** — *The Split*: LEFT tile "what most people see" (clean PGM, captions in sync); RIGHT tile "what this viewer gets" (the failing stream), divided by a dashed ink rule. A status pill under each.
- **Evidence panel** (below the split): the two-line chart — **CAP** (caption cue-sync) + **SIGN** (feed-liveness stand-in) — big live caption readout at left, legend + AD static row at foot. This is the load-bearing diagnostic; it evolves frame to frame so "rule out peers" is *shown, not asserted*.
- **Right column** — *Agent spine*: cue-mark · `AGENT SPINE` · T+ substate, then stacked reasoning steps (done / active-scan / fill / pending / refuse). Approve·Hold gate or hold-note dock here. Foot line states the invariant.

Information hierarchy, every state: **the split reads first** (is a viewer harmed?) → **evidence panel** (which layer, by how much) → **spine** (what the agent is doing / refusing) → chrome.

---

## States — screen, hierarchy, and transition OUT

### Incident path (single channel)

**01 · At rest** — `01-at-rest.png`
Board green, both tiles calm, captions flowing. Evidence: two flat green lines (CAP + SIGN). Spine idle.
→ *Transition:* CAP line **breaks and climbs red** the instant a freeze is detected; RIGHT tile flips to frozen. → 02.

**02 · Failure detected** — `02-failure.png`
RIGHT tile "CAPTIONS FROZEN"; CAP line broken red, SIGN flat green; board still green (the divergence is the alarm). Spine: freeze detected.
→ *Transition:* lane strip **expands one beat**; spine opens a Grafana query. → 03.

**03 · Investigating** — `03-investigating.png`
The evidence panel *is* the reasoning: CAP climbs alone, SIGN holds flat = peers ruled out, shown not claimed. Spine shows the Grafana query with a **visible failed-query-then-retry**, then names CAPTIONS. *(Production: bind the spine calls to the real trace incl. the miss→retry and its latency.)*
→ *Transition:* a healthy **backup line appears**; spine runs ffprobe verify. → 04.

**04 · Backup verified** — `04-backup-verified.png`
Named failure confirmed; a healthy dashed backup line joins under the baseline, ffprobe-verified. Spine: safe to offer switch.
→ *Transition:* spine halts and surfaces the **Approve / Hold** gate. → 05.

**05 · Awaiting approval** — `05-awaiting-approval.png`
Agent halts, summons a human. Approve/Hold is the loudest new object; "will not switch without you." 
→ *Transition:* on Approve, spine switches then **re-measures** (post-swap read pending). → 06.

**06 · Changed over** — `06-changed-over.png`
Switched onto backup, then **confirmed by measurement**: CAP line visibly **rejoins baseline**, a `post-swap read ✓` pill earns a **restored** (blue) state — *not* a green "resolved." Audit entry logged. RIGHT tile "CAPTIONS RESTORED."
→ *Transition (terminal for the happy path):* holds restored, watching for regression.

**07 · Refusal — won't switch** — `07-refusal-wont-switch.png`
Backup exists but its line **never locks** (sync unconfirmable). CAP + SIGN stay fully readable; the refusal lands on the **action**: double-ruled `WILL NOT SWITCH`, hold-note docked. Evidence intact, action stopped.
→ *Distinct from 08:* here the evidence plane is legible; only the backup is unknown.

**08 · Refusal — won't guess (blind)** — `08-refusal-wont-guess-blind.png` — **CLIMAX**
Grafana MCP cut: **both** measured series ghost/blackout (hatched "no series"). RIGHT tile "WHICH LAYER?" intentionally unreadable. Spine **stays solid and keeps reasoning**, names no layer, refuses to fabricate. The unreadability *is* the proof.
→ *Distinct from 07 and from a surface error:* the whole evidence plane is dark, not one unknown value.

### Contention (facility view above the single-channel view)

Facility strip: `FACILITY VIEW · 2 channels · shared backup` + **capacity meter** (accent, reinforced by filled/empty squares + text, never color-only) + Demo-scope disclosure. Two full-size channel cards: **CH-14** (Emergency / public-information tier, operator-declared) and **CH-27** (General entertainment tier).

**09 · Two channels failing** — `09-two-channels-failing.png`
Both channel cards show CAP frozen, both mini CAP lines broken red; capacity reads **0 of 1 free · 2 need it**. The scarcity is the whole problem. Focused frame below = CH-14.
→ *Transition:* the tradeoff collapses into one decision card. → 10.

**10 · Contention decision** — `10-contention-decision.png`
One card holds the whole tradeoff: two verified caption failures, **capacity verified = 1**, RESTORE ▸ CH-14 vs STAYS DEGRADED ▸ CH-27 (the explicit cost). Policy shown **operator-declared · pre-incident · agent read-only**. `Authorize restore` / `Hold both`; "agent proposes · human authorizes."
→ *Transition:* on Authorize, CH-14 switches + post-swap read; CH-27 held degraded. → 11.

**11 · Contention authorized** — `11-contention-authorized.png`
CH-14 restored (blue) on the shared backup. CH-27 is **kept full-size**, visibly `DEGRADED · FLAGGED` — never shrunk to a badge — so the decision's cost stays on screen.
→ *Transition:* resolves to the honest terminal. → 12.

**12 · Terminal — partially mitigated** — `12-terminal-partially-mitigated.png`
Honest close, **not green/resolved**: banner `Partially mitigated — 1 restored, 1 incident open` (ink + hatch + alarm-weight `1 open`). CH-14 restored, CH-27 still degraded, open incident kept in view.

---

## Transition vocabulary (what animates, reused across states)
- **line breaks red** — CAP diverges from baseline on freeze (01→02).
- **lane strip expands** one beat during investigation (02→03).
- **failed-query-then-retry** — spine shows the real miss + retry latency (03).
- **backup line appears** — healthy dashed line joins (03→04).
- **gate surfaces** — Approve/Hold becomes the loudest object (04→05).
- **CAP rejoins baseline** + `post-swap read ✓` — success earned by measurement (05→06).
- **both series ghost** — full evidence blackout, spine stays solid (→08).
- **capacity meter** — scarcity made explicit; decision card ranks tiers (09→10→11).
- **degraded kept full-size** — cost of the tradeoff never hidden (11→12).

## Gaps flagged for back-end (not UI fill-in)
- Real caption/feed-liveness series + the agent trace (miss→retry, MCP latency) must **drive** the evidence panel and spine — the reference uses representative live-treated values. Bind at render; do not hard-code.
- No rollback / post-switch-failure state exists (net-new BE capability) — intentionally absent.
