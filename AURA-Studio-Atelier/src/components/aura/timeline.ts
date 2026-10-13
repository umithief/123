import type { EditClip } from "./editor";
import type { CaptionCue } from "./captions";

export function trimmedClip(
  clip: EditClip,
  edge: "in" | "out",
  delta: number,
  duration: number,
): EditClip {
  const value = clip[edge] + delta;
  return {
    ...clip,
    [edge]:
      edge === "in"
        ? Math.max(0, Math.min(clip.out - 0.1, value))
        : Math.min(duration, Math.max(clip.in + 0.1, value)),
  };
}

// Caption timestamps refer to the source; display each retained occurrence in output time.
export function captionSegments(cues: CaptionCue[], clips: EditClip[], offset: number) {
  const segments: { id: string; cue: string; text: string; start: number; end: number }[] = [];
  let at = 0;
  for (const clip of clips) {
    for (const cue of cues) {
      const start = Math.max(clip.in, cue.start + offset),
        end = Math.min(clip.out, cue.end + offset);
      if (end > start)
        segments.push({
          id: `${clip.id}-${cue.id}`,
          cue: cue.id,
          text: cue.text,
          start: at + (start - clip.in) / clip.rate,
          end: at + (end - clip.in) / clip.rate,
        });
    }
    at += (clip.out - clip.in) / clip.rate;
  }
  return segments;
}
