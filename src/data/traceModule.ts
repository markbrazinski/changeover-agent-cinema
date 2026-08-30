/**
 * Trace Data Module for Changeover UI.
 * Imports and structures live telemetry readings, MCP trace logs, acceptance tables,
 * and state metadata for binding directly across screens 00–12.
 */

// Import raw JSON traces generated freshly from back-end execution
import traceTearsOfSteel from './fixtures/trace_tears_of_steel.json';
import traceSintel from './fixtures/trace_sintel.json';
import acceptanceTable from './fixtures/acceptance_table.json';
import contentionAuthorized from './fixtures/contention_authorized.json';

export interface TelemetryReading {
  channel: string;
  caption_offset_seconds: number;
  liveness_gap_seconds: number;
  timestamp: number;
  status: 'nominal' | 'frozen' | 'restored' | 'blind';
}

export interface TraceRecord {
  tool: string;
  args: Record<string, any>;
  result_or_miss: any;
  latency_ms: number;
  ts: number;
}

export interface StateDefinition {
  id: string; // e.g. "01", "02", ..., "12"
  title: string;
  timecode: string;
  substate: string;
  hasFacilityView: boolean;
  refusalType?: 'none' | 'wont_switch' | 'wont_guess';
  isContention: boolean;
  activeChannel: string;
  primaryOffset: number;
  postSwapOffset?: number;
  failedLayer: 'captions' | 'sign_language' | 'none';
  evidenceStatus: 'fresh' | 'stale' | 'partial' | 'absent' | 'blind';
  spineSteps: Array<{
    title: string;
    sub?: string;
    tone: 'done' | 'active' | 'fill' | 'pending' | 'refuse';
  }>;
}

// Extract real live numbers from generated trace files
export const RAW_TRACES = {
  tears_of_steel: traceTearsOfSteel as TraceRecord[],
  sintel: traceSintel as TraceRecord[],
  acceptance: acceptanceTable,
  contention: contentionAuthorized,
};

// Extracted real telemetry metrics from trace
export const REAL_CAPTIONS_OFFSET = 2.996; // Real irregular .vtt divergence offset
export const REAL_POST_SWAP_OFFSET = 0.486; // Real post-swap restored offset
export const REAL_CAPTION_CEILING = 0.7589;
export const REAL_LIVENESS_CEILING = 0.5099;

export const SCREEN_STATES: Record<string, StateDefinition> = {
  '00': {
    id: '00',
    title: '01 · At rest',
    timecode: 'PGM-OUT 20:14:02',
    substate: 'WATCHING · ALL NOMINAL',
    hasFacilityView: false,
    isContention: false,
    activeChannel: 'tears_of_steel',
    primaryOffset: 0.510,
    failedLayer: 'none',
    evidenceStatus: 'fresh',
    spineSteps: [
      { title: '◇ watching CAP · SIGN', sub: 'both layers nominal ✓', tone: 'done' },
      { title: 'idle — no anomaly', sub: 'watching program clock sync', tone: 'pending' },
    ],
  },
  '01': {
    id: '01',
    title: '01 · At rest',
    timecode: 'PGM-OUT 20:14:02',
    substate: 'WATCHING · ALL NOMINAL',
    hasFacilityView: false,
    isContention: false,
    activeChannel: 'tears_of_steel',
    primaryOffset: 0.510,
    failedLayer: 'none',
    evidenceStatus: 'fresh',
    spineSteps: [
      { title: '◇ watching CAP · SIGN', sub: 'both layers nominal ✓', tone: 'done' },
      { title: 'idle — no anomaly', sub: 'watching program clock sync', tone: 'pending' },
    ],
  },
  '02': {
    id: '02',
    title: '02 · Failure detected',
    timecode: 'PGM-OUT 20:14:16',
    substate: 'ANOMALY DETECTED',
    hasFacilityView: false,
    isContention: false,
    activeChannel: 'tears_of_steel',
    primaryOffset: REAL_CAPTIONS_OFFSET,
    failedLayer: 'captions',
    evidenceStatus: 'fresh',
    spineSteps: [
      { title: '14:07 nominal ✓', sub: 'baseline 0.510s verified', tone: 'done' },
      { title: '⚠ CAP FREEZE detected', sub: 'CAP line breaks baseline ▲', tone: 'fill' },
      { title: 'opening investigation…', sub: 'preparing Grafana MCP query', tone: 'pending' },
    ],
  },
  '03': {
    id: '03',
    title: '03 · Investigating',
    timecode: 'PGM-OUT 20:14:19',
    substate: 'QUERYING GRAFANA MCP',
    hasFacilityView: false,
    isContention: false,
    activeChannel: 'tears_of_steel',
    primaryOffset: REAL_CAPTIONS_OFFSET,
    failedLayer: 'captions',
    evidenceStatus: 'fresh',
    spineSteps: [
      { title: 'CAP freeze detected ✓', sub: 'offset +2.996s > ceiling 0.759s', tone: 'done' },
      { title: '▶ querying Grafana…', sub: 'MISS: invalid query (192ms) → RETRY success (180ms)', tone: 'active' },
      { title: 'SIGN flat → not program-wide', sub: 'isolated to captions layer', tone: 'pending' },
    ],
  },
  '04': {
    id: '04',
    title: '04 · Backup verified',
    timecode: 'PGM-OUT 20:14:24',
    substate: 'BACKUP CANDIDATE READY',
    hasFacilityView: false,
    isContention: false,
    activeChannel: 'tears_of_steel',
    primaryOffset: REAL_CAPTIONS_OFFSET,
    failedLayer: 'captions',
    evidenceStatus: 'fresh',
    spineSteps: [
      { title: '∴ CAPTIONS failed @ switch', sub: 'cue divergence +2.996s confirmed', tone: 'done' },
      { title: 'backup ffprobe verified ✔', sub: 'candidate line healthy · 180s mp4 (15ms)', tone: 'fill' },
      { title: 'safe to offer switch', sub: 'awaiting operator authorization', tone: 'pending' },
    ],
  },
  '05': {
    id: '05',
    title: '05 · Awaiting approval',
    timecode: 'PGM-OUT 20:14:27',
    substate: 'SUMMON · AUTHORIZATION REQUIRED',
    hasFacilityView: false,
    isContention: false,
    activeChannel: 'tears_of_steel',
    primaryOffset: REAL_CAPTIONS_OFFSET,
    failedLayer: 'captions',
    evidenceStatus: 'fresh',
    spineSteps: [
      { title: 'backup verified ✔', sub: 'ffprobe health check passed', tone: 'done' },
      { title: 'SUMMON: operator required', sub: 'will not switch without human authorization', tone: 'active' },
    ],
  },
  '06': {
    id: '06',
    title: '06 · Changed over',
    timecode: 'PGM-OUT 20:14:33',
    substate: 'RESTORED BY MEASUREMENT',
    hasFacilityView: false,
    isContention: false,
    activeChannel: 'tears_of_steel',
    primaryOffset: REAL_CAPTIONS_OFFSET,
    postSwapOffset: REAL_POST_SWAP_OFFSET,
    failedLayer: 'captions',
    evidenceStatus: 'fresh',
    spineSteps: [
      { title: 'approved ✔', sub: 'authorizer: operator:mark', tone: 'done' },
      { title: 'switched → re-measuring backup', sub: 'post-swap read pending…', tone: 'fill' },
      { title: '✓ confirmed restored · 0.486s', sub: 'watching for regression', tone: 'done' },
      { title: 'audit entry logged ✎', sub: 'logs/state/feed_state_tears_of_steel.json', tone: 'done' },
    ],
  },
  '07': {
    id: '07',
    title: '07 · Refusal — won\'t switch',
    timecode: 'PGM-OUT 20:14:26',
    substate: 'REFUSAL · UNCONFIRMED BACKUP',
    hasFacilityView: false,
    refusalType: 'wont_switch',
    isContention: false,
    activeChannel: 'tears_of_steel',
    primaryOffset: REAL_CAPTIONS_OFFSET,
    failedLayer: 'captions',
    evidenceStatus: 'fresh',
    spineSteps: [
      { title: 'CAP frozen ✓ · backup located', sub: 'broken candidate file detected', tone: 'done' },
      { title: 'backup probe → sync UNKNOWN', sub: 'candidate line fails ffprobe check', tone: 'fill' },
      { title: '✕ WILL NOT SWITCH', sub: 'unconfirmed backup — holding active feed', tone: 'refuse' },
    ],
  },
  '08': {
    id: '08',
    title: '08 · Refusal — won\'t guess (blind)',
    timecode: 'PGM-OUT 20:14:21',
    substate: 'REFUSAL · EVIDENCE BLACKOUT',
    hasFacilityView: false,
    refusalType: 'wont_guess',
    isContention: false,
    activeChannel: 'tears_of_steel',
    primaryOffset: REAL_CAPTIONS_OFFSET,
    failedLayer: 'captions',
    evidenceStatus: 'blind',
    spineSteps: [
      { title: 'freeze observed on-air ✓', sub: 'telemetry loss detected', tone: 'done' },
      { title: 'Grafana unreachable ✕', sub: 'CAP · SIGN — no series returned', tone: 'fill' },
      { title: '✕ WON\'T GUESS', sub: 'can\'t name a layer w/o evidence', tone: 'refuse' },
      { title: '…still reasoning', sub: 'holding for evidence plane recovery', tone: 'fill' },
    ],
  },
  '09': {
    id: '09',
    title: '09 · Two channels failing',
    timecode: 'PGM-OUT 20:15:02',
    substate: 'CONCURRENT FAULT · M=1 vs N=2',
    hasFacilityView: true,
    isContention: true,
    activeChannel: 'tears_of_steel',
    primaryOffset: REAL_CAPTIONS_OFFSET,
    failedLayer: 'captions',
    evidenceStatus: 'fresh',
    spineSteps: [
      { title: '2 concurrent CAP freezes ✓', sub: 'CH-14 (+2.996s) & CH-27 (+2.996s)', tone: 'done' },
      { title: '⚠ shared backup — capacity 1/2', sub: 'one pre-cut file, two failures', tone: 'fill' },
      { title: 'contention → needs a call', sub: 'operator authorization required', tone: 'pending' },
    ],
  },
  '10': {
    id: '10',
    title: '10 · Contention decision',
    timecode: 'PGM-OUT 20:15:07',
    substate: 'CONTENTION ARBITRATION GATE',
    hasFacilityView: true,
    isContention: true,
    activeChannel: 'tears_of_steel',
    primaryOffset: REAL_CAPTIONS_OFFSET,
    failedLayer: 'captions',
    evidenceStatus: 'fresh',
    spineSteps: [
      { title: 'capacity verified = 1 ✔', sub: 'M=1 shared backup capacity', tone: 'done' },
      { title: 'policy: operator-declared ▣', sub: 'pre-incident · agent read-only', tone: 'fill' },
      { title: 'RESTORE ▸ CH-14 vs DEGRADE ▸ CH-27', sub: 'awaiting operator tradeoff decision', tone: 'active' },
    ],
  },
  '11': {
    id: '11',
    title: '11 · Contention authorized',
    timecode: 'PGM-OUT 20:15:14',
    substate: 'PRIORITY RESTORED · LOSER DEGRADED',
    hasFacilityView: true,
    isContention: true,
    activeChannel: 'tears_of_steel',
    primaryOffset: REAL_CAPTIONS_OFFSET,
    postSwapOffset: REAL_POST_SWAP_OFFSET,
    failedLayer: 'captions',
    evidenceStatus: 'fresh',
    spineSteps: [
      { title: 'authorized ✔ · CH-14 priority', sub: 'operator:mark approved tradeoff', tone: 'done' },
      { title: 'switched → post-swap read ✓', sub: 'CH-14 CAP rejoined baseline (0.486s)', tone: 'fill' },
      { title: 'CH-27 held DEGRADED + FLAGGED', sub: 'cost kept visible · state file untouched', tone: 'done' },
    ],
  },
  '12': {
    id: '12',
    title: '12 · Terminal — partially mitigated',
    timecode: 'PGM-OUT 20:15:20',
    substate: 'PARTIALLY MITIGATED · 1 OPEN INCIDENT',
    hasFacilityView: true,
    isContention: true,
    activeChannel: 'tears_of_steel',
    primaryOffset: REAL_CAPTIONS_OFFSET,
    postSwapOffset: REAL_POST_SWAP_OFFSET,
    failedLayer: 'captions',
    evidenceStatus: 'fresh',
    spineSteps: [
      { title: 'CH-14 restored ✓', sub: 'active on backup · 0.486s', tone: 'done' },
      { title: '▲ 1 INCIDENT OPEN', sub: 'CH-27 still degraded (standard tier)', tone: 'refuse' },
      { title: 'partially mitigated — not resolved', sub: 'open incident kept in view', tone: 'pending' },
    ],
  },
};
