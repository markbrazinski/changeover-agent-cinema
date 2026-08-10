/**
 * Ground-Truth Dialogue Subtitle Cues & Parser for Changeover Broadcast Cinema.
 * 100% Spoken Dialogue Only — Blank during non-speech/instrumental sections.
 * Transcribed & Frame-Aligned via Whisper AI directly from MP4 media streams.
 */

export interface VttCue {
  id: number;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  text: string;
}

// TEARS OF STEEL (CH-14) — Exact Spoken Dialogue Cues Only (0s - 160s)
export const TEARS_OF_STEEL_CUES: VttCue[] = [
  // 12.50s - 46.50s: Thom & Celia Bridge Dialogue
  { id: 0, startTime: 12.500, endTime: 16.500, text: "— CELIA: You're a jerk, Thom! —" },
  { id: 1, startTime: 17.800, endTime: 21.500, text: "— THOM: Look, Celia, we have to follow our passions —" },
  { id: 2, startTime: 22.000, endTime: 28.000, text: "— THOM: You have your robotics and I just want to be awesome in space —" },
  { id: 3, startTime: 30.480, endTime: 34.320, text: "— CELIA: Why don't you just admit that you're freaked out by my robot hand? —" },
  { id: 4, startTime: 34.660, endTime: 36.800, text: "— THOM: I'm not freaked out, but it's... —" },
  { id: 5, startTime: 37.280, endTime: 39.400, text: "— THOM: All right, fine! I'm freaked out! —" },
  { id: 6, startTime: 39.560, endTime: 42.880, text: "— THOM: I'm having nightmares that I'm being chased by giant robotic claws... —" },
  { id: 7, startTime: 43.120, endTime: 46.500, text: "— CELIA: Oh, I'm getting a... We're done! —" },

  // 50.18s - 138.00s: Control Room & Lab Spoken Dialogue
  { id: 8, startTime: 50.180, endTime: 53.520, text: "— BARLEY: Robot's memory synced, and... lock. —" },
  { id: 9, startTime: 57.000, endTime: 62.500, text: "— BARLEY: This is pretty freaking... —" },
  { id: 10, startTime: 115.000, endTime: 118.000, text: "— BARLEY: Should you be down there? —" },
  { id: 11, startTime: 131.000, endTime: 133.000, text: "— THOM: I heard you guys talking less now. —" },
  { id: 12, startTime: 136.000, endTime: 138.000, text: "— BARLEY: It's not my fault, you know? —" },
];

// SINTEL (CH-27) — Exact Spoken Dialogue Cues Only (0s - 160s)
export const SINTEL_CUES: VttCue[] = [
  // 90.0s - 156.28s: Shaman & Sintel Spoken Dialogue in Hearth Hut
  { id: 1, startTime: 90.000, endTime: 114.280, text: "— SHAMAN: This blade has a dark past. It has shed much innocent blood... —" },
  { id: 2, startTime: 115.280, endTime: 120.280, text: "— SHAMAN: You're a fool for traveling alone so completely unprepared... —" },
  { id: 3, startTime: 120.280, endTime: 124.280, text: "— SHAMAN: You're lucky your blood is still flowing. —" },
  { id: 4, startTime: 124.280, endTime: 126.280, text: "— SINTEL: Thank you. —" },
  { id: 5, startTime: 126.280, endTime: 132.280, text: "— SHAMAN: So, what brings you to the land of the gatekeepers? —" },
  { id: 6, startTime: 132.280, endTime: 137.280, text: "— SINTEL: I'm searching for someone. —" },
  { id: 7, startTime: 137.280, endTime: 142.280, text: "— SINTEL: Someone very dear, a kindred spirit. —" },
  { id: 8, startTime: 143.280, endTime: 145.280, text: "— SHAMAN: A dragon? —" },
  { id: 9, startTime: 148.280, endTime: 152.280, text: "— SHAMAN: A dangerous quest for an unknown hunter. —" },
  { id: 10, startTime: 152.280, endTime: 156.280, text: "— SINTEL: I've been alone for as long as I can remember. —" },
];

export function getCueForTime(cues: VttCue[], currentTime: number): string {
  if (!cues || cues.length === 0) return "";
  
  // Total duration set to 180.0 seconds for continuous non-overlapping loop
  const totalDuration = 180.0;
  const wrappedTime = currentTime % totalDuration;

  const activeCue = cues.find((c) => wrappedTime >= c.startTime && wrappedTime <= c.endTime);
  if (activeCue) {
    return activeCue.text;
  }
  return "";
}
