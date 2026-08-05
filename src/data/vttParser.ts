/**
 * Dialogue-Style Subtitle Cues & Parser for Changeover Broadcast Cinema.
 * Real dialogue timing with distinct spoken dialogue lines per film.
 * Note: Authored placeholder dialogue (films ship no subtitles). Real cue timing (~2s cadence).
 */

export interface VttCue {
  id: number;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  text: string;
}

// TEARS OF STEEL (CH-14) — Sci-Fi Emergency Action Dialogue
export const TEARS_OF_STEEL_CUES: VttCue[] = [
  { id: 1, startTime: 0.0, endTime: 3.5, text: "— We don't have much time, get to the platform —" },
  { id: 2, startTime: 3.5, endTime: 6.8, text: "— Did you hear that sound coming from the lower deck? —" },
  { id: 3, startTime: 6.8, endTime: 10.2, text: "— The primary power grid is losing stability! —" },
  { id: 4, startTime: 10.2, endTime: 13.8, text: "— Hold your position, wait for my signal before you —" },
  { id: 5, startTime: 13.8, endTime: 17.5, text: "— Get everyone out of here now! The core is —" }, // Cuts off mid-sentence on fault
  { id: 6, startTime: 17.5, endTime: 21.0, text: "— Emergency systems are failing to engage! —" },
  { id: 7, startTime: 21.0, endTime: 24.8, text: "— Reroute the backup relay through the secondary line! —" },
  { id: 8, startTime: 24.8, endTime: 28.5, text: "— Signal acquired, we're back online —" },
  { id: 9, startTime: 28.5, endTime: 32.0, text: "— All auxiliary telemetry restored to baseline —" },
  { id: 10, startTime: 32.0, endTime: 36.0, text: "— Stay on high alert, monitoring all active feeds —" },
];

// SINTEL (CH-27) — Fantasy Mountain Journey Dialogue
export const SINTEL_CUES: VttCue[] = [
  { id: 1, startTime: 0.0, endTime: 3.5, text: "— High in the mountains, the wind never stops —" },
  { id: 2, startTime: 3.5, endTime: 6.8, text: "— I've been searching for days through the snow —" },
  { id: 3, startTime: 6.8, endTime: 10.2, text: "— Look up at the ridge, something is moving in the mist —" },
  { id: 4, startTime: 10.2, endTime: 13.8, text: "— Stay quiet, don't make a sound until it passes —" },
  { id: 5, startTime: 13.8, endTime: 17.5, text: "— We've lost sight of the trail in this storm —" },
  { id: 6, startTime: 17.5, endTime: 21.0, text: "— The path ahead is completely ice-bound —" },
  { id: 7, startTime: 21.0, endTime: 24.8, text: "— We have to find shelter before nightfall —" },
  { id: 8, startTime: 24.8, endTime: 28.5, text: "— Keep moving forward, we cannot stop here —" },
];

export function getCueForTime(cues: VttCue[], currentTime: number): string {
  const activeCue = cues.find((c) => currentTime >= c.startTime && currentTime <= c.endTime);
  if (activeCue) {
    return activeCue.text;
  }
  // Interpolation fallback to last past cue
  const lastPastCue = cues.filter((c) => currentTime >= c.endTime).pop();
  if (lastPastCue) {
    return lastPastCue.text;
  }
  return cues[0]?.text || "— [dialogue] —";
}
