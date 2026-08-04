/**
 * VTT Caption Parser & Cue Types for Changeover.
 */

export interface VttCue {
  id: number;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  text: string;
}

// Built-in VTT cues parsed directly from films/tears_of_steel/captions.vtt
export const TEARS_OF_STEEL_CUES: VttCue[] = [
  { id: 1, startTime: 2.002, endTime: 4.004, text: "Program feed active. Accessibility layers nominal." },
  { id: 2, startTime: 4.504, endTime: 6.506, text: "Caption layer reporting in sync with the program clock." },
  { id: 3, startTime: 7.006, endTime: 9.008, text: "Feed-liveness monitor reporting frame delivery." },
  { id: 4, startTime: 9.508, endTime: 11.510, text: "All monitored layers holding steady." },
  { id: 5, startTime: 12.010, endTime: 14.012, text: "Program clock advancing normally." },
  { id: 6, startTime: 14.512, endTime: 16.514, text: "Caption cue cadence nominal." },
  { id: 7, startTime: 17.014, endTime: 19.016, text: "Continuity check passed." },
  { id: 8, startTime: 19.516, endTime: 21.518, text: "Primary feed stream health verified." },
  { id: 9, startTime: 22.018, endTime: 24.020, text: "Timecode sync aligned with master reference." },
  { id: 10, startTime: 24.520, endTime: 26.522, text: "Accessibility pipeline in sync." },
  { id: 11, startTime: 27.022, endTime: 29.024, text: "No anomaly detected across monitored layers." },
  { id: 12, startTime: 29.524, endTime: 31.526, text: "Program clock +0.510s baseline steady." },
  { id: 13, startTime: 32.026, endTime: 34.028, text: "Continuous playback nominal." },
  { id: 14, startTime: 34.528, endTime: 36.530, text: "Broadcast audio & video in sync." },
  { id: 15, startTime: 37.030, endTime: 39.032, text: "Master control monitoring active." },
];

export const SINTEL_CUES: VttCue[] = [
  { id: 1, startTime: 2.002, endTime: 4.004, text: "Sintel stream feed active. Secondary channel nominal." },
  { id: 2, startTime: 4.504, endTime: 6.506, text: "General entertainment tier stream in sync." },
  { id: 3, startTime: 7.006, endTime: 9.008, text: "Caption cue stream advancing normally." },
  { id: 4, startTime: 9.508, endTime: 11.510, text: "Sintel audio and video sync baseline nominal." },
  { id: 5, startTime: 12.010, endTime: 14.012, text: "Monitoring channel 27 general tier." },
  { id: 6, startTime: 14.512, endTime: 16.514, text: "Continuity check passed for Sintel feed." },
];

export function getCueForTime(cues: VttCue[], currentTime: number): string {
  const activeCue = cues.find((c) => currentTime >= c.startTime && currentTime <= c.endTime);
  if (activeCue) {
    return activeCue.text;
  }
  // Fallback interpolation if between cues
  const lastPastCue = cues.filter((c) => currentTime >= c.endTime).pop();
  if (lastPastCue) {
    return lastPastCue.text;
  }
  return cues[0]?.text || "— sample caption dialogue, in sync —";
}
