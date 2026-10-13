import {
  activeCaption,
  timedCaptionWords,
  CAPTION_FONTS,
  type CaptionCue,
  type CaptionOptions,
} from "./captions";

export function paintCaptions(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  reserve: number,
  cues: CaptionCue[],
  options: CaptionOptions,
  time: number,
  accent: string,
  reducedMotion = false,
  previewScale = 1,
) {
  if (!options.enabled) return;
  const cue = activeCaption(cues, time, options.offset);
  if (!cue) return;
  const at = time - options.offset;
  const animation = reducedMotion ? "none" : options.animation;
  accent = options.highlightColor === "theme" ? accent : options.highlightColor;
  const duration = Math.min(0.3 / options.speed, (cue.end - cue.start) * 0.35);
  const enter = Math.max(0, Math.min(1, (at - cue.start) / Math.max(0.01, duration)));
  const exit = Math.max(0, Math.min(1, (cue.end - at) / Math.max(0.01, duration)));
  const ease = 1 - Math.pow(1 - enter, 3);
  ctx.save();
  ctx.shadowBlur = 0;
  if (animation !== "none" && animation !== "typewriter")
    ctx.globalAlpha *= Math.min(1, enter * 3, exit * 3);
  if (animation === "fade") ctx.globalAlpha *= ease * exit;
  const size = Math.min(options.size, width * 0.068) * previewScale;
  const font = `${options.italic ? "italic " : ""}${options.weight} ${size}px ${CAPTION_FONTS[options.font].family}`;
  ctx.font = font;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  const maxWidth = width * 0.86;
  let tokens = timedCaptionWords(cue).map((word, sequence) => ({
    ...word,
    sequence,
    text: options.uppercase ? word.text.toLocaleUpperCase("tr") : word.text,
  }));
  if (animation === "focus") {
    const spoken = tokens.filter((word) => word.start <= at);
    tokens = [spoken[spoken.length - 1] ?? tokens[0]].filter(Boolean);
  }
  const space = ctx.measureText(" ").width;
  const lines: Array<
    Array<{ text: string; start: number; end: number; width: number; sequence: number }>
  > = [[]];
  let lineWidth = 0;
  for (const token of tokens) {
    // Extremely long edited words are split so mobile captions cannot overflow.
    const parts: string[] = [];
    let part = "";
    for (const char of token.text) {
      if (part && ctx.measureText(part + char).width > maxWidth) {
        parts.push(part);
        part = "";
      }
      part += char;
    }
    if (part) parts.push(part);
    let usedCharacters = 0;
    const characterCount = Math.max(1, Array.from(token.text).length);
    for (const text of parts) {
      const tokenWidth = ctx.measureText(text).width;
      if (lines[lines.length - 1].length && lineWidth + space + tokenWidth > maxWidth) {
        lines.push([]);
        lineWidth = 0;
      }
      const partStart = token.start + ((token.end - token.start) * usedCharacters) / characterCount;
      usedCharacters += Array.from(text).length;
      const partEnd = token.start + ((token.end - token.start) * usedCharacters) / characterCount;
      lines[lines.length - 1].push({
        text,
        width: tokenWidth,
        sequence: token.sequence,
        start: parts.length === 1 ? token.start : partStart,
        end: parts.length === 1 ? token.end : partEnd,
      });
      lineWidth += tokenWidth + space;
    }
  }
  // Long edited/SRT cues follow the spoken words instead of dropping all text
  // after the first three lines. Layout still stays inside the safe area.
  let activeLine = 0;
  for (let index = 0; index < lines.length; index++) {
    if (lines[index].some((word) => word.start <= at)) activeLine = index;
  }
  const firstLine = Math.max(0, Math.floor(activeLine / 3) * 3);
  const shown = lines.slice(firstLine, firstLine + 3),
    lineHeight = size * 1.4;
  const safeBottom = Math.max(height * 0.3, height - reserve - 26);
  const blockHeight = shown.length * lineHeight;
  const center =
    options.place === "top"
      ? Math.min(92, height * 0.14) + blockHeight / 2
      : options.place === "center"
        ? Math.min(height * 0.48, safeBottom - blockHeight / 2)
        : safeBottom - blockHeight / 2;
  ctx.translate(width / 2, center);
  if (animation === "pop") {
    const back = 1 + 2.7 * Math.pow(enter - 1, 3) + 1.7 * Math.pow(enter - 1, 2);
    const scale = 1 + (back - 1) * 0.3 * options.intensity;
    ctx.scale(scale, scale);
  }
  if (animation === "slide") ctx.translate(0, (1 - ease) * size * 0.8 * options.intensity);
  if (animation === "slide-left") ctx.translate(-(1 - ease) * size * 1.2 * options.intensity, 0);
  if (animation === "slide-right") ctx.translate((1 - ease) * size * 1.2 * options.intensity, 0);
  if (animation === "drop") ctx.translate(0, -(1 - ease) * size * options.intensity);
  if (animation === "zoom-out") {
    const scale = 1 + (1 - ease) * 0.15 * options.intensity;
    ctx.scale(scale, scale);
  }
  if (animation === "flip") ctx.scale(1, Math.max(0.05, Math.sin((enter * Math.PI) / 2)));
  if (animation === "swing")
    ctx.rotate(Math.sin(enter * Math.PI * 2) * (1 - enter) * 0.08 * options.intensity);
  if (animation === "pulse") {
    const scale = 1 + Math.sin((at - cue.start) * options.speed * 5) * 0.025 * options.intensity;
    ctx.scale(scale, scale);
  }
  if (animation === "elastic") {
    const spring = Math.sin(enter * Math.PI * 3) * (1 - enter) * options.intensity;
    ctx.scale(1 + spring * 0.16, 1 - spring * 0.12);
  }
  if (animation === "float")
    ctx.translate(
      Math.sin((at - cue.start) * options.speed * 1.8) * size * 0.08 * options.intensity,
      Math.sin((at - cue.start) * options.speed * 2.4) * size * 0.1 * options.intensity,
    );
  if (animation === "blur") ctx.filter = `blur(${(1 - ease) * size * 0.25 * options.intensity}px)`;
  ctx.translate(-width / 2, -center);
  if (animation === "wipe") {
    ctx.beginPath();
    ctx.rect(0, 0, width * ease, height);
    ctx.clip();
  }
  if (animation === "iris") {
    ctx.beginPath();
    ctx.rect((width * (1 - ease)) / 2, 0, width * ease, height);
    ctx.clip();
  }
  for (let index = 0; index < shown.length; index++) {
    const line = shown[index],
      total = line.reduce((n, w) => n + w.width, 0) + space * Math.max(0, line.length - 1);
    let x = (width - total) / 2;
    const y = center + (index - (shown.length - 1) / 2) * lineHeight;
    const background =
      options.background === "auto"
        ? options.style === "classic"
          ? "box"
          : "none"
        : options.background;
    if (background !== "none") {
      ctx.fillStyle = options.backgroundColor + (background === "marker" ? "e6" : "db");
      ctx.beginPath();
      ctx.roundRect(
        x - 10,
        y - lineHeight * (background === "marker" ? 0.05 : 0.5),
        total + 20,
        lineHeight * (background === "marker" ? 0.5 : 1),
        background === "pill" ? lineHeight / 2 : background === "marker" ? 2 : 8,
      );
      ctx.fill();
    }
    for (const word of line) {
      const progress = Math.max(
        0,
        Math.min(1, (at - word.start) / Math.max(0.01, word.end - word.start)),
      );
      const active = at >= word.start && at < word.end;
      let text = word.text;
      if (animation === "typewriter") {
        const chars = Array.from(text);
        text = chars.slice(0, at < word.start ? 0 : Math.ceil(chars.length * progress)).join("");
      }
      ctx.save();
      const wordEnter = Math.max(
        0,
        Math.min(
          1,
          (at - word.start) / Math.min(0.25 / options.speed, Math.max(0.01, word.end - word.start)),
        ),
      );
      if (animation === "orbit") {
        ctx.globalAlpha *= wordEnter;
        ctx.translate(
          Math.sin(((1 - wordEnter) * Math.PI) / 2) * size * 0.8 * options.intensity,
          -(1 - wordEnter) * size * 0.7 * options.intensity,
        );
        ctx.translate(x + word.width / 2, y);
        ctx.rotate(-(1 - wordEnter) * 0.18 * options.intensity);
        ctx.translate(-x - word.width / 2, -y);
      }
      if (animation === "word-flip" || (animation === "stamp" && active)) {
        ctx.translate(x + word.width / 2, y);
        if (animation === "word-flip") {
          ctx.globalAlpha *= wordEnter;
          ctx.scale(1, Math.max(0.03, Math.sin((wordEnter * Math.PI) / 2)));
        } else {
          const kick = (1 - wordEnter) * options.intensity;
          ctx.scale(1 + kick * 0.3, 1 + kick * 0.3);
          ctx.rotate(-kick * 0.07);
        }
        ctx.translate(-x - word.width / 2, -y);
      }
      if (animation === "word-rise" || animation === "stagger") {
        const phase =
          animation === "word-rise"
            ? wordEnter
            : Math.max(
                0,
                Math.min(
                  1,
                  (at -
                    cue.start -
                    word.sequence *
                      Math.min(
                        0.07 / options.speed,
                        ((cue.end - cue.start) * 0.2) / Math.max(1, tokens.length),
                      )) /
                    Math.max(0.01, duration),
                ),
              );
        ctx.globalAlpha *= phase;
        ctx.translate(0, (1 - phase) * size * 0.6 * options.intensity);
      }
      if (animation === "wave")
        ctx.translate(
          0,
          Math.sin((at - cue.start) * options.speed * 4 - word.sequence * 0.7) *
            size *
            0.12 *
            options.intensity,
        );
      if (animation === "shake" && active)
        ctx.translate(
          Math.sin((at - word.start) * options.speed * 45) * size * 0.07 * options.intensity,
          Math.cos((at - word.start) * options.speed * 37) * size * 0.035 * options.intensity,
        );
      if (animation === "focus") {
        const scale = 0.88 + 0.12 * (1 - Math.pow(1 - wordEnter, 3));
        ctx.globalAlpha *= wordEnter;
        ctx.translate(x + word.width / 2, y);
        ctx.scale(scale, scale);
        ctx.translate(-x - word.width / 2, -y);
      }
      if (animation === "bounce" && active) {
        const pulse = Math.sin(
          Math.PI *
            Math.min(
              1,
              (at - word.start) /
                Math.min(0.35 / options.speed, Math.max(0.01, word.end - word.start)),
            ),
        );
        ctx.translate(x + word.width / 2, y - pulse * size * 0.16 * options.intensity);
        ctx.scale(1 + pulse * 0.12 * options.intensity, 1 + pulse * 0.12 * options.intensity);
        ctx.translate(-x - word.width / 2, -y);
      }
      if (animation === "spotlight" && active) {
        ctx.fillStyle = "rgba(8,8,12,0.88)";
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x - 5, y - size * 0.64, word.width + 10, size * 1.28, size * 0.2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.lineWidth = (options.outline * size) / 30;
      ctx.strokeStyle = options.outlineColor;
      if (options.glow > 0) {
        ctx.shadowColor = accent;
        ctx.shadowBlur = size * options.glow * 0.8;
      } else if (options.shadow) {
        ctx.shadowColor = "#000000";
        ctx.shadowBlur = size * 0.18;
        ctx.shadowOffsetY = size * 0.08;
      }
      if (animation === "glitch" && active) {
        const split =
          (0.5 + 0.5 * Math.sin((at - word.start) * options.speed * 20)) *
          size *
          0.12 *
          options.intensity;
        ctx.fillStyle = "#59efff";
        ctx.fillText(text, x - split, y);
        ctx.fillStyle = "#ff4f9a";
        ctx.fillText(text, x + split, y);
      }
      ctx.lineJoin = "round";
      ctx.fillStyle =
        active &&
        (options.style === "karaoke" || animation === "bounce" || animation === "spotlight") &&
        animation !== "sweep"
          ? accent
          : options.textColor;
      if (animation === "tracking") {
        const characters = Array.from(text);
        const extra =
          Math.min(size * 0.12, size / Math.max(1, characters.length)) *
          (1 - ease) *
          options.intensity;
        let cursor = x - (extra * (characters.length - 1)) / 2;
        for (const character of characters) {
          if (options.outline > 0) ctx.strokeText(character, cursor, y);
          ctx.fillText(character, cursor, y);
          cursor += ctx.measureText(character).width + extra;
        }
      } else {
        if (options.outline > 0) ctx.strokeText(text, x, y);
        ctx.fillText(text, x, y);
      }
      if (animation === "shimmer") {
        ctx.save();
        const phase = ((at - cue.start) * options.speed * 0.45) % 1;
        const beam = x - word.width * 0.3 + phase * word.width * 1.6;
        const light = ctx.createLinearGradient(beam - size, y, beam + size, y);
        light.addColorStop(0, options.textColor);
        light.addColorStop(0.5, "#ffffff");
        light.addColorStop(1, options.textColor);
        ctx.fillStyle = light;
        ctx.globalAlpha *= options.intensity;
        ctx.fillText(text, x, y);
        ctx.restore();
      }
      if (animation === "underline" && progress > 0) {
        ctx.fillStyle = accent;
        ctx.fillRect(x, y + size * 0.58, word.width * progress, Math.max(2, size * 0.09));
      }
      if (animation === "sweep" && progress > 0) {
        ctx.beginPath();
        ctx.rect(x - 1, y - size, (word.width + 2) * progress, size * 2);
        ctx.clip();
        ctx.fillStyle = accent;
        ctx.fillText(text, x, y);
      }
      ctx.restore();
      x += word.width + space;
    }
  }
  ctx.restore();
}
