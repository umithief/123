// Frame timing and bitrate for MP4 export (kept apart from the recorder so it
// can be tested without a browser).
/**
 * The frame slot (seconds) a frame captured at `elapsed` belongs to. Frames
 * sit on an even 1/fps grid; a frame may be up to a quarter slot early, so a
 * screen refresh that comes a little before the slot still fills it.
 */
export function frameSlot(elapsed: number, fps: number): number {
  return Math.floor(elapsed * fps + 0.25) / fps;
}

/**
 * The H.264 bitrate: mediabunny's "very high" level for 30 fps, and 60 %
 * more for 60 fps so each frame keeps most of its detail.
 */
export function videoBitrate(width: number, height: number, fps: number): number {
  const veryHigh =
    3_000_000 * Math.pow((width * height) / (1920 * 1080), 0.95) * 0.3 * Math.exp(2.5538);
  return Math.ceil((veryHigh * (fps > 30 ? 1.6 : 1)) / 1000) * 1000;
}
