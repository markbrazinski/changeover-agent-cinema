/**
 * API Client for Changeover Hosted Judge Replay Mode.
 * Resolves all endpoints locally from deterministic trace fixtures without network calls.
 */

import { DETERMINISTIC_RESPONSES } from '../data/deterministicResponses';

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

const API_BASE_URL = 'http://localhost:8000';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, options);
    if (!res.ok) {
      console.warn(`[agentClient] API HTTP ${res.status} for ${endpoint}`);
      return null;
    }
    return await res.json();
  } catch (e) {
    console.warn(`[agentClient] Network fetch failed for ${endpoint}:`, e);
    return null;
  }
}

export const agentClient = {
  async getManifest(mode: Mode = 'deterministic'): Promise<VideoManifest> {
    if (mode === 'real') {
      const live = await fetchApi<VideoManifest>(`/video/manifest?mode=real`);
      if (live) return live;
    }
    return DETERMINISTIC_RESPONSES.getManifest;
  },

  async resetDemo(mode: Mode = 'deterministic'): Promise<any> {
    if (mode === 'real') {
      const live = await fetchApi<any>(`/demo/reset?mode=real`, { method: 'POST' });
      if (live) return live;
    }
    return DETERMINISTIC_RESPONSES.resetDemo;
  },

  async injectFault(channel: string = 'tears_of_steel', mode: Mode = 'deterministic'): Promise<any> {
    if (mode === 'real') {
      const live = await fetchApi<any>(`/channel/inject-fault?channel=${encodeURIComponent(channel)}&mode=real`, { method: 'POST' });
      if (live) return live;
    }
    return DETERMINISTIC_RESPONSES.injectFault(channel);
  },

  async investigate(channel: string = 'tears_of_steel', mode: Mode = 'deterministic'): Promise<InvestigateResponse> {
    if (mode === 'real') {
      const live = await fetchApi<InvestigateResponse>(`/channel/investigate?channel=${encodeURIComponent(channel)}&mode=real`);
      if (live) return live;
    }
    return DETERMINISTIC_RESPONSES.investigate(channel);
  },

  async verifyBackup(channel: string = 'tears_of_steel', mode: Mode = 'deterministic'): Promise<BackupVerifyResponse> {
    if (mode === 'real') {
      const live = await fetchApi<BackupVerifyResponse>(`/channel/verify-backup?channel=${encodeURIComponent(channel)}&mode=real`);
      if (live) return live;
    }
    return DETERMINISTIC_RESPONSES.verifyBackup(channel);
  },

  async authorizeFailover(
    channel: string = 'tears_of_steel',
    authorizer: string = 'operator:mark',
    mode: Mode = 'deterministic'
  ): Promise<FailoverResponse> {
    if (mode === 'real') {
      const live = await fetchApi<FailoverResponse>(
        `/channel/authorize-failover?channel=${encodeURIComponent(channel)}&human_authorizer=${encodeURIComponent(authorizer)}&mode=real`,
        { method: 'POST' }
      );
      if (live) return live;
    }
    return DETERMINISTIC_RESPONSES.authorizeFailover(channel, authorizer);
  },

  async getBlindRefusal(channel: string = 'tears_of_steel', mode: Mode = 'deterministic'): Promise<any> {
    if (mode === 'real') {
      const live = await fetchApi<any>(`/channel/blind?channel=${encodeURIComponent(channel)}&mode=real`);
      if (live) return live;
    }
    return DETERMINISTIC_RESPONSES.getBlindRefusal(channel);
  },

  async runContention(
    authorizer: string = 'operator:mark',
    mode: Mode = 'deterministic'
  ): Promise<ContentionResponse> {
    if (mode === 'real') {
      const live = await fetchApi<ContentionResponse>(
        `/contention/run?human_authorizer=${encodeURIComponent(authorizer)}&mode=real`,
        { method: 'POST' }
      );
      if (live) return live;
    }
    return DETERMINISTIC_RESPONSES.runContention(authorizer);
  },
};
