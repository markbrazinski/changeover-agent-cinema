/**
 * Client-side deterministic response fixtures for Changeover Hosted Judge Mode.
 * Freezes timestamps to recorded run time and eliminates backend network round-trips.
 */

export const RECORDED_RUN_TIMESTAMP = 1788388918;

export const DETERMINISTIC_RESPONSES = {
  getManifest: {
    channels: {
      tears_of_steel: {
        title: 'Tears of Steel',
        criticality_tier: 'emergency',
        tier_display: 'Emergency / public-information tier (operator-declared policy)',
        source_video: '/media/tos_source.mp4',
        backup_video: '/media/tos_backup.mp4',
        captions_vtt: '/media/captions_tos.vtt',
      },
      sintel: {
        title: 'Sintel',
        criticality_tier: 'general',
        tier_display: 'General entertainment tier',
        source_video: '/media/sintel_source.mp4',
        backup_video: '/media/sintel_backup.mp4',
        captions_vtt: '/media/captions_sintel.vtt',
      },
    },
    mode: 'deterministic' as const,
  },

  resetDemo: {
    status: 'reset',
    active_source: 'primary',
    caption_offset: 0.510,
    liveness_gap: 0.0,
    captions: 'nominal',
    mode: 'deterministic' as const,
  },

  injectFault: (channel: string = 'tears_of_steel') => ({
    channel,
    status: 'fault_injected',
    failed_layer: 'captions',
    caption_offset: 2.996,
    liveness_gap: 0.0,
    mode: 'deterministic' as const,
  }),

  investigate: (channel: string = 'tears_of_steel') => ({
    channel,
    status: 'investigated',
    failed_layer: 'captions',
    caption_offset: 2.996,
    liveness_gap: 0.0,
    mcp_status: 'fresh (recorded)',
    evidence_tier: 'fresh',
    query_trace: [
      {
        tool: 'RECORDED · grafana_mcp.query',
        args: { query: `caption_cue_sync_offset_seconds{channel="${channel}"}` },
        result_or_miss: [
          {
            metric: { __name__: 'caption_cue_sync_offset_seconds', channel },
            value: [RECORDED_RUN_TIMESTAMP, '2.996'],
          },
        ],
        latency_ms: 180.1,
        ts: RECORDED_RUN_TIMESTAMP,
      },
    ],
    rationale:
      'Recorded Gemini 2.5 Flash diagnosis: Caption cue-sync offset (+2.996s) exceeded derived ceiling (0.759s). Feed-liveness flat (0.000s) -> peer ruled out.',
    mode: 'deterministic' as const,
  }),

  verifyBackup: (channel: string = 'tears_of_steel') => ({
    channel,
    backup_path: `/media/${channel === 'tears_of_steel' ? 'tos' : 'sintel'}_backup.mp4`,
    is_healthy: true,
    details: {
      backup_path: `/media/${channel === 'tears_of_steel' ? 'tos' : 'sintel'}_backup.mp4`,
      has_video: true,
      stream_count: 2,
      duration_seconds: 180.0,
      format_name: 'mov,mp4,m4a,3gp,3g2,mj2',
      is_healthy: true,
    },
    mode: 'deterministic' as const,
  }),

  authorizeFailover: (channel: string = 'tears_of_steel', authorizer: string = 'operator:mark') => ({
    channel,
    status: 'restored',
    previous_source: 'primary',
    new_source: 'backup',
    human_authorizer: authorizer || 'operator:mark',
    post_swap_measured_offset: 0.486,
    restored: true,
    state: {
      channel,
      active_source: 'backup',
      last_action: 'failover_and_verify_restored',
      human_authorizer: authorizer || 'operator:mark',
      timestamp: RECORDED_RUN_TIMESTAMP + 8,
      restored: true,
    },
    mode: 'deterministic' as const,
  }),

  getBlindRefusal: (channel: string = 'tears_of_steel') => ({
    channel,
    status: 'refused_blind',
    failed_layer: null,
    reason: "Won't-guess: evidence gate rejected payload (Evidence absent or Grafana endpoint blind)",
    restored: false,
    mode: 'deterministic' as const,
  }),

  runContention: (authorizer: string = 'operator:mark') => ({
    timestamp: RECORDED_RUN_TIMESTAMP + 18,
    pool_id: 'shared_pool_1',
    demand: 2,
    capacity: 1,
    scarcity_is_real: true,
    priority_channel: 'tears_of_steel',
    degraded_channels: ['sintel'],
    reasoning:
      "Reconciled N=2 active incidents against M=1 shared backup capacity. Allocated backup to 'tears_of_steel' (operator tier: premium). Degraded and flagged 'sintel' (operator tier: standard).",
    human_authorizer: authorizer || 'operator:mark',
    status: 'authorized_and_executed',
    priority_execution: {
      status: 'executed',
      previous_source: 'primary',
      new_source: 'backup',
      human_authorizer: authorizer || 'operator:mark',
      state: {
        channel: 'tears_of_steel',
        active_source: 'backup',
        last_action: 'failover_and_verify_restored',
        human_authorizer: authorizer || 'operator:mark',
        timestamp: RECORDED_RUN_TIMESTAMP + 18,
        restored: true,
      },
      post_swap_measured_offset: 0.486,
      restored: true,
    },
    degraded_untouched_proof: true,
    mode: 'deterministic' as const,
  }),
};
