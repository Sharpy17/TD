const EMOJI = /\p{Extended_Pictographic}|\p{Regional_Indicator}|⃣/u;
const MAX_EMOJI_LENGTH = 32;

/** True for exactly one emoji, including skin tones, flags and joined sequences like 👩‍💻. */
export function isSingleEmoji(value: string): boolean {
  if (!value || value.length > MAX_EMOJI_LENGTH) return false;
  const graphemes = [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(value)];
  return graphemes.length === 1 && EMOJI.test(value);
}
