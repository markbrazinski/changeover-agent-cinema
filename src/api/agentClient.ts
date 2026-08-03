/**
 * API Client for Changeover FastAPI Server (http://localhost:8008).
 * Communicates with backend orchestration endpoints in either 'deterministic' or 'real' mode.
 */

const API_BASE = 'http://localhost:8008';

export type Mode = 'deterministic' | 'real';

export interface VideoManifest {
  channels: {
    [key: string]: {
      title: string;
      criticality_tier: string;
      tier_display: string;
      source_video: string;
      backup_video: string;
      captions_vtt: string;
    };
  };
  mode: Mode;
}

export interface InvestigateResponse {
  channel: string;
  status: string;
  failed_layer: string;
  caption_offset: number;
  liveness_gap: number;
  mcp_status: string;
  evidence_tier: string;
  query_trace: Array<{
    tool: string;
    args: Record<string, any>;
    result_or_miss: any;
    latency_ms: number;
    ts?: number;
  }>;
  rationale: string;
  mode: Mode;
}

export interface BackupVerifyResponse {
  channel: string;
  backup_path: string;
  is_healthy: boolean;
  details: {
    duration_seconds: number;
    format_name: string;
    has_video: boolean;
  };
  mode: Mode;
}

export interface FailoverResponse {
  channel: string;
  status: string;
  previous_source: string;
  new_source: string;
  human_authorizer: string;
  post_swap_measured_offset: number;
  restored: boolean;
  state: Record<string, any>;
  mode: Mode;
}

export interface ContentionResponse {
  timestamp: number;
  pool_id: string;
  demand: number;
  capacity: number;
  scarcity_is_real: boolean;
  priority_channel: string;
  degraded_channels: string[];
  reasoning: string;
  human_authorizer: string;
  status: string;
  priority_execution: {
    status: string;
    previous_source: string;
    new_source: string;
    human_authorizer: string;
    post_swap_measured_offset: number;
    restored: boolean;
  };
  degraded_untouched_proof: boolean;
  mode: Mode;
}

export const agentClient = {
  async getManifest(mode: Mode = 'deterministic'): Promise<VideoManifest> {
    const res = await fetch(`${API_BASE}/video/manifest?mode=${mode}`);
    return res.json();
  },

  async resetDemo(mode: Mode = 'deterministic'): Promise<any> {
    const res = await fetch(`${API_BASE}/demo/reset?mode=${mode}`, { method: 'POST' });
    return res.json();
  },

  async injectFault(channel: string = 'tears_of_steel', mode: Mode = 'deterministic'): Promise<any> {
    const res = await fetch(`${API_BASE}/channel/inject-fault?channel=${channel}&mode=${mode}`, { method: 'POST' });
    return res.json();
  },

  async investigate(channel: string = 'tears_of_steel', mode: Mode = 'deterministic'): Promise<InvestigateResponse> {
    const res = await fetch(`${API_BASE}/channel/investigate?channel=${channel}&mode=${mode}`);
    return res.json();
  },

  async verifyBackup(channel: string = 'tears_of_steel', mode: Mode = 'deterministic'): Promise<BackupVerifyResponse> {
    const res = await fetch(`${API_BASE}/channel/verify-backup?channel=${channel}&mode=${mode}`);
    return res.json();
  },

  async authorizeFailover(
    channel: string = 'tears_of_steel',
    authorizer: string = 'operator:mark',
    mode: Mode = 'deterministic'
  ): Promise<FailoverResponse> {
    const res = await fetch(
      `${API_BASE}/channel/authorize-failover?channel=${channel}&human_authorizer=${encodeURIComponent(
        authorizer
      )}&mode=${mode}`,
      { method: 'POST' }
    );
    return res.json();
  },

  async getBlindRefusal(channel: string = 'tears_of_steel', mode: Mode = 'deterministic'): Promise<any> {
    const res = await fetch(`${API_BASE}/channel/blind?channel=${channel}&mode=${mode}`);
    return res.json();
  },

  async runContention(
    authorizer: string = 'operator:mark',
    mode: Mode = 'deterministic'
  ): Promise<ContentionResponse> {
    const res = await fetch(
      `${API_BASE}/contention/run?human_authorizer=${encodeURIComponent(authorizer)}&mode=${mode}`,
      { method: 'POST' }
    );
    return res.json();
  },
};
