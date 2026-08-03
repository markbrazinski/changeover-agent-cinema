# Changeover — Redline / Design-Token Spec

Developer-buildable reference: exact values + structure extracted from the approved design. **Not application code** — describe-only. Pair with `reference/README.md` (behavior) and `reference/NN-*.png` (renders). All px are at 1× design scale; screenshots are 2×.

---

## 1 · Tokens

### 1.1 Color (exact hex)

**Surface / neutral layers**
| Token | Hex | Use |
|---|---|---|
| `surface` | `#f5f3ec` | frame background, restored caption bar |
| `panel-hi` | `#faf9f4` | evidence panel top, card fills |
| `panel-lo` | `#f1eee6` | evidence panel bottom (gradient pair with panel-hi, 180°) |
| `panel-mute` | `#efece4` | stage background, secondary panels |
| `panel-sunken` | `#e6e2da` | hatched alarm tiles, "stays degraded" card base |
| `hairline` | `rgba(0,0,0,.12)` | 1px dividers |
| `border-soft` | `rgba(0,0,0,.16)` | default panel border |
| `card-border` | `#c3bfb8` | 1.5px neutral card border |

**Ink / text**
| Token | Hex | Use |
|---|---|---|
| `ink` | `#16140f` | primary text, heavy borders, heaviest alarm weight |
| `ink-dark-1` | `#1d1a14` | header gradient top |
| `text-60` | `rgba(0,0,0,.6)` | secondary body |
| `text-50` | `rgba(0,0,0,.5)` | tertiary labels |
| `text-42` | `rgba(0,0,0,.42)` | faint mono meta |
| on ink: `#f5f3ec` primary, `rgba(245,243,236,.6)` secondary, `.5` tertiary, `.4/.42` faint |

**State (value carries state; color reinforces only)**
| Token | Hex | Use |
|---|---|---|
| `nominal` | `#3b7a4b` | healthy line/border |
| `nominal-ink` | `#2f6a41` | healthy text |
| `alarm` | `#b4231c` | broken CAP line, frozen border/dot — heaviest, hatched |
| `alarm-ink` | `#8f1b16` | alarm text |
| `restored` | `#1d6e8c` | post-swap restored line/border (blue ≠ green) |
| `restored-ink` | `#12566b` | restored text |
| `restored-on-dark` | `#8ecae6` | "restored" text on ink card (facility) |
| `accent` | `#b8641b` | **RESERVED** — scan sweep, capacity meter, decision-card border. Never sole-encodes a state. |

**Ghost / disabled / backup**
| Token | Hex | Use |
|---|---|---|
| `ghost-border` | `#b4b0a8` | dashed pending/ghost borders |
| `ghost-1` | `#9a958c` | unconfirmed backup dashed line |
| `ghost-2` | `#7a756c` | "sync UNKNOWN" text |
| `ghost-3` | `#6f6a60` | blind-tile dashed border/dot |
| ghost text | `rgba(0,0,0,.32–.5)` | dead readout `——.——`, disabled labels |

**Video tile**: base `#0b0f11`; frozen brightness `.82`; blind `grayscale(1) brightness(.4) contrast(.9)`.

### 1.2 Type scale

Families: **Space Grotesk** (display/UI/body), **Space Mono** (telemetry, labels, timecode, all-caps meta). Body prose uses **system-ui** (13px). Fallbacks: `Space Grotesk, system-ui, sans-serif`.

| Role | Family | Size / line-height | Weight | Tracking |
|---|---|---|---|---|
| Page H1 (state title) | Grotesk | 30 / 1.05 | 600 | -1px |
| State kicker | Mono | 9 | 700 | 1.5px, uppercase |
| Body prose | system-ui | 13 / 1.55 | 400 | — |
| Muted-gate note | system-ui | 11 / 1.5 | 500 | — |
| Header wordmark | Mono | 13 | 700 | 3px |
| Header timecode | Mono | 11 | 400 | .5px |
| Section label (THE SPLIT, AGENT SPINE) | Mono | 8–9 | 700 | 1.5px, uppercase |
| Panel title (LAYER TELEMETRY, FACILITY VIEW) | Mono | 8.5–10 | 700 | .5–2px, uppercase |
| Big caption readout | Mono | 24–25 / 1 | 700 | -.5px |
| Spine step title | Mono | 8 (refuse 9) | 600–700 | .2–.4px |
| Spine step sub | Mono | 7.5–8 | 400–600 | — |
| Pill / chip | Mono | 7–8 | 700 | .3–.6px, uppercase |
| Legend / caption meta | Mono | 6.5–7 | 400–700 | .3–.6px |
| Foot invariant | Mono | 6.5 | 400 | .3px |
| Channel id (facility) | Mono | 11 | 700 | 1px |
| Nav item | Grotesk | 11 | 600 | .2px |

### 1.3 Spacing scale (px actually used)
`1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 17, 20, 24, 26, 30, 40`
- Frame header pad `12 × 17`; body pad `16 17 17`; body grid gap `16`.
- Column gaps `11–14`; stacked gaps `5–12`; chip gaps `5–7`.
- Stage (page) pad `26 × 30`; main pad `30 40 60`.

### 1.4 Radius
| Element | Radius |
|---|---|
| Frame / facility panel | 13px (facility joins frame: top 13 / bottom 0) |
| Evidence & context panels | 8–9px |
| Video tiles | 6px |
| Spine steps, cards, tiles | 4–6px |
| Chips / small labels | 3–5px |
| Pills (status), capacity squares | 20px / 2px |
| Nav item | 7px |

### 1.5 Alarm treatment (hatch spec)
- **Alarm hatch (red):** `repeating-linear-gradient(45deg, rgba(180,35,28,.16→.24) 0 3px, transparent 3px 9–10px)` over `#e6e2da` or on frozen tile.
- **Neutral/disabled hatch:** `repeating-linear-gradient(45deg, rgba(0,0,0,.06→.07) 0 4px, transparent 4px 10–11px)`.
- **No-data hatch (evidence blind):** `repeating-linear-gradient(45deg, rgba(0,0,0,.04) 0 5px, transparent 5px 12px)` + dashed `#b4b0a8` border.
- **AD static row hatch:** 16×9px swatch, `1px solid #9a958c`, `repeating-linear-gradient(45deg, rgba(0,0,0,.18) 0 2px, transparent 2px 5px)`.
- **Frozen tile scanlines:** red hatch `45deg rgba(180,35,28,.16) 0 3px / 10px`.
- Alarm is always the **darkest + heaviest + hatched** element → survives grayscale at 640px. Never red fill alone.
- Borders by weight: hairline 1px · card 1.5px · emphasis 2px · frame/ink 2.5px · frozen tile 3px solid alarm · **refusal step 3px double ink**.

### 1.6 Motion tokens (keyframes)
| Name | Effect | Timing |
|---|---|---|
| `cw-scan` | accent sweep bar on active spine step | 1.7s linear ∞ |
| `cw-pulse` | opacity 1→.4 (ON AIR tally, frozen cursor, live dot) | .9–1.8s ∞ |
| `cw-flick` | scanline flicker (blind tile / dead series) | 1.1–1.7s steps(2) ∞ |
| `cw-spin` | 22px loader ring (blind tile) | 1s linear ∞ |
All gated by `prefers-reduced-motion: reduce` → animation none.

---

## 2 · Component inventory

Frame canvas = **760px** wide, fixed. Body = CSS grid `1fr / 238px`, gap 16, `align-items:stretch`. Left column stacks split → evidence → context; right column is the spine (border-left 2.5px ink, pad-left 14).

### 2.1 PGM Header
- Box: 760 × ~46; pad `12 17`; bg linear-gradient(180°, `#1d1a14`→`#16140f`); text `#f5f3ec`.
- Row (flex, gap 11, center): cue-mark 21px · wordmark (Mono 13/700/3px) · "captions layer" (Mono 9.5, opacity .6) · optional `REFUSAL` badge (1.5px border, radius 4) · **spacer** · ON AIR tally (7px dot `#b4231c` + 3px halo, cw-pulse) · `PGM-OUT HH:MM:SS` (timecode white).

### 2.2 Split Hero
- Two-column grid `1fr 1fr`, gap 0, pad-top 15 (clears the centered `THE SPLIT` pill). Right column: border-left 2px dashed ink, pad-left 11; left column pad-right 11.
- Column head (Mono 8/700 uppercase) → **video tile** → **status pill**.
- **Video tile**: 158px tall, radius 6, `object-fit:cover` still, bottom gradient scrim, top-left source chip (Mono 7 on rgba black), bottom caption bar.
  - `cleanLeft` / `fine`: 2px `#3b3a34` border, green dot chip, white caption bar "— sample caption dialogue, in sync —".
  - `frozen`: 3px `#b4231c` border + inner alarm glow + red hatch; bottom bar ink `rgba(8,6,4,.9)` + 2px alarm, cursor (cw-pulse) + `CAPTIONS FROZEN`.
  - `restored`: 2.5px ink border; bottom bar surface `#f5f3ec` + 2.5px ink, restored dot + `✓ CAPTIONS RESTORED`.
  - `blind`: 3px dashed `#6f6a60`; grayscale/darkened still; flicker scanlines; centered 22px spinner + `WHICH LAYER?` (Mono 14/2px) + "telemetry unreadable · cannot confirm".
  - `errorPanel`: 2.5px ink on `#e6e2da` neutral hatch; `▲ PREVIEW UNAVAILABLE` + "render probe timed out / telemetry unaffected".
- **Status pill**: self-start, radius 20, pad `4 10`, Mono 8/700 uppercase, 8px dot (round; square for frozen/error). Variants: fine (nominal outline) · frozen (ink fill, alarm square) · restored (2px ink outline) · blind (dashed ghost) · error (2px ink).

### 2.3 Evidence chart (two-line CAP/SIGN + static AD row) — load-bearing
- Box: full-width, 2.5px ink border, radius 9, gradient `#faf9f4→#f1eee6`, pad `11 13`, soft shadow.
- **Header row**: `LAYER TELEMETRY — LIVE MEASURED` (Mono 8.5) · optional `post-swap read ✓` restored badge · right-aligned peer-status line (e.g. "SIGN flat → peer ruled out · not program-wide").
- **Body row** (flex, gap 14):
  - *Readout* (left, fixed): live label = pulsing 5px alarm dot + `caption-sync offset · live` (Mono 7) → big value `+55.70s` (Mono 25, color by state) → sub `baseline 0.510s · climbing`. **Value is live, not pinned.**
  - *Plot* (flex-1): SVG `viewBox 0 0 300 72`, `preserveAspectRatio:none`, height 58, overflow visible. Baseline y=58; max y=12; alarm threshold dashed y=46; backup line dashed y=66. CAP stroke 2.4, SIGN stroke 2. End-dots r=3–3.4. Break geometry `0,58 96,58 110,46 300,12`; restored `0,13 104,13 150,30 214,50 300,58`; flat `0,58 300,57`.
  - *Chips* (right, fixed): CAP chip + SIGN chip + optional BACKUP chip (solid nominal if healthy, dashed ghost if unconfirmed), Mono 7/700 uppercase, 1.5px border, radius 4.
- **Legend foot** (border-top dashed): CAP swatch `CAP · captions` · SIGN swatch `SIGN · feed-liveness (stand-in)` · **spacer** · AD static swatch `AD — not monitored in this build · static` (opacity .6).
- **Blind variant**: replaces panel with dashed-ghost no-data card: `——.——` readout, `✕ GRAFANA UNREACHABLE — NO SERIES`, "CAP · SIGN both unreadable", two flickering dashed rules, `no data` chip, AD static row retained.
- Tokens: alarm/nominal/restored lines, accent never here, ink border, panel gradient.

### 2.4 Agent Spine
- Right column, border-left 2.5px ink, pad-left 14, flex-column gap 8.
- Head: cue-mark 15 + `AGENT SPINE` (Mono 9/1.5px). Sub: `T+MM:SS · <substate>` (Mono 7.5, text-42).
- **Step tile** (radius 5, pad `8 9`, flex-col gap 2): tones —
  - `done` 1.5px `#c3bfb8` on `#faf9f4`, text-68;
  - `active` 2px ink on ink fill, text `#f5f3ec`, + accent scan bar (cw-scan) top;
  - `fill` 2px ink on ink fill (no sweep);
  - `pending` 1.5px dashed `#b4b0a8`, transparent, text-50;
  - `refuse` **3px double ink** on `#e9e6df`, ink text 9px.
- Docks: **Approve/Hold gate** (2px ink card: ink Approve btn + outline Hold btn + "will not switch without you" dashed note) OR **hold-note** (solid ink card for state 8 "spine solid · will not fabricate"; dashed for state 7).
- Foot: border-top dashed, Mono 6.5 invariant line (e.g. "evidence intact · action stopped · accent #b8641b reserved").

### 2.5 Lane strip (collapsed peer row / expands one beat)
- Collapsed: rounded row, `Layers` label + CAP/SIGN/AD chips (round-dot pills) + right status. Expanded (investigation beat): 3-col grid of peer cards (CAP heavy+hatched FAIL, SIGN & AD nominal ✓) with a dashed spine-arrow footer "spine ▶ isolates captions".  *(In the shipped app this consolidated into the Evidence chart; keep as a component for the one-beat expand.)*

### 2.6 Facility view (contention header, above frame)
- Box: 760 wide, ink gradient panel, radius top-13/bottom-0, border 2.5px ink (no bottom), pad `13 17 15`.
- Header: `FACILITY VIEW` (Mono 10/2px) · "2 channels · shared backup" · **capacity meter** (right): outline box, two 9px squares (filled = used accent `#b8641b`, empty = outline) + `capacity N of 1 free · 2 need it`.
- **Channel card** (flex-1, radius 7): header (id Mono 11 + `operator-declared` badge on protected + right status `▸ restored` / `degraded · flagged` alarm chip); body = 96×54 mini still tile (red hatch if frozen) + tier label + mini CAP sparkline (`viewBox 96×30`, baseline 26). Protected = 2.5px `#1d6e8c`; flagged = 2.5px ink on `#1b1712`; default 1.5px `rgba(245,243,236,.28)` on `#221d16`.
- **Demo-scope foot**: border-top dashed, Mono 6.5 on-dark: "backup is a pre-cut file standing in for a scarce live caption source · SIGN = feed-liveness on a stand-in feed · AD not monitored in this build · tiers operator-declared before incident".

### 2.7 Decision card (contention)
- 2px **accent** `#b8641b` border, radius 8, surface fill, pad `12 14`.
- Header: `CONTENTION — AUTHORIZATION REQUIRED` + right `capacity verified = 1` (alarm outline chip).
- Two-col grid gap 11: **RESTORE ▸ CH-14** (2px `#1d6e8c`, white fill, tier + `▣ operator-declared · pre-incident`) vs **STAYS DEGRADED ▸ CH-27** (2px ink, red-hatched `#e6e2da`, tier + "the explicit cost of 1-of-2").
- Action row: `Authorize restore` (ink btn) · `Hold both` (outline btn) · right "agent proposes · human authorizes · policy read-only".

### 2.8 Refusal banner / badge
- Header `REFUSAL` badge (1.5px `#f5f3ec` border on ink). Spine refuse step = 3px double ink. Distinct reads: **7** evidence readable + action stopped; **8** evidence plane dark + spine solid.

### 2.9 Summary / terminal card
- Terminal banner: 2.5px ink, neutral hatch `#e6e2da`, pad `11 14`, flex gap 12: `◧` glyph + `Partially mitigated — 1 restored, 1 incident open` (Mono 11) + sub "CH-14 restored · CH-27 still degraded — not a resolved / green close" + right `1 open` alarm chip. **Never green.**
- Context variants (single-channel system notes): **empty** (pulse dot + "Monitoring live · 0 incidents today"), **error** (`▲` + "Live preview surface failed — telemetry unaffected" + Retry btn), **correction** (two stacked rows: prior "stands" ✓ / appended `⟲ CORRECTION` — never overwritten).

### 2.10 Left nav (reference shell, not part of the frame)
- 262px ink column, sticky, full-height. Wordmark + "12-state harm view". Groups: `Incident path` (1–8), `Contention · facility view` (9–12). Active item = surface fill + ink text; REFUSE tag on 7/8. Foot: "↑↓ / ←→ to walk · desaturate toggles the 640px capture gate".

---

## 3 · Per-screen layout & copy

Components present, top→bottom. Copy is verbatim. (No separate screen 00 — **01 At rest** is the baseline idle screen.)

**01 At rest** — Header `PGM-OUT 20:14:02`. Split: L clean `PGM 1 · MAIN` / R fine `SAME STREAM`, both "— sample caption dialogue, in sync —"; pills "Captions live · in sync" / "Looks fine · in sync". Evidence: both flat green, readout `+0.510s`? → shows baseline nominal `0.510s`, chips `CAP ● nominal` / `SIGN ● healthy`. Spine idle: `◇ watching CAP · SIGN` / `both layers nominal ✓` / `idle — no anomaly`.

**02 Failure detected** — TC `20:14:16`. R tile frozen (`CAPTIONS FROZEN`), pill "Captions frozen". Evidence: CAP break red / SIGN flat, readout `+55.70s` · "baseline 0.510s · climbing", `CAP ▲ climbing` / `SIGN ● healthy`. Spine: `14:07 nominal ✓` / **fill** `⚠ CAP FREEZE detected` "CAP line breaks baseline ▲" / pending `opening investigation…`.

**03 Investigating** — TC `20:14:19`. Same split/evidence as 02 (CAP alone climbs = peers ruled out). Spine: `CAP freeze detected ✓` / **active** `▶ querying Grafana…` "caption_sync climbing ▲" / pending `SIGN flat → not program-wide` "isolated to captions". *(Dev: bind spine to real trace incl. miss→retry + latency.)*

**04 Backup verified** — TC `20:14:24`. Evidence adds healthy dashed **backup line** + `BACKUP ✔` chip. Spine: `∴ CAPTIONS failed @ switch` / **fill** `backup ffprobe verified ✔` "candidate line healthy · 0.10s" / pending `safe to offer switch`.

**05 Awaiting approval** — TC `20:14:27`. Evidence same (backup healthy). Spine: `backup verified ✔` + **Approve/Hold gate** + "will not switch without you".

**06 Changed over** — TC `20:14:33`. R tile restored, pill "Access restored". Evidence: CAP **restored** line rejoining baseline, readout `+0.10s` restored, `post-swap read ✓` badge, `CAP ▼ resynced`. Spine: `approved ✔` / **fill** `switched → re-measuring backup` "post-swap read pending…" / `✓ confirmed restored · 0.10s` "watching for regression" / `audit entry logged ✎`.

**07 Refusal — won't switch** — TC `20:14:26`, `REFUSAL` badge. Evidence intact (CAP break/SIGN flat) + **dashed unconfirmed backup** (`? sync UNKNOWN`, `BACKUP ?`). Spine: `CAP frozen ✓ · backup located` / `backup probe → sync UNKNOWN` "candidate line never locks" / **refuse** `✕ WILL NOT SWITCH` "unconfirmed backup — holding" + dashed hold-note.

**08 Refusal — won't guess (blind)** — TC `20:14:21`, `REFUSAL` badge. R tile **blind** (`WHICH LAYER?`), pill "Evidence blind". Evidence = **no-data blackout** (both series ghost). Spine: `freeze observed on-air ✓` / `Grafana unreachable ✕` "CAP · SIGN — no series" / **refuse** `✕ WON'T GUESS` "can't name a layer w/o evidence" / **fill** `…still reasoning` "holding for evidence" + **solid** hold-note "spine solid · will not fabricate".

**09 Two channels failing** — TC `20:15:02`. **Facility view**: capacity `0 of 1 free · 2 need it`; CH-14 + CH-27 both CAP frozen (red mini-lines). Frame below focuses CH-14 (frozen). Spine: `2 concurrent CAP freezes ✓` / **fill** `⚠ shared backup — capacity 1/2` "one pre-cut file, two failures" / pending `contention → needs a call`.

**10 Contention decision** — TC `20:15:07`. Facility + **decision card**: `capacity verified = 1`; RESTORE ▸ CH-14 (Emergency / public-information tier · operator-declared) vs STAYS DEGRADED ▸ CH-27 (General entertainment tier); `Authorize restore` / `Hold both`; "agent proposes · human authorizes". Spine: `capacity verified = 1 ✔` / `policy: operator-declared ▣` "pre-incident · agent read-only" + gate.

**11 Contention authorized** — TC `20:15:14`. Facility: CH-14 **restored** (blue, `▸ restored`), CH-27 **full-size DEGRADED · FLAGGED**. Frame CH-14 restored. Spine: `authorized ✔ · CH-14 priority` / **fill** `switched → post-swap read ✓` "CH-14 CAP rejoined baseline" / `CH-27 held DEGRADED + FLAGGED` "cost kept visible".

**12 Terminal — partially mitigated** — TC `20:15:20`. Facility + **terminal banner** `Partially mitigated — 1 restored, 1 incident open` + `1 open` chip (not green). Spine: `CH-14 restored ✓` / **refuse-weight** `▲ 1 INCIDENT OPEN` "CH-27 still degraded" / pending `partially mitigated — not resolved`.

---

## 4 · Transitions (what animates between screens)

| From → To | Animation |
|---|---|
| 01 → 02 | **CAP line breaks red** and climbs off baseline; R tile flips clean→frozen (red border + hatch fade-in); ON AIR tally already pulsing. |
| 02 → 03 | **Lane strip expands** one beat (collapsed chips → 3 peer cards) to show peers ruled out; spine `active` step gains the accent **scan sweep** (cw-scan). |
| 03 (internal) | Spine query shows **failed-query-then-retry** (miss step then retry) — bind to real trace latency. |
| 03 → 04 | **Healthy backup line fades in** (dashed) beneath baseline; `BACKUP ✔` chip appears. |
| 04 → 05 | **Approve/Hold gate surfaces** as the loudest new object in the spine. |
| 05 → 06 | On Approve: **CAP line descends and rejoins baseline**; `post-swap read ✓` badge resolves; R tile frozen→restored; readout recolors alarm→restored. Success earned by measurement, not on click. |
| any → 07 | Backup line stays **dashed/unlocked**; spine terminates in a double-ruled refuse step. Evidence stays fully legible. |
| any → 08 | **Both series ghost/blackout** simultaneously (flicker dashed rules); R tile → blind spinner; spine stays solid and keeps a `…still reasoning` fill step. The blackout is the message. |
| 08 vs error | Error keeps CAP **live** and fails only the preview surface (Retry) — not a blackout. |
| 09 → 10 | Two broken channels **collapse into one decision card**; capacity meter reads 1. |
| 10 → 11 | On Authorize: CH-14 mini-line **rejoins baseline** (red→blue); CH-27 stays broken and gains `DEGRADED · FLAGGED`, **kept full-size** (never shrinks to a badge). |
| 11 → 12 | Resolves to **terminal banner** — ink + alarm weight, `1 open`; no green "resolved" ever appears. |
| global | `desaturate` capture-gate toggle applies `grayscale(1) contrast(1.05)` to the whole stage to prove alarm survives muted at 640px. Reduced-motion disables all keyframes. |
